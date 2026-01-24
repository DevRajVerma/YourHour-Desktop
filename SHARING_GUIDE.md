# Creating a Single-File Installer

## The Problem
The packaged app is a folder with many files. You can't share just the `.exe` file.

## Solution: Create an Installer

Use **Inno Setup** to create a single `.exe` installer file that your friend can run.

### Steps:

1. **Download Inno Setup**
   - Go to: https://jrsoftware.org/isdl.php
   - Download and install Inno Setup

2. **Create installer script** (I'll create this for you below)

3. **Build the installer**
   - Open the script in Inno Setup
   - Click "Build" → "Compile"
   - You'll get a single `YourHourDesktop-Setup.exe` file

4. **Share the installer**
   - Share just this one file
   - Your friend runs it, clicks "Next" a few times
   - App is installed and ready!

## Alternative: Use the Zip

For now, the easiest way is to:
1. Zip the entire `YourHourDesktop-win32-x64` folder
2. Share the zip file
3. Your friend extracts and runs

The zip file is **one file** to share, and it's simpler than creating an installer.

## Why Not Just the .exe?

Think of it like this:
- The `.exe` is like a car's ignition key
- The folder is the entire car
- You need both to drive!

The `.exe` file is only ~1 MB, but it needs the other ~199 MB of files in the folder to actually run the app.

---

**Recommendation:** Share the **zip file** of the entire folder. It's the simplest solution that works perfectly!
