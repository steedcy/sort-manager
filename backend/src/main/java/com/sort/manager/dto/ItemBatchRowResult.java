package com.sort.manager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

@Data
@AllArgsConstructor
public class ItemBatchRowResult {
    private int index;
    private boolean valid;
    private Map<String, String> fieldErrors;
}
