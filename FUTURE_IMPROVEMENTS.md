# Future Improvements for YourHour Desktop

## Quick Wins (Easy to implement)

### 1. Show Current Session in Dashboard
Currently the "Current Activity" card updates every second, but it could be more prominent:
- Make the timer larger and more visible
- Add a pulsing animation to show it's live
- Show session start time

### 2. Better Empty States
Add helpful messages when there's no data:
- "Start using apps to see your activity!"
- Tips on how the tracker works
- Sample data preview

### 3. App Icons
Instead of emoji, fetch real app icons:
- Use Windows API to get app icons
- Cache them in the database
- Fallback to emoji if icon not available

## Medium Effort Features

### 4. Idle Detection
Detect when user is away from keyboard:
- Use Windows API to check last input time
- Pause tracking after 5 minutes of inactivity
- Resume when user returns

### 5. App Categories
Let users categorize apps:
- Productive (green)
- Neutral (blue)
- Distracting (red)
- Show productivity score based on time spent

### 6. Time Limits & Notifications
Set daily limits for specific apps:
- Warning at 80% of limit
- Notification when limit reached
- Option to block app (advanced)

### 7. Better Charts
Add more visualization options:
- Stacked bar chart for daily comparison
- Line chart for weekly trends
- Heatmap for time of day patterns

## Advanced Features

### 8. Focus Mode
Pomodoro-style work sessions:
- 25-minute focus timer
- 5-minute break timer
- Block distracting apps during focus

### 9. Goals & Achievements
Gamification elements:
- Daily screen time goals
- Streaks for staying under limits
- Badges for achievements

### 10. Export & Backup
Data portability:
- Export reports as PDF
- Export raw data as CSV/JSON
- Backup/restore database

### 11. Multi-Monitor Support
Better tracking for multiple screens:
- Track which monitor apps are on
- Separate stats per monitor

### 12. Window Title Tracking
More granular tracking:
- Track specific tabs in browsers
- Track specific files in editors
- Search through window titles

## Technical Improvements

### 13. Better Error Handling
- Graceful degradation if PowerShell fails
- Retry logic for failed tracking attempts
- User-friendly error messages

### 14. Performance Optimization
- Reduce polling interval to 1 second
- Batch database writes
- Use prepared statements for all queries
- Add database indexes

### 15. Auto-Updates
- Check for new versions on startup
- Download and install updates automatically
- Show changelog

### 16. Settings UI
Add a settings page for:
- Polling interval
- Data retention (auto-delete old data)
- Theme selection
- Auto-start on boot
- Notification preferences

## Implementation Priority

**Phase 1** (Do first):
1. Show current session better
2. Better empty states
3. App categories
4. Time limits

**Phase 2** (After user feedback):
5. Idle detection
6. Better charts
7. Export reports
8. Settings UI

**Phase 3** (Nice to have):
9. Focus mode
10. Goals & achievements
11. Multi-monitor support
12. Auto-updates
