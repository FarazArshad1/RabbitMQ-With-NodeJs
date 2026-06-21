const amqp = require('amqplib');
const { 
    getConnection, 
    setupInfrastructure, 
    bindQueues, 
    publishMessage, 
    sendMessages 
} = require('../producer');

jest.mock('amqplib');

describe('RabbitMQ Producer Unit Tests', () => {
    let mockChannel;
    let mockConnection;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        mockChannel = {
            assertExchange: jest.fn().mockResolvedValue({ exchange: 'test_exchange' }),
            assertQueue: jest.fn().mockResolvedValue({ queue: 'test_queue' }),
            bindQueue: jest.fn().mockResolvedValue({}),
            publish: jest.fn().mockReturnValue(true),
        };

        mockConnection = {
            createChannel: jest.fn().mockResolvedValue(mockChannel),
            close: jest.fn().mockResolvedValue({}),
        };

        amqp.connect.mockResolvedValue(mockConnection);

        // Mock environment variables
        process.env.AMQP_URL = 'amqp://localhost';
        process.env.TOPIC_EXCHANGE = 'topic_exchange';
        process.env.TOPIC_SUBSCRIBED_USER_MAIL_QUEUE = 'sub_queue';
        process.env.TOPIC_REGULAR_USER_MAIL_QUEUE = 'reg_queue';
    });

    describe('getConnection', () => {
        test('should connect to the AMQP URL from environment', async () => {
            const conn = await getConnection();
            expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost');
            expect(conn).toBe(mockConnection);
        });
    });

    describe('setupInfrastructure', () => {
        test('should assert the exchange and both queues', async () => {
            const exchange = await setupInfrastructure(mockChannel);
            
            expect(mockChannel.assertExchange).toHaveBeenCalledWith('topic_exchange', 'topic', { durable: true });
            expect(mockChannel.assertQueue).toHaveBeenCalledWith('sub_queue', { durable: true });
            expect(mockChannel.assertQueue).toHaveBeenCalledWith('reg_queue', { durable: true });
            expect(exchange).toBe('topic_exchange');
        });
    });

    describe('bindQueues', () => {
        test('should bind both queues to the exchange with the routing key', async () => {
            const routingKey = 'test.routing.key';
            await bindQueues(mockChannel, 'topic_exchange', routingKey);

            expect(mockChannel.bindQueue).toHaveBeenCalledWith('sub_queue', 'topic_exchange', routingKey);
            expect(mockChannel.bindQueue).toHaveBeenCalledWith('reg_queue', 'topic_exchange', routingKey);
        });
    });

    describe('publishMessage', () => {
        test('should publish a JSON stringified buffer to the channel', async () => {
            const message = { id: 1, text: 'test message' };
            const routingKey = 'test.key';
            
            await publishMessage(mockChannel, 'topic_exchange', routingKey, message);

            const expectedBuffer = Buffer.from(JSON.stringify(message));
            expect(mockChannel.publish).toHaveBeenCalledWith('topic_exchange', routingKey, expectedBuffer);
        });
    });

    describe('sendMessages (Orchestrator)', () => {
        test('should call all necessary setup and publish steps', async () => {
            jest.useFakeTimers();
            
            await sendMessages('order.placed', { text: 'test' });

            expect(amqp.connect).toHaveBeenCalled();
            expect(mockConnection.createChannel).toHaveBeenCalled();
            expect(mockChannel.assertExchange).toHaveBeenCalled();
            expect(mockChannel.publish).toHaveBeenCalled();

            // Check if connection.close is scheduled
            jest.runAllTimers();
            expect(mockConnection.close).toHaveBeenCalled();

            jest.useRealTimers();
        });

        test('should log error if any step fails', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            amqp.connect.mockRejectedValue(new Error('Connection failed'));

            await sendMessages('key', {});

            expect(consoleSpy).toHaveBeenCalledWith('Error in RabbitMQ producer:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});
