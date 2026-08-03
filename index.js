const Redis = require('ioredis');

// अपना असली Aiven वाला URL यहाँ डाल
const subscriber = new Redis("rediss://default:AVNS_TU7PwpauqNqS_sJbrHc@aeroship-redis-nikhileshadd1-ea07.k.aivencloud.com:10204");

subscriber.on('connect', () => {
    console.log("--> 🟢 Connected to Aiven Redis! Listening for logs...\n");
});

// सारे चैनल्स को सुनने के लिए psubscribe का इस्तेमाल
subscriber.psubscribe('logs:*', (err, count) => {
    if (err) {
        console.error("Failed to subscribe:", err);
    }
});

subscriber.on('pmessage', (pattern, channel, message) => {
    console.log(`[CHANNEL: ${channel}] ➔ ${message}`);
});