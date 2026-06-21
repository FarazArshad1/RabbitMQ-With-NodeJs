const amqp = require("amqplib");

require("dotenv").config();

async function getConnection() {
    if (!process.env.AMQP_URL) {
        throw new Error("AMQP_URL is not defined in environment variables");
    }
    return await amqp.connect(process.env.AMQP_URL);
}

async function setupInfrastructure(channel, exchangeType, exchangeName) {
    await channel.assertExchange(exchangeName, exchangeType, { durable: true });

    return exchangeName;
}

module.exports = {
    getConnection,
    setupInfrastructure,
};

