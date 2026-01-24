// Daily Report Detail View Functions

// Load detailed view for a specific day
async function loadDailyReportDetail(date, fullDate) {
    const reportContent = document.querySelector('.report-content');

    // Get sessions for this date
    const sessions = await ipcRenderer.invoke('get-sessions-by-date', date);

    if (sessions.length === 0) {
        reportContent.innerHTML = '<p>No data for this date</p>';
        return;
    }

    // Calculate stats
    const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const unlockCount = sessions.length;

    // Get peak usage hours
    const hourlyUsage = {};
    sessions.forEach(session => {
        if (!session.duration) return;
        const hour = new Date(session.start_time).getHours();
        hourlyUsage[hour] = (hourlyUsage[hour] || 0) + session.duration;
    });

    let peakHour = 0;
    let maxUsage = 0;
    Object.entries(hourlyUsage).forEach(([hour, usage]) => {
        if (usage > maxUsage) {
            maxUsage = usage;
            peakHour = parseInt(hour);
        }
    });

    const peakStart = `${peakHour.toString().padStart(2, '0')}:00`;
    const peakEnd = `${(peakHour + 2).toString().padStart(2, '0')}:00`;

    // Build timeline with idle detection
    const timeline = [];
    const sortedSessions = sessions.sort((a, b) => a.start_time - b.start_time);

    for (let i = 0; i < sortedSessions.length; i++) {
        const session = sortedSessions[i];
        const nextSession = sortedSessions[i + 1];

        // Add active session
        timeline.push({
            type: 'active',
            time: new Date(session.start_time),
            app: session.app_name,
            duration: session.duration
        });

        // Check for idle time (gap > 1 minute)
        if (nextSession) {
            const gap = nextSession.start_time - session.end_time;
            if (gap > 60000) { // More than 1 minute
                timeline.push({
                    type: 'idle',
                    time: new Date(session.end_time),
                    duration: gap
                });
            }
        }
    }

    // Render detailed view
    let html = `
    <div class="daily-report-detail">
      <div class="detail-header">
        <button class="back-button" onclick="loadReports('daily')">← Back to Reports</button>
        <h3>${fullDate}</h3>
      </div>
      
      <!-- Summary Card -->
      <div class="summary-card">
        <div class="summary-stat">
          <div class="summary-label">Usage:</div>
          <div class="summary-value">${formatDuration(totalTime)}</div>
        </div>
        <div class="summary-stat">
          <div class="summary-label">Unlock:</div>
          <div class="summary-value">${unlockCount} times</div>
        </div>
      </div>
      
      <!-- Peak Usage -->
      <div class="peak-usage-card">
        <div class="peak-icon">🔥</div>
        <div>
          <div class="peak-label">Peak Usage</div>
          <div class="peak-time">${peakStart} - ${peakEnd}</div>
        </div>
      </div>
      
      <!-- Hourly Chart -->
      <div class="hourly-chart-container">
        <h4>Hourly Usage</h4>
        <div class="hourly-chart">
          ${Array.from({ length: 24 }, (_, hour) => {
        const usage = hourlyUsage[hour] || 0;
        const minutes = Math.round(usage / 60000);
        const maxMinutes = Math.max(...Object.values(hourlyUsage).map(u => u / 60000));
        const height = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0;
        return `
              <div class="hour-bar">
                <div class="bar" style="height: ${height}%"></div>
                <div class="hour-label">${hour.toString().padStart(2, '0')}</div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
      
      <!-- Timeline -->
      <div class="detailed-timeline">
        <h4>Timeline</h4>
        ${timeline.map(item => {
        const timeStr = item.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        if (item.type === 'idle') {
            const idleDuration = formatDuration(item.duration);
            return `
              <div class="timeline-item idle">
                <div class="timeline-time">${timeStr}</div>
                <div class="timeline-icon">😊</div>
                <div class="timeline-content">
                  <div class="timeline-app">Happy Hour</div>
                  <div class="timeline-duration">${idleDuration}</div>
                </div>
              </div>
            `;
        } else {
            return `
              <div class="timeline-item active">
                <div class="timeline-time">${timeStr}</div>
                <div class="timeline-icon app-icon" style="background: #00bfa5; width: 40px; height: 40px; font-size: 20px;">
                  ${getAppEmoji(item.app)}
                </div>
                <div class="timeline-content">
                  <div class="timeline-app">${item.app}</div>
                  <div class="timeline-duration">${formatDuration(item.duration)}</div>
                </div>
              </div>
            `;
        }
    }).join('')}
      </div>
    </div>
  `;

    reportContent.innerHTML = html;
}
