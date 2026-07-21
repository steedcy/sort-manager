package com.sort.manager.service;

import com.sort.manager.dto.CategoryDTO;
import com.sort.manager.entity.Category;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.security.CurrentHousehold;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final CurrentHousehold currentHousehold;

    @Transactional(readOnly = true)
    public List<CategoryDTO> findAll() {
        return categoryRepository.findAllOrdered(currentHousehold.requireHouseholdId()).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDTO findById(Long id) {
        Category c = categoryRepository.findByIdAndHouseholdId(id, currentHousehold.requireHouseholdId())
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + id));
        return toDTO(c);
    }

    @Transactional
    public CategoryDTO create(CategoryDTO dto) {
        validateName(dto.getName());
        Long householdId = currentHousehold.requireHouseholdId();
        if (categoryRepository.existsByHouseholdIdAndName(householdId, dto.getName())) {
            throw new IllegalArgumentException("Category name already exists: " + dto.getName());
        }

        Category c = new Category();
        c.setHouseholdId(householdId);
        c.setName(dto.getName());
        c.setIcon(dto.getIcon());
        c.setColor(dto.getColor());
        return toDTO(categoryRepository.save(c));
    }

    @Transactional
    public CategoryDTO update(Long id, CategoryDTO dto) {
        Long householdId = currentHousehold.requireHouseholdId();
        Category c = categoryRepository.findByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + id));
        validateName(dto.getName());
        categoryRepository.findByHouseholdIdAndName(householdId, dto.getName())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Category name already exists: " + dto.getName());
                });

        c.setName(dto.getName());
        c.setIcon(dto.getIcon());
        c.setColor(dto.getColor());
        return toDTO(categoryRepository.save(c));
    }

    @Transactional
    public void delete(Long id) {
        Category category = categoryRepository.findByIdAndHouseholdId(id, currentHousehold.requireHouseholdId())
                .orElseThrow(() -> new NoSuchElementException("Category not found: " + id));
        categoryRepository.delete(category);
    }

    private void validateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Category name is required");
        }
    }

    private CategoryDTO toDTO(Category c) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setIcon(c.getIcon());
        dto.setColor(c.getColor());
        dto.setItemCount(itemRepository.countByHouseholdIdAndCategoryId(c.getHouseholdId(), c.getId()));
        if (c.getCreatedAt() != null) dto.setCreatedAt(c.getCreatedAt().toString());
        if (c.getUpdatedAt() != null) dto.setUpdatedAt(c.getUpdatedAt().toString());
        return dto;
    }
}
