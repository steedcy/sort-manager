package com.sort.manager.service;

import com.sort.manager.dto.ItemDTO;
import com.sort.manager.entity.Item;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ItemDataProtectionServiceTest {

    private ItemRepository items;
    private AuditEventService audit;
    private ItemService service;

    @BeforeEach
    void setUp() {
        items = mock(ItemRepository.class);
        audit = mock(AuditEventService.class);
        CurrentHousehold current = mock(CurrentHousehold.class);
        when(current.requireHouseholdId()).thenReturn(42L);
        when(current.requireUserId()).thenReturn(9L);
        service = new ItemService(items, mock(CategoryRepository.class), mock(LocationRepository.class), current, audit);
    }

    @Test
    void deleteMarksItemAndWritesAuditInsteadOfDeletingRow() {
        Item item = item(8L, 42L, "Battery");
        when(items.findActiveByIdAndHouseholdId(8L, 42L)).thenReturn(Optional.of(item));

        service.delete(8L);

        assertThat(item.getDeletedAt()).isNotNull();
        assertThat(item.getDeletedByUserId()).isEqualTo(9L);
        verify(items, never()).delete(any(Item.class));
        verify(audit).record(42L, 9L, "ITEM_DELETED", "ITEM", 8L, "Battery", "移入回收站");
    }

    @Test
    void restoreAndPermanentDeleteAreHouseholdScoped() {
        Item deleted = item(8L, 42L, "Battery");
        deleted.setDeletedAt(LocalDateTime.now());
        deleted.setDeletedByUserId(9L);
        when(items.findDeletedByIdAndHouseholdId(8L, 42L)).thenReturn(Optional.of(deleted));
        when(items.save(any(Item.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ItemDTO restored = service.restore(8L);
        assertThat(restored.getId()).isEqualTo(8L);
        assertThat(deleted.getDeletedAt()).isNull();
        verify(audit).record(42L, 9L, "ITEM_RESTORED", "ITEM", 8L, "Battery", "从回收站恢复");

        deleted.setDeletedAt(LocalDateTime.now());
        service.permanentDelete(8L);
        verify(items).delete(deleted);
        verify(audit).record(42L, 9L, "ITEM_PERMANENTLY_DELETED", "ITEM", 8L, "Battery", "永久删除且不可恢复");

        when(items.findDeletedByIdAndHouseholdId(99L, 42L)).thenReturn(Optional.empty());
        assertThrows(java.util.NoSuchElementException.class, () -> service.restore(99L));
    }

    @Test
    void recycleBinUsesBoundedPageAndDeletedOnlyRepositoryQuery() {
        Item deleted = item(8L, 42L, "Battery");
        deleted.setDeletedAt(LocalDateTime.now());
        when(items.findDeletedByHouseholdId(org.mockito.ArgumentMatchers.eq(42L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(deleted)));

        var page = service.findRecycleBin(0, 500);

        assertThat(page.getContent()).hasSize(1);
        verify(items).findDeletedByHouseholdId(org.mockito.ArgumentMatchers.eq(42L),
                org.mockito.ArgumentMatchers.argThat(value -> value.getPageSize() == 100));
    }

    private Item item(Long id, Long householdId, String name) {
        Item item = new Item();
        item.setId(id);
        item.setHouseholdId(householdId);
        item.setName(name);
        item.setQuantity(1);
        item.setPrice(java.math.BigDecimal.ONE);
        item.setPurchaseDate(java.time.LocalDate.now());
        return item;
    }
}
