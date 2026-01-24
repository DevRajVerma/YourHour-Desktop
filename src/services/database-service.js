const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class DatabaseService {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'yourhour.db');
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  initDatabase() {
    // Create sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_name TEXT NOT NULL,
        window_title TEXT,
        process_name TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        date TEXT NOT NULL
      )
    `);

    // Create indexes for faster queries (HUGE performance boost!)
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_app_name ON sessions(app_name)`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_date_duration ON sessions(date, duration)`);

    // Create daily summaries table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS daily_summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        total_time INTEGER NOT NULL,
        app_count INTEGER NOT NULL,
        switch_count INTEGER NOT NULL,
        most_used_app TEXT
      )
    `);

    // Create app metadata table for categorization
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_metadata (
        app_name TEXT PRIMARY KEY,
        category TEXT DEFAULT 'neutral',
        color TEXT,
        icon TEXT
      )
    `);

    console.log('Database initialized with indexes');
  }

  // Insert a new session
  insertSession(appName, windowTitle, processName, startTime) {
    const date = new Date(startTime).toISOString().split('T')[0];
    const stmt = this.db.prepare(`
      INSERT INTO sessions (app_name, window_title, process_name, start_time, date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(appName, windowTitle, processName, startTime, date);
    return result.lastInsertRowid;
  }

  // Update session end time and duration
  endSession(sessionId, endTime) {
    const session = this.db.prepare('SELECT start_time FROM sessions WHERE id = ?').get(sessionId);
    if (session) {
      const duration = endTime - session.start_time;
      this.db.prepare(`
        UPDATE sessions 
        SET end_time = ?, duration = ?
        WHERE id = ?
      `).run(endTime, duration, sessionId);
    }
  }

  // Get sessions for a specific date
  getSessionsByDate(date) {
    return this.db.prepare(`
      SELECT * FROM sessions 
      WHERE date = ? 
      ORDER BY start_time ASC
    `).all(date);
  }

  // Get today's sessions
  getTodaySessions() {
    const today = new Date().toISOString().split('T')[0];
    return this.getSessionsByDate(today);
  }

  // Get app statistics for a date
  getAppStats(date) {
    return this.db.prepare(`
      SELECT 
        app_name,
        SUM(duration) as total_time,
        COUNT(*) as session_count,
        MAX(end_time) as last_used
      FROM sessions
      WHERE date = ? AND duration IS NOT NULL
      GROUP BY app_name
      ORDER BY total_time DESC
    `).all(date);
  }

  // Get today's total stats
  getTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const stats = this.db.prepare(`
      SELECT 
        SUM(duration) as total_time,
        COUNT(DISTINCT app_name) as app_count,
        COUNT(*) as switch_count
      FROM sessions
      WHERE date = ? AND duration IS NOT NULL
    `).get(today);

    const mostUsed = this.db.prepare(`
      SELECT app_name, SUM(duration) as total_time
      FROM sessions
      WHERE date = ? AND duration IS NOT NULL
      GROUP BY app_name
      ORDER BY total_time DESC
      LIMIT 1
    `).get(today);

    return {
      ...stats,
      most_used_app: mostUsed ? mostUsed.app_name : null
    };
  }

  // Get date range stats
  getDateRangeStats(startDate, endDate) {
    return this.db.prepare(`
      SELECT 
        date,
        SUM(duration) as total_time,
        COUNT(DISTINCT app_name) as app_count
      FROM sessions
      WHERE date BETWEEN ? AND ? AND duration IS NOT NULL
      GROUP BY date
      ORDER BY date ASC
    `).all(startDate, endDate);
  }

  // Get peak usage hours for today
  getPeakUsageHours(date) {
    const sessions = this.getSessionsByDate(date);
    const hourlyUsage = {};

    sessions.forEach(session => {
      if (!session.duration) return;

      const startHour = new Date(session.start_time).getHours();
      const endHour = new Date(session.end_time).getHours();

      for (let hour = startHour; hour <= endHour; hour++) {
        if (!hourlyUsage[hour]) hourlyUsage[hour] = 0;
        hourlyUsage[hour] += session.duration;
      }
    });

    let peakHour = 0;
    let maxUsage = 0;

    Object.entries(hourlyUsage).forEach(([hour, usage]) => {
      if (usage > maxUsage) {
        maxUsage = usage;
        peakHour = parseInt(hour);
      }
    });

    return {
      peakHour,
      peakUsage: maxUsage,
      hourlyData: hourlyUsage
    };
  }

  // Get hourly grouped sessions
  getHourlyGroupedSessions(date) {
    const sessions = this.getSessionsByDate(date);
    const hourlyGroups = {};

    sessions.forEach(session => {
      if (!session.duration) return;

      const hour = new Date(session.start_time).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;

      if (!hourlyGroups[hourKey]) {
        hourlyGroups[hourKey] = {
          hour: hourKey,
          apps: [],
          totalTime: 0
        };
      }

      hourlyGroups[hourKey].apps.push(session);
      hourlyGroups[hourKey].totalTime += session.duration;
    });

    return Object.values(hourlyGroups).sort((a, b) => a.hour.localeCompare(b.hour));
  }

  // Set app category
  setAppCategory(appName, category) {
    this.db.prepare(`
      INSERT INTO app_metadata (app_name, category)
      VALUES (?, ?)
      ON CONFLICT(app_name) DO UPDATE SET category = ?
    `).run(appName, category, category);
  }

  // Get app category
  getAppCategory(appName) {
    const result = this.db.prepare('SELECT category FROM app_metadata WHERE app_name = ?').get(appName);
    return result ? result.category : 'neutral';
  }

  // Get daily reports for last N days in ONE query (instead of 30 queries!)
  getDailyReportsForRange(days = 30) {
    return this.db.prepare(`
      SELECT 
        date,
        SUM(duration) as total_time,
        COUNT(*) as unlock_count
      FROM sessions
      WHERE date >= date('now', '-' || ? || ' days') AND duration IS NOT NULL
      GROUP BY date
      ORDER BY date DESC
    `).all(days);
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseService;
