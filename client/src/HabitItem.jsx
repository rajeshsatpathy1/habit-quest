import React from 'react';

const decayEmojis = ['💪', '😊', '😐', '😕', '😩', '🤒', '💀'];

export default function HabitItem({ habit, onToggle, onDelete }) {
    const getDecayLevel = (habit) => {
        if (!habit.lastCompletedDate) return 6;
        const today = new Date();
        const lastCompleted = new Date(habit.lastCompletedDate);
        const daysSince = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));
        return Math.min(6, Math.floor(daysSince / 2));
    };

    const decayLevel = getDecayLevel(habit);

    return (
        <div className={`p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-[1.02] ${habit.completedToday ? 'bg-green-900/50 border-green-500' : 'bg-slate-800 border-slate-600'}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1 flex items-center gap-4">
                    <button
                        onClick={() => onToggle(habit)}
                        className={`w-8 h-8 rounded-lg font-bold text-lg transition-colors flex items-center justify-center ${habit.completedToday ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                    >
                        {habit.completedToday && '✓'}
                    </button>

                    <div className="flex-1">
                        <h3 className={`font-semibold text-lg ${habit.completedToday ? 'text-green-200 line-through decoration-green-500/50' : 'text-white'}`}>
                            {habit.name}
                        </h3>
                        <div className="flex gap-3 text-sm mt-1 flex-wrap items-center">
                            <span className="text-2xl" title="Habit Health">{decayEmojis[decayLevel]}</span>
                            {habit.streak > 0 && (
                                <span className="text-orange-400 flex items-center gap-1 font-medium">
                                    ⚡ {habit.streak} day streak
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onDelete(habit.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2"
                    title="Delete Habit"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
}
