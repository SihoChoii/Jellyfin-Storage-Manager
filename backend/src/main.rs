mod config;
mod db;
mod jellyfin;
mod jobs;
mod metrics_collector;
mod paths;
mod pools;
mod scanner;
mod system;
mod user_settings;

use std::{
    env,
    net::{IpAddr, SocketAddr},
    path::{Path as StdPath, PathBuf},
    sync::Arc,
};
use tokio::fs;

use axum::{
    Json, Router,
    body::Body,
    extract::{Path, Query, State},
    http::{Method, Request, StatusCode, header, HeaderValue},
    response::{Html, IntoResponse},
    routing::{get, patch, post},
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use tokio::{
    signal,
    sync::{Mutex, RwLock, watch},
};
use tower::util::ServiceExt;
use tower_http::{
    cors::CorsLayer,
    services::{ServeDir, ServeFile},
};
use tracing::{error, info, warn};

use crate::{
    config::{Config, ConfigStore},
    db::DbPool,
    jellyfin::{JellyfinClient, JellyfinError, JellyfinOperationResponse},
    jobs::JobRecord,
    paths::{DirectoryEntry, PathsError},
    pools::PoolsResponse,
};

const LOCAL_CONFIG_PATH: &str = "config/app-config.json";
const LOCAL_DATABASE_PATH: &str = "data/jellymover.db";
const DOCKER_CONFIG_PATH: &str = "/config/app-config.json";
const DOCKER_DATABASE_PATH: &str = "/data/jellymover.db";
const JM_PORT_ENV: &str = "JM_PORT";
const JM_CONFIG_PATH_ENV: &str = "JM_CONFIG_PATH";
const JM_DB_PATH_ENV: &str = "JM_DB_PATH";
const JM_LOG_LEVEL_ENV: &str = "JM_LOG_LEVEL";
const JM_HOT_ROOT_ENV: &str = "JM_HOT_ROOT";
const JM_COLD_ROOT_ENV: &str = "JM_COLD_ROOT";
const DOCKER_FLAG_ENV: &str = "JELLYMOVER_IN_DOCKER";
const ALT_DOCKER_FLAG_ENV: &str = "RUNNING_IN_DOCKER";
const STATIC_DIR: &str = "/app/static";
const STATIC_INDEX_FILE: &str = "index.html";
const STATIC_PLACEHOLDER_HTML: &str = "<!DOCTYPE html><html><body><h1>Frontend bundle not found</h1>\
    <p>Build the frontend and copy it to /app/static to serve the UI.</p></body></html>";

#[derive(Clone)]
struct AppSettings {
    port: u16,
    config_path: PathBuf,
    db_path: PathBuf,
    log_level: String,
    seed_hot_root: Option<String>,
    seed_cold_root: Option<String>,
}

impl AppSettings {
    fn from_env() -> Self {
        let port = parse_port(trim_env(JM_PORT_ENV));
        let config_path = trim_env(JM_CONFIG_PATH_ENV)
            .map(PathBuf::from)
            .unwrap_or_else(default_config_path);
        let db_path = trim_env(JM_DB_PATH_ENV)
            .map(PathBuf::from)
            .unwrap_or_else(default_database_path);
        let log_level = trim_env(JM_LOG_LEVEL_ENV).unwrap_or_else(|| "info".into());
        let seed_hot_root = trim_env(JM_HOT_ROOT_ENV);
        let seed_cold_root = trim_env(JM_COLD_ROOT_ENV);

        Self {
            port,
            config_path,
            db_path,
            log_level,
            seed_hot_root,
            seed_cold_root,
        }
    }
}

fn init_logging(level: &str) {
    let fallback = level.to_string();
    let directive = env::var("RUST_LOG")
        .ok()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or(fallback);

    let env_filter = tracing_subscriber::EnvFilter::try_new(directive)
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));

    tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .with_target(false)
        .init();
}

#[derive(Clone)]
struct AppState {
    config: Arc<RwLock<Config>>,
    store: ConfigStore,
    db: DbPool,
    scan_status: Arc<RwLock<ScanStatus>>,
    system_monitor: Arc<Mutex<system::SystemMonitor>>,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    details: Option<String>,
}

#[derive(Deserialize)]
struct PathsQuery {
    root: Option<String>,
}

#[derive(Deserialize)]
struct MoveRequest {
    target: String,
}

#[derive(Deserialize)]
struct ShowsQuery {
    location: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
    search: Option<String>,
    sort_by: Option<String>,
    sort_dir: Option<String>,
}

