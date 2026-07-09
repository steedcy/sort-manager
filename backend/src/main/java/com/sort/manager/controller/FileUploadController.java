package com.sort.manager.controller;

import com.sort.manager.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    @Value("${app.upload.path}")
    private String uploadPath;

    @Value("${app.upload.url-prefix}")
    private String urlPrefix;

    @PostMapping
    public ApiResponse<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ApiResponse.fail("文件不能为空");
        }
        String originalName = file.getOriginalFilename();
        String ext = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf("."))
                : ".jpg";
        String filename = UUID.randomUUID() + ext;

        try {
            File dest = new File(uploadPath + filename);
            dest.getParentFile().mkdirs();
            file.transferTo(dest);
            String url = urlPrefix + filename;
            return ApiResponse.ok("上传成功", Map.of("url", url, "filename", filename));
        } catch (IOException e) {
            return ApiResponse.fail("文件上传失败: " + e.getMessage());
        }
    }
}
