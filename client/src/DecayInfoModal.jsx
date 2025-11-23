import React from 'react';

const decayEmojis = ['💪', '😊', '😐', '😕', '😩', '🤒', '💀'];

export default function DecayInfoModal({ onClose }) {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-800 border border-purple-500 rounded-xl p-6 max-w-md w-full shadow-2xl relative animate-fadeIn">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    ℹ️ Habit Health System
                </h2>

                <p className="text-slate-300 mb-4">
                    Your habits have "health" that decays over time if you don't complete them.
                </p>

                <div className="space-y-4">
                    <div className="bg-slate-900/50 p-3 rounded-lg">
                        <h3 className="text-purple-300 font-bold mb-2">Decay Rates</h3>
                        <ul className="text-sm text-slate-300 space-y-1">
                            <li>📅 <span className="text-white font-medium">Daily:</span> Decays every 2 days</li>
                            <li>📅 <span className="text-white font-medium">Weekly:</span> Decays every 14 days</li>
                            <li>📅 <span className="text-white font-medium">Monthly:</span> Decays every 60 days</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-purple-300 font-bold mb-2">Health Levels</h3>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {decayEmojis.map((emoji, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    <span className="text-2xl mb-1">{emoji}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
                            <span>Best</span>
                            <span>Worst</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={onClose}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
}