#[derive(Deserialize)]
struct JobsQuery {
    limit: Option<u32>,
    offset: Option<u32>,
}

#[derive(Deserialize)]
struct HistoryQuery {
    duration: Option<String>,
}

#[derive(Serialize, FromRow)]
struct SystemMetricsHistoryPoint {
    timestamp: i64,
    cpu_percent: f32,
    memory_percent: f32,
    memory_used_bytes: i64,
    memory_total_bytes: i64,
}

#[derive(Serialize, FromRow)]
struct PoolUsageHistoryPoint {
    timestamp: i64,
    pool_type: String,
    total_bytes: i64,
    used_bytes: i64,
    free_bytes: i64,
}

#[derive(Serialize)]
struct JobAnalytics {
    total_jobs: i64,
    running_count: i64,
    queued_count: i64,
    completed_count: i64,
    failed_count: i64,
    total_bytes_moved: i64,
}

#[derive(Serialize, FromRow)]
struct ShowRecord {
    id: i64,
    title: Option<String>,
    path: String,
    location: Option<String>,
    size_bytes: Option<i64>,
    season_count: Option<i64>,
    episode_count: Option<i64>,
    thumbnail_path: Option<String>,
}

#[derive(Clone, Serialize)]
enum ScanState {
    Idle,
    Running,
}

#[derive(Clone, Serialize)]
struct ScanStatus {
    state: ScanState,
    last_started: Option<i64>,
    last_finished: Option<i64>,
    last_error: Option<String>,
}

impl Default for ScanStatus {
    fn default() -> Self {
        Self {
            state: ScanState::Idle,
            last_started: None,
            last_finished: None,
            last_error: None,
        }
    }
}

#[derive(Serialize)]
struct ScanTriggerResponse {
    status: &'static str,
}

/// Validates if an origin is allowed for CORS.
/// For TrueNAS SCALE deployments, allows:
/// - localhost/127.0.0.1 (development)
/// - Private IP addresses (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
/// Rejects public IPs and external domains for security.
fn is_origin_allowed(origin: &HeaderValue) -> bool {
    let origin_str = match origin.to_str() {
        Ok(s) => s,
        Err(_) => return false,
    };

    // Parse the origin URL
    let url = match url::Url::parse(origin_str) {
        Ok(u) => u,
        Err(_) => return false,
    };

    // Get the host from the URL
    let host = match url.host_str() {
        Some(h) => h,
        None => return false,
    };

    // Allow localhost
    if host == "localhost" || host == "127.0.0.1" || host == "::1" {
        return true;
    }

    // Try to parse as IP address
    if let Ok(ip) = host.parse::<IpAddr>() {
        return is_private_ip(&ip);
    }

    // For hostnames, we could do DNS resolution, but for simplicity
    // and to avoid blocking calls, we'll reject non-IP hostnames
    // unless they're localhost variants
    false
}

/// Checks if an IP address is private (RFC1918 ranges + link-local)
fn is_private_ip(ip: &IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => {
            let octets = ipv4.octets();
            // 10.0.0.0/8
            octets[0] == 10
                // 172.16.0.0/12
                || (octets[0] == 172 && (octets[1] >= 16 && octets[1] <= 31))
                // 192.168.0.0/16
                || (octets[0] == 192 && octets[1] == 168)
                // 169.254.0.0/16 (link-local)
                || (octets[0] == 169 && octets[1] == 254)
        }
        IpAddr::V6(ipv6) => {
            // IPv6 private ranges (fc00::/7, fe80::/10)
            let segments = ipv6.segments();
            (segments[0] & 0xfe00) == 0xfc00  // fc00::/7 (ULA)
                || (segments[0] & 0xffc0) == 0xfe80  // fe80::/10 (link-local)
        }
    }
}

