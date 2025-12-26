const db = require('./src/database');

db.all("SELECT name, streak, totalCompleted, lastCompletedDate, completionHistory FROM habits WHERE name IN ('Workout', 'Get Flexible')", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        rows.forEach(r => {
            console.log(`${r.name}: streak=${r.streak}, total=${r.totalCompleted}, lastDate=${r.lastCompletedDate}`);
            const history = JSON.parse(r.completionHistory);
            console.log(`  Last 3 completions: ${history.slice(-3).join(', ')}`);
        });
    }
    db.close();
});
