# How to Upload to GitHub

Follow these steps to upload YourHour Desktop to GitHub:

## Prerequisites

1. **Git installed** - Download from https://git-scm.com/
2. **GitHub account** - Create at https://github.com/

## Step-by-Step Guide

### 1. Create a New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `yourhour-desktop` (or your preferred name)
3. Description: `Windows desktop app to track application usage and boost productivity`
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README (we already have one)
6. Click **Create repository**

### 2. Initialize Git in Your Project

Open PowerShell in your project folder and run:

```powershell
# Navigate to project folder
cd "C:\Users\ACER\Desktop\YourHour Desktop"

# Initialize Git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: YourHour Desktop app"
```

### 3. Connect to GitHub

Replace `YOUR_USERNAME` with your GitHub username:

```powershell
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/yourhour-desktop.git

# Verify remote
git remote -v
```

### 4. Push to GitHub

```powershell
# Push to GitHub (main branch)
git branch -M main
git push -u origin main
```

### 5. Enter Credentials

When prompted:
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your password)

#### Creating a Personal Access Token:

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** > **Generate new token (classic)**
3. Name: `YourHour Desktop`
4. Expiration: Choose duration
5. Scopes: Check `repo` (full control of private repositories)
6. Click **Generate token**
7. **Copy the token** (you won't see it again!)
8. Use this token as your password when pushing

## Done! 🎉

Your repository is now live at:
```
https://github.com/YOUR_USERNAME/yourhour-desktop
```

## Future Updates

When you make changes:

```powershell
# Stage changes
git add .

# Commit with message
git commit -m "Add new feature: idle detection"

# Push to GitHub
git push
```

## Common Issues

### "fatal: not a git repository"
- Make sure you're in the correct folder
- Run `git init` first

### "failed to push some refs"
- Run `git pull origin main --rebase` first
- Then `git push`

### Authentication failed
- Use Personal Access Token, not password
- Generate new token at https://github.com/settings/tokens

## Optional: Add Topics

On GitHub, add topics to your repository:
- `electron`
- `desktop-app`
- `time-tracking`
- `productivity`
- `windows`
- `sqlite`
- `app-usage-tracker`

This helps others discover your project!
