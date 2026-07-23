package com.sort.manager.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import com.sort.manager.entity.AppUser;
import com.sort.manager.entity.Category;
import com.sort.manager.entity.Household;
import com.sort.manager.entity.HouseholdMember;
import com.sort.manager.entity.HouseholdRole;
import com.sort.manager.entity.Item;
import com.sort.manager.entity.Location;
import com.sort.manager.repository.AppUserRepository;
import com.sort.manager.repository.AuditEventRepository;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.HouseholdMemberRepository;
import com.sort.manager.repository.HouseholdRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OperationsDataProtectionIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired ItemRepository items;
    @Autowired HouseholdRepository households;
    @Autowired HouseholdMemberRepository members;
    @Autowired AppUserRepository users;
    @Autowired AuditEventRepository audits;
    @Autowired CategoryRepository categories;
    @Autowired LocationRepository locations;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired EntityManager entityManager;

    @Test
    void softDeleteIsHiddenThenRestorableAndAuditIsCommitted() throws Exception {
        Household household = households.findAll().get(0);
        Item item = saveItem(household.getId(), "Protected item");
        String token = ownerToken();

        mockMvc.perform(delete("/api/v1/items/{id}", item.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/items/{id}", item.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/operations/recycle-bin")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].id").value(item.getId()))
                .andExpect(jsonPath("$.data.content[0].name").value("Protected item"));

        mockMvc.perform(post("/api/v1/operations/recycle-bin/{id}/restore", item.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/items/{id}", item.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        assertThat(audits.searchByHouseholdId(household.getId(), null,
                org.springframework.data.domain.PageRequest.of(0, 20)).getContent())
                .extracting(value -> value.getAction())
                .contains("ITEM_DELETED", "ITEM_RESTORED");
    }

    @Test
    void recycleBinIsHouseholdScopedAndPermanentDeleteRequiresOwner() throws Exception {
        Household current = households.findAll().get(0);
        Household other = new Household();
        other.setName("Other household");
        other = households.saveAndFlush(other);
        Item foreign = saveItem(other.getId(), "Foreign deleted item");
        foreign.setDeletedAt(LocalDateTime.now());
        items.saveAndFlush(foreign);
        Item own = saveItem(current.getId(), "Own deleted item");
        own.setDeletedAt(LocalDateTime.now());
        items.saveAndFlush(own);

        String memberToken = jwtService.issueAccessToken(persistMember(current, "ops-member", HouseholdRole.MEMBER));
        mockMvc.perform(delete("/api/v1/operations/recycle-bin/{id}", own.getId())
                        .header("Authorization", "Bearer " + memberToken))
                .andExpect(status().isForbidden());

        String ownerToken = ownerToken();
        mockMvc.perform(get("/api/v1/operations/recycle-bin")
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].id").value(own.getId()));

        mockMvc.perform(delete("/api/v1/operations/recycle-bin/{id}", own.getId())
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk());
        assertThat(items.findById(own.getId())).isEmpty();
        assertThat(items.findById(foreign.getId())).isPresent();
    }

    @Test
    void ownerSessionRevocationImmediatelyInvalidatesExistingRefreshToken() throws Exception {
        Household household = households.findAll().get(0);
        HouseholdMember member = persistMember(household, "session-revoke-member", HouseholdRole.MEMBER);
        member.getUser().setPasswordHash(passwordEncoder.encode("Member-password-2026!"));
        users.saveAndFlush(member.getUser());

        String loginJson = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"session-revoke-member","password":"Member-password-2026!"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String refreshToken = objectMapper.readTree(loginJson).path("data").path("refreshToken").asText();

        mockMvc.perform(post("/api/v1/members/{id}/revoke-sessions", member.getId())
                        .header("Authorization", "Bearer " + ownerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.revokedCount").value(1));
        // MockMvc calls share this test transaction; clear bulk-update stale entities to
        // model the separate persistence context used by the next real HTTP request.
        entityManager.clear();

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("refreshToken", refreshToken))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void referenceAggregatesDoNotCountCrossHouseholdDirtyData() {
        Household current = households.findAll().get(0);
        Household other = new Household();
        other.setName("Aggregate isolation household");
        other = households.saveAndFlush(other);

        Category category = new Category();
        category.setHouseholdId(current.getId());
        category.setName("Protected category");
        category = categories.saveAndFlush(category);
        Location location = new Location();
        location.setHouseholdId(current.getId());
        location.setName("Protected location");
        location = locations.saveAndFlush(location);

        Item dirty = saveItem(other.getId(), "Cross household dirty item");
        dirty.setCategory(category);
        dirty.setLocation(location);
        items.saveAndFlush(dirty);
        Item active = saveItem(current.getId(), "Current active item");
        active.setCategory(category);
        active.setLocation(location);
        items.saveAndFlush(active);
        Item deleted = saveItem(current.getId(), "Current deleted item");
        deleted.setCategory(category);
        deleted.setLocation(location);
        deleted.setDeletedAt(LocalDateTime.now());
        items.saveAndFlush(deleted);
        Long categoryId = category.getId();
        Long locationId = location.getId();

        assertThat(categories.findAllWithActiveItemCounts(current.getId()))
                .filteredOn(value -> value.getId().equals(categoryId))
                .singleElement()
                .extracting(value -> value.getItemCount())
                .isEqualTo(1L);
        assertThat(locations.findAllWithActiveItemCounts(current.getId()))
                .filteredOn(value -> value.getId().equals(locationId))
                .singleElement()
                .extracting(value -> value.getItemCount())
                .isEqualTo(1L);
    }

    private Item saveItem(Long householdId, String name) {
        Item item = new Item();
        item.setHouseholdId(householdId);
        item.setName(name);
        item.setQuantity(1);
        item.setPrice(BigDecimal.ONE);
        item.setPurchaseDate(LocalDate.now());
        return items.saveAndFlush(item);
    }

    private HouseholdMember persistMember(Household household, String username, HouseholdRole role) {
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPasswordHash("unused-test-hash");
        user.setDisplayName("Operations Member");
        user.setEnabled(true);
        users.saveAndFlush(user);
        HouseholdMember member = new HouseholdMember();
        member.setHousehold(household);
        member.setUser(user);
        member.setRole(role);
        return members.saveAndFlush(member);
    }

    private String ownerToken() throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"test-owner","password":"Test-password-2026!"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(response);
        return json.path("data").path("accessToken").asText();
    }
}
