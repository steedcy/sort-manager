package com.sort.manager.service;

import com.sort.manager.dto.ItemDTO;
import com.sort.manager.entity.Item;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ItemServiceTest {

    @Test
    void createRejectsMissingCategoryReference() {
        ItemRepository itemRepository = mock(ItemRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        LocationRepository locationRepository = mock(LocationRepository.class);
        ItemService service = new ItemService(itemRepository, categoryRepository, locationRepository);

        ItemDTO dto = validItem();
        dto.setCategoryId(99L);
        when(categoryRepository.findById(99L)).thenReturn(Optional.empty());
        when(itemRepository.save(any(Item.class))).thenAnswer((Answer<Item>) invocation -> invocation.getArgument(0));

        assertThrows(IllegalArgumentException.class, () -> service.create(dto));
    }

    @Test
    void createRejectsQuantityLessThanOne() {
        ItemRepository itemRepository = mock(ItemRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        LocationRepository locationRepository = mock(LocationRepository.class);
        ItemService service = new ItemService(itemRepository, categoryRepository, locationRepository);

        ItemDTO dto = validItem();
        dto.setQuantity(0);
        when(itemRepository.save(any(Item.class))).thenAnswer((Answer<Item>) invocation -> invocation.getArgument(0));

        assertThrows(IllegalArgumentException.class, () -> service.create(dto));
    }

    private ItemDTO validItem() {
        ItemDTO dto = new ItemDTO();
        dto.setName("Battery");
        dto.setQuantity(1);
        dto.setPrice(BigDecimal.ONE);
        dto.setPurchaseDate("2026-07-13");
        return dto;
    }
}
