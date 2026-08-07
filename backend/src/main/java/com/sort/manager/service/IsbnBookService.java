package com.sort.manager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sort.manager.dto.ItemDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.math.BigDecimal;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class IsbnBookService {

    private final ObjectMapper objectMapper;

    public ItemDTO lookupByIsbn(String rawIsbn) {
        if (rawIsbn == null || rawIsbn.trim().isEmpty()) {
            throw new IllegalArgumentException("ISBN 编码不能为空");
        }
        String isbn = rawIsbn.replaceAll("[^0-9X]", "").trim();
        if (isbn.length() != 10 && isbn.length() != 13) {
            throw new IllegalArgumentException("无效的 ISBN 格式，请输入 10 位或 13 位数字编码");
        }

        // Priority 1: Douban / Open Mirror API
        ItemDTO dto = tryDoubanMirror(isbn);
        if (dto != null) return dto;

        // Priority 2: Google Books API
        dto = tryGoogleBooks(isbn);
        if (dto != null) return dto;

        // Priority 3: Open Library API
        dto = tryOpenLibrary(isbn);
        if (dto != null) return dto;

        throw new NoSuchElementException("未查询到 ISBN 为「" + rawIsbn + "」的图书信息，请检查编码或手动录入");
    }

    private ItemDTO tryDoubanMirror(String isbn) {
        try {
            // Priority 1 mirror: API Isoyu / Open Douban Proxy
            String urlStr = "https://api.isoyu.com/api/isbn?isbn=" + isbn;
            String jsonStr = httpGet(urlStr, 3000);
            if (jsonStr != null && !jsonStr.isEmpty()) {
                JsonNode root = objectMapper.readTree(jsonStr);
                if (root.has("data") && root.get("data").has("title")) {
                    JsonNode data = root.get("data");
                    ItemDTO dto = new ItemDTO();
                    dto.setName(data.path("title").asText());
                    String author = data.path("author").asText("");
                    String publisher = data.path("publisher").asText("");
                    dto.setDescription("作者：" + author + (publisher.isEmpty() ? "" : " · 出版社：" + publisher));
                    String priceStr = data.path("price").asText("0").replaceAll("[^0-9.]", "");
                    if (!priceStr.isEmpty()) {
                        try { dto.setPrice(new BigDecimal(priceStr)); } catch (Exception ignored) {}
                    }
                    dto.setImageUrl(data.path("image").asText(data.path("cover").asText("")));
                    dto.setCategoryName("图书");
                    dto.setPurchaseDate(LocalDate.now().toString());
                    dto.setQuantity(1);
                    return dto;
                }
            }
        } catch (Exception e) {
            log.debug("Douban mirror lookup failed for ISBN {}: {}", isbn, e.getMessage());
        }
        return null;
    }

    private ItemDTO tryGoogleBooks(String isbn) {
        try {
            String urlStr = "https://www.googleapis.com/books/v1/volumes?q=isbn:" + isbn;
            String jsonStr = httpGet(urlStr, 4000);
            if (jsonStr != null && !jsonStr.isEmpty()) {
                JsonNode root = objectMapper.readTree(jsonStr);
                if (root.has("items") && root.get("items").isArray() && root.get("items").size() > 0) {
                    JsonNode volumeInfo = root.get("items").get(0).path("volumeInfo");
                    ItemDTO dto = new ItemDTO();
                    dto.setName(volumeInfo.path("title").asText("未知书名"));
                    List<String> authors = new ArrayList<>();
                    if (volumeInfo.has("authors")) {
                        for (JsonNode a : volumeInfo.get("authors")) authors.add(a.asText());
                    }
                    String publisher = volumeInfo.path("publisher").asText("");
                    String desc = volumeInfo.path("description").asText("");
                    dto.setDescription("作者：" + String.join(", ", authors) + (publisher.isEmpty() ? "" : " · 出版社：" + publisher) + (desc.isEmpty() ? "" : "\n" + desc));
                    dto.setImageUrl(volumeInfo.path("imageLinks").path("thumbnail").asText("").replace("http://", "https://"));
                    dto.setCategoryName("图书");
                    dto.setPurchaseDate(LocalDate.now().toString());
                    dto.setQuantity(1);
                    dto.setPrice(BigDecimal.ZERO);
                    return dto;
                }
            }
        } catch (Exception e) {
            log.debug("Google Books lookup failed for ISBN {}: {}", isbn, e.getMessage());
        }
        return null;
    }

    private ItemDTO tryOpenLibrary(String isbn) {
        try {
            String key = "ISBN:" + isbn;
            String urlStr = "https://openlibrary.org/api/books?bibkeys=" + key + "&format=json&jscmd=data";
            String jsonStr = httpGet(urlStr, 4000);
            if (jsonStr != null && !jsonStr.isEmpty()) {
                JsonNode root = objectMapper.readTree(jsonStr);
                if (root.has(key)) {
                    JsonNode book = root.get(key);
                    ItemDTO dto = new ItemDTO();
                    dto.setName(book.path("title").asText("未知书名"));
                    List<String> authors = new ArrayList<>();
                    if (book.has("authors")) {
                        for (JsonNode a : book.get("authors")) authors.add(a.path("name").asText());
                    }
                    List<String> publishers = new ArrayList<>();
                    if (book.has("publishers")) {
                        for (JsonNode p : book.get("publishers")) publishers.add(p.path("name").asText());
                    }
                    dto.setDescription("作者：" + String.join(", ", authors) + (publishers.isEmpty() ? "" : " · 出版社：" + String.join(", ", publishers)));
                    dto.setImageUrl(book.path("cover").path("medium").asText(book.path("cover").path("large").asText("")));
                    dto.setCategoryName("图书");
                    dto.setPurchaseDate(LocalDate.now().toString());
                    dto.setQuantity(1);
                    dto.setPrice(BigDecimal.ZERO);
                    return dto;
                }
            }
        } catch (Exception e) {
            log.debug("Open Library lookup failed for ISBN {}: {}", isbn, e.getMessage());
        }
        return null;
    }

    private String httpGet(String urlStr, int timeoutMs) throws Exception {
        URL url = URI.create(urlStr).toURL();
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(timeoutMs);
        conn.setReadTimeout(timeoutMs);
        conn.setRequestProperty("User-Agent", "Mozilla/5.0 SortManager/1.8.0");
        int code = conn.getResponseCode();
        if (code == 200) {
            try (InputStream in = conn.getInputStream()) {
                return new String(in.readAllBytes(), StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}
