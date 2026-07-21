package com.sort.manager.service;

import com.sort.manager.dto.ItemBatchItemRequest;
import com.sort.manager.dto.ItemBatchRequest;
import com.sort.manager.dto.ItemBatchResponse;
import com.sort.manager.entity.Category;
import com.sort.manager.entity.Item;
import com.sort.manager.entity.Location;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ItemBatchServiceTest {

    private ItemRepository itemRepository;
    private CategoryRepository categoryRepository;
    private LocationRepository locationRepository;
    private ItemBatchService service;

    @BeforeEach
    void setUp() {
        itemRepository = mock(ItemRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        locationRepository = mock(LocationRepository.class);
        CurrentHousehold currentHousehold = mock(CurrentHousehold.class);
        when(currentHousehold.requireHouseholdId()).thenReturn(7L);
        service = new ItemBatchService(itemRepository, categoryRepository, locationRepository, currentHousehold);
    }

    @Test
    void rejectsEmptyAndMoreThanOneHundredRows() {
        assertThrows(IllegalArgumentException.class,
                () -> service.process(new ItemBatchRequest(false, List.of())));

        List<ItemBatchItemRequest> rows = java.util.stream.IntStream.range(0, 101)
                .mapToObj(index -> validRow("Item " + index))
                .toList();
        assertThrows(IllegalArgumentException.class,
                () -> service.process(new ItemBatchRequest(false, rows)));
    }

    @Test
    void returnsStrictFieldErrorsAndDoesNotPartiallyWrite() {
        ItemBatchItemRequest valid = validRow("Battery");
        ItemBatchItemRequest invalid = validRow(" ");
        invalid.setQuantity(0L);
        invalid.setPrice(new BigDecimal("-0.01"));
        invalid.setPurchaseDate("2026-02-30");
        invalid.setExpiryDate("07/31/2027");

        ItemBatchResponse response = service.process(new ItemBatchRequest(false, List.of(valid, invalid)));

        assertEquals(2, response.getTotalCount());
        assertEquals(1, response.getValidCount());
        assertEquals(0, response.getCreatedCount());
        assertTrue(response.getRows().get(0).isValid());
        assertFalse(response.getRows().get(1).isValid());
        assertTrue(response.getRows().get(1).getFieldErrors().keySet()
                .containsAll(List.of("name", "quantity", "price", "purchaseDate", "expiryDate")));
        verify(itemRepository, never()).saveAll(anyList());
    }

    @Test
    void rejectsDatesThatAreParseableButNotExactFourDigitIsoDates() {
        ItemBatchItemRequest row = validRow("Calendar");
        row.setPurchaseDate("+2026-07-21");

        ItemBatchResponse response = service.process(new ItemBatchRequest(true, List.of(row)));

        assertEquals("Date must use ISO format yyyy-MM-dd",
                response.getRows().get(0).getFieldErrors().get("purchaseDate"));
    }

    @Test
    void rejectsValuesThatCannotBeStoredWithoutLoss() {
        ItemBatchItemRequest row = validRow("Oversized");
        row.setQuantity((long) Integer.MAX_VALUE + 1);
        row.setPrice(new BigDecimal("1.001"));
        row.setPurchaseDate("0999-12-31");
        row.setDescription("四".repeat(22_000));

        ItemBatchResponse response = service.process(new ItemBatchRequest(true, List.of(row)));

        assertTrue(response.getRows().get(0).getFieldErrors().keySet()
                .containsAll(List.of("quantity", "price", "purchaseDate", "description")));
        verify(itemRepository, never()).saveAll(anyList());
    }

    @Test
    void rejectsReferencesOutsideCurrentHouseholdUsingBulkLookups() {
        ItemBatchItemRequest row = validRow("Passport holder");
        row.setCategoryId(41L);
        row.setLocationId(51L);
        when(categoryRepository.findAllByHouseholdIdAndIdIn(7L, List.of(41L))).thenReturn(List.of());
        when(locationRepository.findAllByHouseholdIdAndIdIn(7L, List.of(51L))).thenReturn(List.of());

        ItemBatchResponse response = service.process(new ItemBatchRequest(false, List.of(row)));

        assertEquals("Category does not belong to the current household",
                response.getRows().get(0).getFieldErrors().get("categoryId"));
        assertEquals("Location does not belong to the current household",
                response.getRows().get(0).getFieldErrors().get("locationId"));
        verify(categoryRepository).findAllByHouseholdIdAndIdIn(7L, List.of(41L));
        verify(locationRepository).findAllByHouseholdIdAndIdIn(7L, List.of(51L));
        verify(itemRepository, never()).saveAll(anyList());
    }

    @Test
    void validateOnlyReturnsValidRowsWithoutWriting() {
        ItemBatchResponse response = service.process(
                new ItemBatchRequest(true, List.of(validRow("Umbrella"), validRow("Torch"))));

        assertEquals(2, response.getValidCount());
        assertEquals(0, response.getCreatedCount());
        assertTrue(response.getCreatedItems().isEmpty());
        verify(itemRepository, never()).saveAll(anyList());
    }

    @Test
    void savesAllRowsOnceWhenTheWholeBatchIsValid() {
        Category category = new Category();
        category.setId(41L);
        category.setHouseholdId(7L);
        category.setName("Travel");
        Location location = new Location();
        location.setId(51L);
        location.setHouseholdId(7L);
        location.setName("Hall cupboard");
        when(categoryRepository.findAllByHouseholdIdAndIdIn(7L, List.of(41L))).thenReturn(List.of(category));
        when(locationRepository.findAllByHouseholdIdAndIdIn(7L, List.of(51L))).thenReturn(List.of(location));
        when(itemRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
        ItemBatchItemRequest first = validRow("Battery");
        first.setCategoryId(41L);
        ItemBatchItemRequest second = validRow("Torch");
        second.setLocationId(51L);

        ItemBatchResponse response = service.process(new ItemBatchRequest(false, List.of(first, second)));

        assertEquals(2, response.getCreatedCount());
        assertEquals(2, response.getCreatedItems().size());
        ArgumentCaptor<List<Item>> captor = ArgumentCaptor.forClass(List.class);
        verify(itemRepository).saveAll(captor.capture());
        assertEquals(7L, captor.getValue().get(0).getHouseholdId());
        assertEquals(category, captor.getValue().get(0).getCategory());
        assertEquals(location, captor.getValue().get(1).getLocation());
    }

    private ItemBatchItemRequest validRow(String name) {
        ItemBatchItemRequest row = new ItemBatchItemRequest();
        row.setName(name);
        row.setQuantity(1L);
        row.setPrice(new BigDecimal("9.90"));
        row.setPurchaseDate("2026-07-21");
        return row;
    }
}
