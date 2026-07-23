package com.sort.manager.service;

import com.sort.manager.dto.AuditEventDTO;
import com.sort.manager.dto.PageResponse;
import com.sort.manager.entity.AppUser;
import com.sort.manager.entity.AuditEvent;
import com.sort.manager.repository.AppUserRepository;
import com.sort.manager.repository.AuditEventRepository;
import com.sort.manager.security.CurrentHousehold;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuditEventService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final AuditEventRepository repository;
    private final AppUserRepository userRepository;
    private final CurrentHousehold currentHousehold;

    /** Records only a compact, pre-sanitized summary in the caller's transaction. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void record(Long householdId,
                       Long actorUserId,
                       String action,
                       String entityType,
                       Long entityId,
                       String entityName,
                       String summary) {
        AppUser actor = userRepository.findById(actorUserId)
                .orElseThrow(() -> new IllegalStateException("Audit actor no longer exists"));
        AuditEvent event = new AuditEvent();
        event.setHouseholdId(householdId);
        event.setActorUserId(actorUserId);
        event.setActorDisplayName(truncate(actor.getDisplayName(), 100));
        event.setAction(requiredCode(action, "action", 64));
        event.setEntityType(requiredCode(entityType, "entityType", 32));
        event.setEntityId(entityId);
        event.setEntityName(truncate(entityName, 200));
        event.setSummary(truncate(summary, 500));
        repository.save(event);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditEventDTO> search(String action, Integer page, Integer size) {
        int pageNumber = page == null || page < 0 ? 0 : page;
        int pageSize = size == null || size < 1 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
        String normalizedAction = normalizeAction(action);
        Page<AuditEvent> result = repository.searchByHouseholdId(
                currentHousehold.requireHouseholdId(),
                normalizedAction,
                PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponse.from(result, result.getContent().stream().map(this::toDTO).toList());
    }

    private AuditEventDTO toDTO(AuditEvent event) {
        return new AuditEventDTO(event.getId(), event.getAction(), event.getEntityType(), event.getEntityId(),
                event.getEntityName(), event.getSummary(), event.getActorUserId(), event.getActorDisplayName(),
                event.getCreatedAt() == null ? null : event.getCreatedAt().toString());
    }

    private String normalizeAction(String action) {
        if (action == null || action.isBlank()) {
            return null;
        }
        String normalized = action.trim().toUpperCase(Locale.ROOT);
        if (!normalized.matches("[A-Z0-9_]{1,64}")) {
            throw new IllegalArgumentException("Unsupported audit action filter");
        }
        return normalized;
    }

    private String requiredCode(String value, String field, int maxLength) {
        if (value == null || !value.matches("[A-Z0-9_]{1," + maxLength + "}")) {
            throw new IllegalArgumentException("Invalid audit " + field);
        }
        return value;
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
