package com.sort.manager.service;

import com.sort.manager.dto.AuthResponse;
import com.sort.manager.dto.LoginRequest;
import com.sort.manager.entity.AppUser;
import com.sort.manager.entity.Household;
import com.sort.manager.entity.HouseholdMember;
import com.sort.manager.entity.HouseholdRole;
import com.sort.manager.entity.RefreshToken;
import com.sort.manager.repository.HouseholdMemberRepository;
import com.sort.manager.security.AuthenticationFailedException;
import com.sort.manager.security.CurrentHousehold;
import com.sort.manager.security.JwtService;
import com.sort.manager.security.LoginAttemptService;
import com.sort.manager.security.RefreshTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    @Test
    void loginReturnsAccessRefreshAndFamilyContext() {
        Fixture fixture = new Fixture();
        HouseholdMember member = fixture.member(true);
        when(fixture.members.findForLogin("owner")).thenReturn(Optional.of(member));
        when(fixture.passwords.matches("correct-password", "hash")).thenReturn(true);
        when(fixture.jwt.issueAccessToken(member)).thenReturn("access-token");
        when(fixture.jwt.getAccessTtlSeconds()).thenReturn(900L);
        when(fixture.refresh.issue(member.getUser(), member.getHousehold()))
                .thenReturn(new RefreshTokenService.IssuedRefreshToken("refresh-token", new RefreshToken()));

        AuthResponse response = fixture.service.login(new LoginRequest(" Owner ", "correct-password"), "127.0.0.1");

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.user().householdId()).isEqualTo(3L);
        assertThat(response.user().role()).isEqualTo("OWNER");
        verify(fixture.attempts).recordSuccess("owner", "127.0.0.1");
    }

    @Test
    void loginUsesGenericFailureForDisabledUser() {
        Fixture fixture = new Fixture();
        when(fixture.members.findForLogin("owner")).thenReturn(Optional.of(fixture.member(false)));

        assertThatThrownBy(() -> fixture.service.login(new LoginRequest("owner", "secret-value"), "127.0.0.1"))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage("用户名或密码错误");
        verify(fixture.attempts).recordFailure("owner", "127.0.0.1");
    }

    private static class Fixture {
        final HouseholdMemberRepository members = mock(HouseholdMemberRepository.class);
        final PasswordEncoder passwords = mock(PasswordEncoder.class);
        final LoginAttemptService attempts = mock(LoginAttemptService.class);
        final JwtService jwt = mock(JwtService.class);
        final RefreshTokenService refresh = mock(RefreshTokenService.class);
        final CurrentHousehold current = mock(CurrentHousehold.class);
        final AuthService service = new AuthService(members, passwords, attempts, jwt, refresh, current);

        HouseholdMember member(boolean enabled) {
            AppUser user = new AppUser();
            user.setId(7L);
            user.setUsername("owner");
            user.setDisplayName("Owner");
            user.setPasswordHash("hash");
            user.setEnabled(enabled);
            Household household = new Household();
            household.setId(3L);
            household.setName("Home");
            HouseholdMember member = new HouseholdMember();
            member.setUser(user);
            member.setHousehold(household);
            member.setRole(HouseholdRole.OWNER);
            return member;
        }
    }
}
