package com.sort.manager.controller;

import com.sort.manager.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FileUploadControllerTest {

    @TempDir
    Path tempDir;

    @Test
    void uploadRejectsEmptyFiles() {
        FileUploadController controller = controller();
        MockMultipartFile file = new MockMultipartFile("file", "empty.png", "image/png", new byte[0]);

        ApiResponse<Map<String, String>> response = controller.upload(file);

        assertFalse(response.isSuccess());
    }

    @Test
    void uploadRejectsNonImageContentTypes() {
        FileUploadController controller = controller();
        MockMultipartFile file = new MockMultipartFile("file", "note.txt", "text/plain", "hello".getBytes());

        ApiResponse<Map<String, String>> response = controller.upload(file);

        assertFalse(response.isSuccess());
    }

    @Test
    void uploadAcceptsPngImages() {
        FileUploadController controller = controller();
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", new byte[] {1, 2, 3});

        ApiResponse<Map<String, String>> response = controller.upload(file);

        assertTrue(response.isSuccess());
        assertTrue(response.getData().get("filename").endsWith(".png"));
        assertTrue(response.getData().get("url").startsWith("/uploads/"));
    }

    @Test
    void uploadNormalizesPathWithoutTrailingSeparator() {
        FileUploadController controller = new FileUploadController();
        ReflectionTestUtils.setField(controller, "uploadPath", tempDir.toString());
        ReflectionTestUtils.setField(controller, "urlPrefix", "/uploads/");
        MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", new byte[] {1, 2, 3});

        ApiResponse<Map<String, String>> response = controller.upload(file);

        assertTrue(response.isSuccess());
        assertTrue(tempDir.resolve(response.getData().get("filename")).toFile().exists());
    }

    private FileUploadController controller() {
        FileUploadController controller = new FileUploadController();
        ReflectionTestUtils.setField(controller, "uploadPath", tempDir.toString() + "\\");
        ReflectionTestUtils.setField(controller, "urlPrefix", "/uploads/");
        return controller;
    }
}
