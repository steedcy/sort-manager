package com.sort.manager.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemBatchRequest {
    @NotNull(message = "validateOnly is required")
    private Boolean validateOnly;

    @NotNull(message = "Items are required")
    @Size(min = 1, max = 100, message = "A batch must contain between 1 and 100 items")
    private List<ItemBatchItemRequest> items;
}
