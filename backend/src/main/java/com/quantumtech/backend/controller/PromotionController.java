package com.quantumtech.backend.controller;

import com.quantumtech.backend.dto.CampaignAnalyticsRequest;
import com.quantumtech.backend.dto.CartQuote;
import com.quantumtech.backend.dto.CouponValidationRequest;
import com.quantumtech.backend.model.*;
import com.quantumtech.backend.service.CartService;
import com.quantumtech.backend.service.PromotionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PromotionController {
    private final PromotionService promotions;
    private final CartService cart;

    public PromotionController(PromotionService promotions, CartService cart) {
        this.promotions = promotions;
        this.cart = cart;
    }

    @GetMapping("/promotions/campaigns/active")
    public List<Campaign> activeCampaigns() {
        return promotions.campaigns(true);
    }

    @GetMapping("/promotions/campaigns/{slug}")
    public Campaign campaign(@PathVariable String slug) {
        return promotions.campaignBySlug(slug);
    }

    @GetMapping("/promotions/popups/active")
    public List<PromotionalPopup> activePopups() {
        return promotions.popups(true);
    }

    @GetMapping("/promotions/product-discounts/active")
    public List<ProductDiscount> activeDiscounts() {
        return promotions.discounts(true);
    }

    @PostMapping("/coupons/validate")
    public CartQuote validateCoupon(@Valid @RequestBody CouponValidationRequest request) {
        return cart.quote(request.items(), request.area(), request.code(), request.customerPhone());
    }

    @PostMapping("/promotions/analytics/events")
    public CampaignAnalyticsEvent track(@Valid @RequestBody CampaignAnalyticsRequest request) {
        return promotions.track(request, false);
    }

    @GetMapping("/admin/promotions/campaigns")
    public List<Campaign> campaigns() {
        return promotions.campaigns(false);
    }

    @PostMapping("/admin/promotions/campaigns")
    public Campaign saveCampaign(@RequestBody Campaign campaign) {
        return promotions.saveCampaign(campaign);
    }

    @DeleteMapping("/admin/promotions/campaigns/{id}")
    public void deleteCampaign(@PathVariable String id) {
        promotions.deleteCampaign(id);
    }

    @GetMapping("/admin/promotions/popups")
    public List<PromotionalPopup> popups() {
        return promotions.popups(false);
    }

    @PostMapping("/admin/promotions/popups")
    public PromotionalPopup savePopup(@RequestBody PromotionalPopup popup) {
        return promotions.savePopup(popup);
    }

    @DeleteMapping("/admin/promotions/popups/{id}")
    public void deletePopup(@PathVariable String id) {
        promotions.deletePopup(id);
    }

    @GetMapping("/admin/promotions/product-discounts")
    public List<ProductDiscount> discounts() {
        return promotions.discounts(false);
    }

    @PostMapping("/admin/promotions/product-discounts")
    public ProductDiscount saveDiscount(@RequestBody ProductDiscount discount) {
        return promotions.saveDiscount(discount);
    }

    @DeleteMapping("/admin/promotions/product-discounts/{id}")
    public void deleteDiscount(@PathVariable String id) {
        promotions.deleteDiscount(id);
    }

    @GetMapping("/admin/promotions/coupons")
    public List<Coupon> coupons() {
        return promotions.coupons();
    }

    @PostMapping("/admin/promotions/coupons")
    public Coupon saveCoupon(@RequestBody Coupon coupon) {
        return promotions.saveCoupon(coupon);
    }

    @DeleteMapping("/admin/promotions/coupons/{id}")
    public void deleteCoupon(@PathVariable String id) {
        promotions.deleteCoupon(id);
    }

    @GetMapping("/admin/promotions/analytics")
    public Map<String, Object> analytics() {
        return promotions.analyticsSummary();
    }

    @DeleteMapping("/admin/promotions/analytics")
    public void clearAnalytics() {
        promotions.clearAnalytics();
    }
}
