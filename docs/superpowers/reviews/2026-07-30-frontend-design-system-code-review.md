# 前端设计系统刷新代码审查

- 日期：2026-07-30
- 分支：`codex/frontend-design-system-refresh`
- 审查范围：Web 前端全部页面、共享组件、样式系统、响应式布局、依赖与真实全栈交互
- 结论：通过，可合并

## 审查结论

本次变更没有发现阻塞合并的功能、安全、可访问性或架构问题。

- P0 / Critical：0
- P1 / High：0
- P2 / Medium：0
- P3 / Low：0
- 已记录依赖适用性例外：1

审查期间发现并修复了一个通知浮层拦截后续按钮点击的问题。被动通知现使用
`pointer-events: none`，并增加设计系统契约测试防止回归。弹窗键盘关闭逻辑也改用
React 19 Effect Event，确保输入时不会因为父组件重新渲染而反复抢占焦点。

## 设计与组件一致性

- 完全移除深色模式运行时、主题切换按钮、主题 Context 和主题选择器。
- 建立唯一浅色语义令牌层：纸灰画布、白色表面、墨色文本、竹青主色、琥珀档案标签和危险红。
- 建立 `tokens / base / layout / components / pages` 五层样式入口。
- 新增并复用 Button、Card、FormField、PageHeader、Pagination、Skeleton、
  StatusBadge、Toolbar 等共享组件。
- 登录、总览、物品、批量录入、分类、位置、家庭成员和家庭运营页面统一为“家庭档案柜”视觉语言。
- 清理页面 JSX 中的表现型内联样式；动态分类色和进度仅通过具名 CSS 自定义属性传递。
- 清理旧紫色产品样式、`transition: all` 和非语义硬编码颜色。
- 保留的 `!important` 仅用于第三方通知样式覆盖和系统“减少动态效果”可访问性规则。

## 可访问性与响应式

- 页面保持单一 H1，交互控件最小高度为 44px。
- 补充可见焦点、语义按钮、展开状态、对话框标注、Escape 关闭、初始焦点与焦点返回。
- FormField 为控件统一生成 label、required、describedby 和 invalid 关联。
- 已检查 375、768、1024、1440 四档视口；7 条主要路由共 28 个组合均无横向溢出。
- 浏览器人工检查覆盖登录、移动总览、桌面物品和家庭运营页面。

## 验证证据

- `npm run test:unit`：18 / 18 通过。
- `npm run lint`：通过，0 error，0 warning。
- `npm run build`：通过，Vite 转换 1843 个模块并成功生成 PWA 资源。
- `npx playwright test`：11 / 11 通过。
  - 桌面：认证、成员管理、会话撤销、批量录入、看板、物品增删查、筛选分页、回收站。
  - 移动：登录与看板、批量录入、家庭运营与回收站、横向溢出检查。
- `git diff --check`：通过。
- 源码扫描：无主题运行时、调试日志、`dangerouslySetInnerHTML`、`transition: all`
  或样式层之外的产品颜色硬编码。

## 依赖安全适用性例外

`npm audit --audit-level=high` 报告 React Router 的
`GHSA-qwww-vcr4-c8h2`（RSC Mode CSRF Bypass），对应 2 个 high 计数。

本项目使用 Vite + React 的纯客户端 `BrowserRouter`，没有 React Server
Components、Server Actions、React Router RSC Mode 或服务端路由动作，因此不存在该公告要求的攻击面。
当前使用最新可用的 `react-router-dom 7.18.2`。审计建议强制降级到 7.11.0，
但该版本会重新引入多项更早的 Router 公告，因此不采用降级方案。后续上游发布无该公告的版本后应直接升级。

同时通过 `overrides` 将 `brace-expansion` 固定到 5.0.8，并确认 PostCSS 为
8.5.25、Vite PWA 为 1.3.0。

## 架构判断

当前 React 19 + Vite + 共享组件 + 语义 CSS 变量架构适合个人家庭物品管理应用，
无需更换前端框架或引入大型 UI 库。样式层仍保留一部分旧页面选择器作为兼容层，
但产品色、交互规则和最终视觉已由语义令牌统一管理；未来新增页面应直接使用共享 UI 原语，
避免继续扩展兼容选择器。
