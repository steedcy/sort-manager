package com.sort.manager.service;

import com.sort.manager.dto.DashboardDTO;
import com.sort.manager.dto.ItemDTO;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
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

    @Transactional(readOnly = true)
    public DashboardDTO getStats() {
        DashboardDTO dto = new DashboardDTO();
        dto.setTotalItems(itemRepository.count());
        dto.setTotalLocations(locationRepository.count());
        dto.setTotalCategories(categoryRepository.count());
        dto.setUncategorizedItems(itemRepository.countByCategoryIsNull());
        dto.setRecentItems(itemService.findRecent(8));

        // 计算总资产与临期/过期物品
        List<ItemDTO> allItems = itemService.findAll(null, null, null);
        BigDecimal totalAsset = BigDecimal.ZERO;
        List<ItemDTO> expiringList = new ArrayList<>();
        LocalDate thresholdDate = LocalDate.now().plusDays(30);

        for (ItemDTO item : allItems) {
            if (item.getTotalPrice() != null) {
                totalAsset = totalAsset.add(item.getTotalPrice());
            }
            if (item.getExpiryDate() != null && !item.getExpiryDate().isEmpty()) {
                LocalDate exp = LocalDate.parse(item.getExpiryDate(), DateTimeFormatter.ISO_DATE);
                if (!exp.isAfter(thresholdDate)) {
                    expiringList.add(item);
                }
            }
        }
        
        // 按照过期时间升序排序
        expiringList.sort((a, b) -> {
            LocalDate expA = LocalDate.parse(a.getExpiryDate(), DateTimeFormatter.ISO_DATE);
            LocalDate expB = LocalDate.parse(b.getExpiryDate(), DateTimeFormatter.ISO_DATE);
            return expA.compareTo(expB);
        });

        dto.setTotalAssetValue(totalAsset);
        dto.setExpiringItems(expiringList);

        // 分类统计
        List<Object[]> catStats = itemRepository.countByCategory();
        List<Map<String, Object>> categoryStats = new ArrayList<>();
        for (Object[] row : catStats) {
            Long catId = (Long) row[0];
            Long count = (Long) row[1];
            categoryRepository.findById(catId).ifPresent(cat -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", catId);
                m.put("name", cat.getName());
                m.put("icon", cat.getIcon());
                m.put("color", cat.getColor());
                m.put("count", count);
                categoryStats.add(m);
            });
        }
        dto.setCategoryStats(categoryStats);

        // 位置统计（取物品最多的前8个）
        List<Object[]> locStats = itemRepository.countByLocation();
        List<Map<String, Object>> locationStats = locStats.stream()
                .sorted((a, b) -> Long.compare((Long) b[1], (Long) a[1]))
                .limit(8)
                .map(row -> {
                    Long locId = (Long) row[0];
                    Long count = (Long) row[1];
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", locId);
                    m.put("count", count);
                    locationRepository.findById(locId).ifPresent(loc -> m.put("name", loc.getName()));
                    return m;
                })
                .collect(Collectors.toList());
        dto.setLocationStats(locationStats);

        return dto;
    }
}
