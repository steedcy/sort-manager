package com.sort.manager.service;

import com.sort.manager.dto.ItemDTO;
import com.sort.manager.entity.Category;
import com.sort.manager.entity.Item;
import com.sort.manager.entity.Location;
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
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;

    @Transactional(readOnly = true)
    public List<ItemDTO> findAll(String keyword, Long categoryId, Long locationId) {
        List<Item> items = itemRepository.findByFilters(keyword, categoryId, locationId);
        return items.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ItemDTO findById(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("物品不存在: " + id));
        return toDTO(item);
    }

    @Transactional
    public ItemDTO create(ItemDTO dto) {
        Item item = new Item();
        fillItem(item, dto);
        return toDTO(itemRepository.save(item));
    }

    @Transactional
    public ItemDTO update(Long id, ItemDTO dto) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("物品不存在: " + id));
        fillItem(item, dto);
        return toDTO(itemRepository.save(item));
    }

    @Transactional
    public ItemDTO move(Long id, Long locationId) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("物品不存在: " + id));
        if (locationId != null) {
            locationRepository.findById(locationId).ifPresent(item::setLocation);
        } else {
            item.setLocation(null);
        }
        return toDTO(itemRepository.save(item));
    }

    @Transactional
    public void delete(Long id) {
        itemRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<ItemDTO> findRecent(int limit) {
        return itemRepository.findTop5ByOrderByCreatedAtDesc(PageRequest.of(0, limit))
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private void fillItem(Item item, ItemDTO dto) {
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
            categoryRepository.findById(dto.getCategoryId()).ifPresent(item::setCategory);
        } else {
            item.setCategory(null);
        }
        if (dto.getLocationId() != null) {
            locationRepository.findById(dto.getLocationId()).ifPresent(item::setLocation);
        } else {
            item.setLocation(null);
        }
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
                dto.setStatus("过期");
            } else {
                dto.setStatus("正常");
            }
        } else {
            dto.setStatus("正常");
        }

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
