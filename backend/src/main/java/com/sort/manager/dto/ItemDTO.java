package com.sort.manager.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import com.sort.manager.book.BookMetadata;
import java.math.BigDecimal;

@Data
public class ItemDTO {
    private Long id;
    @NotBlank(message = "Item name is required")
    @Size(max = 200, message = "Item name must be 200 characters or fewer")
    private String name;
    private String description;
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    private BigDecimal price;
    private BigDecimal totalPrice;
    private String purchaseDate;
    private String expiryDate;
    private String status;
    private Boolean isLowStock;
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;
    private Long locationId;
    private String locationName;
    private String locationPath;
    @Size(max = 500, message = "Image URL must be 500 characters or fewer")
    private String imageUrl;
    private String createdAt;
    private String updatedAt;
    private BookMetadata bookMetadata;
}
