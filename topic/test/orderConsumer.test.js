const amqp = require('amqplib');
const { 
    getConnection, 
    setupQueue, 
    handleMessage, 
    startConsuming, 
    receiveOrder 
} = require('../orderConsumer');

jest.mock('amqplib');

describe('RabbitMQ Consumer Unit Tests', () => {
    let mockChannel;
    let mockConnection;

    beforeEach(() => {
        jest.clearAllMocks();

        mockChannel = {
            assertQueue: jest.fn().mockResolvedValue({ queue: 'test_queue' }),
            consume: jest.fn().mockResolvedValue({ consumerTag: 'abc' }),
            ack: jest.fn(),
            nack: jest.fn(),
        };

        mockConnection = {
            createChannel: jest.fn().mockResolvedValue(mockChannel),
        };

        amqp.connect.mockResolvedValue(mockConnection);
        
        process.env.AMQP_URL = 'amqp://localhost';
        process.env.TOPIC_SUBSCRIBED_USER_MAIL_QUEUE = 'sub_queue';
    });

    describe('getConnection', () => {
        test('should connect to the right URL from environment', async () => {
            await getConnection();
            expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost');
        });
    });

    describe('setupQueue', () => {
        test('should assert the queue accurately with durable true', async () => {
            await setupQueue(mockChannel, 'test_q');
            expect(mockChannel.assertQueue).toHaveBeenCalledWith('test_q', { durable: true });
        });
    });

    describe('handleMessage', () => {
        test('should parse valid JSON content and ack the message', () => {
            const payload = { orderId: 123, status: 'placed' };
            const message = {
                content: Buffer.from(JSON.stringify(payload))
            };
            
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            handleMessage(mockChannel, message);
            
            expect(consoleSpy).toHaveBeenCalledWith("Received Message: ", payload);
            expect(mockChannel.ack).toHaveBeenCalledWith(message);
            
            consoleSpy.mockRestore();
        });

        test('should log error and nack the message on invalid JSON', () => {
            const message = {
                content: Buffer.from('invalid-json')
            };
            
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            handleMessage(mockChannel, message);
            
            expect(consoleSpy).toHaveBeenCalledWith("Error processing message:", expect.any(Error));
            expect(mockChannel.nack).toHaveBeenCalledWith(message, false, false);
            
            consoleSpy.mockRestore();
        });

        test('should do nothing if message is null', () => {
            handleMessage(mockChannel, null);
            expect(mockChannel.ack).not.toHaveBeenCalled();
            expect(mockChannel.nack).not.toHaveBeenCalled();
        });
    });

    describe('startConsuming', () => {
        test('should call channel.consume with the correct queue', async () => {
            await startConsuming(mockChannel, 'test_q');
            expect(mockChannel.consume).toHaveBeenCalledWith('test_q', expect.any(Function));
        });
    });

    describe('receiveOrder (Orchestrator)', () => {
        test('should orchestrate the full consumer setup flow', async () => {
            await receiveOrder();
            
            expect(amqp.connect).toHaveBeenCalled();
            expect(mockConnection.createChannel).toHaveBeenCalled();
            expect(mockChannel.assertQueue).toHaveBeenCalledWith('sub_queue', { durable: true });
            expect(mockChannel.consume).toHaveBeenCalledWith('sub_queue', expect.any(Function));
        });

        test('should log error if connection fails', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            amqp.connect.mockRejectedValue(new Error('Connection failed'));

            await receiveOrder();

            expect(consoleSpy).toHaveBeenCalledWith('Error in RabbitMQ consumer:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});
