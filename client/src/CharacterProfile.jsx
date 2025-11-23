import React from 'react';

export default function CharacterProfile({ character, onReset, showResetButton }) {
    const { level, exp, expToNextLevel } = character;
    const progress = Math.min(100, (exp / expToNextLevel) * 100);

    return (
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-purple-500 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-2xl font-bold text-white mb-1">
                        Level <span className="text-purple-400">{level}</span> Hero
                    </div>
                </div>
                <div className="text-4xl animate-bounce">🧙</div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-sm text-purple-300 mb-1">
                    <span>Experience</span>
                    <span>{exp} / {expToNextLevel}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {showResetButton && (
                <button
                    onClick={onReset}
                    className="w-full py-2 bg-red-900/50 hover:bg-red-800 text-red-200 text-sm rounded border border-red-800 transition-colors flex items-center justify-center gap-2"
                >
                    ⚠️ Reset All Data
                </button>
            )}
        </div>
    );
}
