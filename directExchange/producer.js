require('dotenv').config();
const amqp = require("amqplib")

async function sendMail() {
    try {
        const connection = await amqp.connect(process.env.AMQP_URL)
        const channel = await connection.createChannel()

        // Create Exchange
        const exchange = process.env.EXCHANGE

        // SubscribedUser Routing Key
        const subscribedUserRoutingKey = process.env.SUBSCRIBED_USER_MAIL_ROUTING_KEY

        // RegularUser Routing Key
        const regularUserRoutingKey = process.env.REGULAR_USER_MAIL_ROUTING_KEY

        const message = {
            to: "faraz@gmail.com",
            from: "faraz.125@gmail.com",
            subject: "Hello TP mail",
            body: "Hello Faraz",
        }

        await channel.assertExchange(exchange, "direct", { durable: true })

        await channel.assertQueue(process.env.SUBSCRIBED_USER_MAIL_QUEUE, { durable: true })
        await channel.assertQueue(process.env.REGULAR_USER_MAIL_QUEUE, { durable: true })

        await channel.bindQueue(process.env.SUBSCRIBED_USER_MAIL_QUEUE, exchange, subscribedUserRoutingKey)
        await channel.bindQueue(process.env.REGULAR_USER_MAIL_QUEUE, exchange, regularUserRoutingKey)

        channel.publish(exchange, subscribedUserRoutingKey, Buffer.from(JSON.stringify(message)))
        // channel.publish(exchange, regularUserRoutingKey, Buffer.from(JSON.stringify(message)))

        console.log(`[x] Sent messages to ${exchange}`);
        console.log(`    - Routing Key: ${subscribedUserRoutingKey}`);
        console.log(`    - Routing Key: ${regularUserRoutingKey}`);

        setTimeout(() => {
            connection.close()
        }, 500)

    } catch (error) {
        console.log(error);

    }
}

sendMail();