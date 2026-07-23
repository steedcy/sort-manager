package com.sort.manager.repository;

import com.sort.manager.entity.RefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM RefreshToken t JOIN FETCH t.user JOIN FETCH t.household WHERE t.tokenHash = :tokenHash")
    Optional<RefreshToken> findByTokenHashForUpdate(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("UPDATE RefreshToken t SET t.revokedAt = :revokedAt WHERE t.tokenFamily = :family AND t.revokedAt IS NULL")
    int revokeFamily(@Param("family") String family, @Param("revokedAt") Instant revokedAt);

    @Modifying
    @Query("UPDATE RefreshToken t SET t.revokedAt = :revokedAt WHERE t.user.id = :userId AND t.revokedAt IS NULL")
    int revokeAllForUser(@Param("userId") Long userId, @Param("revokedAt") Instant revokedAt);

    @Query("SELECT COUNT(t) FROM RefreshToken t WHERE t.household.id = :householdId " +
            "AND t.user.enabled = true AND t.revokedAt IS NULL AND t.expiresAt > :now")
    long countActiveByHouseholdId(@Param("householdId") Long householdId, @Param("now") Instant now);
}
