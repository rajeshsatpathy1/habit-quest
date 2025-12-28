const db = require('./src/database');

function getISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${weekNo}`;
}

function getMonthKey(date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function calculateStreak(history, frequency) {
    if (!history || history.length === 0) return 0;

    // Parse and sort unique dates descending
    const uniqueTimeSet = new Set(history.map(d => new Date(d).setHours(0, 0, 0, 0)));
    const sortedDates = Array.from(uniqueTimeSet).map(t => new Date(t)).sort((a, b) => b - a);

    if (sortedDates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (frequency === 'daily') {
        let streak = 0;
        let currentCheck = sortedDates[0];

        // If the latest completion is older than yesterday, streak is broken
        // (Unless it's today, which is fine)
        const diffDays = (today - currentCheck) / (1000 * 60 * 60 * 24);
        if (diffDays > 1) return 0;

        // Iterate backwards
        let expectedDate = new Date(currentCheck);
        for (const date of sortedDates) {
            // If we have a gap, stop
            if (date.getTime() !== expectedDate.getTime()) {
                break;
            }
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
        }
        return streak;
    }

    if (frequency === 'weekly') {
        let streak = 0;
        const latestDate = sortedDates[0];
        const currentWeek = getISOWeek(today);
        const latestWeek = getISOWeek(latestDate);

        // If latest completion is not this week or last week, streak broken
        // (Simple check: if latest != current AND latest != prev, likely broken, but week diff is safer)
        // For simplicity: Map all history to week keys
        const weeks = Array.from(new Set(sortedDates.map(getISOWeek))).sort().reverse();

        // Check if latest week in history is "current" or "previous"
        // Actually, logic is: consecutive weeks in history.
        // And ensure the "chain" connects to NOW.

        // Connect to now:
        // If the most recent stored week is neither THIS week nor LAST week, streak is 0.
        // (Exception: It's technically possible to do it Sunday last week and Mon this week... 
        //  but week keys handle that.)

        // Just verify gap between "This Week" and "Latest History Week"
        // ... (Skipping complex date math for briefness, assuming simple continuity check)

        // Let's just count consecutive weeks from the latest entry backwards
        // AND check if the latest entry is valid for a current streak.

        // Check if latest week is valid (Current or Previous)
        // This is tricky without a proper week-diff function.
        // Let's assume if the date is within last 14 days it's probably "active" enough to count.
        const diffDays = (today - latestDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 10) return 0; // Rough "missed a week" check

        let currentStreak = 0;
        // Logic for consecutive strings
        // This is hard to do perfectly robustly without a library in a short script.
        // Fallback: Just return current streak if it looks valid-ish, mostly focusing on Daily as requested.
        return 0; // Placeholder for safety if we don't want to mess up weekly logic blindly
    }

    return 0;
}

// Improved Logic with explicit day stepping for 'daily' which is the corruption target
function calculateDailyStreak(history) {
    if (!history || history.length === 0) return 0;
    const dates = history.map(d => new Date(d).toDateString()); // Normalize
    const uniqueDates = [...new Set(dates)].map(d => new Date(d)).sort((a, b) => b - a);

    if (uniqueDates.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latest = uniqueDates[0];

    // Check if alive
    if (latest.getTime() !== today.getTime() && latest.getTime() !== yesterday.getTime()) {
        return 0;
    }

    let streak = 0;
    let expected = new Date(latest);

    for (const d of uniqueDates) {
        if (d.getTime() === expected.getTime()) {
            streak++;
            expected.setDate(expected.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}


db.all("SELECT * FROM habits", (err, rows) => {
    if (err) { console.error(err); return; }

    let updates = 0;

    rows.forEach(row => {
        if (row.frequency !== 'daily') {
            console.log(`Skipping non-daily habit: ${row.name} (${row.frequency})`);
            return;
        }

        let history = [];
        try { history = JSON.parse(row.completionHistory || '[]'); } catch (e) { }

        const correctStreak = calculateDailyStreak(history);

        if (row.streak !== correctStreak) {
            console.log(`Mismatch for "${row.name}": DB=${row.streak}, Calc=${correctStreak}. Fixing...`);

            db.run("UPDATE habits SET streak = ? WHERE id = ?", [correctStreak, row.id], (err) => {
                if (err) console.error("Failed to update " + row.name, err);
                else console.log(`  ✅ Fixed "${row.name}"`);
            });
            updates++;
        } else {
            console.log(`OK: "${row.name}" (Streak: ${row.streak})`);
        }
    });

    // Give time for async updates
    setTimeout(() => {
        console.log(`\nScan complete. ${updates} habits updated.`);
    }, 1000);
});
