package com.sort.manager.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ItemDTO {
    private Long id;
    private String name;
    private String description;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal totalPrice;
    private String purchaseDate;
    private String expiryDate;
    private String status;
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;
    private Long locationId;
    private String locationName;
    private String locationPath;
    private String imageUrl;
    private String createdAt;
    private String updatedAt;
}
