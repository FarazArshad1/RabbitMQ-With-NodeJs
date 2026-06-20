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

Create a `.env` file in the root directory with the following variables:

```env
AMQP_URL=amqp://localhost

# Direct Exchange (Legacy)
EXCHANGE=mail_exchange_v2
SUBSCRIBED_USER_MAIL_QUEUE=subscribed_users_mail_queue
REGULAR_USER_MAIL_QUEUE=regular_users_mail_queue

# Topic Exchange
TOPIC_EXCHANGE=topic_send_notification_v2
TOPIC_SUBSCRIBED_USER_MAIL_ROUTING_KEY=order.*
TOPIC_SUBSCRIBED_USER_MAIL_QUEUE=order_placed_notification_queue

TOPIC_REGULAR_USER_MAIL_ROUTING_KEY=payment.*
TOPIC_REGULAR_USER_MAIL_QUEUE=payment_processed_notification_queue
```

### 3. Install Dependencies

```bash
pnpm install
```

## How to Run

### Basic (Direct) Implementation
1. **Start Consumers**:
   ```bash
   node subscribedUserConsumer.js
   node regularUserConsumer.js
   ```
2. **Run Producer**:
   ```bash
   node producer.js
   ```

### Topic Exchange Implementation
Located in the `/topic` directory. This implementation uses wildcard routing.

1. **Start Consumers**:
   ```bash
   node topic/orderConsumer.js
   node topic/paymentConsumer.js
   ```
2. **Run Producer**:
   ```bash
   node topic/producer.js
   ```

## Key Considerations

-   **Topic Patterns**: 
    - `*` (star) matches exactly one word.
    - `#` (hash) matches zero or more words.
    - In this project, `order.*` matches `order.placed`, and `payment.*` matches `payment.made`.
-   **Durability**: Both the exchange and the queue are set to `{ durable: true }`. This ensures they persist even if the RabbitMQ server restarts.
-   **Binding Logic**: In the topic implementation, both the producer and consumers handle infrastructure setup and bindings to ensure consistency.

## Project Structure

-   `producer.js`: Basic producer for direct exchange.
-   `topic/`:
    - `connection.js`: Centralized RabbitMQ connection and setup logic.
    - `producer.js`: Topic-based producer.
    - `orderConsumer.js`: Listens for `order.*` events.
    - `paymentConsumer.js`: Listens for `payment.*` events.
-   `.env`: Stores configuration details.

