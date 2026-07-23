package com.sort.manager.dto;

import java.util.List;

public record OperationsSummaryDTO(
        long activeMembers,
        long activeSessions,
        long recycleBinItems,
        long activityLast7Days,
        BackupStatusDTO latestBackup,
        List<AuditEventDTO> recentActivity) {
}
