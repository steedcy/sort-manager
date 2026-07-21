package com.sort.manager.service;

import com.sort.manager.dto.LocationDTO;
import com.sort.manager.entity.Location;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LocationServiceTest {

    @Test
    void updateRejectsSelfAsParent() {
        LocationRepository locationRepository = mock(LocationRepository.class);
        ItemRepository itemRepository = mock(ItemRepository.class);
        CurrentHousehold currentHousehold = mock(CurrentHousehold.class);
        when(currentHousehold.requireHouseholdId()).thenReturn(1L);
        LocationService service = new LocationService(locationRepository, itemRepository, currentHousehold);

        Location existing = new Location();
        existing.setId(7L);

        LocationDTO dto = new LocationDTO();
        dto.setName("Shelf");
        dto.setParentId(7L);

        when(locationRepository.findByIdAndHouseholdId(7L, 1L)).thenReturn(Optional.of(existing));

        assertThrows(IllegalArgumentException.class, () -> service.update(7L, dto));
    }
}
