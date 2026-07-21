package com.sort.manager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sort.manager.repository.HouseholdRepository;
import com.sort.manager.repository.ItemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ItemBatchRollbackIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired HouseholdRepository householdRepository;
    @Autowired ItemRepository itemRepository;

    @Test
    void databaseFailureAfterAnEarlierInsertRollsBackTheWholeBatch() throws Exception {
        Long householdId = householdRepository.findAll().get(0).getId();
        long before = itemRepository.countByHouseholdId(householdId);
        jdbcTemplate.execute("ALTER TABLE item ADD CONSTRAINT batch_rollback_guard CHECK (name <> 'ROLLBACK_FAIL')");
        try {
            mockMvc.perform(post("/api/v1/items/batch")
                            .header("Authorization", "Bearer " + login())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"validateOnly":false,"items":[
                                      {"name":"ROLLBACK_FIRST","quantity":1,"price":1.00,"purchaseDate":"2026-07-21"},
                                      {"name":"ROLLBACK_FAIL","quantity":1,"price":1.00,"purchaseDate":"2026-07-21"}
                                    ]}
                                    """))
                    .andExpect(status().is5xxServerError());

            assertThat(itemRepository.countByHouseholdId(householdId)).isEqualTo(before);
        } finally {
            jdbcTemplate.execute("ALTER TABLE item DROP CONSTRAINT batch_rollback_guard");
        }
    }

    private String login() throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"test-owner","password":"Test-password-2026!"}
                                """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).path("data").path("accessToken").asText();
    }
}
