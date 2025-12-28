const { calculateDailyStreak, repairStreaks } = require('../repair_all_streaks');
const { initializeTestDb, clearTestDb, closeTestDb } = require('../db_test_util');

describe('Repair Script Logic', () => {
    describe('calculateDailyStreak', () => {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const twoDaysAgo = new Date(Date.now() - 86400000 * 2).toDateString();
        const threeDaysAgo = new Date(Date.now() - 86400000 * 3).toDateString();

        it('should return 0 for empty history', () => {
            expect(calculateDailyStreak([])).toBe(0);
        });

        it('should return 1 if completed today only', () => {
            expect(calculateDailyStreak([today])).toBe(1);
        });

        it('should return 1 if completed yesterday only', () => {
            expect(calculateDailyStreak([yesterday])).toBe(1);
        });

        it('should return 0 if completed two days ago', () => {
            expect(calculateDailyStreak([twoDaysAgo])).toBe(0);
        });

        it('should count consecutive days', () => {
            expect(calculateDailyStreak([today, yesterday])).toBe(2);
            expect(calculateDailyStreak([yesterday, twoDaysAgo])).toBe(2);
            expect(calculateDailyStreak([today, yesterday, twoDaysAgo])).toBe(3);
        });

        it('should break streak on gaps', () => {
            expect(calculateDailyStreak([today, twoDaysAgo])).toBe(1); // Gap at yesterday
        });
    });

    describe('repairStreaks (Database Integration)', () => {
        let db;

        beforeAll(async () => {
            db = await initializeTestDb();
        });

        afterAll(async () => {
            await closeTestDb(db);
        });

        beforeEach(async () => {
            await clearTestDb(db);
        });

        it('should fix broken streaks in the database', async () => {
            const today = new Date().toDateString();

            // Insert a habit with BROKEN streak (claims 10, but history is empty)
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO habits (id, name, frequency, streak, completionHistory) VALUES (?, ?, ?, ?, ?)`,
                    [1, 'Broken Habit', 'daily', 10, JSON.stringify([])],
                    (err) => err ? reject(err) : resolve()
                );
            });

            // Insert a habit with CORRECT streak
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO habits (id, name, frequency, streak, completionHistory) VALUES (?, ?, ?, ?, ?)`,
                    [2, 'Good Habit', 'daily', 1, JSON.stringify([today])],
                    (err) => err ? reject(err) : resolve()
                );
            });

            // Run repair
            const updates = await repairStreaks(db);
            expect(updates).toBe(1); // Only one should be fixed

            // Verify
            const row = await new Promise((resolve, reject) => {
                db.get("SELECT streak FROM habits WHERE id = 1", (err, row) => err ? reject(err) : resolve(row));
            });
            expect(row.streak).toBe(0); // Should be fixed to 0

            const row2 = await new Promise((resolve, reject) => {
                db.get("SELECT streak FROM habits WHERE id = 2", (err, row) => err ? reject(err) : resolve(row));
            });
            expect(row2.streak).toBe(1); // Should stay 1
        });
    });
});
