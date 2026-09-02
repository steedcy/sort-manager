# ISBN 图书扫码与查询设计

## 背景与目标

现有 v1.8.0 功能仅在 Web 中提供 ISBN 手输框，使用已被 Cloudflare 拦截的豆瓣镜像，且没有 ISBN 校验、缓存或图书专属数据模型。目标是在不影响既有物品管理的前提下，让书籍物品可扫描 EAN-13/ISBN 条码、可靠查询并可手工补录。

## 架构

后端提供 `GET /api/v1/books/isbn/{isbn}`。入口首先用独立 `IsbnUtils` 将输入规范化为 ISBN-13；然后依次读取持久化查询缓存、调用 Google Books、调用 Open Library，并将外部响应转换为 `BookMetadata`。只缓存已标准化 ISBN-13；成功缓存 30 天、未找到缓存 24 小时。服务端负责 API Key、超时、User-Agent 与错误归一化，浏览器和小程序均不直接访问第三方服务。

物品继续保留通用字段；新增一对一 `book_metadata` 表保存 ISBN、作者、出版社、出版日期、简介、页数、语言、分类、封面、来源和“已手工编辑”标记。创建/编辑物品时书籍字段由 `ItemDTO` 透传；后端的更新逻辑只在客户端显式提交时写入，外部查询绝不覆盖已有记录。

Web 的物品弹窗中，仅在分类为“书籍/图书”时显示 ISBN 和扫码控件。优先使用原生 `BarcodeDetector`，不可用时仍可输入/粘贴条码；查询使用 `AbortController`，组件卸载或新查询会中止旧请求。小程序保留 `wx.scanCode`，改为跳转实际新增页并携带 ISBN 查询结果。

## 查询、错误与安全

- 禁止使用豆瓣接口、镜像接口和网页抓取。
- Google Books 请求为 `q=isbn:{isbn}`，可选 Key 只能从 `GOOGLE_BOOKS_API_KEY` 环境变量注入；没有 Key 仍可调用免费额度。
- Google 无结果或不可用才调用 Open Library；Open Library 使用含项目名称及联系地址的 User-Agent，且每次外部请求的连接/读取超时为 6 秒。
- 多个 Google 候选按 `industryIdentifiers` 的 ISBN-13/ISBN-10 标准化后精确匹配选取；没有精确命中时只在唯一候选有标题时使用。
- 返回错误为 `INVALID_ISBN`、`BOOK_NOT_FOUND`、`BOOK_SERVICE_UNAVAILABLE`，不得返回第三方原文、堆栈或 Key。
- 封面 URL 改为 HTTPS；Open Library 占位封面不持久化。

## 验收与测试

JUnit 使用注入的 HTTP 客户端 mock 覆盖 ISBN 校验、ISBN-10 转换、Google/Open Library 降级、超时、精确候选、缓存与错误码。React 单元测试覆盖非空字段合并和请求中止行为；小程序测试覆盖扫码结果到实际新增页的映射。外部 API 在测试中不得真实访问。
