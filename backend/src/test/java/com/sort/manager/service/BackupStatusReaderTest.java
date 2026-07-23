package com.sort.manager.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sort.manager.dto.BackupStatusDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class BackupStatusReaderTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-07-21T04:00:00Z"), ZoneOffset.UTC);

    @TempDir
    Path tempDir;

    @Test
    void reportsNotConfiguredWithoutReadingArbitraryFiles() {
        BackupStatusDTO status = new BackupStatusReader(new ObjectMapper(), CLOCK, "", 48).read();

        assertThat(status.status()).isEqualTo("NOT_CONFIGURED");
        assertThat(status.lastSuccessAt()).isNull();
    }

    @Test
    void rejectsOversizedOrMalformedStatusFiles() throws Exception {
        Path oversized = tempDir.resolve("oversized.json");
        Files.writeString(oversized, "x".repeat(70_000));
        assertThat(new BackupStatusReader(new ObjectMapper(), CLOCK, oversized.toString(), 48).read().status())
                .isEqualTo("INVALID");

        Path malformed = tempDir.resolve("malformed.json");
        Files.writeString(malformed, "{not-json}");
        assertThat(new BackupStatusReader(new ObjectMapper(), CLOCK, malformed.toString(), 48).read().status())
                .isEqualTo("INVALID");

        Path futureVerification = tempDir.resolve("future-verification.json");
        Files.writeString(futureVerification, """
                {"lastSuccessAt":"2026-07-21T03:00:00Z","lastVerifiedAt":"2026-07-22T04:00:00Z","backupSizeBytes":4096}
                """);
        assertThat(new BackupStatusReader(new ObjectMapper(), CLOCK, futureVerification.toString(), 48).read().status())
                .isEqualTo("INVALID");
    }

    @Test
    void distinguishesHealthyUnverifiedAndStaleBackups() throws Exception {
        Path statusFile = tempDir.resolve("status.json");
        Files.writeString(statusFile, """
                {"lastSuccessAt":"2026-07-20T16:00:00Z","lastVerifiedAt":"2026-07-20T18:00:00Z","backupSizeBytes":4096}
                """);
        BackupStatusDTO healthy = new BackupStatusReader(new ObjectMapper(), CLOCK, statusFile.toString(), 48).read();
        assertThat(healthy.status()).isEqualTo("HEALTHY");
        assertThat(healthy.ageHours()).isEqualTo(12);
        assertThat(healthy.backupSizeBytes()).isEqualTo(4096);

        Files.writeString(statusFile, """
                {"lastSuccessAt":"2026-07-20T16:00:00Z","backupSizeBytes":4096}
                """);
        assertThat(new BackupStatusReader(new ObjectMapper(), CLOCK, statusFile.toString(), 48).read().status())
                .isEqualTo("UNVERIFIED");

        Files.writeString(statusFile, """
                {"lastSuccessAt":"2026-07-18T00:00:00Z","lastVerifiedAt":"2026-07-18T01:00:00Z","backupSizeBytes":4096}
                """);
        assertThat(new BackupStatusReader(new ObjectMapper(), CLOCK, statusFile.toString(), 48).read().status())
                .isEqualTo("STALE");
    }
}