#[tokio::main]
async fn main() {
    let settings = AppSettings::from_env();
    init_logging(&settings.log_level);

    let config_store = ConfigStore::new(settings.config_path.clone());
    let config_existed = config_store.path().exists();
    let mut initial_config = match config_store.load_or_init() {
        Ok(config) => {
            info!(
                path = %config_store.path().display(),
                "Configuration loaded"
            );
            config
        }
        Err(error) => {
            error!(?error, "Failed to initialize config file");
            std::process::exit(1);
        }
    };

    if !config_existed {
        let mut seeded_config = initial_config.clone();
        let mut updated = false;
        if let Some(hot) = settings.seed_hot_root.as_deref() {
            seeded_config.hot_root = hot.to_string();
            updated = true;
        }
        if let Some(cold) = settings.seed_cold_root.as_deref() {
            seeded_config.cold_root = cold.to_string();
            updated = true;
        }

        if updated {
            if let Err(err) = config_store.save(&seeded_config) {
                error!(?err, "Failed to seed configuration from environment");
                std::process::exit(1);
            }
            info!("Configuration seeded from environment defaults");
            initial_config = seeded_config;
        }
    }

    if let Err(err) = config::validate_config(&initial_config) {
        error!(error = %err, "Configuration validation failed at startup");
    }

    let db_pool = match crate::db::init_pool(&settings.db_path).await {
        Ok(pool) => pool,
        Err(error) => {
            error!(?error, "Failed to initialize database");
            std::process::exit(1);
        }
    };

    let state = AppState {
        config: Arc::new(RwLock::new(initial_config)),
        store: config_store,
        db: db_pool.clone(),
        scan_status: Arc::new(RwLock::new(ScanStatus::default())),
        system_monitor: Arc::new(Mutex::new(system::SystemMonitor::new())),
    };

    let (shutdown_tx, shutdown_rx) = watch::channel(false);
    let worker_handle =
        jobs::start_worker(state.db.clone(), state.config.clone(), shutdown_rx.clone());

    // Start metrics collector
    let _metrics_handle = metrics_collector::start_collector(
        state.db.clone(),
        state.config.clone(),
        state.system_monitor.clone(),
    );

    // CORS configuration for TrueNAS SCALE deployments
    // Allows private IPs and localhost, rejects public origins
    let cors = CorsLayer::new()
        .allow_origin(tower_http::cors::AllowOrigin::predicate(
            |origin: &HeaderValue, _request_parts| is_origin_allowed(origin),
        ))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/config", get(get_config).put(update_config))
        .route("/api/me/settings", get(get_user_settings_handler).patch(update_user_settings_handler))
        .route("/api/paths", get(list_paths))
        .route("/api/pools", get(get_pools))
        .route("/api/pools/history", get(get_pool_usage_history))
        .route("/api/stats", get(get_system_stats))
        .route("/api/stats/history", get(get_system_stats_history))
        .route("/api/scan", post(trigger_scan))
        .route("/api/scan/status", get(get_scan_status))
        .route("/api/jellyfin/rescan", post(trigger_jellyfin_rescan))
        .route("/api/jellyfin/status", get(get_jellyfin_status))
        .route("/api/shows", get(list_shows))
        .route("/api/shows/:id/thumbnail", get(get_show_thumbnail))
        .route("/api/shows/:id/move", post(create_move_job_handler))
        .route("/api/jobs", get(list_jobs_handler))
        .route("/api/jobs/:id", get(get_job_handler))
        .route("/api/jobs/analytics", get(get_job_analytics))
        .with_state(state)
        .layer(cors)
        .fallback(static_fallback);

    let addr = SocketAddr::from(([0, 0, 0, 0], settings.port));

    info!(port = settings.port, "Starting JellyMover backend...");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind TCP listener");

    let server =
        axum::serve(listener, app).with_graceful_shutdown(shutdown_signal(shutdown_tx.clone()));

    if let Err(error) = server.await {
        error!(?error, "server exited with error");
    }

    let _ = shutdown_tx.send(true);

    if let Err(error) = worker_handle.await {
        error!(?error, "Job worker task exited with error");
    }
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    db: &'static str,
}

async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    match sqlx::query_scalar::<_, i64>("SELECT 1")
        .fetch_one(&state.db)
        .await
    {
        Ok(_) => Json(HealthResponse {
            status: "ok",
            db: "ok",
        }),
        Err(err) => {
            error!(?err, "Health check database query failed");
            Json(HealthResponse {
                status: "degraded",
                db: "error",
            })
        }
    }
}

async fn get_config(State(state): State<AppState>) -> Json<Config> {
    let config = state.config.read().await.clone();
    Json(config)
}

async fn update_config(
    State(state): State<AppState>,
    Json(payload): Json<Config>,
) -> Result<Json<Config>, (StatusCode, Json<ErrorResponse>)> {
    if let Err(err) = config::validate_config(&payload) {
        return Err(error_response_with_details(
            StatusCode::BAD_REQUEST,
            "Validation failed",
            err.to_string(),
        ));
    }

    if let Err(err) = state.store.save(&payload) {
        error!(?err, "Failed to persist config to disk");
        return Err(error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Failed to persist config",
        ));
    }

    {
        let mut config_guard = state.config.write().await;
        *config_guard = payload.clone();
    }

    Ok(Json(payload))
}

