package com.sort.manager.dto;

import com.sort.manager.dto.ItemDTO;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class DashboardDTO {
    private Long totalItems;
    private Long totalLocations;
    private Long totalCategories;
    private Long uncategorizedItems;
    private BigDecimal totalAssetValue;
    
    private List<ItemDTO> recentItems;
    private List<ItemDTO> expiringItems;
    private List<Map<String, Object>> categoryStats;
    private List<Map<String, Object>> locationStats;
}
