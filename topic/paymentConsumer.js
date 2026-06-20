require('dotenv').config();
const amqp = require("amqplib")
const { getConnection, setupQueue } = require("./connection");

function handleMessage(channel, message) {
    if (message != null) {
        try {
            const content = JSON.parse(message.content.toString());
            console.log("Received Payment Notification: ", content);
            channel.ack(message);
        } catch (error) {
            console.error("Error processing message:", error);
            channel.nack(message, false, false);
        }
    }
}

async function startConsuming(channel, queueName) {
    console.log(`[*] Waiting for payment notifications in ${queueName}. To exit press CTRL+C`);
    await channel.consume(queueName, (message) => handleMessage(channel, message));
}

async function receivePayment() {
    try {
        const connection = await getConnection();
        const channel = await connection.createChannel();
        const queueName = process.env.TOPIC_REGULAR_USER_MAIL_QUEUE;
        const exchange = process.env.TOPIC_EXCHANGE;
        const routingKey = process.env.TOPIC_REGULAR_USER_MAIL_ROUTING_KEY;

        await channel.assertExchange(exchange, "topic", { durable: true });
        await setupQueue(channel, queueName);
        await channel.bindQueue(queueName, exchange, routingKey);
        await startConsuming(channel, queueName);

    } catch (error) {
        console.error("Error in RabbitMQ payment consumer:", error);
    }
}

module.exports = {
    getConnection,
    setupQueue,
    handleMessage,
    startConsuming,
    receivePayment
};

if (require.main === module) {
    receivePayment();
}