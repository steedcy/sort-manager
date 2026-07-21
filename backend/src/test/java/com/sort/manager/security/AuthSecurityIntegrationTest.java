package com.sort.manager.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sort.manager.entity.AppUser;
import com.sort.manager.entity.Household;
import com.sort.manager.entity.HouseholdMember;
import com.sort.manager.entity.HouseholdRole;
import com.sort.manager.repository.AppUserRepository;
import com.sort.manager.repository.HouseholdMemberRepository;
import com.sort.manager.repository.HouseholdRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthSecurityIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    JwtService jwtService;

    @Autowired
    AppUserRepository userRepository;

    @Autowired
    HouseholdRepository householdRepository;

    @Autowired
    HouseholdMemberRepository memberRepository;

    @Test
    void healthIsPublicAndBusinessApisRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("UP"));

        mockMvc.perform(get("/api/v1/items"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void memberRoleCannotUseOwnerMemberManagement() throws Exception {
        HouseholdMember member = persistMember("member-test", HouseholdRole.MEMBER, true);
        String token = jwtService.issueAccessToken(member);

        mockMvc.perform(get("/api/v1/members").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void disablingUserImmediatelyInvalidatesExistingAccessToken() throws Exception {
        HouseholdMember member = persistMember("disabled-token-test", HouseholdRole.MEMBER, true);
        String token = jwtService.issueAccessToken(member);
        member.getUser().setEnabled(false);
        userRepository.saveAndFlush(member.getUser());

        mockMvc.perform(get("/api/v1/items").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void refreshTokenIsSingleUse() throws Exception {
        String loginJson = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"test-owner","password":"Test-password-2026!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn().getResponse().getContentAsString();
        String originalRefresh = objectMapper.readTree(loginJson).path("data").path("refreshToken").asText();

        String refreshBody = objectMapper.writeValueAsString(java.util.Map.of("refreshToken", originalRefresh));
        String refreshedJson = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refreshBody))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode refreshed = objectMapper.readTree(refreshedJson);
        String replacementRefresh = refreshed.path("data").path("refreshToken").asText();
        org.assertj.core.api.Assertions.assertThat(replacementRefresh)
                .isNotBlank().isNotEqualTo(originalRefresh);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(refreshBody))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("refreshToken", replacementRefresh))))
                .andExpect(status().isUnauthorized());
    }

    private HouseholdMember persistMember(String username, HouseholdRole role, boolean enabled) {
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPasswordHash("unused-test-hash");
        user.setDisplayName("Test Member");
        user.setEnabled(enabled);
        userRepository.saveAndFlush(user);
        Household household = householdRepository.findAll().get(0);
        HouseholdMember member = new HouseholdMember();
        member.setUser(user);
        member.setHousehold(household);
        member.setRole(role);
        return memberRepository.saveAndFlush(member);
    }
}
