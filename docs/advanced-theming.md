# Advanced Theming System

This document explains how Jellyfin Storage Manager's advanced theming stack works end to end. It covers the runtime flow, the token-based theme model, where CSS variables come from, and how we persist a user's preference in both the browser and the backend.

## Architecture in One Glance

The system is composed of several cooperating layers:

- **Theme context/provider (`frontend/src/theme/context.tsx`)** owns the active theme key, exposes helpers such as `useTheme()`, and orchestrates persistence plus CSS application.
- **Registry (`frontend/src/theme/registry.ts`)** defines every `Theme` via a strongly-typed token model (`frontend/src/theme/types.ts`). Production themes are hand-tuned; placeholder themes are generated through `createPlaceholderTheme`.
- **CSS variable bridge (`frontend/src/theme/cssVariables.ts`)** translates tokens into `--foo-bar` custom properties and updates the `:root` element with animation-friendly batching.
- **Persistence module (`frontend/src/theme/persistence.ts`)** reads/writes the preference to `localStorage` and wires up GET/PATCH calls to `/api/me/settings`.
- **Backend (`backend/src/main.rs`, `backend/src/user_settings.rs`, `backend/src/db.rs`)** stores the preference in SQLite (`user_settings` table) and validates that only approved theme keys are saved.

These pieces allow the UI to switch themes instantly, keep global CSS in sync, and remember a user's choice across devices.

## Runtime Lifecycle

1. `ThemeProvider` is mounted in `frontend/src/main.tsx` and wraps the entire React tree.
2. During initialization (`useState` lazy initializer in `ThemeProvider`), we prefer the persisted key in local storage (`getStoredTheme()`), then `initialTheme` prop (if supplied), and finally fall back to `DEFAULT_THEME_KEY` (`'jelly'`).
3. On mount, `fetchUserThemePreference()` calls `GET /api/me/settings`. If the backend reports a different key, we switch immediately and sync local storage.
4. Whenever `themeKey` changes:
   - We persist it locally via `setStoredTheme()`.
   - We fire-and-forget `saveUserThemePreference()` to `PATCH /api/me/settings`, ensuring the backend stays in sync.
   - We call `applyThemeToCSSVariables()`, which batches all CSS variable updates into a single `requestAnimationFrame`, sets `document.documentElement.dataset.theme`, and toggles the `.theme-transitioning` class used by `frontend/src/styles.css` to pause heavy animations during transitions.

This flow means the UI updates in a single frame, even if persistence fails, while still syncing user intent to storage layers.

## Theme Provider & Context Details

`ThemeProvider` exposes the following via `useTheme()`:

- `themeKey` – the current key string.
- `theme` – the fully resolved `Theme` object pulled from the registry.
- State mutators: `setThemeKey()` and `resetTheme()`.
- Derived helpers: `isDarkMode`, `isProductionTheme`, `availableThemes`, `productionThemes`.

The provider also sets `data-theme="<key>"` and the `.theme-transitioning` class on `document.documentElement`, so CSS can react without additional JS hooks (`frontend/src/theme/context.tsx:253-340`).

Any component can call `useTheme()` to read tokens (e.g., `theme.colors.text.primary`) or to switch themes (`setThemeKey('light')`). React components such as `Settings > Appearance > ThemePicker` already do this to drive the UI (`frontend/src/components/settings/appearance/ThemePicker.tsx`).

## Theme Registry & Token Model

All Theme definitions live in `frontend/src/theme/registry.ts` and conform to the comprehensive interface in `frontend/src/theme/types.ts`. The model captures:

- **Metadata** – `key`, `name`, description, `isDark`, optional tagline.
- **Colors** – hierarchical background colors (with gradient endpoints and textures), text tiers, accent families (hot/cold/magenta plus gradient stops), semantic colors, border opacity ladder, interaction states, and gradient definitions (linear, radial, conic, multi-layer stacks).
- **Typography** – font families (UI/mono/display), size scale, weights, letter spacing, and line heights.
- **Layout tokens** – spacing scale and border radii.
- **Effects** – shadows, transition durations/easings, blur/opacity/backdrop-filter settings, blend modes, saturation hints, and named animations (`bgDrift`, `shineSweep`, `screenIn`, etc.).
- **Component tokens** – button variants, inputs, cards, badges, charts, progress bars, search input, navigation links, media thumbnails, scrollbar, and panel variants.

Production themes (`jelly`, `light`, `dark`) have bespoke token files under `frontend/src/theme/themes/`. Placeholder keys (`nord`, `dracula`, `minimal`, `highContrast`) are auto-generated via `createPlaceholderTheme()` so the infrastructure can exercise multiple options even before bespoke designs land. `getProductionThemes()` filters keys for UI pickers, while `DEFAULT_THEME_KEY` controls bootstrapping.

