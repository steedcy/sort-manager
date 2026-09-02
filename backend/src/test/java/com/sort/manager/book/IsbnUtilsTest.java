package com.sort.manager.book;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class IsbnUtilsTest {

    @Test
    void normalizesValidIsbn13WithWhitespaceAndHyphens() {
        NormalizedIsbn isbn = IsbnUtils.normalizeToIsbn13("978-7 111-12806-9");

        assertEquals("9787111128069", isbn.isbn13());
        assertEquals("7111128060", isbn.isbn10());
    }

    @Test
    void convertsValidIsbn10ToIsbn13() {
        NormalizedIsbn isbn = IsbnUtils.normalizeToIsbn13("0-306-40615-2");

        assertEquals("9780306406157", isbn.isbn13());
        assertEquals("0306406152", isbn.isbn10());
    }

    @Test
    void acceptsAnIsbn10EndingInX() {
        assertEquals("9780439420891", IsbnUtils.normalizeToIsbn13("0-439-42089-X").isbn13());
    }

    @Test
    void rejectsInvalidIsbn13CheckDigit() {
        assertThrows(InvalidIsbnException.class, () -> IsbnUtils.normalizeToIsbn13("9787111128068"));
    }

    @Test
    void rejectsNonBookEan13() {
        assertThrows(InvalidIsbnException.class, () -> IsbnUtils.normalizeToIsbn13("6901234567892"));
    }
}
