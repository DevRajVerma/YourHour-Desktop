# Code Documentation - YourHour Desktop

This document explains the codebase architecture and how each component works.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Main Process](#main-process)
3. [Services](#services)
4. [Renderer Process](#renderer-process)
5. [Data Flow](#data-flow)
6. [Key Algorithms](#key-algorithms)

---

## Architecture Overview

YourHour Desktop follows the **Electron architecture** with two main processes:

```
┌─────────────────────────────────────────┐
│         Main Process (Node.js)          │
│  ┌────────────────────────────────────┐ │
│  │  main.js - Entry Point             │ │
│  │  - Window Management               │ │
│  │  - System Tray                     │ │
│  │  - IPC Handlers                    │ │
│  └────────────────────────────────────┘ │
│                                         │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │ Database     │  │ Tracker Service │ │
│  │ Service      │  │ (PowerShell)    │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────┘
                    ↕ IPC
┌─────────────────────────────────────────┐
│      Renderer Process (Chromium)        │
│  ┌────────────────────────────────────┐ │
│  │  index.html - UI Structure         │ │
│  │  styles.css - Styling              │ │
│  │  renderer.js - UI Logic            │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Main Process

### `src/main.js`

**Purpose**: Electron's main process - manages app lifecycle, windows, and services.

#### Key Responsibilities

1. **Window Management**
   ```javascript
   function createWindow() {
     mainWindow = new BrowserWindow({
       width: 1200,
       height: 800,
       webPreferences: {
         nodeIntegration: true,
         contextIsolation: false
       }
     });
   }
   ```

2. **System Tray**
   ```javascript
   function createTray() {
     tray = new Tray(iconPath);
     // Context menu with Show/Quit options
   }
   ```

3. **Service Initialization**
   ```javascript
   db = new DatabaseService();
   tracker = new TrackerService(db);
   tracker.start();
   ```

4. **IPC Communication**
   ```javascript
   ipcMain.handle('get-today-stats', async () => {
     return db.getTodayStats();
   });
   ```

#### Lifecycle Events

- `app.whenReady()` - Initialize services, create window
- `app.on('window-all-closed')` - Keep running in background
- `app.on('before-quit')` - Stop tracker, close database

---

## Services

### `src/services/database-service.js`

**Purpose**: SQLite database operations and queries.

#### Database Schema

```sql
-- Sessions table
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_name TEXT NOT NULL,
  window_title TEXT,
  process_name TEXT,
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  duration INTEGER,
  date TEXT NOT NULL
);

-- Daily summaries
CREATE TABLE daily_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  total_time INTEGER NOT NULL,
  app_count INTEGER NOT NULL,
  switch_count INTEGER NOT NULL,
  most_used_app TEXT
);

-- App metadata
CREATE TABLE app_metadata (
  app_name TEXT PRIMARY KEY,
  category TEXT DEFAULT 'neutral',
  color TEXT,
  icon TEXT
);
```

#### Key Methods

**Session Management**
```javascript
// Insert new session
insertSession(appName, windowTitle, processName, startTime)

// End session and calculate duration
endSession(sessionId, endTime)
```

**Statistics Queries**
```javascript
// Get today's total stats
getTodayStats() // Returns: total_time, app_count, switch_count, most_used_app

// Get app-specific stats
getAppStats(date) // Returns array of apps with usage data

// Get sessions for a date
getSessionsByDate(date)
```

**Advanced Queries**
```javascript
// Get peak usage hours
getPeakUsageHours(date) // Returns: peakHour, peakUsage, hourlyData

// Get hourly grouped sessions
getHourlyGroupedSessions(date) // Returns sessions grouped by hour
```

---

### `src/services/tracker-service.js`

**Purpose**: Monitor active Windows applications and track usage.

#### How It Works

1. **Polling Loop**
   ```javascript
   this.pollInterval = setInterval(() => {
     this.checkActiveWindow();
   }, 2000); // Every 2 seconds
   ```

2. **PowerShell Execution**
   ```javascript
   exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`)
   ```

3. **App Switch Detection**
   ```javascript
   if (!this.currentApp || this.currentApp.name !== appInfo.name) {
     this.handleAppSwitch(appInfo);
   }
   ```

4. **Session Management**
   ```javascript
   handleAppSwitch(newAppInfo) {
     // End previous session
     if (this.currentSession) {
       this.endCurrentSession();
     }
     
     // Start new session
     const sessionId = this.db.insertSession(...);
     this.currentSession = { id: sessionId, ...newAppInfo };
     
     // Emit event
     this.emit('app-switch', data);
   }
   ```

#### Events Emitted

- `app-switch` - When user switches to a different app
- `session-end` - When an app session ends

---

### `scripts/get-active-window.ps1`

**Purpose**: PowerShell script to get the active window using Windows API.

```powershell
# Load Win32 API
Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  using System.Text;
  public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
    [DllImport("user32.dll", SetLastError=true)]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
  }
"@

# Get active window
$hwnd = [Win32]::GetForegroundWindow()
$title = New-Object System.Text.StringBuilder 256
[void][Win32]::GetWindowText($hwnd, $title, 256)

# Get process info
$processId = 0
[void][Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId)
$process = Get-Process -Id $processId

# Output: ProcessName|WindowTitle|ProcessID
Write-Output "$($process.ProcessName)|$($title.ToString())|$processId"
```

**Why PowerShell?**
- Direct access to Windows API
- No additional dependencies
- Reliable foreground window detection
- Works with all Windows applications

---

## Renderer Process

### `src/renderer/index.html`

**Purpose**: UI structure and layout.

#### Key Sections

```html
<!-- Sidebar Navigation -->
<nav class="sidebar">
  <ul class="nav-menu">
    <li data-view="dashboard">Dashboard</li>
    <li data-view="timeline">Timeline</li>
    <li data-view="reports">Reports</li>
    <li data-view="apps">Apps</li>
  </ul>
</nav>

<!-- Main Content -->
<main class="main-content">
  <div id="dashboard-view" class="view active">...</div>
  <div id="timeline-view" class="view">...</div>
  <div id="reports-view" class="view">...</div>
  <div id="apps-view" class="view">...</div>
</main>
```

---

### `src/renderer/styles.css`

**Purpose**: Professional styling with modern design.

#### Design System

```css
:root {
  /* Colors */
  --primary-color: #00bfa5;      /* Teal */
  --primary-dark: #00897b;
  --accent-color: #ff6b6b;       /* Red */
  --bg-primary: #f5f7fa;         /* Light gray */
  --bg-card: #ffffff;            /* White */
  --text-primary: #2c3e50;       /* Dark gray */
  --text-secondary: #7f8c8d;     /* Medium gray */
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
}
```

#### Key Components

- **Cards** - Elevated surfaces with shadows
- **Stats Grid** - Responsive grid layout
- **Timeline Bars** - Vertical timeline with timestamps
- **Charts** - Doughnut chart for reports
- **Tables** - Clean data tables

---

### `src/renderer/renderer.js`

**Purpose**: UI logic, data fetching, and IPC communication.

#### Initialization

```javascript
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initDashboard();
  initTimeline();
  initReports();
  initApps();
  setupIPCListeners();
});
```

#### View Management

```javascript
function switchView(view) {
  // Hide all views
  document.querySelectorAll('.view').forEach(v => 
    v.classList.remove('active')
  );
  
  // Show selected view
  document.getElementById(`${view}-view`).classList.add('active');
  
  // Load data
  if (view === 'dashboard') loadDashboard();
  // ...
}
```

#### Data Loading

**Dashboard**
```javascript
async function loadDashboard() {
  const stats = await ipcRenderer.invoke('get-today-stats');
  const appStats = await ipcRenderer.invoke('get-app-stats', getTodayDate());
  
  // Update UI
  document.getElementById('total-switches').textContent = `${stats.switch_count} times`;
  document.getElementById('total-time').textContent = formatDuration(stats.total_time);
  // ...
}
```

**Timeline**
```javascript
async function loadTimeline(date) {
  const sessions = await ipcRenderer.invoke('get-sessions-by-date', date);
  
  // Create timeline bars
  sessions.forEach(session => {
    const bar = createTimelineBar(session);
    container.appendChild(bar);
  });
}
```

**Reports**
```javascript
async function loadReports(type) {
  const appStats = await ipcRenderer.invoke('get-app-stats', date);
  
  // Update chart
  updateChart(appStats);
  
  // Update table
  updateReportTable(appStats);
}
```

#### Real-time Updates

```javascript
// Listen for tracker status (every second)
ipcRenderer.on('tracker-status', (event, status) => {
  document.getElementById('current-app').textContent = status.currentApp.name;
  document.getElementById('current-duration').textContent = 
    formatDuration(status.currentSessionDuration);
});

// Listen for app switches
ipcRenderer.on('app-switch', (event, data) => {
  if (currentView === 'dashboard') {
    loadDashboard(); // Refresh
  }
});
```

---

## Data Flow

### Tracking Flow

```
1. PowerShell Script
   ↓ (every 2 seconds)
2. Tracker Service detects active window
   ↓
3. Compare with current app
   ↓
4. If different → App Switch
   ↓
5. End previous session
   ↓
6. Insert new session to database
   ↓
7. Emit 'app-switch' event
   ↓
8. Main process forwards to renderer
   ↓
9. Renderer updates UI
```

### Query Flow

```
1. User opens Timeline view
   ↓
2. Renderer calls ipcRenderer.invoke('get-sessions-by-date', date)
   ↓
3. Main process receives IPC request
   ↓
4. Calls db.getSessionsByDate(date)
   ↓
5. Database executes SQL query
   ↓
6. Returns array of sessions
   ↓
7. Main process sends back to renderer
   ↓
8. Renderer displays timeline
```

---

## Key Algorithms

### Duration Calculation

```javascript
// When session ends
const duration = endTime - startTime; // milliseconds

// Format for display
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}
```

### Peak Usage Detection

```javascript
getPeakUsageHours(date) {
  const sessions = this.getSessionsByDate(date);
  const hourlyUsage = {};
  
  // Distribute session duration across hours
  sessions.forEach(session => {
    const startHour = new Date(session.start_time).getHours();
    const endHour = new Date(session.end_time).getHours();
    
    for (let hour = startHour; hour <= endHour; hour++) {
      hourlyUsage[hour] = (hourlyUsage[hour] || 0) + session.duration;
    }
  });
  
  // Find peak hour
  let peakHour = 0;
  let maxUsage = 0;
  
  Object.entries(hourlyUsage).forEach(([hour, usage]) => {
    if (usage > maxUsage) {
      maxUsage = usage;
      peakHour = parseInt(hour);
    }
  });
  
  return { peakHour, peakUsage, hourlyData: hourlyUsage };
}
```

### App Statistics Aggregation

```sql
SELECT 
  app_name,
  SUM(duration) as total_time,
  COUNT(*) as session_count,
  MAX(end_time) as last_used
FROM sessions
WHERE date = ? AND duration IS NOT NULL
GROUP BY app_name
ORDER BY total_time DESC
```

---

## Performance Considerations

### Database Optimization

- **Prepared statements** for repeated queries
- **Indexes** on `date` and `app_name` columns (future)
- **Batch inserts** for bulk operations (future)

### UI Optimization

- **Debounced updates** - Dashboard refreshes every 5 seconds, not on every change
- **Lazy loading** - Views load data only when activated
- **Virtual scrolling** - For large app lists (future)

### Memory Management

- **Event cleanup** - Remove listeners when views unmount
- **Chart destruction** - Destroy old Chart.js instances before creating new ones
- **Database connection** - Single persistent connection, closed on app quit

---

## Error Handling

### Database Errors

```javascript
try {
  const sessionId = this.db.insertSession(...);
} catch (error) {
  console.error('Error inserting session:', error);
  // Continue tracking - don't crash
}
```

### PowerShell Errors

```javascript
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('Error getting active window:', error.message);
    return; // Skip this poll, try again in 2 seconds
  }
  // ...
});
```

### UI Errors

```javascript
async function loadDashboard() {
  try {
    const stats = await ipcRenderer.invoke('get-today-stats');
    // Update UI
  } catch (error) {
    console.error('Error loading dashboard:', error);
    // Show error message to user (future)
  }
}
```

---

## Testing Strategy

### Manual Testing

1. **Tracking accuracy** - Switch apps and verify sessions
2. **Timeline correctness** - Check timestamps and durations
3. **Report calculations** - Verify percentages and totals
4. **Auto-start** - Restart Windows and confirm app launches

### Future Automated Tests

- **Unit tests** for database queries
- **Integration tests** for IPC communication
- **E2E tests** for UI workflows

---

## Deployment

### Building for Production

```bash
# Install dependencies
npm install

# Rebuild native modules
npx electron-rebuild

# Package (future)
npm run build
```

### Distribution

- **Portable** - Copy entire folder
- **Installer** - Use electron-builder (future)
- **Auto-update** - Implement update mechanism (future)

---

This documentation should help new developers understand the codebase and contribute effectively!
