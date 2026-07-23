package com.sort.manager.service;

import com.sort.manager.entity.AppUser;
import com.sort.manager.entity.HouseholdMember;
import com.sort.manager.entity.HouseholdRole;
import com.sort.manager.repository.AppUserRepository;
import com.sort.manager.repository.HouseholdMemberRepository;
import com.sort.manager.repository.HouseholdRepository;
import com.sort.manager.security.CurrentHousehold;
import com.sort.manager.security.RefreshTokenService;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MemberSessionRevokeServiceTest {

    @Test
    void ownerCanRevokeTargetMembersSessionsAndAuditIt() {
        HouseholdMemberRepository members = mock(HouseholdMemberRepository.class);
        RefreshTokenService tokens = mock(RefreshTokenService.class);
        CurrentHousehold current = mock(CurrentHousehold.class);
        AuditEventService audit = mock(AuditEventService.class);
        HouseholdMember member = new HouseholdMember();
        member.setId(3L);
        member.setRole(HouseholdRole.MEMBER);
        AppUser user = new AppUser();
        user.setId(12L);
        user.setDisplayName("Sam");
        member.setUser(user);
        when(current.requireHouseholdId()).thenReturn(42L);
        when(current.requireUserId()).thenReturn(9L);
        when(members.findByIdAndHouseholdId(3L, 42L)).thenReturn(Optional.of(member));
        when(tokens.revokeAllForUser(12L)).thenReturn(2);
        MemberService service = new MemberService(members, mock(HouseholdRepository.class),
                mock(AppUserRepository.class), mock(org.springframework.security.crypto.password.PasswordEncoder.class),
                tokens, current, audit);

        int revoked = service.revokeSessions(3L);

        assertThat(revoked).isEqualTo(2);
        verify(tokens).revokeAllForUser(12L);
        verify(audit).record(42L, 9L, "MEMBER_SESSIONS_REVOKED", "MEMBER", 3L, "Sam", "撤销 2 个活动会话");
    }
}
