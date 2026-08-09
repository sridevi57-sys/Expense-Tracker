const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Helper Functions for Config Table ---
const getConfig = (key, defaultValue) => {
  return new Promise((resolve) => {
    db.get('SELECT value FROM config WHERE key = ?', [key], (err, row) => {
      if (err || !row) {
        resolve(defaultValue);
      } else {
        try {
          resolve(JSON.parse(row.value));
        } catch {
          resolve(row.value);
        }
      }
    });
  });
};

const setConfig = (key, value) => {
  return new Promise((resolve, reject) => {
    const valueStr = JSON.stringify(value);
    db.run(
      'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, valueStr],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

// --- API Endpoints ---

// 1. Expenses Endpoints
app.get('/api/expenses', (req, res) => {
  db.all('SELECT * FROM expenses ORDER BY date DESC, id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.put('/api/expenses', (req, res) => {
  const expenses = req.body;
  if (!Array.isArray(expenses)) {
    return res.status(400).json({ error: 'Expected an array of expenses' });
  }

  // Validate all items before database modification
  for (const exp of expenses) {
    if (!exp.id || typeof exp.id !== 'string' ||
        !exp.title || typeof exp.title !== 'string' ||
        exp.amount === undefined || typeof exp.amount !== 'number' || isNaN(exp.amount) || exp.amount <= 0 ||
        !exp.category || typeof exp.category !== 'string' ||
        !exp.date || typeof exp.date !== 'string') {
      return res.status(400).json({ error: 'Invalid expense item in the sync list' });
    }
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run('DELETE FROM expenses', [], (err) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
    });

    const stmt = db.prepare('INSERT INTO expenses (id, title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)');
    let hasError = false;
    for (const exp of expenses) {
      stmt.run([exp.id, exp.title, exp.amount, exp.category, exp.date, exp.notes || ''], (err) => {
        if (err) {
          hasError = true;
        }
      });
    }
    stmt.finalize((err) => {
      if (err || hasError) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to insert some expenses during sync' });
      }
      db.run('COMMIT', (commitErr) => {
        if (commitErr) {
          return res.status(500).json({ error: commitErr.message });
        }
        res.json({ message: 'Expenses synced successfully' });
      });
    });
  });
});

app.post('/api/expenses', (req, res) => {
  const { id, title, amount, category, date, notes } = req.body;
  if (!id || typeof id !== 'string' ||
      !title || typeof title !== 'string' ||
      amount === undefined || typeof amount !== 'number' || isNaN(amount) || amount <= 0 ||
      !category || typeof category !== 'string' ||
      !date || typeof date !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid fields in expense payload' });
  }

  db.run(
    'INSERT INTO expenses (id, title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [id, title, amount, category, date, notes || ''],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Expense added successfully' });
    }
  );
});

app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM expenses WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  });
});

// 2. Income Endpoints
app.get('/api/income', async (req, res) => {
  const income = await getConfig('income', 0);
  res.json({ income });
});

app.post('/api/income', async (req, res) => {
  const { income } = req.body;
  if (income === undefined || typeof income !== 'number') {
    return res.status(400).json({ error: 'Invalid income' });
  }
  try {
    await setConfig('income', income);
    res.json({ message: 'Income updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Budgets Endpoints
app.get('/api/budgets', async (req, res) => {
  const budgets = await getConfig('budgets', {});
  res.json({ budgets });
});

app.post('/api/budgets', async (req, res) => {
  const { budgets } = req.body;
  if (!budgets || typeof budgets !== 'object') {
    return res.status(400).json({ error: 'Invalid budgets object' });
  }
  try {
    await setConfig('budgets', budgets);
    res.json({ message: 'Budgets updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Goals Endpoints
app.get('/api/goals', async (req, res) => {
  const goals = await getConfig('goals', {
    goalName: '',
    goalTarget: 0,
    currentSavings: 0,
    emergencyTarget: 0
  });
  res.json({ goals });
});

app.post('/api/goals', async (req, res) => {
  const { goals } = req.body;
  if (!goals || typeof goals !== 'object') {
    return res.status(400).json({ error: 'Invalid goals object' });
  }
  try {
    await setConfig('goals', goals);
    res.json({ message: 'Goals updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Profile Endpoints
app.get('/api/profile', async (req, res) => {
  const profile = await getConfig('profile', { name: '', email: '' });
  res.json({ profile });
});

app.post('/api/profile', async (req, res) => {
  const { profile } = req.body;
  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ error: 'Invalid profile object' });
  }
  try {
    await setConfig('profile', profile);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
