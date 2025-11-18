use crate::config::Config;
use reqwest::StatusCode;
use serde::Serialize;
use tracing::{error, info};

#[derive(Debug)]
pub enum JellyfinError {
    NotConfigured,
    Http(reqwest::Error),
    UnexpectedStatus(StatusCode),
}

impl From<reqwest::Error> for JellyfinError {
    fn from(value: reqwest::Error) -> Self {
        JellyfinError::Http(value)
    }
}

impl std::fmt::Display for JellyfinError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            JellyfinError::NotConfigured => write!(f, "Jellyfin integration not configured"),
            JellyfinError::Http(err) => write!(f, "HTTP error: {err}"),
            JellyfinError::UnexpectedStatus(status) => {
                write!(f, "Unexpected Jellyfin status: {status}")
            }
        }
    }
}

impl std::error::Error for JellyfinError {}

pub struct JellyfinClient {
    http: reqwest::Client,
    base_url: String,
    api_key: String,
}

impl JellyfinClient {
    pub fn from_config(config: &Config) -> Result<Self, JellyfinError> {
        let url = config.jellyfin.url.trim();
        let api_key = config.jellyfin.api_key.trim();

        if url.is_empty() || api_key.is_empty() {
            return Err(JellyfinError::NotConfigured);
        }

        let normalized = url.trim_end_matches('/');
        Ok(Self {
            http: reqwest::Client::new(),
            base_url: normalized.to_string(),
            api_key: api_key.to_string(),
        })
    }

    pub async fn trigger_rescan(&self) -> Result<(), JellyfinError> {
        let url = format!("{}/Library/Refresh", self.base_url);
        info!(endpoint = %url, "Triggering Jellyfin library refresh");

        let response = self
            .http
            .post(&url)
            .header("X-Emby-Token", &self.api_key)
            .send()
            .await?;

        if response.status().is_success() {
            Ok(())
        } else {
            error!(
                status = %response.status(),
                "Jellyfin refresh returned non-success status"
            );
            Err(JellyfinError::UnexpectedStatus(response.status()))
        }
    }

    pub async fn health(&self) -> Result<StatusCode, JellyfinError> {
        let url = format!("{}/health", self.base_url);
        info!(endpoint = %url, "Checking Jellyfin health endpoint");
        let response = self.http.get(&url).send().await?;
        Ok(response.status())
    }

    pub async fn verify_library_access(&self) -> Result<StatusCode, JellyfinError> {
        let url = format!("{}/Library/PhysicalPaths", self.base_url);
        info!(endpoint = %url, "Checking Jellyfin library access");
        let response = self
            .http
            .get(&url)
            .header("X-Emby-Token", &self.api_key)
            .send()
            .await?;
        Ok(response.status())
    }
}

#[derive(Serialize)]
pub struct JellyfinOperationResponse {
    pub status: &'static str,
}

#[derive(Serialize)]
pub struct JellyfinStatus {
    pub configured: bool,
    pub server_reachable: bool,
    pub auth_ok: bool,
    pub health_status_code: Option<u16>,
    pub library_status_code: Option<u16>,
    pub message: Option<String>,
}

pub async fn check_status(config: &Config) -> Result<JellyfinStatus, JellyfinError> {
    let client = JellyfinClient::from_config(config)?;

    let mut status = JellyfinStatus {
        configured: true,
        server_reachable: false,
        auth_ok: false,
        health_status_code: None,
        library_status_code: None,
        message: None,
    };

    match client.health().await {
        Ok(code) => {
            status.health_status_code = Some(code.as_u16());
            if code.is_success() {
                status.server_reachable = true;
            } else {
                status.message = Some(format!(
                    "Jellyfin health endpoint returned {}",
                    code.as_u16()
                ));
                return Ok(status);
            }
        }
        Err(err) => {
            status.message = Some(format!("Failed to reach Jellyfin health endpoint: {err}"));
            return Ok(status);
        }
    }

    match client.verify_library_access().await {
        Ok(code) => {
            status.library_status_code = Some(code.as_u16());
            if code.is_success() {
                status.auth_ok = true;
            } else if code == StatusCode::UNAUTHORIZED || code == StatusCode::FORBIDDEN {
                status.message = Some("Jellyfin API key invalid".into());
            } else {
                status.message = Some(format!(
                    "Unexpected status from library endpoint: {}",
                    code.as_u16()
                ));
            }
        }
        Err(err) => {
            status.message = Some(format!("Failed to call Jellyfin library endpoint: {err}"));
        }
    }

    Ok(status)
}
