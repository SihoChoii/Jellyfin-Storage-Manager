use chrono::Utc;
use sqlx::SqlitePool;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{interval, Duration};
use tracing::{error, info};

use crate::{config::Config, pools, system::SystemMonitor};

const SYSTEM_METRICS_INTERVAL_SECS: u64 = 60; // Collect every 60 seconds
const POOL_METRICS_INTERVAL_SECS: u64 = 300; // Collect every 5 minutes
const RETENTION_DAYS: i64 = 30; // Keep 30 days of history
const CLEANUP_INTERVAL_HOURS: u64 = 24; // Run cleanup daily

/// Start the background metrics collection task
pub fn start_collector(
    db: SqlitePool,
    config: Arc<RwLock<Config>>,
    system_monitor: Arc<tokio::sync::Mutex<SystemMonitor>>,
) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        info!("Starting metrics collector background task");

        let mut system_interval = interval(Duration::from_secs(SYSTEM_METRICS_INTERVAL_SECS));
        let mut pool_interval = interval(Duration::from_secs(POOL_METRICS_INTERVAL_SECS));
        let mut cleanup_interval = interval(Duration::from_secs(CLEANUP_INTERVAL_HOURS * 3600));

        // Skip first tick (fires immediately)
        system_interval.tick().await;
        pool_interval.tick().await;
        cleanup_interval.tick().await;

        loop {
            tokio::select! {
                _ = system_interval.tick() => {
                    collect_system_metrics(&db, &system_monitor).await;
                }
                _ = pool_interval.tick() => {
                    collect_pool_metrics(&db, &config).await;
                }
                _ = cleanup_interval.tick() => {
                    cleanup_old_metrics(&db).await;
                }
            }
        }
    })
}

async fn collect_system_metrics(
    db: &SqlitePool,
    system_monitor: &Arc<tokio::sync::Mutex<SystemMonitor>>,
) {
    let mut monitor = system_monitor.lock().await;
    let stats = monitor.get_stats();
    let timestamp = Utc::now().timestamp();

    let result = sqlx::query(
        r#"
        INSERT INTO system_metrics_history
        (timestamp, cpu_percent, memory_percent, memory_used_bytes, memory_total_bytes)
        VALUES (?, ?, ?, ?, ?)
        "#,
    )
    .bind(timestamp)
    .bind(stats.cpu_percent)
    .bind(stats.memory_percent)
    .bind(stats.memory_used_bytes as i64)
    .bind(stats.memory_total_bytes as i64)
    .execute(db)
    .await;

    if let Err(err) = result {
        error!(?err, "Failed to record system metrics");
    }
}

async fn collect_pool_metrics(db: &SqlitePool, config: &Arc<RwLock<Config>>) {
    let config_snapshot = config.read().await;
    let timestamp = Utc::now().timestamp();

    // Collect hot pool metrics
    if let Some(hot_pool) = pools::collect_pool_usage(&config_snapshot.hot_root) {
        let result = sqlx::query(
            r#"
            INSERT INTO pool_usage_history
            (timestamp, pool_type, total_bytes, used_bytes, free_bytes)
            VALUES (?, ?, ?, ?, ?)
            "#,
        )
        .bind(timestamp)
        .bind("hot")
        .bind(hot_pool.total_bytes as i64)
        .bind(hot_pool.used_bytes as i64)
        .bind(hot_pool.free_bytes as i64)
        .execute(db)
        .await;

        if let Err(err) = result {
            error!(?err, "Failed to record hot pool metrics");
        }
    }

    // Collect cold pool metrics
    if let Some(cold_pool) = pools::collect_pool_usage(&config_snapshot.cold_root) {
        let result = sqlx::query(
            r#"
            INSERT INTO pool_usage_history
            (timestamp, pool_type, total_bytes, used_bytes, free_bytes)
            VALUES (?, ?, ?, ?, ?)
            "#,
        )
        .bind(timestamp)
        .bind("cold")
        .bind(cold_pool.total_bytes as i64)
        .bind(cold_pool.used_bytes as i64)
        .bind(cold_pool.free_bytes as i64)
        .execute(db)
        .await;

        if let Err(err) = result {
            error!(?err, "Failed to record cold pool metrics");
        }
    }
}

async fn cleanup_old_metrics(db: &SqlitePool) {
    let cutoff_timestamp = Utc::now().timestamp() - (RETENTION_DAYS * 86400);

    // Clean up old system metrics
    let result = sqlx::query(
        "DELETE FROM system_metrics_history WHERE timestamp < ?",
    )
    .bind(cutoff_timestamp)
    .execute(db)
    .await;

    if let Err(err) = result {
        error!(?err, "Failed to cleanup old system metrics");
    } else if let Ok(rows) = result {
        let deleted = rows.rows_affected();
        if deleted > 0 {
            info!(deleted, "Cleaned up old system metrics records");
        }
    }

    // Clean up old pool metrics
    let result = sqlx::query(
        "DELETE FROM pool_usage_history WHERE timestamp < ?",
    )
    .bind(cutoff_timestamp)
    .execute(db)
    .await;

    if let Err(err) = result {
        error!(?err, "Failed to cleanup old pool metrics");
    } else if let Ok(rows) = result {
        let deleted = rows.rows_affected();
        if deleted > 0 {
            info!(deleted, "Cleaned up old pool metrics records");
        }
    }
}
