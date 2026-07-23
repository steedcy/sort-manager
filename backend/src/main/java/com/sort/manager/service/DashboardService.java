package com.sort.manager.service;

import com.sort.manager.dto.DashboardDTO;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;
    private final ItemService itemService;
    private final CurrentHousehold currentHousehold;

    @Transactional(readOnly = true)
    public DashboardDTO getStats() {
        DashboardDTO dto = new DashboardDTO();
        Long householdId = currentHousehold.requireHouseholdId();
        dto.setTotalItems(itemRepository.countByHouseholdId(householdId));
        dto.setTotalLocations(locationRepository.countByHouseholdId(householdId));
        dto.setTotalCategories(categoryRepository.countByHouseholdId(householdId));
        dto.setUncategorizedItems(itemRepository.countByHouseholdIdAndCategoryIsNull(householdId));
        dto.setRecentItems(itemService.findRecent(8));

        BigDecimal totalAsset = itemRepository.sumActiveAssetValue(householdId);
        dto.setTotalAssetValue(totalAsset == null ? BigDecimal.ZERO : totalAsset);
        dto.setExpiringItems(itemService.findExpiring(LocalDate.now().plusDays(30), 20));

        List<Map<String, Object>> categoryStats = categoryRepository.findAllWithActiveItemCounts(householdId).stream()
                .filter(category -> category.getItemCount() != null && category.getItemCount() > 0)
                .map(category -> {
                    Map<String, Object> value = new LinkedHashMap<>();
                    value.put("id", category.getId());
                    value.put("name", category.getName());
                    value.put("icon", category.getIcon());
                    value.put("color", category.getColor());
                    value.put("count", category.getItemCount());
                    return value;
                })
                .collect(Collectors.toList());
        dto.setCategoryStats(categoryStats);

        List<Map<String, Object>> locationStats = locationRepository.findAllWithActiveItemCounts(householdId).stream()
                .filter(location -> location.getItemCount() != null && location.getItemCount() > 0)
                .sorted((a, b) -> Long.compare(b.getItemCount(), a.getItemCount()))
                .limit(8)
                .map(location -> {
                    Map<String, Object> value = new LinkedHashMap<>();
                    value.put("id", location.getId());
                    value.put("name", location.getName());
                    value.put("count", location.getItemCount());
                    return value;
                })
                .collect(Collectors.toList());
        dto.setLocationStats(locationStats);
        return dto;
    }
}
