package com.sort.manager.service;

import com.sort.manager.dto.OperationsSummaryDTO;
import com.sort.manager.repository.AuditEventRepository;
import com.sort.manager.repository.HouseholdMemberRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.RefreshTokenRepository;
import com.sort.manager.security.CurrentHousehold;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class OperationsSummaryService {

    private final ItemRepository itemRepository;
    private final HouseholdMemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditEventRepository auditEventRepository;
    private final AuditEventService auditEventService;
    private final BackupStatusReader backupStatusReader;
    private final CurrentHousehold currentHousehold;
    private final Clock clock;

    @Transactional(readOnly = true)
    public OperationsSummaryDTO getSummary() {
        Long householdId = currentHousehold.requireHouseholdId();
        LocalDateTime since = LocalDateTime.ofInstant(clock.instant(), ZoneId.systemDefault()).minusDays(7);
        return new OperationsSummaryDTO(
                memberRepository.countByHouseholdIdAndUserEnabledTrue(householdId),
                refreshTokenRepository.countActiveByHouseholdId(householdId, clock.instant()),
                itemRepository.countDeletedByHouseholdId(householdId),
                auditEventRepository.countByHouseholdIdAndCreatedAtGreaterThanEqual(householdId, since),
                backupStatusReader.read(),
                auditEventService.search(null, 0, 6).getContent());
    }
}
