package com.sort.manager.security;

import com.sort.manager.entity.AppUser;
import com.sort.manager.entity.Household;
import com.sort.manager.entity.HouseholdMember;
import com.sort.manager.entity.HouseholdRole;
import com.sort.manager.entity.RefreshToken;
import com.sort.manager.repository.HouseholdMemberRepository;
import com.sort.manager.repository.RefreshTokenRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RefreshTokenServiceTest {

    private final Instant now = Instant.parse("2026-07-21T00:00:00Z");

    @Test
    void rotatesRefreshTokenAndRevokesOriginal() {
        RefreshTokenRepository tokens = mock(RefreshTokenRepository.class);
        HouseholdMemberRepository members = mock(HouseholdMemberRepository.class);
        HouseholdMember member = member();
        RefreshToken original = token(member, null);
        when(tokens.findByTokenHashForUpdate(RefreshTokenService.hash("old-token"))).thenReturn(Optional.of(original));
        when(members.findByUserIdWithDetails(7L)).thenReturn(Optional.of(member));
        when(tokens.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RefreshTokenService service = service(tokens, members);
        RefreshTokenService.RotatedRefreshToken result = service.rotate("old-token");

        assertThat(result.rawToken()).isNotBlank().isNotEqualTo("old-token");
        assertThat(original.getRevokedAt()).isEqualTo(now);
        assertThat(original.getReplacedBy()).isNotNull();
        assertThat(original.getReplacedBy().getTokenHash()).doesNotContain(result.rawToken());
    }

    @Test
    void replayRevokesWholeTokenFamily() {
        RefreshTokenRepository tokens = mock(RefreshTokenRepository.class);
        HouseholdMemberRepository members = mock(HouseholdMemberRepository.class);
        RefreshToken replayed = token(member(), now.minusSeconds(1));
        when(tokens.findByTokenHashForUpdate(RefreshTokenService.hash("replayed"))).thenReturn(Optional.of(replayed));

        assertThatThrownBy(() -> service(tokens, members).rotate("replayed"))
                .isInstanceOf(AuthenticationFailedException.class);
        verify(tokens).revokeFamily("family-1", now);
    }

    private RefreshTokenService service(RefreshTokenRepository tokens, HouseholdMemberRepository members) {
        return new RefreshTokenService(tokens, members, Clock.fixed(now, ZoneOffset.UTC), 30);
    }

    private HouseholdMember member() {
        AppUser user = new AppUser();
        user.setId(7L);
        user.setUsername("owner");
        user.setEnabled(true);
        Household household = new Household();
        household.setId(3L);
        HouseholdMember member = new HouseholdMember();
        member.setUser(user);
        member.setHousehold(household);
        member.setRole(HouseholdRole.OWNER);
        return member;
    }

    private RefreshToken token(HouseholdMember member, Instant revokedAt) {
        RefreshToken token = new RefreshToken();
        token.setTokenFamily("family-1");
        token.setUser(member.getUser());
        token.setHousehold(member.getHousehold());
        token.setExpiresAt(now.plusSeconds(3600));
        token.setRevokedAt(revokedAt);
        return token;
    }
}
