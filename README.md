# YourHour Desktop - Windows App Usage Tracker

<div align="center">

**Track your Windows app usage, visualize your digital habits, and boost productivity**

[![Electron](https://img.shields.io/badge/Electron-27.0.0-blue.svg)](https://www.electronjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-green.svg)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [How It Works](#how-it-works) • [Privacy](#privacy)

</div>

---

## 📖 What is YourHour Desktop?

YourHour Desktop is a **privacy-focused Windows application** that automatically tracks which applications you use and for how long. Inspired by the popular YourHour mobile app, it helps you understand your digital habits and improve productivity.

### Why Use YourHour Desktop?

- 📊 **Understand Your Habits** - See exactly where your time goes
- ⏰ **Track Screen Time** - Monitor daily, weekly, and monthly usage
- 📅 **Timeline View** - Visual representation of your day
- 🔒 **100% Private** - All data stays on your computer
- 🚀 **Auto-Start** - Begins tracking when Windows boots
- 📈 **Detailed Reports** - Charts and statistics for insights

---

## ✨ Features

### Dashboard
- **Real-time tracking** of current app usage
- **App switches counter** (e.g., "59 times")
- **Total screen time** for today
- **Most used app** statistics
- **Top 5 apps** with usage breakdown

### Timeline
- **Vertical timeline** showing when you used each app
- **Session details** with start/end times
- **Date picker** to view any day's history
- **Color-coded** app sessions

### Reports
- **Daily/Weekly/Monthly** views
- **Doughnut chart** visualization
- **Detailed table** with percentages
- **Export-ready** data

### Apps View
- **Complete list** of all tracked applications
- **Search functionality**
- **Usage statistics** per app
- **Last used** timestamps

---

## 🚀 Installation

### Prerequisites
- **Windows 10/11**
- **Node.js 16+** ([Download](https://nodejs.org/))

### Quick Start

1. **Clone or download** this repository
   ```bash
   cd "C:\Users\YourName\Desktop\YourHour Desktop"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Rebuild native modules** (required for SQLite)
   ```bash
   npx electron-rebuild
   ```

4. **Start the app**
   ```bash
   npm start
   ```

That's it! The app will start tracking immediately.

---

## 📱 Usage

### First Launch

When you first start YourHour Desktop:

1. **Window opens** showing the Dashboard
2. **Tracking starts automatically** in the background
3. **System tray icon** appears (⏱️)
4. **Auto-start enabled** for Windows boot

### Daily Use

- **Dashboard** - View today's activity at a glance
- **Timeline** - See your app usage timeline
- **Reports** - Analyze trends over time
- **Apps** - Browse all tracked applications

### System Tray

The app runs in the system tray when closed:
- **Click icon** - Show/hide window
- **Right-click** - Access menu
  - Show App
  - Quit

### Keyboard Shortcuts

- `Ctrl+Shift+I` - Open DevTools (for debugging)
- `Ctrl+W` - Close window (minimizes to tray)

---

## 🔧 How It Works

### Architecture

```
YourHour Desktop
├── Main Process (Node.js)
│   ├── Window Management
│   ├── System Tray
│   ├── Database Service (SQLite)
│   └── Tracker Service (PowerShell)
│
└── Renderer Process (Browser)
    ├── Dashboard View
    ├── Timeline View
    ├── Reports View
    └── Apps View
```

### Tracking Mechanism

1. **PowerShell Script** (`get-active-window.ps1`)
   - Uses Windows API (`GetForegroundWindow`)
   - Detects active window every 2 seconds
   - Returns: Process name, window title, process ID

2. **Tracker Service** (`tracker-service.js`)
   - Monitors active window changes
   - Creates sessions when app switches
   - Stores data in SQLite database

3. **Database Service** (`database-service.js`)
   - SQLite database at `%APPDATA%/yourhour-desktop/yourhour.db`
   - Tables: `sessions`, `daily_summaries`, `app_metadata`
   - Queries for stats, reports, and timelines

4. **UI Updates** (IPC Communication)
   - Main process sends events to renderer
   - Renderer requests data via IPC handlers
   - Real-time updates every second

---

## 📁 Project Structure

```
YourHour Desktop/
│
├── src/
│   ├── main.js                    # Electron main process
│   ├── services/
│   │   ├── database-service.js    # SQLite database operations
│   │   ├── tracker-service.js     # App tracking logic
│   │   └── auto-launch.js         # Windows startup integration
│   │
│   └── renderer/
│       ├── index.html             # UI structure
│       ├── styles.css             # Professional styling
│       └── renderer.js            # UI logic & IPC
│
├── scripts/
│   └── get-active-window.ps1      # PowerShell tracking script
│
├── assets/
│   └── icon.png                   # App icon
│
├── package.json                   # Dependencies & scripts
└── README.md                      # This file
```

---

## 🗄️ Database Schema

### `sessions` Table
Stores individual app usage sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `app_name` | TEXT | Application name |
| `window_title` | TEXT | Window title |
| `process_name` | TEXT | Process ID |
| `start_time` | INTEGER | Session start (timestamp) |
| `end_time` | INTEGER | Session end (timestamp) |
| `duration` | INTEGER | Duration in milliseconds |
| `date` | TEXT | Date (YYYY-MM-DD) |

### `daily_summaries` Table
Aggregated daily statistics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `date` | TEXT | Date (YYYY-MM-DD) |
| `total_time` | INTEGER | Total screen time (ms) |
| `app_count` | INTEGER | Number of apps used |
| `switch_count` | INTEGER | App switch count |
| `most_used_app` | TEXT | Most used app name |

### `app_metadata` Table
Application categorization and metadata.

| Column | Type | Description |
|--------|------|-------------|
| `app_name` | TEXT | Primary key |
| `category` | TEXT | productive/neutral/distracting |
| `color` | TEXT | UI color |
| `icon` | TEXT | Icon path |

---

## 🔒 Privacy & Security

### Data Storage
- **100% Local** - All data stored in SQLite on your computer
- **No Cloud** - Never uploaded anywhere
- **No Telemetry** - No analytics or tracking
- **No Network** - App doesn't make external requests

### Data Location
```
%APPDATA%\yourhour-desktop\yourhour.db
```

Typically: `C:\Users\YourName\AppData\Roaming\yourhour-desktop\yourhour.db`

### Data Retention
- **Permanent storage** - Data never auto-deleted
- **Manual control** - Delete database file to reset
- **Backup friendly** - Copy `.db` file to backup

---

## 🛠️ Development

### Tech Stack
- **Electron 27** - Desktop framework
- **Node.js** - Backend runtime
- **SQLite (better-sqlite3)** - Database
- **PowerShell** - Windows API integration
- **Chart.js** - Data visualization
- **Vanilla JS** - No frontend framework

### Build Commands

```bash
# Install dependencies
npm install

# Rebuild native modules
npx electron-rebuild

# Start development
npm start

# Package for distribution (future)
npm run build
```

### Code Style
- **ES6+** JavaScript
- **Async/await** for asynchronous operations
- **IPC** for main-renderer communication
- **Event-driven** architecture

---

## 🐛 Troubleshooting

### "Module was compiled against different Node.js version"

**Solution:**
```bash
npx electron-rebuild
```

This rebuilds native modules (better-sqlite3) for Electron's Node.js version.

### App doesn't start

1. Delete `node_modules` folder
2. Run `npm install`
3. Run `npx electron-rebuild`
4. Run `npm start`

### No data showing

1. Check if tracking is enabled (click "🔄 Test Tracking" button)
2. Look at terminal output for errors
3. Switch between apps to generate data
4. Restart the app

### Database errors

Delete the database file to reset:
```
%APPDATA%\yourhour-desktop\yourhour.db
```

---

## 🎨 Customization

### Change Colors

Edit `src/renderer/styles.css`:

```css
:root {
  --primary-color: #00bfa5;  /* Teal */
  --accent-color: #ff6b6b;   /* Red */
  /* ... */
}
```

### Change Polling Interval

Edit `src/services/tracker-service.js`:

```javascript
this.pollRate = 2000; // Check every 2 seconds
```

### Disable Auto-Start

Edit `src/main.js` and remove the auto-launch code, or:
- Open **Task Manager** > **Startup** tab
- Disable "YourHour Desktop"

---

## 📊 API Reference

### IPC Handlers (Main → Renderer)

```javascript
// Get today's sessions
ipcRenderer.invoke('get-today-sessions')

// Get today's statistics
ipcRenderer.invoke('get-today-stats')

// Get app statistics for a date
ipcRenderer.invoke('get-app-stats', date)

// Get sessions by date
ipcRenderer.invoke('get-sessions-by-date', date)

// Get tracker status
ipcRenderer.invoke('get-tracker-status')
```

### IPC Events (Main → Renderer)

```javascript
// App switch event
ipcRenderer.on('app-switch', (event, data) => {
  // data: { app, title, time }
})

// Tracker status update (every second)
ipcRenderer.on('tracker-status', (event, status) => {
  // status: { isTracking, currentApp, currentSessionDuration }
})
```

---

## 🚀 Future Enhancements

See [FUTURE_IMPROVEMENTS.md](FUTURE_IMPROVEMENTS.md) for planned features:

- Idle detection
- App categories (productive/distracting)
- Time limits & notifications
- Focus mode
- Export reports (PDF/CSV)
- And more!

---

## 📄 License

MIT License - feel free to use and modify!

---

## 🙏 Acknowledgments

- Inspired by **YourHour** mobile app
- Built with **Electron** framework
- Uses **better-sqlite3** for database
- Styled with modern **CSS** design principles

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [How It Works](#how-it-works) section
3. Check terminal output for error messages

---

<div align="center">

**Made with ❤️ for productivity tracking**

⭐ Star this project if you find it useful!

</div>
