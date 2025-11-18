use nix::sys::statvfs::statvfs;
use serde::Serialize;
use std::{
    fs, io,
    path::{Path, PathBuf},
};

#[derive(Debug, Clone, Serialize)]
pub struct DirectoryEntry {
    pub name: String,
    pub full_path: String,
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub free_bytes: u64,
}

#[derive(Debug)]
pub enum PathsError {
    MissingRoot,
    NotFound(PathBuf),
    NotDirectory(PathBuf),
    NotReadable(PathBuf, io::Error),
    Enumerate(PathBuf, io::Error),
    Stat(PathBuf, nix::Error),
}

impl std::fmt::Display for PathsError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PathsError::MissingRoot => write!(f, "root query parameter is required"),
            PathsError::NotFound(path) => write!(f, "Root path '{}' not found", path.display()),
            PathsError::NotDirectory(path) => {
                write!(f, "Root path '{}' is not a directory", path.display())
            }
            PathsError::NotReadable(path, _) => {
                write!(f, "Root path '{}' is not readable", path.display())
            }
            PathsError::Enumerate(path, _) => {
                write!(f, "Failed to enumerate '{}'", path.display())
            }
            PathsError::Stat(path, _) => {
                write!(
                    f,
                    "Failed to read filesystem stats for '{}'",
                    path.display()
                )
            }
        }
    }
}

impl std::error::Error for PathsError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            PathsError::MissingRoot => None,
            PathsError::NotFound(_) => None,
            PathsError::NotDirectory(_) => None,
            PathsError::NotReadable(_, err) => Some(err),
            PathsError::Enumerate(_, err) => Some(err),
            PathsError::Stat(_, err) => Some(err),
        }
    }
}

pub fn validate_root(root: &str) -> Result<PathBuf, PathsError> {
    if root.trim().is_empty() {
        return Err(PathsError::MissingRoot);
    }

    let path = PathBuf::from(root);
    match fs::metadata(&path) {
        Ok(metadata) => {
            if !metadata.is_dir() {
                return Err(PathsError::NotDirectory(path));
            }
        }
        Err(err) => {
            if err.kind() == io::ErrorKind::NotFound {
                return Err(PathsError::NotFound(path));
            } else {
                return Err(PathsError::NotReadable(path, err));
            }
        }
    }

    Ok(path)
}

pub fn list_subdirectories(root: &Path) -> Result<Vec<DirectoryEntry>, PathsError> {
    let mut directories = Vec::new();
    let entries =
        fs::read_dir(root).map_err(|err| PathsError::Enumerate(root.to_path_buf(), err))?;

    for entry in entries {
        let entry = entry.map_err(|err| PathsError::Enumerate(root.to_path_buf(), err))?;
        let metadata = entry
            .metadata()
            .map_err(|err| PathsError::Enumerate(entry.path(), err))?;

        if metadata.is_dir() {
            let path = entry.path();
            let stats = statvfs(&path).map_err(|err| PathsError::Stat(path.clone(), err))?;
            let block_size = u64::from(stats.fragment_size()).max(1);
            let total_blocks = u64::from(stats.blocks());
            let free_blocks = u64::from(stats.blocks_available());

            let total = total_blocks.saturating_mul(block_size);
            let free = free_blocks.saturating_mul(block_size);
            let used = total.saturating_sub(free);

            let name = entry.file_name().to_string_lossy().into_owned();

            directories.push(DirectoryEntry {
                name,
                full_path: path.display().to_string(),
                total_bytes: total,
                used_bytes: used,
                free_bytes: free,
            });
        }
    }

    directories.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(directories)
}
