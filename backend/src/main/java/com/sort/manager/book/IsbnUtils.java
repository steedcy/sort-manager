package com.sort.manager.book;

public final class IsbnUtils {
    private IsbnUtils() {
    }

    public static NormalizedIsbn normalizeToIsbn13(String raw) {
        if (raw == null) throw new InvalidIsbnException();
        String compact = raw.replaceAll("[\\s-]", "").toUpperCase();
        if (compact.matches("\\d{13}")) {
            if (!compact.startsWith("978") && !compact.startsWith("979") || !isValidIsbn13(compact)) {
                throw new InvalidIsbnException();
            }
            return new NormalizedIsbn(compact, toIsbn10(compact));
        }
        if (compact.matches("\\d{9}[0-9X]") && isValidIsbn10(compact)) {
            return new NormalizedIsbn(toIsbn13(compact), compact);
        }
        throw new InvalidIsbnException();
    }

    public static boolean isValidIsbn13(String isbn) {
        if (isbn == null || !isbn.matches("\\d{13}")) return false;
        int sum = 0;
        for (int i = 0; i < 12; i++) sum += (isbn.charAt(i) - '0') * (i % 2 == 0 ? 1 : 3);
        return (10 - sum % 10) % 10 == isbn.charAt(12) - '0';
    }

    public static boolean isValidIsbn10(String isbn) {
        if (isbn == null || !isbn.matches("\\d{9}[0-9X]")) return false;
        int sum = 0;
        for (int i = 0; i < 9; i++) sum += (isbn.charAt(i) - '0') * (10 - i);
        sum += (isbn.charAt(9) == 'X' ? 10 : isbn.charAt(9) - '0');
        return sum % 11 == 0;
    }

    public static String toIsbn13(String isbn10) {
        String prefix = "978" + isbn10.substring(0, 9);
        int sum = 0;
        for (int i = 0; i < 12; i++) sum += (prefix.charAt(i) - '0') * (i % 2 == 0 ? 1 : 3);
        return prefix + ((10 - sum % 10) % 10);
    }

    private static String toIsbn10(String isbn13) {
        if (!isbn13.startsWith("978")) return null;
        String body = isbn13.substring(3, 12);
        int sum = 0;
        for (int i = 0; i < 9; i++) sum += (body.charAt(i) - '0') * (10 - i);
        int check = (11 - sum % 11) % 11;
        return body + (check == 10 ? "X" : check);
    }
}
