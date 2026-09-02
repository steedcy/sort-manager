package com.sort.manager.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "item")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "household_id", nullable = false)
    private Long householdId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate purchaseDate = LocalDate.now();

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "isbn13", length = 13) private String isbn13;
    @Column(name = "isbn10", length = 10) private String isbn10;
    @Column(name = "book_authors", columnDefinition = "TEXT") private String bookAuthors;
    @Column(name = "book_publisher", length = 255) private String bookPublisher;
    @Column(name = "book_published_date", length = 50) private String bookPublishedDate;
    @Column(name = "book_page_count") private Integer bookPageCount;
    @Column(name = "book_language", length = 32) private String bookLanguage;
    @Column(name = "book_categories", columnDefinition = "TEXT") private String bookCategories;
    @Column(name = "book_subtitle", columnDefinition = "TEXT") private String bookSubtitle;
    @Column(name = "book_source", length = 32) private String bookSource;
    @Column(name = "book_source_id", length = 255) private String bookSourceId;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by_user_id")
    private Long deletedByUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by_user_id", insertable = false, updatable = false)
    private AppUser deletedByUser;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
