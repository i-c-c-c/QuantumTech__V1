package com.quantumtech.backend.service;

import com.quantumtech.backend.dto.CampaignAnalyticsRequest;
import com.quantumtech.backend.dto.Phone;
import com.quantumtech.backend.exception.ApiException;
import com.quantumtech.backend.model.*;
import com.quantumtech.backend.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class PromotionService {
    private static final Logger log = LoggerFactory.getLogger(PromotionService.class);
    private static final Set<String> CAMPAIGN_STATUSES =
            Set.of("Draft", "Scheduled", "Active", "Paused", "Expired");
    private static final Set<String> ANALYTICS_EVENT_TYPES = Set.of(
            "popup_impression", "popup_close", "popup_click", "campaign_visit",
            "product_click", "coupon_applied", "order_completed");

    private final CampaignRepository campaigns;
    private final PromotionalPopupRepository popups;
    private final ProductDiscountRepository discounts;
    private final CouponRepository coupons;
    private final CouponUsageRepository couponUsages;
    private final CampaignAnalyticsEventRepository analytics;

    public PromotionService(CampaignRepository campaigns,
                            PromotionalPopupRepository popups,
                            ProductDiscountRepository discounts,
                            CouponRepository coupons,
                            CouponUsageRepository couponUsages,
                            CampaignAnalyticsEventRepository analytics) {
        this.campaigns = campaigns;
        this.popups = popups;
        this.discounts = discounts;
        this.coupons = coupons;
        this.couponUsages = couponUsages;
        this.analytics = analytics;
    }

    public List<Campaign> campaigns(boolean activeOnly) {
        Instant now = Instant.now();
        return campaigns.findAll().stream()
                .peek(campaign -> synchronizeCampaignStatus(campaign, now))
                .filter(campaign -> !activeOnly || "Active".equals(campaign.getStatus())
                        && within(campaign.getStartDate(), campaign.getEndDate(), now))
                .sorted(Comparator.comparingInt(Campaign::getPriority).reversed())
                .toList();
    }

    public Campaign campaignBySlug(String slug) {
        Campaign campaign = campaigns.findByLandingPageSlug(slug)
                .orElseThrow(() -> notFound("Campaign not found"));
        Instant now = Instant.now();
        synchronizeCampaignStatus(campaign, now);
        if (!"Active".equals(campaign.getStatus())
                || !within(campaign.getStartDate(), campaign.getEndDate(), now)) {
            throw notFound("Campaign not found");
        }
        return campaign;
    }

    public Campaign saveCampaign(Campaign campaign) {
        if (blank(campaign.getName()) || blank(campaign.getOccasion())
                || campaign.getStartDate() == null || campaign.getEndDate() == null
                || !campaign.getEndDate().isAfter(campaign.getStartDate())) {
            throw badRequest("Campaign name, occasion, and a valid date range are required");
        }
        if (campaign.getStatus() == null) campaign.setStatus("Draft");
        if (!CAMPAIGN_STATUSES.contains(campaign.getStatus())) {
            throw badRequest("Invalid campaign status");
        }
        Instant now = Instant.now();
        if (campaign.getId() == null) {
            campaign.setId("camp-" + UUID.randomUUID());
            campaign.setCreatedAt(now);
        } else {
            Campaign existing = campaigns.findById(campaign.getId())
                    .orElseThrow(() -> notFound("Campaign not found"));
            campaign.setCreatedAt(existing.getCreatedAt());
        }
        campaign.setUpdatedAt(now);
        return campaigns.save(campaign);
    }

    public void deleteCampaign(String id) {
        requireExists(campaigns.findById(id).isPresent(), "Campaign not found");
        campaigns.deleteById(id);
    }

    public List<PromotionalPopup> popups(boolean activeOnly) {
        Instant now = Instant.now();
        return popups.findAll().stream()
                .filter(popup -> !activeOnly || popup.isEnabled()
                        && within(popup.getStartDate(), popup.getEndDate(), now))
                .sorted(Comparator.comparingInt(PromotionalPopup::getPriority).reversed())
                .toList();
    }

    public PromotionalPopup savePopup(PromotionalPopup popup) {
        if (blank(popup.getInternalName()) || blank(popup.getHeading())
                || blank(popup.getTriggerType()) || blank(popup.getFrequency())) {
            throw badRequest("Popup name, heading, trigger, and frequency are required");
        }
        if (popup.getDelaySeconds() < 0 || popup.getScrollPercentage() < 0
                || popup.getScrollPercentage() > 100) {
            throw badRequest("Popup delay must be non-negative and scroll percentage must be 0-100");
        }
        if (popup.getStartDate() != null && popup.getEndDate() != null
                && !popup.getEndDate().isAfter(popup.getStartDate())) {
            throw badRequest("Popup end date must be after its start date");
        }
        Instant now = Instant.now();
        if (popup.getId() == null) {
            popup.setId("pop-" + UUID.randomUUID());
            popup.setCreatedAt(now);
        } else {
            PromotionalPopup existing = popups.findById(popup.getId())
                    .orElseThrow(() -> notFound("Popup not found"));
            popup.setCreatedAt(existing.getCreatedAt());
        }
        popup.setUpdatedAt(now);
        return popups.save(popup);
    }

    public void deletePopup(String id) {
        requireExists(popups.findById(id).isPresent(), "Popup not found");
        popups.deleteById(id);
    }

    public List<ProductDiscount> discounts(boolean activeOnly) {
        Instant now = Instant.now();
        return discounts.findAll().stream()
                .filter(discount -> !activeOnly || discount.isActive()
                        && within(discount.getStartDate(), discount.getEndDate(), now))
                .sorted(Comparator.comparingInt(ProductDiscount::getPriority).reversed())
                .toList();
    }

    public PriceResult calculateProductPrice(Product product, String variantId) {
        double basePrice = product.getPrice();
        if (variantId != null) {
            basePrice = Optional.ofNullable(product.getVariants()).orElse(List.of()).stream()
                    .filter(variant -> variantId.equals(variant.getId()))
                    .mapToDouble(variant -> variant.getPrice() > 0
                            ? variant.getPrice() : product.getPrice())
                    .findFirst().orElse(basePrice);
        }

        PriceResult best = null;
        for (ProductDiscount discount : discounts(true)) {
            DiscountProductItem productItem = Optional.ofNullable(discount.getProductItems())
                    .orElse(List.of()).stream()
                    .filter(item -> product.getId().equals(item.getProductId())
                            && (item.getVariantId() == null || item.getVariantId().equals(variantId)))
                    .findFirst().orElse(null);
            boolean eligible = "all".equals(discount.getTargetType())
                    || ("category".equals(discount.getTargetType())
                    && Optional.ofNullable(discount.getCategoryIds()).orElse(List.of())
                    .contains(product.getCategoryId()))
                    || productItem != null;
            if (!eligible || (discount.getMinStockRequirement() != null
                    && product.getStock() < discount.getMinStockRequirement())) continue;

            String type = productItem != null && productItem.getCustomDiscountType() != null
                    ? productItem.getCustomDiscountType() : discount.getDiscountType();
            double value = productItem != null && productItem.getCustomDiscountValue() != null
                    ? productItem.getCustomDiscountValue() : discount.getDiscountValue();
            double amount;
            if ("percentage".equals(type)) {
                amount = Math.round(basePrice * value / 100);
            } else if ("fixed".equals(type)) {
                amount = Math.min(basePrice, value);
            } else if ("sale_price".equals(type) && productItem != null
                    && productItem.getSalePrice() != null) {
                amount = Math.max(0, basePrice - productItem.getSalePrice());
            } else {
                amount = Math.round(basePrice * value / 100);
            }
            if (discount.getMaxDiscountAmount() != null && discount.getMaxDiscountAmount() > 0) {
                amount = Math.min(amount, discount.getMaxDiscountAmount());
            }
            amount = Math.min(basePrice, Math.max(0, amount));
            Campaign campaign = discount.getCampaignId() == null ? null
                    : campaigns(true).stream()
                    .filter(candidate -> discount.getCampaignId().equals(candidate.getId()))
                    .findFirst().orElse(null);
            int percent = basePrice > 0 ? (int) Math.round(amount * 100 / basePrice) : 0;
            String badge = campaign != null && !blank(campaign.getBadgeText())
                    ? campaign.getBadgeText() : percent > 0 ? "-" + percent + "% OFF" : null;
            PriceResult candidate = new PriceResult(basePrice, basePrice - amount, amount,
                    discount.getId(), campaign == null ? null : campaign.getId(), badge,
                    campaign != null && Boolean.TRUE.equals(campaign.getShowCountdown())
                            ? campaign.getEndDate() : discount.getEndDate(),
                    discount.getPriority());
            if (best == null || candidate.priority() > best.priority()
                    || (candidate.priority() == best.priority()
                    && candidate.discountAmount() > best.discountAmount())) {
                best = candidate;
            }
        }
        if (best != null) return best;
        if (product.getOldPrice() != null && product.getOldPrice() > basePrice) {
            return new PriceResult(product.getOldPrice(), basePrice,
                    product.getOldPrice() - basePrice, null, null, null, null, 0);
        }
        return new PriceResult(basePrice, basePrice, 0, null, null, null, null, 0);
    }

    public ProductDiscount saveDiscount(ProductDiscount discount) {
        if (blank(discount.getName()) || discount.getStartDate() == null || discount.getEndDate() == null
                || !discount.getEndDate().isAfter(discount.getStartDate())
                || !Double.isFinite(discount.getDiscountValue()) || discount.getDiscountValue() < 0) {
            throw badRequest("Discount name, value, and a valid date range are required");
        }
        if (discount.getDiscountType() == null
                || !Set.of("percentage", "fixed", "sale_price", "variant_specific")
                .contains(discount.getDiscountType())) {
            throw badRequest("Invalid discount type");
        }
        if (discount.getTargetType() == null
                || !Set.of("specific_products", "category", "all").contains(discount.getTargetType())) {
            throw badRequest("Invalid discount target type");
        }
        Instant now = Instant.now();
        if (discount.getId() == null) {
            discount.setId("disc-" + UUID.randomUUID());
            discount.setCreatedAt(now);
        } else {
            ProductDiscount existing = discounts.findById(discount.getId())
                    .orElseThrow(() -> notFound("Discount not found"));
            discount.setCreatedAt(existing.getCreatedAt());
        }
        discount.setUpdatedAt(now);
        return discounts.save(discount);
    }

    public void deleteDiscount(String id) {
        requireExists(discounts.findById(id).isPresent(), "Discount not found");
        discounts.deleteById(id);
    }

    public List<Coupon> coupons() {
        return coupons.findAll();
    }

    public Coupon saveCoupon(Coupon coupon) {
        if (blank(coupon.getCode()) || coupon.getStartDate() == null || coupon.getEndDate() == null
                || !coupon.getEndDate().isAfter(coupon.getStartDate())
                || !Double.isFinite(coupon.getDiscountValue()) || coupon.getDiscountValue() <= 0
                || coupon.getUsageLimit() < 1 || coupon.getPerCustomerLimit() < 1) {
            throw badRequest("Coupon code, positive discount, usage limits, and valid dates are required");
        }
        if (coupon.getDiscountType() == null
                || !Set.of("percentage", "fixed").contains(coupon.getDiscountType())) {
            throw badRequest("Invalid coupon discount type");
        }
        coupon.setCode(coupon.getCode().trim().toUpperCase(Locale.ROOT));
        coupons.findByCodeIgnoreCase(coupon.getCode())
                .filter(existing -> !Objects.equals(existing.getId(), coupon.getId()))
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT, "Coupon code already exists");
                });
        if (coupon.getId() == null) {
            coupon.setId("cpn-" + UUID.randomUUID());
            coupon.setUsedCount(0);
            coupon.setCreatedAt(Instant.now());
        } else {
            Coupon existing = coupons.findById(coupon.getId())
                    .orElseThrow(() -> notFound("Coupon not found"));
            coupon.setUsedCount(existing.getUsedCount());
            coupon.setCreatedAt(existing.getCreatedAt());
        }
        return coupons.save(coupon);
    }

    public void deleteCoupon(String id) {
        requireExists(coupons.findById(id).isPresent(), "Coupon not found");
        coupons.deleteById(id);
    }

    public synchronized CouponValidationResult validateCoupon(String code, String phone,
                                                               List<CouponLine> lines) {
        if (blank(code)) return CouponValidationResult.invalid("Please enter a coupon code.");
        Coupon coupon = coupons.findByCodeIgnoreCase(code.trim())
                .orElse(null);
        if (coupon == null) return CouponValidationResult.invalid("Invalid coupon code. Please verify.");
        Instant now = Instant.now();
        if (!coupon.isActive()) return CouponValidationResult.invalid("This coupon code is currently disabled.");
        if (coupon.getStartDate().isAfter(now)) {
            return CouponValidationResult.invalid("This coupon campaign has not started yet.");
        }
        if (coupon.getEndDate().isBefore(now)) return CouponValidationResult.invalid("This coupon has expired.");
        if (coupon.getUsedCount() >= coupon.getUsageLimit()) {
            return CouponValidationResult.invalid("This coupon has reached its maximum total redemption limit.");
        }
        String customerPhone = normalizePhone(phone);
        if (!customerPhone.isBlank()
                && couponUsages.countByCouponIdAndCustomerPhone(coupon.getId(), customerPhone)
                >= coupon.getPerCustomerLimit()) {
            return CouponValidationResult.invalid("You have already redeemed this coupon the maximum allowed times.");
        }
        double eligibleSubtotal = Optional.ofNullable(lines).orElse(List.of()).stream()
                .filter(line -> (coupon.getApplicableProducts() == null
                        || coupon.getApplicableProducts().isEmpty()
                        || coupon.getApplicableProducts().contains(line.productId()))
                        && (coupon.getApplicableCategories() == null
                        || coupon.getApplicableCategories().isEmpty()
                        || coupon.getApplicableCategories().contains(line.categoryId())))
                .mapToDouble(line -> Math.max(0, line.lineTotal()))
                .sum();
        if (eligibleSubtotal <= 0) {
            return CouponValidationResult.invalid("Coupon is not applicable to any items currently in your cart.");
        }
        if (coupon.getMinimumOrderValue() != null
                && eligibleSubtotal < coupon.getMinimumOrderValue()) {
            return CouponValidationResult.invalid("Minimum order value of ৳"
                    + Math.round(coupon.getMinimumOrderValue()) + " required for coupon "
                    + coupon.getCode() + ".");
        }
        double amount = "percentage".equals(coupon.getDiscountType())
                ? Math.round(eligibleSubtotal * coupon.getDiscountValue() / 100)
                : Math.min(eligibleSubtotal, coupon.getDiscountValue());
        if (coupon.getMaximumDiscount() != null && coupon.getMaximumDiscount() > 0) {
            amount = Math.min(amount, coupon.getMaximumDiscount());
        }
        return new CouponValidationResult(true, amount, null, coupon);
    }

    public synchronized void recordCouponUsage(String code, String phone, String orderNumber,
                                               double amount, List<CouponLine> lines) {
        Coupon coupon = coupons.findByCodeIgnoreCase(code)
                .orElseThrow(() -> badRequest("Coupon no longer exists"));
        CouponValidationResult validation = validateCoupon(code, phone, lines);
        if (!validation.valid()) {
            throw new ApiException(HttpStatus.CONFLICT, validation.error(),
                    Map.of("code", "COUPON_INVALID"));
        }
        String normalizedPhone = normalizePhone(phone);
        CouponUsage usage = new CouponUsage();
        usage.setId("usg-" + UUID.randomUUID());
        usage.setCouponId(coupon.getId());
        usage.setCouponCode(coupon.getCode());
        usage.setOrderNumber(orderNumber);
        usage.setCustomerPhone(normalizedPhone);
        usage.setDiscountAmount(amount);
        usage.setUsedAt(Instant.now());
        couponUsages.save(usage);
        try {
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            coupons.save(coupon);
        } catch (RuntimeException ex) {
            couponUsages.deleteByCouponIdAndOrderNumber(coupon.getId(), orderNumber);
            throw ex;
        }
        try {
            saveAnalyticsEvent("coupon_applied", coupon.getCampaignId(), null, null,
                    coupon.getCode(), orderNumber, null, "/checkout");
        } catch (RuntimeException ex) {
            log.warn("Could not record coupon analytics for order {}", orderNumber, ex);
        }
    }

    public void recordOrderCompleted(Order order) {
        try {
            saveAnalyticsEvent("order_completed", null, null, null, order.getCouponCode(),
                    order.getOrderNumber(), (double) order.getTotal(), "/checkout");
        } catch (RuntimeException ex) {
            log.warn("Could not record completed-order analytics for {}", order.getOrderNumber(), ex);
        }
    }

    public synchronized void rollbackCouponUsage(String code, String orderNumber) {
        coupons.findByCodeIgnoreCase(code).ifPresent(coupon ->
                couponUsages.findByCouponIdAndOrderNumber(coupon.getId(), orderNumber)
                        .ifPresent(usage -> {
                            couponUsages.delete(usage);
                            coupon.setUsedCount(Math.max(0, coupon.getUsedCount() - 1));
                            coupons.save(coupon);
                        }));
    }

    public CampaignAnalyticsEvent track(CampaignAnalyticsRequest request, boolean trusted) {
        if (request == null || request.eventType() == null
                || !ANALYTICS_EVENT_TYPES.contains(request.eventType())) {
            throw badRequest("Invalid analytics event type");
        }
        if (!trusted && ("order_completed".equals(request.eventType())
                || "coupon_applied".equals(request.eventType()))) {
            throw badRequest("Order and coupon redemption events are recorded by the server");
        }
        return saveAnalyticsEvent(request.eventType(), request.campaignId(), request.popupId(),
                request.productId(), request.couponCode(), request.orderNumber(),
                trusted ? request.revenue() : null, request.pageUrl());
    }

    private CampaignAnalyticsEvent saveAnalyticsEvent(String type, String campaignId, String popupId,
                                                       String productId, String couponCode,
                                                       String orderNumber, Double revenue, String pageUrl) {
        CampaignAnalyticsEvent event = new CampaignAnalyticsEvent();
        event.setId("evt-" + UUID.randomUUID());
        event.setCampaignId(campaignId);
        event.setPopupId(popupId);
        event.setEventType(type);
        event.setProductId(productId);
        event.setCouponCode(couponCode);
        event.setOrderNumber(orderNumber);
        event.setRevenue(revenue);
        event.setPageUrl(pageUrl);
        event.setTimestamp(Instant.now());
        List<CampaignAnalyticsEvent> existing = analytics.findAll().stream()
                .sorted(Comparator.comparing(CampaignAnalyticsEvent::getTimestamp,
                        Comparator.nullsFirst(Comparator.naturalOrder())))
                .toList();
        int excess = existing.size() - 1999;
        if (excess > 0) analytics.deleteAll(existing.subList(0, excess));
        return analytics.save(event);
    }

    public List<CampaignAnalyticsEvent> analyticsEvents() {
        return analytics.findAll().stream()
                .sorted(Comparator.comparing(CampaignAnalyticsEvent::getTimestamp,
                        Comparator.nullsFirst(Comparator.naturalOrder())))
                .toList();
    }

    public Map<String, Object> analyticsSummary() {
        List<CampaignAnalyticsEvent> events = analyticsEvents();
        long impressions = count(events, "popup_impression");
        long closes = count(events, "popup_close");
        long clicks = count(events, "popup_click");
        double revenue = events.stream()
                .filter(event -> "order_completed".equals(event.getEventType()))
                .map(CampaignAnalyticsEvent::getRevenue)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .sum();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("impressions", impressions);
        result.put("closes", closes);
        result.put("clicks", clicks);
        result.put("campaignVisits", count(events, "campaign_visit"));
        result.put("productClicks", count(events, "product_click"));
        result.put("couponsUsed", count(events, "coupon_applied"));
        result.put("orders", count(events, "order_completed"));
        result.put("totalRevenue", revenue);
        result.put("ctr", impressions > 0 ? Math.round(clicks * 1000.0 / impressions) / 10.0 : 0);
        result.put("closeRate", impressions > 0 ? Math.round(closes * 1000.0 / impressions) / 10.0 : 0);
        result.put("recentEvents", events.subList(Math.max(0, events.size() - 50), events.size())
                .reversed());
        return result;
    }

    public void clearAnalytics() {
        analytics.deleteAll();
    }

    private void synchronizeCampaignStatus(Campaign campaign, Instant now) {
        if (campaign.getStartDate() == null || campaign.getEndDate() == null
                || "Paused".equals(campaign.getStatus()) || "Draft".equals(campaign.getStatus())) return;
        if (now.isAfter(campaign.getEndDate()) && !"Expired".equals(campaign.getStatus())) {
            campaign.setStatus("Expired");
            campaign.setUpdatedAt(now);
            campaigns.save(campaign);
        } else if (!now.isBefore(campaign.getStartDate()) && now.isBefore(campaign.getEndDate())
                && "Scheduled".equals(campaign.getStatus())) {
            campaign.setStatus("Active");
            campaign.setUpdatedAt(now);
            campaigns.save(campaign);
        }
    }

    private boolean within(Instant start, Instant end, Instant now) {
        return (start == null || !start.isAfter(now)) && (end == null || !end.isBefore(now));
    }

    private long count(List<CampaignAnalyticsEvent> events, String type) {
        return events.stream().filter(event -> type.equals(event.getEventType())).count();
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : Phone.normalize(phone).replaceAll("[\\s-]", "");
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private void requireExists(boolean exists, String message) {
        if (!exists) throw notFound(message);
    }

    private ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    private ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public record CouponLine(String productId, String categoryId, int lineTotal) {}

    public record CouponValidationResult(boolean valid, double discountAmount,
                                         String error, Coupon coupon) {
        static CouponValidationResult invalid(String message) {
            return new CouponValidationResult(false, 0, message, null);
        }
    }

    public record PriceResult(double originalPrice, double finalPrice, double discountAmount,
                              String discountId, String campaignId, String badgeText,
                              Instant countdownEnd, int priority) {}
}