async fn list_paths(
    Query(query): Query<PathsQuery>,
) -> Result<Json<Vec<DirectoryEntry>>, (StatusCode, Json<ErrorResponse>)> {
    let provided_root = query.root.as_deref().ok_or_else(|| {
        error_response(StatusCode::BAD_REQUEST, "root query parameter is required")
    })?;

    let root_path = match paths::validate_root(provided_root) {
        Ok(path) => path,
        Err(error) => return Err(paths_error_response(error)),
    };

    let directories = match paths::list_subdirectories(&root_path) {
        Ok(entries) => entries,
        Err(error) => return Err(paths_error_response(error)),
    };

    Ok(Json(directories))
}

async fn get_pools(State(state): State<AppState>) -> Json<PoolsResponse> {
    let config = state.config.read().await.clone();
    let hot = pools::collect_pool_usage(&config.hot_root);
    let cold = pools::collect_pool_usage(&config.cold_root);
    Json(PoolsResponse { hot, cold })
}

async fn get_system_stats(State(state): State<AppState>) -> Json<system::SystemStats> {
    let mut monitor = state.system_monitor.lock().await;
    let stats = monitor.get_stats();
    Json(stats)
}

async fn trigger_jellyfin_rescan(
    State(state): State<AppState>,
) -> Result<Json<JellyfinOperationResponse>, (StatusCode, Json<ErrorResponse>)> {
    let config = state.config.read().await.clone();
    let client = JellyfinClient::from_config(&config)
        .map_err(|_| error_response(StatusCode::BAD_REQUEST, "Jellyfin not configured"))?;

    match client.trigger_rescan().await {
        Ok(_) => Ok(Json(JellyfinOperationResponse { status: "ok" })),
        Err(JellyfinError::UnexpectedStatus(status))
            if status == StatusCode::UNAUTHORIZED || status == StatusCode::FORBIDDEN =>
        {
            Err(error_response(
                StatusCode::UNAUTHORIZED,
                "Invalid Jellyfin API key",
            ))
        }
        Err(error) => {
            error!(?error, "Failed to trigger Jellyfin rescan");
            Err(error_response(
                StatusCode::BAD_GATEWAY,
                "Failed to trigger Jellyfin rescan",
            ))
        }
    }
}

async fn trigger_scan(
    State(state): State<AppState>,
) -> Result<Json<ScanTriggerResponse>, (StatusCode, Json<ErrorResponse>)> {
    let config_snapshot = state.config.read().await.clone();
    if !config::config_is_ready(&config_snapshot) {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "Configuration incomplete. Please finish setup before scanning.",
        ));
    }

    match jobs::has_active_jobs(&state.db).await {
        Ok(true) => {
            return Err(error_response(
                StatusCode::CONFLICT,
                "Cannot run scan while move jobs are active.",
            ));
        }
        Ok(false) => {}
        Err(err) => {
            error!(?err, "Failed to check job activity before starting scan");
            return Err(error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to verify job activity state",
            ));
        }
    }

    {
        let status = state.scan_status.read().await;
        if matches!(status.state, ScanState::Running) {
            return Err(error_response(StatusCode::CONFLICT, "scan_already_running"));
        }
    }

    {
        let mut status = state.scan_status.write().await;
        status.state = ScanState::Running;
        status.last_started = Some(Utc::now().timestamp());
        status.last_error = None;
    }

    let scan_status = state.scan_status.clone();
    let db = state.db.clone();

    tokio::spawn(async move {
        let result = scanner::run_scan(config_snapshot, db).await;
        let mut status = scan_status.write().await;
        status.state = ScanState::Idle;
        status.last_finished = Some(Utc::now().timestamp());
        match result {
            Ok(summary) => {
                status.last_error = None;
                info!(
                    scanned = summary.scanned_libraries,
                    processed = summary.shows_processed,
                    inserted = summary.inserted,
                    updated = summary.updated,
                    "Filesystem scan finished"
                );
            }
            Err(err) => {
                status.last_error = Some(format!("{err:?}"));
                error!(?err, "Filesystem scan failed");
            }
        }
    });

    Ok(Json(ScanTriggerResponse { status: "started" }))
}

async fn get_scan_status(State(state): State<AppState>) -> Json<ScanStatus> {
    let status = state.scan_status.read().await.clone();
    Json(status)
}

fn running_in_docker() -> bool {
    env_bool(DOCKER_FLAG_ENV)
        .or_else(|| env_bool(ALT_DOCKER_FLAG_ENV))
        .unwrap_or_else(|| StdPath::new("/.dockerenv").exists())
}

