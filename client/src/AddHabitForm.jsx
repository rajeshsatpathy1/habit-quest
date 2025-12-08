import React, { useState, useEffect } from 'react';
import { api } from './api';

export default function AddHabitForm({ onAdd }) {
    const [name, setName] = useState('');
    const [frequency, setFrequency] = useState('daily');
    const [suggestions, setSuggestions] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        loadSuggestions();
    }, []);

    const loadSuggestions = async () => {
        try {
            const history = await api.getHabitHistory();
            setSuggestions(history);
        } catch (err) {
            console.error("Failed to load suggestions", err);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({ name, frequency });
        setName('');
        loadSuggestions(); // Reload suggestions to include the new one
        // Optional: Keep it open or close it? Let's keep it open for multi-add, or close? User didn't specify.
        // Let's keep it open for now as it's less annoying if adding multiple. 
    };

    return (
        <div className="bg-slate-800 rounded-lg mb-6 border border-purple-500 shadow-lg overflow-hidden transition-all duration-300">
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700 transition-colors"
            >
                <h2 className="text-xl font-bold text-white">Create New Habit</h2>
                <div className={`text-purple-400 text-2xl font-bold transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    {isExpanded ? '−' : '+'}
                </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 pt-4">
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter habit name..."
                                list="habit-suggestions"
                                className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-purple-400 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                            />
                            <datalist id="habit-suggestions">
                                {suggestions.map((suggestion, index) => (
                                    <option key={index} value={suggestion} />
                                ))}
                            </datalist>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="px-4 py-2 bg-slate-700 text-white rounded border border-purple-400 focus:outline-none focus:border-purple-300 cursor-pointer"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            <button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
                            >
                                Add Habit
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
