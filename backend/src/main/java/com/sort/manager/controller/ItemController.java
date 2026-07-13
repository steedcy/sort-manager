package com.sort.manager.controller;

import com.sort.manager.dto.ApiResponse;
import com.sort.manager.dto.ItemDTO;
import com.sort.manager.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    public ApiResponse<List<ItemDTO>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long locationId) {
        return ApiResponse.ok(itemService.findAll(keyword, categoryId, locationId));
    }

    @GetMapping("/{id}")
    public ApiResponse<ItemDTO> getById(@PathVariable Long id) {
        return ApiResponse.ok(itemService.findById(id));
    }

    @PostMapping
    public ApiResponse<ItemDTO> create(@Valid @RequestBody ItemDTO dto) {
        return ApiResponse.ok("物品添加成功", itemService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<ItemDTO> update(@PathVariable Long id, @Valid @RequestBody ItemDTO dto) {
        return ApiResponse.ok("物品更新成功", itemService.update(id, dto));
    }

    @PutMapping("/{id}/move")
    public ApiResponse<ItemDTO> move(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long locationId = body.get("locationId");
        return ApiResponse.ok("物品移动成功", itemService.move(id, locationId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        itemService.delete(id);
        return ApiResponse.ok("物品删除成功", null);
    }
}
