package com.sort.manager.service;

import com.sort.manager.dto.CategoryDTO;
import com.sort.manager.entity.Category;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;

    @Transactional(readOnly = true)
    public List<CategoryDTO> findAll() {
        return categoryRepository.findAllOrdered().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDTO findById(Long id) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分类不存在: " + id));
        return toDTO(c);
    }

    @Transactional
    public CategoryDTO create(CategoryDTO dto) {
        Category c = new Category();
        c.setName(dto.getName());
        c.setIcon(dto.getIcon());
        c.setColor(dto.getColor());
        return toDTO(categoryRepository.save(c));
    }

    @Transactional
    public CategoryDTO update(Long id, CategoryDTO dto) {
        Category c = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分类不存在: " + id));
        c.setName(dto.getName());
        c.setIcon(dto.getIcon());
        c.setColor(dto.getColor());
        return toDTO(categoryRepository.save(c));
    }

    @Transactional
    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }

    private CategoryDTO toDTO(Category c) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setIcon(c.getIcon());
        dto.setColor(c.getColor());
        dto.setItemCount(itemRepository.countByCategoryId(c.getId()));
        if (c.getCreatedAt() != null) dto.setCreatedAt(c.getCreatedAt().toString());
        if (c.getUpdatedAt() != null) dto.setUpdatedAt(c.getUpdatedAt().toString());
        return dto;
    }
}
