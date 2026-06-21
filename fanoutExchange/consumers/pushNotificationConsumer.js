const { getConnection, setupInfrastructure } = require("../connection");

const startPushConsumer = async () => {
    try {
        const connection = await getConnection();
        const channel = await connection.createChannel();
        
        // Ensure the exchange exists
        const exchange = await setupInfrastructure(channel);

        // 1. Create a temporary, exclusive queue
        // "" lets RabbitMQ name it; exclusive: true deletes it when consumer disconnects
        const q = await channel.assertQueue("", { exclusive: true });
        
        console.log(` [*] Push Notification Service started. Waiting for messages in ${q.queue}`);

        // 2. Bind the queue to the fanout exchange (routing key is ignored)
        await channel.bindQueue(q.queue, exchange, "");

        // 3. Consume messages
        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                console.log(" [x] [PUSH NOTIFICATION] Sending to mobile devices:", content);
                
                // Acknowledge the message
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error(" [!] Push Consumer Error:", error.message);
    }
};

startPushConsumer();
