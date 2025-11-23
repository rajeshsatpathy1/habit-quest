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

// Real API
const realApi = {
    getData: async () => {
        const res = await fetch(`${API_BASE}/data`);
        return res.json();
    },
    addHabit: async (habit) => {
        const res = await fetch(`${API_BASE}/habit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(habit),
        });
        return res.json();
    },
    updateHabit: async (habit) => {
        const res = await fetch(`${API_BASE}/habit/${habit.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(habit),
        });
        return res.json();
    },
    deleteHabit: async (id) => {
        const res = await fetch(`${API_BASE}/habit/${id}`, {
            method: 'DELETE',
        });
        return res.json();
    },
    updateCharacter: async (character) => {
        const res = await fetch(`${API_BASE}/character`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(character),
        });
        return res.json();
    },
    getHabitHistory: async () => {
        const res = await fetch(`${API_BASE}/habits/history`);
        return res.json();
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
