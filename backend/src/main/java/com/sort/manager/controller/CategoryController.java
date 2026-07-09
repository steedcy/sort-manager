package com.sort.manager.controller;

import com.sort.manager.dto.ApiResponse;
import com.sort.manager.dto.CategoryDTO;
import com.sort.manager.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ApiResponse<List<CategoryDTO>> getAll() {
        return ApiResponse.ok(categoryService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<CategoryDTO> getById(@PathVariable Long id) {
        return ApiResponse.ok(categoryService.findById(id));
    }

    @PostMapping
    public ApiResponse<CategoryDTO> create(@RequestBody CategoryDTO dto) {
        return ApiResponse.ok("分类创建成功", categoryService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryDTO> update(@PathVariable Long id, @RequestBody CategoryDTO dto) {
        return ApiResponse.ok("分类更新成功", categoryService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        categoryService.delete(id);
        return ApiResponse.ok("分类删除成功", null);
    }
}
