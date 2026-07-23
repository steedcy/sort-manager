package com.sort.manager.controller;

import com.sort.manager.dto.ApiResponse;
import com.sort.manager.dto.AuditEventDTO;
import com.sort.manager.dto.ItemDTO;
import com.sort.manager.dto.PageResponse;
import com.sort.manager.dto.RecycleBinItemDTO;
import com.sort.manager.dto.OperationsSummaryDTO;
import com.sort.manager.service.AuditEventService;
import com.sort.manager.service.ItemService;
import com.sort.manager.service.OperationsSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/operations")
@RequiredArgsConstructor
public class OperationsController {

    private final ItemService itemService;
    private final AuditEventService auditEventService;
    private final OperationsSummaryService operationsSummaryService;

    @GetMapping("/summary")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<OperationsSummaryDTO> summary() {
        return ApiResponse.ok(operationsSummaryService.getSummary());
    }

    @GetMapping("/recycle-bin")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<PageResponse<RecycleBinItemDTO>> recycleBin(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(itemService.findRecycleBin(page, size));
    }

    @PostMapping("/recycle-bin/{id}/restore")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<ItemDTO> restore(@PathVariable Long id) {
        return ApiResponse.ok("Item restored", itemService.restore(id));
    }

    @DeleteMapping("/recycle-bin/{id}")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<Void> permanentDelete(@PathVariable Long id) {
        itemService.permanentDelete(id);
        return ApiResponse.ok("Item permanently deleted", null);
    }

    @GetMapping("/activity")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<PageResponse<AuditEventDTO>> activity(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ApiResponse.ok(auditEventService.search(action, page, size));
    }
}
