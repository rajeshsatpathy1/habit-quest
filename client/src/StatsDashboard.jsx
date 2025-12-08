import React from 'react';

export default function StatsDashboard({ habits, onFilterChange }) {

    // Helper to get ISO week number or simple "Week of Month" 
    // Let's use "Week of Month" (1-4ish) for simplicity and consistency with the "divide by 7" logic
    const getWeekOfMonth = (date) => {
        return Math.ceil(date.getDate() / 7);
    };

    const calculateRate = (period) => {
        const periodHabits = habits.filter(h => h.frequency === period);
        if (periodHabits.length === 0) return 0;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        const currentDay = now.getDate();

        let totalPercentage = 0;

        periodHabits.forEach(habit => {
            const creationDate = new Date(habit.id); // Assuming ID is timestamp
            const safeCreationDate = isNaN(creationDate.getTime()) ? new Date(0) : creationDate;

            let numerator = 0;
            let denominator = 1;

            if (period === 'daily') {
                // Keep simple: Did you do it today?
                numerator = habit.completedToday ? 1 : 0;
                denominator = 1;

            } else if (period === 'weekly') {
                // Metric: Weeks completed THIS MONTH
                // Denominator: Weeks elapsed this month (since creation)

                // 1. Calculate Denominator
                const monthStart = new Date(currentYear, currentMonth, 1);
                // If created after month start, use creation date
                const effectiveStart = safeCreationDate > monthStart ? safeCreationDate : monthStart;

                const currentWeekOfMonth = getWeekOfMonth(now);
                const startWeekOfMonth = (effectiveStart.getMonth() === currentMonth && effectiveStart.getFullYear() === currentYear)
                    ? getWeekOfMonth(effectiveStart)
                    : 1;

                denominator = Math.max(1, currentWeekOfMonth - startWeekOfMonth + 1);

                // 2. Calculate Numerator (Unique weeks completed in current month)
                const completedWeeks = new Set();
                if (habit.completionHistory) {
                    habit.completionHistory.forEach(dateStr => {
                        const date = new Date(dateStr);
                        if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
                            // Only count if it's within the valid tracking period (>= effectiveStart)
                            // Actually, just count any in this month is fine, but strictly we should check >= effectiveStart
                            // However, you can't complete it before it exists, so implicit check.
                            completedWeeks.add(getWeekOfMonth(date));
                        }
                    });
                }
                numerator = completedWeeks.size;

            } else if (period === 'monthly') {
                // Metric: Months completed THIS YEAR
                // Denominator: Months elapsed this year (since creation)

                // 1. Calculate Denominator
                const yearStart = new Date(currentYear, 0, 1);
                const effectiveStart = safeCreationDate > yearStart ? safeCreationDate : yearStart;

                const currentMonthIndex = now.getMonth(); // 0-11
                const startMonthIndex = (effectiveStart.getFullYear() === currentYear)
                    ? effectiveStart.getMonth()
                    : 0;

                denominator = Math.max(1, currentMonthIndex - startMonthIndex + 1);

                // 2. Calculate Numerator (Unique months completed in current year)
                const completedMonths = new Set();
                if (habit.completionHistory) {
                    habit.completionHistory.forEach(dateStr => {
                        const date = new Date(dateStr);
                        if (date.getFullYear() === currentYear) {
                            completedMonths.add(date.getMonth());
                        }
                    });
                }
                numerator = completedMonths.size;
            }

            // Clamp numerator to denominator (just in case of weird date math or future dates)
            if (numerator > denominator) numerator = denominator;

            totalPercentage += (numerator / denominator);
        });

        // Average across all habits of this type
        return Math.round((totalPercentage / periodHabits.length) * 100);
    };

    const getLabel = (period) => {
        switch (period) {
            case 'daily': return "Daily (Today)";
            case 'weekly': return "Weekly (Month)";
            case 'monthly': return "Monthly (Year)";
            default: return period;
        }
    };

    const getSubLabel = (period) => {
        switch (period) {
            case 'daily': return "Today's Completion";
            case 'weekly': return "This Month's Rate";
            case 'monthly': return "This Year's Rate";
            default: return "Completion Rate";
        }
    };

    return (
        <div className="grid grid-cols-3 gap-4 mb-6">
            {['daily', 'weekly', 'monthly'].map(period => {
                const percentage = calculateRate(period);
                return (
                    <div
                        key={period}
                        onClick={() => onFilterChange && onFilterChange(period)}
                        className="bg-slate-800 rounded-lg p-4 border border-purple-500 text-center shadow-md cursor-pointer hover:bg-slate-700 transition-colors relative overflow-hidden group"
                    >
                        <div className="text-sm text-purple-300 uppercase font-bold mb-2 relative z-10">{getLabel(period)}</div>

                        {/* Progress Bar Container */}
                        <div className="w-full bg-slate-900/50 rounded-full h-4 mb-2 relative z-10 border border-slate-600">
                            <div
                                className="bg-gradient-to-r from-purple-600 to-blue-500 h-full rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>

                        <div className="text-xs font-bold text-white relative z-10">{percentage}%</div>
                        <div className="text-[10px] text-slate-400 relative z-10">{getSubLabel(period)}</div>

                        {/* Subtle background glow based on progress */}
                        <div
                            className="absolute bottom-0 left-0 w-full h-1/3 bg-purple-600/10 blur-xl transition-opacity duration-500"
                            style={{ opacity: percentage / 100 }}
                        ></div>
                    </div>
                );
            })}
        </div>
    );
}
