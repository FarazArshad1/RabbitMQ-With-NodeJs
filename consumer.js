require('dotenv').config();
const amqp = require("amqplib")

async function receiveMail() {
    try {
        const connection = await amqp.connect(process.env.AMQP_URL)
        const channel = await connection.createChannel();

        await channel.assertQueue("mail_queue_v2", { durable: true })

        channel.consume("mail_queue_v2", (message) => {
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