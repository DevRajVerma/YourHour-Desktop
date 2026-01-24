# Building YourHour Desktop for Auto-Start

## The Problem
When you restart your laptop, the auto-start tries to run `electron.exe` directly, but the app is currently in **development mode** which requires `npm start`. This won't work on startup.

## The Solution
Package the app into a **standalone executable (.exe)** that can run without Node.js or npm.

## Steps to Build

### 1. Install electron-builder (Already Done)
```powershell
npm install --save-dev electron-builder
```

### 2. Build the App
```powershell
npm run build
```

This will create:
- `dist/YourHour Desktop Setup 1.0.0.exe` - Installer
- The installer will install the app to `C:\Program Files\YourHour Desktop\`

### 3. Install the Built App
1. Run the installer: `dist/YourHour Desktop Setup 1.0.0.exe`
2. Follow the installation wizard
3. The app will be installed and auto-start will be configured automatically

### 4. Verify Auto-Start
After installation:
1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to **Startup** tab
3. You should see "YourHour Desktop" listed
4. It should be **Enabled**

## How It Works

**Before (Development Mode):**
- Auto-start tries to run: `electron.exe` ❌
- Needs: Node.js, npm, source code
- Won't work on startup

**After (Production Build):**
- Auto-start runs: `C:\Program Files\YourHour Desktop\YourHour Desktop.exe` ✅
- Standalone executable
- Works perfectly on startup!

## Build Output

After running `npm run build`, you'll find:
```
dist/
├── YourHour Desktop Setup 1.0.0.exe  (Installer - share this!)
└── win-unpacked/                      (Unpacked files)
    └── YourHour Desktop.exe           (Main executable)
```

## For Future Updates

When you make changes to the code:
1. Make your changes
2. Run `npm run build` again
3. Install the new version

## Notes

- The build process may take 2-5 minutes
- The installer size will be ~150-200 MB (includes Electron runtime)
- After installation, you can delete the development folder if you want
- The installed app will have its own database in `%APPDATA%\yourhour-desktop\`

## Troubleshooting

**Build fails:**
- Make sure `assets/icon.png` exists
- Check that all dependencies are installed
- Try `npm install` again

**Auto-start doesn't work:**
- Reinstall the app
- Check Windows Startup settings
- Make sure you installed from the `.exe`, not running from source

---

**Ready to build?** Run `npm run build` and wait for it to complete!
