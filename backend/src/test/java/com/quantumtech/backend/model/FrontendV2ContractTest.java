package com.quantumtech.backend.model;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FrontendV2ContractTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void productFlagsUseFrontendPropertyNamesAndReadLegacyNames() throws Exception {
        Product product = new Product();
        product.setFeatured(true);
        product.setNew(true);

        JsonNode json = mapper.readTree(mapper.writeValueAsString(product));
        assertTrue(json.get("isFeatured").asBoolean());
        assertTrue(json.get("isNew").asBoolean());
        assertNull(json.get("featured"));
        assertNull(json.get("new"));

        Product legacy = mapper.readValue("{\"featured\":true,\"new\":true}", Product.class);
        assertTrue(legacy.isFeatured());
        assertTrue(legacy.isNew());
    }

    @Test
    void verifiedReviewFlagUsesFrontendPropertyAndKeepsEmailPrivate() throws Exception {
        Review review = new Review();
        review.setVerifiedPurchase(true);
        review.setCustomerEmail("private@example.com");

        JsonNode json = mapper.readTree(mapper.writeValueAsString(review));
        assertTrue(json.get("isVerifiedPurchase").asBoolean());
        assertNull(json.get("customerEmail"));
    }
}
