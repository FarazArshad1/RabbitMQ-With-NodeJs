const { getConnection, setupInfrastructure } = require("./connection");

let channel;
let exchange;

/**
 * Handles internal connection and setup logic.
 * Only runs once to establish the channel.
 */
const getActiveChannel = async () => {
    if (!channel) {
        try {
            const connection = await getConnection();
            channel = await connection.createChannel();
            exchange = await setupInfrastructure(channel);
            console.log(`[✔] RabbitMQ Channel established for exchange: ${exchange}`);
        } catch (error) {
            console.error("Failed to establish channel:", error);
            throw error;
        }
    }
    return { channel, exchange };
};

/**
 * Clean exported function to send messages.
 */
const publishMessage = async (message) => {
    try {
        const { channel, exchange } = await getActiveChannel();
        
        const payload = Buffer.from(JSON.stringify({
            ...message,
            sentAt: new Date()
        }));

        // Routing key is ignored in fanout, so we pass an empty string
        channel.publish(exchange, "", payload);
        console.log(` [x] Sent message to Fanout exchange: [${exchange}]`);
        
    } catch (error) {
        console.error(" [!] Error publishing message:", error.message);
    }
};

/**
 * Test execution function
 */
const sendTestMessages = async () => {
    console.log("Starting Fanout Producer Test...");
    await publishMessage({ event: "NEW_FEATURE", description: "Fanout patterns are now supported!" });
    await publishMessage({ event: "MAINTENANCE", status: "Scheduled" });

    // Note: In a real producer, you might keep the connection open.
    // For a one-off script, you'd close the connection here.
};

// Uncomment the line below to run the test script directly
sendTestMessages();

module.exports = { publishMessage };

