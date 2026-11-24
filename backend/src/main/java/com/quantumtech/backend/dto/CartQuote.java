package com.quantumtech.backend.dto;

import java.util.List;

/**
 * Server-calculated cart. Amounts are whole BDT.
 *
 * @param valid          true when every line is OK and checkout can proceed
 * @param deliveryCharge null when no area was supplied
 * @param total          discounted subtotal plus delivery charge (if known), less a valid coupon
 * @param itemCount      total units across OK lines
 * @param issues         one message per line that is not OK
 */
public record CartQuote(
        boolean valid,
        String area,
        List<CartLine> items,
        int itemCount,
        int subtotal,
        Integer deliveryCharge,
        int total,
        List<String> issues,
        int promotionalDiscount,
        String couponCode,
        int couponDiscount,
        String couponError
) {}
