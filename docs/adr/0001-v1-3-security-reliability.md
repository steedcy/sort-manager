# ADR 0001：v1.3 采用显式安全与迁移门禁

- 状态：Accepted
- 日期：2026-07-20

## 背景

v1.2 已能完成物品管理核心流程，但前端依赖存在高危公告，后端 CORS 接受任意来源，数据库结构依赖 Hibernate 隐式更新，浏览器层没有真实全栈回归。

## 决策

1. 前端升级到 Vite 7 的兼容依赖组合，并把零 high/critical `npm audit` 作为门禁。
2. API CORS 使用 `APP_CORS_ALLOWED_ORIGINS` 精确白名单，拒绝通配符配置。
3. Flyway 成为数据库结构的唯一演进机制。空库执行 V1/V2，现有非空 v1.2 库以版本 1 baseline 后执行 V2；Hibernate 默认只做 `validate`。
4. Playwright 使用真实 React、Vite 代理、Spring Boot 和 MySQL 覆盖核心流程；CI 保留失败截图、trace、video 和后端日志。
5. 本版本不引入账号鉴权、容器化或业务功能扩展。

## 结果

- 数据库变更可重复、可审计，首次接管必须先备份并检查重复分类名。
- CORS 部署时需要显式列出合法前端来源。
- CI 时间增加，但能发现单元测试无法覆盖的前后端集成回归。
- `database/init.sql` 仅作为可选示例数据，不再负责表结构。
