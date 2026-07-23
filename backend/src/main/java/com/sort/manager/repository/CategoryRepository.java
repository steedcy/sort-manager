package com.sort.manager.repository;

import com.sort.manager.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    interface CategoryCountView {
        Long getId();
        String getName();
        String getIcon();
        String getColor();
        Long getItemCount();
        LocalDateTime getCreatedAt();
        LocalDateTime getUpdatedAt();
    }

    @Query("SELECT c.id AS id, c.name AS name, c.icon AS icon, c.color AS color, " +
            "COUNT(i.id) AS itemCount, c.createdAt AS createdAt, c.updatedAt AS updatedAt " +
            "FROM Category c LEFT JOIN Item i ON i.category = c AND i.householdId = :householdId AND i.deletedAt IS NULL " +
            "WHERE c.householdId = :householdId " +
            "GROUP BY c.id, c.name, c.icon, c.color, c.createdAt, c.updatedAt " +
            "ORDER BY c.createdAt ASC")
    List<CategoryCountView> findAllWithActiveItemCounts(Long householdId);

    @Query("SELECT c FROM Category c WHERE c.householdId = :householdId ORDER BY c.createdAt ASC")
    List<Category> findAllOrdered(Long householdId);

    boolean existsByHouseholdIdAndName(Long householdId, String name);

    Optional<Category> findByHouseholdIdAndName(Long householdId, String name);

    Optional<Category> findByIdAndHouseholdId(Long id, Long householdId);

    List<Category> findAllByHouseholdIdAndIdIn(Long householdId, List<Long> ids);

    long countByHouseholdId(Long householdId);
}
