# v1.5 实施计划

## 1. 批量录入后端（TDD）

1. 新增批量请求/响应 DTO 与 `ItemBatchServiceTest`，先覆盖上限、逐行错误、跨家庭关联、零部分写入和成功创建。
2. 实现 `ItemBatchService`，批量加载当前家庭分类/位置，严格解析日期并在单事务中 `saveAll`。
3. 在 `ItemController` 暴露 `POST /api/v1/items/batch`，补充 MockMvc 认证与请求校验测试。

## 2. Web 批量工作台（TDD）

1. 新增 CSV/TSV 解析工具及 Node 单元测试，覆盖引号、空行、表头和 100 行限制。
2. 新增 `BulkItems.jsx`、行编辑组件和 API 方法；支持粘贴、CSV、模板、草稿、预检与提交。
3. 接入路由、物品页入口和桌面导航；移动端使用卡片布局且不增加第六个底部 tab。
4. 增加 Playwright 批量录入桌面/移动用例。

## 3. 微信小程序基础版

1. 建立 `miniapp/` 原生工程、示例配置、请求与认证层。
2. 实现登录、总览、物品分页搜索、快速新增、我的/退出页面。
3. 增加脚本语法检查和 README，CI 执行 `node --check`。

## 4. 发布与验收

1. 版本升级至 1.5.0，更新根 README、前端 README、环境示例和发布说明。
2. 执行 Maven 全测/打包、前端 verify、Playwright、真实 MySQL API 联调和小程序脚本检查。
3. 按 ADR 0003 运行全栈 `/code-review`；修复全部 Critical/High，记录审查结论后精确暂存并提交 Git。
