const request = require('supertest');
const app = require('../src/server');
const { initializeTestDb, clearTestDb, closeTestDb } = require('../db_test_util');

// Increase timeout for db ops
jest.setTimeout(10000);

describe('API Integration Tests', () => {
    let db;

    beforeAll(async () => {
        // Initialize the test database once
        db = await initializeTestDb();
    });

    afterAll(async () => {
        await closeTestDb(db);
    });

    beforeEach(async () => {
        // Clear data between tests
        await clearTestDb(db);
    });

    describe('GET /api/data', () => {
        it('should return initial character and empty habits', async () => {
            const res = await request(app).get('/api/data');
            expect(res.statusCode).toBe(200);
            expect(res.body.character).toBeDefined();
            expect(res.body.character.level).toBe(1);
            expect(res.body.habits).toEqual([]);
        });
    });

    describe('POST /api/habit', () => {
        it('should create a new habit', async () => {
            const newHabit = {
                id: 123,
                name: 'Test Habit',
                frequency: 'daily',
                streak: 0,
                totalCompleted: 0,
                lastCompletedDate: null,
                lastActionDate: null,
                completionHistory: [],
                completedToday: false
            };

            const res = await request(app).post('/api/habit').send(newHabit);
            expect(res.statusCode).toBe(200);
            expect(res.body.id).toBe(123);

            // Verify it exists in DB
            const dataRes = await request(app).get('/api/data');
            const habit = dataRes.body.habits.find(h => h.id === 123);
            expect(habit).toBeDefined();
            expect(habit.name).toBe('Test Habit');
        });
    });

    describe('PUT /api/habit/:id', () => {
        it('should update an existing habit', async () => {
            // Create habit first
            const habit = {
                id: 456,
                name: 'Update Me',
                frequency: 'daily',
                streak: 0,
                totalCompleted: 0
            };
            await request(app).post('/api/habit').send(habit);

            // Update it
            const updateData = {
                name: 'Updated Name',
                frequency: 'weekly'
            };
            const res = await request(app).put('/api/habit/456').send(updateData);
            expect(res.statusCode).toBe(200);

            // Verify update
            const dataRes = await request(app).get('/api/data');
            const updatedHabit = dataRes.body.habits.find(h => h.id === 456);
            expect(updatedHabit.name).toBe('Updated Name');
            expect(updatedHabit.frequency).toBe('weekly');
        });
    });

    describe('DELETE /api/habit/:id', () => {
        it('should archive a habit', async () => {
            // Create habit
            const habit = {
                id: 789,
                name: 'Delete Me',
                frequency: 'daily'
            };
            await request(app).post('/api/habit').send(habit);

            // Delete it
            const res = await request(app).delete('/api/habit/789');
            expect(res.statusCode).toBe(200);

            // Verify it's gone from main list (which filters out archived)
            const dataRes = await request(app).get('/api/data');
            const found = dataRes.body.habits.find(h => h.id === 789);
            expect(found).toBeUndefined();
        });
    });
});
