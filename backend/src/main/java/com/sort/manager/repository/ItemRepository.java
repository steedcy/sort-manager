package com.sort.manager.repository;

import com.sort.manager.entity.Item;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location " +
           "WHERE (:keyword IS NULL OR i.name LIKE %:keyword%) " +
           "AND (:categoryId IS NULL OR i.category.id = :categoryId) " +
           "AND (:locationId IS NULL OR i.location.id = :locationId) " +
           "ORDER BY i.createdAt DESC")
    List<Item> findByFilters(@Param("keyword") String keyword,
                              @Param("categoryId") Long categoryId,
                              @Param("locationId") Long locationId);

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location ORDER BY i.createdAt DESC")
    List<Item> findAllWithDetails();

    @Query("SELECT i FROM Item i LEFT JOIN FETCH i.category LEFT JOIN FETCH i.location ORDER BY i.createdAt DESC")
    List<Item> findTop5ByOrderByCreatedAtDesc(Pageable pageable);

    long countByCategoryId(Long categoryId);

    long countByLocationId(Long locationId);

    long countByCategoryIsNull();

    List<Item> findByLocationId(Long locationId);

    @Query("SELECT i.category.id, COUNT(i) FROM Item i WHERE i.category IS NOT NULL GROUP BY i.category.id")
    List<Object[]> countByCategory();

    @Query("SELECT i.location.id, COUNT(i) FROM Item i WHERE i.location IS NOT NULL GROUP BY i.location.id")
    List<Object[]> countByLocation();
}
