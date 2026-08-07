package com.sort.manager.service;

import com.sort.manager.dto.ItemDTO;
import com.sort.manager.dto.PageResponse;
import com.sort.manager.dto.RecycleBinItemDTO;
import com.sort.manager.entity.Category;
import com.sort.manager.entity.Item;
import com.sort.manager.entity.Location;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {

    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt",
            "updatedAt",
            "name",
            "quantity",
            "price",
            "purchaseDate",
            "expiryDate"
    );
    private static final Set<String> ALLOWED_STATUSES = Set.of("normal", "expired", "expiring");

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;
    private final CurrentHousehold currentHousehold;
    private final AuditEventService auditEventService;

    @Transactional(readOnly = true)
    public List<ItemDTO> findAll(String keyword, Long categoryId, Long locationId) {
        List<Item> items = itemRepository.findByFilters(currentHousehold.requireHouseholdId(), keyword, categoryId, locationId);
        return items.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<ItemDTO> search(String keyword,
                                        Long categoryId,
                                        Long locationId,
                                        String status,
                                        Integer page,
                                        Integer size,
                                        String sort,
                                        String direction) {
        int pageNumber = page != null && page >= 0 ? page : 0;
        int pageSize = normalizeSize(size);
        String sortField = sort != null && ALLOWED_SORT_FIELDS.contains(sort) ? sort : "createdAt";
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String normalizedKeyword = normalizeKeyword(keyword);
        String normalizedStatus = normalizeStatus(status);
        LocalDate today = LocalDate.now();

        Page<Item> result = itemRepository.searchByFilters(
                currentHousehold.requireHouseholdId(),
                normalizedKeyword,
                categoryId,
                locationId,
                normalizedStatus,
                today,
                today.plusDays(30),
                PageRequest.of(pageNumber, pageSize, Sort.by(sortDirection, sortField))
        );

        List<ItemDTO> content = result.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return PageResponse.from(result, content);
    }

    @Transactional(readOnly = true)
    public ItemDTO findById(Long id) {
        Item item = itemRepository.findByIdAndHouseholdId(id, currentHousehold.requireHouseholdId())
                .orElseThrow(() -> new NoSuchElementException("Item not found: " + id));
        return toDTO(item);
    }

    @Transactional
    public ItemDTO create(ItemDTO dto) {
        Item item = new Item();
        Long householdId = currentHousehold.requireHouseholdId();
        Long actorUserId = currentHousehold.requireUserId();
        item.setHouseholdId(householdId);
        fillItem(item, dto);
        Item saved = itemRepository.save(item);
        auditEventService.record(householdId, actorUserId, "ITEM_CREATED", "ITEM", saved.getId(),
                saved.getName(), "新建物品");
        return toDTO(saved);
    }

    @Transactional
    public ItemDTO update(Long id, ItemDTO dto) {
        Long householdId = currentHousehold.requireHouseholdId();
        Long actorUserId = currentHousehold.requireUserId();
        Item item = itemRepository.findActiveByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new NoSuchElementException("Item not found: " + id));
        fillItem(item, dto);
        Item saved = itemRepository.save(item);
        auditEventService.record(householdId, actorUserId, "ITEM_UPDATED", "ITEM", id,
                saved.getName(), "更新物品信息");
        return toDTO(saved);
    }

    @Transactional
    public ItemDTO move(Long id, Long locationId) {
        Long householdId = currentHousehold.requireHouseholdId();
        Long actorUserId = currentHousehold.requireUserId();
        Item item = itemRepository.findActiveByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new NoSuchElementException("Item not found: " + id));
        if (locationId != null) {
            Location location = locationRepository.findByIdAndHouseholdId(locationId, householdId)
                    .orElseThrow(() -> new IllegalArgumentException("Location not found: " + locationId));
            item.setLocation(location);
        } else {
            item.setLocation(null);
        }
        Item saved = itemRepository.save(item);
        auditEventService.record(householdId, actorUserId, "ITEM_MOVED", "ITEM", id,
                saved.getName(), locationId == null ? "清除存放位置" : "移动到其他位置");
        return toDTO(saved);
    }

    @Transactional
    public void delete(Long id) {
        Long householdId = currentHousehold.requireHouseholdId();
        Long actorUserId = currentHousehold.requireUserId();
        Item item = itemRepository.findActiveByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new NoSuchElementException("Item not found: " + id));
        item.setDeletedAt(java.time.LocalDateTime.now());
        item.setDeletedByUserId(actorUserId);
        itemRepository.save(item);
        auditEventService.record(householdId, actorUserId, "ITEM_DELETED", "ITEM", id,
                item.getName(), "移入回收站");
    }

    @Transactional(readOnly = true)
    public PageResponse<RecycleBinItemDTO> findRecycleBin(Integer page, Integer size) {
        int pageNumber = page == null || page < 0 ? 0 : page;
        int pageSize = size == null || size < 1 ? 20 : Math.min(size, MAX_PAGE_SIZE);
        Page<Item> result = itemRepository.findDeletedByHouseholdId(
                currentHousehold.requireHouseholdId(),
                PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "deletedAt")));
        return PageResponse.from(result, result.getContent().stream().map(this::toRecycleBinDTO).toList());
    }

    @Transactional
    public ItemDTO restore(Long id) {
        Long householdId = currentHousehold.requireHouseholdId();
        Long actorUserId = currentHousehold.requireUserId();
        Item item = itemRepository.findDeletedByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new NoSuchElementException("Deleted item not found: " + id));
        item.setDeletedAt(null);
        item.setDeletedByUserId(null);
        Item restored = itemRepository.save(item);
        auditEventService.record(householdId, actorUserId, "ITEM_RESTORED", "ITEM", id,
                restored.getName(), "从回收站恢复");
        return toDTO(restored);
    }

    @Transactional
    public void permanentDelete(Long id) {
        Long householdId = currentHousehold.requireHouseholdId();
        Long actorUserId = currentHousehold.requireUserId();
        Item item = itemRepository.findDeletedByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new NoSuchElementException("Deleted item not found: " + id));
        String name = item.getName();
        itemRepository.delete(item);
        auditEventService.record(householdId, actorUserId, "ITEM_PERMANENTLY_DELETED", "ITEM", id,
                name, "永久删除且不可恢复");
    }

    @Transactional(readOnly = true)
    public List<ItemDTO> findRecent(int limit) {
        return itemRepository.findRecent(currentHousehold.requireHouseholdId(), PageRequest.of(0, limit))
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ItemDTO> findExpiring(java.time.LocalDate threshold, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return itemRepository.findExpiring(currentHousehold.requireHouseholdId(), threshold,
                        PageRequest.of(0, safeLimit))
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private void fillItem(Item item, ItemDTO dto) {
        validateItem(dto);
        item.setName(dto.getName());
        item.setDescription(dto.getDescription());
        item.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 1);
        item.setPrice(dto.getPrice() != null ? dto.getPrice() : BigDecimal.ZERO);

        if (dto.getPurchaseDate() != null && !dto.getPurchaseDate().isEmpty()) {
            try {
                item.setPurchaseDate(LocalDate.parse(dto.getPurchaseDate(), DateTimeFormatter.ISO_DATE));
            } catch (DateTimeParseException e) {
                item.setPurchaseDate(LocalDate.now());
            }
        } else {
            item.setPurchaseDate(LocalDate.now());
        }

        if (dto.getExpiryDate() != null && !dto.getExpiryDate().isEmpty()) {
            try {
                item.setExpiryDate(LocalDate.parse(dto.getExpiryDate(), DateTimeFormatter.ISO_DATE));
            } catch (DateTimeParseException e) {
                item.setExpiryDate(null);
            }
        } else {
            item.setExpiryDate(null);
        }

        item.setImageUrl(dto.getImageUrl());
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findByIdAndHouseholdId(dto.getCategoryId(), item.getHouseholdId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found: " + dto.getCategoryId()));
            item.setCategory(category);
        } else {
            item.setCategory(null);
        }
        if (dto.getLocationId() != null) {
            Location location = locationRepository.findByIdAndHouseholdId(dto.getLocationId(), item.getHouseholdId())
                    .orElseThrow(() -> new IllegalArgumentException("Location not found: " + dto.getLocationId()));
            item.setLocation(location);
        } else {
            item.setLocation(null);
        }
    }

    private void validateItem(ItemDTO dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Item name is required");
        }
        if (dto.getQuantity() != null && dto.getQuantity() < 1) {
            throw new IllegalArgumentException("Quantity must be at least 1");
        }
        if (dto.getPrice() != null && dto.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }
    }

    private int normalizeSize(Integer size) {
        if (size == null) {
            return DEFAULT_PAGE_SIZE;
        }
        if (size < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        return keyword.trim();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return null;
        }
        String normalized = status.trim().toLowerCase();
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Unsupported item status filter: " + status);
        }
        return normalized;
    }

    private ItemDTO toDTO(Item item) {
        ItemDTO dto = new ItemDTO();
        dto.setId(item.getId());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());

        if (item.getPrice() != null && item.getQuantity() != null) {
            dto.setTotalPrice(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        } else {
            dto.setTotalPrice(BigDecimal.ZERO);
        }

        if (item.getPurchaseDate() != null) {
            dto.setPurchaseDate(item.getPurchaseDate().toString());
        }

        if (item.getExpiryDate() != null) {
            dto.setExpiryDate(item.getExpiryDate().toString());
            if (item.getExpiryDate().isBefore(LocalDate.now())) {
                dto.setStatus("\u8fc7\u671f");
            } else if (!item.getExpiryDate().isAfter(LocalDate.now().plusDays(30))) {
                dto.setStatus("\u4e34\u671f");
            } else {
                dto.setStatus("\u6b63\u5e38");
            }
        } else {
            dto.setStatus("\u6b63\u5e38");
        }
        dto.setIsLowStock(item.getQuantity() != null && item.getQuantity() <= 2);

        dto.setImageUrl(item.getImageUrl());
        if (item.getCategory() != null) {
            dto.setCategoryId(item.getCategory().getId());
            dto.setCategoryName(item.getCategory().getName());
            dto.setCategoryIcon(item.getCategory().getIcon());
            dto.setCategoryColor(item.getCategory().getColor());
        }
        if (item.getLocation() != null) {
            dto.setLocationId(item.getLocation().getId());
            dto.setLocationName(item.getLocation().getName());
            dto.setLocationPath(buildLocationPath(item.getLocation()));
        }
        if (item.getCreatedAt() != null) dto.setCreatedAt(item.getCreatedAt().toString());
        if (item.getUpdatedAt() != null) dto.setUpdatedAt(item.getUpdatedAt().toString());
        return dto;
    }

    private RecycleBinItemDTO toRecycleBinDTO(Item item) {
        return new RecycleBinItemDTO(
                item.getId(),
                item.getName(),
                item.getQuantity(),
                item.getCategory() == null ? null : item.getCategory().getName(),
                item.getLocation() == null ? null : item.getLocation().getName(),
                item.getDeletedAt() == null ? null : item.getDeletedAt().toString(),
                item.getDeletedByUserId(),
                item.getDeletedByUser() == null ? null : item.getDeletedByUser().getDisplayName());
    }

    private String buildLocationPath(Location location) {
        StringBuilder sb = new StringBuilder(location.getName());
        Location parent = location.getParent();
        while (parent != null) {
            sb.insert(0, parent.getName() + " > ");
            parent = parent.getParent();
        }
        return sb.toString();
    }
}