### Adding or Editing a Theme

1. Create or update a file under `frontend/src/theme/themes/` that exports a full `Theme`.
2. Register it inside the `themes` object in `frontend/src/theme/registry.ts`. If it is considered “production ready,” also add the key to `isProductionTheme()`’s allow list so `ThemePicker` surfaces it prominently.
3. Update backend validation in `backend/src/user_settings.rs::VALID_THEMES` (and adjust the default in `backend/src/db.rs` if needed) to keep persistence in sync; otherwise, the PATCH call will be rejected.
4. If the new theme introduces new token categories, add mappings in `frontend/src/theme/cssVariables.ts` so CSS receives the values, and extend `frontend/src/styles.css` as needed.

## CSS Variable Bridge

`frontend/src/theme/cssVariables.ts` maintains a single `CSS_VARIABLE_MAP` that links each CSS custom property to a safe accessor function. When the theme changes, `applyThemeToCSSVariables()`:

- Iterates over the map, calls each accessor, and collects valid updates.
- Applies them in one `requestAnimationFrame` batch to `root.style`, which minimizes layout thrash and ensures the entire UI flips in the same paint.
- Invokes an optional callback once the write completes.

Complementary helpers include `removeThemeCSSVariables()` (for cleanup/testing) and `getCSSVariableValue()` (useful when debugging mismatches). Global CSS (`frontend/src/styles.css`) references these variables (e.g., `var(--bg-main)`, `var(--accent-primary)`) and uses the `.theme-transitioning` class plus `prefers-reduced-motion` media queries to deliver smooth yet accessible transitions.

## Persistence & Backend Responsibilities

### Frontend Persistence Layer

- `THEME_STORAGE_KEY` (`'jellymover-theme'`) identifies the entry in `localStorage`.
- `getStoredTheme()` and `setStoredTheme()` read/write the key safely, validating against `ThemeKey`.
- `fetchUserThemePreference()` calls `apiGet<UserSettings>('/me/settings')` and surfaces a valid `ThemeKey | null`. Failures degrade gracefully to local-only behavior.
- `saveUserThemePreference()` issues `apiPatch<UserSettings>('/me/settings', { theme })`. Errors are logged but never block the UI, so switching remains instant even if the network is offline.

### Backend Storage

- `backend/src/main.rs` registers `GET` and `PATCH` routes at `/api/me/settings`.
- The handler delegates to `backend/src/user_settings.rs`, which reads/writes a single-row `user_settings` table. The schema (created in `backend/src/db.rs`) is:
  ```sql
  CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      theme TEXT NOT NULL DEFAULT 'jelly',
      updated_at INTEGER NOT NULL
  );
  ```
- `VALID_THEMES` currently includes `["jelly", "light", "dark"]`. Attempts to save other keys are rejected with `400 Invalid theme`, so remember to update this list when graduating a theme from placeholder to production.

Because the backend primarily validates and persists a single string, its role is intentionally minimal, but it is what enables cross-device theme sync whenever the same user opens the dashboard from a different browser.

## Using Themes in the UI

- **React components** pull the full token object via `const { theme } = useTheme()` and can directly consume values (e.g., `theme.components.card.shadow`).
- **Declarative styling** sticks to CSS variables. As soon as you add a mapping in `CSS_VARIABLE_MAP` and reference `var(--your-token)` in CSS, that element will respond to theme switches automatically.
- **Theme Picker** (`frontend/src/components/settings/appearance/ThemePicker.tsx`) reads `productionThemes`, highlights the active key, and calls `setThemeKey()` so users can switch with one click.
- **Debugging**: When `import.meta.env.DEV` is true, `App` logs the current theme metadata to the console. You can also inspect `<html data-theme="...">` in DevTools, query `localStorage.getItem('jellymover-theme')`, or call `getCSSVariableValue('--bg-main', theme)` inside a React component.

## Troubleshooting & Tips

- If CSS does not change when switching themes, confirm the variable has a mapping in `CSS_VARIABLE_MAP` and that your styles reference `var(--variable-name)`.
- When adding a new theme key, update **both** the frontend registry and the backend `VALID_THEMES` array. Forgetting the backend step will manifest as warnings from `saveUserThemePreference()` and `400` responses in the network tab.
- For automated tests or stories, you can pass `initialTheme` to `ThemeProvider` to force a specific theme without mutating the user's saved preference.
- Use `removeThemeCSSVariables()` if you need to reset the DOM between visual regression tests.

This architecture lets us iterate on visual design rapidly while keeping a strict contract between design tokens, CSS, and persistence. Stick to the steps outlined above when evolving the theming system to avoid regressions.
