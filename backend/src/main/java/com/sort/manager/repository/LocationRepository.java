package com.sort.manager.repository;

import com.sort.manager.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    interface LocationCountView {
        Long getId();
        String getName();
        String getDescription();
        String getImageUrl();
        Long getParentId();
        String getParentName();
        Long getItemCount();
        LocalDateTime getCreatedAt();
        LocalDateTime getUpdatedAt();
    }

    @Query("SELECT l.id AS id, l.name AS name, l.description AS description, l.imageUrl AS imageUrl, " +
            "p.id AS parentId, p.name AS parentName, COUNT(i.id) AS itemCount, " +
            "l.createdAt AS createdAt, l.updatedAt AS updatedAt " +
            "FROM Location l LEFT JOIN l.parent p " +
            "LEFT JOIN Item i ON i.location = l AND i.householdId = :householdId AND i.deletedAt IS NULL " +
            "WHERE l.householdId = :householdId " +
            "GROUP BY l.id, l.name, l.description, l.imageUrl, p.id, p.name, l.createdAt, l.updatedAt " +
            "ORDER BY l.createdAt ASC")
    List<LocationCountView> findAllWithActiveItemCounts(Long householdId);

    List<Location> findByHouseholdIdAndParentIsNull(Long householdId);

    List<Location> findByHouseholdIdAndParentId(Long householdId, Long parentId);

    boolean existsByHouseholdIdAndParentId(Long householdId, Long parentId);

    @Query("SELECT l FROM Location l WHERE l.householdId = :householdId ORDER BY l.createdAt ASC")
    List<Location> findAllOrdered(Long householdId);

    Optional<Location> findByIdAndHouseholdId(Long id, Long householdId);

    List<Location> findAllByHouseholdIdAndIdIn(Long householdId, List<Long> ids);

    long countByHouseholdId(Long householdId);
}
