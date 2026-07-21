package com.sort.manager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ItemBatchResponse {
    private int totalCount;
    private int validCount;
    private int createdCount;
    private List<ItemBatchRowResult> rows;
    private List<ItemDTO> createdItems;
}