fn env_bool(name: &str) -> Option<bool> {
    env::var(name).ok().map(|value| {
        matches!(
            value.trim().to_ascii_lowercase().as_str(),
            "1" | "true" | "yes" | "on"
        )
    })
}

fn trim_env(name: &str) -> Option<String> {
    env::var(name)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn parse_port(port: Option<String>) -> u16 {
    port.and_then(|value| value.parse().ok()).unwrap_or(3000)
}

fn default_config_path() -> PathBuf {
    if running_in_docker() {
        PathBuf::from(DOCKER_CONFIG_PATH)
    } else {
        PathBuf::from(LOCAL_CONFIG_PATH)
    }
}

fn default_database_path() -> PathBuf {
    if running_in_docker() {
        PathBuf::from(DOCKER_DATABASE_PATH)
    } else {
        PathBuf::from(LOCAL_DATABASE_PATH)
    }
}

async fn static_fallback(req: Request<Body>) -> impl IntoResponse {
    if req.uri().path().starts_with("/api/") {
        return error_response(StatusCode::NOT_FOUND, "Not Found").into_response();
    }

    let index_path = StdPath::new(STATIC_DIR).join(STATIC_INDEX_FILE);
    let service = ServeDir::new(STATIC_DIR)
        .append_index_html_on_directories(true)
        .not_found_service(ServeFile::new(index_path));

    match service.oneshot(req).await {
        Ok(response) => response.map(Body::new),
        Err(error) => {
            warn!(
                ?error,
                "Static file serving failed; frontend bundle missing?"
            );
            (StatusCode::OK, Html(STATIC_PLACEHOLDER_HTML.to_string())).into_response()
        }
    }
}

async fn list_shows(
    State(state): State<AppState>,
    Query(query): Query<ShowsQuery>,
) -> Result<Json<Vec<ShowRecord>>, (StatusCode, Json<ErrorResponse>)> {
    let location = query
        .location
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|value| value.to_string());

    let search = query
        .search
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty() && value.len() <= 100)
        .map(|value| value.to_string());

    let limit = query.limit.unwrap_or(50).min(500) as i64;
    let offset = query.offset.unwrap_or(0) as i64;

    // Validate and map sort_by parameter to actual column names
    let sort_column = match query.sort_by.as_deref() {
        Some("title") => "title COLLATE NOCASE",
        Some("size") => "size_bytes",
        Some("date") => "last_scan",
        Some("seasons") => "season_count",
        Some("episodes") => "episode_count",
        _ => "title COLLATE NOCASE", // default
    };

    // Validate sort direction
    let sort_direction = match query.sort_dir.as_deref() {
        Some("desc") | Some("DESC") => "DESC",
        _ => "ASC", // default
    };

    // Build dynamic SQL query
    let mut sql = String::from(
        "SELECT id, title, path, location, size_bytes, season_count, episode_count, thumbnail_path FROM shows"
    );

    let mut where_clauses = Vec::new();

    // Add location filter if provided
    if location.is_some() {
        where_clauses.push("lower(location) = lower(?)".to_string());
    }

    // Add search filter if provided
    if search.is_some() {
        where_clauses.push("(title LIKE ? OR path LIKE ?)".to_string());
    }

    if !where_clauses.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&where_clauses.join(" AND "));
    }

    // Add ORDER BY clause
    sql.push_str(&format!(" ORDER BY {} {}", sort_column, sort_direction));

    // Add LIMIT and OFFSET
    sql.push_str(" LIMIT ? OFFSET ?");

    // Prepare search pattern outside the match to extend its lifetime
    let search_pattern = search.as_ref().map(|term| format!("%{}%", term));

    // Build and execute query with proper parameter binding
    let mut db_query = sqlx::query_as::<_, ShowRecord>(&sql);

    if let Some(loc) = location {
        db_query = db_query.bind(loc);
    }

    if let Some(pattern) = &search_pattern {
        db_query = db_query.bind(pattern);
        db_query = db_query.bind(pattern);
    }

    db_query = db_query.bind(limit).bind(offset);

    let rows = db_query.fetch_all(&state.db).await;

    match rows {
        Ok(rows) => Ok(Json(rows)),
        Err(err) => {
            error!(?err, "Failed to fetch shows");
            Err(error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to fetch shows",
            ))
        }
    }
}

