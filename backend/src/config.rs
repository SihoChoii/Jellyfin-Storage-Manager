use serde::{Deserialize, Serialize};
use std::{
    fmt, fs, io,
    path::{Path, PathBuf},
};
use url::Url;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Config {
    pub hot_root: String,
    pub cold_root: String,
    pub library_paths: Vec<String>,
    pub jellyfin: JellyfinConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct JellyfinConfig {
    pub url: String,
    pub api_key: String,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            hot_root: String::new(),
            cold_root: String::new(),
            library_paths: Vec::new(),
            jellyfin: JellyfinConfig::default(),
        }
    }
}

impl Default for JellyfinConfig {
    fn default() -> Self {
        Self {
            url: String::new(),
            api_key: String::new(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ConfigStore {
    path: PathBuf,
}

impl ConfigStore {
    pub fn new<P: Into<PathBuf>>(path: P) -> Self {
        Self { path: path.into() }
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    pub fn load_or_init(&self) -> Result<Config, ConfigError> {
        self.ensure_parent_dir()?;

        if self.path.exists() {
            let raw = fs::read_to_string(&self.path)?;
            if raw.trim().is_empty() {
                let config = Config::default();
                self.save(&config)?;
                return Ok(config);
            }

            let config = serde_json::from_str(&raw)?;
            Ok(config)
        } else {
            let config = Config::default();
            self.save(&config)?;
            Ok(config)
        }
    }

    pub fn save(&self, config: &Config) -> Result<(), ConfigError> {
        self.ensure_parent_dir()?;
        let serialized = serde_json::to_string_pretty(config)?;
        fs::write(&self.path, format!("{serialized}\n"))?;
        Ok(())
    }

    fn ensure_parent_dir(&self) -> Result<(), ConfigError> {
        if let Some(parent) = self.path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }
        Ok(())
    }
}

#[derive(Debug)]
pub enum ConfigError {
    Io(io::Error),
    Json(serde_json::Error),
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigError::Io(err) => write!(f, "I/O error: {err}"),
            ConfigError::Json(err) => write!(f, "JSON error: {err}"),
        }
    }
}

impl std::error::Error for ConfigError {}

impl From<io::Error> for ConfigError {
    fn from(value: io::Error) -> Self {
        ConfigError::Io(value)
    }
}

impl From<serde_json::Error> for ConfigError {
    fn from(value: serde_json::Error) -> Self {
        ConfigError::Json(value)
    }
}

#[derive(Debug, Clone)]
pub struct ConfigValidationError {
    message: String,
}

impl ConfigValidationError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl fmt::Display for ConfigValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for ConfigValidationError {}

pub fn validate_config(config: &Config) -> Result<(), ConfigValidationError> {
    let hot_root = validate_root_path("hot_root", &config.hot_root)?;
    let cold_root = validate_root_path("cold_root", &config.cold_root)?;

    validate_library_paths(&config.library_paths)?;

    if let (Some(hot), Some(cold)) = (hot_root.as_ref(), cold_root.as_ref()) {
        if hot == cold {
            return Err(ConfigValidationError::new(
                "hot_root and cold_root cannot be the same directory",
            ));
        }

        if hot.starts_with(cold) || cold.starts_with(hot) {
            return Err(ConfigValidationError::new(
                "hot_root and cold_root cannot be nested inside each other",
            ));
        }
    }

    let jellyfin_url = config.jellyfin.url.trim();
    if !jellyfin_url.is_empty() {
        Url::parse(jellyfin_url).map_err(|err| {
            ConfigValidationError::new(format!("Invalid Jellyfin URL '{jellyfin_url}': {err}"))
        })?;
    }

    Ok(())
}

pub fn config_is_ready(config: &Config) -> bool {
    let hot_ready = !config.hot_root.trim().is_empty();
    let cold_ready = !config.cold_root.trim().is_empty();

    hot_ready && cold_ready
}

fn validate_root_path(field: &str, value: &str) -> Result<Option<PathBuf>, ConfigValidationError> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }

    let path = PathBuf::from(trimmed);
    let label = format!("{field} path");
    ensure_directory(&path, &label)?;
    Ok(Some(path))
}

fn validate_library_paths(paths: &[String]) -> Result<(), ConfigValidationError> {
    if paths.is_empty() {
        return Ok(());
    }

    for value in paths {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            return Err(ConfigValidationError::new(
                "library_paths entries must be non-empty paths",
            ));
        }

        let path = Path::new(trimmed);
        ensure_directory(path, "library path")?;
    }

    Ok(())
}

fn ensure_directory(path: &Path, label: &str) -> Result<(), ConfigValidationError> {
    match fs::metadata(path) {
        Ok(metadata) => {
            if !metadata.is_dir() {
                return Err(ConfigValidationError::new(format!(
                    "{label} '{}' is not a directory",
                    path.display()
                )));
            }
        }
        Err(err) if err.kind() == io::ErrorKind::NotFound => {
            return Err(ConfigValidationError::new(format!(
                "{label} '{}' does not exist",
                path.display()
            )));
        }
        Err(err) => {
            return Err(ConfigValidationError::new(format!(
                "Failed to inspect {label} '{}': {err}",
                path.display()
            )));
        }
    }

    Ok(())
}
