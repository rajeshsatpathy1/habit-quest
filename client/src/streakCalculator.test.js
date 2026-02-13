import { describe, it, expect } from 'vitest';
import { calculateDailyStreak } from './streakCalculator';

describe('calculateDailyStreak', () => {
    it('should return 0 for empty history', () => {
        expect(calculateDailyStreak([])).toBe(0);
        expect(calculateDailyStreak(null)).toBe(0);
    });

    it('should calculate streak accurately for consecutive days ending today', () => {
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const dayBefore = new Date(today); dayBefore.setDate(today.getDate() - 2);

        const history = [
            today.toDateString(),
            yesterday.toDateString(),
            dayBefore.toDateString()
        ];

        expect(calculateDailyStreak(history, today)).toBe(3);
    });

    it('should calculate streak accurately for consecutive days ending yesterday', () => {
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const dayBefore = new Date(today); dayBefore.setDate(today.getDate() - 2);

        const history = [
            yesterday.toDateString(),
            dayBefore.toDateString()
        ];

        // Streak is alive because last completion was yesterday
        expect(calculateDailyStreak(history, today)).toBe(2);
    });

    it('should return 0 if streak is broken (last completion > yesterday)', () => {
        const today = new Date();
        const dayBeforeYesterday = new Date(today); dayBeforeYesterday.setDate(today.getDate() - 2);

        const history = [
            dayBeforeYesterday.toDateString()
        ];

        expect(calculateDailyStreak(history, today)).toBe(0);
    });

    it('should handle unsorted history', () => {
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

        const history = [
            yesterday.toDateString(),
            today.toDateString()
        ];

        expect(calculateDailyStreak(history, today)).toBe(2);
    });

    it('should handle duplicate dates', () => {
        const today = new Date();
        const history = [
            today.toDateString(),
            today.toDateString()
        ];

        expect(calculateDailyStreak(history, today)).toBe(1);
    });

    it('should ignore future dates if any (though logic mainly checks latest valid)', () => {
        // Current logic takes latest date. If latest is future, it might break "alive" check if > today?
        // Logic says: if latest != today and latest != yesterday, return 0.
        // If latest is future, it falls into "!= today/yesterday".
        const today = new Date();
        const future = new Date(today); future.setDate(today.getDate() + 1);

        const history = [future.toDateString()];
        expect(calculateDailyStreak(history, today)).toBe(0);
    });
});
