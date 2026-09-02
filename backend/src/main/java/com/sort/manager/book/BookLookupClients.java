package com.sort.manager.book;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Configuration
public class BookLookupClients {
    @Bean @Qualifier("googleBooksClient")
    BookLookupClient googleBooksClient(ObjectMapper mapper, @Value("${app.books.google-api-key:}") String apiKey) {
        return isbn -> {
            String key = apiKey.isBlank() ? "" : "&key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
            JsonNode items = json(mapper, get("https://www.googleapis.com/books/v1/volumes?q=isbn:" + isbn.isbn13() + key)).path("items");
            if (!items.isArray() || items.isEmpty()) return Optional.empty();
            JsonNode selected = null;
            for (JsonNode item : items) if (matches(isbn, item.path("volumeInfo").path("industryIdentifiers"))) { selected = item; break; }
            if (selected == null && items.size() == 1) selected = items.get(0);
            if (selected == null) return Optional.empty();
            JsonNode info = selected.path("volumeInfo"); String title = text(info, "title");
            if (title == null) return Optional.empty();
            return Optional.of(new BookMetadata(isbn.isbn10(), isbn.isbn13(), title, text(info, "subtitle"), strings(info, "authors"), text(info, "publisher"), text(info, "publishedDate"), text(info, "description"), info.path("pageCount").isInt() ? info.path("pageCount").asInt() : null, strings(info, "categories"), text(info, "language"), https(text(info.path("imageLinks"), "thumbnail")), "google-books", text(selected, "id"), null));
        };
    }

    @Bean @Qualifier("openLibraryClient")
    BookLookupClient openLibraryClient(ObjectMapper mapper) {
        return isbn -> {
            String key = "ISBN:" + isbn.isbn13();
            JsonNode book = json(mapper, get("https://openlibrary.org/api/books?bibkeys=" + URLEncoder.encode(key, StandardCharsets.UTF_8) + "&format=json&jscmd=data")).path(key);
            String title = text(book, "title"); if (book.isMissingNode() || title == null) return Optional.empty();
            String cover = https(text(book.path("cover"), "large")); if (cover == null) cover = https(text(book.path("cover"), "medium"));
            if (cover != null && cover.contains("/b/id/-1")) cover = null;
            return Optional.of(new BookMetadata(isbn.isbn10(), isbn.isbn13(), title, text(book, "subtitle"), names(book.path("authors")), firstName(book.path("publishers")), text(book, "publish_date"), text(book, "notes"), book.path("number_of_pages").isInt() ? book.path("number_of_pages").asInt() : null, List.of(), null, cover, "open-library", text(book, "key"), null));
        };
    }

    private static JsonNode json(ObjectMapper mapper, String body) { try { return mapper.readTree(body == null ? "{}" : body); } catch (Exception ex) { throw new BookServiceUnavailableException(ex); } }
    private static String get(String url) {
        try {
            HttpURLConnection connection = (HttpURLConnection) URI.create(url).toURL().openConnection();
            connection.setRequestMethod("GET"); connection.setConnectTimeout(6000); connection.setReadTimeout(6000);
            connection.setRequestProperty("User-Agent", "SortManager/1.9.0 (+https://github.com/steedcy/sort-manager)");
            if (connection.getResponseCode() != 200) return null;
            try (InputStream input = connection.getInputStream()) { return new String(input.readAllBytes(), StandardCharsets.UTF_8); }
        } catch (Exception ex) { throw new BookServiceUnavailableException(ex); }
    }
    private static boolean matches(NormalizedIsbn isbn, JsonNode ids) { for (JsonNode id : ids) try { if (IsbnUtils.normalizeToIsbn13(text(id, "identifier")).isbn13().equals(isbn.isbn13())) return true; } catch (InvalidIsbnException ignored) {} return false; }
    private static String text(JsonNode node, String name) { String value = node.path(name).asText("").trim(); return value.isEmpty() ? null : value; }
    private static List<String> strings(JsonNode node, String name) { List<String> result = new ArrayList<>(); node.path(name).forEach(value -> { if (!value.asText().isBlank()) result.add(value.asText()); }); return result; }
    private static List<String> names(JsonNode nodes) { List<String> result = new ArrayList<>(); nodes.forEach(node -> { String value = text(node, "name"); if (value != null) result.add(value); }); return result; }
    private static String firstName(JsonNode nodes) { return names(nodes).stream().findFirst().orElse(null); }
    private static String https(String url) { return url == null ? null : url.replaceFirst("^http://", "https://"); }
}
