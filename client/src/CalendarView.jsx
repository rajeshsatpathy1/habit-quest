import React, { useState } from 'react';

export default function CalendarView({ habits, onEditDate }) {
    const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
    const [currentDate, setCurrentDate] = useState(new Date());

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Get days in month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    // Generate calendar grid
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(currentYear, currentMonth, i));
    }

    const prevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    // Check if a date has completions
    const getCompletionsForDate = (dateStr) => {
        return habits.filter(h => {
            // Check if completed today (live status) or in history
            if (h.completedToday && new Date().toDateString() === dateStr) return true;
            return h.completionHistory && h.completionHistory.includes(dateStr);
        });
    };

    // Check for missed tasks on a date
    const getMissedTasksForDate = (dateStr) => {
        const date = new Date(dateStr);
        const isToday = dateStr === new Date().toDateString();
        const isFuture = date > new Date();

        if (isFuture) return [];

        return habits.filter(h => {
            // Must be active on this date
            const createdDate = new Date(h.id);
            createdDate.setHours(0, 0, 0, 0);
            if (createdDate > date) return false;

            // Check if completed
            const isCompleted = (h.completedToday && isToday) || (h.completionHistory && h.completionHistory.includes(dateStr));

            // DAILY: Simple check if not completed
            if (h.frequency === 'daily') {
                return !isCompleted;
            }

            // WEEKLY: Show as missed if it's the end of the week (Sunday) and wasn't done during the week
            if (h.frequency === 'weekly') {
                const isEndOfWeek = date.getDay() === 0; // Sunday
                if (!isEndOfWeek) return false;

                // Check if completed ANY day this week
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - 6);
                startOfWeek.setHours(0, 0, 0, 0);

                const completedThisWeek = h.completionHistory?.some(histDate => {
                    const d = new Date(histDate);
                    return d >= startOfWeek && d <= date;
                }) || (h.completedToday && isToday);

                return !completedThisWeek;
            }

            // MONTHLY: Show as missed if it's the end of the month and wasn't done during the month
            if (h.frequency === 'monthly') {
                const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                const isEndOfMonth = date.getDate() === lastDayOfMonth;
                if (!isEndOfMonth) return false;

                // Check if completed ANY day this month
                const completedThisMonth = h.completionHistory?.some(histDate => {
                    const d = new Date(histDate);
                    return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
                }) || (h.completedToday && isToday);

                return !completedThisMonth;
            }

            return false;
        });
    };

    const handleDateClick = (date) => {
        if (!date) return;
        setSelectedDate(date.toDateString());
    };

    const selectedDateCompletions = getCompletionsForDate(selectedDate);
    const selectedDateMissed = getMissedTasksForDate(selectedDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-purple-500 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-full text-purple-300">◀</button>
                <h2 className="text-xl font-bold text-white">{monthName}</h2>
                <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-full text-purple-300">▶</button>
            </div>

            <div className="overflow-x-auto">
                <div className="grid grid-cols-7 gap-1 mb-4 text-center text-sm text-purple-300 min-w-[300px]">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    {days.map((date, index) => {
                        if (!date) return <div key={index} className="p-2"></div>;

                        const dateStr = date.toDateString();
                        const isToday = dateStr === new Date().toDateString();
                        const isFuture = date > new Date();

                        // Filter for daily habits only
                        const dailyHabits = habits.filter(h => h.frequency === 'daily');

                        // Check active habits on this date (created before or on this date)
                        // We use the habit ID (timestamp) to check creation date
                        const activeHabitsOnDate = dailyHabits.filter(h => {
                            const createdDate = new Date(h.id);
                            createdDate.setHours(0, 0, 0, 0);
                            return createdDate <= date;
                        });

                        const completionsOnDate = activeHabitsOnDate.filter(h => {
                            if (h.completedToday && isToday) return true;
                            return h.completionHistory && h.completionHistory.includes(dateStr);
                        });

                        const totalActive = activeHabitsOnDate.length;
                        const totalCompleted = completionsOnDate.length;
                        const completionPercentage = totalActive > 0 ? (totalCompleted / totalActive) * 100 : 0;

                        let bgClass = 'hover:bg-slate-700 text-slate-300'; // Default/Future/No Active

                        if (!isFuture && totalActive > 0) {
                            if (totalCompleted === 0) {
                                // Missed all
                                bgClass = 'bg-red-900/30 text-red-200 border border-red-500/30';
                            } else {
                                // Gradient based on completion
                                if (completionPercentage <= 25) bgClass = 'bg-green-900/40 text-green-100';
                                else if (completionPercentage <= 50) bgClass = 'bg-green-800/60 text-green-100';
                                else if (completionPercentage <= 75) bgClass = 'bg-green-600/80 text-white';
                                else bgClass = 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]';
                            }
                        }

                        const isSelected = selectedDate === dateStr;

                        return (
                            <button
                                key={index}
                                onClick={() => handleDateClick(date)}
                                className={`
                  p-2 rounded-lg transition-all relative h-10 flex items-center justify-center
                  ${isSelected ? 'ring-2 ring-purple-300 z-10' : ''}
                  ${bgClass}
                  ${isToday ? 'border-2 border-purple-400' : ''}
                `}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">
                        Activity for {selectedDate}
                    </h3>
                    <button
                        onClick={() => onEditDate && onEditDate(new Date(selectedDate))}
                        className="text-xs bg-slate-700 hover:bg-purple-600 text-white px-2 py-1 rounded transition-colors"
                    >
                        Edit History
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Completed Quests */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Completed Quests</h4>
                        {selectedDateCompletions.length === 0 ? (
                            <p className="text-slate-500 text-sm italic">No quests completed.</p>
                        ) : (
                            <ul className="space-y-2">
                                {selectedDateCompletions.map(habit => (
                                    <li key={habit.id} className="flex items-center gap-2 text-green-200 bg-slate-900/50 p-2 rounded border border-green-500/20">
                                        <span className="text-green-500">✓</span>
                                        <span>{habit.name}</span>
                                        <span className="text-xs text-slate-500 ml-auto capitalize">{habit.frequency}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Missed Quests */}
                    {selectedDateMissed.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Missed Quests</h4>
                            <ul className="space-y-2">
                                {selectedDateMissed.map(habit => (
                                    <li key={habit.id} className="flex items-center gap-2 text-red-200 bg-red-900/10 p-2 rounded border border-red-500/20">
                                        <span className="text-red-500">❌</span>
                                        <span className="line-through decoration-red-500/50 text-slate-300">{habit.name}</span>
                                        <span className="text-xs text-slate-500 ml-auto capitalize">{habit.frequency}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
