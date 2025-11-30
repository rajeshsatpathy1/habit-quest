import React, { useState } from 'react';
import { useRef } from 'react';
import { useEffect } from 'react';

const decayEmojis = ['💪', '😊', '😐', '😕', '😩', '🤒', '💀'];

export default function HabitItem({ habit, onToggle, onDelete, onEdit }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(habit.name);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const getDecayLevel = (habit) => {
        if (!habit.lastCompletedDate) return 6;
        const today = new Date();
        const lastCompleted = new Date(habit.lastCompletedDate);
        const daysSince = Math.floor((today - lastCompleted) / (1000 * 60 * 60 * 24));

        let divisor = 2; // Default for daily
        if (habit.frequency === 'weekly') divisor = 14; // Slower decay for weekly
        if (habit.frequency === 'monthly') divisor = 60; // Much slower for monthly

        return Math.min(6, Math.floor(daysSince / divisor));
    };

    const decayLevel = getDecayLevel(habit);

    const handleSave = () => {
        if (editName.trim()) {
            onEdit(habit, editName);
        } else {
            setEditName(habit.name); // Revert if empty
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditName(habit.name);
            setIsEditing(false);
        }
    };

    return (
        <div className={`p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-[1.02] ${habit.completedToday ? 'bg-green-900/50 border-green-500' : 'bg-slate-800 border-slate-600'}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1 flex items-center gap-4">
                    <button
                        onClick={() => onToggle(habit)}
                        role="checkbox"
                        aria-checked={habit.completedToday}
                        aria-label={`Mark ${habit.name} as completed`}
                        className={`w-8 h-8 rounded-lg font-bold text-lg transition-colors flex items-center justify-center ${habit.completedToday ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                    >
                        {habit.completedToday && '✓'}
                    </button>

                    <div className="flex-1">
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleSave}
                                onKeyDown={handleKeyDown}
                                className="bg-slate-700 text-white px-2 py-1 rounded border border-purple-400 focus:outline-none w-full"
                            />
                        ) : (
                            <h3
                                className={`font-semibold text-lg cursor-pointer hover:text-purple-300 transition-colors ${habit.completedToday ? 'text-green-200 line-through decoration-green-500/50' : 'text-white'}`}
                                onClick={() => setIsEditing(true)}
                                title="Click to edit"
                            >
                                {habit.name}
                            </h3>
                        )}
                        <div className="flex gap-3 text-sm mt-1 flex-wrap items-center">
                            <span className="text-2xl" title="Habit Health">{decayEmojis[decayLevel]}</span>
                            {habit.streak > 0 && (
                                <span className="text-orange-400 flex items-center gap-1 font-medium">
                                    ⚡ {habit.streak} {habit.frequency === 'daily' ? 'day' : habit.frequency === 'weekly' ? 'week' : 'month'} streak
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-slate-500 hover:text-purple-400 transition-colors p-2"
                        title="Edit Habit"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => onDelete(habit.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-2"
                        title="Delete Habit"
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    );
}
