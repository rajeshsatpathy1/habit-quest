const API_BASE = '/api';
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

// Mock Data for Demo Mode
const getMockData = () => {
    const stored = localStorage.getItem('habitQuestData');
    if (stored) return JSON.parse(stored);
    return {
        character: { level: 1, exp: 0, expToNextLevel: 100 },
        habits: []
    };
};

const saveMockData = (data) => {
    localStorage.setItem('habitQuestData', JSON.stringify(data));
};

import { SyncManager } from './SyncManager';

// Real API with Offline Support
const realApi = {
    getData: async () => {
        try {
            const res = await fetch(`${API_BASE}/data`);
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            SyncManager.saveToCache('data', data);
            return data;
        } catch (err) {
            console.warn("Offline mode: Loading data from cache", err);
            const cachedData = SyncManager.loadFromCache('data');
            if (cachedData) return cachedData;
            throw err;
        }
    },
    addHabit: async (habit) => {
        try {
            const res = await fetch(`${API_BASE}/habit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(habit),
            });
            if (!res.ok) throw new Error('Network error');
            return res.json();
        } catch (err) {
            console.warn("Offline mode: Queuing ADD_HABIT", err);
            SyncManager.queueRequest({ type: 'ADD_HABIT', payload: habit });
            return { id: habit.id, offline: true };
        }
    },
    updateHabit: async (habit) => {
        try {
            const res = await fetch(`${API_BASE}/habit/${habit.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(habit),
            });
            if (!res.ok) throw new Error('Network error');
            return res.json();
        } catch (err) {
            console.warn("Offline mode: Queuing UPDATE_HABIT", err);
            SyncManager.queueRequest({ type: 'UPDATE_HABIT', payload: habit });
            return { success: true, offline: true };
        }
    },
    deleteHabit: async (id) => {
        try {
            const res = await fetch(`${API_BASE}/habit/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Network error');
            return res.json();
        } catch (err) {
            console.warn("Offline mode: Queuing DELETE_HABIT", err);
            SyncManager.queueRequest({ type: 'DELETE_HABIT', payload: id });
            return { deleted: 1, offline: true };
        }
    },
    updateCharacter: async (character) => {
        try {
            const res = await fetch(`${API_BASE}/character`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(character),
            });
            if (!res.ok) throw new Error('Network error');
            return res.json();
        } catch (err) {
            console.warn("Offline mode: Queuing UPDATE_CHARACTER", err);
            SyncManager.queueRequest({ type: 'UPDATE_CHARACTER', payload: character });
            return { success: true, offline: true };
        }
    },
    getHabitHistory: async () => {
        try {
            const res = await fetch(`${API_BASE}/habits/history`);
            if (!res.ok) throw new Error('Network error');
            return res.json();
        } catch (err) {
            return []; // History might not be critical offline
        }
    },
    resetData: async () => {
        const res = await fetch(`${API_BASE}/reset`, {
            method: 'POST',
        });
        return res.json();
    }
};

// Mock API (LocalStorage)
const mockApi = {
    getData: async () => {
        return getMockData();
    },
    addHabit: async (habit) => {
        const data = getMockData();
        // Ensure ID is unique if not provided (though frontend usually provides it)
        if (!habit.id) habit.id = Date.now();
        data.habits.push(habit);
        saveMockData(data);
        return { id: habit.id };
    },
    updateHabit: async (habit) => {
        const data = getMockData();
        const index = data.habits.findIndex(h => h.id === habit.id);
        if (index !== -1) {
            data.habits[index] = habit;
            saveMockData(data);
        }
        return { success: true };
    },
    deleteHabit: async (id) => {
        const data = getMockData();
        const habit = data.habits.find(h => h.id === id);
        if (habit) {
            habit.archived = 1; // Soft delete mock
            saveMockData(data);
        }
        return { deleted: 1 };
    },
    updateCharacter: async (character) => {
        const data = getMockData();
        data.character = character;
        saveMockData(data);
        return { success: true };
    },
    getHabitHistory: async () => {
        const data = getMockData();
        // Return unique names
        const names = [...new Set(data.habits.map(h => h.name))];
        return names;
    },
    resetData: async () => {
        localStorage.removeItem('habitQuestData');
        return { message: 'Reset successful' };
    }
};

export const api = IS_DEMO ? mockApi : realApi;
