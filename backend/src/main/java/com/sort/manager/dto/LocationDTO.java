package com.sort.manager.dto;

import lombok.Data;
import java.util.List;

@Data
public class LocationDTO {
    private Long id;
    private String name;
    private String description;
    private Long parentId;
    private String parentName;
    private String imageUrl;
    private Long itemCount;
    private List<LocationDTO> children;
    private String createdAt;
    private String updatedAt;
}
