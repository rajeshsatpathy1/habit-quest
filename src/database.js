const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.NODE_ENV === 'test'
  ? path.resolve(__dirname, '../habits_test.db')
  : path.resolve(__dirname, '../habits.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    if (process.env.NODE_ENV !== 'test') {
      console.log('Connected to the SQLite database.');
    }
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Character table
    db.run(`CREATE TABLE IF NOT EXISTS character (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level INTEGER DEFAULT 1,
      exp INTEGER DEFAULT 0
    )`, (err) => {
      if (err) console.error("Error creating character table:", err);
      else {
        // Initialize character if not exists
        db.get("SELECT count(*) as count FROM character", (err, row) => {
          if (row.count === 0) {
            db.run("INSERT INTO character (level, exp) VALUES (1, 0)");
          }
        });
      }
    });

    // Habits table
    db.run(`CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      frequency TEXT,
      streak INTEGER DEFAULT 0,
      totalCompleted INTEGER DEFAULT 0,
      lastCompletedDate TEXT,
      lastActionDate TEXT,
      completionHistory TEXT,
      completedToday INTEGER DEFAULT 0,
      archived INTEGER DEFAULT 0
    )`, (err) => {
      if (err) console.error("Error creating habits table:", err);
      else {
        // Migration: Add archived column if missing (for existing databases)
        db.run("ALTER TABLE habits ADD COLUMN archived INTEGER DEFAULT 0", (err) => {
          // Ignore error if column already exists
        });
      }
    });
  });
}

module.exports = db;
