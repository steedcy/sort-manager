# 功能模块扩展与部署实施计划

本计划涵盖以下 6 项新增功能的完整实现与落地：
1. **Docker Compose 一键无依赖部署**（高优先级）
2. **临期与低库存物品告警提醒**
3. **微信免密登录与家庭协同**
4. **IndexedDB 离线模式与暂存自动同步**
5. **数据导出与资产报表 (.xlsx / 打印 PDF)**
6. **虚拟滚动 (Virtual Scrolling) 性能优化**

---

## 阶段一：Docker Compose 一键无依赖部署（高优先级）

### 变更目标
提供零依赖的完整容器化部署方案，通过单条命令 `docker compose up -d` 启动 MySQL 8.4、后端 Spring Boot API 服务与前端 Nginx 网页服务。

### 详细变更计划

#### [NEW] [backend/Dockerfile](file:///c:/Users/Administrator/Desktop/sort/sort-manager/backend/Dockerfile)
- 采用多阶段构建（Stage 1: Maven 编译打包，Stage 2: Eclipse Temurin JDK 17 / OpenJDK 运行）
- 暴露 `8080` 端口，配置 JRE 运行参数与时区 `Asia/Shanghai`

#### [NEW] [frontend/nginx.conf](file:///c:/Users/Administrator/Desktop/sort/sort-manager/frontend/nginx.conf)
- 配置 Nginx 监听 `80` 端口，开启 Gzip 压缩
- 静态文件路径指向 `/usr/share/nginx/html`，支持 Single Page App 路由 (`try_files $uri $uri/ /index.html`)
- 反向代理 `/api/` 请求至后端容器 `http://backend:8080/api/`，正确传递 `Host` 与 `X-Real-IP`

#### [NEW] [frontend/Dockerfile](file:///c:/Users/Administrator/Desktop/sort/sort-manager/frontend/Dockerfile)
- 多阶段构建（Stage 1: Node.js 20+ npm build，Stage 2: Nginx alpine 镜像）
- 复制打包产物 `dist/` 与 `nginx.conf` 到容器中

#### [NEW] [docker-compose.yml](file:///c:/Users/Administrator/Desktop/sort/sort-manager/docker-compose.yml)
- 编排 3 个核心服务：
  1. `db`: `mysql:8.4` 镜像，配置数据库名 `sort_manager`、存储卷 `mysql_data` 持久化与 `mysqladmin ping` 健康检查
  2. `backend`: 依赖 `db` (condition: `service_healthy`)，配置环境变量 `DB_URL`、`APP_JWT_SECRET`
  3. `frontend`: 依赖 `backend`，映射主机 `80:80` 端口

---

## 阶段二：临期与低库存物品告警提醒

### 变更目标
在物品卡片、表格以及仪表盘中，针对低库存物品（如数量 ≤ 2 或指定阈值）、临期物品（30天内到期）和已过期物品，显示显著的告警状态标签，方便用户快速识别警示信息。

### 详细变更计划

#### [MODIFY] [ItemDTO.java](file:///c:/Users/Administrator/Desktop/sort/sort-manager/backend/src/main/java/com/sort/manager/dto/ItemDTO.java) & [ItemService.java](file:///c:/Users/Administrator/Desktop/sort/sort-manager/backend/src/main/java/com/sort/manager/service/ItemService.java)
- 在 `ItemDTO` 中增加 `isLowStock` 属性标识（当 `quantity <= 2` 时判定为低库存）。
- 在物品状态计算逻辑中，结合到期状态（过期/临期/正常）与低库存标识，确保后端返回精确的状态元数据。

#### [MODIFY] [Items.jsx](file:///c:/Users/Administrator/Desktop/sort/sort-manager/frontend/src/pages/Items.jsx) & [Dashboard.jsx](file:///c:/Users/Administrator/Desktop/sort/sort-manager/frontend/src/pages/Dashboard.jsx)
- 在物品卡片头部与列表中强化标签显示：
  - 🔴 **已过期** (`tone="danger"`)
  - 🟡 **临期** (`tone="warning"`)
  - 🟠 **低库存** (新增 `tone="warning"` 提醒标签，提示 `低库存 ×N`)
- 在仪表盘首页增加“预警物品”快速卡片。

---

## 阶段三：微信免密登录与家庭协同

### 变更目标
在微信小程序端 (`miniapp/`) 实现 `wx.login` 免密授权一键登录，并支持生成家庭邀请码/绑定邀请码快速加入现有家庭空间。

### 详细变更计划

#### [MODIFY] [AuthController.java](file:///c:/Users/Administrator/Desktop/sort/sort-manager/backend/src/main/java/com/sort/manager/controller/AuthController.java) & [AuthService.java](file:///c:/Users/Administrator/Desktop/sort/sort-manager/backend/src/main/java/com/sort/manager/service/AuthService.java)
- 新增 `/api/v1/auth/wx-login` 端点，接收小程序传来的 `code`。
- 支持小程序开发/生产环境下的 OpenID 换取与绑定，自动创建或匹配账号，颁发 JWT 访问令牌。
- 新增家庭邀请码生成与绑定 `/api/v1/household/join-code` 端点。

