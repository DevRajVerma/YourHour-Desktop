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

    // Add test button
    addTestButton();
});

function addTestButton() {
    const header = document.querySelector('.view-header');
    const testBtn = document.createElement('button');
    testBtn.textContent = '🔄 Test Tracking';
    testBtn.style.cssText = 'padding: 10px 20px; background: #6c63ff; color: white; border: none; border-radius: 8px; cursor: pointer; margin-left: 20px;';
    testBtn.onclick = async () => {
        console.log('Testing tracking...');
        const status = await ipcRenderer.invoke('get-tracker-status');
        console.log('Tracker status:', status);

        const sessions = await ipcRenderer.invoke('get-today-sessions');
        console.log('Today sessions:', sessions);

        const stats = await ipcRenderer.invoke('get-today-stats');
        console.log('Today stats:', stats);

        alert(`Tracking: ${status.isTracking}\nCurrent App: ${status.currentApp ? status.currentApp.name : 'None'}\nSessions Today: ${sessions.length}`);

        // Force reload dashboard
        loadDashboard();
    };
    header.appendChild(testBtn);
}

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

// Dashboard
function initDashboard() {
    loadDashboard();
    // Refresh every 5 seconds
    setInterval(loadDashboard, 5000);
}

async function loadDashboard() {
    try {
        console.log('Loading dashboard...');
        const stats = await ipcRenderer.invoke('get-today-stats');
        console.log('Stats:', stats);
        const appStats = await ipcRenderer.invoke('get-app-stats', getTodayDate());
        console.log('App stats:', appStats);

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
        let startDate, endDate;

        if (type === 'daily') {
            startDate = endDate = today;
        } else if (type === 'weekly') {
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

        // Update chart
        updateChart(appStats);

        // Update table
        updateReportTable(appStats);

    } catch (error) {
        console.error('Error loading reports:', error);
    }
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
        console.log('App switched:', data);
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
