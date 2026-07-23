package com.sort.manager.service;

import com.sort.manager.dto.CategoryDTO;
import com.sort.manager.dto.ItemDTO;
import com.sort.manager.entity.Category;
import com.sort.manager.entity.Item;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HouseholdIsolationServiceTest {

    @Test
    void categoryCreationUsesAuthenticatedHouseholdForUniquenessAndOwnership() {
        CategoryRepository categories = mock(CategoryRepository.class);
        ItemRepository items = mock(ItemRepository.class);
        CurrentHousehold current = currentHousehold(42L);
        CategoryService service = new CategoryService(categories, items, current);

        CategoryDTO request = new CategoryDTO();
        request.setName("食品");
        when(categories.existsByHouseholdIdAndName(42L, "食品")).thenReturn(false);
        when(categories.save(any(Category.class))).thenAnswer(invocation -> {
            Category category = invocation.getArgument(0);
            category.setId(7L);
            return category;
        });
        when(items.countByHouseholdIdAndCategoryId(42L, 7L)).thenReturn(0L);

        CategoryDTO created = service.create(request);

        assertThat(created.getId()).isEqualTo(7L);
        verify(categories).existsByHouseholdIdAndName(42L, "食品");
        verify(categories).save(org.mockito.ArgumentMatchers.argThat(category ->
                Long.valueOf(42L).equals(category.getHouseholdId())));
    }

    @Test
    void itemCannotReferenceCategoryFromAnotherHousehold() {
        ItemRepository items = mock(ItemRepository.class);
        CategoryRepository categories = mock(CategoryRepository.class);
        LocationRepository locations = mock(LocationRepository.class);
        ItemService service = new ItemService(items, categories, locations, currentHousehold(42L),
                mock(AuditEventService.class));

        ItemDTO request = new ItemDTO();
        request.setName("牛奶");
        request.setQuantity(1);
        request.setPrice(BigDecimal.TEN);
        request.setCategoryId(99L);
        when(categories.findByIdAndHouseholdId(99L, 42L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.create(request));
        verify(categories).findByIdAndHouseholdId(99L, 42L);
    }

    @Test
    void itemDetailLookupIsAlwaysHouseholdScoped() {
        ItemRepository items = mock(ItemRepository.class);
        CategoryRepository categories = mock(CategoryRepository.class);
        LocationRepository locations = mock(LocationRepository.class);
        ItemService service = new ItemService(items, categories, locations, currentHousehold(42L),
                mock(AuditEventService.class));
        when(items.findByIdAndHouseholdId(8L, 42L)).thenReturn(Optional.empty());

        assertThrows(java.util.NoSuchElementException.class, () -> service.findById(8L));
        verify(items).findByIdAndHouseholdId(8L, 42L);
    }

    private CurrentHousehold currentHousehold(Long householdId) {
        CurrentHousehold current = mock(CurrentHousehold.class);
        when(current.requireHouseholdId()).thenReturn(householdId);
        return current;
    }
}
