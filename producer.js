require('dotenv').config();
const amqp = require("amqplib")

async function sendMail() {
    try {
        const connection = await amqp.connect(process.env.AMQP_URL)
        const channel = await connection.createChannel()
        const exchange = process.env.EXCHANGE
        const routingKey = process.env.ROUTING_KEY

        const message = {
            to: "faraz@gmail.com",
            from: "faraz.125@gmail.com",
            subject: "Hello TP mail",
            body: "Hello Faraz",
        }

        await channel.assertExchange(exchange, "direct", { durable: true })
        await channel.assertQueue("mail_queue_v2", { durable: true })

        await channel.bindQueue("mail_queue_v2", exchange, routingKey)

        channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)))

        console.log(`[x] Sent message to ${exchange} with routing key ${routingKey}`);

        setTimeout(() => {
            connection.close()
        }, 500)

    } catch (error) {
        console.log(error);

    }
}

sendMail();