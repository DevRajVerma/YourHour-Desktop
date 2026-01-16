const { app } = require('electron');
const path = require('path');

class AutoLaunch {
    constructor(appName, appPath) {
        this.appName = appName;
        this.appPath = appPath;
    }

    enable() {
        if (process.platform === 'win32') {
            app.setLoginItemSettings({
                openAtLogin: true,
                openAsHidden: false,
                path: this.appPath,
                args: []
            });
            console.log('✓ Auto-start enabled');
            return true;
        }
        return false;
    }

    disable() {
        if (process.platform === 'win32') {
            app.setLoginItemSettings({
                openAtLogin: false
            });
            console.log('✓ Auto-start disabled');
            return true;
        }
        return false;
    }

    isEnabled() {
        if (process.platform === 'win32') {
            const settings = app.getLoginItemSettings();
            return settings.openAtLogin;
        }
        return false;
    }
}

module.exports = AutoLaunch;
