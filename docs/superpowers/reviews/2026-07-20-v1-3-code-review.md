# v1.3 代码审查报告

**日期：** 2026-07-20
**基线：** `caf59a7` / v1.2.0
**架构依据：** ADR 0001、v1.3 安全与可靠性设计

## 结论

通过，可以提交。Critical 0、High 0、Medium 0、Low 0。

## 已发现并修复

- CI 文档声明依赖审计为门禁，但最初的 frontend job 只运行 lint/build。已补充 `npm audit --audit-level=high`，使 CI 与 ADR 和本地 `verify` 一致。
- 示例数据脚本首次验证暴露 Windows 管道编码风险。已恢复迁移前原始行数，改用 `--default-character-set=utf8mb4` 的文档命令，并验证脚本连续执行两次仍保持 10/10/6。

## 审查维度

- **ADR 合规：** CORS、Flyway、Vite 7、Playwright 和范围边界均符合 ADR 0001，无未记录架构漂移。
- **安全：** 依赖审计 0 漏洞；CORS 不再接受通配符；仓库变更未包含本机 `.env`、管理员凭据或真实密钥。
- **数据库：** 空库和 baseline 升级自动化测试通过；本机 MySQL 升级前已备份，升级后仍为 10 分类、10 位置、6 物品，Flyway V2 成功。
- **正确性：** 后端 19 项测试通过；Playwright 3 条真实全栈流程通过；示例数据脚本已验证幂等。
- **前端：** lint、Vite 7 生产构建和 PWA 产物生成通过；新增 label 关联改善表单可访问性与测试稳定性。
- **CI：** YAML 可解析；MySQL 8.4、后端 JAR readiness、Chromium 和失败诊断产物链路完整。
- **提交边界：** `.desktop-capture.png` 和三个用户 SVG 明确排除；本机密钥、构建目录、Playwright 产物均忽略。

## 已执行门禁

- `mvn clean test`：19 passed
- `npm run verify`：audit 0、lint passed、build passed
- `npm run test:e2e`：3 passed
- MySQL 实库：baseline 1、V2 success；业务数据 10/10/6
- `git diff --check`：无错误
- CI YAML 和 package-lock 版本检查：通过