#### [MODIFY] [miniapp/utils/auth.js](file:///c:/Users/Administrator/Desktop/sort/sort-manager/miniapp/utils/auth.js) & [miniapp/pages/profile/index.js](file:///c:/Users/Administrator/Desktop/sort/sort-manager/miniapp/pages/profile/index.js)
- 在小程序启动及登录页中实现一键授权登录流程。
- 在个人中心页面增加“加入家庭”与“生成邀请码”协同交互。

---

## 阶段四：IndexedDB 离线模式与暂存自动同步

### 变更目标
当网络中断或离线时，用户在前端创建/修改的物品数据会自动保存在浏览器的 IndexedDB 中；当网络恢复上线 (`online` 事件) 后，系统自动批量提交离线数据并提示同步成功。

### 详细变更计划

#### [NEW] [src/utils/offlineStore.js](file:///c:/Users/Administrator/Desktop/sort/sort-manager/frontend/src/utils/offlineStore.js)
- 基于原生 IndexedDB API 建立 `SortManagerOfflineDB`，包含 `pending_items` 存储库。
- 提供 `saveOfflineItem`、`getPendingItems`、`clearPendingItems` 操作方法。

#### [MODIFY] [src/api/index.js](file:///c:/Users/Administrator/Desktop/sort/sort-manager/frontend/src/api/index.js) & [src/context/AuthContext.jsx](file:///c:/Users/Administrator/Desktop/sort/sort-manager/frontend/src/context/AuthContext.jsx)
- 在 Axios 拦截器与应用入口监听 `window.addEventListener('online', syncOfflineItems)`。
- 离线添加物品时自动切换至离线存储模式并使用 `toast.success('已离线暂存，将在恢复网络后同步')`。
- 恢复网络后自动触发后端同步，完成后更新界面。

---

## 阶段五：数据导出与资产报表 (.xlsx / PDF)

### 变更目标
在物品管理页面提供“导出资产报表”功能，支持将物品清单导出为 Excel (`.xlsx` / UTF-8 CSV) 表格，以及提供美化排版的打印 / 保存 PDF 格式报表。

### 详细变更计划

#### [NEW] [src/utils/exporter.js](file:///c:/Users/Administrator/Desktop/sort/sort-manager/frontend/src/utils/exporter.js)
- 实现带有 UTF-8 BOM 头的 CSV / Excel 兼容文件生成器，导出字段包含：物品名称、分类、位置、数量、单价、总价、购入日期、有效期及状态。
- 实现原生 `print` / PDF 打印报表生成逻辑。

#### [MODIFY] [Items.jsx](file:///c:/Users/Administrator/Desktop/sort/sort-manager/frontend/src/pages/Items.jsx)
- 在物品管理顶栏 Header 操作区增加 **“导出报表”** 按钮与下拉菜单（包含“导出 Excel 表格”与“打印/保存 PDF”）。

---

## 阶段六：虚拟滚动 (Virtual Scrolling) 性能优化

### 变更目标
当家庭物品数据量达到成千上万件时，通过虚拟列表技术只渲染当前屏幕可视区域内的卡片，大幅降低 DOM 节点数，保证移动端 60fps 极速流畅滚动。

### 详细变更计划

#### [NEW] [src/components/VirtualGrid.jsx](file:///c:/Users/Administrator/Desktop/sort/sort-manager/frontend/src/components/VirtualGrid.jsx)
- 构建轻量级虚拟网格组件，根据滚动位置 `scrollTop` 与视口高度计算当前可见行索引范围 `[startIndex, endIndex]`。
- 只渲染可见行的子节点，上下添加占位内边距（Padding spacer）。

#### [MODIFY] [Items.jsx](file:///c:/Users/Administrator/Desktop/sort/sort-manager/frontend/src/pages/Items.jsx)
- 当物品卡片数量较多（> 30 件）时，无缝切换为 `VirtualGrid` 进行渲染。

---

## 验证计划

### 自动化与构建验证
1. **Docker Compose 验证**：
   - 运行 `docker compose config` 验证配置文件语法。
   - 运行 `docker compose up -d` 验证 3 个容器能否一键构建启动并通过健康检查。
2. **前端与后端打包**：
   - 运行 `mvn clean package -DskipTests` 验证后端。
   - 运行 `npm run build` 验证前端产物。

### 手动验证
- 验证低库存标签与临期提醒展示。
- 验证离线添加物品 -> 恢复网络自动同步逻辑。
- 验证 Excel/PDF 报表导出。
- 验证 100+ 物品数据下虚拟滚动的流畅度。
