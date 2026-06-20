const amqp = require("amqplib");

async function getConnection() {
    if (!process.env.AMQP_URL) {
        throw new Error("AMQP_URL is not defined in environment variables");
    }
    return await amqp.connect(process.env.AMQP_URL);
}

async function setupQueue(channel, queueName) {
    await channel.assertQueue(queueName, { durable: true });
}

async function setupInfrastructure(channel) {
    const exchange = process.env.TOPIC_EXCHANGE;
    await channel.assertExchange(exchange, "topic", { durable: true });

    await channel.assertQueue(process.env.TOPIC_SUBSCRIBED_USER_MAIL_QUEUE, { durable: true });
    await channel.assertQueue(process.env.TOPIC_REGULAR_USER_MAIL_QUEUE, { durable: true });

    return exchange;
}

async function bindQueues(channel, exchange) {
    await channel.bindQueue(
        process.env.TOPIC_SUBSCRIBED_USER_MAIL_QUEUE,
        exchange,
        process.env.TOPIC_SUBSCRIBED_USER_MAIL_ROUTING_KEY
    );
    await channel.bindQueue(
        process.env.TOPIC_REGULAR_USER_MAIL_QUEUE,
        exchange,
        process.env.TOPIC_REGULAR_USER_MAIL_ROUTING_KEY
    );
}

module.exports = {
    getConnection,
    setupQueue,
    setupInfrastructure,
    bindQueues,
};
