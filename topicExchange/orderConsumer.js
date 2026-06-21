require('dotenv').config();
const amqp = require("amqplib")
const { getConnection, setupQueue } = require("./connection");

function handleMessage(channel, message) {
    if (message != null) {
        try {
            const content = JSON.parse(message.content.toString());
            console.log("Received Message: ", content);
            channel.ack(message);
        } catch (error) {
            console.error("Error processing message:", error);
            // Optionally nack the message if it's malformed
            channel.nack(message, false, false);
        }
    }
}

async function startConsuming(channel, queueName) {
    console.log(`[*] Waiting for messages in ${queueName}. To exit press CTRL+C`);
    await channel.consume(queueName, (message) => handleMessage(channel, message));
}

async function receiveOrder() {
    try {
        const connection = await getConnection();
        const channel = await connection.createChannel();
        const queueName = process.env.TOPIC_SUBSCRIBED_USER_MAIL_QUEUE;
        const exchange = process.env.TOPIC_EXCHANGE;
        const routingKey = process.env.TOPIC_SUBSCRIBED_USER_MAIL_ROUTING_KEY;

        await channel.assertExchange(exchange, "topic", { durable: true });
        await setupQueue(channel, queueName);
        await channel.bindQueue(queueName, exchange, routingKey);
        await startConsuming(channel, queueName);

    } catch (error) {
        console.error("Error in RabbitMQ consumer:", error);
    }
}

module.exports = {
    getConnection,
    setupQueue,
    handleMessage,
    startConsuming,
    receiveOrder
};

if (require.main === module) {
    receiveOrder();
}