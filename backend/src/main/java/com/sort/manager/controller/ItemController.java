package com.sort.manager.controller;

import com.sort.manager.dto.ApiResponse;
import com.sort.manager.dto.ItemBatchRequest;
import com.sort.manager.dto.ItemBatchResponse;
import com.sort.manager.dto.ItemDTO;
import com.sort.manager.dto.PageResponse;
import com.sort.manager.service.ItemBatchService;
import com.sort.manager.service.ItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final ItemBatchService itemBatchService;

    @GetMapping
    public ApiResponse<PageResponse<ItemDTO>> getAll(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String direction) {
        return ApiResponse.ok(itemService.search(keyword, categoryId, locationId, status, page, size, sort, direction));
    }

    @GetMapping("/{id}")
    public ApiResponse<ItemDTO> getById(@PathVariable Long id) {
        return ApiResponse.ok(itemService.findById(id));
    }

    @PostMapping
    public ApiResponse<ItemDTO> create(@Valid @RequestBody ItemDTO dto) {
        return ApiResponse.ok("物品添加成功", itemService.create(dto));
    }

    @PostMapping("/batch")
    public ApiResponse<ItemBatchResponse> batch(@Valid @RequestBody ItemBatchRequest request) {
        return ApiResponse.ok(itemBatchService.process(request));
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
