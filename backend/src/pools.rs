use nix::sys::statvfs::statvfs;
use serde::Serialize;
use std::path::Path;
use tracing::warn;

#[derive(Debug, Serialize)]
pub struct PoolSummary {
    pub path: String,
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub free_bytes: u64,
}

#[derive(Debug, Serialize)]
pub struct PoolsResponse {
    pub hot: Option<PoolSummary>,
    pub cold: Option<PoolSummary>,
}

pub fn collect_pool_usage(root: &str) -> Option<PoolSummary> {
    let trimmed = root.trim();
    if trimmed.is_empty() {
        return None;
    }

    let path = Path::new(trimmed);
    let metadata = match path.metadata() {
        Ok(meta) => meta,
        Err(err) => {
            warn!(path = trimmed, ?err, "Pool path metadata check failed");
            return None;
        }
    };

    if !metadata.is_dir() {
        warn!(path = trimmed, "Pool path is not a directory");
        return None;
    }

    let stats = match statvfs(path) {
        Ok(stats) => stats,
        Err(err) => {
            warn!(path = trimmed, ?err, "Failed to read pool stats");
            return None;
        }
    };

    let block_size = u64::from(stats.block_size()).max(1);
    let total_blocks = stats.blocks() as u64;
    let free_blocks = stats.blocks_free() as u64;
    let total = total_blocks.saturating_mul(block_size);
    let free = free_blocks.saturating_mul(block_size);
    let used = total.saturating_sub(free);

    Some(PoolSummary {
        path: trimmed.to_string(),
        total_bytes: total,
        used_bytes: used,
        free_bytes: free,
    })
}
