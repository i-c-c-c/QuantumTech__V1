package com.quantumtech.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CouponValidationRequest(
        @NotBlank @Size(max = 40) String code,
        @Pattern(regexp = Phone.PATTERN, message = Phone.MESSAGE) String customerPhone,
        @Pattern(regexp = "Inside Dhaka|Outside Dhaka") String area,
        @NotEmpty @Size(max = 50) List<@Valid CheckoutItemRequest> items
) {}
