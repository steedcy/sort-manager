package com.sort.manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CategoryDTO {
    private Long id;
    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name must be 100 characters or fewer")
    private String name;
    @Size(max = 50, message = "Icon name must be 50 characters or fewer")
    private String icon;
    @Size(max = 30, message = "Color must be 30 characters or fewer")
    private String color;
    private Long itemCount;
    private String createdAt;
    private String updatedAt;
}
