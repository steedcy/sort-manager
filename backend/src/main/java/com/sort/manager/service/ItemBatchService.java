package com.sort.manager.service;

import com.sort.manager.dto.ItemBatchItemRequest;
import com.sort.manager.dto.ItemBatchRequest;
import com.sort.manager.dto.ItemBatchResponse;
import com.sort.manager.dto.ItemBatchRowResult;
import com.sort.manager.dto.ItemDTO;
import com.sort.manager.entity.Category;
import com.sort.manager.entity.Item;
import com.sort.manager.entity.Location;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemBatchService {

    private static final int MAX_BATCH_SIZE = 100;
    private static final int MAX_DESCRIPTION_BYTES = 20_000;

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;
    private final CurrentHousehold currentHousehold;

    @Transactional
    public ItemBatchResponse process(ItemBatchRequest request) {
        validateRequest(request);
        Long householdId = currentHousehold.requireHouseholdId();
        List<ItemBatchItemRequest> rows = request.getItems();
        Map<Long, Category> categories = loadCategories(householdId, rows);
        Map<Long, Location> locations = loadLocations(householdId, rows);

        List<ItemBatchRowResult> rowResults = new ArrayList<>(rows.size());
        List<Item> candidates = new ArrayList<>(rows.size());
        for (int index = 0; index < rows.size(); index++) {
            ItemBatchItemRequest row = rows.get(index);
            Map<String, String> errors = validateRow(row, categories, locations);
            rowResults.add(new ItemBatchRowResult(index, errors.isEmpty(), errors));
            if (errors.isEmpty()) {
                candidates.add(toEntity(row, householdId, categories, locations));
            }
        }

        int validCount = candidates.size();
        if (Boolean.TRUE.equals(request.getValidateOnly()) || validCount != rows.size()) {
            return new ItemBatchResponse(rows.size(), validCount, 0, rowResults, List.of());
        }

        List<Item> saved = itemRepository.saveAll(candidates);
        List<ItemDTO> createdItems = saved.stream().map(this::toDTO).toList();
        return new ItemBatchResponse(rows.size(), validCount, saved.size(), rowResults, createdItems);
    }

    private void validateRequest(ItemBatchRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("A batch must contain at least one item");
        }
        if (request.getItems().size() > MAX_BATCH_SIZE) {
            throw new IllegalArgumentException("A batch cannot contain more than 100 items");
        }
    }

    private Map<Long, Category> loadCategories(Long householdId, List<ItemBatchItemRequest> rows) {
        List<Long> ids = distinctIds(rows.stream().map(row -> row == null ? null : row.getCategoryId()).toList());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return categoryRepository.findAllByHouseholdIdAndIdIn(householdId, ids).stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));
    }

    private Map<Long, Location> loadLocations(Long householdId, List<ItemBatchItemRequest> rows) {
        List<Long> ids = distinctIds(rows.stream().map(row -> row == null ? null : row.getLocationId()).toList());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return locationRepository.findAllByHouseholdIdAndIdIn(householdId, ids).stream()
                .collect(Collectors.toMap(Location::getId, Function.identity()));
    }

    private List<Long> distinctIds(List<Long> ids) {
        Set<Long> distinct = ids.stream()
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        return List.copyOf(distinct);
    }

    private Map<String, String> validateRow(ItemBatchItemRequest row,
                                             Map<Long, Category> categories,
                                             Map<Long, Location> locations) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (row == null) {
            errors.put("row", "Item data is required");
            return errors;
        }
        String name = trimToNull(row.getName());
        if (name == null) {
            errors.put("name", "Item name is required");
        } else if (name.length() > 200) {
            errors.put("name", "Item name must be 200 characters or fewer");
        }
        if (row.getQuantity() != null && (row.getQuantity() < 1 || row.getQuantity() > Integer.MAX_VALUE)) {
            errors.put("quantity", "Quantity must be between 1 and 2147483647");
        }
        if (row.getPrice() != null) {
            if (row.getPrice().compareTo(BigDecimal.ZERO) < 0) {
                errors.put("price", "Price cannot be negative");
            } else if (row.getPrice().scale() > 2
                    || row.getPrice().compareTo(new BigDecimal("99999999.99")) > 0) {
                errors.put("price", "Price must have at most 8 integer digits and 2 decimal places");
            }
        }
        validateDate(row.getPurchaseDate(), "purchaseDate", errors);
        validateDate(row.getExpiryDate(), "expiryDate", errors);
        if (row.getImageUrl() != null && row.getImageUrl().length() > 500) {
            errors.put("imageUrl", "Image URL must be 500 characters or fewer");
        }
        if (row.getDescription() != null
                && row.getDescription().getBytes(StandardCharsets.UTF_8).length > MAX_DESCRIPTION_BYTES) {
            errors.put("description", "Description must fit within 20000 UTF-8 bytes");
        }
        if (row.getCategoryId() != null && !categories.containsKey(row.getCategoryId())) {
            errors.put("categoryId", "Category does not belong to the current household");
        }
        if (row.getLocationId() != null && !locations.containsKey(row.getLocationId())) {
            errors.put("locationId", "Location does not belong to the current household");
        }
        return Collections.unmodifiableMap(errors);
    }

    private void validateDate(String value, String field, Map<String, String> errors) {
        if (trimToNull(value) == null) {
            return;
        }
        if (!value.matches("\\d{4}-\\d{2}-\\d{2}")) {
            errors.put(field, "Date must use ISO format yyyy-MM-dd");
            return;
        }
        try {
            LocalDate parsed = LocalDate.parse(value);
            if (parsed.getYear() < 1000) {
                errors.put(field, "Date year must be between 1000 and 9999");
            }
        } catch (DateTimeParseException exception) {
            errors.put(field, "Date must use ISO format yyyy-MM-dd");
        }
    }

    private Item toEntity(ItemBatchItemRequest row,
                          Long householdId,
                          Map<Long, Category> categories,
                          Map<Long, Location> locations) {
        Item item = new Item();
        item.setHouseholdId(householdId);
        item.setName(row.getName().trim());
        item.setDescription(row.getDescription());
        item.setQuantity(row.getQuantity() == null ? 1 : Math.toIntExact(row.getQuantity()));
        item.setPrice(row.getPrice() == null ? BigDecimal.ZERO : row.getPrice());
        item.setPurchaseDate(trimToNull(row.getPurchaseDate()) == null
                ? LocalDate.now()
                : LocalDate.parse(row.getPurchaseDate()));
        item.setExpiryDate(trimToNull(row.getExpiryDate()) == null
                ? null
                : LocalDate.parse(row.getExpiryDate()));
        item.setCategory(row.getCategoryId() == null ? null : categories.get(row.getCategoryId()));
        item.setLocation(row.getLocationId() == null ? null : locations.get(row.getLocationId()));
        item.setImageUrl(trimToNull(row.getImageUrl()));
        return item;
    }

    private ItemDTO toDTO(Item item) {
        ItemDTO dto = new ItemDTO();
        dto.setId(item.getId());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());
        dto.setTotalPrice(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        dto.setPurchaseDate(item.getPurchaseDate().toString());
        if (item.getExpiryDate() != null) {
            dto.setExpiryDate(item.getExpiryDate().toString());
            if (item.getExpiryDate().isBefore(LocalDate.now())) {
                dto.setStatus("过期");
            } else if (!item.getExpiryDate().isAfter(LocalDate.now().plusDays(30))) {
                dto.setStatus("临期");
            } else {
                dto.setStatus("正常");
            }
        } else {
            dto.setStatus("正常");
        }
        if (item.getCategory() != null) {
            dto.setCategoryId(item.getCategory().getId());
            dto.setCategoryName(item.getCategory().getName());
            dto.setCategoryIcon(item.getCategory().getIcon());
            dto.setCategoryColor(item.getCategory().getColor());
        }
        if (item.getLocation() != null) {
            dto.setLocationId(item.getLocation().getId());
            dto.setLocationName(item.getLocation().getName());
            // Batch responses deliberately avoid traversing the LAZY parent chain. The
            // regular item query can provide a full path when the client refreshes.
            dto.setLocationPath(item.getLocation().getName());
        }
        dto.setImageUrl(item.getImageUrl());
        if (item.getCreatedAt() != null) {
            dto.setCreatedAt(item.getCreatedAt().toString());
        }
        if (item.getUpdatedAt() != null) {
            dto.setUpdatedAt(item.getUpdatedAt().toString());
        }
        return dto;
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
