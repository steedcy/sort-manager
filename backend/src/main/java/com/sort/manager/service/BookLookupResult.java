package com.sort.manager.service;
import com.sort.manager.book.BookMetadata;
public record BookLookupResult(BookMetadata metadata, boolean cached) {}
