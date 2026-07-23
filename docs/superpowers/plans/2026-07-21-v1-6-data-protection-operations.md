# v1.6 实施计划

## 1. 数据模型与审计基础

1. 先写 Flyway V5 迁移测试，再增加软删除字段、`audit_event` 表和索引。
2. 先写审计服务单元/集成测试，再实现只追加、家庭隔离的审计写入与分页读取。
3. 把审计接入物品、批量录入和成员操作，验证业务事务失败时无日志残留。

## 2. 回收站与会话治理

1. 先写软删除、恢复、永久删除、跨家庭与角色权限测试，再修改 Item repository/service/controller。
2. 新增 `/api/v1/operations/recycle-bin`、restore、permanent-delete 和 activity/summary API。
3. 为 OWNER 新增成员会话撤销端点，并验证旧 refresh token 立即失效。

## 3. 聚合与健康状态

1. 用 repository projection/聚合查询替换 Dashboard 全量加载、分类逐项 count 和位置逐项 count。
2. 增加备份状态读取器，覆盖缺失、损坏、过期和健康状态。
3. 增加运营摘要测试和 SQL 查询边界验证。

## 4. Web 与小程序

1. 先增加 API/工具测试和 Playwright 场景，再实现 `/operations` 页面、运行纸带、回收站和成员会话操作。
2. 更新 Items 删除文案与反馈为“移入回收站”，看板增加 OWNER 运营入口。
3. 小程序个人页展示家庭保护摘要和运营入口说明，不扩展底部导航。

## 5. 备份、CI 与发布

1. 先写可自动运行的加密往返/篡改拒绝测试，再实现 `ops/backup.ps1` 与 `ops/restore-backup.ps1`。
2. 更新 `.env.example`、README、部署/恢复手册、CI 和 v1.6 发布说明。
3. 运行后端、Web、小程序、脚本、真实 MySQL、桌面/375px E2E，并检查无凭据和本机备份进入 Git。

## 6. 审查与交付

1. ADR Gate 使用 ADR 0004 与本规格作为上下文。
2. 分别审查后端数据安全、Web/UI、小程序/运维发布；修复所有 Critical/High 后复审。
3. 输出最终 review、全模块进度与后续路线，提交 `feat: release v1.6 data protection and household operations`。
