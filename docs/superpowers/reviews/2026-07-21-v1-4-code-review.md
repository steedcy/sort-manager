# v1.4 前后端代码审查记录

- 日期：2026-07-21
- 分支：`codex/v1-4-family-auth`
- 架构依据：ADR 0002（家庭边界账号与令牌认证）
- 审查范围：后端认证/授权/家庭隔离、前端会话与移动体验、Flyway/CI/发布文档

## 初审阻塞项与修复

1. 停用成员后旧 Access Token 仍可使用：JWT 解码时增加启用用户与家庭成员关系校验，并新增集成测试。
2. 登录失败记录可能无界增长或在容量满后绕过：增加有界容量与饱和窗口 fail-closed 策略，并覆盖容量耗尽场景。
3. 上传异常向客户端暴露内部信息：服务端记录详细日志，客户端仅返回通用错误。
4. 退出、刷新和多标签页令牌轮换存在竞态：增加会话 generation guard、Web Locks 串行化和 storage 退出同步。
5. 受保护图片预览、移动端退出入口与 CSP 缺失：统一使用鉴权 Blob 图片组件，增加移动账号栏与 CSP/生产代理说明。
6. 示例配置包含可直接使用的公开认证占位符：JWT 密钥和首个 OWNER 密码改为空值，启动时 fail-closed。
7. 维护脚本未适配分页、Flyway 文档版本不一致：脚本遍历 PageResponse，文档统一到最终 schema v4。

## 最终审查结果

- 后端安全审查：Critical 0，High 0，放行。
- 前端与 UI/UX 审查：Critical 0，High 0，放行。
- 发布、CI 与数据库审查：Critical 0，High 0，放行。
- 非阻断后续项：生产反向代理增加 IP 级限流；非 Chromium 浏览器增加跨标签锁降级；扩展会话/上传图片 E2E 矩阵。

## 验证证据

- Maven：32 个测试通过；最终安全与迁移回归测试通过。
- 前端：ESLint、Vite production build 通过。
- 依赖：`npm audit --audit-level=high` 为 0 vulnerabilities。
- Playwright：桌面 Chromium 5 项、移动 Chromium 1 项，共 6/6 通过。
- MySQL 8：Flyway v4；分类、位置、物品的空家庭字段合计为 0；家庭分类组合唯一索引存在。
- Git：`git diff --check` 通过；本机密钥、备份、日志与测试产物不进入版本库。
