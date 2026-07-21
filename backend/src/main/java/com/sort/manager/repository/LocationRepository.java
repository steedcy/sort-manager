package com.sort.manager.repository;

import com.sort.manager.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    List<Location> findByHouseholdIdAndParentIsNull(Long householdId);

    List<Location> findByHouseholdIdAndParentId(Long householdId, Long parentId);

    @Query("SELECT l FROM Location l WHERE l.householdId = :householdId ORDER BY l.createdAt ASC")
    List<Location> findAllOrdered(Long householdId);

    Optional<Location> findByIdAndHouseholdId(Long id, Long householdId);

    long countByHouseholdId(Long householdId);
}
