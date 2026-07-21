package com.sort.manager.service;

import com.sort.manager.dto.ItemDTO;
import com.sort.manager.dto.PageResponse;
import com.sort.manager.entity.Category;
import com.sort.manager.entity.Item;
import com.sort.manager.entity.Location;
import com.sort.manager.repository.CategoryRepository;
import com.sort.manager.repository.ItemRepository;
import com.sort.manager.repository.LocationRepository;
import com.sort.manager.security.CurrentHousehold;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ItemServicePaginationTest {

    @MockBean
    private CurrentHousehold currentHousehold;

    @Autowired
    private ItemService itemService;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationRepository locationRepository;

    private Category tools;
    private Category food;
    private Location cabinet;
    private Location fridge;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.when(currentHousehold.requireHouseholdId()).thenReturn(1L);
        itemRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();

        tools = categoryRepository.save(category("Tools", "🔧", "#2563eb"));
        food = categoryRepository.save(category("Food", "🍎", "#16a34a"));
        cabinet = locationRepository.save(location("Cabinet"));
        fridge = locationRepository.save(location("Fridge"));

        itemRepository.save(item("Cordless Drill", "garage power tool", tools, cabinet, 1, "2026-07-01", null));
        itemRepository.save(item("Rice", "pantry staple", food, cabinet, 3, "2026-07-02", LocalDate.now().plusDays(60)));
        itemRepository.save(item("Yogurt", "breakfast dairy", food, fridge, 5, "2026-07-03", LocalDate.now().plusDays(7)));
        itemRepository.save(item("Expired Milk", "old dairy", food, fridge, 1, "2026-07-04", LocalDate.now().minusDays(1)));
        itemRepository.save(item("Screwdriver", "small hand tool", tools, cabinet, 2, "2026-07-05", null));
    }

    @Test
    void searchReturnsRequestedPageWithMetadata() {
        PageResponse<ItemDTO> page = itemService.search(null, null, null, null, 0, 2, "createdAt", "desc");

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getPage()).isZero();
        assertThat(page.getSize()).isEqualTo(2);
        assertThat(page.getTotalElements()).isEqualTo(5);
        assertThat(page.getTotalPages()).isEqualTo(3);
        assertThat(page.isFirst()).isTrue();
        assertThat(page.isLast()).isFalse();
        assertThat(page.isEmpty()).isFalse();
    }

    @Test
    void searchReturnsEmptyPageWhenNoItemsExist() {
        itemRepository.deleteAll();

        PageResponse<ItemDTO> page = itemService.search(null, null, null, null, 0, 12, "createdAt", "desc");

        assertThat(page.getContent()).isEmpty();
        assertThat(page.getTotalElements()).isZero();
        assertThat(page.getTotalPages()).isZero();
        assertThat(page.isEmpty()).isTrue();
    }

    @Test
    void searchUsesDefaultSortWhenSortIsMissing() {
        PageResponse<ItemDTO> page = itemService.search(null, null, null, null, 0, 2, null, null);

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isEqualTo(5);
    }

    @Test
    void searchMatchesKeywordAgainstNameAndDescription() {
        PageResponse<ItemDTO> page = itemService.search("dairy", null, null, null, 0, 12, "name", "asc");

        assertThat(page.getContent())
                .extracting(ItemDTO::getName)
                .containsExactly("Expired Milk", "Yogurt");
    }

    @Test
    void searchFiltersByCategoryLocationAndExpiringStatus() {
        PageResponse<ItemDTO> page = itemService.search(null, food.getId(), fridge.getId(), "expiring", 0, 12, "createdAt", "desc");

        assertThat(page.getContent())
                .extracting(ItemDTO::getName)
                .containsExactly("Yogurt");
    }

    @Test
    void searchNormalStatusExcludesExpiredAndExpiringItems() {
        PageResponse<ItemDTO> page = itemService.search(null, food.getId(), null, "normal", 0, 12, "name", "asc");

        assertThat(page.getContent())
                .extracting(ItemDTO::getName)
                .containsExactly("Rice");
    }

    @Test
    void searchFallsBackToCreatedAtWhenSortIsNotAllowed() {
        PageResponse<ItemDTO> page = itemService.search(null, null, null, null, 0, 3, "category.name", "asc");

        assertThat(page.getContent())
                .extracting(ItemDTO::getName)
                .containsExactly("Cordless Drill", "Rice", "Yogurt");
    }

    private Category category(String name, String icon, String color) {
        Category category = new Category();
        category.setHouseholdId(1L);
        category.setName(name);
        category.setIcon(icon);
        category.setColor(color);
        return category;
    }

    private Location location(String name) {
        Location location = new Location();
        location.setHouseholdId(1L);
        location.setName(name);
        return location;
    }

    private Item item(String name, String description, Category category, Location location, int quantity, String purchaseDate, LocalDate expiryDate) {
        Item item = new Item();
        item.setHouseholdId(1L);
        item.setName(name);
        item.setDescription(description);
        item.setCategory(category);
        item.setLocation(location);
        item.setQuantity(quantity);
        item.setPrice(BigDecimal.TEN);
        item.setPurchaseDate(LocalDate.parse(purchaseDate));
        item.setExpiryDate(expiryDate);
        return item;
    }
}
