package com.sort.manager.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sort.manager.dto.ItemBatchResponse;
import com.sort.manager.service.ItemBatchService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ItemBatchControllerTest {

    @Test
    void exposesBatchEndpointAndReturnsServiceResult() throws Exception {
        ItemBatchService batchService = mock(ItemBatchService.class);
        ItemBatchResponse result = new ItemBatchResponse(1, 1, 0, List.of(), List.of());
        when(batchService.process(argThat(request -> Boolean.TRUE.equals(request.getValidateOnly())
                && request.getItems().size() == 1))).thenReturn(result);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new ItemController(mock(com.sort.manager.service.ItemService.class), batchService, mock(com.sort.manager.service.IsbnBookService.class)))
                .build();

        mvc.perform(post("/api/v1/items/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"validateOnly":true,"items":[{"name":"Battery","quantity":1}]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalCount").value(1))
                .andExpect(jsonPath("$.data.createdCount").value(0));
    }

    @Test
    void rejectsRequestsThatOmitValidateOnly() throws Exception {
        ItemBatchService batchService = mock(ItemBatchService.class);
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new ItemController(mock(com.sort.manager.service.ItemService.class), batchService, mock(com.sort.manager.service.IsbnBookService.class)))
                .build();

        mvc.perform(post("/api/v1/items/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"items":[{"name":"Battery","quantity":1}]}
                                """))
                .andExpect(status().isBadRequest());
    }
}
