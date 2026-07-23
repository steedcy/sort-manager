package com.sort.manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sort.manager.dto.BackupStatusDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

@Service
public class BackupStatusReader {

    private static final long MAX_STATUS_BYTES = 65_536;

    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final String statusPath;
    private final long staleAfterHours;

    public BackupStatusReader(ObjectMapper objectMapper,
                              Clock clock,
                              @Value("${app.backup.status-path:}") String statusPath,
                              @Value("${app.backup.stale-after-hours:48}") long staleAfterHours) {
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.statusPath = statusPath == null ? "" : statusPath.trim();
        this.staleAfterHours = Math.max(1, staleAfterHours);
    }

    public BackupStatusDTO read() {
        if (statusPath.isEmpty()) {
            return BackupStatusDTO.unavailable("NOT_CONFIGURED");
        }
        try {
            Path path = Path.of(statusPath).toAbsolutePath().normalize();
            if (!Files.isRegularFile(path)) {
                return BackupStatusDTO.unavailable("MISSING");
            }
            long size = Files.size(path);
            if (size < 2 || size > MAX_STATUS_BYTES) {
                return BackupStatusDTO.unavailable("INVALID");
            }
            JsonNode root = objectMapper.readTree(Files.readString(path));
            Instant success = requiredInstant(root, "lastSuccessAt");
            Instant verified = optionalInstant(root, "lastVerifiedAt");
            long backupSize = root.path("backupSizeBytes").asLong(-1);
            if (backupSize < 0 || success.isAfter(clock.instant())
                    || (verified != null && verified.isAfter(clock.instant()))) {
                return BackupStatusDTO.unavailable("INVALID");
            }

            long ageHours = Math.max(0, Duration.between(success, clock.instant()).toHours());
            String status;
            if (ageHours > staleAfterHours) {
                status = "STALE";
            } else if (verified == null || verified.isBefore(success)) {
                status = "UNVERIFIED";
            } else {
                status = "HEALTHY";
            }
            return new BackupStatusDTO(
                    status,
                    success.toString(),
                    verified == null ? null : verified.toString(),
                    ageHours,
                    backupSize);
        } catch (Exception ignored) {
            return BackupStatusDTO.unavailable("INVALID");
        }
    }

    private Instant requiredInstant(JsonNode root, String field) {
        if (!root.hasNonNull(field) || root.path(field).asText().isBlank()) {
            throw new IllegalArgumentException("Missing backup status timestamp");
        }
        return Instant.parse(root.path(field).asText());
    }

    private Instant optionalInstant(JsonNode root, String field) {
        if (!root.hasNonNull(field) || root.path(field).asText().isBlank()) {
            return null;
        }
        return Instant.parse(root.path(field).asText());
    }
}
