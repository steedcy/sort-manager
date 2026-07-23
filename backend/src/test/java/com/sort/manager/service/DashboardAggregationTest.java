package com.sort.manager.service;

import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DashboardAggregationTest {

    @Test
    void dashboardUsesBoundedDatabaseAggregatesInsteadOfLoadingEveryItem() {
        ItemRepository items = mock(ItemRepository.class);
        CategoryRepository categories = mock(CategoryRepository.class);
        LocationRepository locations = mock(LocationRepository.class);
        ItemService itemService = mock(ItemService.class);
        CurrentHousehold household = mock(CurrentHousehold.class);
        CategoryRepository.CategoryCountView category = mock(CategoryRepository.CategoryCountView.class);
        LocationRepository.LocationCountView location = mock(LocationRepository.LocationCountView.class);

        when(household.requireHouseholdId()).thenReturn(7L);
        when(items.sumActiveAssetValue(7L)).thenReturn(new BigDecimal("199.50"));
        when(itemService.findRecent(8)).thenReturn(List.of());
        when(itemService.findExpiring(any(LocalDate.class), anyInt())).thenReturn(List.of());
        when(category.getId()).thenReturn(1L);
        when(category.getName()).thenReturn("日用品");
        when(category.getItemCount()).thenReturn(4L);
        when(categories.findAllWithActiveItemCounts(7L)).thenReturn(List.of(category));
        when(location.getId()).thenReturn(2L);
        when(location.getName()).thenReturn("储物间");
        when(location.getItemCount()).thenReturn(3L);
        when(locations.findAllWithActiveItemCounts(7L)).thenReturn(List.of(location));

        var result = new DashboardService(items, categories, locations, itemService, household).getStats();

        assertThat(result.getTotalAssetValue()).isEqualByComparingTo("199.50");
        assertThat(result.getCategoryStats()).singleElement().satisfies(value ->
                assertThat(value.get("name")).isEqualTo("日用品"));
        assertThat(result.getLocationStats()).singleElement().satisfies(value ->
                assertThat(value.get("name")).isEqualTo("储物间"));
        verify(itemService, never()).findAll(any(), any(), any());
    }
}
