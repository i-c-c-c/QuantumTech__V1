package com.quantumtech.backend.service;

import com.quantumtech.backend.dto.CartLine;
import com.quantumtech.backend.dto.CartQuote;
import com.quantumtech.backend.dto.CheckoutItemRequest;
import com.quantumtech.backend.exception.ApiException;
import com.quantumtech.backend.model.Product;
import com.quantumtech.backend.model.ProductVariant;
import com.quantumtech.backend.model.StoreSettings;
import com.quantumtech.backend.repository.ProductRepository;
import com.quantumtech.backend.repository.SettingsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Prices a cart from the database. The storefront keeps the cart in the browser and calls this
 * whenever the cart is shown and right before checkout; checkout itself re-runs the same pricing,
 * so the amount the customer saw is the amount that gets charged.
 */
@Service
public class CartService {
    public static final String INSIDE_DHAKA = "Inside Dhaka";
    public static final String OUTSIDE_DHAKA = "Outside Dhaka";

    private final ProductRepository products;
    private final SettingsRepository settings;
    private final PromotionService promotions;

    public CartService(ProductRepository products, SettingsRepository settings,
                       PromotionService promotions) {
        this.products = products;
        this.settings = settings;
        this.promotions = promotions;
    }

    public CartQuote quote(List<CheckoutItemRequest> items, String area) {
        return quote(items, area, null, null);
    }

