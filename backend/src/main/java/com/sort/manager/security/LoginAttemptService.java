package com.sort.manager.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class LoginAttemptService {

    private final Clock clock;
    private final int maxAttempts;
    private final long blockSeconds;
    private final int maxTrackedAttempts;
    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();
    private final AtomicInteger operations = new AtomicInteger();
    private volatile Instant saturatedUntil = Instant.EPOCH;

    @Autowired
    public LoginAttemptService(
            @Value("${app.auth.login-max-attempts:5}") int maxAttempts,
            @Value("${app.auth.login-block-seconds:600}") long blockSeconds,
            @Value("${app.auth.login-max-tracked-attempts:10000}") int maxTrackedAttempts) {
        this(Clock.systemUTC(), maxAttempts, blockSeconds, maxTrackedAttempts);
    }

    LoginAttemptService(Clock clock, int maxAttempts, long blockSeconds) {
        this(clock, maxAttempts, blockSeconds, 10_000);
    }

    LoginAttemptService(Clock clock, int maxAttempts, long blockSeconds, int maxTrackedAttempts) {
        this.clock = clock;
        this.maxAttempts = maxAttempts;
        this.blockSeconds = blockSeconds;
        this.maxTrackedAttempts = Math.max(100, maxTrackedAttempts);
    }

    public boolean isBlocked(String username, String remoteAddress) {
        Instant now = clock.instant();
        Attempt attempt = attempts.get(key(username, remoteAddress));
        if (attempt == null) {
            return saturatedUntil.isAfter(now);
        }
        if (!attempt.firstFailure.plusSeconds(blockSeconds).isAfter(now)) {
            attempts.remove(key(username, remoteAddress), attempt);
            return false;
        }
        return attempt.count >= maxAttempts;
    }

    public void recordFailure(String username, String remoteAddress) {
        String key = key(username, remoteAddress);
        Instant now = clock.instant();
        if ((operations.incrementAndGet() & 255) == 0 || attempts.size() >= maxTrackedAttempts) {
            attempts.entrySet().removeIf(entry ->
                    !entry.getValue().firstFailure.plusSeconds(blockSeconds).isAfter(now));
        }
        if (!attempts.containsKey(key) && attempts.size() >= maxTrackedAttempts) {
            saturatedUntil = now.plusSeconds(blockSeconds);
            return;
        }
        attempts.compute(key, (ignored, current) -> {
            if (current == null || !current.firstFailure.plusSeconds(blockSeconds).isAfter(now)) {
                return new Attempt(1, now);
            }
            return new Attempt(current.count + 1, current.firstFailure);
        });
    }

    public void recordSuccess(String username, String remoteAddress) {
        attempts.remove(key(username, remoteAddress));
    }

    int trackedAttemptCount() {
        return attempts.size();
    }

    private String key(String username, String remoteAddress) {
        String normalizedUser = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        String normalizedAddress = remoteAddress == null ? "unknown" : remoteAddress.trim();
        return normalizedUser + '|' + normalizedAddress;
    }

    private record Attempt(int count, Instant firstFailure) {
    }
}
