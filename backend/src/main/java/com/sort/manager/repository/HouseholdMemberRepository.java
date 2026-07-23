package com.sort.manager.repository;

import com.sort.manager.entity.HouseholdMember;
import com.sort.manager.entity.HouseholdRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HouseholdMemberRepository extends JpaRepository<HouseholdMember, Long> {

    @Query("SELECT m FROM HouseholdMember m JOIN FETCH m.user JOIN FETCH m.household WHERE m.user.username = :username")
    Optional<HouseholdMember> findForLogin(@Param("username") String username);

    @Query("SELECT m FROM HouseholdMember m JOIN FETCH m.user JOIN FETCH m.household WHERE m.user.id = :userId")
    Optional<HouseholdMember> findByUserIdWithDetails(@Param("userId") Long userId);

    @Query("SELECT m FROM HouseholdMember m JOIN FETCH m.user WHERE m.household.id = :householdId ORDER BY m.createdAt ASC")
    List<HouseholdMember> findAllByHouseholdIdWithUser(@Param("householdId") Long householdId);

    Optional<HouseholdMember> findByIdAndHouseholdId(Long id, Long householdId);

    long countByHouseholdIdAndRoleAndUserEnabledTrue(Long householdId, HouseholdRole role);

    long countByHouseholdIdAndUserEnabledTrue(Long householdId);

    boolean existsByUserIdAndHouseholdIdAndUserEnabledTrue(Long userId, Long householdId);
}
