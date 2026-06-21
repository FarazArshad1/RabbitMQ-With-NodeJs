const amqp = require("amqplib")
const { getActiveChannel } = require("../producer")

const pattern = {
    "x-match": "all",
    "notification-type": "new-video",
    "content-type": "video"
}

const consumeNewVideoNotifications = async () => {
    try {

        // Ensure the exchange exists
        const { channel, exchange } = await getActiveChannel()

        // 1. Create a temporary, exclusive queue
        const q = await channel.assertQueue("", { exclusive: true })
        console.log("Waiting for Video Notifications")

        // 2. Bind it to the header exchange
        await channel.bindQueue(q.queue, exchange, "", pattern)

        // 3. Consume
        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                const message = msg.content.toString();
                console.log("[x] Recieved new video notification", message)

                channel.ack(msg)
            }
        })

    } catch (error) {
        console.error(" [!] New Video Notification Consumer Error:", error.message);
    }
}

consumeNewVideoNotifications()