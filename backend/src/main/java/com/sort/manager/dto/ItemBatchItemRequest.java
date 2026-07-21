package com.sort.manager.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ItemBatchItemRequest {
    private String name;
    private String description;
    private Long quantity;
    private BigDecimal price;
    private String purchaseDate;
    private String expiryDate;
    private Long categoryId;
    private Long locationId;
    private String imageUrl;
}
