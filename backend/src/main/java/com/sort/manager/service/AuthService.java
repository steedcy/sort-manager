package com.sort.manager.service;

import com.sort.manager.dto.AuthResponse;
import com.sort.manager.dto.AuthUserDTO;
import com.sort.manager.dto.LoginRequest;
import com.sort.manager.entity.HouseholdMember;
import com.sort.manager.repository.HouseholdMemberRepository;
import com.sort.manager.security.AuthenticationFailedException;
import com.sort.manager.security.CurrentHousehold;
import com.sort.manager.security.JwtService;
import com.sort.manager.security.LoginAttemptService;
import com.sort.manager.security.RateLimitExceededException;
import com.sort.manager.security.RefreshTokenService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final HouseholdMemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final LoginAttemptService loginAttemptService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final CurrentHousehold currentHousehold;
    private final String dummyPasswordHash;

    public AuthService(HouseholdMemberRepository memberRepository,
                       PasswordEncoder passwordEncoder,
                       LoginAttemptService loginAttemptService,
                       JwtService jwtService,
                       RefreshTokenService refreshTokenService,
                       CurrentHousehold currentHousehold) {
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
        this.loginAttemptService = loginAttemptService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.currentHousehold = currentHousehold;
        this.dummyPasswordHash = passwordEncoder.encode("sort-manager-dummy-password");
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String remoteAddress) {
        String username = normalizeUsername(request.username());
        if (loginAttemptService.isBlocked(username, remoteAddress)) {
            throw new RateLimitExceededException("登录失败次数过多，请稍后重试");
        }

        HouseholdMember member = memberRepository.findForLogin(username).orElse(null);
        String passwordHash = member == null ? dummyPasswordHash : member.getUser().getPasswordHash();
        boolean passwordMatches = passwordEncoder.matches(request.password(), passwordHash);
        if (member == null || !member.getUser().isEnabled() || !passwordMatches) {
            loginAttemptService.recordFailure(username, remoteAddress);
            throw new AuthenticationFailedException("用户名或密码错误");
        }

        loginAttemptService.recordSuccess(username, remoteAddress);
        return createSession(member, refreshTokenService.issue(member.getUser(), member.getHousehold()).rawToken());
    }

    public AuthResponse refresh(String rawToken) {
        RefreshTokenService.RotatedRefreshToken rotated = refreshTokenService.rotate(rawToken);
        return createSession(rotated.member(), rotated.rawToken());
    }

    @Transactional
    public void logout(String rawToken) {
        refreshTokenService.revoke(rawToken);
    }

    @Transactional(readOnly = true)
    public AuthUserDTO me() {
        HouseholdMember member = memberRepository.findByUserIdWithDetails(currentHousehold.requireUserId())
                .filter(value -> value.getHousehold().getId().equals(currentHousehold.requireHouseholdId()))
                .orElseThrow(() -> new AuthenticationFailedException("当前会话已失效"));
        return toUser(member);
    }

    private AuthResponse createSession(HouseholdMember member, String refreshToken) {
        return new AuthResponse(
                jwtService.issueAccessToken(member),
                refreshToken,
                jwtService.getAccessTtlSeconds(),
                toUser(member));
    }

    private AuthUserDTO toUser(HouseholdMember member) {
        return new AuthUserDTO(
                member.getUser().getId(),
                member.getUser().getUsername(),
                member.getUser().getDisplayName(),
                member.getHousehold().getId(),
                member.getHousehold().getName(),
                member.getRole().name());
    }

    private String normalizeUsername(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
