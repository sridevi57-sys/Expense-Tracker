const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

db.serialize(() => {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      otp TEXT,
      otp_expiry INTEGER,
      is_verified INTEGER DEFAULT 0
    )
  `);

  // Expenses Table (Scoped by user_id)
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Config Table (Scoped by user_id)
  db.run(`
    CREATE TABLE IF NOT EXISTS config (
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (user_id, key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
});

module.exports = db;
