const { spawn } = require('child_process');
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

        // Persistent PowerShell process (much more efficient!)
        this.psProcess = null;
        this.psReady = false;
        this.pendingCallback = null;
        this.scriptPath = path.join(__dirname, '../../scripts/get-active-window-loop.ps1');
    }

    start() {
        if (this.isTracking) return;

        this.isTracking = true;
        console.log('✓ Tracker service started (optimized mode)');

        // Start persistent PowerShell process
        this.startPowerShell();
    }

    startPowerShell() {
        const args = [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', this.scriptPath
        ];

        this.psProcess = spawn('powershell', args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true  // Hide PowerShell window
        });

        // Handle stdout
        this.psProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            const lines = output.split('\n').map(l => l.trim()).filter(l => l);

            for (const line of lines) {
                if (line === 'READY') {
                    this.psReady = true;
                    console.log('✓ PowerShell process ready');

                    // Start polling now that PowerShell is ready
                    this.pollInterval = setInterval(() => {
                        this.checkActiveWindow();
                    }, this.pollRate);

                    // Initial check
                    this.checkActiveWindow();
                } else if (line.startsWith('RESULT|')) {
                    this.handleResult(line);
                } else if (line.startsWith('ERROR|')) {
                    console.error('PowerShell error:', line.substring(6));
                }
            }
        });

        this.psProcess.stderr.on('data', (data) => {
            // Only log actual errors, not empty stderr
            const err = data.toString().trim();
            if (err && !err.includes('TerminatingError')) {
                console.error('PowerShell stderr:', err);
            }
        });

        this.psProcess.on('close', (code) => {
            this.psReady = false;
            if (this.isTracking) {
                // Restart if it crashed while we're still tracking
                console.log('PowerShell process ended, restarting...');
                setTimeout(() => this.startPowerShell(), 1000);
            }
        });

        this.psProcess.on('error', (error) => {
            console.error('PowerShell spawn error:', error.message);
        });
    }

    handleResult(line) {
        // Parse: RESULT|processName|windowTitle|processId
        const parts = line.split('|');
        if (parts.length < 4) return;

        const [, processName, windowTitle, processId] = parts;

        if (!processName || processName === 'unknown') return;

        const appInfo = {
            name: processName,
            title: windowTitle || processName,
            processName: processId || 'unknown'
        };

        // Check if app changed
        if (!this.currentApp || this.currentApp.name !== appInfo.name) {
            this.handleAppSwitch(appInfo);
        }
    }

    checkActiveWindow() {
        if (!this.psReady || !this.psProcess) return;

        try {
            // Send command to persistent PowerShell process
            this.psProcess.stdin.write('GET\n');
        } catch (error) {
            console.error('Error sending command to PowerShell:', error.message);
        }
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

        // Gracefully stop PowerShell process
        if (this.psProcess && this.psReady) {
            try {
                this.psProcess.stdin.write('EXIT\n');
            } catch (e) {
                // Process might already be dead
            }

            // Force kill after 2 seconds if still running
            setTimeout(() => {
                if (this.psProcess) {
                    this.psProcess.kill();
                    this.psProcess = null;
                }
            }, 2000);
        }

        console.log('Tracker service stopped');
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

            // Reduced logging - only log app name, not full details
            console.log(`→ ${newAppInfo.name}`);
        } catch (error) {
            console.error('Error inserting session:', error.message);
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
        } catch (error) {
            console.error('Error ending session:', error.message);
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
