const API_BASE = '/api';

export const api = {
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
