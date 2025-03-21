import events from 'events';

// Set the global max listeners to avoid warnings
events.EventEmitter.defaultMaxListeners = 20;

export const setupEventListeners = (emitter) => {
    if (!emitter) return;

    // Check existing listeners to avoid duplicates
    const listeners = emitter.eventNames();
    if (listeners.length === 0) {
        emitter.on('uncaughtException', (err) => {
            console.error('Uncaught Exception:', err);
        });

        emitter.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection:', reason);
        });

        // console.log('Listeners added successfully.');
    }
};

export const logEventListeners = (emitter) => {
    if (emitter) {
        console.log(`Event Listeners: ${JSON.stringify(emitter.eventNames())}`);
    }
};
