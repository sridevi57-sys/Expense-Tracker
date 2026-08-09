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
  // Expenses Table
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT
    )
  `);

  // Config Table (for storing Income, Profile, Goals, Budgets, etc.)
  db.run(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `, [], (err) => {
    if (!err) {
      // Seed default configs if not set
      db.get("SELECT COUNT(*) as count FROM config", [], (err, row) => {
        if (!err && row.count === 0) {
          db.run("INSERT INTO config (key, value) VALUES ('income', '45000')");
          db.run("INSERT INTO config (key, value) VALUES ('budgets', '{\"Food\":8000,\"Transport\":4000,\"Bills\":20000}')");
          db.run("INSERT INTO config (key, value) VALUES ('goals', '{\"goalName\":\"New Laptop\",\"goalTarget\":50000,\"currentSavings\":12000,\"emergencyTarget\":25000}')");
          db.run("INSERT INTO config (key, value) VALUES ('profile', '{\"name\":\"Guest User\",\"email\":\"guest@example.com\"}')");
        }
      });
    }
  });

  // Seed sample expenses if table is empty
  db.get("SELECT COUNT(*) as count FROM expenses", [], (err, row) => {
    if (!err && row.count === 0) {
      const today = new Date().toISOString().split('T')[0];
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      db.run("INSERT INTO expenses (id, title, amount, category, date, notes) VALUES ('seed-1', 'Apartment Rent', 15000, 'Bills', ?, 'Monthly rental payment')", [fiveDaysAgo]);
      db.run("INSERT INTO expenses (id, title, amount, category, date, notes) VALUES ('seed-2', 'Weekly Groceries', 2450.50, 'Food', ?, 'Supermarket shopping')", [twoDaysAgo]);
      db.run("INSERT INTO expenses (id, title, amount, category, date, notes) VALUES ('seed-3', 'Fuel Refill', 1200, 'Transport', ?, 'Petrol station')", [oneDayAgo]);
      db.run("INSERT INTO expenses (id, title, amount, category, date, notes) VALUES ('seed-4', 'Movie Tickets', 850, 'Other', ?, 'Popcorn and entertainment')", [today]);
    }
  });
});

module.exports = db;
