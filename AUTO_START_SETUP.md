# YourHour Desktop - Auto-Start Setup

## ✅ App Successfully Packaged!

Your app has been packaged and is ready to use. The packaged app is located at:

```
dist\YourHourDesktop-win32-x64\YourHourDesktop.exe
```

## Setting Up Auto-Start

### Option 1: Manual Setup (Recommended)

1. **Locate the packaged app:**
   - Go to: `C:\Users\ACER\Desktop\YourHour Desktop\dist\YourHourDesktop-win32-x64\`
   - You'll see `YourHourDesktop.exe`

2. **Create a shortcut:**
   - Right-click on `YourHourDesktop.exe`
   - Select "Create shortcut"

3. **Move shortcut to Startup folder:**
   - Press `Win + R`
   - Type: `shell:startup`
   - Press Enter
   - Move the shortcut to this folder

4. **Done!** The app will now start automatically when Windows boots.

### Option 2: Move the App to Program Files

For a more permanent installation:

1. **Copy the entire folder:**
   ```
   From: C:\Users\ACER\Desktop\YourHour Desktop\dist\YourHourDesktop-win32-x64\
   To: C:\Program Files\YourHour Desktop\
   ```

2. **Create shortcut in Startup:**
   - Create shortcut of `C:\Program Files\YourHour Desktop\YourHourDesktop.exe`
   - Move to `shell:startup` folder

3. **Create Desktop shortcut (optional):**
   - Create another shortcut on your Desktop for easy access

## Verify Auto-Start

1. Open **Task Manager** (Ctrl+Shift+Esc)
2. Go to **Startup** tab
3. You should see "YourHourDesktop" listed
4. Make sure it's **Enabled**

## Testing

1. **Test the packaged app:**
   - Double-click `dist\YourHourDesktop-win32-x64\YourHourDesktop.exe`
   - The app should start and work normally

2. **Test auto-start:**
   - Restart your computer
   - The app should start automatically!

## Important Notes

- The packaged app is **standalone** - it doesn't need Node.js or npm
- All your data is stored in: `%APPDATA%\yourhour-desktop\yourhour.db`
- You can delete the development folder after moving the app to Program Files
- The packaged app is about 200 MB (includes Electron runtime)

## Updating the App

When you make changes to the code:

1. Close the running app
2. Run `npm run package` again
3. Replace the old files with the new ones
4. Restart the app

## Troubleshooting

**App doesn't start:**
- Make sure you're running `YourHourDesktop.exe` from the `dist\YourHourDesktop-win32-x64\` folder
- Check if all files in the folder are present

**Auto-start doesn't work:**
- Verify the shortcut path is correct
- Check Windows Startup settings
- Make sure the shortcut points to the `.exe` file, not the development folder

---

**Ready to use!** 🎉

Your YourHour Desktop app is now packaged and ready for auto-start!
