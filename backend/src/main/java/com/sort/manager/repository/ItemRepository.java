package com.sort.manager.repository;

import com.sort.manager.entity.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDate;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location " +
           "WHERE i.householdId = :householdId " +
           "AND i.deletedAt IS NULL " +
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
            "AND i.deletedAt IS NULL " +
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
                    "AND i.deletedAt IS NULL " +
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

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location WHERE i.householdId = :householdId AND i.deletedAt IS NULL ORDER BY i.createdAt DESC")
    List<Item> findAllWithDetails(@Param("householdId") Long householdId);

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location WHERE i.householdId = :householdId AND i.deletedAt IS NULL ORDER BY i.createdAt DESC")
    List<Item> findRecent(@Param("householdId") Long householdId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(i.price * i.quantity), 0) FROM Item i " +
            "WHERE i.householdId = :householdId AND i.deletedAt IS NULL")
    BigDecimal sumActiveAssetValue(@Param("householdId") Long householdId);

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location " +
            "WHERE i.householdId = :householdId AND i.deletedAt IS NULL " +
            "AND i.expiryDate IS NOT NULL AND i.expiryDate <= :threshold ORDER BY i.expiryDate ASC")
    List<Item> findExpiring(@Param("householdId") Long householdId,
                            @Param("threshold") LocalDate threshold,
                            Pageable pageable);

    @Query("SELECT COUNT(i) FROM Item i WHERE i.householdId = :householdId AND i.category.id = :categoryId AND i.deletedAt IS NULL")
    long countByHouseholdIdAndCategoryId(@Param("householdId") Long householdId, @Param("categoryId") Long categoryId);

    @Query("SELECT COUNT(i) FROM Item i WHERE i.householdId = :householdId AND i.location.id = :locationId AND i.deletedAt IS NULL")
    long countByHouseholdIdAndLocationId(@Param("householdId") Long householdId, @Param("locationId") Long locationId);

    @Query("SELECT (COUNT(i) > 0) FROM Item i WHERE i.householdId = :householdId AND i.category.id = :categoryId")
    boolean existsAnyByHouseholdIdAndCategoryId(@Param("householdId") Long householdId,
                                                 @Param("categoryId") Long categoryId);

    @Query("SELECT (COUNT(i) > 0) FROM Item i WHERE i.householdId = :householdId AND i.location.id = :locationId")
    boolean existsAnyByHouseholdIdAndLocationId(@Param("householdId") Long householdId,
                                                 @Param("locationId") Long locationId);

    @Query("SELECT COUNT(i) FROM Item i WHERE i.householdId = :householdId AND i.category IS NULL AND i.deletedAt IS NULL")
    long countByHouseholdIdAndCategoryIsNull(@Param("householdId") Long householdId);

    @Query("SELECT i FROM Item i WHERE i.householdId = :householdId AND i.location.id = :locationId AND i.deletedAt IS NULL")
    List<Item> findByHouseholdIdAndLocationId(@Param("householdId") Long householdId, @Param("locationId") Long locationId);

    @Query("SELECT i.category.id, COUNT(i) FROM Item i WHERE i.householdId = :householdId AND i.category IS NOT NULL AND i.deletedAt IS NULL GROUP BY i.category.id")
    List<Object[]> countByCategory(@Param("householdId") Long householdId);

    @Query("SELECT i.location.id, COUNT(i) FROM Item i WHERE i.householdId = :householdId AND i.location IS NOT NULL AND i.deletedAt IS NULL GROUP BY i.location.id")
    List<Object[]> countByLocation(@Param("householdId") Long householdId);

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location WHERE i.id = :id AND i.householdId = :householdId AND i.deletedAt IS NULL")
    java.util.Optional<Item> findByIdAndHouseholdId(@Param("id") Long id, @Param("householdId") Long householdId);

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location WHERE i.id = :id AND i.householdId = :householdId AND i.deletedAt IS NULL")
    java.util.Optional<Item> findActiveByIdAndHouseholdId(@Param("id") Long id, @Param("householdId") Long householdId);

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location LEFT JOIN FETCH i.deletedByUser WHERE i.id = :id AND i.householdId = :householdId AND i.deletedAt IS NOT NULL")
    java.util.Optional<Item> findDeletedByIdAndHouseholdId(@Param("id") Long id, @Param("householdId") Long householdId);

    @Query(value = "SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location LEFT JOIN FETCH i.deletedByUser WHERE i.householdId = :householdId AND i.deletedAt IS NOT NULL",
            countQuery = "SELECT COUNT(i) FROM Item i WHERE i.householdId = :householdId AND i.deletedAt IS NOT NULL")
    Page<Item> findDeletedByHouseholdId(@Param("householdId") Long householdId, Pageable pageable);

    @Query("SELECT COUNT(i) FROM Item i WHERE i.householdId = :householdId AND i.deletedAt IS NULL")
    long countByHouseholdId(@Param("householdId") Long householdId);

    @Query("SELECT COUNT(i) FROM Item i WHERE i.householdId = :householdId AND i.deletedAt IS NOT NULL")
    long countDeletedByHouseholdId(@Param("householdId") Long householdId);
}
