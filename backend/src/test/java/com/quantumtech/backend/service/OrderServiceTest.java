package com.quantumtech.backend.service;

import com.quantumtech.backend.dto.OrderStatusRequest;
import com.quantumtech.backend.dto.PaymentStatusRequest;
import com.quantumtech.backend.exception.ApiException;
import com.quantumtech.backend.model.Order;
import com.quantumtech.backend.repository.OrderRepository;
import com.quantumtech.backend.repository.ProductRepository;
import com.quantumtech.backend.repository.SettingsRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderServiceTest {
    @Test
    void blocksMobileMoneyConfirmationBeforePaymentVerification() {
        OrderRepository orders = mock(OrderRepository.class);
        Order order = new Order();
        order.setId("order-1");
        order.setStatus("Pending");
        order.setPaymentMethod("bKash");
        order.setPaymentStatus("Verification pending");
        when(orders.findById("order-1")).thenReturn(Optional.of(order));
        when(orders.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        OrderService service = new OrderService(orders, mock(ProductRepository.class),
                mock(SettingsRepository.class), mock(NotificationService.class));

        assertThrows(ApiException.class,
                () -> service.updateStatus("order-1",
                        new OrderStatusRequest("Confirmed", null, null)));
    }

    @Test
    void allowsConfirmedToShippedAndLogsHistory() {
        OrderRepository orders = mock(OrderRepository.class);
        Order order = new Order();
        order.setId("order-1");
        order.setStatus("Confirmed");
        order.setPaymentMethod("COD");
        order.setPaymentStatus("Pending collection");
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        when(orders.findById("order-1")).thenReturn(Optional.of(order));
        when(orders.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        OrderService service = new OrderService(orders, mock(ProductRepository.class),
                mock(SettingsRepository.class), mock(NotificationService.class));
        Order updated = service.updateStatus("order-1",
                new OrderStatusRequest("Shipped", "Courier handover", null));

        assertEquals("Shipped", updated.getStatus());
        assertEquals(1, updated.getHistory().size());
    }

    @Test
    void rejectsCancellationWithoutReason() {
        OrderRepository orders = mock(OrderRepository.class);
        Order order = new Order();
        order.setId("order-1");
        order.setStatus("Pending");
        order.setPaymentMethod("COD");
        when(orders.findById("order-1")).thenReturn(Optional.of(order));

        OrderService service = new OrderService(orders, mock(ProductRepository.class),
                mock(SettingsRepository.class), mock(NotificationService.class));

        assertThrows(ApiException.class,
                () -> service.updateStatus("order-1",
                        new OrderStatusRequest("Cancelled", null, null)));
    }

    @Test
    void marksMobilePaymentVerified() {
        OrderRepository orders = mock(OrderRepository.class);
        Order order = new Order();
        order.setId("order-1");
        order.setStatus("Pending");
        order.setPaymentMethod("Nagad");
        order.setPaymentStatus("Verification pending");
        when(orders.findById("order-1")).thenReturn(Optional.of(order));
        when(orders.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        OrderService service = new OrderService(orders, mock(ProductRepository.class),
                mock(SettingsRepository.class), mock(NotificationService.class));
        Order updated = service.verifyPayment("order-1",
                new PaymentStatusRequest("Verified", "Statement matched"));

        assertEquals("Verified", updated.getPaymentStatus());
    }
}
