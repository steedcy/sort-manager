package com.sort.manager.service;

import com.sort.manager.dto.LocationDTO;
import com.sort.manager.entity.Location;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final ItemRepository itemRepository;

    @Transactional(readOnly = true)
    public List<LocationDTO> findAll() {
        return locationRepository.findAllOrdered().stream()
                .map(l -> toDTO(l, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LocationDTO> findTree() {
        List<Location> roots = locationRepository.findByParentIsNull();
        return roots.stream()
                .map(l -> toDTO(l, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LocationDTO findById(Long id) {
        Location l = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("位置不存在: " + id));
        return toDTO(l, true);
    }

    @Transactional
    public LocationDTO create(LocationDTO dto) {
        Location l = new Location();
        l.setName(dto.getName());
        l.setDescription(dto.getDescription());
        l.setImageUrl(dto.getImageUrl());
        if (dto.getParentId() != null) {
            locationRepository.findById(dto.getParentId()).ifPresent(l::setParent);
        }
        return toDTO(locationRepository.save(l), false);
    }

    @Transactional
    public LocationDTO update(Long id, LocationDTO dto) {
        Location l = locationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("位置不存在: " + id));
        l.setName(dto.getName());
        l.setDescription(dto.getDescription());
        l.setImageUrl(dto.getImageUrl());
        if (dto.getParentId() != null) {
            locationRepository.findById(dto.getParentId()).ifPresent(l::setParent);
        } else {
            l.setParent(null);
        }
        return toDTO(locationRepository.save(l), false);
    }

    @Transactional
    public void delete(Long id) {
        locationRepository.deleteById(id);
    }

    private LocationDTO toDTO(Location l, boolean includeChildren) {
        LocationDTO dto = new LocationDTO();
        dto.setId(l.getId());
        dto.setName(l.getName());
        dto.setDescription(l.getDescription());
        dto.setImageUrl(l.getImageUrl());
        dto.setItemCount(itemRepository.countByLocationId(l.getId()));
        if (l.getParent() != null) {
            dto.setParentId(l.getParent().getId());
            dto.setParentName(l.getParent().getName());
        }
        if (l.getCreatedAt() != null) dto.setCreatedAt(l.getCreatedAt().toString());
        if (l.getUpdatedAt() != null) dto.setUpdatedAt(l.getUpdatedAt().toString());
        if (includeChildren && l.getChildren() != null) {
            dto.setChildren(l.getChildren().stream()
                    .map(child -> toDTO(child, true))
                    .collect(Collectors.toList()));
        } else {
            dto.setChildren(new ArrayList<>());
        }
        return dto;
    }
}
