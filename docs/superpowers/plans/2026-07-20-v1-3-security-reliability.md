# Sort Manager v1.3 安全与可靠性升级实施计划

**日期：** 2026-07-20
**依据：** `docs/superpowers/specs/2026-07-20-v1-3-security-reliability-design.md`

## 任务 1：配置化 CORS 白名单

**文件：**
- 新增：`backend/src/test/java/com/sort/manager/config/WebConfigTest.java`
- 修改：`backend/src/main/java/com/sort/manager/config/WebConfig.java`
- 修改：`backend/src/main/resources/application.yml`
- 修改：`.env.example`

**步骤：**
1. 先编写 MockMvc 预检请求测试，断言已配置来源可访问、未知来源被拒绝。
2. 运行该测试并确认旧的通配配置导致失败。
3. 实现逗号分隔的 `APP_CORS_ALLOWED_ORIGINS` 精确白名单。
4. 重跑 CORS 测试和后端全量测试。

## 任务 2：用 Flyway 管理数据库结构

**文件：**
- 修改：`backend/pom.xml`
- 新增：`backend/src/main/resources/db/migration/V1__create_core_schema.sql`
- 新增：`backend/src/main/resources/db/migration/V2__add_constraints_and_indexes.sql`
- 新增：`backend/src/test/java/com/sort/manager/config/FlywayMigrationTest.java`
- 修改：`backend/src/main/resources/application.yml`
- 修改：`backend/src/test/resources/application-test.yml`
- 修改：`database/init.sql`

**步骤：**
1. 先编写 Flyway API 测试，覆盖空库从零迁移与模拟现有非空库 baseline 后保留数据升级。
2. 运行测试并确认缺少迁移/依赖时失败。
3. 加入 Flyway Core/MySQL 模块、V1 基础结构和 V2 唯一约束及查询索引。
4. 将 Hibernate 默认模式改为 `validate`，测试 profile 禁用自动 Flyway。
5. 备份本机现有库后启动新版后端，确认 6 条现有物品数据不丢失且迁移记录正确。

## 任务 3：消除前端高危依赖公告

**文件：**
- 修改：`frontend/package.json`
- 修改：`frontend/package-lock.json`

**步骤：**
1. 运行 `npm audit --audit-level=high` 记录红灯基线。
2. 分批升级 Axios、React Router、Vite/React 插件和 PWA 插件，不使用 `--force`。
3. 每批运行 audit、lint 和生产构建。
4. 更新 `allowScripts` 中与实际 lockfile 对应的 esbuild 版本。

## 任务 4：增加真实全栈 Playwright 回归

**文件：**
- 新增：`frontend/playwright.config.js`
- 新增：`frontend/e2e/items.spec.js`
- 修改：`frontend/package.json`
- 修改：`.github/workflows/ci.yml`

**步骤：**
1. 先编写三个核心流程：页面及统计加载、物品新增/搜索/删除、状态筛选与分页。
2. 运行测试并确认在缺少配置或服务时失败。
3. 配置 Playwright 前端服务、失败截图/trace 和唯一测试数据清理。
4. 在 CI 中加入 MySQL 服务、真实后端 JAR 启动、Chromium 安装与 E2E 执行。
5. 本机真实 MySQL 全栈运行并通过全部用例。

## 任务 5：版本、文档和启动可靠性

**文件：**
- 修改：`backend/pom.xml`
- 修改：`frontend/package.json`
- 修改：`start.bat`
- 修改：`README.md`
- 修改：`frontend/README.md`
- 新增：`docs/adr/0001-v1-3-security-reliability.md`
- 新增：`docs/releases/v1.3.0.md`

**步骤：**
1. 版本升级为 1.3.0，并固定稳定 JAR 名 `target/manager.jar`。
2. 记录 Flyway baseline、CORS 和 E2E 使用方式。
3. 补充 ADR 与发布说明，并明确本机密钥/测试产物禁止提交。

## 任务 6：审查、验证与提交

1. 执行后端全量测试与打包、前端 audit/lint/build、真实全栈 E2E。
2. 按 code-review skill 进行 ADR 合规、安全、正确性、测试和依赖审查。
3. 修复所有 P0/P1/P2 问题并重跑相关门禁。
4. 检查 staged diff，只纳入 v1.3 代码和可移植环境配置；排除 `.env*` 密钥、`.desktop-capture.png` 和用户 SVG。
5. 创建本地 Git 提交。
