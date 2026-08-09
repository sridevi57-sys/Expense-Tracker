const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'expense-tracker-secret-key-12345';

app.use(cors());
app.use(express.json());

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

// --- JWT Authentication Middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// --- Helper Functions for Scoped Config Table ---
const getConfig = (userId, key, defaultValue) => {
  return new Promise((resolve) => {
    db.get('SELECT value FROM config WHERE user_id = ? AND key = ?', [userId, key], (err, row) => {
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

const setConfig = (userId, key, value) => {
  return new Promise((resolve, reject) => {
    const valueStr = JSON.stringify(value);
    db.run(
      'INSERT INTO config (user_id, key, value) VALUES (?, ?, ?) ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value',
      [userId, key, valueStr],
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

// --- AUTH ROUTING ---

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = crypto.randomUUID();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

      db.run(
        'INSERT INTO users (id, username, email, password, otp, otp_expiry, is_verified) VALUES (?, ?, ?, ?, ?, ?, 0)',
        [userId, username, email, hashedPassword, otp, otpExpiry],
        async (insertErr) => {
          if (insertErr) {
            return res.status(500).json({ error: insertErr.message });
          }

          // Send OTP email
          const mailOptions = {
            from: `"Expense Tracker" <${process.env.EMAIL_USER || 'no-reply@tracker.com'}>`,
            to: email,
            subject: 'Verification OTP - Expense Tracker',
            text: `Your verification OTP code is: ${otp}. It is valid for 15 minutes.`,
            html: `<p>Your verification OTP code is: <strong>${otp}</strong>.</p><p>It is valid for 15 minutes.</p>`
          };

          let otpLoggedConsole = false;
          try {
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
              throw new Error('Email credentials not configured');
            }
            await transporter.sendMail(mailOptions);
          } catch (mailErr) {
            // Mock connection fallback: log OTP to console
            console.log('\n========================================');
            console.log(`[EMAIL OTP MOCK] User: ${username} (${email})`);
            console.log(`Verification OTP Code: ${otp}`);
            console.log('========================================\n');
            otpLoggedConsole = true;
          }

          res.status(201).json({
            message: 'User registered. Please verify your email OTP.',
            email,
            otpLoggedConsole
          });
        }
      );
    } catch (hashErr) {
      res.status(500).json({ error: hashErr.message });
    }
  });
});

// Verify OTP Endpoint
app.post('/api/auth/verify', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid verification OTP code' });
    }

    if (Date.now() > user.otp_expiry) {
      return res.status(400).json({ error: 'OTP code has expired' });
    }

    db.run(
      'UPDATE users SET is_verified = 1, otp = NULL, otp_expiry = NULL WHERE id = ?',
      [user.id],
      (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        res.json({ message: 'Account verified successfully. You can now login.' });
      }
    );
  });
});

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.is_verified === 0) {
      return res.status(403).json({ error: 'Please verify your email before logging in', unverified: true });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  });
});

// --- SCOPED EXPENSES ENDPOINTS (Requires Auth) ---

app.get('/api/expenses', authenticateToken, (req, res) => {
  db.all('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, id DESC', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.put('/api/expenses', authenticateToken, (req, res) => {
  const expenses = req.body;
  if (!Array.isArray(expenses)) {
    return res.status(400).json({ error: 'Expected an array of expenses' });
  }

  // Validate items
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
    db.run('DELETE FROM expenses WHERE user_id = ?', [req.user.id], (err) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
    });

    const stmt = db.prepare('INSERT INTO expenses (id, user_id, title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
    let hasError = false;
    for (const exp of expenses) {
      stmt.run([exp.id, req.user.id, exp.title, exp.amount, exp.category, exp.date, exp.notes || ''], (err) => {
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

app.post('/api/expenses', authenticateToken, (req, res) => {
  const { id, title, amount, category, date, notes } = req.body;
  if (!id || typeof id !== 'string' ||
      !title || typeof title !== 'string' ||
      amount === undefined || typeof amount !== 'number' || isNaN(amount) || amount <= 0 ||
      !category || typeof category !== 'string' ||
      !date || typeof date !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid fields in expense payload' });
  }

  db.run(
    'INSERT INTO expenses (id, user_id, title, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, req.user.id, title, amount, category, date, notes || ''],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Expense added successfully' });
    }
  );
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, req.user.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  });
});

// --- SCOPED CONFIG ENDPOINTS (Requires Auth) ---

app.get('/api/income', authenticateToken, async (req, res) => {
  const income = await getConfig(req.user.id, 'income', 0);
  res.json({ income });
});

app.post('/api/income', authenticateToken, async (req, res) => {
  const { income } = req.body;
  if (income === undefined || typeof income !== 'number') {
    return res.status(400).json({ error: 'Invalid income' });
  }
  try {
    await setConfig(req.user.id, 'income', income);
    res.json({ message: 'Income updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/budgets', authenticateToken, async (req, res) => {
  const budgets = await getConfig(req.user.id, 'budgets', {});
  res.json({ budgets });
});

app.post('/api/budgets', authenticateToken, async (req, res) => {
  const { budgets } = req.body;
  if (!budgets || typeof budgets !== 'object') {
    return res.status(400).json({ error: 'Invalid budgets object' });
  }
  try {
    await setConfig(req.user.id, 'budgets', budgets);
    res.json({ message: 'Budgets updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/goals', authenticateToken, async (req, res) => {
  const goals = await getConfig(req.user.id, 'goals', {
    goalName: '',
    goalTarget: 0,
    currentSavings: 0,
    emergencyTarget: 0
  });
  res.json({ goals });
});

app.post('/api/goals', authenticateToken, async (req, res) => {
  const { goals } = req.body;
  if (!goals || typeof goals !== 'object') {
    return res.status(400).json({ error: 'Invalid goals object' });
  }
  try {
    await setConfig(req.user.id, 'goals', goals);
    res.json({ message: 'Goals updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  const profile = await getConfig(req.user.id, 'profile', { name: '', email: '' });
  res.json({ profile });
});

app.post('/api/profile', authenticateToken, async (req, res) => {
  const { profile } = req.body;
  if (!profile || typeof profile !== 'object') {
    return res.status(400).json({ error: 'Invalid profile object' });
  }
  try {
    await setConfig(req.user.id, 'profile', profile);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
