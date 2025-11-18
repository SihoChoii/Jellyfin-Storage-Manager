use std::{
    collections::HashSet,
    fs,
    path::{Component, Path, PathBuf},
};

use chrono::Utc;
use quick_xml::{Reader, events::Event};
use serde::Serialize;
use tracing::{debug, info, warn};
use walkdir::WalkDir;

use crate::{config::Config, db::DbPool};

#[derive(Debug, Serialize)]
pub struct ScanSummary {
    pub scanned_libraries: usize,
    pub shows_processed: usize,
    pub inserted: u64,
    pub updated: u64,
}

#[derive(Debug)]
pub enum ScanError {
    Database(sqlx::Error),
}

impl From<sqlx::Error> for ScanError {
    fn from(value: sqlx::Error) -> Self {
        ScanError::Database(value)
    }
}

#[derive(Debug)]
struct ShowCandidate {
    title: String,
    path: String,
    location: Option<String>,
    size_bytes: i64,
    season_count: i64,
    episode_count: i64,
    thumbnail_path: Option<String>,
    source: String,
}

const VIDEO_EXTENSIONS: &[&str] = &["mkv", "mp4", "avi", "mov", "m4v", "wmv"];
const THUMBNAIL_NAMES: &[&str] = &["folder.jpg", "poster.jpg", "cover.jpg", "thumb.jpg"];

pub async fn run_scan(config: Config, pool: DbPool) -> Result<ScanSummary, ScanError> {
    let mut summary = ScanSummary {
        scanned_libraries: 0,
        shows_processed: 0,
        inserted: 0,
        updated: 0,
    };

    let hot_root = sanitize_root(&config.hot_root);
    let cold_root = sanitize_root(&config.cold_root);
    let library_paths = resolve_library_paths(&config, hot_root.as_ref(), cold_root.as_ref());

    for library_path in &library_paths {
        if !library_path.exists() || !library_path.is_dir() {
            warn!(
                path = %library_path.display(),
                "Skipping library path that does not exist or is not a directory"
            );
            continue;
        }

        info!(path = %library_path.display(), "Scanning library path");
        summary.scanned_libraries += 1;

        match scan_library(library_path, hot_root.as_deref(), cold_root.as_deref()) {
            Ok(mut shows) => {
                for show in shows.drain(..) {
                    summary.shows_processed += 1;
                    match upsert_show(&pool, &show).await? {
                        UpsertResult::Inserted => summary.inserted += 1,
                        UpsertResult::Updated => summary.updated += 1,
                    }
                }
            }
            Err(err) => {
                warn!(
                    path = %library_path.display(),
                    error = %err,
                    "Failed to scan library path"
                );
            }
        }
    }

    info!(
        scanned = summary.scanned_libraries,
        processed = summary.shows_processed,
        inserted = summary.inserted,
        updated = summary.updated,
        "Filesystem scan complete"
    );

    Ok(summary)
}

fn scan_library(
    library_path: &Path,
    hot_root: Option<&Path>,
    cold_root: Option<&Path>,
) -> Result<Vec<ShowCandidate>, std::io::Error> {
    let mut shows = Vec::new();
    for entry in fs::read_dir(library_path)? {
        let entry = match entry {
            Ok(value) => value,
            Err(err) => {
                warn!(
                    path = %library_path.display(),
                    "Failed to read entry inside library: {err}"
                );
                continue;
            }
        };

        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        if let Some(candidate) = build_show_candidate(&path, hot_root, cold_root) {
            debug!(path = %candidate.path, "Discovered show candidate");
            shows.push(candidate);
        }
    }

    Ok(shows)
}

