package com.sort.manager.repository;

import com.sort.manager.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c FROM Category c WHERE c.householdId = :householdId ORDER BY c.createdAt ASC")
    List<Category> findAllOrdered(Long householdId);

    boolean existsByHouseholdIdAndName(Long householdId, String name);

    Optional<Category> findByHouseholdIdAndName(Long householdId, String name);

    Optional<Category> findByIdAndHouseholdId(Long id, Long householdId);

    List<Category> findAllByHouseholdIdAndIdIn(Long householdId, List<Long> ids);

    long countByHouseholdId(Long householdId);
}
