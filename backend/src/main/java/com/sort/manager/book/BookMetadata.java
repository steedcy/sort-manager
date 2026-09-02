package com.sort.manager.book;

import java.time.Instant;
import java.util.List;

public record BookMetadata(String isbn10, String isbn13, String title, String subtitle, List<String> authors, String publisher, String publishedDate, String description, Integer pageCount, List<String> categories, String language, String coverUrl, String source, String sourceId, Instant queriedAt) {
    public BookMetadata withQueriedAt(Instant timestamp) { return new BookMetadata(isbn10, isbn13, title, subtitle, authors == null ? List.of() : List.copyOf(authors), publisher, publishedDate, description, pageCount, categories == null ? List.of() : List.copyOf(categories), language, coverUrl, source, sourceId, timestamp); }
}
