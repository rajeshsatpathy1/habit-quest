import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';
import { api } from './api';

// Mock the API module
vi.mock('./api', () => ({
    api: {
        getData: vi.fn(),
        addHabit: vi.fn(),
        updateHabit: vi.fn(),
        deleteHabit: vi.fn(),
        updateCharacter: vi.fn(),
        resetData: vi.fn(),
        getHabitHistory: vi.fn(), // Added missing mock
    },
}));

describe('App Component - Daily Reset Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock return for getHabitHistory to avoid crash
        api.getHabitHistory.mockResolvedValue([]);
    });

    it('should reset completedToday to false if lastCompletedDate is not today', async () => {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        // Mock data: Habit was completed yesterday, but completedToday is still true (simulating the bug)
        const mockHabits = [
            {
                id: 1,
                name: 'Daily Walk',
                frequency: 'daily',
                completedToday: true, // This should be reset
                lastCompletedDate: yesterday,
                streak: 5,
                completionHistory: [yesterday],
                totalCompleted: 10,
            },
        ];

        const mockCharacter = { level: 1, exp: 0, expToNextLevel: 100 };

        api.getData.mockResolvedValue({
            character: mockCharacter,
            habits: mockHabits,
        });

        render(<App />);

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Daily Walk')).toBeInTheDocument();
        });

        // Check if the checkbox is unchecked (it should be unchecked because it's a new day)
        // We look for the button with role="checkbox"
        const checkbox = screen.getByRole('checkbox', { name: /Daily Walk/i }); // The button has the habit name inside it? No, name is separate.
        // Wait, HabitItem structure:
        // <button ...>{habit.completedToday && '✓'}</button>
        // <h3>{habit.name}</h3>
        // The button does NOT have the name inside it. It has no text if unchecked.
        // So getByRole('checkbox', { name: ... }) might fail if it relies on accessible name.
        // The button has no aria-label.
        // I should add aria-label to the button in HabitItem.jsx or find it by role only (if there's only one).

        // For now, let's assume there's only one checkbox.
        // Or I can verify if I need to add aria-label.
        // In HabitItem.jsx:
        // <button onClick={...} role="checkbox" aria-checked={...}>

        // I will use screen.getAllByRole('checkbox')[0] if name fails.
        // But better to fix HabitItem to have aria-label.

        expect(checkbox).not.toBeChecked();

        // Verify api.updateHabit was called to persist the reset
        expect(api.updateHabit).toHaveBeenCalledWith(expect.objectContaining({
            id: 1,
            completedToday: false
        }));
    });
});
