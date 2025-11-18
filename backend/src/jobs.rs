use crate::{config::Config, db::DbPool};
use chrono::Utc;
use serde::Serialize;
use sqlx::FromRow;
use std::{
    io,
    path::{Path, PathBuf},
    sync::Arc,
    time::Instant,
};
use tokio::{
    fs,
    sync::{RwLock, watch},
    task::JoinHandle,
    time::{Duration, sleep},
};
use tracing::{error, info, warn};
use walkdir::WalkDir;

const STATUS_QUEUED: &str = "queued";
const STATUS_RUNNING: &str = "running";
const STATUS_SUCCESS: &str = "success";
const STATUS_FAILED: &str = "failed";

#[derive(Debug, Serialize, FromRow, Clone)]
pub struct JobRecord {
    pub id: i64,
    pub show_id: i64,
    pub source_path: String,
    pub destination_path: String,
    pub status: String,
    pub progress_bytes: Option<i64>,
    pub total_bytes: Option<i64>,
    pub speed_bytes_per_sec: Option<i64>,
    pub eta_seconds: Option<i64>,
    pub error_message: Option<String>,
    pub created_at: Option<i64>,
    pub updated_at: Option<i64>,
}

#[derive(Debug)]
pub enum JobError {
    ShowNotFound,
    InvalidTarget,
    AlreadyInLocation,
    MissingRoot(&'static str),
    PathMismatch,
    Database(sqlx::Error),
    Io(std::io::Error),
}

impl From<sqlx::Error> for JobError {
    fn from(value: sqlx::Error) -> Self {
        JobError::Database(value)
    }
}

impl From<std::io::Error> for JobError {
    fn from(value: std::io::Error) -> Self {
        JobError::Io(value)
    }
}

#[derive(Debug, FromRow)]
struct ShowRow {
    id: i64,
    path: String,
    size_bytes: Option<i64>,
}

#[derive(Debug, FromRow, Clone)]
struct JobRow {
    id: i64,
    show_id: i64,
    source_path: String,
    destination_path: String,
    status: String,
    progress_bytes: Option<i64>,
    total_bytes: Option<i64>,
    speed_bytes_per_sec: Option<i64>,
    eta_seconds: Option<i64>,
    error_message: Option<String>,
    created_at: Option<i64>,
    updated_at: Option<i64>,
}

impl From<JobRow> for JobRecord {
    fn from(value: JobRow) -> Self {
        JobRecord {
            id: value.id,
            show_id: value.show_id,
            source_path: value.source_path,
            destination_path: value.destination_path,
            status: value.status,
            progress_bytes: value.progress_bytes,
            total_bytes: value.total_bytes,
            speed_bytes_per_sec: value.speed_bytes_per_sec,
            eta_seconds: value.eta_seconds,
            error_message: value.error_message,
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

pub async fn create_move_job(
    db: &DbPool,
    config: &Config,
    show_id: i64,
    target: &str,
) -> Result<JobRecord, JobError> {
    let normalized_target = normalize_target(target).ok_or(JobError::InvalidTarget)?;
    let show = sqlx::query_as::<_, ShowRow>(
        r#"
        SELECT id, path, size_bytes
        FROM shows
        WHERE id = ?
        "#,
    )
    .bind(show_id)
    .fetch_optional(db)
    .await?
    .ok_or(JobError::ShowNotFound)?;

    let hot_root = trimmed_root(&config.hot_root).ok_or(JobError::MissingRoot("hot_root"))?;
    let cold_root = trimmed_root(&config.cold_root).ok_or(JobError::MissingRoot("cold_root"))?;

    let show_path = PathBuf::from(&show.path);
    let (current_location, current_root) = detect_location(&show_path, &hot_root, &cold_root)?;

    if current_location == normalized_target {
        return Err(JobError::AlreadyInLocation);
    }

    let destination_root = if normalized_target == "hot" {
        &hot_root
    } else {
        &cold_root
    };

    let relative = show_path
        .strip_prefix(current_root)
        .map_err(|_| JobError::PathMismatch)?;
    let destination_path = destination_root.join(relative);

    let total_bytes = show.size_bytes.unwrap_or(0).max(0);
    let now = Utc::now().timestamp();

    let source_path_str = show.path.clone();
    sqlx::query(
        r#"
        INSERT INTO jobs (
            show_id,
            source_path,
            destination_path,
            status,
            progress_bytes,
            total_bytes,
            speed_bytes_per_sec,
            eta_seconds,
            error_message,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(show.id)
    .bind(&source_path_str)
    .bind(destination_path.to_string_lossy().to_string())
    .bind(STATUS_QUEUED)
    .bind(0_i64)
    .bind(total_bytes)
    .bind(0_i64)
    .bind(0_i64)
    .bind::<Option<String>>(None)
    .bind(now)
    .bind(now)
    .execute(db)
    .await?;

    let job_id: i64 = sqlx::query_scalar("SELECT last_insert_rowid()")
        .fetch_one(db)
        .await?;

    info!(
        job_id,
        show_id = show.id,
        source = %source_path_str,
        destination = %destination_path.display(),
        target = normalized_target,
        "Queued move job"
    );

    get_job(db, job_id)
        .await?
        .ok_or(JobError::Database(sqlx::Error::RowNotFound))
}

pub async fn list_jobs(
    db: &DbPool,
    limit: i64,
    offset: i64,
) -> Result<Vec<JobRecord>, sqlx::Error> {
    sqlx::query_as::<_, JobRecord>(
        r#"
        SELECT
            id,
            show_id,
            source_path,
            destination_path,
            status,
            progress_bytes,
            total_bytes,
            speed_bytes_per_sec,
            eta_seconds,
            error_message,
            created_at,
            updated_at
        FROM jobs
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
        "#,
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(db)
    .await
}

pub async fn get_job(db: &DbPool, id: i64) -> Result<Option<JobRecord>, sqlx::Error> {
    sqlx::query_as::<_, JobRecord>(
        r#"
        SELECT
            id,
            show_id,
            source_path,
            destination_path,
            status,
            progress_bytes,
            total_bytes,
            speed_bytes_per_sec,
            eta_seconds,
            error_message,
            created_at,
            updated_at
        FROM jobs
        WHERE id = ?
        "#,
    )
    .bind(id)
    .fetch_optional(db)
    .await
}

pub async fn has_active_jobs(db: &DbPool) -> Result<bool, sqlx::Error> {
    let count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM jobs
        WHERE status IN (?, ?)
        "#,
    )
    .bind(STATUS_QUEUED)
    .bind(STATUS_RUNNING)
    .fetch_one(db)
    .await?;
    Ok(count > 0)
}

pub fn start_worker(
    db: DbPool,
    config: Arc<RwLock<Config>>,
    mut shutdown: watch::Receiver<bool>,
) -> JoinHandle<()> {
    tokio::spawn(async move {
        loop {
            if *shutdown.borrow() {
                info!("Shutdown requested; exiting job worker loop");
                break;
            }

            match fetch_next_job(&db).await {
                Ok(Some(job)) => {
                    let config_snapshot = config.read().await.clone();
                    if let Err(err) = execute_job(job.clone(), &db, &config_snapshot).await {
                        error!(?err, job_id = job.id, "Move job failed");
                        if let Err(update_err) = finalize_job_status(
                            &db,
                            job.id,
                            STATUS_FAILED,
                            Some(format!("{err:?}")),
                            None,
                        )
                        .await
                        {
                            error!(?update_err, job_id = job.id, "Failed to mark job as failed");
                        }
                    }
                    if wait_for_shutdown(Duration::from_millis(200), &mut shutdown).await {
                        info!("Shutdown requested; stopping job worker");
                        break;
                    }
                }
                Ok(None) => {
                    if wait_for_shutdown(Duration::from_secs(2), &mut shutdown).await {
                        info!("Shutdown requested; stopping job worker");
                        break;
                    }
                }
                Err(err) => {
                    error!(?err, "Job worker failed to fetch job");
                    if wait_for_shutdown(Duration::from_secs(5), &mut shutdown).await {
                        info!("Shutdown requested after fetch failure; stopping job worker");
                        break;
                    }
                }
            }
        }
        info!("Job worker exited");
    })
}

async fn wait_for_shutdown(duration: Duration, shutdown: &mut watch::Receiver<bool>) -> bool {
    tokio::select! {
        _ = sleep(duration) => false,
        changed = shutdown.changed() => {
            match changed {
                Ok(_) => *shutdown.borrow(),
                Err(_) => true,
            }
        }
    }
}

async fn fetch_next_job(db: &DbPool) -> Result<Option<JobRow>, sqlx::Error> {
    let job = sqlx::query_as::<_, JobRow>(
        r#"
        SELECT
            id,
            show_id,
            source_path,
            destination_path,
            status,
            progress_bytes,
            total_bytes,
            speed_bytes_per_sec,
            eta_seconds,
            error_message,
            created_at,
            updated_at
        FROM jobs
        WHERE status IN (?, ?)
        ORDER BY CASE status WHEN ? THEN 0 ELSE 1 END, created_at
        LIMIT 1
        "#,
    )
    .bind(STATUS_QUEUED)
    .bind(STATUS_RUNNING)
    .bind(STATUS_RUNNING)
    .fetch_optional(db)
    .await?;

    if let Some(mut job) = job {
        if job.status != STATUS_RUNNING {
            let now = Utc::now().timestamp();
            sqlx::query(
                r#"
                UPDATE jobs
                SET status = ?, updated_at = ?, error_message = NULL
                WHERE id = ?
                "#,
            )
            .bind(STATUS_RUNNING)
            .bind(now)
            .bind(job.id)
            .execute(db)
            .await?;
            job.status = STATUS_RUNNING.to_string();
        }
        Ok(Some(job))
    } else {
        Ok(None)
    }
}

async fn execute_job(job: JobRow, db: &DbPool, config: &Config) -> Result<(), JobError> {
    let source_path = PathBuf::from(&job.source_path);
    let destination_path = PathBuf::from(&job.destination_path);
    let total_bytes = job.total_bytes.unwrap_or(0).max(0);

    info!(
        job_id = job.id,
        show_id = job.show_id,
        source = %source_path.display(),
        destination = %destination_path.display(),
        "Starting move job"
    );

    match fs::remove_dir_all(&destination_path).await {
        Ok(_) => {}
        Err(err) if err.kind() == io::ErrorKind::NotFound => {}
        Err(err) => {
            warn!(
                ?err,
                destination = %destination_path.display(),
                "Failed to clean existing destination directory before move"
            );
        }
    }
    fs::create_dir_all(&destination_path).await?;

    let mut copied = job.progress_bytes.unwrap_or(0);
    let start = Instant::now();

    for entry in WalkDir::new(&source_path).into_iter() {
        let entry = match entry {
            Ok(e) => e,
            Err(err) => {
                return Err(JobError::Io(io::Error::new(
                    io::ErrorKind::Other,
                    err.to_string(),
                )));
            }
        };

        let path = entry.path();
        if path == source_path {
            continue;
        }

        let relative = path
            .strip_prefix(&source_path)
            .map_err(|_| JobError::PathMismatch)?;
        let target_path = destination_path.join(relative);

        if entry.file_type().is_dir() {
            fs::create_dir_all(&target_path).await?;
            continue;
        }

        if let Some(parent) = target_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        fs::copy(path, &target_path).await?;
        let bytes = entry
            .metadata()
            .map(|m| m.len())
            .unwrap_or(0)
            .min(i64::MAX as u64) as i64;
        copied = copied.saturating_add(bytes);
        let progress = copied.min(total_bytes);
        let elapsed = start.elapsed().as_secs_f64();
        let speed = if elapsed > 0.0 {
            (copied as f64 / elapsed) as i64
        } else {
            0
        };
        let remaining = total_bytes.saturating_sub(progress);
        let eta = if speed > 0 {
            (remaining as f64 / speed.max(1) as f64).round() as i64
        } else {
            0
        };

        update_job_progress(db, job.id, progress, speed, eta).await?;
    }

    let final_progress = copied.min(total_bytes);
    let new_location = resolve_location_from_path(&destination_path, config)?;
    let destination_string = destination_path.to_string_lossy().to_string();
    let updated_at = Utc::now().timestamp();

    let transaction_result: Result<(), JobError> = async {
        let mut tx = db.begin().await?;

        sqlx::query(
            r#"
            UPDATE shows
            SET path = ?, location = ?
            WHERE id = ?
            "#,
        )
        .bind(&destination_string)
        .bind(new_location)
        .bind(job.show_id)
        .execute(&mut *tx)
        .await?;

        sqlx::query(
            r#"
            UPDATE jobs
            SET status = ?, error_message = NULL, progress_bytes = ?, eta_seconds = 0, speed_bytes_per_sec = 0, updated_at = ?
            WHERE id = ?
            "#,
        )
        .bind(STATUS_SUCCESS)
        .bind(final_progress)
        .bind(updated_at)
        .bind(job.id)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(())
    }
    .await;

    if let Err(err) = transaction_result {
        error!(
            ?err,
            job_id = job.id,
            show_id = job.show_id,
            source = %source_path.display(),
            destination = %destination_path.display(),
            "Failed to finalize move job transaction"
        );
        return Err(err);
    }

    if let Err(err) = fs::remove_dir_all(&source_path).await {
        warn!(
            ?err,
            job_id = job.id,
            show_id = job.show_id,
            source = %source_path.display(),
            "Failed to delete source directory after move"
        );
    }

    info!(job_id = job.id, show_id = job.show_id, "Move job completed");
    Ok(())
}

async fn update_job_progress(
    db: &DbPool,
    job_id: i64,
    progress: i64,
    speed: i64,
    eta: i64,
) -> Result<(), sqlx::Error> {
    let now = Utc::now().timestamp();
    sqlx::query(
        r#"
        UPDATE jobs
        SET progress_bytes = ?, speed_bytes_per_sec = ?, eta_seconds = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(progress)
    .bind(speed)
    .bind(eta)
    .bind(now)
    .bind(job_id)
    .execute(db)
    .await?;
    Ok(())
}

async fn finalize_job_status(
    db: &DbPool,
    job_id: i64,
    status: &str,
    error_message: Option<String>,
    progress_override: Option<i64>,
) -> Result<(), sqlx::Error> {
    let now = Utc::now().timestamp();
    sqlx::query(
        r#"
        UPDATE jobs
        SET status = ?, error_message = ?, progress_bytes = COALESCE(?, progress_bytes), updated_at = ?, eta_seconds = 0, speed_bytes_per_sec = 0
        WHERE id = ?
        "#,
    )
    .bind(status)
    .bind(error_message)
    .bind(progress_override)
    .bind(now)
    .bind(job_id)
    .execute(db)
    .await?;
    Ok(())
}

fn normalize_target(target: &str) -> Option<&'static str> {
    match target.trim().to_lowercase().as_str() {
        "hot" => Some("hot"),
        "cold" => Some("cold"),
        _ => None,
    }
}

fn trimmed_root(value: &str) -> Option<PathBuf> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(PathBuf::from(trimmed))
    }
}

fn detect_location<'a>(
    show_path: &Path,
    hot_root: &'a Path,
    cold_root: &'a Path,
) -> Result<(&'a str, &'a Path), JobError> {
    if show_path.starts_with(hot_root) {
        Ok(("hot", hot_root))
    } else if show_path.starts_with(cold_root) {
        Ok(("cold", cold_root))
    } else {
        Err(JobError::PathMismatch)
    }
}

fn resolve_location_from_path(path: &Path, config: &Config) -> Result<&'static str, JobError> {
    let hot_root = trimmed_root(&config.hot_root).ok_or(JobError::MissingRoot("hot_root"))?;
    let cold_root = trimmed_root(&config.cold_root).ok_or(JobError::MissingRoot("cold_root"))?;

    if path.starts_with(&hot_root) {
        Ok("hot")
    } else if path.starts_with(&cold_root) {
        Ok("cold")
    } else {
        Err(JobError::PathMismatch)
    }
}
