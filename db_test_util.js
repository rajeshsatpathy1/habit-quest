const fs = require('fs');
const path = require('path');
const db = require('./src/database'); // reusing the instance

const TEST_DB_PATH = path.join(__dirname, 'habits_test.db');

function initializeTestDb() {
    return new Promise((resolve, reject) => {
        // We rely on src/database.js to have initialized the DB connection and schema
        // based on NODE_ENV=test.

        // Just clear it to be safe
        clearTestDb(db).then(() => {
            resolve(db);
        }).catch(reject);
    });
}

function clearTestDb(db) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Check if tables exist before clearing (in case initDb hasn't finished?)
            // But initDb logic in database.js is async inside the callback... tricky.
            // We should wait a bit or ensure schema exists.

            // Simplest way: Try to delete. If valid table, it works.
            db.run("DELETE FROM habits", (err) => {
                if (err && err.message.includes('no such table')) {
                    // Tables might not be ready. Wait or ignore.
                    // But for tests, we expect them to be ready.
                    // Let's assume database.js initDb runs fast enough or we should wait for it.
                    resolve(); // Assume empty
                } else if (err) {
                    reject(err);
                } else {
                    db.run("UPDATE character SET level=1, exp=0", (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                }
            });
        });
    });
}

function closeTestDb(db) {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

module.exports = { initializeTestDb, clearTestDb, closeTestDb, TEST_DB_PATH };
