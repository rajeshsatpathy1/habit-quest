const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'habits.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    db.all("SELECT name, frequency, streak, lastCompletedDate, completedToday, completionHistory FROM habits WHERE name = 'Workout'", (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log(JSON.stringify(rows, null, 2));
        }
        db.close();
    });
});
