const { getConnection, setupInfrastructure } = require("./connection");

let channel;
let exchange;

const getActiveChannel = async () => {
    try {
        if (!channel) {
            const connection = await getConnection();
            channel = await connection.createChannel();
            // Headers exchange requires the type "headers"
            exchange = await setupInfrastructure(channel, "headers", process.env.HEADER_EXCHANGE);
            console.log(`[x] RabbitMQ Channel Established for Exchange : ${exchange} `)
        }
        return { channel, exchange };
    } catch (error) {
        console.error("[!] Failed to establish channel:", error);
        throw error;
    }
}

const sendMessage = async (headers, message) => {
    try {
        const { channel, exchange } = await getActiveChannel();
        const payload = Buffer.from(JSON.stringify({
            content: message,
            sentAt: new Date()
        }));

        channel.publish(exchange, "", payload, {
            persistent: true,
            headers: headers
        });

        console.log(`[x] Message Sent with Headers: ${headers['notification-type'] || 'custom'}`);
    } catch (error) {
        console.log("[x] An error Occured in sending message", error)
        throw error;
    }
}

sendMessage({ "x-match": "all", "notification-type": "new-video", "content-type": "video" }, "New Music Video Uploaded")
sendMessage({ "x-match": "all", "notification-type": "live-stream", "content-type": "video" }, "Campusx is live now")
sendMessage({ "x-match": "all", "notification-type-comment": "comment", "content-type": "vlog" }, "@cultral_resolve7865 commented on your video")
sendMessage({ "x-match": "all", "notification-type-like": "like", "content-type": "vlog" }, "@cultral_resolve7865 like your video")

module.exports = { getActiveChannel, sendMessage };