fn build_show_candidate(
    show_path: &Path,
    hot_root: Option<&Path>,
    cold_root: Option<&Path>,
) -> Option<ShowCandidate> {
    let folder_title = show_path.file_name()?.to_string_lossy().into_owned();
    let nfo_title = read_tvshow_title(show_path);
    let used_nfo_title = nfo_title.is_some();
    let title = nfo_title.unwrap_or(folder_title);
    let source = if used_nfo_title {
        "fs_scan_nfo".to_string()
    } else {
        "fs_scan".to_string()
    };

    let stats = gather_stats(show_path);
    let nfo_episode_count = count_episode_nfo_files(show_path);
    let episode_count = if nfo_episode_count > 0 {
        clamp_to_i64(nfo_episode_count)
    } else {
        stats.video_episode_count
    };

    Some(ShowCandidate {
        title,
        path: show_path.display().to_string(),
        location: determine_location(show_path, hot_root, cold_root),
        size_bytes: stats.total_bytes,
        season_count: stats.season_count,
        episode_count,
        thumbnail_path: find_thumbnail(show_path),
        source,
    })
}

struct ShowStats {
    total_bytes: i64,
    video_episode_count: i64,
    season_count: i64,
}

fn gather_stats(show_path: &Path) -> ShowStats {
    let mut total_bytes: u64 = 0;
    let mut episode_count: u64 = 0;
    let mut season_directories: HashSet<String> = HashSet::new();

    for entry in WalkDir::new(show_path).into_iter().filter_map(Result::ok) {
        if entry.file_type().is_file() {
            total_bytes =
                total_bytes.saturating_add(entry.metadata().map(|m| m.len()).unwrap_or(0));

            if is_video_file(entry.path()) {
                episode_count = episode_count.saturating_add(1);

                if let Some(parent) = entry.path().parent() {
                    if let Ok(relative) = parent.strip_prefix(show_path) {
                        if let Some(component) = relative.components().next() {
                            if let Component::Normal(name) = component {
                                season_directories.insert(name.to_string_lossy().into_owned());
                            }
                        }
                    }
                }
            }
        }
    }

    let season_count = if season_directories.is_empty() {
        if episode_count > 0 { 1 } else { 0 }
    } else {
        season_directories.len() as u64
    };

    ShowStats {
        total_bytes: clamp_to_i64(total_bytes),
        video_episode_count: clamp_to_i64(episode_count),
        season_count: clamp_to_i64(season_count),
    }
}

fn determine_location(
    show_path: &Path,
    hot_root: Option<&Path>,
    cold_root: Option<&Path>,
) -> Option<String> {
    if let Some(root) = hot_root {
        if show_path.starts_with(root) {
            return Some("hot".to_string());
        }
    }

    if let Some(root) = cold_root {
        if show_path.starts_with(root) {
            return Some("cold".to_string());
        }
    }

    None
}

fn find_thumbnail(show_path: &Path) -> Option<String> {
    for name in THUMBNAIL_NAMES {
        let candidate = show_path.join(name);
        if candidate.exists() && candidate.is_file() {
            return Some(candidate.display().to_string());
        }
    }
    None
}

fn is_video_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            VIDEO_EXTENSIONS
                .iter()
                .any(|candidate| ext.eq_ignore_ascii_case(candidate))
        })
        .unwrap_or(false)
}

fn read_tvshow_title(show_path: &Path) -> Option<String> {
    let path = show_path.join("tvshow.nfo");
    let content = fs::read_to_string(path).ok()?;
    extract_title_from_nfo(&content)
}

fn extract_title_from_nfo(content: &str) -> Option<String> {
    let mut reader = Reader::from_str(content);
    reader.config_mut().trim_text(true);
    let mut buf = Vec::new();
    let mut in_title = false;

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(element)) => {
                if element.name().as_ref().eq_ignore_ascii_case(b"title") {
                    in_title = true;
                }
            }
            Ok(Event::Text(text)) => {
                if in_title {
                    if let Ok(value) = text.unescape() {
                        let trimmed = value.trim();
                        if !trimmed.is_empty() {
                            return Some(trimmed.to_string());
                        }
                    }
                }
            }
            Ok(Event::End(element)) => {
                if in_title && element.name().as_ref().eq_ignore_ascii_case(b"title") {
                    in_title = false;
                }
            }
            Ok(Event::Eof) => break,
            Err(err) => {
                warn!("Failed to parse tvshow.nfo: {err}");
                break;
            }
            _ => {}
        }

        buf.clear();
    }

    None
}