    public CartQuote quote(List<CheckoutItemRequest> items, String area,
                           String couponCode, String customerPhone) {
        if (items == null || items.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }
        if (area != null && !INSIDE_DHAKA.equals(area) && !OUTSIDE_DHAKA.equals(area)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Area must be Inside Dhaka or Outside Dhaka");
        }
        List<CheckoutItemRequest> merged = merge(items);
        Set<String> ids = merged.stream().map(CheckoutItemRequest::productId).collect(Collectors.toSet());
        Map<String, Product> byId = products.findAllById(ids).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity(), (a, b) -> a));

        List<CartLine> lines = merged.stream().map(item -> price(item, byId.get(item.productId()))).toList();
        List<CartLine> okLines = lines.stream().filter(CartLine::isOk).toList();
        int subtotal = okLines.stream().mapToInt(CartLine::lineTotal).sum();
        int promotionalDiscount = okLines.stream()
                .mapToInt(line -> line.discountAmount() * line.quantity()).sum();
        int itemCount = okLines.stream().mapToInt(CartLine::quantity).sum();
        Integer delivery = area == null ? null : deliveryCharge(area);
        String couponError = null;
        int couponDiscount = 0;
        String appliedCouponCode = null;
        if (couponCode != null && !couponCode.isBlank()) {
            PromotionService.CouponValidationResult validation = promotions.validateCoupon(
                    couponCode, customerPhone, okLines.stream()
                            .map(line -> new PromotionService.CouponLine(
                                    line.productId(), line.categoryId(), line.lineTotal()))
                            .toList());
            if (validation.valid()) {
                couponDiscount = (int) Math.round(validation.discountAmount());
                appliedCouponCode = validation.coupon().getCode();
            } else {
                couponError = validation.error();
            }
        }
        int total = Math.max(0, subtotal + (delivery == null ? 0 : delivery) - couponDiscount);
        List<String> issues = lines.stream().filter(l -> !l.isOk()).map(CartLine::message).toList();

        return new CartQuote(issues.isEmpty() && couponError == null, area, lines, itemCount,
                subtotal, delivery, total, issues, promotionalDiscount, appliedCouponCode,
                couponDiscount, couponError);
    }

    public int deliveryCharge(String area) {
        StoreSettings store = settings.findById("store").orElseGet(StoreSettings::new);
        return INSIDE_DHAKA.equals(area)
                ? store.getDeliveryChargeInsideDhaka()
                : store.getDeliveryChargeOutsideDhaka();
    }

    /** Combines repeated lines for the same product/variant so stock is checked on the total. */
    static List<CheckoutItemRequest> merge(List<CheckoutItemRequest> items) {
        Map<String, CheckoutItemRequest> merged = new LinkedHashMap<>();
        for (CheckoutItemRequest item : items) {
            if (item == null || item.productId() == null || item.productId().isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Each cart item needs a productId");
            }
            if (item.quantity() < 1) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Quantity must be at least 1");
            }
            String variantId = item.hasVariant() ? item.variantId().trim() : null;
            String key = item.productId().trim() + "|" + Objects.toString(variantId, "");
            CheckoutItemRequest previous = merged.get(key);
            int quantity = item.quantity() + (previous == null ? 0 : previous.quantity());
            if (quantity > CheckoutItemRequest.MAX_QUANTITY) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "Quantity cannot exceed " + CheckoutItemRequest.MAX_QUANTITY + " per item");
            }
            merged.put(key, new CheckoutItemRequest(item.productId().trim(), variantId, quantity));
        }
        return new ArrayList<>(merged.values());
    }

    private CartLine price(CheckoutItemRequest item, Product product) {
        if (product == null || "Deleted".equals(product.getStatus()) || "Hidden".equals(product.getStatus())) {
            return unavailable(item, product, "This product is no longer available");
        }
        List<ProductVariant> variants = Objects.requireNonNullElse(product.getVariants(), List.of());
        String firstImage = product.getImages() == null || product.getImages().isEmpty()
                ? null : product.getImages().get(0);

        ProductVariant variant = null;
        if (item.hasVariant()) {
            variant = variants.stream().filter(v -> item.variantId().equals(v.getId())).findFirst().orElse(null);
            if (variant == null) {
                return unavailable(item, product, product.getName() + ": the selected option is no longer available");
            }
        } else if (!variants.isEmpty()) {
            PromotionService.PriceResult price = promotions.calculateProductPrice(product, null);
            return line(item, product, null, firstImage, price, 0, CartLine.VARIANT_REQUIRED,
                    "Please choose an option for " + product.getName());
        }

        PromotionService.PriceResult price = promotions.calculateProductPrice(product,
                variant == null ? null : variant.getId());
        int available = Math.max(0, variant != null ? variant.getStock() : product.getStock());
        String image = variant != null && variant.getImage() != null ? variant.getImage() : firstImage;

        if (available == 0) {
            return line(item, product, variant, image, price, 0, CartLine.OUT_OF_STOCK,
                    displayName(product, variant) + " is out of stock");
        }
        if (item.quantity() > available) {
            return line(item, product, variant, image, price, available, CartLine.INSUFFICIENT_STOCK,
                    displayName(product, variant) + ": only " + available + " left in stock");
        }
        return line(item, product, variant, image, price, available, CartLine.OK, null);
    }

    private CartLine line(CheckoutItemRequest item, Product product, ProductVariant variant, String image,
                          PromotionService.PriceResult price, int available,
                          String status, String message) {
        int unitPrice = (int) Math.round(price.finalPrice());
        Integer originalPrice = price.originalPrice() > price.finalPrice()
                ? (int) Math.round(price.originalPrice()) : null;
        return new CartLine(item.productId(), product.getCategoryId(), item.variantId(),
                product.getName(), product.getNameBn(), product.getSlug(),
                variant == null ? null : variant.getValue(), image, unitPrice, originalPrice,
                (int) Math.round(price.discountAmount()), price.discountId(), item.quantity(),
                available, unitPrice * item.quantity(), status, message);
    }

    private CartLine unavailable(CheckoutItemRequest item, Product product, String message) {
        return new CartLine(item.productId(), product == null ? null : product.getCategoryId(), item.variantId(),
                product == null ? null : product.getName(), product == null ? null : product.getNameBn(),
                product == null ? null : product.getSlug(), null, null, 0, null,
                0, null, item.quantity(), 0, 0, CartLine.UNAVAILABLE, message);
    }

    private static String displayName(Product product, ProductVariant variant) {
        return variant == null || variant.getValue() == null
                ? product.getName() : product.getName() + " (" + variant.getValue() + ")";
    }
}
