package com.sort.manager.service;

import com.sort.manager.dto.CategoryDTO;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CategoryServiceTest {

    @Test
    void createRejectsDuplicateCategoryName() {
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        ItemRepository itemRepository = mock(ItemRepository.class);
        CategoryService service = new CategoryService(categoryRepository, itemRepository);

        CategoryDTO dto = new CategoryDTO();
        dto.setName("Electronics");
        when(categoryRepository.existsByName("Electronics")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(dto));
    }
}
