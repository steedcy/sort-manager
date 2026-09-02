package com.sort.manager.service;

import com.sort.manager.book.BookLookupClient;
import com.sort.manager.book.BookMetadata;
import com.sort.manager.book.BookServiceUnavailableException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class IsbnBookServiceTest {
    private static final String ISBN = "9787111128069";

    @Test
    void fallsBackToOpenLibraryWhenGoogleHasNoResult() {
        BookLookupClient google = isbn -> Optional.empty();
        BookLookupClient openLibrary = isbn -> Optional.of(book("open-library"));
        IsbnBookService service = new IsbnBookService(google, openLibrary, Clock.fixed(Instant.parse("2026-08-31T00:00:00Z"), ZoneOffset.UTC));

        BookMetadata result = service.lookupByIsbn(ISBN).metadata();

        assertEquals("open-library", result.source());
        assertEquals("C程序设计语言", result.title());
    }

    @Test
    void returnsCachedResultWithoutCallingExternalClientsAgain() {
        int[] calls = {0};
        BookLookupClient google = isbn -> { calls[0]++; return Optional.of(book("google-books")); };
        IsbnBookService service = new IsbnBookService(google, isbn -> Optional.empty(), Clock.systemUTC());

        service.lookupByIsbn(ISBN);
        BookLookupResult cached = service.lookupByIsbn(ISBN);

        assertEquals(1, calls[0]);
        assertEquals(true, cached.cached());
    }

    @Test
    void reportsServiceUnavailableOnlyWhenBothSourcesFail() {
        BookLookupClient unavailable = isbn -> { throw new BookServiceUnavailableException(); };
        IsbnBookService service = new IsbnBookService(unavailable, unavailable, Clock.systemUTC());

        assertThrows(BookServiceUnavailableException.class, () -> service.lookupByIsbn(ISBN));
    }

    private BookMetadata book(String source) {
        return new BookMetadata("7111128060", ISBN, "C程序设计语言", "The C programming language",
                List.of("Brian W. Kernighan", "Dennis M. Ritchie"), "机械工业出版社", "2002-01", "简介", 258,
                List.of("Programming"), "zh", "https://example.test/cover.jpg", source, "source-id", null);
    }
}
