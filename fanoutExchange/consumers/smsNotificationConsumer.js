const { getConnection, setupInfrastructure } = require("../connection");

const SMSConsumer = async () => {
    try {
        const connection = await getConnection();
        const channel = await connection.createChannel();
        
        // Ensure the exchange exists
        const exchange = await setupInfrastructure(channel);

        // 1. Create a temporary, exclusive queue
        const q = await channel.assertQueue("", { exclusive: true });
        
        console.log(` [*] SMS Notification Service started. Waiting for messages in ${q.queue}`);

        // 2. Bind it to the fanout exchange
        await channel.bindQueue(q.queue, exchange, "");

        // 3. Consume
        channel.consume(q.queue, (msg) => {
            if (msg !== null) {
                const content = JSON.parse(msg.content.toString());
                console.log(" [x] [SMS SERVICE] Sending Text Message:", content);
                
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error(" [!] SMS Consumer Error:", error.message);
    }
};

SMSConsumer();
