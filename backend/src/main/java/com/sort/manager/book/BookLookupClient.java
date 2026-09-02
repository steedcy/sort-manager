package com.sort.manager.book;
import java.util.Optional;
@FunctionalInterface public interface BookLookupClient { Optional<BookMetadata> lookup(NormalizedIsbn isbn); }
