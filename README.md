# 收纳管家 (Sort Manager) v1.8.0

![Sort Manager Logo](frontend/public/favicon.svg)

一套专为私人家庭与小型办公室设计的**高颜值、高效率、私人数字物品收纳与资产管理系统**。支持多端协作（Web 响应式 PC/H5 + PWA 离线应用 + 原生微信小程序），提供零依赖 Docker / NAS 部署、图书 ISBN 扫码自动识别、SWR 0ms 页面秒开、离线暂存同步、数据导出及数据安全保护。

---

## 🌟 核心功能亮点

- 🎨 **现代化美学视觉**：精心设计的蓝色主题 (`#00a6f4`)，适配 PC 侧边栏与移动端底部导航 (BottomNav)。
- ⚡ **SWR 0ms 秒开无感切换**：采用内存 + `sessionStorage` 双层 SWR 缓存机制，页面切换 0ms 瞬间呈现，彻底消除白屏与骨架屏闪烁。
- 📚 **图书 ISBN 扫码与三层 API 自动识别**：
  - 支持扫描/输入图书 ISBN 13/10 位条码，通过 **三层 API 瀑布流兜底（豆瓣开源 API 镜像 ➔ Google Books ➔ Open Library）** 自动检索书名、作者、出版社、定价及封面全量元数据，一键预填入库。
- 🚨 **临期与低库存告警提醒**：
  - 自动标识 🔴 **已过期**、🟡 **临期（30天内）** 及 🟠 **低库存（数量 ≤ 2）** 醒目标签。
- 📊 **数据导出与资产报表 (.xlsx / 打印 PDF)**：
  - 支持一键导出 UTF-8 BOM 兼容的 Excel 表格与生成美化排版的打印/保存 PDF 资产明细表。
- 🚀 **虚拟滚动 (Virtual Scrolling)**：
  - 面对成千上万件大数量物品，仅渲染视口内可见卡片，保持移动端 60fps 顺畅滑动。
- 📥 **批量录入托盘 (Bulk Intake)**：
  - 支持最多 100 行批量快速录入与剪贴板文本粘贴解析，结合 `validateOnly` 事务级预校验。
- 🗂️ **收纳位置与分类索引**：
  - 无限级树状收纳结构、节点展收、节点物品实时计数与同级右对齐展示；分类目录支持自定义颜色与图标。
- 🛡️ **安全与数据保护**：
  - 隔离家庭租户 (Household Scope)、`OWNER` / `MEMBER` 角色权限管控、防爆破自动锁定、JWT 双令牌轮转刷新。
  - 物品软删除 (Soft Delete)，支持回收站一键恢复或彻底删除，以及追加式审计日志 (Append-only Audit Log)。
- 💾 **自动灾备与恢复**：
  - 自动化 AES 加密数据库与上传文件备份链 (`ops/backup.ps1`) 与验真优先恢复脚本 (`ops/restore-backup.ps1`)。

---

## 🚀 飞牛 fnOS NAS 部署步骤方案

飞牛 **fnOS** 原生内置了优秀的 **Docker 项目 (Compose)** 管理面板，部署极简、稳定无依赖。

### 方案一：飞牛 fnOS Web UI 图形化一键部署（推荐 👍）

#### 1. 新建项目目录
在飞牛 fnOS 的“文件管理器”中，于 `docker` 共享文件夹下新建文件夹：`/docker/sort-manager`。

#### 2. 新建 Compose 项目
1. 打开飞牛 fnOS 桌面 ➔ 进入 **Docker 应用** ➔ 点击左侧 **项目 (Compose)** ➔ 点击右上角 **“新建项目”**。
2. **项目名称**：`sort-manager`
3. **路径**：选择 `/docker/sort-manager`

#### 3. 填入 Compose 配置
在代码编辑框中粘贴以下配置（已针对 NAS 部署优化，服务端口映射为 `8090`）：