fn count_episode_nfo_files(show_path: &Path) -> u64 {
    WalkDir::new(show_path)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|entry| entry.file_type().is_file())
        .filter(|entry| is_episode_nfo(entry.path()))
        .count() as u64
}

fn is_episode_nfo(path: &Path) -> bool {
    is_nfo_file(path) && !file_name_equals(path, "tvshow.nfo")
}

fn is_nfo_file(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.eq_ignore_ascii_case("nfo"))
        .unwrap_or(false)
}

fn file_name_equals(path: &Path, expected: &str) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .map(|name| name.eq_ignore_ascii_case(expected))
        .unwrap_or(false)
}

fn clamp_to_i64(value: u64) -> i64 {
    value.min(i64::MAX as u64) as i64
}

async fn upsert_show(pool: &DbPool, show: &ShowCandidate) -> Result<UpsertResult, sqlx::Error> {
    let existing_id: Option<i64> = sqlx::query_scalar("SELECT id FROM shows WHERE path = ?")
        .bind(&show.path)
        .fetch_optional(pool)
        .await?;

    let timestamp = Utc::now().timestamp();

    sqlx::query(
        r#"
        INSERT INTO shows (
            title, path, location, size_bytes, season_count, episode_count,
            thumbnail_path, source, last_scan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
            title = excluded.title,
            location = excluded.location,
            size_bytes = excluded.size_bytes,
            season_count = excluded.season_count,
            episode_count = excluded.episode_count,
            thumbnail_path = excluded.thumbnail_path,
            source = excluded.source,
            last_scan = excluded.last_scan
        "#,
    )
    .bind(&show.title)
    .bind(&show.path)
    .bind(&show.location)
    .bind(show.size_bytes)
    .bind(show.season_count)
    .bind(show.episode_count)
    .bind(&show.thumbnail_path)
    .bind(&show.source)
    .bind(timestamp)
    .execute(pool)
    .await?;

    Ok(if existing_id.is_some() {
        UpsertResult::Updated
    } else {
        UpsertResult::Inserted
    })
}

enum UpsertResult {
    Inserted,
    Updated,
}

fn sanitize_root(value: &str) -> Option<PathBuf> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(PathBuf::from(trimmed))
    }
}

fn resolve_library_paths(
    config: &Config,
    hot_root: Option<&PathBuf>,
    cold_root: Option<&PathBuf>,
) -> Vec<PathBuf> {
    let mut libraries = Vec::new();
    let mut seen = HashSet::new();
    let mut has_explicit_paths = false;

    for library in &config.library_paths {
        let trimmed = library.trim();
        if trimmed.is_empty() {
            continue;
        }
        has_explicit_paths = true;
        push_library_path(&mut libraries, &mut seen, PathBuf::from(trimmed));
    }

    if !has_explicit_paths {
        if let Some(path) = hot_root {
            push_library_path(&mut libraries, &mut seen, path.clone());
        }
        if let Some(path) = cold_root {
            push_library_path(&mut libraries, &mut seen, path.clone());
        }
    }

    libraries
}

fn push_library_path(
    libraries: &mut Vec<PathBuf>,
    seen: &mut HashSet<String>,
    path: PathBuf,
) {
    let key = path.to_string_lossy().to_string();
    if seen.insert(key) {
        libraries.push(path);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_title_from_sample_tvshow_nfo() {
        let show_dir = Path::new("../Example");
        let title = read_tvshow_title(show_dir);
        assert_eq!(title.as_deref(), Some("Summer Time Rendering"));
    }

    #[test]
    fn counts_episode_nfo_files_in_sample() {
        let show_dir = Path::new("../Example");
        assert_eq!(count_episode_nfo_files(show_dir), 1);
    }
}
