import React, { useState, useEffect } from 'react';
import CharacterProfile from './CharacterProfile';
import StatsDashboard from './StatsDashboard';
import HabitItem from './HabitItem';
import AddHabitForm from './AddHabitForm';
import CalendarView from './CalendarView';
import { api } from './api';

function App() {
  const [character, setCharacter] = useState({ level: 1, exp: 0, expToNextLevel: 100 });
  const [habits, setHabits] = useState([]);
  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(true);

  const [showSettings, setShowSettings] = useState(false);
  const [enableAdvancedActions, setEnableAdvancedActions] = useState(false);

  useEffect(() => {
    loadData();
    const savedSettings = localStorage.getItem('enableAdvancedActions');
    if (savedSettings) {
      setEnableAdvancedActions(JSON.parse(savedSettings));
    }
  }, []);

  const toggleAdvancedActions = () => {
    const newValue = !enableAdvancedActions;
    setEnableAdvancedActions(newValue);
    localStorage.setItem('enableAdvancedActions', JSON.stringify(newValue));
  };

  const loadData = async () => {
    try {
      const data = await api.getData();
      setCharacter(data.character);
      setHabits(data.habits);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const playSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const frequencies = { complete: 523.25, levelup: 783.99, decay: 246.94 };
    const duration = type === 'levelup' ? 0.5 : 0.2;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.value = frequencies[type] || 523.25;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + duration);
  };

  const handleAddHabit = async (newHabit) => {
    const habit = {
      id: Date.now(),
      ...newHabit,
      completedToday: false,
      streak: 0,
      lastCompletedDate: null,
      lastActionDate: null,
      totalCompleted: 0,
      completionHistory: []
    };

    try {
      await api.addHabit(habit);
      setHabits([...habits, habit]);
    } catch (err) {
      console.error("Failed to add habit", err);
    }
  };

  const calculateNextLevelExp = (level) => {
    // Progressive XP formula: Base * (Level ^ 1.5)
    return Math.floor(100 * Math.pow(level, 1.5));
  };

  const handleToggleHabit = async (habit) => {
    const today = new Date().toDateString();
    const wasCompleted = habit.completedToday;

    let updatedHabit = { ...habit };
    let updatedCharacter = { ...character };

    if (!wasCompleted) {
      // Completing
      playSound('complete');
      updatedHabit.completedToday = true;
      updatedHabit.streak += 1;
      updatedHabit.lastCompletedDate = today;
      updatedHabit.totalCompleted += 1;
      updatedHabit.lastActionDate = today;

      if (!updatedHabit.completionHistory.includes(today)) {
        updatedHabit.completionHistory.push(today);

        // Add XP
        const rewards = 25;
        updatedCharacter.exp += rewards;

        if (updatedCharacter.exp >= updatedCharacter.expToNextLevel) {
          updatedCharacter.exp -= updatedCharacter.expToNextLevel;
          updatedCharacter.level += 1;
          updatedCharacter.expToNextLevel = calculateNextLevelExp(updatedCharacter.level);
          playSound('levelup');
        }
      }
    } else {
      // Uncompleting
      updatedHabit.completedToday = false;
      updatedHabit.streak = Math.max(0, updatedHabit.streak - 1);
      updatedHabit.lastActionDate = today;
      updatedHabit.completionHistory = updatedHabit.completionHistory.filter(d => d !== today);
      updatedHabit.totalCompleted = Math.max(0, updatedHabit.totalCompleted - 1);

      // Deduct XP (Fix for infinite XP glitch)
      const rewards = 25;
      updatedCharacter.exp -= rewards;

      // Handle level down if XP goes below 0 (Optional, but good for consistency)
      if (updatedCharacter.exp < 0) {
        if (updatedCharacter.level > 1) {
          updatedCharacter.level -= 1;
          updatedCharacter.expToNextLevel = calculateNextLevelExp(updatedCharacter.level);
          updatedCharacter.exp += updatedCharacter.expToNextLevel;
        } else {
          updatedCharacter.exp = 0;
        }
      }
    }

    try {
      // Optimistic update
      setHabits(habits.map(h => h.id === habit.id ? updatedHabit : h));
      setCharacter(updatedCharacter);

      await api.updateHabit(updatedHabit);
      await api.updateCharacter(updatedCharacter);
    } catch (err) {
      console.error("Failed to update habit", err);
      // Revert on failure would go here
    }
  };

  const handleDeleteHabit = async (id) => {
    if (confirm('Are you sure you want to delete this habit? It will be archived and can be restored via autocomplete.')) {
      try {
        await api.deleteHabit(id);
        setHabits(habits.filter(h => h.id !== id));
      } catch (err) {
        console.error("Failed to delete habit", err);
      }
    }
  };

  const handleReset = async () => {
    if (confirm('⚠️ DANGER: Are you sure you want to reset ALL data? This cannot be undone.')) {
      try {
        await api.resetData();
        loadData(); // Reload to get fresh state
      } catch (err) {
        console.error("Failed to reset data", err);
      }
    }
  };

  const filteredHabits = habits.filter(h => h.frequency === activeTab);

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-md">⚔️ Habit Quest</h1>
          <p className="text-purple-200">Level up your life</p>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="absolute top-0 right-0 text-2xl p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Settings"
          >
            ⚙️
          </button>

          {showSettings && (
            <div className="absolute top-12 right-0 bg-slate-800 border border-purple-500 rounded-lg p-4 shadow-xl z-10 w-64 text-left">
              <h3 className="text-white font-bold mb-3 border-b border-slate-600 pb-2">Settings</h3>
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span>Enable Advanced Actions</span>
                <input
                  type="checkbox"
                  checked={enableAdvancedActions}
                  onChange={toggleAdvancedActions}
                  className="w-4 h-4 accent-purple-500"
                />
              </label>
              <p className="text-xs text-slate-500 mt-2">
                Enables dangerous actions like "Reset Data".
              </p>
            </div>
          )}
        </div>

        <CharacterProfile character={character} onReset={handleReset} showResetButton={enableAdvancedActions} />
        <StatsDashboard habits={habits} />
        <AddHabitForm onAdd={handleAddHabit} />

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-lg backdrop-blur-sm overflow-x-auto">
          {['daily', 'weekly', 'monthly', 'calendar'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-2 rounded-md font-bold transition-all duration-200 capitalize whitespace-nowrap ${activeTab === tab
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-purple-300 hover:bg-slate-700/50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'calendar' ? (
          <CalendarView habits={habits} />
        ) : (
          <div className="space-y-3">
            {filteredHabits.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-purple-500/30 backdrop-blur-sm">
                <p className="text-purple-300 text-lg">No {activeTab} habits yet. Create one to get started!</p>
              </div>
            ) : (
              filteredHabits.map(habit => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  onToggle={handleToggleHabit}
                  onDelete={handleDeleteHabit}
                />
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-purple-300 text-sm opacity-60">
          <p>🎮 Complete habits daily to level up!</p>
        </div>
      </div>
    </div>
  );
}

export default App;
