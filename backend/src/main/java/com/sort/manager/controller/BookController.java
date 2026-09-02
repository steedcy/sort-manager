package com.sort.manager.controller;

import com.sort.manager.dto.ApiResponse;
import com.sort.manager.service.BookLookupResult;
import com.sort.manager.service.IsbnBookService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/books")
@RequiredArgsConstructor
public class BookController {
    private final IsbnBookService isbnBookService;
    @GetMapping("/isbn/{isbn}")
    public ApiResponse<BookLookupResult> lookup(@PathVariable String isbn) { return ApiResponse.ok(isbnBookService.lookupByIsbn(isbn)); }
}
