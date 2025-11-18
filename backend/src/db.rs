use sqlx::{
    Pool, Sqlite,
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
};
use std::{
    env, fs,
    path::{Path, PathBuf},
};
use tracing::{info, warn};

pub type DbPool = Pool<Sqlite>;

pub async fn init_pool<P: AsRef<Path>>(database_file: P) -> Result<DbPool, sqlx::Error> {
    let absolute_path = resolve_database_path(database_file.as_ref())?;
    ensure_parent_dir(&absolute_path)?;

    info!(db_path = %absolute_path.display(), "Opening SQLite database");
    let connect_options = SqliteConnectOptions::new()
        .filename(&absolute_path)
        .create_if_missing(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .after_connect(|conn, _meta| {
            Box::pin(async move {
                sqlx::query("PRAGMA foreign_keys = ON;")
                    .execute(conn)
                    .await?;
                Ok(())
            })
        })
        .connect_with(connect_options)
        .await?;

    apply_schema(&pool).await?;

    info!(
        db_path = %absolute_path.display(),
        "SQLite database initialized"
    );

    Ok(pool)
}

async fn apply_schema(pool: &DbPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS shows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            path TEXT NOT NULL UNIQUE,
            location TEXT,
            size_bytes INTEGER,
            season_count INTEGER,
            episode_count INTEGER,
            thumbnail_path TEXT,
            source TEXT,
            last_scan INTEGER
        );
        "#,
    )
    .execute(pool)
    .await?;

    deduplicate_show_paths(pool).await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            show_id INTEGER,
            source_path TEXT NOT NULL,
            destination_path TEXT NOT NULL,
            status TEXT,
            progress_bytes INTEGER,
            total_bytes INTEGER,
            speed_bytes_per_sec INTEGER,
            eta_seconds INTEGER,
            error_message TEXT,
            created_at INTEGER,
            updated_at INTEGER,
            FOREIGN KEY (show_id) REFERENCES shows(id)
        );
        "#,
    )
    .execute(pool)
    .await?;

    create_indexes(pool).await?;

    Ok(())
}

fn ensure_parent_dir(path: &Path) -> Result<(), sqlx::Error> {
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(sqlx::Error::Io)?;
        }
    }
    Ok(())
}

fn resolve_database_path(path: &Path) -> Result<PathBuf, sqlx::Error> {
    if path.is_absolute() {
        Ok(path.to_path_buf())
    } else {
        let cwd = env::current_dir().map_err(sqlx::Error::Io)?;
        Ok(cwd.join(path))
    }
}

async fn deduplicate_show_paths(pool: &DbPool) -> Result<(), sqlx::Error> {
    let duplicates: Vec<String> = sqlx::query_scalar(
        r#"
        SELECT path
        FROM shows
        GROUP BY path
        HAVING COUNT(*) > 1
        "#,
    )
    .fetch_all(pool)
    .await?;

    for path in duplicates {
        warn!(
            %path,
            "Duplicate show entries detected for path; retaining latest record"
        );
        sqlx::query(
            r#"
            DELETE FROM shows
            WHERE path = ?1
              AND id NOT IN (
                SELECT MAX(id) FROM shows WHERE path = ?1
              )
            "#,
        )
        .bind(&path)
        .execute(pool)
        .await?;
    }

    Ok(())
}

async fn create_indexes(pool: &DbPool) -> Result<(), sqlx::Error> {
    // Dedicated indexes keep show lookups/location filters and job queues snappy.
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_shows_path ON shows(path);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_shows_location ON shows(location);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_jobs_show_id ON jobs(show_id);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);")
        .execute(pool)
        .await?;

    // Sort column indexes for performance
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_shows_title ON shows(title COLLATE NOCASE);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_shows_size_bytes ON shows(size_bytes);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_shows_last_scan ON shows(last_scan);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_shows_season_count ON shows(season_count);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_shows_episode_count ON shows(episode_count);")
        .execute(pool)
        .await?;

    // Composite indexes for filtered sort queries
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_shows_location_title ON shows(location, title COLLATE NOCASE);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_shows_location_size ON shows(location, size_bytes);")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_shows_location_date ON shows(location, last_scan);")
        .execute(pool)
        .await?;

    Ok(())
}
