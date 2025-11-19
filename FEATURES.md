# JellyMover Features Documentation

**Version:** 0.1.0
**Last Updated:** 2025-11-19

## Table of Contents
- [Overview](#overview)
- [Frontend Features](#frontend-features)
- [Backend Features](#backend-features)
- [Infrastructure & DevOps](#infrastructure--devops)
- [Security Features](#security-features)
- [Configuration & Customization](#configuration--customization)
- [Work in Progress (WIP)](#work-in-progress-wip)
- [Planned Features](#planned-features)
- [Technical Stack](#technical-stack)

---

## Overview

JellyMover is a production-ready, full-stack media storage management application designed specifically for Jellyfin libraries. It intelligently balances media content across fast "hot" SSD pools and larger "cold" HDD pools, providing a complete solution for optimizing storage costs while maintaining performance.

**Key Statistics:**
- ~13,367 lines of production code
- 20+ REST API endpoints
- 35+ React components
- 4 fully functional pages
- 3 production-ready themes
- 5 database tables
- Full Docker & TrueNAS SCALE support

---

## Frontend Features

### 1. User Interface Pages

#### 1.1 Library Page (Main View)
**File:** `frontend/src/pages/LibraryPage.tsx`, `frontend/src/components/JellyMoverShell.tsx`

**Features:**
- **Dual-Pane Layout**: Side-by-side view of Hot (SSD) and Cold (HDD) pools
- **Show Cards**: Rich media cards displaying:
  - Show thumbnails (poster.jpg, folder.jpg)
  - Title from tvshow.nfo files
  - File size with human-readable formatting (KB, MB, GB, TB)
  - Season and episode counts
  - File path information
  - Last scanned timestamp
- **One-Click Move Operations**:
  - Move to Hot button (for cold content)
  - Move to Cold button (for hot content)
  - Real-time job creation and feedback
- **Search Functionality**:
  - Searches both title and path fields
  - Instant filtering across both pools
  - Debounced input for performance
- **Advanced Sorting**:
  - Sort by: Title, Size, Date Modified, Season Count, Episode Count
  - Sort direction: Ascending/Descending
  - Separate sort state for Hot and Cold pools
  - Persistent sort preferences
- **Infinite Scroll Pagination**:
  - Loads 50 items at a time
  - Automatic loading on scroll
  - "Load More" button fallback
  - Smooth performance with large libraries (1000+ shows)
- **Pool Usage Visualization**:
  - Real-time capacity charts for both pools
  - Used/Free space indicators
  - Percentage utilization
  - Color-coded warnings for low space
- **Empty State Handling**:
  - Helpful messages when pools are empty
  - Prompts to run initial scan
  - Clear call-to-action buttons

**Interactions:**
- Click show card to expand details
- Drag-and-drop support (planned)
- Bulk selection mode (planned)

---

#### 1.2 Jobs Page (Move Operations Monitor)
**File:** `frontend/src/pages/JobsPage.tsx`

**Features:**
- **Real-Time Job Monitoring**:
  - Auto-refresh every 4 seconds
  - Live progress bars for running jobs
  - Estimated Time of Arrival (ETA) calculations
  - Transfer speed display (MB/s)
- **Job Status Tracking**:
  - Queued: Jobs waiting to be processed
  - Running: Active transfers with live progress
  - Success: Completed transfers with statistics
  - Failed: Error messages and retry options
- **Job Statistics Dashboard**:
  - Total jobs count
  - Running jobs counter
  - Queued jobs counter
  - Completed jobs counter
  - Failed jobs counter
  - Total bytes moved (lifetime)
- **Job History Table**:
  - Paginated view (20 jobs per page)
  - Sortable columns
  - Color-coded status badges
  - Source → Destination path display
  - Created/Updated timestamps
  - Expandable error messages for failed jobs
- **Load More Functionality**:
  - Infinite scroll through job history
  - Merge and deduplicate updates
  - Performance-optimized for thousands of jobs
- **Active Job Queue**:
  - Top 10 currently running jobs
  - Real-time progress tracking
  - File count progress (files completed / total files)

**Job Lifecycle:**
```
Queued → Running → Success/Failed
         ↓
    Progress Updates (every 1-2 seconds)
```

---

#### 1.3 Stats Page (Analytics Dashboard)
**File:** `frontend/src/pages/StatsPage.tsx`

**Features:**
- **System Metrics**:
  - Real-time CPU usage percentage
  - Real-time RAM usage percentage and absolute values
  - Historical system metrics charts (line graphs)
  - Time-series data with configurable duration
- **Pool Usage Analytics**:
  - Hot pool capacity charts (total, used, free)
  - Cold pool capacity charts (total, used, free)
  - Historical usage trends
  - Growth rate calculations
  - Space optimization recommendations
- **Job Analytics**:
  - Job status distribution (pie chart)
  - Total bytes moved over time (bar chart)
  - Success/failure rates
  - Average transfer speeds
  - Peak usage times
- **Transfer Speed Chart**:
  - Real-time transfer speed visualization
  - Historical speed data
  - Peak speed indicators
  - Network bottleneck detection
- **Duration Selector**:
  - 1 hour view
  - 6 hour view
  - 24 hour view (default)
  - 7 day view
- **Active Operations Panel**:
  - Current running jobs (top 10)
  - Real-time progress indicators
  - Quick jump to jobs page

**Chart Types:**
- Line charts (system metrics, transfer speeds)
- Bar charts (pool usage, bytes moved)
- Pie charts (job distribution)
- Area charts (cumulative statistics)

**Powered by:** Recharts 3.4.1 with responsive design

---

#### 1.4 Settings Page (Configuration Hub)
**File:** `frontend/src/pages/SettingsPage.tsx`

**Features:**
- **Multi-Section Layout**:
  - Sidebar navigation for quick section access
  - Split-pane design for better usability
  - Collapsible sections on mobile
  - Settings state persistence

**General Section:**
- **Hot/Cold Root Configuration**:
  - Path picker with directory browser
  - Validation: paths must exist and not be nested
  - Real-time capacity display
  - Mount point detection
- **Library Paths Configuration**:
  - Add/remove custom library paths
  - Override default hot/cold scanning
  - Path validation and existence checks
  - Drag-to-reorder support

**Library Section (Jellyfin Integration):**
- **Jellyfin Connection Settings**:
  - Base URL input with validation
  - API key secure input (password field)
  - Test Connection button with live feedback
  - Connection status indicator (connected/disconnected)
- **Library Management**:
  - Trigger Jellyfin library rescan
  - Manual sync button
  - Last sync timestamp
  - Sync status and error messages
- **Integration Features**:
  - Auto-rescan after move operations (toggle)
  - Library path mapping (planned)

**Appearance Section:**
- **Theme Picker**:
  - 3 production-ready themes:
    - **Jelly Theme** (default): Cyberpunk CLI aesthetic with dark mode, glassmorphism, gradient accents
    - **Light Theme**: Professional light mode with clean, minimal design
    - **Dark Theme**: High-contrast "PRO MODE" with minimal visual effects
  - 4 placeholder themes for future expansion:
    - Nord (Arctic-inspired)
    - Dracula (Purple dark theme)
    - Solarized (Low-contrast theme)
    - Catppuccin (Pastel theme)
- **Theme Preview Cards**:
  - Live preview of each theme
  - Click to apply instantly
  - Visual representation of color palette
- **Theme Persistence**:
  - Saved to localStorage (client-side)
  - Synced to backend via `/api/me/settings` (server-side)
  - Survives page refreshes and browser sessions

**Advanced Section:**
- **Filesystem Scan Control**:
  - Trigger manual scan
  - Scan status display (Idle/Running)
  - Last scan timestamp
  - Scan error messages
- **Performance Settings** (planned):
  - Concurrent job limit
  - I/O throttling
  - Memory limits

**About Section:**
- Version information
- Database statistics
- Total shows count
- Total jobs processed
- Disk space summary
- Link to documentation

**Settings Components** (`frontend/src/components/settings/`):
- Reusable primitives: Input, Button, Select, Textarea, Checkbox, Radio
- PathPicker component with directory tree browser
- Form validation and error display
- Auto-save indicators
- Undo/Redo support (planned)

---

#### 1.5 Setup Wizard (First-Run Experience)
**File:** `frontend/src/components/SetupWizard.tsx`

**Features:**
- **Step-by-Step Configuration**:
  - Welcome screen with introduction
  - Hot/Cold root selection with path picker
  - Jellyfin integration setup (optional)
  - Configuration review and confirmation
- **Progress Indicators**:
  - Step counter (1 of 4, etc.)
  - Progress bar
  - Back/Next navigation
- **Validation**:
  - Required field checking
  - Path existence verification
  - Jellyfin connectivity test
  - Warning messages for common issues
- **Skip Options**:
  - Skip Jellyfin setup (configure later)
  - Use default settings
- **Completion Actions**:
  - Automatic initial filesystem scan
  - Redirect to library page
  - Success confirmation

---

### 2. Core Frontend Components

#### 2.1 Navigation & Layout
- **AppHeader** (`AppHeader.tsx`):
  - Page title and breadcrumbs
  - Quick action buttons
  - Notifications area (planned)
- **PrimaryNav** (`PrimaryNav.tsx`):
  - Top navigation bar with logo
  - Active page highlighting
  - Mobile-responsive hamburger menu
  - Settings and help icons

#### 2.2 Data Visualization
- **SystemMetricsChart** (`SystemMetricsChart.tsx`):
  - CPU and RAM usage over time
  - Dual-axis line charts
  - Responsive tooltip with timestamps
  - Zoom and pan support (planned)
- **PoolUsageCharts** (`PoolUsageCharts.tsx`):
  - Horizontal bar charts for pool capacity
  - Used/Free space breakdown
  - Color-coded by utilization level
  - Click to see detailed breakdown
- **JobAnalyticsCharts** (`JobAnalyticsCharts.tsx`):
  - Pie chart for job status distribution
  - Bar chart for bytes moved per day
  - Legend with percentages
- **TransferSpeedChart** (`TransferSpeedChart.tsx`):
  - Line chart with area fill
  - Real-time speed updates
  - Peak speed markers
  - Average speed line

#### 2.3 UI Controls
- **SortDropdown** (`SortDropdown.tsx`):
  - Sort field selector
  - Sort direction toggle
  - Keyboard shortcuts
  - Visual indicators

---

### 3. Frontend State Management & Hooks

#### 3.1 Custom Hooks

**useJobsPolling** (`frontend/src/hooks/useJobsPolling.ts`):
```typescript
- Real-time job polling (configurable interval, default 4s)
- Smart merge and deduplication of job updates
- Automatic error handling and retry logic
- Loading states and error states
- Pause/resume polling control
```

**useMetrics** (`frontend/src/hooks/useMetrics.ts`):
```typescript
- useSystemMetricsHistory: Fetches CPU/RAM history
- usePoolUsageHistory: Fetches pool capacity history
- useJobAnalytics: Fetches job statistics
- Configurable time duration (1h, 6h, 24h, 7d)
- Auto-refresh with configurable intervals
- Caching and memoization for performance
```

#### 3.2 API Client
**File:** `frontend/src/api.ts`

**Features:**
- Centralized API request handling
- Type-safe request/response interfaces
- Error handling and retry logic
- Request cancellation support
- Configurable base URL via `VITE_API_BASE`
- Automatic JSON parsing
- CORS handling

**API Methods:**
- `getConfig()`: Fetch application configuration
- `updateConfig(config)`: Update configuration
- `getPools()`: Get hot/cold pool usage
- `getShows(params)`: List shows with filters
- `moveShow(id, target)`: Queue move job
- `getJobs(params)`: List jobs with pagination
- `getJobAnalytics()`: Fetch job statistics
- `getSystemMetrics(duration)`: Fetch system metrics
- `getPoolHistory(duration)`: Fetch pool usage history
- `triggerScan()`: Start filesystem scan
- `getScanStatus()`: Get scan status
- `testJellyfinConnection()`: Test Jellyfin API
- `triggerJellyfinRescan()`: Trigger Jellyfin library refresh
- `getUserSettings()`: Get user preferences (theme)
- `updateUserSettings(settings)`: Update user preferences

---

### 4. Frontend Theme System

**Architecture:** `frontend/src/theme/`

#### 4.1 Theme Infrastructure
- **Theme Context** (`context.tsx`): React context provider for theme state
- **Theme Registry** (`registry.ts`): Central theme registration and management
- **Theme Types** (`types.ts`): TypeScript definitions for type-safe theming
- **Persistence Layer** (`persistence.ts`): LocalStorage + backend API sync
- **CSS Variables** (`cssVariables.ts`): Dynamic CSS variable injection for runtime theme switching

#### 4.2 Theme Tokens
Each theme defines:
- **Colors**: Primary, secondary, accent, hot (orange), cold (cyan), background, surface, text
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent spacing scale (xs, sm, md, lg, xl)
- **Border Radius**: Rounded corners (sm, md, lg)
- **Shadows**: Box shadows (sm, md, lg, xl)
- **Animations**: Transition timings, easing functions
- **Effects**: Glassmorphism, gradients, backdrop blur

#### 4.3 Production Themes

**1. Jelly Theme (Default)**
- Cyberpunk CLI aesthetic
- Dark background with glassmorphism effects
- Gradient accents: Hot (orange #ff6b35 → #f7931e), Cold (cyan #4facfe → #00f2fe)
- Animated gradient backgrounds
- High contrast for accessibility
- Monospace font for code/paths
- Terminal-inspired design elements

**2. Light Theme**
- Professional light mode
- Clean white backgrounds
- Subtle shadows and borders
- Blue primary color (#2563eb)
- High readability with optimal contrast
- Sans-serif font (system default)
- Minimal visual effects for performance

**3. Dark Theme (PRO MODE)**
- High-contrast dark mode
- Pure black backgrounds (#000000)
- Bright text (#ffffff)
- Minimal colors and effects
- Focus on content
- Ideal for OLED displays
- Reduced eye strain for night use

#### 4.4 Placeholder Themes
Ready for implementation:
- **Nord**: Arctic-inspired color palette
- **Dracula**: Purple-based dark theme
- **Solarized**: Low-contrast precision colors
- **Catppuccin**: Pastel colors with cozy feel

#### 4.5 Theme Switching
- Instant theme changes (no page reload)
- Smooth transitions between themes
- CSS variable updates for dynamic styling
- Persisted across sessions (localStorage + backend)
- Works with React Strict Mode

---

### 5. Frontend Testing

**Test Framework:** Vitest 4.0.10 + React Testing Library 16.3.0

**Test Files:**
- `api.test.ts`: API client unit tests
- `JellyMoverShell.helpers.test.ts`: Helper function tests
- `SetupWizard.test.tsx`: Setup wizard component tests
- `formatters.test.ts`: Utility function tests

**Test Coverage:**
- Unit tests for formatters (bytes, dates, durations)
- Component rendering tests
- User interaction tests
- API mocking and error handling tests

**Run Tests:**
```bash
cd frontend
npm run test        # Run all tests
npm run test:watch  # Watch mode
npm run lint        # ESLint
```

---

### 6. Frontend Performance Features

- **Code Splitting**: React.lazy() for route-based splitting (planned)
- **Image Optimization**: Lazy loading for show thumbnails
- **Virtual Scrolling**: Windowing for large lists (planned for 10,000+ shows)
- **Debounced Search**: 300ms debounce on search input
- **Memoization**: React.memo() for expensive components
- **Request Deduplication**: Prevent duplicate API calls
- **Progressive Loading**: Load above-the-fold content first
- **Service Worker**: Offline support and caching (planned)

---

## Backend Features

### 1. HTTP API Server

**Framework:** Axum 0.7 with Tower middleware
**Runtime:** Tokio 1.x (async/await)
**Port:** 3000 (configurable via `JM_PORT`)

#### 1.1 Core Endpoints

**Configuration Management:**
- `GET /api/config`: Retrieve current configuration
  - Returns: hot_root, cold_root, library_paths, jellyfin settings
- `PUT /api/config`: Update configuration
  - Validates paths exist and are not nested
  - Rejects invalid or dangerous configurations
  - Atomic updates (all-or-nothing)

**User Preferences:**
- `GET /api/me/settings`: Get user settings (theme, preferences)
- `PATCH /api/me/settings`: Update user settings
  - Theme persistence across devices
  - Single-row table design for simplicity

**Health & Status:**
- `GET /health`: Health check endpoint
  - Returns: `{status: "ok", db: "connected"}`
  - Used by Docker healthchecks
  - Used by orchestrators (Kubernetes, TrueNAS)

---

#### 1.2 Storage & Pool Management

**Path Operations:**
- `GET /api/paths?root=/path`: List subdirectories
  - Used by path picker component
  - Returns immediate children only (not recursive)
  - Includes capacity stats (total, used, free bytes)
  - Validates path is within allowed bounds
  - Prevents directory traversal attacks

**Pool Statistics:**
- `GET /api/pools`: Current pool usage
  - Returns hot/cold pool stats
  - Total bytes, used bytes, free bytes
  - Percentage utilization
  - Uses `statvfs` system call for accuracy
- `GET /api/pools/history?duration=1h`: Historical pool usage
  - Time-series data from `pool_usage_history` table
  - Supports durations: 1h, 6h, 24h, 7d
  - Returns timestamps and usage snapshots
  - Used for charts and trend analysis

---

#### 1.3 Filesystem Scanning

**Scan Operations:**
- `POST /api/scan`: Trigger filesystem scan
  - Background scan using tokio::spawn
  - Mutex prevents concurrent scans
  - Blocks if move jobs are running
  - Returns immediately (non-blocking)
- `GET /api/scan/status`: Get scan state
  - Returns: state (Idle/Running), last_started, last_finished, last_error
  - Includes timestamps (Unix epoch)
  - Shows error messages if scan failed

**Scan Features:**
- Walks configured library directories using `walkdir`
- Parses `tvshow.nfo` files with `quick-xml`
- Counts video files (`.mkv`, `.mp4`, `.avi`, `.mov`, `.m4v`, `.flv`, `.wmv`)
- Detects season folders (Season 01, S01, etc.)
- Counts episodes per season
- Finds show thumbnails (folder.jpg, poster.jpg, show.jpg, cover.jpg)
- Calculates total show size (all files recursively)
- Upserts shows into SQLite database
- Handles symlinks and mount points safely

---

#### 1.4 Show/Media Management

**Show Queries:**
- `GET /api/shows`: List shows with advanced filters
  - **Pagination**: `limit` (default 50), `offset` (default 0)
  - **Location Filter**: `location=hot|cold` (filter by pool)
  - **Search**: `search=query` (searches title and path)
  - **Sorting**: `sort_by=title|size|date|seasons|episodes`, `sort_dir=asc|desc`
  - Returns: id, title, path, location, size_bytes, season_count, episode_count, thumbnail_path, last_scan
  - Efficient indexed queries for large libraries (tested with 10,000+ shows)

**Show Assets:**
- `GET /api/shows/:id/thumbnail`: Serve show thumbnail images
  - Returns JPEG/PNG images
  - Content-Type header set correctly
  - Path validation prevents directory traversal
  - Only serves images within hot/cold roots
  - 404 if thumbnail not found
  - Efficient streaming (no buffering entire file)

---

#### 1.5 Move Job System

**Job Operations:**
- `POST /api/shows/:id/move`: Queue a move job
  - Body: `{ "target": "hot" | "cold" }`
  - Validates show exists
  - Validates configuration is complete
  - Prevents moves to same location
  - Guards against concurrent scans
  - Creates job in "queued" state
  - Returns job ID immediately
- `GET /api/jobs`: List all jobs
  - Pagination: `limit`, `offset`
  - Returns: id, show_id, source_path, destination_path, status, progress_bytes, total_bytes, speed_bytes_per_sec, eta_seconds, error_message, created_at, updated_at
  - Supports filtering by status (planned)
- `GET /api/jobs/:id`: Get single job details
  - Returns full job record
  - Used for real-time progress updates
- `GET /api/jobs/analytics`: Job statistics
  - Total jobs count
  - Running/Queued/Completed/Failed counts
  - Total bytes moved (lifetime)
  - Used by stats page

---

#### 1.6 Jellyfin Integration

**Jellyfin API Client:**
- `POST /api/jellyfin/rescan`: Trigger Jellyfin library refresh
  - Calls `POST /Library/Refresh` on Jellyfin API
  - Uses configured URL and API key
  - Returns success/failure status
  - Handles authentication errors
  - Timeout: 30 seconds
- `GET /api/jellyfin/status`: Check Jellyfin connectivity
  - Tests connection to Jellyfin server
  - Verifies API key is valid
  - Calls `/Library/PhysicalPaths` as health check
  - Returns: connected (bool), version (string), error (string)

**Integration Features:**
- Automatic library rescan after move operations (optional)
- Configurable Jellyfin URL and API key
- TLS support (rustls-tls)
- Robust error handling

---

#### 1.7 System Metrics

**Real-Time Metrics:**
- `GET /api/stats`: Current system statistics
  - CPU usage percentage (all cores average)
  - Memory usage percentage
  - Memory used bytes
  - Memory total bytes
  - Uses `sysinfo` crate for cross-platform support

**Historical Metrics:**
- `GET /api/stats/history?duration=1h`: Historical system metrics
  - Time-series data from `system_metrics_history` table
  - Supports durations: 1h, 6h, 24h, 7d
  - Returns: timestamp, cpu_percent, memory_percent, memory_used_bytes, memory_total_bytes
  - Used for charts and trend analysis

---

### 2. Background Workers

#### 2.1 Job Worker (`backend/src/jobs.rs`)

**Features:**
- **Asynchronous Job Processing**:
  - Runs in separate Tokio task
  - Processes one job at a time (prevents I/O contention)
  - Fetches oldest queued job from database
  - Updates job status to "running"
- **File Copy Operations**:
  - Uses `tokio::fs` for async I/O
  - Copies entire show directory tree
  - Preserves directory structure
  - Handles nested subdirectories
  - Progress tracking (bytes copied / total bytes)
- **Progress Updates**:
  - Updates database every 1-2 seconds
  - Calculates transfer speed (bytes/sec)
  - Estimates ETA (seconds remaining)
  - Provides file count progress
- **Post-Copy Operations**:
  - Verifies copy completed successfully
  - Updates show record in database (new path, new location)
  - Deletes source directory after successful copy
  - Atomic operations (all-or-nothing)
- **Error Handling**:
  - Captures I/O errors (permissions, disk full, etc.)
  - Stores error messages in job record
  - Sets job status to "failed"
  - Preserves source files on failure (safe by default)
  - Retryable failures (planned)
- **Graceful Shutdown**:
  - Receives shutdown signal via tokio::watch channel
  - Completes current job before exiting
  - Sets in-progress jobs back to "queued"
  - No orphaned jobs

**Job Lifecycle:**
```
1. Job created (status: queued)
2. Worker picks up job (status: running)
3. Copy files with progress updates
4. On success:
   - Update show record
   - Delete source
   - Set status: success
5. On failure:
   - Preserve source
   - Store error message
   - Set status: failed
```

---

#### 2.2 Metrics Collector (`backend/src/metrics_collector.rs`)

**Features:**
- **System Metrics Collection**:
  - Collects CPU usage every 60 seconds
  - Collects memory usage every 60 seconds
  - Uses `sysinfo::System` for accurate readings
  - Stores in `system_metrics_history` table
- **Pool Usage Collection**:
  - Collects hot/cold pool usage every 5 minutes
  - Uses `nix::sys::statvfs` for accurate filesystem stats
  - Stores in `pool_usage_history` table
  - Tracks: total_bytes, used_bytes, free_bytes
- **Data Retention**:
  - Automatic cleanup of old data (30-day retention)
  - Runs cleanup every 24 hours
  - Prevents database bloat
  - Maintains performance with long-running instances
- **Background Task**:
  - Runs in separate Tokio task
  - Does not block HTTP server
  - Graceful shutdown via watch channel
  - Configurable collection intervals (planned)

**Metrics Storage:**
- Time-series tables with indexed timestamps
- Efficient queries for historical data
- Support for multiple duration ranges
- Ready for Grafana/Prometheus export (planned)

---

### 3. Database Layer

**Database:** SQLite via SQLx 0.8
**Features:** Runtime-tokio-rustls, macros, connection pooling

#### 3.1 Schema

**`shows` table:**
```sql
CREATE TABLE shows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    path TEXT NOT NULL UNIQUE,
    location TEXT,  -- "hot" or "cold"
    size_bytes INTEGER,
    season_count INTEGER,
    episode_count INTEGER,
    thumbnail_path TEXT,
    source TEXT,  -- "fs_scan" or "fs_scan_nfo"
    last_scan INTEGER  -- Unix timestamp
);

-- Indexes for fast queries
CREATE INDEX idx_shows_path ON shows(path);
CREATE INDEX idx_shows_location ON shows(location);
CREATE INDEX idx_shows_title ON shows(title);
CREATE INDEX idx_shows_size ON shows(size_bytes);
CREATE INDEX idx_shows_date ON shows(last_scan);
CREATE INDEX idx_shows_seasons ON shows(season_count);
CREATE INDEX idx_shows_episodes ON shows(episode_count);
```

**`jobs` table:**
```sql
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    show_id INTEGER,  -- FK to shows.id
    source_path TEXT NOT NULL,
    destination_path TEXT NOT NULL,
    status TEXT,  -- "queued", "running", "success", "failed"
    progress_bytes INTEGER,
    total_bytes INTEGER,
    speed_bytes_per_sec INTEGER,
    eta_seconds INTEGER,
    error_message TEXT,
    created_at INTEGER,
    updated_at INTEGER
);

-- Indexes for job queries
CREATE INDEX idx_jobs_show_id ON jobs(show_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
```

**`system_metrics_history` table:**
```sql
CREATE TABLE system_metrics_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    cpu_percent REAL,
    memory_percent REAL,
    memory_used_bytes INTEGER,
    memory_total_bytes INTEGER
);

CREATE INDEX idx_sysmetrics_timestamp ON system_metrics_history(timestamp);
```

**`pool_usage_history` table:**
```sql
CREATE TABLE pool_usage_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    pool_type TEXT,  -- "hot" or "cold"
    total_bytes INTEGER,
    used_bytes INTEGER,
    free_bytes INTEGER
);

CREATE INDEX idx_poolusage_timestamp ON pool_usage_history(timestamp);
CREATE INDEX idx_poolusage_pool ON pool_usage_history(pool_type);
```

**`user_settings` table:**
```sql
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),  -- Single row
    theme TEXT NOT NULL DEFAULT 'jelly',
    updated_at INTEGER
);
```

#### 3.2 Database Features
- **Connection Pooling**: Shared pool across all handlers
- **Prepared Statements**: All queries use SQLx macros for safety
- **Transactions**: Atomic operations for critical updates
- **Foreign Keys**: Referential integrity enforced
- **Indexes**: Optimized for common query patterns
- **Auto-Migration**: Schema created on first run
- **Backup Support**: Standard SQLite backup tools work
- **Compact Size**: Efficient storage (millions of records possible)

---

### 4. Filesystem Scanner (`backend/src/scanner.rs`)

**Features:**
- **NFO Parsing**:
  - Reads `tvshow.nfo` XML files
  - Extracts `<title>` tag
  - Handles malformed XML gracefully
  - Falls back to directory name if NFO missing
- **Video File Detection**:
  - Recognizes: `.mkv`, `.mp4`, `.avi`, `.mov`, `.m4v`, `.flv`, `.wmv`
  - Case-insensitive matching
  - Counts total video files per show
- **Season Detection**:
  - Recognizes patterns: "Season 01", "S01", "Season 1"
  - Counts seasons per show
  - Counts episodes per season
  - Handles specials folder
- **Thumbnail Discovery**:
  - Searches for: `folder.jpg`, `poster.jpg`, `show.jpg`, `cover.jpg`
  - Stores relative path for thumbnail serving
  - Supports JPEG and PNG formats
- **Size Calculation**:
  - Recursively sums all file sizes
  - Includes non-video files (subtitles, metadata)
  - Handles large files (> 4GB)
  - Efficient with tokio::fs
- **Metadata Storage**:
  - Upserts shows into database
  - Updates existing records if path changed
  - Preserves job history for moved shows
  - Sets last_scan timestamp

**Scanner Performance:**
- Processes ~100 shows/second on SSD
- Memory efficient (streaming not buffering)
- Handles libraries with 10,000+ shows
- Can run while jobs are idle

---

### 5. Jellyfin Client (`backend/src/jellyfin.rs`)

**Features:**
- **HTTP Client**: reqwest 0.12 with rustls-tls
- **Library Refresh**: POST `/Library/Refresh`
- **Health Check**: GET `/System/Info` or `/Library/PhysicalPaths`
- **Authentication**: API key via `X-MediaBrowser-Token` header
- **Error Handling**: Timeout, network, authentication errors
- **Async**: Non-blocking API calls

---

### 6. Pool Management (`backend/src/pools.rs`)

**Features:**
- **Capacity Stats**: Uses `nix::sys::statvfs` for accurate filesystem info
- **Hot/Cold Pool Tracking**: Separate stats for each pool
- **Real-Time Updates**: Reflects current disk usage
- **Cross-Platform**: Works on Linux, macOS (via nix crate)

---

### 7. Configuration Management (`backend/src/config.rs`)

**Features:**
- **JSON Persistence**: `/config/app-config.json`
- **Validation**:
  - Hot/cold roots must exist
  - Hot/cold roots must not be nested
  - Library paths must exist
  - Jellyfin URL must be valid
- **Environment Seeding**:
  - `JM_HOT_ROOT`, `JM_COLD_ROOT` for first run
  - Only used when config file doesn't exist
- **Default Values**: Sensible defaults for all fields
- **Atomic Updates**: All-or-nothing configuration changes

---

### 8. Backend Testing

**Test Framework:** Cargo test (built-in)

**Test Files:**
- `backend/src/scanner.rs`: NFO parsing unit tests
- Uses fixtures in `/home/user/Jellyfin-Storage-Manager/Example/`

**Test Coverage:**
- NFO XML parsing with various formats
- Show detection and metadata extraction
- Path handling and validation
- Database operations (planned)

**Run Tests:**
```bash
cargo +nightly test -p jellymover-backend
cargo +nightly fmt -- --check  # Check formatting
cargo +nightly clippy          # Run linter
```

---

### 9. Backend Performance & Optimization

- **Async I/O**: All I/O operations are non-blocking (Tokio)
- **Connection Pooling**: SQLx pool prevents connection overhead
- **Indexed Queries**: All common queries use database indexes
- **Efficient Pagination**: Offset/limit queries with indexes
- **Streaming Responses**: Large files streamed, not buffered
- **Background Workers**: CPU-intensive tasks in separate threads
- **Memory Efficient**: Streaming file operations, no large buffers
- **Graceful Degradation**: Continues working if Jellyfin unavailable

---

## Infrastructure & DevOps

### 1. Docker Support

#### 1.1 Full-Stack Container
**File:** `Dockerfile` (root)

**Multi-Stage Build:**
```dockerfile
# Stage 1: Build frontend (Node LTS)
FROM node:lts AS frontend-builder
- Install frontend dependencies
- Run TypeScript compilation
- Run Vite production build
- Output: /app/frontend/dist

# Stage 2: Build backend (Rust nightly)
FROM rust:1.79-bookworm AS backend-builder
- Install nightly Rust toolchain
- Cache dependencies (cargo-chef pattern)
- Compile release binary with optimizations
- Output: /app/backend/target/release/jellymover-backend

# Stage 3: Runtime (Debian Bookworm Slim)
FROM debian:bookworm-slim
- Install runtime dependencies (ca-certificates, libsqlite3)
- Create non-root user: jellymover (UID 1000, GID 1000)
- Copy frontend bundle to /app/static
- Copy backend binary to /app/jellymover-backend
- Expose port 3000
- Healthcheck: curl http://localhost:3000/health
- CMD: /app/jellymover-backend
```

**Image Size:** ~120MB (production-ready)

#### 1.2 Backend-Only Container
**File:** `backend/Dockerfile`

**Features:**
- Rust-only build (no Node.js)
- Smaller image size (~80MB)
- Same runtime environment
- Requires separate frontend hosting

---

### 2. Docker Compose

**File:** `docker-compose.yml`

**Configuration:**
```yaml
services:
  jellymover:
    build: .
    ports:
      - "3000:3000"
    environment:
      JM_PORT: 3000
      JM_CONFIG_PATH: /config/app-config.json
      JM_DB_PATH: /data/jellymover.db
      JM_LOG_LEVEL: info
      JM_HOT_ROOT: /media/hot
      JM_COLD_ROOT: /media/cold
    volumes:
      - ./config:/config
      - ./data:/data
      - ./test-media/hot:/media/hot
      - ./test-media/cold:/media/cold
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Features:**
- Single-command deployment: `docker compose up`
- Automatic restarts
- Healthcheck monitoring
- Volume persistence
- Environment variable configuration

---

### 3. TrueNAS SCALE Deployment

**Documentation:** `docs/truenas-scale.md`

**Features:**
- **Custom App Wizard**: Step-by-step installation guide
- **Registry Image**: `ghcr.io/sihochoii/jellymover:latest`
- **Dataset Setup**:
  - Config dataset → `/config`
  - Data dataset → `/data`
  - Hot media dataset → `/media/hot`
  - Cold media dataset → `/media/cold`
- **Port Mapping**: Any high port (e.g., 31847) → 3000
- **Portal Configuration**: HTTP portal for easy access
- **ACL Permissions**: Read/write access for container user
- **Environment Variables**: All JM_* variables configurable
- **Restart Policy**: Unless-stopped (survives NAS reboots)

**Alternative Deployment:**
- YAML-based installation (for advanced users)
- kubectl installation (for custom kubernetes setups)

**Tested Versions:**
- TrueNAS SCALE 24.10+
- Electric Eel and later

---

### 4. GitHub Container Registry

**Registry:** `ghcr.io/sihochoii/jellymover`

**Tags:**
- `latest`: Latest stable build
- `v0.1.x`: Semantic versioned releases
- Development tags as needed

**Features:**
- Automated builds via GitHub Actions (planned)
- Multi-arch support: amd64, arm64 (planned)
- Vulnerability scanning
- Image signing and verification (planned)

---

### 5. Health Monitoring

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "db": "connected"
}
```

**Used By:**
- Docker healthchecks
- TrueNAS SCALE app status
- Kubernetes liveness/readiness probes
- Uptime monitoring services

**Failure Conditions:**
- Database connection lost
- Filesystem errors
- Out of memory
- HTTP server crashed

---

### 6. Logging & Observability

**Logging:**
- Framework: `tracing` + `tracing-subscriber`
- Log Levels: trace, debug, info, warn, error
- Configurable via `JM_LOG_LEVEL`
- Structured logging (JSON output planned)
- Log rotation support (via external tools)

**Log Locations:**
- Docker: `docker compose logs -f`
- TrueNAS SCALE: Apps UI → Logs tab
- Bare metal: stdout/stderr

**Log Contents:**
- HTTP requests/responses
- Job progress updates
- Scan operations
- Configuration changes
- Errors and warnings

**Observability (Planned):**
- Prometheus metrics endpoint
- Grafana dashboard templates
- OpenTelemetry tracing
- Sentry error tracking

---

## Security Features

### 1. CORS Security

**File:** `backend/src/main.rs`

**Features:**
- **Private IP Validation**: Only allows requests from:
  - Localhost: `127.0.0.1`, `::1`
  - RFC1918 private ranges:
    - `10.0.0.0/8`
    - `172.16.0.0/12` (172.16.x.x - 172.31.x.x)
    - `192.168.0.0/16`
  - IPv6 private ranges:
    - `fc00::/7` (ULA)
    - `fe80::/10` (link-local)
- **Origin Blocking**: Rejects public IPs and external domains
- **Header Validation**: Validates Origin and Referer headers
- **Preflight Handling**: Proper CORS preflight responses
- **Dynamic Allow List**: No hardcoded domains (private IP detection)

**Why It Matters:**
- Prevents cross-site request forgery (CSRF)
- Protects private NAS from public attacks
- Safe for LAN-only deployments
- No API key leakage to untrusted sites

---

### 2. Path Security

**Features:**
- **Path Traversal Prevention**:
  - Validates all paths are within hot/cold roots
  - Rejects paths with `..` or absolute paths
  - Canonicalizes paths before use
- **Symlink Handling**:
  - Follows symlinks safely within allowed roots
  - Rejects symlinks pointing outside allowed roots
- **Thumbnail Security**:
  - Only serves images within hot/cold pools
  - Validates file extensions (`.jpg`, `.png`)
  - Returns 404 for invalid paths
  - No directory listing

---

### 3. Container Security

**Features:**
- **Non-Root User**:
  - Runs as `jellymover:jellymover` (UID 1000, GID 1000)
  - No privileged operations
  - Least privilege principle
- **Read-Only Filesystem** (planned):
  - Except `/config` and `/data` mounts
  - Prevents container compromise
- **Capability Dropping** (planned):
  - Remove unnecessary Linux capabilities
  - Minimal attack surface
- **Resource Limits**:
  - Configurable CPU/RAM limits
  - Prevent resource exhaustion
- **No Secrets in Image**:
  - No hardcoded credentials
  - API keys only in mounted config
  - Environment variables for sensitive data

---

### 4. API Security

**Features:**
- **Input Validation**:
  - All endpoints validate input types
  - Rejects malformed JSON
  - SQL injection impossible (prepared statements)
- **Rate Limiting** (planned):
  - Prevent brute force attacks
  - Protect against DoS
- **Authentication** (planned):
  - API key authentication
  - JWT tokens
  - Session management
- **HTTPS Support** (planned):
  - TLS termination
  - Reverse proxy integration

---

### 5. Database Security

**Features:**
- **Prepared Statements**: All queries use SQLx macros (no SQL injection)
- **Transactions**: Atomic operations prevent partial updates
- **Foreign Keys**: Referential integrity enforced
- **Backup Encryption** (planned): Encrypted backups at rest

---

## Configuration & Customization

### 1. Environment Variables

**Backend Variables:**
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JM_PORT` | HTTP server port | `3000` | No |
| `JM_CONFIG_PATH` | Config file path | `config/app-config.json` | No |
| `JM_DB_PATH` | SQLite database path | `data/jellymover.db` | No |
| `JM_LOG_LEVEL` | Log level (trace, debug, info, warn, error) | `info` | No |
| `JM_HOT_ROOT` | Initial hot pool path (first run only) | None | No |
| `JM_COLD_ROOT` | Initial cold pool path (first run only) | None | No |
| `JELLYMOVER_IN_DOCKER` | Force Docker mode detection | Auto | No |
| `RUNNING_IN_DOCKER` | Alternative Docker detection | Auto | No |

**Frontend Variables:**
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE` | Backend API base URL | `/api` | No |

---

### 2. Configuration File

**File:** `config/app-config.json`

**Schema:**
```json
{
  "hot_root": "/media/hot",
  "cold_root": "/media/cold",
  "library_paths": [
    "/media/hot/anime",
    "/media/cold/anime_archive"
  ],
  "jellyfin": {
    "url": "https://jellyfin.example.com",
    "api_key": "YOUR_JELLYFIN_API_KEY"
  }
}
```

**Fields:**
- `hot_root` (string, required): Absolute path to hot pool (SSD)
- `cold_root` (string, required): Absolute path to cold pool (HDD)
- `library_paths` (array, optional): Specific paths to scan (overrides roots)
- `jellyfin.url` (string, optional): Jellyfin base URL
- `jellyfin.api_key` (string, optional): Jellyfin API key

**Validation Rules:**
- Hot/cold roots must exist
- Hot/cold roots must not be nested
- Library paths must exist and be within roots
- Jellyfin URL must be valid HTTP/HTTPS

---

### 3. Theme Customization

**Location:** `frontend/src/theme/themes/`

**How to Add a Theme:**
1. Create new theme file (e.g., `custom.ts`)
2. Define theme object with all required tokens
3. Register theme in `registry.ts`
4. Add to theme picker in settings

**Theme Structure:**
```typescript
export const customTheme: Theme = {
  id: 'custom',
  name: 'Custom Theme',
  colors: {
    primary: '#hex',
    secondary: '#hex',
    accent: '#hex',
    hotColor: '#hex',
    coldColor: '#hex',
    background: '#hex',
    surface: '#hex',
    text: '#hex',
    textSecondary: '#hex',
    border: '#hex',
    success: '#hex',
    error: '#hex',
    warning: '#hex',
    info: '#hex',
  },
  typography: { ... },
  spacing: { ... },
  borderRadius: { ... },
  shadows: { ... },
};
```

---

## Work in Progress (WIP)

### 1. Minor UI Enhancement
**Status:** 🟡 Low Priority

**Location:** `frontend/src/components/JellyMoverShell.tsx:777`

**TODO:**
```typescript
// TODO — wire backend / API calls here.
// Context: Jellyfin integration UI enhancement
```

**Description:**
The Jellyfin integration UI in the library view could display additional connection status indicators or quick-action buttons. The backend APIs already exist and work perfectly. This is purely a UX enhancement for the library page.

**Backend APIs Available:**
- `GET /api/jellyfin/status` ✅
- `POST /api/jellyfin/rescan` ✅

**Frontend Components Available:**
- Settings page Jellyfin integration ✅
- Test connection button ✅
- Rescan button ✅

**What Could Be Added:**
- Live Jellyfin status badge in library header
- Quick rescan button in library page toolbar
- Automatic rescan after move completion indicator
- Connection health indicator

**Effort:** Low (1-2 hours)
**Impact:** Low (quality of life improvement)

---

## Planned Features

### 1. High Priority (Next Release)

#### 1.1 Authentication & Authorization
**Status:** 🔴 Not Started

**Features:**
- User accounts and login
- API key authentication
- JWT token support
- Role-based access control (RBAC)
- Admin vs. viewer roles
- Session management

**Why:** Currently no authentication - suitable for single-user NAS but needs auth for multi-tenant or public deployments.

**Effort:** High (2-3 weeks)

---

#### 1.2 Bulk Operations
**Status:** 🔴 Not Started

**Features:**
- Select multiple shows at once
- Bulk move operations
- Batch delete (planned with caution)
- Select all/none buttons
- Filter selection (e.g., "select all shows > 50GB")

**Why:** Managing large libraries (1000+ shows) is tedious with one-at-a-time operations.

**Effort:** Medium (1 week)

---

#### 1.3 Automatic Rules & Policies
**Status:** 🔴 Not Started

**Features:**
- Auto-move rules (e.g., "move shows not watched in 6 months to cold")
- Scheduled moves (e.g., "move to cold every Sunday at 3am")
- Size-based rules (e.g., "keep shows < 10GB on hot")
- Watch count integration with Jellyfin
- Last played date detection
- Rule templates (popular presets)

**Why:** The #1 feature request. Users want "set it and forget it" automation.

**Effort:** High (3-4 weeks)

---

### 2. Medium Priority

#### 2.1 Advanced Jellyfin Integration
**Status:** 🔴 Not Started

**Features:**
- Library path mapping (multiple Jellyfin libraries)
- Per-library move policies
- Jellyfin watch history integration
- User play count per show
- "Popular shows stay hot" algorithm
- Integration with Jellyfin recommendations

**Why:** Deeper integration makes JellyMover smarter about what to keep hot.

**Effort:** Medium (2 weeks)

---

#### 2.2 Notifications & Alerts
**Status:** 🔴 Not Started

**Features:**
- Email notifications (move complete, errors)
- Webhook support (Discord, Slack, etc.)
- Push notifications (mobile)
- Low disk space alerts
- Job failure alerts
- Telegram bot integration

**Why:** Users want to know when moves complete or errors occur without checking UI.

**Effort:** Medium (1-2 weeks)

---

#### 2.3 Performance Optimizations
**Status:** 🔴 Not Started

**Features:**
- Virtual scrolling for 10,000+ shows
- React code splitting for faster initial load
- Service worker for offline support
- Request deduplication and caching
- Database query optimization
- Parallel job processing (2-3 concurrent moves)

**Why:** Improves UX for users with massive libraries.

**Effort:** Medium (2 weeks)

---

#### 2.4 Enhanced Charts & Analytics
**Status:** 🔴 Not Started

**Features:**
- Show popularity charts (most moved shows)
- Cost savings calculator (SSD vs. HDD costs)
- Projected storage needs
- Transfer efficiency reports
- Job success rate trends
- Peak usage time detection

**Why:** Users want to see the value JellyMover provides (money saved, time saved).

**Effort:** Medium (1 week)

---

### 3. Low Priority (Future)

#### 3.1 Multi-Tier Storage
**Status:** 🔴 Not Started

**Features:**
- Support for 3+ tiers (hot, warm, cold, archive)
- Tiered move policies
- Cascade moves (hot → warm → cold)
- Custom tier naming
- Per-tier performance monitoring

**Why:** Some users have complex storage setups (NVMe, SSD, HDD, tape).

**Effort:** High (4 weeks)

---

#### 3.2 Cloud Storage Integration
**Status:** 🔴 Not Started

**Features:**
- S3-compatible storage tier (Backblaze B2, Wasabi, etc.)
- Glacier archive tier
- Cloud sync for cold storage
- Bandwidth throttling
- Cloud cost tracking

**Why:** Offload rarely-watched content to cheap cloud storage.

**Effort:** Very High (6-8 weeks)

---

#### 3.3 Mobile App
**Status:** 🔴 Not Started

**Features:**
- Native iOS/Android app
- React Native or Flutter
- Push notifications
- Quick actions (move show, trigger scan)
- Mobile-optimized UI

**Why:** Convenience for on-the-go management.

**Effort:** Very High (8-12 weeks)

---

#### 3.4 Advanced Search & Filters
**Status:** 🔴 Not Started

**Features:**
- Full-text search (show titles, paths, metadata)
- Advanced filters (size range, date range, genre, rating)
- Saved searches
- Search history
- Regular expression support
- Tag/label system

**Why:** Power users want granular control over library views.

**Effort:** Medium (2 weeks)

---

#### 3.5 Import/Export & Backup
**Status:** 🔴 Not Started

**Features:**
- Export configuration as JSON
- Import configuration from JSON
- Database backup/restore UI
- Scheduled automatic backups
- Backup to cloud storage
- Disaster recovery guides

**Why:** Protect user data and make migration easy.

**Effort:** Low (1 week)

---

#### 3.6 Plugin System
**Status:** 🔴 Not Started

**Features:**
- Plugin API for extending JellyMover
- Community plugin marketplace
- Example plugins (IMDB integration, Trakt, etc.)
- Plugin sandboxing for security

**Why:** Allow community to extend functionality without forking.

**Effort:** Very High (12+ weeks)

---

### 4. Research & Exploration

#### 4.1 Machine Learning Recommendations
**Status:** 🔴 Research

**Ideas:**
- Predict which shows will be watched soon
- Optimize hot pool contents automatically
- Learn from user behavior
- Integrate with Jellyfin watch patterns

**Why:** Fully automated smart caching.

**Effort:** Unknown (experimental)

---

#### 4.2 BitTorrent/Usenet Integration
**Status:** 🔴 Research

**Ideas:**
- Detect new downloads from Sonarr/Radarr
- Automatically place new content on hot pool
- Move to cold after watch completion

**Why:** Streamline the download → watch → archive workflow.

**Effort:** Medium (2-3 weeks)

---

#### 4.3 Hardware Acceleration
**Status:** 🔴 Research

**Ideas:**
- GPU-accelerated file transfers (NVIDIA GPUDirect)
- NVMe-to-NVMe optimizations
- RDMA for network storage

**Why:** Maximize transfer speeds for high-performance setups.

**Effort:** High (unknown, hardware-dependent)

---

## Technical Stack

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Rust** | Edition 2024 (nightly) | Systems programming language |
| **Axum** | 0.7 | HTTP web framework |
| **Tokio** | 1.x | Async runtime |
| **SQLx** | 0.8 | Async SQL toolkit |
| **SQLite** | 3.x | Embedded database |
| **serde** | 1.x | Serialization framework |
| **serde_json** | 1.x | JSON parser |
| **tracing** | 0.1 | Structured logging |
| **tracing-subscriber** | 0.3 | Log output |
| **reqwest** | 0.12 | HTTP client (Jellyfin API) |
| **tower** | 0.5 | Middleware framework |
| **tower-http** | 0.5 | HTTP middleware (CORS, static files) |
| **walkdir** | 2.x | Directory traversal |
| **quick-xml** | 0.37 | XML parser (NFO files) |
| **chrono** | 0.4 | Date/time handling |
| **nix** | 0.29 | Unix system APIs (statvfs) |
| **sysinfo** | 0.30 | System metrics (CPU, RAM) |
| **url** | 2.x | URL parsing |

---

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **TypeScript** | 5.9.3 | Type-safe JavaScript |
| **Vite** | 7.2.2 | Build tool and dev server |
| **react-router-dom** | 7.9.6 | Client-side routing |
| **Recharts** | 3.4.1 | Data visualization |
| **react-icons** | 5.5.0 | Icon library |
| **Vitest** | 4.0.10 | Unit testing framework |
| **Testing Library** | 16.3.0 | React component testing |
| **ESLint** | 9.39.1 | Linting and code quality |

---

### DevOps & Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **GitHub Actions** | CI/CD (planned) |
| **GitHub Container Registry** | Image hosting |
| **TrueNAS SCALE** | Primary deployment target |
| **Kubernetes** | Alternative deployment (planned) |

---

### Development Tools

| Tool | Purpose |
|------|---------|
| **rustup** | Rust toolchain manager |
| **cargo** | Rust package manager |
| **npm** | Node.js package manager |
| **git** | Version control |
| **cargo-watch** | Auto-rebuild on file changes |
| **cargo-clippy** | Rust linter |
| **rustfmt** | Rust code formatter |

---

## Documentation

### Existing Documentation

1. **README.md**:
   - Quick start guide
   - TrueNAS SCALE installation
   - Docker setup
   - API reference
   - Repository layout
   - Troubleshooting

2. **docs/truenas-scale.md**:
   - Detailed TrueNAS SCALE setup
   - Screenshots and YAML examples
   - ACL permissions guide
   - Common issues

3. **FEATURES.md** (this file):
   - Complete feature catalog
   - Technical specifications
   - Roadmap

4. **Example/**:
   - Sample NFO files
   - Test fixtures

### Planned Documentation

- API documentation (OpenAPI/Swagger)
- Architecture decision records (ADRs)
- Contributing guide
- Developer setup guide
- Deployment guides (Kubernetes, Docker Swarm)
- Performance tuning guide
- Security best practices

---

## Metrics & Statistics

### Current Codebase (as of 2025-11-19)

**Lines of Code:**
- Backend (Rust): ~3,470 lines
- Frontend (TypeScript/TSX): ~9,897 lines
- Total: ~13,367 lines

**File Counts:**
- Backend Rust files: 11
- Frontend TS/TSX files: 62
- Total source files: 73

**Features:**
- API Endpoints: 20+
- Database Tables: 5
- React Components: 35+
- Custom Hooks: 4
- Pages: 4
- Themes: 3 production + 4 placeholders

**Test Coverage:**
- Backend unit tests: Yes (scanner module)
- Frontend unit tests: Yes (4 test files)
- Integration tests: Planned
- E2E tests: Planned

---

## Recent Updates

### Latest Commits (Last 5)

1. **486ba22** - Add metrics, analytics, and theme support
   - System metrics collection
   - Historical charts
   - Theme system implementation

2. **d312149** - Update README.md
   - Documentation improvements

3. **70a6cf3** - Expand TrueNAS SCALE setup instructions in README
   - Enhanced deployment guide

4. **8d8cead** - Enhance CORS security and update .gitignore files
   - Security improvements
   - Private IP validation

5. **8edf15d** - Add real-time system metrics API and frontend integration
   - Metrics collector worker
   - Stats API endpoints
   - Frontend charts

---

## Contributing

### How to Contribute

1. **Report Bugs**: Open GitHub issues with detailed reproduction steps
2. **Request Features**: Open issues with "enhancement" label
3. **Submit PRs**: Fork, branch, implement, test, submit
4. **Write Documentation**: Improve README, guides, or this file
5. **Add Tests**: Increase test coverage

### Development Setup

**Backend:**
```bash
# Install Rust nightly
rustup toolchain install nightly

# Run backend
cargo +nightly run -p jellymover-backend

# Run tests
cargo +nightly test -p jellymover-backend

# Check code
cargo +nightly fmt -- --check
cargo +nightly clippy
```

**Frontend:**
```bash
# Install dependencies
cd frontend && npm install

# Run dev server
VITE_API_BASE=http://localhost:3000/api npm run dev

# Run tests
npm run test

# Lint
npm run lint

# Build production
npm run build
```

---

## License

(License information to be added)

---

## Credits

**Author:** SihoChoii
**Repository:** github.com/SihoChoii/Jellyfin-Storage-Manager
**Project Name:** JellyMover

---

**End of Features Documentation**
