import React from 'react';

export default function EditDayModal({ date, habits, onToggle, onClose }) {
    if (!date) return null;

    const dateStr = date.toDateString();
    const isFuture = date > new Date();

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-purple-500 shadow-2xl relative animate-fadeIn">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold text-white mb-1">
                    Edit History
                </h2>
                <p className="text-purple-300 mb-6">{dateStr}</p>

                {isFuture ? (
                    <div className="text-center py-8 text-slate-400 italic">
                        You cannot edit the future! 🔮
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {habits.length === 0 ? (
                            <p className="text-slate-500 text-center italic">No habits were active on this date.</p>
                        ) : (
                            habits.map(habit => {
                                // Check if completed on this specific date
                                const isCompleted = habit.completionHistory && habit.completionHistory.includes(dateStr);

                                return (
                                    <div
                                        key={habit.id}
                                        onClick={() => onToggle(habit, dateStr, !isCompleted)}
                                        className={`
                                flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                ${isCompleted
                                                ? 'bg-green-900/30 border-green-500/50 hover:bg-green-900/50'
                                                : 'bg-slate-900/50 border-slate-700 hover:bg-slate-700'}
                            `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center border
                                    ${isCompleted
                                                    ? 'bg-green-500 border-green-400 text-white'
                                                    : 'border-slate-500 text-transparent'}
                                `}>
                                                ✓
                                            </div>
                                            <span className={`font-medium ${isCompleted ? 'text-green-100' : 'text-slate-300'}`}>
                                                {habit.name}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-500 capitalize">{habit.frequency}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
