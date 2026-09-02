# ISBN 图书扫码与查询 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为书籍物品提供有效 ISBN 条码识别、服务端多源查询缓存和可编辑的图书元数据。

**Architecture:** Spring Boot 的图书查询模块隔离 ISBN 规则、外部客户端与持久化缓存；物品图书字段以一对一扩展表保存。React 和原生小程序只调用内部图书 API，Web 使用原生条码检测且保留手输降级。

**Tech Stack:** Java 17, Spring Boot 3.3, JPA, Flyway, MySQL, JUnit 5, React 19, Vite, Node test, WeChat Mini Program API.

**Spec:** `docs/superpowers/specs/2026-08-31-isbn-book-lookup-design.md`

## Global Constraints

- 不使用豆瓣 API、镜像服务或网页抓取。
- ISBN-13 是唯一缓存键；只接受 `978` 或 `979` 前缀的 EAN-13。
- Google Books Key 只能由 `GOOGLE_BOOKS_API_KEY` 服务端环境变量读取。
- 成功缓存 30 天、未找到缓存 24 小时；手工改写不会被查询覆盖。
- 所有外部 I/O 设置 6 秒超时，所有自动化测试 Mock 外部 I/O。

---

### Task 1: ISBN 规范化工具与图书传输模型

**Files:**
- Create: `backend/src/main/java/com/sort/manager/book/IsbnUtils.java`
- Create: `backend/src/main/java/com/sort/manager/book/BookMetadata.java`
- Test: `backend/src/test/java/com/sort/manager/book/IsbnUtilsTest.java`

**Interfaces:**
- Produces: `IsbnUtils.normalizeToIsbn13(String): NormalizedIsbn`，其中包含 `isbn13` 和可选 `isbn10`；`BookMetadata` 作为所有来源的统一结果。

- [ ] **Step 1: 写 ISBN-13、ISBN-10、连字符输入和非图书 EAN 的失败测试。**
- [ ] **Step 2: 运行 `mvn -Dtest=IsbnUtilsTest test`，确认因类尚不存在而失败。**
- [ ] **Step 3: 实现校验位、ISBN-10 转换、规范化和不可变模型。**
- [ ] **Step 4: 再次运行同一命令，确认测试通过。**

### Task 2: 图书缓存、外部客户端与安全 API

**Files:**
- Create: `backend/src/main/java/com/sort/manager/book/BookLookupCache.java`
- Create: `backend/src/main/java/com/sort/manager/book/BookLookupCacheRepository.java`
- Create: `backend/src/main/java/com/sort/manager/book/BookLookupClient.java`
- Create: `backend/src/main/java/com/sort/manager/book/GoogleBooksClient.java`
- Create: `backend/src/main/java/com/sort/manager/book/OpenLibraryClient.java`
- Modify: `backend/src/main/java/com/sort/manager/service/IsbnBookService.java`
- Create: `backend/src/main/java/com/sort/manager/controller/BookController.java`
- Create: `backend/src/main/resources/db/migration/V6__add_book_metadata_and_lookup_cache.sql`
- Test: `backend/src/test/java/com/sort/manager/service/IsbnBookServiceTest.java`

**Interfaces:**
- Consumes: `IsbnUtils.normalizeToIsbn13` and `BookMetadata`.
- Produces: `GET /api/v1/books/isbn/{isbn}` and `BookLookupResult` with `cached` status.

- [ ] **Step 1: 写缓存命中、Google 精确匹配、Google 无结果降级 Open Library、双无结果和超时失败的测试。**
- [ ] **Step 2: 运行 `mvn -Dtest=IsbnBookServiceTest test`，确认失败。**
- [ ] **Step 3: 仅实现缓存实体/迁移、可注入 HTTP 客户端、Google/Open Library 解析和错误映射以通过测试。**
- [ ] **Step 4: 运行该测试与 `mvn test`，确认通过。**

### Task 3: 物品图书扩展字段与保存规则

**Files:**
- Create: `backend/src/main/java/com/sort/manager/entity/BookMetadataEntity.java`
- Create: `backend/src/main/java/com/sort/manager/repository/BookMetadataRepository.java`
- Modify: `backend/src/main/java/com/sort/manager/entity/Item.java`
- Modify: `backend/src/main/java/com/sort/manager/dto/ItemDTO.java`
- Modify: `backend/src/main/java/com/sort/manager/service/ItemService.java`
- Test: `backend/src/test/java/com/sort/manager/service/ItemServiceTest.java`

**Interfaces:**
- Consumes: `BookMetadata` 查询结果映射到 `ItemDTO.bookMetadata`。
- Produces: 图书字段在创建、读取和显式编辑时持久化；外部查询不会写物品表。

- [ ] **Step 1: 写保存图书字段及外部空字段不能覆盖已有手填字段的测试。**
- [ ] **Step 2: 运行 `mvn -Dtest=ItemServiceTest test`，确认新增断言失败。**
- [ ] **Step 3: 添加一对一映射和 DTO 映射，按非空/显式提交规则保存。**
- [ ] **Step 4: 重跑测试并执行 Flyway 迁移测试。**

### Task 4: Web 表单、扫码与请求取消

**Files:**
- Create: `frontend/src/utils/bookMetadata.js`
- Create: `frontend/src/utils/bookMetadata.test.js`
- Create: `frontend/src/components/BookBarcodeScanner.jsx`
- Modify: `frontend/src/api/index.js`
- Modify: `frontend/src/pages/Items.jsx`

**Interfaces:**
- Consumes: `/books/isbn/{isbn}` 响应和浏览器 `BarcodeDetector`。
- Produces: 仅书籍分类可见的扫描/重试/手输界面及非空字段合并函数 `mergeBookMetadata`。

- [ ] **Step 1: 写 `mergeBookMetadata` 不以空外部字段覆盖手填内容的失败测试。**
- [ ] **Step 2: 运行 `npm run test:unit`，确认新增测试失败。**
- [ ] **Step 3: 实现最小合并工具、API 的 AbortSignal 支持、扫码组件和编辑/新增表单字段。**
- [ ] **Step 4: 执行 `npm run test:unit && npm run lint && npm run build`。**

### Task 5: 小程序录入与部署文档

**Files:**
- Modify: `miniapp/pages/items/index.js`
- Modify: `miniapp/pages/add/index.js`
- Modify: `miniapp/pages/add/index.wxml`
- Test: `miniapp/tests/item-data.test.js`
- Modify: `.env.example`
- Modify: `docker-compose.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: `/books/isbn/{isbn}` 和从 `wx.scanCode` 取得的条码。
- Produces: 可手工补录的新增页预填值，以及服务端 Google Key 配置说明。

- [ ] **Step 1: 写扫码识别结果映射到实际新增页且失败时保留 ISBN 的失败测试。**
- [ ] **Step 2: 运行 `npm test`（在 `miniapp`）确认失败。**
- [ ] **Step 3: 实现查询、预填、错误降级和环境变量/Compose/README 文档。**
- [ ] **Step 4: 运行小程序测试与 `npm run check`。**

### Task 6: 端到端验证和回归检查

**Files:**
- Modify: `frontend/e2e/item-management.spec.js`

- [ ] **Step 1: 添加 Mock 图书 API 的 Web 表单预填与手动编辑场景。**
- [ ] **Step 2: 运行后端 `mvn test`、前端 `npm run verify`、小程序 `npm test` 与 `npm run check`。**
- [ ] **Step 3: 审查 `git diff --check`、环境变量不含真实 Key，并记录 NAS `docker compose up -d --build` 验证命令。**
