package com.quantumtech.backend.repository;

import com.quantumtech.backend.model.CouponUsage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CouponUsageRepository extends MongoRepository<CouponUsage, String> {
    long countByCouponIdAndCustomerPhone(String couponId, String customerPhone);
    Optional<CouponUsage> findByCouponIdAndOrderNumber(String couponId, String orderNumber);
    void deleteByCouponIdAndOrderNumber(String couponId, String orderNumber);
}