async fn get_show_thumbnail(
    State(state): State<AppState>,
    Path(show_id): Path<i64>,
) -> Result<impl IntoResponse, (StatusCode, Json<ErrorResponse>)> {
    // Query the database for the thumbnail path
    let row: Option<(Option<String>,)> = sqlx::query_as(
        "SELECT thumbnail_path FROM shows WHERE id = ?"
    )
    .bind(show_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|err| {
        error!(?err, show_id, "Failed to query thumbnail path");
        error_response(StatusCode::INTERNAL_SERVER_ERROR, "Database error")
    })?;

    let thumbnail_path = match row.and_then(|(path,)| path) {
        Some(path) => path,
        None => return Err(error_response(StatusCode::NOT_FOUND, "Thumbnail not found")),
    };

    // Validate the path is within allowed directories (security)
    let config = state.config.read().await;
    let path_buf = PathBuf::from(&thumbnail_path);

    let is_allowed = path_buf.starts_with(&config.hot_root)
        || path_buf.starts_with(&config.cold_root)
        || config.library_paths.iter().any(|lib_path| path_buf.starts_with(lib_path));

    if !is_allowed {
        warn!(path = %thumbnail_path, "Attempted access to thumbnail outside allowed directories");
        return Err(error_response(StatusCode::FORBIDDEN, "Access denied"));
    }

    // Check if file exists
    if !path_buf.exists() {
        return Err(error_response(StatusCode::NOT_FOUND, "Thumbnail file not found"));
    }

    // Read the file
    let image_bytes = fs::read(&path_buf).await.map_err(|err| {
        error!(?err, path = %thumbnail_path, "Failed to read thumbnail file");
        error_response(StatusCode::INTERNAL_SERVER_ERROR, "Failed to read thumbnail")
    })?;

    // Determine content-type from file extension
    let content_type = path_buf
        .extension()
        .and_then(|ext| ext.to_str())
        .and_then(|ext| match ext.to_lowercase().as_str() {
            "jpg" | "jpeg" => Some("image/jpeg"),
            "png" => Some("image/png"),
            "gif" => Some("image/gif"),
            "webp" => Some("image/webp"),
            _ => Some("image/jpeg"), // default to jpeg
        })
        .unwrap_or("image/jpeg");

    // Return the image with appropriate headers
    Ok((
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, content_type),
            (header::CACHE_CONTROL, "public, max-age=3600"),
        ],
        image_bytes,
    ))
}

async fn create_move_job_handler(
    State(state): State<AppState>,
    Path(show_id): Path<i64>,
    Json(payload): Json<MoveRequest>,
) -> Result<Json<JobRecord>, (StatusCode, Json<ErrorResponse>)> {
    {
        let status = state.scan_status.read().await;
        if matches!(status.state, ScanState::Running) {
            return Err(error_response(
                StatusCode::CONFLICT,
                "Cannot create move jobs while a scan is running.",
            ));
        }
    }

    let config_snapshot = state.config.read().await.clone();
    if !config::config_is_ready(&config_snapshot) {
        return Err(error_response(
            StatusCode::BAD_REQUEST,
            "Configuration incomplete. Please finish setup before moving shows.",
        ));
    }

    match jobs::create_move_job(&state.db, &config_snapshot, show_id, &payload.target).await {
        Ok(job) => Ok(Json(job)),
        Err(error) => Err(job_error_response(error)),
    }
}

async fn list_jobs_handler(
    State(state): State<AppState>,
    Query(query): Query<JobsQuery>,
) -> Result<Json<Vec<JobRecord>>, (StatusCode, Json<ErrorResponse>)> {
    let limit = query.limit.unwrap_or(50).min(500) as i64;
    let offset = query.offset.unwrap_or(0) as i64;

    match jobs::list_jobs(&state.db, limit, offset).await {
        Ok(records) => Ok(Json(records)),
        Err(err) => {
            error!(?err, "Failed to list jobs");
            Err(error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to list jobs",
            ))
        }
    }
}

async fn get_job_handler(
    State(state): State<AppState>,
    Path(job_id): Path<i64>,
) -> Result<Json<JobRecord>, (StatusCode, Json<ErrorResponse>)> {
    match jobs::get_job(&state.db, job_id).await {
        Ok(Some(job)) => Ok(Json(job)),
        Ok(None) => Err(error_response(StatusCode::NOT_FOUND, "Job not found")),
        Err(err) => {
            error!(?err, job_id, "Failed to fetch job");
            Err(error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to fetch job",
            ))
        }
    }
}

