package com.sort.manager.service;

import com.sort.manager.entity.AppUser;
import com.sort.manager.entity.AuditEvent;
import com.sort.manager.repository.AppUserRepository;
import com.sort.manager.repository.AuditEventRepository;
import com.sort.manager.security.CurrentHousehold;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuditEventServiceTest {

    @Test
    void recordCapturesActorSnapshotAndSearchIsHouseholdScoped() {
        AuditEventRepository repository = mock(AuditEventRepository.class);
        AppUserRepository users = mock(AppUserRepository.class);
        CurrentHousehold current = mock(CurrentHousehold.class);
        AppUser actor = new AppUser();
        actor.setId(9L);
        actor.setDisplayName("Alex");
        when(users.findById(9L)).thenReturn(Optional.of(actor));
        when(repository.save(any(AuditEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(current.requireHouseholdId()).thenReturn(42L);
        when(repository.searchByHouseholdId(org.mockito.ArgumentMatchers.eq(42L),
                org.mockito.ArgumentMatchers.eq("ITEM_DELETED"),
                org.mockito.ArgumentMatchers.any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        AuditEventService service = new AuditEventService(repository, users, current);

        service.record(42L, 9L, "ITEM_CREATED", "ITEM", 8L, "Battery", "Created item");
        service.search("ITEM_DELETED", 0, 500);

        verify(repository).save(org.mockito.ArgumentMatchers.argThat(event ->
                event.getHouseholdId().equals(42L)
                        && event.getActorUserId().equals(9L)
                        && event.getActorDisplayName().equals("Alex")
                        && event.getAction().equals("ITEM_CREATED")));
        verify(repository).searchByHouseholdId(org.mockito.ArgumentMatchers.eq(42L),
                org.mockito.ArgumentMatchers.eq("ITEM_DELETED"),
                org.mockito.ArgumentMatchers.argThat(pageable -> pageable.getPageSize() == 100));
    }
}
