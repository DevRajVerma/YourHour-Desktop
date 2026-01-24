const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const DatabaseService = require('./services/database-service');
const TrackerService = require('./services/tracker-service');
const AutoLaunch = require('./services/auto-launch');

let mainWindow;
let tray;
let db;
let tracker;
let autoLauncher;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, '../assets/icon.png')
    });

    mainWindow.loadFile('src/renderer/index.html');

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, '../assets/icon.png'));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('YourHour Desktop');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    console.log('=== YourHour Desktop Starting ===');

    // Initialize services
    console.log('Initializing database...');
    db = new DatabaseService();
    console.log('Database initialized');

    console.log('Initializing tracker...');
    tracker = new TrackerService(db);
    console.log('Tracker initialized');

    createWindow();
    createTray();

    // Start tracking AFTER window is created
    console.log('Starting tracker service...');
    tracker.start();
    console.log('Tracker started!');

    // Enable auto-start on Windows boot
    console.log('Setting up auto-start...');
    autoLauncher = new AutoLaunch('YourHour Desktop', process.execPath);
    if (!autoLauncher.isEnabled()) {
        autoLauncher.enable();
        console.log('✓ Auto-start enabled - app will launch on Windows startup');
    } else {
        console.log('✓ Auto-start already enabled');
    }

    // Send updates to renderer
    tracker.on('app-switch', (data) => {
        console.log('APP SWITCH EVENT:', data);
        if (mainWindow) {
            mainWindow.webContents.send('app-switch', data);
        }
    });

    tracker.on('session-end', (data) => {
        console.log('SESSION END EVENT:', data);
        if (mainWindow) {
            mainWindow.webContents.send('session-end', data);
        }
    });

    // Send status updates every 2 seconds, only when window is visible
    setInterval(() => {
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
            const status = tracker.getStatus();
            mainWindow.webContents.send('tracker-status', status);
        }
    }, 2000);

    console.log('=== YourHour Desktop Ready ===');
});

// IPC Handlers
ipcMain.handle('get-today-sessions', async () => {
    return db.getTodaySessions();
});

ipcMain.handle('get-today-stats', async () => {
    return db.getTodayStats();
});

ipcMain.handle('get-app-stats', async (event, date) => {
    return db.getAppStats(date);
});

ipcMain.handle('get-sessions-by-date', async (event, date) => {
    return db.getSessionsByDate(date);
});

ipcMain.handle('get-date-range-stats', async (event, startDate, endDate) => {
    return db.getDateRangeStats(startDate, endDate);
});

ipcMain.handle('set-app-category', async (event, appName, category) => {
    db.setAppCategory(appName, category);
    return true;
});

ipcMain.handle('get-tracker-status', async () => {
    return tracker.getStatus();
});

// Batch query for daily reports (30 queries → 1 query!)
ipcMain.handle('get-daily-reports-range', async (event, days) => {
    return db.getDailyReportsForRange(days || 30);
});

app.on('window-all-closed', () => {
    // Don't quit on window close, keep running in background
});

app.on('before-quit', () => {
    if (tracker) {
        tracker.stop();
    }
    if (db) {
        db.close();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
