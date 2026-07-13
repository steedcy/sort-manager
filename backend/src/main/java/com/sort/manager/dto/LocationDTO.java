package com.sort.manager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class LocationDTO {
    private Long id;
    @NotBlank(message = "Location name is required")
    @Size(max = 200, message = "Location name must be 200 characters or fewer")
    private String name;
    private String description;
    private Long parentId;
    private String parentName;
    @Size(max = 500, message = "Image URL must be 500 characters or fewer")
    private String imageUrl;
    private Long itemCount;
    private List<LocationDTO> children;
    private String createdAt;
    private String updatedAt;
}
