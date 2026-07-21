package com.sort.manager.service;

import com.sort.manager.dto.CreateMemberRequest;
import com.sort.manager.dto.MemberDTO;
import com.sort.manager.entity.AppUser;
import com.sort.manager.entity.Household;
import com.sort.manager.entity.HouseholdMember;
import com.sort.manager.entity.HouseholdRole;
import com.sort.manager.repository.AppUserRepository;
import com.sort.manager.repository.HouseholdMemberRepository;
import com.sort.manager.repository.HouseholdRepository;
import com.sort.manager.security.CurrentHousehold;
import com.sort.manager.security.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final HouseholdMemberRepository memberRepository;
    private final HouseholdRepository householdRepository;
    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final CurrentHousehold currentHousehold;

    @Transactional(readOnly = true)
    public List<MemberDTO> findAll() {
        return memberRepository.findAllByHouseholdIdWithUser(currentHousehold.requireHouseholdId())
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public MemberDTO create(CreateMemberRequest request) {
        String username = request.username().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("用户名已存在");
        }
        Household household = householdRepository.findById(currentHousehold.requireHouseholdId())
                .orElseThrow(() -> new NoSuchElementException("家庭不存在"));

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setDisplayName(request.displayName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEnabled(true);
        userRepository.save(user);

        HouseholdMember member = new HouseholdMember();
        member.setHousehold(household);
        member.setUser(user);
        member.setRole(request.role());
        return toDTO(memberRepository.save(member));
    }

    @Transactional
    public MemberDTO setEnabled(Long memberId, boolean enabled) {
        Long householdId = currentHousehold.requireHouseholdId();
        HouseholdMember member = memberRepository.findByIdAndHouseholdId(memberId, householdId)
                .orElseThrow(() -> new NoSuchElementException("家庭成员不存在"));
        if (!enabled && member.getUser().getId().equals(currentHousehold.requireUserId())) {
            throw new IllegalArgumentException("不能停用当前登录账号");
        }
        if (!enabled && member.getRole() == HouseholdRole.OWNER
                && memberRepository.countByHouseholdIdAndRoleAndUserEnabledTrue(householdId, HouseholdRole.OWNER) <= 1) {
            throw new IllegalArgumentException("家庭至少需要一名启用的管理员");
        }
        member.getUser().setEnabled(enabled);
        if (!enabled) {
            refreshTokenService.revokeAllForUser(member.getUser().getId());
        }
        return toDTO(member);
    }

    private MemberDTO toDTO(HouseholdMember member) {
        return new MemberDTO(
                member.getId(),
                member.getUser().getId(),
                member.getUser().getUsername(),
                member.getUser().getDisplayName(),
                member.getRole().name(),
                member.getUser().isEnabled(),
                member.getCreatedAt() == null ? null : member.getCreatedAt().toString());
    }
}
