package com.sort.manager.controller;

import com.sort.manager.dto.ApiResponse;
import com.sort.manager.dto.LocationDTO;
import com.sort.manager.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public ApiResponse<List<LocationDTO>> getAll() {
        return ApiResponse.ok(locationService.findAll());
    }

    @GetMapping("/tree")
    public ApiResponse<List<LocationDTO>> getTree() {
        return ApiResponse.ok(locationService.findTree());
    }

    @GetMapping("/{id}")
    public ApiResponse<LocationDTO> getById(@PathVariable Long id) {
        return ApiResponse.ok(locationService.findById(id));
    }

    @PostMapping
    public ApiResponse<LocationDTO> create(@RequestBody LocationDTO dto) {
        return ApiResponse.ok("位置创建成功", locationService.create(dto));
    }

    @PutMapping("/{id}")
    public ApiResponse<LocationDTO> update(@PathVariable Long id, @RequestBody LocationDTO dto) {
        return ApiResponse.ok("位置更新成功", locationService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        locationService.delete(id);
        return ApiResponse.ok("位置删除成功", null);
    }
}
