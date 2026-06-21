require('dotenv').config();
const amqp = require("amqplib")

async function receiveMail() {
    try {
        const connection = await amqp.connect(process.env.AMQP_URL)
        const channel = await connection.createChannel();

        await channel.assertQueue(process.env.REGULAR_USER_MAIL_QUEUE, { durable: true })

        channel.consume(process.env.REGULAR_USER_MAIL_QUEUE, (message) => {
            if (message != null) {
                console.log("Received Message: ", JSON.parse(message.content.toString()));
                channel.ack(message)
            }
        })

    } catch (error) {
        console.log(error)
    }
}

receiveMail();