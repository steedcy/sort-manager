package com.sort.manager.dto;

public record AuditEventDTO(
        Long id,
        String action,
        String entityType,
        Long entityId,
        String entityName,
        String summary,
        Long actorUserId,
        String actorDisplayName,
        String createdAt) {
}
