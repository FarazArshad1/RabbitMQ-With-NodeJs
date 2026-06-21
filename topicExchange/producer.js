require('dotenv').config();
const amqp = require("amqplib")
const { getConnection, setupInfrastructure, bindQueues } = require("./connection");

async function publishMessage(channel, exchange, routingKey, message) {
    const messageBuffer = Buffer.from(JSON.stringify(message));
    channel.publish(exchange, routingKey, messageBuffer);

    console.log(`[x] Sent messages to ${exchange}`);
    console.log(`    - Routing Key: ${routingKey}`);
}

async function sendMessages(routingKey, message) {
    let connection;
    try {
        connection = await getConnection();
        const channel = await connection.createChannel();

        const exchange = await setupInfrastructure(channel);
        await bindQueues(channel, exchange);

        await publishMessage(channel, exchange, routingKey, message);

        setTimeout(() => {
            connection.close();
        }, 500);

    } catch (error) {
        console.error("Error in RabbitMQ producer:", error);
    }
}

module.exports = {
    getConnection,
    setupInfrastructure,
    bindQueues,
    publishMessage,
    sendMessages
};

if (require.main === module) {
    // sendMessages("order.placed", { text: "Hello, this is a topic notification!" });
    sendMessages("payment.made", { text: "This is dummy payment intent" });
}