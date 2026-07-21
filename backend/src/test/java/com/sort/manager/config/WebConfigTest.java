package com.sort.manager.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(WebConfigTest.TestController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(WebConfig.class)
@TestPropertySource(properties = {
        "app.upload.path=build/test-uploads/",
        "app.cors.allowed-origins=http://localhost:5173,http://127.0.0.1:5173"
})
class WebConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void allowsConfiguredOrigin() throws Exception {
        mockMvc.perform(options("/api/items")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void rejectsUnknownOrigin() throws Exception {
        mockMvc.perform(options("/api/items")
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @RestController
    @RequestMapping("/api/items")
    static class TestController {
        @GetMapping
        String get() {
            return "ok";
        }
    }
}
