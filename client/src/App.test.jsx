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
        getHabitHistory: vi.fn(),
    },
}));

describe('App Component - Daily Reset Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.getHabitHistory.mockResolvedValue([]);

        // Mock Notification API
        global.Notification = {
            requestPermission: vi.fn().mockResolvedValue('granted'),
            permission: 'granted',
        };
    });

    it('should reset completedToday to false if lastCompletedDate is not today', async () => {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        const mockHabits = [
            {
                id: 1,
                name: 'Daily Walk',
                frequency: 'daily',
                completedToday: true,
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

        await waitFor(() => {
            expect(screen.getByText('Daily Walk')).toBeInTheDocument();
        });

        const checkbox = screen.getAllByRole('checkbox')[0];
        expect(checkbox).not.toBeChecked();

        // Refactored logic: We don't call updateHabit just for unchecking visual state
        expect(api.updateHabit).not.toHaveBeenCalled();
    });

    it('should reset streak to 0 if lastCompletedDate was before yesterday', async () => {
        const today = new Date();
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        const twoDaysAgoStr = twoDaysAgo.toDateString();

        const mockHabits = [
            {
                id: 2,
                name: 'Read Book',
                frequency: 'daily',
                completedToday: false,
                lastCompletedDate: twoDaysAgoStr,
                streak: 10,
                completionHistory: [twoDaysAgoStr],
                totalCompleted: 50,
            },
        ];

        const mockCharacter = { level: 1, exp: 0, expToNextLevel: 100 };

        api.getData.mockResolvedValue({
            character: mockCharacter,
            habits: mockHabits,
        });

        render(<App />);

        await waitFor(() => {
            expect(screen.getByText('Read Book')).toBeInTheDocument();
        });

        expect(api.updateHabit).toHaveBeenCalledWith(expect.objectContaining({
            id: 2,
            streak: 0
        }));
    });
});