async fn get_system_stats_history(
    State(state): State<AppState>,
    Query(query): Query<HistoryQuery>,
) -> Result<Json<Vec<SystemMetricsHistoryPoint>>, (StatusCode, Json<ErrorResponse>)> {
    let seconds_ago = parse_duration(&query.duration);
    let cutoff_timestamp = Utc::now().timestamp() - seconds_ago;

    let rows = sqlx::query_as::<_, SystemMetricsHistoryPoint>(
        r#"
        SELECT timestamp, cpu_percent, memory_percent, memory_used_bytes, memory_total_bytes
        FROM system_metrics_history
        WHERE timestamp >= ?
        ORDER BY timestamp ASC
        "#,
    )
    .bind(cutoff_timestamp)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(data) => Ok(Json(data)),
        Err(err) => {
            error!(?err, "Failed to fetch system metrics history");
            Err(error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to fetch metrics history",
            ))
        }
    }
}

async fn get_pool_usage_history(
    State(state): State<AppState>,
    Query(query): Query<HistoryQuery>,
) -> Result<Json<Vec<PoolUsageHistoryPoint>>, (StatusCode, Json<ErrorResponse>)> {
    let seconds_ago = parse_duration(&query.duration);
    let cutoff_timestamp = Utc::now().timestamp() - seconds_ago;

    let rows = sqlx::query_as::<_, PoolUsageHistoryPoint>(
        r#"
        SELECT timestamp, pool_type, total_bytes, used_bytes, free_bytes
        FROM pool_usage_history
        WHERE timestamp >= ?
        ORDER BY pool_type, timestamp ASC
        "#,
    )
    .bind(cutoff_timestamp)
    .fetch_all(&state.db)
    .await;

    match rows {
        Ok(data) => Ok(Json(data)),
        Err(err) => {
            error!(?err, "Failed to fetch pool usage history");
            Err(error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to fetch pool usage history",
            ))
        }
    }
}

async fn get_job_analytics(
    State(state): State<AppState>,
) -> Result<Json<JobAnalytics>, (StatusCode, Json<ErrorResponse>)> {
    // Get job counts by status
    let counts = sqlx::query_as::<_, (String, i64)>(
        r#"
        SELECT status, COUNT(*) as count
        FROM jobs
        GROUP BY status
        "#,
    )
    .fetch_all(&state.db)
    .await;

    // Calculate total bytes moved from completed jobs
    let total_bytes: Option<i64> = sqlx::query_scalar(
        r#"
        SELECT COALESCE(SUM(total_bytes), 0)
        FROM jobs
        WHERE status = 'success'
        "#,
    )
    .fetch_one(&state.db)
    .await
    .unwrap_or(Some(0));

    match counts {
        Ok(status_counts) => {
            let mut analytics = JobAnalytics {
                total_jobs: 0,
                running_count: 0,
                queued_count: 0,
                completed_count: 0,
                failed_count: 0,
                total_bytes_moved: total_bytes.unwrap_or(0),
            };

            for (status, count) in status_counts {
                analytics.total_jobs += count;
                match status.as_str() {
                    "running" => analytics.running_count = count,
                    "queued" => analytics.queued_count = count,
                    "success" => analytics.completed_count = count,
                    "failed" => analytics.failed_count = count,
                    _ => {}
                }
            }

            Ok(Json(analytics))
        }
        Err(err) => {
            error!(?err, "Failed to fetch job analytics");
            Err(error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to fetch job analytics",
            ))
        }
    }
}

fn parse_duration(duration: &Option<String>) -> i64 {
    match duration.as_deref() {
        Some("1h") => 3600,
        Some("6h") => 6 * 3600,
        Some("24h") => 24 * 3600,
        Some("7d") => 7 * 24 * 3600,
        Some("30d") => 30 * 24 * 3600,
        _ => 3600, // Default to 1 hour
    }
}

// User settings handlers
async fn get_user_settings_handler(
    State(state): State<AppState>,
) -> Result<Json<user_settings::UserSettings>, (StatusCode, Json<ErrorResponse>)> {
    match user_settings::get_settings(&state.db).await {
        Ok(settings) => Ok(Json(settings)),
        Err(err) => {
            error!(?err, "Failed to get user settings");
            Err(error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to get user settings",
            ))
        }
    }
}

async fn update_user_settings_handler(
    State(state): State<AppState>,
    Json(payload): Json<user_settings::UserSettings>,
) -> Result<Json<user_settings::UserSettings>, (StatusCode, Json<ErrorResponse>)> {
    // Validate theme
    if !user_settings::is_valid_theme(&payload.theme) {
        return Err(error_response_with_details(
            StatusCode::BAD_REQUEST,
            "Invalid theme",
            format!(
                "Theme '{}' is not valid. Valid themes: jelly, light, dark",
                payload.theme
            ),
        ));
    }

    match user_settings::update_settings(&state.db, &payload).await {
        Ok(_) => Ok(Json(payload)),
        Err(err) => {
            error!(?err, "Failed to update user settings");
            Err(error_response(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to update user settings",
            ))
        }
    }
}

