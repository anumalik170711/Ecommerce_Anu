package com.ecommerce.ecommerce.rabbitMQConfig;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class PaymentEventListener {

    @RabbitListener(queues = RabbitConfig.PAYMENT_QUEUE)
    public void handlePaymentEvent(String message) {
        System.out.println("📩 Register Event Received from RabbitMQ: " + message);

        // TODO: Send email / generate invoice / log record
    }
}