```yaml
services:
  db:
    image: mysql:8.4
    container_name: sort-manager-db
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-Root@2026!}
      MYSQL_DATABASE: ${DB_NAME:-sort_manager}
      MYSQL_USER: ${DB_USERNAME:-sort_manager_app}
      MYSQL_PASSWORD: ${DB_PASSWORD:-SortApp@2026!}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -u root -p$$MYSQL_ROOT_PASSWORD"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    restart: unless-stopped

  backend:
    build:
      context: https://github.com/steedcy/sort-manager.git#main:backend
      dockerfile: Dockerfile
    container_name: sort-manager-backend
    environment:
      SERVER_PORT: 8080
      DB_URL: jdbc:mysql://db:3306/${DB_NAME:-sort_manager}?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
      DB_USERNAME: ${DB_USERNAME:-sort_manager_app}
      DB_PASSWORD: ${DB_PASSWORD:-SortApp@2026!}
      APP_JWT_SECRET: c29ydC1tYW5hZ2VyLWp3dC1zZWNyZXQtcGhhcmFzZS1rZXktMjAyNiE=
      FLYWAY_ENABLED: "true"
      APP_UPLOAD_PATH: /app/uploads
    volumes:
      - app_uploads:/app/uploads
    ports:
      - "8080:8080"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: https://github.com/steedcy/sort-manager.git#main:frontend
      dockerfile: Dockerfile
    container_name: sort-manager-frontend
    ports:
      - "8090:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mysql_data:
  app_uploads:
```

#### 4. 构建并启动
点击 **“构建并启动”**，fnOS 会自动拉取最新 v1.8.0 源码并构建启动容器。

---

### 方案二：通过 SSH 终端部署

```bash
# 进入 docker 目录并克隆代码
cd /vol1/1000/docker
git clone https://github.com/steedcy/sort-manager.git sort-manager
cd sort-manager

# 启动容器
docker compose up -d --build
```

---

### 数据库干净初始化（只需要执行一次）

容器启动完成后，在 fnOS 终端或 SSH 中运行以下单条命令，即可将 NAS 数据库初始化为预设干净状态（初始化预设的图书、数码分类和客厅、书房位置）：

```bash
docker exec -i sort-manager-db mysql -u root -p"Root@2026!" sort_manager < database/reset_initial.sql
```

访问地址：**`http://<你的飞牛NAS的IP>:8090`**  
初始管理员：`owner` / 密码：`Owner@2026!sort`

---

## 💻 本地开发与启动

### 环境要求
- JDK 17+ (推荐 JDK 17 / 21)
- Node.js >= 20.19.0
- MySQL 8.4

### 1. 快速启动（Windows）
项目根目录下准备了自动化一键启动脚本：

```powershell
.\start.bat
```

### 2. 手动启动
**后端**：
```powershell
cd backend
mvn package -DskipTests
java -jar target/manager.jar
```

**前端**：
```powershell
cd frontend
npm ci
npm run dev
```

访问接口与应用：
- 前端开发机：`http://localhost:5173`
- 后端服务端口：`http://localhost:8080`

---

## 📂 项目结构说明

```
sort-manager/
├── backend/            # Spring Boot 3.3.5 后端 API 源码与 Dockerfile
├── frontend/           # React 19 + Vite 7 前端 Web/PWA 源码与 Nginx 配置
├── miniapp/            # 原生微信小程序源码
├── database/           # 数据库初始化 (init.sql) 与重置脚本 (reset_initial.sql)
├── ops/                # 自动化 AES 加密备份与验真恢复脚本链 (backup.ps1, restore-backup.ps1)
├── docs/               # 技术决策记录 (ADR)、架构设计规范与历史测试报告
├── docker-compose.yml  # 通用 Docker Compose 容器编排文件
└── start.bat           # Windows 本地启动脚本
```

---

## 📄 开源许可

本项目遵循 MIT 协议开源。
