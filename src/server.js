const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Tailscale Identity Middleware
app.use((req, res, next) => {
  const tsUser = req.headers['tailscale-user-login'];
  const tsName = req.headers['tailscale-user-name'];

  if (tsUser) {
    req.tailscaleUser = { login: tsUser, name: tsName };
  }
  next();
});

// API Routes

// Reset database
app.post('/api/reset', (req, res) => {
  db.serialize(() => {
    db.run("DELETE FROM habits", (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      db.run("UPDATE character SET level = 1, exp = 0", (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ message: 'Database reset successful' });
      });
    });
  });
});

// Get all data
app.get('/api/data', (req, res) => {
  const response = {
    character: { level: 1, exp: 0, expToNextLevel: 100 },
    habits: []
  };

  db.serialize(() => {
    db.get("SELECT * FROM character LIMIT 1", (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (row) {
        response.character.level = row.level;
        response.character.exp = row.exp;
        // Calculate dynamic expToNextLevel based on level
        response.character.expToNextLevel = Math.floor(100 * Math.pow(row.level, 1.5));
      }

      db.all("SELECT * FROM habits WHERE archived = 0 OR archived IS NULL", (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        response.habits = rows.map(habit => ({
          ...habit,
          completedToday: !!habit.completedToday,
          completionHistory: habit.completionHistory ? JSON.parse(habit.completionHistory) : []
        }));
        res.json(response);
      });
    });
  });
});

// Add habit
app.post('/api/habit', (req, res) => {
  const { id, name, frequency, streak, totalCompleted, lastCompletedDate, lastActionDate, completionHistory, completedToday } = req.body;
  const historyStr = JSON.stringify(completionHistory);

  // Check if habit exists (even if archived) to restore it or create new
  // For simplicity, we'll just create a new one or update if ID matches, but the ID is timestamp based.
  // Actually, if the user adds a habit with the same name, we might want to "restore" previous stats?
  // The user asked for "autocomplete", not necessarily full restore of old stats for a new instance.
  // So we'll stick to creating a new habit, but maybe we can check if a deleted one exists with same name?
  // Let's keep it simple: Create new. Autocomplete just helps with the name.

  db.run(`INSERT INTO habits (id, name, frequency, streak, totalCompleted, lastCompletedDate, lastActionDate, completionHistory, completedToday, archived) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [id, name, frequency, streak, totalCompleted, lastCompletedDate, lastActionDate, historyStr, completedToday ? 1 : 0],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id });
    }
  );
});

// Update habit
app.put('/api/habit/:id', (req, res) => {
  const { name, frequency, streak, totalCompleted, lastCompletedDate, lastActionDate, completionHistory, completedToday } = req.body;
  const sql = `UPDATE habits SET 
               name = COALESCE(?, name), 
               frequency = COALESCE(?, frequency), 
               streak = COALESCE(?, streak), 
               totalCompleted = COALESCE(?, totalCompleted), 
               lastCompletedDate = COALESCE(?, lastCompletedDate), 
               lastActionDate = COALESCE(?, lastActionDate), 
               completionHistory = COALESCE(?, completionHistory), 
               completedToday = COALESCE(?, completedToday) 
               WHERE id = ?`;
  const params = [name, frequency, streak, totalCompleted, lastCompletedDate, lastActionDate, JSON.stringify(completionHistory), completedToday ? 1 : 0, req.params.id];

  db.run(sql, params, function (err) {
    if (err) {
      console.error(`[Habit Update Error] ID: ${req.params.id} - ${err.message}`);
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Habit updated' });
  });
});

// Delete habit
app.delete('/api/habit/:id', (req, res) => {
  const { id } = req.params;
  db.run("UPDATE habits SET archived = 1 WHERE id = ?", id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ deleted: this.changes });
  });
});

// Get habit history for autocomplete
app.get('/api/habits/history', (req, res) => {
  db.all("SELECT DISTINCT name FROM habits", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows.map(row => row.name));
  });
});

// Update character
app.put('/api/character', (req, res) => {
  const { level, exp } = req.body;
  const sql = 'UPDATE character SET level = ?, exp = ?'; // Assuming single row for character
  db.run(sql, [level, exp], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: 'Character updated' });
  });
});

const http = require('http');

const server = http.createServer(app);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Tailscale tip: run 'tailscale serve http://localhost:${PORT}' to share securely.`);
  });
}

module.exports = app;
