package com.sort.manager.dto;

public record RecycleBinItemDTO(
        Long id,
        String name,
        Integer quantity,
        String categoryName,
        String locationName,
        String deletedAt,
        Long deletedByUserId,
        String deletedByDisplayName) {
}
