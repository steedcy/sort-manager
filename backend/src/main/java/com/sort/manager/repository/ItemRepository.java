package com.sort.manager.repository;

import com.sort.manager.entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location " +
           "WHERE i.householdId = :householdId " +
           "AND (:keyword IS NULL OR i.name LIKE %:keyword%) " +
           "AND (:categoryId IS NULL OR i.category.id = :categoryId) " +
           "AND (:locationId IS NULL OR i.location.id = :locationId) " +
           "ORDER BY i.createdAt DESC")
    List<Item> findByFilters(@Param("householdId") Long householdId,
                              @Param("keyword") String keyword,
                              @Param("categoryId") Long categoryId,
                              @Param("locationId") Long locationId);

    @Query(value = "SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location " +
            "WHERE i.householdId = :householdId " +
            "AND (:keyword IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:categoryId IS NULL OR i.category.id = :categoryId) " +
            "AND (:locationId IS NULL OR i.location.id = :locationId) " +
            "AND (:status IS NULL " +
            "OR (:status = 'expired' AND i.expiryDate IS NOT NULL AND i.expiryDate < :today) " +
            "OR (:status = 'expiring' AND i.expiryDate IS NOT NULL AND i.expiryDate >= :today AND i.expiryDate <= :expiringBefore) " +
            "OR (:status = 'normal' AND (i.expiryDate IS NULL OR i.expiryDate > :expiringBefore)))",
            countQuery = "SELECT COUNT(i) FROM Item i " +
                    "WHERE i.householdId = :householdId " +
                    "AND (:keyword IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    "OR LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
                    "AND (:categoryId IS NULL OR i.category.id = :categoryId) " +
                    "AND (:locationId IS NULL OR i.location.id = :locationId) " +
                    "AND (:status IS NULL " +
                    "OR (:status = 'expired' AND i.expiryDate IS NOT NULL AND i.expiryDate < :today) " +
                    "OR (:status = 'expiring' AND i.expiryDate IS NOT NULL AND i.expiryDate >= :today AND i.expiryDate <= :expiringBefore) " +
                    "OR (:status = 'normal' AND (i.expiryDate IS NULL OR i.expiryDate > :expiringBefore)))")
    Page<Item> searchByFilters(@Param("householdId") Long householdId,
                               @Param("keyword") String keyword,
                               @Param("categoryId") Long categoryId,
                               @Param("locationId") Long locationId,
                               @Param("status") String status,
                               @Param("today") java.time.LocalDate today,
                               @Param("expiringBefore") java.time.LocalDate expiringBefore,
                               Pageable pageable);

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location WHERE i.householdId = :householdId ORDER BY i.createdAt DESC")
    List<Item> findAllWithDetails(@Param("householdId") Long householdId);

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location WHERE i.householdId = :householdId ORDER BY i.createdAt DESC")
    List<Item> findRecent(@Param("householdId") Long householdId, Pageable pageable);

    long countByHouseholdIdAndCategoryId(Long householdId, Long categoryId);

    long countByHouseholdIdAndLocationId(Long householdId, Long locationId);

    long countByHouseholdIdAndCategoryIsNull(Long householdId);

    List<Item> findByHouseholdIdAndLocationId(Long householdId, Long locationId);

    @Query("SELECT i.category.id, COUNT(i) FROM Item i WHERE i.householdId = :householdId AND i.category IS NOT NULL GROUP BY i.category.id")
    List<Object[]> countByCategory(@Param("householdId") Long householdId);

    @Query("SELECT i.location.id, COUNT(i) FROM Item i WHERE i.householdId = :householdId AND i.location IS NOT NULL GROUP BY i.location.id")
    List<Object[]> countByLocation(@Param("householdId") Long householdId);

    java.util.Optional<Item> findByIdAndHouseholdId(Long id, Long householdId);

    long countByHouseholdId(Long householdId);
}
