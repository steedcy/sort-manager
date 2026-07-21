# Sort Manager v1.4 家庭账号与安全访问实施计划

**日期：** 2026-07-21
**依据：** `docs/adr/0002-v1-4-family-authentication.md` 与 `docs/superpowers/specs/2026-07-21-v1-4-family-authentication-design.md`

## 任务 1：迁移与身份模型（TDD）

1. 先扩展 `FlywayMigrationTest`，断言 V3 空库和 v1.3 存量数据回填、组合唯一键及零空家庭列。
2. 新增 V3 身份/家庭/刷新令牌表和业务家庭列、V4 MySQL 类型对齐，更新 `database/init.sql`。
3. 新增用户、家庭、成员、刷新令牌实体与仓库，避免敏感实体使用 Lombok `@Data`。
4. 把 Flyway baseline 默认关闭，仅允许显式环境开关。

## 任务 2：认证、刷新与成员管理（TDD）

1. 先增加登录失败、禁用用户、限流、JWT claims、刷新轮换/重放和成员权限测试。
2. 实现 Spring Security、JWT、BCrypt、刷新令牌哈希/轮换、首次 OWNER 初始化和统一认证错误响应。
3. 实现 `/api/v1/auth/login|refresh|logout|me` 与 OWNER 成员列表、创建、启停接口。
4. 禁用成员时撤销其全部刷新令牌；禁止禁用当前用户和最后 OWNER。

## 任务 3：家庭数据与文件隔离（TDD）

1. 先增加两家庭隔离测试，覆盖同名分类、列表/详情/分页/看板、跨家庭分类/位置引用与删除。
2. 为 Category、Location、Item 增加家庭关联；所有仓库方法和聚合显式接收 `householdId`。
3. 服务仅从认证主体读取家庭 ID，跨家庭 ID 统一返回 404。
4. 上传按家庭目录保存，移除公共静态资源映射，以认证下载端点返回图片。
5. API 控制器统一迁移到 `/api/v1`。

## 任务 4：PC 登录与家庭成员界面

1. 增加 `AuthProvider`、会话存储封装、ProtectedRoute/AppShell 和 Axios 单飞刷新。
2. 实现“家庭柜格索引”登录页：可见标签、autofill、密码显隐、内联错误、loading 和 reduced-motion。
3. 实现 OWNER 成员页面以及角色感知的侧栏/底栏、用户信息与退出。
4. 使用认证 Blob 图片组件替换直接公开图片 URL。
5. 修复 viewport、safe-area、44px 触控区、焦点管理、缺失语义 token 与版本显示。

## 任务 5：CI、E2E、联调和文档

1. Playwright fixture 先登录并给 API 请求注入 Token；增加登录/恢复/退出/成员权限与手机视口测试。
2. CI 设置仅用于测试的 JWT/Bootstrap 环境值，readiness 改为健康端点，真实 MySQL 执行 V3。
3. 本机被忽略的 `.env` 生成强 JWT secret 与首次 OWNER 密码；不输出、不提交。
4. 更新 `.env.example`、README、启动脚本、版本号和 v1.4 发布说明。

## 任务 6：审查、验证与 Git 提交

1. 执行后端单元/集成测试与打包、前端 audit/lint/build、Playwright 桌面/手机、真实 MySQL 迁移和冒烟。
2. 按 code-review skill 对 ADR 一致性、认证、令牌、家庭隔离、文件访问、异常脱敏、UI 无障碍和测试充分性逐项审查。
3. 修复所有 P0/P1/P2 问题并重跑相关门禁；执行 secret scan 和 staged diff 检查。
4. 排除本地 `.env*`、数据库备份、测试产物和用户未跟踪图片/SVG，创建 v1.4 本地 Git 提交。
