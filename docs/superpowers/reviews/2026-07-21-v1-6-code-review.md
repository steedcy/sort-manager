# v1.6 最终代码审查记录

日期：2026-07-21
结论：PASS，无 P0/P1 提交阻断

## ADR Gate

- ADR 0004 状态为 Accepted。
- 实现保持 ADR 选定的混合方案：物品软删除、同事务只追加审计、OWNER 家庭运营视图、应用外加密备份与只读状态接入。
- 未引入事件溯源、微服务或应用内恢复权限，未偏离已接受架构。

## 首轮审查发现及处置

### 后端

- 修复分类/位置聚合 JOIN 未再次限定 item 家庭 ID；加入跨家庭脏引用、活动/软删除数据的真实仓储测试。
- 将会话撤销从 mock 验证升级为真实登录、刷新令牌、OWNER 端点及旧令牌 401 的集成验收。
- 拒绝未来的 `lastVerifiedAt`，避免损坏状态被误报为健康。
- 分类/位置仍被活动或回收站物品引用时给出业务错误；位置有子节点时禁止直接删除。

### Web

- E2E 捕获 UI 创建的物品 ID，软删除后执行永久清理，并断言物品、分类和位置清理响应。
- 375px 用例覆盖运营筛选、恢复、永久删除确认和成员会话撤销，而不只检查布局。
- 加入请求序号防止旧响应覆盖新筛选；加载期间锁定筛选/分页；最后页清空时回退页码。
- Operations 请求关闭全局重复 Toast；初始备份状态显示读取中；确认弹窗加入焦点循环和关闭后焦点恢复。

### 小程序、备份与发布

- 恢复应用前查询 `information_schema`，明确拒绝非空目标数据库。
- 无上传图片的家庭可以完成验证和应用恢复；空上传 fixture 已进入往返测试。
- MySQL 子进程不继承备份口令和无关数据库密码环境变量。
- CI 纳入 Web 单元测试；本地备份/截图验证产物加入忽略规则；README 与升级说明同步实际行为。

## 最终验证

- Backend：63/63。
- Web unit：13/13；ESLint、Vite production build 通过。
- Full-stack Playwright：11/11，使用本机 MySQL 8、v1.6.0 packaged JAR、桌面 Chromium 与 375×812 mobile Chromium。
- Mini Program：13/13，JavaScript/JSON check 通过。
- Operations：5 个 PowerShell 脚本语法通过；加密往返、篡改拒绝、空上传、明文清理通过。
- Real recovery：真实 MySQL 加密备份验证通过；恢复到空隔离库得到 9 张表和 0 个上传文件；非空目标库被拒绝。
- Visual QA：1440px desktop 与 375×812 mobile 通过。
- `git diff --check`：通过。

本机对 npm advisory 接口的后续复核因 TLS 连接中断无法再次完成；本轮早期完整 Web verify 的 audit 结果为 0，CI 仍保留 `npm audit --audit-level=high` 门禁。

## 非阻断后续硬化

- 把分类/位置引用检查与删除的并发窗口收敛到数据库 RESTRICT 或锁定策略。
- 增加“审计写入失败时业务同步回滚”的故障注入集成测试。
- 统一业务 Clock，合并重复 active repository 查询。
- 弹窗 busy 状态可进一步把焦点移到 dialog 容器。
