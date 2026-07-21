package com.sort.manager.security;

import com.sort.manager.entity.AppUser;
import com.sort.manager.entity.Household;
import com.sort.manager.entity.HouseholdMember;
import com.sort.manager.entity.RefreshToken;
import com.sort.manager.repository.HouseholdMemberRepository;
import com.sort.manager.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository tokenRepository;
    private final HouseholdMemberRepository memberRepository;
    private final Clock clock;
    private final long refreshTtlDays;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository tokenRepository,
                               HouseholdMemberRepository memberRepository,
                               Clock clock,
                               @Value("${app.auth.refresh-ttl-days:30}") long refreshTtlDays) {
        this.tokenRepository = tokenRepository;
        this.memberRepository = memberRepository;
        this.clock = clock;
        this.refreshTtlDays = refreshTtlDays;
    }

    @Transactional
    public IssuedRefreshToken issue(AppUser user, Household household) {
        return issue(user, household, UUID.randomUUID().toString());
    }

    @Transactional(noRollbackFor = AuthenticationFailedException.class)
    public RotatedRefreshToken rotate(String rawToken) {
        Instant now = clock.instant();
        RefreshToken current = tokenRepository.findByTokenHashForUpdate(hash(rawToken))
                .orElseThrow(() -> invalidToken());

        if (current.getRevokedAt() != null) {
            tokenRepository.revokeFamily(current.getTokenFamily(), now);
            throw new AuthenticationFailedException("刷新令牌已失效，请重新登录");
        }
        if (!current.getExpiresAt().isAfter(now) || !current.getUser().isEnabled()) {
            current.setRevokedAt(now);
            throw invalidToken();
        }

        HouseholdMember member = memberRepository.findByUserIdWithDetails(current.getUser().getId())
                .filter(value -> value.getHousehold().getId().equals(current.getHousehold().getId()))
                .orElseThrow(this::invalidToken);
        IssuedRefreshToken replacement = issue(current.getUser(), current.getHousehold(), current.getTokenFamily());
        current.setRevokedAt(now);
        current.setReplacedBy(replacement.entity());
        tokenRepository.save(current);
        return new RotatedRefreshToken(replacement.rawToken(), member);
    }

    @Transactional
    public void revoke(String rawToken, Long userId) {
        tokenRepository.findByTokenHashForUpdate(hash(rawToken))
                .filter(token -> token.getUser().getId().equals(userId))
                .filter(token -> token.getRevokedAt() == null)
                .ifPresent(token -> token.setRevokedAt(clock.instant()));
    }

    @Transactional
    public void revokeAllForUser(Long userId) {
        tokenRepository.revokeAllForUser(userId, clock.instant());
    }

    private IssuedRefreshToken issue(AppUser user, Household household, String family) {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        RefreshToken entity = new RefreshToken();
        entity.setTokenHash(hash(rawToken));
        entity.setTokenFamily(family);
        entity.setUser(user);
        entity.setHousehold(household);
        entity.setExpiresAt(clock.instant().plus(refreshTtlDays, ChronoUnit.DAYS));
        return new IssuedRefreshToken(rawToken, tokenRepository.save(entity));
    }

    private AuthenticationFailedException invalidToken() {
        return new AuthenticationFailedException("刷新令牌无效或已过期，请重新登录");
    }

    static String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public record IssuedRefreshToken(String rawToken, RefreshToken entity) {
    }

    public record RotatedRefreshToken(String rawToken, HouseholdMember member) {
    }
}
