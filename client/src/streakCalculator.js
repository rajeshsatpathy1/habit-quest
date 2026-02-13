export function calculateDailyStreak(history, referenceDate = new Date()) {
    if (!history || history.length === 0) return 0;

    // Normalize dates to YYYY-MM-DD strings and unique set
    const dates = history.map(d => new Date(d).toDateString());
    const uniqueDates = [...new Set(dates)]
        .map(d => new Date(d))
        .sort((a, b) => b - a); // Descending order

    if (uniqueDates.length === 0) return 0;

    const today = new Date(referenceDate);
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latest = uniqueDates[0];

    // Check if the streak is still alive
    // It's alive if the latest completion is today OR yesterday
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
            // Gap found
            break;
        }
    }
    return streak;
}
