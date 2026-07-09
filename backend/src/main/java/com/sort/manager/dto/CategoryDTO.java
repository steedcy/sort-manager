package com.sort.manager.dto;

import lombok.Data;

@Data
public class CategoryDTO {
    private Long id;
    private String name;
    private String icon;
    private String color;
    private Long itemCount;
    private String createdAt;
    private String updatedAt;
}
