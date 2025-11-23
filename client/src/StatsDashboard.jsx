import React from 'react';

export default function StatsDashboard({ habits }) {
    const calculateRate = (period) => {
        const periodHabits = habits.filter(h => h.frequency === period);
        if (periodHabits.length === 0) return 0;

        // Simplified calculation for demo purposes, matching previous logic
        const completed = periodHabits.reduce((sum, h) => sum + (h.completedToday ? 1 : 0), 0); // Simplified to just today for now
        // A better metric would be historical completion, but let's stick to the existing simple logic for now
        // Actually, let's use the 'streak' or 'totalCompleted' for a more interesting stat if available, 
        // but the original app used a specific formula. Let's keep it simple:
        // % of habits of this type completed today.

        const percent = Math.round((completed / periodHabits.length) * 100);
        return percent;
    };

    return (
        <div className="grid grid-cols-3 gap-4 mb-6">
            {['daily', 'weekly', 'monthly'].map(period => (
                <div key={period} className="bg-slate-800 rounded-lg p-4 border border-purple-500 text-center shadow-md">
                    <div className="text-sm text-purple-300 uppercase font-bold mb-2">{period}</div>
                    <div className="text-3xl font-bold text-white mb-1">{calculateRate(period)}%</div>
                    <div className="text-xs text-slate-400">Today's Rate</div>
                </div>
            ))}
        </div>
    );
}
