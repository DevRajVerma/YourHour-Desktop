const { exec } = require('child_process');
const EventEmitter = require('events');
const path = require('path');

class TrackerService extends EventEmitter {
    constructor(databaseService) {
        super();
        this.db = databaseService;
        this.currentSession = null;
        this.currentApp = null;
        this.isTracking = false;
        this.pollInterval = null;
        this.pollRate = 2000; // Check every 2 seconds
        this.scriptPath = path.join(__dirname, '../../scripts/get-active-window.ps1');
    }

    start() {
        if (this.isTracking) return;

        this.isTracking = true;
        console.log('✓ Tracker service started');
        console.log('✓ Script path:', this.scriptPath);

        // Start polling
        this.pollInterval = setInterval(() => {
            this.checkActiveWindow();
        }, this.pollRate);

        // Initial check
        this.checkActiveWindow();
    }

    stop() {
        if (!this.isTracking) return;

        this.isTracking = false;

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }

        // End current session
        if (this.currentSession) {
            this.endCurrentSession();
        }

        console.log('Tracker service stopped');
    }

    checkActiveWindow() {
        const command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${this.scriptPath}"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error getting active window:', error.message);
                return;
            }

            if (stderr) {
                console.error('PowerShell stderr:', stderr);
            }

            const output = stdout.trim();
            if (!output) {
                console.log('No active window detected');
                return;
            }

            const parts = output.split('|');
            if (parts.length < 2) {
                console.log('Invalid output format:', output);
                return;
            }

            const [processName, windowTitle, processId] = parts;

            if (!processName) {
                console.log('No process name found');
                return;
            }

            const appInfo = {
                name: processName,
                title: windowTitle || processName,
                processName: processId || 'unknown'
            };

            // Check if app changed
            if (!this.currentApp || this.currentApp.name !== appInfo.name) {
                this.handleAppSwitch(appInfo);
            }
        });
    }

    handleAppSwitch(newAppInfo) {
        const now = Date.now();

        // End previous session
        if (this.currentSession) {
            this.endCurrentSession();
        }

        // Start new session
        this.currentApp = newAppInfo;

        try {
            const sessionId = this.db.insertSession(
                newAppInfo.name,
                newAppInfo.title,
                newAppInfo.processName,
                now
            );

            this.currentSession = {
                id: sessionId,
                ...newAppInfo,
                startTime: now
            };

            // Emit event
            this.emit('app-switch', {
                app: newAppInfo.name,
                title: newAppInfo.title,
                time: now
            });

            console.log(`✓ Switched to: ${newAppInfo.name} - "${newAppInfo.title}" (Session ID: ${sessionId})`);
        } catch (error) {
            console.error('Error inserting session:', error);
        }
    }

    endCurrentSession() {
        if (!this.currentSession) return;

        const now = Date.now();
        const duration = now - this.currentSession.startTime;

        try {
            this.db.endSession(this.currentSession.id, now);

            this.emit('session-end', {
                app: this.currentSession.name,
                duration: duration,
                time: now
            });

            console.log(`✓ Ended session for ${this.currentSession.name}: ${Math.round(duration / 1000)}s`);
        } catch (error) {
            console.error('Error ending session:', error);
        }

        this.currentSession = null;
    }

    getCurrentApp() {
        return this.currentApp;
    }

    getCurrentSessionDuration() {
        if (!this.currentSession) return 0;
        return Date.now() - this.currentSession.startTime;
    }

    getStatus() {
        return {
            isTracking: this.isTracking,
            currentApp: this.currentApp,
            currentSessionDuration: this.getCurrentSessionDuration()
        };
    }
}

module.exports = TrackerService;
