import React, { useState } from 'react';

export default function CalendarView({ habits }) {
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

    const handleDateClick = (date) => {
        if (!date) return;
        setSelectedDate(date.toDateString());
    };

    const selectedDateCompletions = getCompletionsForDate(selectedDate);
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
                        const completions = getCompletionsForDate(dateStr);
                        const hasActivity = completions.length > 0;
                        const isSelected = selectedDate === dateStr;
                        const isToday = dateStr === new Date().toDateString();

                        return (
                            <button
                                key={index}
                                onClick={() => handleDateClick(date)}
                                className={`
                  p-2 rounded-lg transition-all relative
                  ${isSelected ? 'bg-purple-600 text-white ring-2 ring-purple-300' : 'hover:bg-slate-700 text-slate-300'}
                  ${isToday ? 'border border-purple-400' : ''}
                  ${hasActivity && !isSelected ? 'bg-slate-700/50' : ''}
                `}
                            >
                                {date.getDate()}
                                {hasActivity && (
                                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                    Activity for {selectedDate}
                </h3>
                {selectedDateCompletions.length === 0 ? (
                    <p className="text-slate-400 text-sm">No quests completed on this day.</p>
                ) : (
                    <ul className="space-y-2">
                        {selectedDateCompletions.map(habit => (
                            <li key={habit.id} className="flex items-center gap-2 text-green-200 bg-slate-900/50 p-2 rounded">
                                <span>✓</span>
                                <span>{habit.name}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
