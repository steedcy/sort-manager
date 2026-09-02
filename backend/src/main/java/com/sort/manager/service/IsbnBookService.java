package com.sort.manager.service;

import com.sort.manager.book.BookLookupClient;
import com.sort.manager.book.BookMetadata;
import com.sort.manager.book.BookServiceUnavailableException;
import com.sort.manager.book.IsbnUtils;
import com.sort.manager.book.NormalizedIsbn;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IsbnBookService {
    private static final Duration SUCCESS_TTL = Duration.ofDays(30);
    private static final Duration NOT_FOUND_TTL = Duration.ofHours(24);
    private final BookLookupClient google;
    private final BookLookupClient openLibrary;
    private final Clock clock;
    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    @Autowired
    public IsbnBookService(@Qualifier("googleBooksClient") BookLookupClient google, @Qualifier("openLibraryClient") BookLookupClient openLibrary) {
        this(google, openLibrary, Clock.systemUTC());
    }

    IsbnBookService(BookLookupClient google, BookLookupClient openLibrary, Clock clock) { this.google = google; this.openLibrary = openLibrary; this.clock = clock; }

    public BookLookupResult lookupByIsbn(String rawIsbn) {
        NormalizedIsbn isbn = IsbnUtils.normalizeToIsbn13(rawIsbn);
        Instant now = clock.instant();
        CacheEntry cached = cache.get(isbn.isbn13());
        if (cached != null && cached.expiresAt().isAfter(now)) {
            if (cached.metadata() != null) return new BookLookupResult(cached.metadata(), true);
            throw new NoSuchElementException("未查询到该图书，请手动补充信息");
        }
        boolean unavailable = false;
        for (BookLookupClient client : new BookLookupClient[]{google, openLibrary}) {
            try {
                Optional<BookMetadata> result = client.lookup(isbn);
                if (result.isPresent()) {
                    BookMetadata metadata = result.get().withQueriedAt(now);
                    cache.put(isbn.isbn13(), new CacheEntry(metadata, now.plus(SUCCESS_TTL)));
                    return new BookLookupResult(metadata, false);
                }
            } catch (BookServiceUnavailableException ex) { unavailable = true; }
        }
        cache.put(isbn.isbn13(), new CacheEntry(null, now.plus(NOT_FOUND_TTL)));
        if (unavailable) throw new BookServiceUnavailableException();
        throw new NoSuchElementException("未查询到该图书，请手动补充信息");
    }

    private record CacheEntry(BookMetadata metadata, Instant expiresAt) {}
}
