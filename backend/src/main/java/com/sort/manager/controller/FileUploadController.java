package com.sort.manager.controller;

import com.sort.manager.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

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

    @Value("${app.upload.url-prefix}")
    private String urlPrefix;

    @PostMapping
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
            File dest = new File(normalizePath(uploadPath) + filename);
            dest.getParentFile().mkdirs();
            file.transferTo(dest);
            String url = urlPrefix + filename;
            return ApiResponse.ok("Upload successful", Map.of("url", url, "filename", filename));
        } catch (IOException e) {
            return ApiResponse.fail("File upload failed: " + e.getMessage());
        }
    }

    private String normalizePath(String path) {
        if (path.endsWith("/") || path.endsWith("\\")) {
            return path;
        }
        return path + File.separator;
    }
}
