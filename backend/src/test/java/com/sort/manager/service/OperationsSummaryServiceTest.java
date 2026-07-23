package com.sort.manager.service;

import com.sort.manager.dto.BackupStatusDTO;
import com.sort.manager.dto.PageResponse;
import com.sort.manager.repository.AuditEventRepository;
import com.sort.manager.repository.HouseholdMemberRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.RefreshTokenRepository;
import com.sort.manager.security.CurrentHousehold;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OperationsSummaryServiceTest {

    @Test
    void returnsHouseholdScopedProtectionAndActivitySnapshot() {
        ItemRepository items = mock(ItemRepository.class);
        HouseholdMemberRepository members = mock(HouseholdMemberRepository.class);
        RefreshTokenRepository sessions = mock(RefreshTokenRepository.class);
        AuditEventRepository events = mock(AuditEventRepository.class);
        AuditEventService audit = mock(AuditEventService.class);
        BackupStatusReader backups = mock(BackupStatusReader.class);
        CurrentHousehold household = mock(CurrentHousehold.class);
        Clock clock = Clock.fixed(Instant.parse("2026-07-21T08:00:00Z"), ZoneOffset.UTC);
        PageResponse<com.sort.manager.dto.AuditEventDTO> recent = new PageResponse<>();
        recent.setContent(List.of());

        when(household.requireHouseholdId()).thenReturn(11L);
        when(items.countDeletedByHouseholdId(11L)).thenReturn(2L);
        when(members.countByHouseholdIdAndUserEnabledTrue(11L)).thenReturn(3L);
        when(sessions.countActiveByHouseholdId(11L, clock.instant())).thenReturn(4L);
        when(events.countByHouseholdIdAndCreatedAtGreaterThanEqual(any(), any())).thenReturn(9L);
        when(audit.search(null, 0, 6)).thenReturn(recent);
        when(backups.read()).thenReturn(BackupStatusDTO.unavailable("NOT_CONFIGURED"));

        var result = new OperationsSummaryService(items, members, sessions, events, audit, backups, household, clock)
                .getSummary();

        assertThat(result.activeMembers()).isEqualTo(3);
        assertThat(result.activeSessions()).isEqualTo(4);
        assertThat(result.recycleBinItems()).isEqualTo(2);
        assertThat(result.activityLast7Days()).isEqualTo(9);
        assertThat(result.latestBackup().status()).isEqualTo("NOT_CONFIGURED");
        assertThat(result.recentActivity()).isEmpty();
    }
}
