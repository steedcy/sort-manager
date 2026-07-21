package com.sort.manager.service;

import com.sort.manager.dto.LocationDTO;
import com.sort.manager.entity.Location;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final ItemRepository itemRepository;
    private final CurrentHousehold currentHousehold;

    @Transactional(readOnly = true)
    public List<LocationDTO> findAll() {
        return locationRepository.findAllOrdered(currentHousehold.requireHouseholdId()).stream()
                .map(l -> toDTO(l, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LocationDTO> findTree() {
        List<Location> locations = locationRepository.findAllOrdered(currentHousehold.requireHouseholdId());
        Map<Long, LocationDTO> byId = new LinkedHashMap<>();
        locations.forEach(location -> byId.put(location.getId(), toDTO(location, false)));
        List<LocationDTO> roots = new ArrayList<>();
        locations.forEach(location -> {
            LocationDTO dto = byId.get(location.getId());
            if (location.getParent() == null || !byId.containsKey(location.getParent().getId())) {
                roots.add(dto);
            } else {
                byId.get(location.getParent().getId()).getChildren().add(dto);
            }
        });
        return roots;
    }

    @Transactional(readOnly = true)
    public LocationDTO findById(Long id) {
        Location l = locationRepository.findByIdAndHouseholdId(id, currentHousehold.requireHouseholdId())
                .orElseThrow(() -> new NoSuchElementException("Location not found: " + id));
        return toDTO(l, false);
    }

    @Transactional
    public LocationDTO create(LocationDTO dto) {
        Location l = new Location();
        Long householdId = currentHousehold.requireHouseholdId();
        l.setHouseholdId(householdId);
        l.setName(dto.getName());
        l.setDescription(dto.getDescription());
        l.setImageUrl(dto.getImageUrl());
        if (dto.getParentId() != null) {
            Location parent = locationRepository.findByIdAndHouseholdId(dto.getParentId(), householdId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent location not found: " + dto.getParentId()));
            l.setParent(parent);
        }
        return toDTO(locationRepository.save(l), false);
    }

    @Transactional
    public LocationDTO update(Long id, LocationDTO dto) {
        Long householdId = currentHousehold.requireHouseholdId();
        Location l = locationRepository.findByIdAndHouseholdId(id, householdId)
                .orElseThrow(() -> new NoSuchElementException("Location not found: " + id));
        l.setName(dto.getName());
        l.setDescription(dto.getDescription());
        l.setImageUrl(dto.getImageUrl());
        if (dto.getParentId() != null) {
            if (dto.getParentId().equals(id)) {
                throw new IllegalArgumentException("Location cannot be its own parent");
            }
            Location parent = locationRepository.findByIdAndHouseholdId(dto.getParentId(), householdId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent location not found: " + dto.getParentId()));
            ensureNotDescendant(id, parent);
            l.setParent(parent);
        } else {
            l.setParent(null);
        }
        return toDTO(locationRepository.save(l), false);
    }

    @Transactional
    public void delete(Long id) {
        Location location = locationRepository.findByIdAndHouseholdId(id, currentHousehold.requireHouseholdId())
                .orElseThrow(() -> new NoSuchElementException("Location not found: " + id));
        locationRepository.delete(location);
    }

    private void ensureNotDescendant(Long locationId, Location proposedParent) {
        Location cursor = proposedParent;
        while (cursor != null) {
            if (locationId.equals(cursor.getId())) {
                throw new IllegalArgumentException("Location cannot be moved under its descendant");
            }
            cursor = cursor.getParent();
        }
    }

    private LocationDTO toDTO(Location l, boolean includeChildren) {
        LocationDTO dto = new LocationDTO();
        dto.setId(l.getId());
        dto.setName(l.getName());
        dto.setDescription(l.getDescription());
        dto.setImageUrl(l.getImageUrl());
        dto.setItemCount(itemRepository.countByHouseholdIdAndLocationId(l.getHouseholdId(), l.getId()));
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
