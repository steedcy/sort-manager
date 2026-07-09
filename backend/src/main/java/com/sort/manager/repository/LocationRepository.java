package com.sort.manager.repository;

import com.sort.manager.entity.Location;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LocationRepository extends JpaRepository<Location, Long> {

    List<Location> findByParentIsNull();

    List<Location> findByParentId(Long parentId);

    @Query("SELECT l FROM Location l ORDER BY l.createdAt ASC")
    List<Location> findAllOrdered();
}
