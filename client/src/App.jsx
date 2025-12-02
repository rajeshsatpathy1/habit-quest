import React, { useState, useEffect, useRef } from 'react';
import CharacterProfile from './CharacterProfile';
import StatsDashboard from './StatsDashboard';
import HabitItem from './HabitItem';
import AddHabitForm from './AddHabitForm';
import CalendarView from './CalendarView';
import { api } from './api';

import DecayInfoModal from './DecayInfoModal';

import { SyncManager } from './SyncManager';

function App() {
  const [character, setCharacter] = useState({ level: 1, exp: 0, expToNextLevel: 100 });
  const [habits, setHabits] = useState([]);
  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [showSettings, setShowSettings] = useState(false);
  const [enableAdvancedActions, setEnableAdvancedActions] = useState(false);
  const [showDecayInfo, setShowDecayInfo] = useState(false);

  const lastCheckedDateRef = useRef(new Date().toDateString());

  useEffect(() => {
    loadData();
    const savedSettings = localStorage.getItem('enableAdvancedActions');
    if (savedSettings) {
      setEnableAdvancedActions(JSON.parse(savedSettings));
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
        lastCheckedDateRef.current = new Date().toDateString();
      }
    };

    const handleOnline = () => {
      setIsOffline(false);
      console.log("Back online! Syncing...");
      SyncManager.processQueue(api).then(() => loadData());
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for day rollover every minute while app is open
    const intervalId = setInterval(() => {
      const now = new Date();
      const todayStr = now.toDateString();

      if (todayStr !== lastCheckedDateRef.current) {
        console.log("New day detected, refreshing data...");
        lastCheckedDateRef.current = todayStr;
        loadData();
      }

      // Notification Check (10 PM)
      if (now.getHours() === 22 && now.getMinutes() === 0) {
        const incompleteHabits = habits.filter(h => h.frequency === 'daily' && !h.completedToday && h.streak > 0);
        if (incompleteHabits.length > 0 && Notification.permission === 'granted') {
          new Notification("Habit Quest Warning", {
            body: `⚠️ Danger! You have ${incompleteHabits.length} habits at risk of breaking streaks!`,
            requireInteraction: true
          });
        }
      }
    }, 60000);

    // Request notification permission on load
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Unregister any existing Service Workers (fixes SSL/SW errors)
    // NOTE: We are now using PWA, so we might want to keep the new one.
    // But for now, let's leave this cleanup logic as it might conflict with the new PWA plugin if not careful.
    // Actually, vite-plugin-pwa handles its own SW. Let's remove the manual unregister to avoid killing our new SW.

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [habits]);
  const toggleAdvancedActions = () => {
    const newValue = !enableAdvancedActions;
    setEnableAdvancedActions(newValue);
    localStorage.setItem('enableAdvancedActions', JSON.stringify(newValue));
  };

  const loadData = async () => {
    try {
      const data = await api.getData();

      // Check for daily reset and streak maintenance
      const today = new Date();
      const todayStr = today.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      const resetPromises = [];

      const updatedHabits = data.habits.map(habit => {
        let updated = { ...habit };
        let changed = false;

        // 1. Uncheck "completedToday" if it's a new day
        if (updated.completedToday && updated.lastCompletedDate !== todayStr) {
          updated.completedToday = false;
          changed = true;
        }

        // 2. Reset streak if missed yesterday (for daily habits)
        if (updated.frequency === 'daily' && updated.streak > 0) {
          const lastCompleted = updated.lastCompletedDate;
          // If last completed was neither today nor yesterday, streak is broken
          if (lastCompleted !== todayStr && lastCompleted !== yesterdayStr) {
            updated.streak = 0;
            changed = true;
          }
        }

        if (changed) {
          resetPromises.push(api.updateHabit(updated));
          return updated;
        }
        return habit;
      });

      if (resetPromises.length > 0) {
        await Promise.all(resetPromises);
      }

      setCharacter(data.character);
      setHabits(updatedHabits);
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

      // Revert lastCompletedDate to the most recent date in history (excluding today)
      const previousDates = updatedHabit.completionHistory.filter(d => d !== today);
      updatedHabit.lastCompletedDate = previousDates.length > 0 ? previousDates[previousDates.length - 1] : null;

      updatedHabit.lastActionDate = today;
      updatedHabit.completionHistory = previousDates;
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

  const handleEditHabit = async (habit, newName) => {
    const updatedHabit = { ...habit, name: newName };
    try {
      setHabits(habits.map(h => h.id === habit.id ? updatedHabit : h));
      await api.updateHabit(updatedHabit);
    } catch (err) {
      console.error("Failed to update habit name", err);
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
          {isOffline && (
            <div className="mt-2 inline-block bg-yellow-600/90 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              ⚠️ Offline Mode
            </div>
          )}

          <div className="absolute top-0 left-0">
            <button
              onClick={() => setShowDecayInfo(true)}
              className="text-2xl p-2 hover:bg-white/10 rounded-full transition-colors"
              title="How Decay Works"
            >
              ℹ️
            </button>
          </div>

          <div className="absolute top-0 right-0 flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-2xl p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Settings"
            >
              ⚙️
            </button>
          </div>

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

              <div className="mt-4 pt-3 border-t border-slate-600">
                <button
                  onClick={() => {
                    Notification.requestPermission().then(perm => {
                      if (perm === 'granted') {
                        new Notification("Habit Quest", { body: "✅ Notifications are working!" });
                      } else {
                        alert("Please allow notifications in your browser settings.");
                      }
                    });
                  }}
                  className="w-full py-1 px-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors"
                >
                  Test Notification
                </button>
              </div>
            </div>
          )}
        </div>

        {showDecayInfo && <DecayInfoModal onClose={() => setShowDecayInfo(false)} />}

        <CharacterProfile character={character} onReset={handleReset} showResetButton={enableAdvancedActions} />
        <StatsDashboard habits={habits} />
        <AddHabitForm onAdd={handleAddHabit} />

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => {
              const tabs = ['daily', 'weekly', 'monthly', 'calendar'];
              const currentIndex = tabs.indexOf(activeTab);
              const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
              setActiveTab(tabs[prevIndex]);
            }}
            className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-purple-300"
          >
            ◀
          </button>

          <div className="flex-1 flex gap-2 bg-slate-800/50 p-1 rounded-lg backdrop-blur-sm overflow-x-auto">
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

          <button
            onClick={() => {
              const tabs = ['daily', 'weekly', 'monthly', 'calendar'];
              const currentIndex = tabs.indexOf(activeTab);
              const nextIndex = (currentIndex + 1) % tabs.length;
              setActiveTab(tabs[nextIndex]);
            }}
            className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-purple-300"
          >
            ▶
          </button>
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
                  onEdit={handleEditHabit}
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
