const { 
    getConnection, 
    setupQueue, 
    handleMessage, 
    startConsuming, 
    receivePayment 
} = require('../paymentConsumer');

// We mock the connection module since paymentConsumer imports it
jest.mock('./connection', () => ({
    getConnection: jest.fn()
}));

const { getConnection: mockGetConnection } = require('../connection');

describe('RabbitMQ Payment Consumer Unit Tests', () => {
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

        mockGetConnection.mockResolvedValue(mockConnection);
        
        process.env.TOPIC_REGULAR_USER_MAIL_QUEUE = 'reg_queue';
    });

    describe('setupQueue', () => {
        test('should assert the queue accurately with durable true', async () => {
            await setupQueue(mockChannel, 'test_q');
            expect(mockChannel.assertQueue).toHaveBeenCalledWith('test_q', { durable: true });
        });
    });

    describe('handleMessage', () => {
        test('should parse valid JSON content and ack the message', () => {
            const payload = { txId: 'TX123', amount: 50 };
            const message = {
                content: Buffer.from(JSON.stringify(payload))
            };
            
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            
            handleMessage(mockChannel, message);
            
            expect(consoleSpy).toHaveBeenCalledWith("Received Payment Notification: ", payload);
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
    });

    describe('receivePayment (Orchestrator)', () => {
        test('should orchestrate the full payment consumer setup flow', async () => {
            await receivePayment();
            
            expect(mockGetConnection).toHaveBeenCalled();
            expect(mockConnection.createChannel).toHaveBeenCalled();
            expect(mockChannel.assertQueue).toHaveBeenCalledWith('reg_queue', { durable: true });
            expect(mockChannel.consume).toHaveBeenCalledWith('reg_queue', expect.any(Function));
        });

        test('should log error if setup fails', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            mockGetConnection.mockRejectedValue(new Error('Connection failed'));

            await receivePayment();

            expect(consoleSpy).toHaveBeenCalledWith('Error in RabbitMQ payment consumer:', expect.any(Error));
            consoleSpy.mockRestore();
        });
    });
});
