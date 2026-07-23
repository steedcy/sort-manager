package com.sort.manager.service;

import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReferenceDataAggregationTest {

    @Test
    void categoryListUsesOneAggregatedCountQuery() {
        CategoryRepository categories = mock(CategoryRepository.class);
        ItemRepository items = mock(ItemRepository.class);
        CurrentHousehold household = mock(CurrentHousehold.class);
        CategoryRepository.CategoryCountView view = mock(CategoryRepository.CategoryCountView.class);
        when(household.requireHouseholdId()).thenReturn(9L);
        when(view.getId()).thenReturn(3L);
        when(view.getName()).thenReturn("日用品");
        when(view.getItemCount()).thenReturn(12L);
        when(categories.findAllWithActiveItemCounts(9L)).thenReturn(List.of(view));

        var result = new CategoryService(categories, items, household).findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getItemCount()).isEqualTo(12);
        verify(items, never()).countByHouseholdIdAndCategoryId(9L, 3L);
    }

    @Test
    void locationTreeUsesOneAggregatedCountQuery() {
        LocationRepository locations = mock(LocationRepository.class);
        ItemRepository items = mock(ItemRepository.class);
        CurrentHousehold household = mock(CurrentHousehold.class);
        LocationRepository.LocationCountView root = location(1L, "储物间", null, null, 5L);
        LocationRepository.LocationCountView child = location(2L, "上层", 1L, "储物间", 2L);
        when(household.requireHouseholdId()).thenReturn(9L);
        when(locations.findAllWithActiveItemCounts(9L)).thenReturn(List.of(root, child));

        var result = new LocationService(locations, items, household).findTree();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getItemCount()).isEqualTo(5);
        assertThat(result.get(0).getChildren()).singleElement()
                .satisfies(value -> assertThat(value.getItemCount()).isEqualTo(2));
        verify(items, never()).countByHouseholdIdAndLocationId(9L, 1L);
        verify(items, never()).countByHouseholdIdAndLocationId(9L, 2L);
    }

    private LocationRepository.LocationCountView location(Long id,
                                                            String name,
                                                            Long parentId,
                                                            String parentName,
                                                            Long count) {
        LocationRepository.LocationCountView view = mock(LocationRepository.LocationCountView.class);
        when(view.getId()).thenReturn(id);
        when(view.getName()).thenReturn(name);
        when(view.getParentId()).thenReturn(parentId);
        when(view.getParentName()).thenReturn(parentName);
        when(view.getItemCount()).thenReturn(count);
        when(view.getCreatedAt()).thenReturn(LocalDateTime.parse("2026-07-21T12:00:00"));
        return view;
    }
}
