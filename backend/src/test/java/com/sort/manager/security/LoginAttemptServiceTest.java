package com.sort.manager.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class LoginAttemptServiceTest {

    @Test
    void blocksAfterFiveFailuresAndClearsOnSuccess() {
        LoginAttemptService service = new LoginAttemptService(
                Clock.fixed(Instant.parse("2026-07-21T00:00:00Z"), ZoneOffset.UTC), 5, 600);

        for (int index = 0; index < 5; index++) {
            service.recordFailure(" Owner ", "127.0.0.1");
        }

        assertThat(service.isBlocked("owner", "127.0.0.1")).isTrue();
        service.recordSuccess("OWNER", "127.0.0.1");
        assertThat(service.isBlocked("owner", "127.0.0.1")).isFalse();
    }

    @Test
    void boundsTrackedLoginKeys() {
        LoginAttemptService service = new LoginAttemptService(
                Clock.fixed(Instant.parse("2026-07-21T00:00:00Z"), ZoneOffset.UTC), 5, 600, 100);

        for (int index = 0; index < 500; index++) {
            service.recordFailure("user-" + index, "192.0.2." + index);
        }

        assertThat(service.trackedAttemptCount()).isLessThanOrEqualTo(100);
        for (int index = 0; index < 5; index++) {
            service.recordFailure("owner", "198.51.100.10");
        }
        assertThat(service.isBlocked("owner", "198.51.100.10")).isTrue();
    }
}
