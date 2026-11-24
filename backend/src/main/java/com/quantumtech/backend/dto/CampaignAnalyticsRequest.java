package com.quantumtech.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CampaignAnalyticsRequest(
        @Size(max = 64) String campaignId,
        @Size(max = 64) String popupId,
        @NotBlank String eventType,
        @Size(max = 64) String productId,
        @Size(max = 40) String couponCode,
        @Size(max = 32) String orderNumber,
        Double revenue,
        @Size(max = 500) String pageUrl
) {}
