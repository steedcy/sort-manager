# v1.5 最终代码审查记录

日期：2026-07-21

范围：后端批量接口、PC 批量录入、小程序基础版、认证会话、CI 与发布文档

ADR：`docs/adr/0003-v1-5-bulk-entry-and-mini-program.md`（Accepted）

## 结论

三轮审查后放行：Critical 0，High 0。

- 后端：批量预检 fail-closed，数据库边界与家庭隔离一致；无逐行关联查询；真实数据库约束失败可整批回滚。
- Web：请求期间冻结编辑；CSV 表头采用高置信识别；位置使用稳定路径和 ID；草稿按用户与家庭隔离。
- 小程序：并发 401 只刷新一次；退出立即使本地刷新失效；服务端按 token family 撤销整个会话族。
- 发布：版本统一为 1.5.0，本地配置和凭据保持忽略，CI 覆盖后端、Web、小程序与全栈 E2E。

## 自动化证据

- 后端：`mvn test`，45/45 通过。
- Web：`npm run verify`，依赖漏洞 0，单元测试 9/9、ESLint、生产构建通过。
- 小程序：`npm test` 10/10；`npm run check` 通过。
- Playwright + MySQL：桌面与 375 px 移动端 8/8 通过。
- MySQL API 冒烟：fail-closed、边界逐行错误、无部分写入、正式批量写入与清理、匿名退出撤销均通过。
- `git diff --check`：通过。

## 非阻塞后续项

- 接入微信开发者工具 CLI，补充 WXML/WXSS 的真实编译门禁与真机测试。
- 在后续版本增强草稿离开页面前的最后一次同步刷新，并继续推进 `.xlsx`、扫码或 OCR 等高级录入能力。
