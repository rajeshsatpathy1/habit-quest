const db = require('./src/database');

const usage = `
Usage:
  node db_util.js list
  node db_util.js complete "<habit name>" [date]
  node db_util.js set "<habit name>" <field> <value>

Examples:
  node db_util.js list
  node db_util.js complete "Workout" "2025-12-26"
  node db_util.js set "Workout" streak 5
`;

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
    console.log(usage);
    process.exit(0);
}

function formatDate(dateInput) {
    let d;
    if (!dateInput) {
        d = new Date();
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        // Parse YYYY-MM-DD as local time midnight
        d = new Date(dateInput + 'T00:00:00');
    } else {
        d = new Date(dateInput);
    }
    if (isNaN(d.getTime())) {
        console.error('Invalid date format. Use YYYY-MM-DD');
        process.exit(1);
    }
    // The app uses toDateString() format: "Fri Dec 26 2025"
    return d.toDateString();
}

switch (command) {
    case 'list':
        db.all("SELECT id, name, streak, totalCompleted, lastCompletedDate, completedToday FROM habits WHERE archived = 0", (err, rows) => {
            if (err) {
                console.error(err.message);
            } else {
                console.table(rows);
            }
            db.close();
        });
        break;

    case 'complete':
        const name = args[1];
        const dateStr = formatDate(args[2]);
        if (!name) {
            console.error('Habit name required');
            process.exit(1);
        }

        db.get("SELECT * FROM habits WHERE name = ?", [name], (err, habit) => {
            if (err) {
                console.error(err.message);
                db.close();
                return;
            }
            if (!habit) {
                console.error(`Habit "${name}" not found.`);
                db.close();
                return;
            }

            let history = [];
            try {
                history = JSON.parse(habit.completionHistory || '[]');
            } catch (e) {
                history = [];
            }

            if (history.includes(dateStr)) {
                console.log(`Habit "${name}" already marked completed for ${dateStr}.`);
                db.close();
                return;
            }

            history.push(dateStr);
            const newStreak = habit.streak + 1;
            const newTotal = habit.totalCompleted + 1;
            const isToday = dateStr === new Date().toDateString();

            db.run(
                `UPDATE habits SET 
          streak = ?, 
          totalCompleted = ?, 
          lastCompletedDate = ?, 
          completionHistory = ?, 
          completedToday = ?,
          lastActionDate = ?
        WHERE id = ?`,
                [newStreak, newTotal, dateStr, JSON.stringify(history), isToday ? 1 : habit.completedToday, dateStr, habit.id],
                function (err) {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log(`Successfully marked "${name}" as completed for ${dateStr}.`);
                        console.log(`New streak: ${newStreak}, Total: ${newTotal}`);
                    }
                    db.close();
                }
            );
        });
        break;

    case 'set':
        const setName = args[1];
        const field = args[2];
        let value = args[3];

        if (!setName || !field || value === undefined) {
            console.error('Missing arguments for set command.');
            process.exit(1);
        }

        // Basic type conversion
        if (!isNaN(value) && value !== '') {
            value = Number(value);
        }

        db.run(`UPDATE habits SET ${field} = ? WHERE name = ?`, [value, setName], function (err) {
            if (err) {
                console.error(err.message);
            } else if (this.changes === 0) {
                console.log(`No habit found with name "${setName}"`);
            } else {
                console.log(`Updated ${field} to ${value} for "${setName}"`);
            }
            db.close();
        });
        break;

    default:
        console.log(`Unknown command: ${command}`);
        console.log(usage);
        db.close();
}
