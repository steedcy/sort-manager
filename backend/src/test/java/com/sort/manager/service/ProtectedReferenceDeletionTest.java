package com.sort.manager.service;

import com.sort.manager.entity.Category;
import com.sort.manager.entity.Location;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProtectedReferenceDeletionTest {

    @Test
    void categoryReferencedByRecycledItemCannotBeDeleted() {
        CategoryRepository categories = mock(CategoryRepository.class);
        ItemRepository items = mock(ItemRepository.class);
        CurrentHousehold household = mock(CurrentHousehold.class);
        Category category = new Category();
        category.setId(3L);
        when(household.requireHouseholdId()).thenReturn(9L);
        when(categories.findByIdAndHouseholdId(3L, 9L)).thenReturn(Optional.of(category));
        when(items.existsAnyByHouseholdIdAndCategoryId(9L, 3L)).thenReturn(true);

        assertThatThrownBy(() -> new CategoryService(categories, items, household).delete(3L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("回收站");
    }

    @Test
    void locationReferencedByRecycledItemCannotBeDeleted() {
        LocationRepository locations = mock(LocationRepository.class);
        ItemRepository items = mock(ItemRepository.class);
        CurrentHousehold household = mock(CurrentHousehold.class);
        Location location = new Location();
        location.setId(4L);
        when(household.requireHouseholdId()).thenReturn(9L);
        when(locations.findByIdAndHouseholdId(4L, 9L)).thenReturn(Optional.of(location));
        when(items.existsAnyByHouseholdIdAndLocationId(9L, 4L)).thenReturn(true);

        assertThatThrownBy(() -> new LocationService(locations, items, household).delete(4L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("回收站");
    }
}
