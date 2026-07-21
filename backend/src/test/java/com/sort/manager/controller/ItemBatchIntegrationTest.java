package com.sort.manager.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sort.manager.entity.Category;
import com.sort.manager.entity.Household;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.HouseholdRepository;
import com.sort.manager.repository.ItemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ItemBatchIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired HouseholdRepository householdRepository;
    @Autowired CategoryRepository categoryRepository;
    @Autowired ItemRepository itemRepository;

    @Test
    void rejectsUnauthenticatedAndFailOpenRequests() throws Exception {
        mockMvc.perform(post("/api/v1/items/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"validateOnly":true,"items":[{"name":"Battery"}]}
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/items/batch")
                        .header("Authorization", "Bearer " + login())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"items":[{"name":"Battery"}]}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void mixedAndCrossHouseholdRowsProduceNoPartialWrites() throws Exception {
        Household current = householdRepository.findAll().get(0);
        Household other = new Household();
        other.setName("Other household");
        other = householdRepository.saveAndFlush(other);
        Category foreignCategory = new Category();
        foreignCategory.setHouseholdId(other.getId());
        foreignCategory.setName("Foreign category");
        foreignCategory = categoryRepository.saveAndFlush(foreignCategory);
        long before = itemRepository.countByHouseholdId(current.getId());

        mockMvc.perform(post("/api/v1/items/batch")
                        .header("Authorization", "Bearer " + login())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"validateOnly":false,"items":[
                                  {"name":"Valid row","quantity":1,"price":1.00,"purchaseDate":"2026-07-21"},
                                  {"name":"Foreign row","quantity":1,"price":1.00,"purchaseDate":"2026-07-21","categoryId":%d}
                                ]}
                                """.formatted(foreignCategory.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.validCount").value(1))
                .andExpect(jsonPath("$.data.createdCount").value(0))
                .andExpect(jsonPath("$.data.rows[1].fieldErrors.categoryId").exists());

        assertThat(itemRepository.countByHouseholdId(current.getId())).isEqualTo(before);
    }

    private String login() throws Exception {
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
