const CACHE_KEY_PREFIX = 'hq_cache_';
const QUEUE_KEY = 'hq_sync_queue';

export const SyncManager = {
    // Save data to local cache
    saveToCache: (key, data) => {
        try {
            localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save to cache", e);
        }
    },

    // Load data from local cache
    loadFromCache: (key) => {
        try {
            const item = localStorage.getItem(CACHE_KEY_PREFIX + key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error("Failed to load from cache", e);
            return null;
        }
    },

    // Add a request to the sync queue
    queueRequest: (request) => {
        try {
            const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            request.id = Date.now() + Math.random(); // Unique ID
            request.timestamp = Date.now();
            queue.push(request);
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            console.log("Request queued:", request);
        } catch (e) {
            console.error("Failed to queue request", e);
        }
    },

    // Get the current queue
    getQueue: () => {
        try {
            return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    // Clear the queue
    clearQueue: () => {
        localStorage.removeItem(QUEUE_KEY);
    },

    // Process the queue (replay requests)
    processQueue: async (api) => {
        const queue = SyncManager.getQueue();
        if (queue.length === 0) return;

        console.log(`Processing ${queue.length} queued requests...`);
        const failedRequests = [];

        for (const req of queue) {
            try {
                console.log("Replaying:", req.type, req.payload);
                switch (req.type) {
                    case 'ADD_HABIT':
                        await api.addHabit(req.payload);
                        break;
                    case 'UPDATE_HABIT':
                        await api.updateHabit(req.payload);
                        break;
                    case 'DELETE_HABIT':
                        await api.deleteHabit(req.payload);
                        break;
                    case 'UPDATE_CHARACTER':
                        await api.updateCharacter(req.payload);
                        break;
                    default:
                        console.warn("Unknown request type:", req.type);
                }
            } catch (err) {
                console.error("Failed to replay request:", req, err);
                // If it's a network error, keep it in the queue.
                // If it's a 400/500, maybe discard it? For now, we'll keep it to be safe.
                failedRequests.push(req);
            }
        }

        if (failedRequests.length > 0) {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(failedRequests));
        } else {
            SyncManager.clearQueue();
            console.log("Sync complete!");
        }
    }
};
