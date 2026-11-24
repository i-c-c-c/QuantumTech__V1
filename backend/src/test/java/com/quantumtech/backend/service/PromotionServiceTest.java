package com.quantumtech.backend.service;

import com.quantumtech.backend.exception.ApiException;
import com.quantumtech.backend.model.Coupon;
import com.quantumtech.backend.model.Product;
import com.quantumtech.backend.model.ProductDiscount;
import com.quantumtech.backend.repository.*;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static com.quantumtech.backend.service.CheckoutFixtures.product;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PromotionServiceTest {
    private final CampaignRepository campaigns = mock(CampaignRepository.class);
    private final PromotionalPopupRepository popups = mock(PromotionalPopupRepository.class);
    private final ProductDiscountRepository discounts = mock(ProductDiscountRepository.class);
    private final CouponRepository coupons = mock(CouponRepository.class);
    private final CouponUsageRepository usages = mock(CouponUsageRepository.class);
    private final CampaignAnalyticsEventRepository analytics = mock(CampaignAnalyticsEventRepository.class);
    private final PromotionService service = new PromotionService(
            campaigns, popups, discounts, coupons, usages, analytics);

    @Test
    void appliesActiveProductDiscountToServerPrice() {
        ProductDiscount discount = new ProductDiscount();
        discount.setId("discount-1");
        discount.setActive(true);
        discount.setName("Ten percent");
        discount.setDiscountType("percentage");
        discount.setDiscountValue(10);
        discount.setTargetType("all");
        discount.setStartDate(Instant.now().minusSeconds(60));
        discount.setEndDate(Instant.now().plusSeconds(60));
        when(discounts.findAll()).thenReturn(List.of(discount));

        PromotionService.PriceResult price = service.calculateProductPrice(product("p1", 500, 5), null);

        assertEquals(500, price.originalPrice());
        assertEquals(450, price.finalPrice());
        assertEquals(50, price.discountAmount());
        assertEquals("discount-1", price.discountId());
    }

    @Test
    void refusesCouponRedemptionAtPerCustomerLimit() {
        Coupon coupon = new Coupon();
        coupon.setId("coupon-1");
        coupon.setCode("SAVE10");
        coupon.setActive(true);
        coupon.setDiscountType("percentage");
        coupon.setDiscountValue(10);
        coupon.setUsageLimit(10);
        coupon.setPerCustomerLimit(1);
        coupon.setUsedCount(1);
        coupon.setStartDate(Instant.now().minusSeconds(60));
        coupon.setEndDate(Instant.now().plusSeconds(60));
        when(coupons.findByCodeIgnoreCase("SAVE10")).thenReturn(Optional.of(coupon));
        when(usages.countByCouponIdAndCustomerPhone("coupon-1", "01712345678")).thenReturn(1L);

        ApiException error = assertThrows(ApiException.class, () -> service.recordCouponUsage(
                "SAVE10", "01712345678", "QT-1", 50,
                List.of(new PromotionService.CouponLine("p1", "cat-1", 500))));

        assertEquals(409, error.getStatus().value());
        verify(usages, never()).save(any());
    }
}
