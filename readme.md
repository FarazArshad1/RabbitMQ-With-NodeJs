# RabbitMQ with Node.js

A simple project demonstrating how to use RabbitMQ for asynchronous messaging between a Producer and a Consumer using Node.js and the `amqplib` library.

## Prerequisites

-   **Node.js**: Installed on your machine.
-   **Docker**: To run the RabbitMQ server.
-   **pnpm** (or npm/yarn): To install dependencies.

## Setup

### 1. Run RabbitMQ via Docker

Execute the following command to start a RabbitMQ container with the management plugin enabled:

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

-   **Port 5672**: Used for AMQP communication.
-   **Port 15672**: Used for the Management UI (accessible at `http://localhost:15672`).

### 2. Configure Environment Variables

Create a `.env` file in the root directory (already included) with the following variables:

```env
AMQP_URL=amqp://localhost
EXCHANGE=mail_exchange_v2
ROUTING_KEY=send_mail
```

### 3. Install Dependencies

```bash
pnpm install
```

## How to Run

### Start the Consumer
The consumer listens for messages on the queue and processes them.
```bash
node consumer.js
```

### Run the Producer
The producer sends a message to the exchange, which is then routed to the queue.
```bash
node producer.js
```

## Key Considerations

-   **Durability**: Both the exchange and the queue are set to `{ durable: true }`. This ensures they persist even if the RabbitMQ server restarts.
-   **Namespaces**: If you encounter `PRECONDITION-FAILED` errors, it likely means an exchange/queue with the same name already exists but with different settings (e.g., non-durable). In such cases, delete the existing entity via the Management UI or rename it in your code.
-   **Error Handling**: The project includes basic try-catch blocks and uses the `dotenv` library for secure configuration management.

## Project Structure

-   `producer.js`: Connects to RabbitMQ, asserts an exchange and queue, and publishes a message.
-   `consumer.js`: Connects to RabbitMQ, asserts the same queue, and consumes messages.
-   `.env`: Stores configuration details like the RabbitMQ URL and exchange names.
