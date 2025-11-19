use crate::db::DbPool;
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{debug, info, warn};

/// User settings for preferences and customization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSettings {
    pub theme: String,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            theme: "jelly".to_string(),
        }
    }
}

/// Valid theme keys
const VALID_THEMES: &[&str] = &["jelly", "light", "dark"];

/// Validate that a theme key is valid
pub fn is_valid_theme(theme: &str) -> bool {
    VALID_THEMES.contains(&theme)
}

/// Get user settings from database
/// Creates default settings if none exist
pub async fn get_settings(pool: &DbPool) -> Result<UserSettings, sqlx::Error> {
    debug!("Fetching user settings from database");

    let result = sqlx::query_as::<_, (String,)>(
        r#"
        SELECT theme
        FROM user_settings
        WHERE id = 1
        "#,
    )
    .fetch_optional(pool)
    .await?;

    match result {
        Some((theme,)) => {
            debug!(theme = %theme, "Retrieved user settings");
            Ok(UserSettings { theme })
        }
        None => {
            info!("No user settings found, creating defaults");
            let defaults = UserSettings::default();
            create_settings(pool, &defaults).await?;
            Ok(defaults)
        }
    }
}

/// Create default settings in database
async fn create_settings(pool: &DbPool, settings: &UserSettings) -> Result<(), sqlx::Error> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    sqlx::query(
        r#"
        INSERT INTO user_settings (id, theme, updated_at)
        VALUES (1, ?, ?)
        "#,
    )
    .bind(&settings.theme)
    .bind(now)
    .execute(pool)
    .await?;

    info!(theme = %settings.theme, "Created default user settings");
    Ok(())
}

/// Update user settings in database
/// Uses upsert to handle both create and update cases
pub async fn update_settings(pool: &DbPool, settings: &UserSettings) -> Result<(), sqlx::Error> {
    if !is_valid_theme(&settings.theme) {
        warn!(theme = %settings.theme, "Attempted to save invalid theme");
        return Err(sqlx::Error::Protocol(format!(
            "Invalid theme: {}. Must be one of: {:?}",
            settings.theme, VALID_THEMES
        )));
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    sqlx::query(
        r#"
        INSERT INTO user_settings (id, theme, updated_at)
        VALUES (1, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            theme = excluded.theme,
            updated_at = excluded.updated_at
        "#,
    )
    .bind(&settings.theme)
    .bind(now)
    .execute(pool)
    .await?;

    info!(theme = %settings.theme, "Updated user settings");
    Ok(())
}