async fn shutdown_signal(shutdown_tx: watch::Sender<bool>) {
    match signal::ctrl_c().await {
        Ok(()) => info!("Shutdown signal received"),
        Err(err) => {
            error!(?err, "Failed to listen for shutdown signal");
        }
    }
    let _ = shutdown_tx.send(true);
}

fn error_response(
    status: StatusCode,
    message: impl Into<String>,
) -> (StatusCode, Json<ErrorResponse>) {
    (
        status,
        Json(ErrorResponse {
            error: message.into(),
            details: None,
        }),
    )
}

fn error_response_with_details(
    status: StatusCode,
    message: impl Into<String>,
    details: impl Into<String>,
) -> (StatusCode, Json<ErrorResponse>) {
    (
        status,
        Json(ErrorResponse {
            error: message.into(),
            details: Some(details.into()),
        }),
    )
}

fn paths_error_response(error: PathsError) -> (StatusCode, Json<ErrorResponse>) {
    match error {
        PathsError::MissingRoot => {
            error_response(StatusCode::BAD_REQUEST, "root query parameter is required")
        }
        PathsError::NotFound(path) => error_response(
            StatusCode::BAD_REQUEST,
            format!("Root path '{}' not found", path.display()),
        ),
        PathsError::NotDirectory(path) => error_response(
            StatusCode::BAD_REQUEST,
            format!("Root path '{}' is not a directory", path.display()),
        ),
        PathsError::NotReadable(path, _) => error_response(
            StatusCode::BAD_REQUEST,
            format!("Root path '{}' is not readable", path.display()),
        ),
        PathsError::Enumerate(path, _) | PathsError::Stat(path, _) => error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to inspect '{}'", path.display()),
        ),
    }
}

fn job_error_response(error: jobs::JobError) -> (StatusCode, Json<ErrorResponse>) {
    match error {
        jobs::JobError::ShowNotFound => error_response(StatusCode::NOT_FOUND, "Show not found"),
        jobs::JobError::InvalidTarget => {
            error_response(StatusCode::BAD_REQUEST, "target must be 'hot' or 'cold'")
        }
        jobs::JobError::AlreadyInLocation => {
            error_response(StatusCode::BAD_REQUEST, "Show already in requested pool")
        }
        jobs::JobError::MissingRoot(root) => error_response(
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Missing configuration for {root}"),
        ),
        jobs::JobError::PathMismatch => error_response(
            StatusCode::BAD_REQUEST,
            "Show path is not within configured pools",
        ),
        jobs::JobError::Database(err) => {
            error!(?err, "Database error while processing job request");
            error_response(StatusCode::INTERNAL_SERVER_ERROR, "Database error")
        }
        jobs::JobError::Io(err) => {
            error!(?err, "Filesystem error while processing job request");
            error_response(StatusCode::INTERNAL_SERVER_ERROR, "Filesystem error")
        }
    }
}
async fn get_jellyfin_status(
    State(state): State<AppState>,
) -> Result<Json<jellyfin::JellyfinStatus>, (StatusCode, Json<ErrorResponse>)> {
    let config = state.config.read().await.clone();

    match jellyfin::check_status(&config).await {
        Ok(status) if !status.configured => Err(error_response(
            StatusCode::BAD_REQUEST,
            "Jellyfin not configured",
        )),
        Ok(status) if !status.server_reachable => Err(error_response(
            StatusCode::BAD_GATEWAY,
            status
                .message
                .clone()
                .unwrap_or_else(|| "Jellyfin server not reachable".into()),
        )),
        Ok(status) if !status.auth_ok => Err(error_response(
            StatusCode::UNAUTHORIZED,
            status
                .message
                .clone()
                .unwrap_or_else(|| "Jellyfin authentication failed".into()),
        )),
        Ok(status) => Ok(Json(status)),
        Err(JellyfinError::NotConfigured) => Err(error_response(
            StatusCode::BAD_REQUEST,
            "Jellyfin not configured",
        )),
        Err(error) => {
            error!(?error, "Failed to check Jellyfin status");
            Err(error_response(
                StatusCode::BAD_GATEWAY,
                "Failed to contact Jellyfin",
            ))
        }
    }
}
