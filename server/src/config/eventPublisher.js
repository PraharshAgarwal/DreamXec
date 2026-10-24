const redis = require('./redis');

const CHANNEL_NAME = "dreamxec:events";

const publishEvent = async (eventName, data) => {
    if (!eventName || typeof eventName !== 'string') {
        console.warn(`[EventPublisher] Warning: Attempted to publish invalid event: ${eventName}`);
        return;
    }
    try {
        const message = JSON.stringify({ event: eventName, data });
        await redis.publish(CHANNEL_NAME, message);
        console.log(`[EventPublisher] Published event: ${eventName}`);
    } catch (error) {
        console.error(`[EventPublisher] Failed to publish event ${eventName}:`, error);
    }
};

module.exports = { publishEvent };
