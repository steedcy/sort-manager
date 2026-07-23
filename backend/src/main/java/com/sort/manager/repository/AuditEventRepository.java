package com.sort.manager.repository;

import com.sort.manager.entity.AuditEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {

    @Query("SELECT event FROM AuditEvent event "
            + "WHERE event.householdId = :householdId "
            + "AND (:action IS NULL OR event.action = :action)")
    Page<AuditEvent> searchByHouseholdId(@Param("householdId") Long householdId,
                                         @Param("action") String action,
                                         Pageable pageable);

    long countByHouseholdIdAndCreatedAtGreaterThanEqual(Long householdId, LocalDateTime since);
}
