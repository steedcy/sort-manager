package com.sort.manager.dto;

public record BackupStatusDTO(
        String status,
        String lastSuccessAt,
        String lastVerifiedAt,
        Long ageHours,
        Long backupSizeBytes
) {
    public static BackupStatusDTO unavailable(String status) {
        return new BackupStatusDTO(status, null, null, null, null);
    }
}
