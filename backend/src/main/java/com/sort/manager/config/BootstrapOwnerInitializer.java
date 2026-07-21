package com.sort.manager.config;

import com.sort.manager.entity.AppUser;
import com.sort.manager.entity.Household;
import com.sort.manager.entity.HouseholdMember;
import com.sort.manager.entity.HouseholdRole;
import com.sort.manager.repository.AppUserRepository;
import com.sort.manager.repository.HouseholdMemberRepository;
import com.sort.manager.repository.HouseholdRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class BootstrapOwnerInitializer implements ApplicationRunner {

    private final AppUserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdMemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.username:}")
    private String username;
    @Value("${app.bootstrap.password:}")
    private String password;
    @Value("${app.bootstrap.display-name:家庭管理员}")
    private String displayName;
    @Value("${app.bootstrap.household-name:我的家庭}")
    private String householdName;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            return;
        }
        if (username == null || username.isBlank() || password == null || password.length() < 10) {
            throw new IllegalStateException(
                    "APP_BOOTSTRAP_USERNAME and APP_BOOTSTRAP_PASSWORD (at least 10 characters) are required for first startup");
        }

        Household household = householdRepository.findById(1L).orElseGet(Household::new);
        household.setName(householdName.trim());
        householdRepository.save(household);

        AppUser owner = new AppUser();
        owner.setUsername(username.trim().toLowerCase(Locale.ROOT));
        owner.setDisplayName(displayName.trim());
        owner.setPasswordHash(passwordEncoder.encode(password));
        owner.setEnabled(true);
        userRepository.save(owner);

        HouseholdMember member = new HouseholdMember();
        member.setHousehold(household);
        member.setUser(owner);
        member.setRole(HouseholdRole.OWNER);
        memberRepository.save(member);
    }
}
