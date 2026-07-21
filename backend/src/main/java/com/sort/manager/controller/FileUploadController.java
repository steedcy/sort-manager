package com.sort.manager.controller;

import com.sort.manager.dto.ApiResponse;
import com.sort.manager.security.CurrentHousehold;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FileUploadController {

    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);

    private static final Pattern SAFE_FILENAME = Pattern.compile(
            "^[0-9a-fA-F-]{36}\\.(?:jpg|jpeg|png|gif|webp)$");

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp"
    );

    @Value("${app.upload.path}")
    private String uploadPath;

    private final CurrentHousehold currentHousehold;

    @PostMapping("/upload")
    public ApiResponse<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ApiResponse.fail("File cannot be empty");
        }

        String originalName = file.getOriginalFilename();
        String ext = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf(".")).toLowerCase()
                : ".jpg";
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType()) || !ALLOWED_EXTENSIONS.contains(ext)) {
            return ApiResponse.fail("Only JPG, PNG, GIF, and WebP images are allowed");
        }

        String filename = UUID.randomUUID() + ext;

        try {
            Long householdId = currentHousehold.requireHouseholdId();
            File dest = Path.of(uploadPath, householdId.toString(), filename).toFile();
            dest.getParentFile().mkdirs();
            file.transferTo(dest);
            String url = "/api/v1/files/" + filename;
            return ApiResponse.ok("Upload successful", Map.of("url", url, "filename", filename));
        } catch (IOException e) {
            log.error("Failed to store an uploaded file", e);
            return ApiResponse.fail("File upload failed, please try again later");
        }
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> download(@PathVariable String filename) throws IOException {
        if (!SAFE_FILENAME.matcher(filename).matches()) {
            return ResponseEntity.notFound().build();
        }
        Long householdId = currentHousehold.requireHouseholdId();
        Path file = Path.of(uploadPath, householdId.toString(), filename).normalize();
        if (!Files.isRegularFile(file) && householdId.equals(1L)) {
            file = Path.of(uploadPath, filename).normalize();
        }
        if (!Files.isRegularFile(file)) {
            return ResponseEntity.notFound().build();
        }
        String contentType = Files.probeContentType(file);
        MediaType mediaType;
        try {
            mediaType = contentType == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(contentType);
        } catch (IllegalArgumentException ignored) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }
        return ResponseEntity.ok()
                .contentType(mediaType)
                .header("Cache-Control", "private, max-age=3600")
                .body(new FileSystemResource(file));
    }

}
