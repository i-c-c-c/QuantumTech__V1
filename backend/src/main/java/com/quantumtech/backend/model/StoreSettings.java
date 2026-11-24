package com.quantumtech.backend.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document("settings")
public class StoreSettings {
    @Id private String id = "store";
    private String storeName = "QuantumTech";
    private String tagline;
    private String taglineBn;
    private String slogan;
    private String phone;
    private String email;
    private String ownerNotificationEmail;
    private String bKashNumber;
    private String nagadNumber;
    private int deliveryChargeInsideDhaka = 70;
    private int deliveryChargeOutsideDhaka = 130;
    private int lowStockThreshold = 5;
    private String facebookUrl;
    private String instagramUrl;
    private String whatsappNumber;
    private String messengerUrl;
    private String address;
    private String businessHours;
}
