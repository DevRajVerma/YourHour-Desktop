const { ipcRenderer } = require('electron');

// State
let currentView = 'dashboard';
let currentChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Renderer initialized');
    initNavigation();
    initDashboard();
    initTimeline();
    initReports();
    initApps();
    setupIPCListeners();

    // Test button removed for performance
});

// Test button removed for performance

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);

            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function switchView(view) {
    currentView = view;
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');

    // Load data for the view
    if (view === 'dashboard') loadDashboard();
    if (view === 'timeline') loadTimeline();
    if (view === 'reports') loadReports();
    if (view === 'apps') loadApps();
}

// Dashboard - optimized with visibility-based refresh
let dashboardInterval = null;

function initDashboard() {
    loadDashboard();

    // Only refresh when tab is visible (saves CPU when minimized)
    dashboardInterval = setInterval(() => {
        if (!document.hidden && currentView === 'dashboard') {
            loadDashboard();
        }
    }, 10000); // Refresh every 10 seconds instead of 5

    // Refresh immediately when tab becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && currentView === 'dashboard') {
            loadDashboard();
        }
    });
}

async function loadDashboard() {
    try {
        const stats = await ipcRenderer.invoke('get-today-stats');
        const appStats = await ipcRenderer.invoke('get-app-stats', getTodayDate());

        // Update app switches counter (new element)
        const switchesEl = document.getElementById('total-switches');
        if (switchesEl) {
            switchesEl.textContent = `${stats.switch_count || 0} times`;
        }

        // Update stats cards
        const totalTimeEl = document.getElementById('total-time');
        const appCountEl = document.getElementById('app-count');
        const mostUsedEl = document.getElementById('most-used');

        if (totalTimeEl) totalTimeEl.textContent = formatDuration(stats.total_time || 0);
        if (appCountEl) appCountEl.textContent = stats.app_count || 0;
        if (mostUsedEl) mostUsedEl.textContent = stats.most_used_app || '-';

        // Update top apps
        const topAppsList = document.getElementById('top-apps-list');
        if (topAppsList) {
            topAppsList.innerHTML = '';

            if (appStats.length === 0) {
                topAppsList.innerHTML = '<p style="color: #7f8c8d; padding: 20px; text-align: center;">No data yet. Tracking will start automatically...</p>';
            } else {
                appStats.slice(0, 5).forEach((app, index) => {
                    const appItem = createAppItem(app, index);
                    topAppsList.appendChild(appItem);
                });
            }
        }

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function createAppItem(app, index) {
    const div = document.createElement('div');
    div.className = 'app-item';

    const colors = ['#6c63ff', '#4ecdc4', '#ffd93d', '#ff6b6b', '#95e1d3'];
    const color = colors[index % colors.length];

    div.innerHTML = `
    <div class="app-info">
      <div class="app-icon" style="background: ${color}">
        ${getAppEmoji(app.app_name)}
      </div>
      <div class="app-details">
        <h4>${app.app_name}</h4>
        <p>${app.session_count} sessions</p>
      </div>
    </div>
    <div class="app-time">${formatDuration(app.total_time)}</div>
  `;

    return div;
}

function getAppEmoji(appName) {
    const lower = appName.toLowerCase();
    if (lower.includes('chrome') || lower.includes('edge') || lower.includes('firefox')) return '🌐';
    if (lower.includes('code') || lower.includes('studio')) return '💻';
    if (lower.includes('word') || lower.includes('excel') || lower.includes('powerpoint')) return '📄';
    if (lower.includes('spotify') || lower.includes('music')) return '🎵';
    if (lower.includes('discord') || lower.includes('slack') || lower.includes('teams')) return '💬';
    if (lower.includes('photoshop') || lower.includes('illustrator')) return '🎨';
    return '📱';
}

// Timeline
function initTimeline() {
    const dateInput = document.getElementById('timeline-date');
    dateInput.value = getTodayDate();
    dateInput.addEventListener('change', () => {
        loadTimeline(dateInput.value);
    });
    loadTimeline();
}

async function loadTimeline(date = getTodayDate()) {
    try {
        const sessions = await ipcRenderer.invoke('get-sessions-by-date', date);
        const timelineContainer = document.getElementById('hourly-timeline');
        const timelineDetails = document.getElementById('timeline-details');

        if (!timelineContainer || !timelineDetails) {
            console.error('Timeline elements not found');
            return;
        }

        timelineContainer.innerHTML = '';

        if (sessions.length === 0) {
            timelineDetails.innerHTML = '<p style="color: #7f8c8d; padding: 20px; text-align: center;">No sessions recorded for this date. Start using apps and they will appear here!</p>';
            return;
        }

        // Create timeline visualization with vertical bars
        let timelineHTML = '<div class="timeline-bars">';
        let detailsHTML = '<div class="apps-list">';

        sessions.forEach((session, index) => {
            if (!session.duration) return;

            const colors = ['#00bfa5', '#4ecdc4', '#ffd93d', '#ff6b6b', '#95e1d3'];
            const color = colors[index % colors.length];

            const startTime = new Date(session.start_time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const endTime = new Date(session.end_time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            timelineHTML += `
        <div class="timeline-bar">
          <span class="timeline-time">${startTime}</span>
          <span class="timeline-bar-label">
            <span class="app-icon" style="background: ${color}; width: 32px; height: 32px; font-size: 16px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; margin-right: 8px;">
              ${getAppEmoji(session.app_name)}
            </span>
            <strong>${session.app_name}</strong>
            <span style="color: #7f8c8d; margin: 0 8px;">•</span>
            <span style="color: #7f8c8d;">${formatDuration(session.duration)}</span>
          </span>
        </div>
      `;

            detailsHTML += `
        <div class="app-item">
          <div class="app-info">
            <div class="app-icon" style="background: ${color}">
              ${getAppEmoji(session.app_name)}
            </div>
            <div class="app-details">
              <h4>${session.app_name}</h4>
              <p>${startTime} - ${endTime}</p>
            </div>
          </div>
          <div class="app-time">${formatDuration(session.duration)}</div>
        </div>
      `;
        });

        timelineHTML += '</div>';
        detailsHTML += '</div>';

        timelineContainer.innerHTML = timelineHTML;
        timelineDetails.innerHTML = detailsHTML;

    } catch (error) {
        console.error('Error loading timeline:', error);
    }
}

// Reports
function initReports() {
    const reportType = document.getElementById('report-type');
    reportType.addEventListener('change', () => {
        loadReports(reportType.value);
    });
    loadReports('daily');
}

async function loadReports(type = 'daily') {
    try {
        const today = getTodayDate();

        if (type === 'daily') {
            // Show list of daily reports for last 30 days
            await loadDailyReportsList();
        } else {
            // Show chart and table for weekly/monthly
            let startDate, endDate;

            if (type === 'weekly') {
                const date = new Date();
                date.setDate(date.getDate() - 7);
                startDate = date.toISOString().split('T')[0];
                endDate = today;
            } else if (type === 'monthly') {
                const date = new Date();
                date.setDate(date.getDate() - 30);
                startDate = date.toISOString().split('T')[0];
                endDate = today;
            }

            const appStats = await ipcRenderer.invoke('get-app-stats', endDate);
            updateChart(appStats);
            updateReportTable(appStats);
        }

    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

async function loadDailyReportsList() {
    const reportContent = document.querySelector('.report-content');

    // Get last 30 days of data in ONE query (instead of 30 queries!)
    const rawReports = await ipcRenderer.invoke('get-daily-reports-range', 30);

    // Transform to our format
    const dailyReports = rawReports.map(report => {
        const dateObj = new Date(report.date + 'T00:00:00');
        return {
            date: report.date,
            dateObj: dateObj,
            totalTime: report.total_time || 0,
            unlockCount: report.unlock_count || 0
        };
    });

    // Calculate percentage changes
    for (let i = 0; i < dailyReports.length; i++) {
        if (i < dailyReports.length - 1) {
            const current = dailyReports[i];
            const previous = dailyReports[i + 1];

            const timeChange = previous.totalTime > 0
                ? Math.round(((current.totalTime - previous.totalTime) / previous.totalTime) * 100)
                : 0;

            const unlockChange = previous.unlockCount > 0
                ? Math.round(((current.unlockCount - previous.unlockCount) / previous.unlockCount) * 100)
                : 0;

            current.timeChange = timeChange;
            current.unlockChange = unlockChange;
        }
    }

    // Render daily reports list
    let html = '<div class="daily-reports-list">';

    dailyReports.forEach((report, index) => {
        const dayNum = report.dateObj.getDate();
        const monthName = report.dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const fullDate = report.dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

        const timeChangeColor = report.timeChange > 0 ? '#ff6b6b' : '#4ecdc4';
        const unlockChangeColor = report.unlockChange > 0 ? '#ff6b6b' : '#4ecdc4';
        const timeArrow = report.timeChange > 0 ? '↑' : '↓';
        const unlockArrow = report.unlockChange > 0 ? '↑' : '↓';

        html += `
      <div class="daily-report-item" onclick="showDailyDetail('${report.date}', '${fullDate}')">
        <div class="report-date-badge">
          <div class="report-day">${dayNum}</div>
          <div class="report-month">${monthName}</div>
        </div>
        <div class="report-details">
          <div class="report-date-full">${fullDate}</div>
          <div class="report-stats">
            <div class="report-stat">
              <span class="stat-label">Usage:</span>
              <span class="stat-value">${formatDuration(report.totalTime)}</span>
              ${index < dailyReports.length - 1 ? `<span class="stat-change" style="color: ${timeChangeColor}">${timeArrow}${Math.abs(report.timeChange)}%</span>` : ''}
            </div>
            <div class="report-stat">
              <span class="stat-label">Unlocks:</span>
              <span class="stat-value">${report.unlockCount}</span>
              ${index < dailyReports.length - 1 ? `<span class="stat-change" style="color: ${unlockChangeColor}">${unlockArrow}${Math.abs(report.unlockChange)}%</span>` : ''}
            </div>
          </div>
        </div>
        <div class="report-arrow">›</div>
      </div>
    `;
    });

    html += '</div>';
    reportContent.innerHTML = html;
}

function updateChart(appStats) {
    const ctx = document.getElementById('usage-chart').getContext('2d');

    if (currentChart) {
        currentChart.destroy();
    }

    if (appStats.length === 0) {
        // Show message if no data
        ctx.font = '16px Segoe UI';
        ctx.fillStyle = '#a0a0b8';
        ctx.textAlign = 'center';
        ctx.fillText('No data available yet', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const topApps = appStats.slice(0, 10);

    currentChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: topApps.map(app => app.app_name),
            datasets: [{
                data: topApps.map(app => app.total_time / 1000 / 60), // Convert to minutes
                backgroundColor: [
                    '#6c63ff', '#4ecdc4', '#ffd93d', '#ff6b6b', '#95e1d3',
                    '#a8e6cf', '#ffd3b6', '#ffaaa5', '#ff8b94', '#c7ceea'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#a0a0b8',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const minutes = Math.round(context.parsed);
                            return `${context.label}: ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
                        }
                    }
                }
            }
        }
    });
}

function updateReportTable(appStats) {
    const tbody = document.querySelector('#report-data tbody');
    tbody.innerHTML = '';

    if (appStats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #a0a0b8; padding: 40px;">No data available. Start using apps to see reports!</td></tr>';
        return;
    }

    const totalTime = appStats.reduce((sum, app) => sum + app.total_time, 0);

    appStats.forEach(app => {
        const row = document.createElement('tr');
        const percentage = ((app.total_time / totalTime) * 100).toFixed(1);

        row.innerHTML = `
      <td>${app.app_name}</td>
      <td>${formatDuration(app.total_time)}</td>
      <td>${app.session_count}</td>
      <td>${percentage}%</td>
    `;

        tbody.appendChild(row);
    });
}

// Apps
function initApps() {
    const searchInput = document.getElementById('app-search');
    searchInput.addEventListener('input', (e) => {
        filterApps(e.target.value);
    });
    loadApps();
}

async function loadApps() {
    try {
        const appStats = await ipcRenderer.invoke('get-app-stats', getTodayDate());
        renderAppsTable(appStats);
    } catch (error) {
        console.error('Error loading apps:', error);
    }
}

function renderAppsTable(appStats) {
    const tbody = document.querySelector('#apps-table tbody');
    tbody.innerHTML = '';

    if (appStats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #a0a0b8; padding: 40px;">No apps tracked yet. The tracker will detect apps automatically!</td></tr>';
        return;
    }

    appStats.forEach(app => {
        const row = document.createElement('tr');
        const lastUsed = app.last_used ? new Date(app.last_used).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }) : '-';

        row.innerHTML = `
      <td>${app.app_name}</td>
      <td>${formatDuration(app.total_time)}</td>
      <td>${app.session_count}</td>
      <td>${lastUsed}</td>
      <td><span class="category-badge">Neutral</span></td>
    `;

        tbody.appendChild(row);
    });
}

function filterApps(query) {
    const rows = document.querySelectorAll('#apps-table tbody tr');
    rows.forEach(row => {
        const appName = row.cells[0].textContent.toLowerCase();
        if (appName.includes(query.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// IPC Listeners
function setupIPCListeners() {
    // Update current app display
    ipcRenderer.on('tracker-status', (event, status) => {
        if (status.currentApp) {
            document.getElementById('current-app').textContent = status.currentApp.name;
            document.getElementById('current-duration').textContent = formatDuration(status.currentSessionDuration);
        } else {
            document.getElementById('current-app').textContent = 'Waiting for activity...';
            document.getElementById('current-duration').textContent = '0:00';
        }
    });

    ipcRenderer.on('app-switch', (event, data) => {
        // Refresh dashboard if on that view
        if (currentView === 'dashboard') {
            loadDashboard();
        }
    });
}

// Utility Functions
function formatDuration(ms) {
    if (!ms) return '0m';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${seconds}s`;
    }
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}


// Show daily detail view
async function showDailyDetail(date, fullDate) {
    const reportContent = document.querySelector('.report-content');
    const sessions = await ipcRenderer.invoke('get-sessions-by-date', date);

    if (sessions.length === 0) {
        reportContent.innerHTML = '<p style="padding: 40px; text-align: center;">No data for this date</p>';
        return;
    }

    const totalTime = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const unlockCount = sessions.length;

    const hourlyUsage = {};
    sessions.forEach(session => {
        if (!session.duration) return;
        const hour = new Date(session.start_time).getHours();
        hourlyUsage[hour] = (hourlyUsage[hour] || 0) + session.duration;
    });

    let peakHour = 0, maxUsage = 0;
    Object.entries(hourlyUsage).forEach(([hour, usage]) => {
        if (usage > maxUsage) { maxUsage = usage; peakHour = parseInt(hour); }
    });

    const peakStart = peakHour < 12 ? `${peakHour || 12}:00 AM` : `${peakHour === 12 ? 12 : peakHour - 12}:00 PM`;
    const peakEnd = (peakHour + 2) < 12 ? `${(peakHour + 2) || 12}:00 AM` : `${(peakHour + 2) === 12 ? 12 : (peakHour + 2) - 12}:00 PM`;

    const timeline = [];
    const sortedSessions = sessions.sort((a, b) => a.start_time - b.start_time);

    for (let i = 0; i < sortedSessions.length; i++) {
        const session = sortedSessions[i];
        const nextSession = sortedSessions[i + 1];
        timeline.push({ type: 'active', time: new Date(session.start_time), app: session.app_name, duration: session.duration });
        if (nextSession && (nextSession.start_time - session.end_time) > 60000) {
            timeline.push({ type: 'idle', time: new Date(session.end_time), duration: nextSession.start_time - session.end_time });
        }
    }

    reportContent.innerHTML = `
    <div class="daily-report-detail">
      <button class="back-button" onclick="loadReports('daily')">← Back</button>
      <h3 style="margin: 16px 0;">${fullDate}</h3>
      <div class="summary-card" style="background: linear-gradient(135deg, #00bfa5, #00897b); color: white; padding: 24px; border-radius: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-around;">
          <div><div style="font-size: 14px; opacity: 0.9;">Usage:</div><div style="font-size: 28px; font-weight: 700;">${formatDuration(totalTime)}</div></div>
          <div><div style="font-size: 14px; opacity: 0.9;">Unlock:</div><div style="font-size: 28px; font-weight: 700;">${unlockCount} times</div></div>
        </div>
      </div>
      <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a6f); color: white; padding: 20px; border-radius: 12px; margin-bottom: 16px; display: flex; align-items: center; gap: 16px;">
        <div style="font-size: 40px;">🔥</div>
        <div><div style="font-size: 14px; opacity: 0.9;">Peak Usage</div><div style="font-size: 20px; font-weight: 600;">${peakStart} - ${peakEnd}</div></div>
      </div>
      <div style="background: white; padding: 24px; border-radius: 12px; margin-bottom: 16px;">
        <h4 style="margin-bottom: 16px;">Hourly Usage</h4>
        <div style="display: flex; gap: 4px; height: 120px; align-items: flex-end;">
          ${Array.from({ length: 24 }, (_, hour) => {
        const usage = hourlyUsage[hour] || 0;
        const maxMin = Math.max(...Object.values(hourlyUsage).map(u => u / 60000), 1);
        const height = ((usage / 60000) / maxMin) * 100;
        return `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;"><div style="width: 100%; background: #00bfa5; border-radius: 4px 4px 0 0; height: ${height}%;"></div><div style="font-size: 10px; color: #7f8c8d;">${hour.toString().padStart(2, '0')}</div></div>`;
    }).join('')}
        </div>
      </div>
      <div style="background: white; padding: 24px; border-radius: 12px;">
        <h4 style="margin-bottom: 20px;">Timeline</h4>
        <div style="position: relative; padding-left: 80px;">
          ${(() => {
            const hourlyGroups = {};
            sortedSessions.forEach(session => {
                const hour = new Date(session.start_time).getHours();
                if (!hourlyGroups[hour]) hourlyGroups[hour] = [];
                hourlyGroups[hour].push(session);
            });

            let html = '';
            let lastHour = -1;

            for (let hour = 0; hour < 24; hour++) {
                const sessions = hourlyGroups[hour];

                if (sessions && sessions.length > 0) {
                    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
                    const hourTime = hour === 0 ? '12:00 AM' : hour < 12 ? hour + ':00 AM' : hour === 12 ? '12:00 PM' : (hour - 12) + ':00 PM';

                    if (lastHour >= 0 && hour - lastHour > 1) {
                        const idleStart = lastHour + 1;
                        const idleTime = idleStart === 0 ? '12:00 AM' : idleStart < 12 ? idleStart + ':00 AM' : idleStart === 12 ? '12:00 PM' : (idleStart - 12) + ':00 PM';
                        html += `
                    <div style="position: relative; margin: 16px 0; padding: 20px; background: linear-gradient(135deg, #e0f7fa, #b2ebf2); border-radius: 12px;">
                      <div style="position: absolute; left: -80px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #546e7a; width: 70px; text-align: right; font-weight: 500;">
                        ${idleTime}
                      </div>
                      <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="font-size: 40px;">😊</div>
                        <div>
                          <div style="font-weight: 600; color: #00897b; font-size: 16px;">Happy Hour</div>
                          <div style="font-size: 13px; color: #546e7a;">Idle Time</div>
                        </div>
                      </div>
                    </div>
                  `;
                    }

                    html += `
                  <div style="position: relative; margin: 24px 0;">
                    <div style="position: absolute; left: -80px; top: 12px; font-size: 13px; color: #546e7a; width: 70px; text-align: right; font-weight: 500;">
                      ${hourTime}
                    </div>
                    <div style="position: absolute; left: -14px; top: 16px; width: 14px; height: 14px; background: #00bfa5; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #00bfa5; z-index: 2;"></div>
                    <div style="border-left: 3px solid #00bfa5; padding-left: 24px; padding-bottom: 12px; min-height: 50px;">
                      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        ${sessions.slice(0, 6).map(s => `
                          <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #00bfa5, #00897b); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 2px 6px rgba(0,191,165,0.3);">
                            ${getAppEmoji(s.app_name)}
                          </div>
                        `).join('')}
                        ${sessions.length > 6 ? `
                          <div style="padding: 4px 12px; background: #e1e8ed; border-radius: 12px; font-size: 12px; color: #546e7a; font-weight: 500;">
                            +${sessions.length - 6}
                          </div>
                        ` : ''}
                        <div style="margin-left: auto; font-size: 15px; font-weight: 600; color: #2c3e50;">
                          ${formatDuration(totalDuration)}
                        </div>
                      </div>
                    </div>
                  </div>
                `;

                    lastHour = hour;
                }
            }

            return html;
        })()}
        </div>
      </div>
    </div>
  `;
}

