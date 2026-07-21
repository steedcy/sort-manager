# Sort Manager 微信小程序

v1.5 基础版提供账号登录、Token 自动刷新、家庭统计总览、物品分页搜索、单件快速录入和退出登录。项目使用原生微信小程序 JavaScript/WXML/WXSS，不依赖跨端框架。

## 本地配置

1. 将 `config.example.js` 复制为 `config.js`。
2. 把 `apiBaseUrl` 改为自有服务器的 `/api/v1` HTTPS 地址；`config.js` 已忽略，不应提交。
3. 使用微信开发者工具导入 `miniapp/`，并将 `project.config.json` 中的测试 AppID 替换为自己的 AppID。
4. 在微信公众平台配置同一 HTTPS 主机为 request 合法域名。生产环境必须使用受信任证书，不要在源码或 URL 中保存 Token。

调试阶段如需访问局域网 HTTP 服务，可在开发者工具中临时关闭“校验合法域名”，此设置不能用于真机发布。

## 验证

```powershell
npm test
npm run check
```

在开发者工具中重点验证：401 后仅刷新一次并重放、下拉刷新、20 条分页、300ms 搜索防抖、快速录入校验，以及底部安全区不遮挡内容。
