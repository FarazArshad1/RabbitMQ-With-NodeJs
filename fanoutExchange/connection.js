const amqp = require("amqplib");
require("dotenv").config();

async function getConnection() {
    if (!process.env.AMQP_URL) {
        throw new Error("AMQP_URL is not defined in environment variables");
    }
    return await amqp.connect(process.env.AMQP_URL);
}

async function setupInfrastructure(channel) {
    const exchange = process.env.FANOUT_EXCHANGE;
    const exchangeType = "fanout"
    await channel.assertExchange(exchange, exchangeType, { durable: true });

    return exchange;
}

module.exports = {
    getConnection,
    setupInfrastructure,
};
