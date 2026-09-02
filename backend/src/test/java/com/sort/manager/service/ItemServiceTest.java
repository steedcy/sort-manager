package com.sort.manager.service;

import com.sort.manager.dto.ItemDTO;
import com.sort.manager.book.BookMetadata;
import com.sort.manager.entity.Item;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ItemServiceTest {

    @Test
    void createPersistsBookMetadataFromAnExplicitUserSubmission() {
        ItemRepository itemRepository = mock(ItemRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        LocationRepository locationRepository = mock(LocationRepository.class);
        CurrentHousehold household = mock(CurrentHousehold.class);
        when(household.requireHouseholdId()).thenReturn(1L); when(household.requireUserId()).thenReturn(2L);
        when(itemRepository.save(any(Item.class))).thenAnswer((Answer<Item>) invocation -> invocation.getArgument(0));
        ItemService service = new ItemService(itemRepository, categoryRepository, locationRepository, household, mock(AuditEventService.class));
        ItemDTO dto = validItem();
        dto.setBookMetadata(new BookMetadata("7111128060", "9787111128069", "C程序设计语言", null, List.of("Brian W. Kernighan"), "机械工业出版社", "2002", "简介", 258, List.of("Programming"), "zh", "https://example.test/cover.jpg", "google-books", "id", null));

        ItemDTO created = service.create(dto);

        assertEquals("9787111128069", created.getBookMetadata().isbn13());
        assertEquals("Battery", created.getName());
    }

    @Test
    void createRejectsMissingCategoryReference() {
        ItemRepository itemRepository = mock(ItemRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        LocationRepository locationRepository = mock(LocationRepository.class);
        CurrentHousehold currentHousehold = mock(CurrentHousehold.class);
        when(currentHousehold.requireHouseholdId()).thenReturn(1L);
        ItemService service = new ItemService(itemRepository, categoryRepository, locationRepository, currentHousehold,
                mock(AuditEventService.class));

        ItemDTO dto = validItem();
        dto.setCategoryId(99L);
        when(categoryRepository.findByIdAndHouseholdId(99L, 1L)).thenReturn(Optional.empty());
        when(itemRepository.save(any(Item.class))).thenAnswer((Answer<Item>) invocation -> invocation.getArgument(0));

        assertThrows(IllegalArgumentException.class, () -> service.create(dto));
    }

    @Test
    void createRejectsQuantityLessThanOne() {
        ItemRepository itemRepository = mock(ItemRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        LocationRepository locationRepository = mock(LocationRepository.class);
        CurrentHousehold currentHousehold = mock(CurrentHousehold.class);
        when(currentHousehold.requireHouseholdId()).thenReturn(1L);
        ItemService service = new ItemService(itemRepository, categoryRepository, locationRepository, currentHousehold,
                mock(AuditEventService.class));

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
