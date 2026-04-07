# Earth Geography（地球文化地理）

Vue 3 + Three.js 前端与 Express + SQLite 后端组成的单页应用：3D 地球浏览地标，并提供后台管理（`/admin`）。

## 环境要求

- **Node.js**：建议 **20.x 或 22.x LTS**（当前若使用 Node 25，需保证依赖在本机正确安装）。
- 终端中能执行 `node -v`、`npm -v`。

## 安装依赖

在仓库根目录下分别安装前端与后端依赖（**不要**从其他操作系统复制 `node_modules`，尤其是含 `better-sqlite3` 等原生模块时）。

```bash
cd client
npm install
```

```bash
cd server
npm install
```

若在 `server` 下执行 `node index.js` 时出现 `better_sqlite3` / `dlopen` / `mach-o` 相关错误，请在 **本机** 重新安装该模块：

```bash
cd server
rm -rf node_modules/better-sqlite3
npm install
```

必要时在 `server/node_modules/better-sqlite3` 目录下执行预编译下载（见该包文档），或整目录重装：`rm -rf node_modules && npm install`。

## 启动方式

需要**两个终端**：一个跑 API，一个跑前端开发服务器。

### 1. 启动后端（API）

```bash
cd server
node index.js
```

默认监听 **http://localhost:3001**。健康检查：http://localhost:3001/api/health

可通过环境变量修改端口：

```bash
PORT=3002 node index.js
```

若改端口，需同步修改 `client/vite.config.js` 里 `server.proxy` 的 `target`，否则前端无法代理 API。

### 2. 启动前端（Vite）

```bash
cd client
npm run dev
```

默认开发地址为 **http://localhost:3000**（以终端输出为准）。

### 3. 浏览器访问

| 说明           | 地址 |
|----------------|------|
| 3D 地球首页    | http://localhost:3000/ |
| 后台管理       | http://localhost:3000/admin |
| 仅 API（无页面） | http://localhost:3001 |

后端 **不提供** 根路径 `GET /` 的网页；页面均由前端路由提供，请勿用 3001 当作网站首页。

## 生产构建（可选）

```bash
cd client
npm run build
```

产物在 `client/dist`，需由静态文件服务器或 Node 反向代理提供；并确保 API 地址与部署环境一致。

## 数据与上传

- SQLite 数据库路径：`server/data/landmarks.db`（仓库内可能已带初始数据）。
- 上传文件目录：`server/uploads/`（运行时生成，勿将大文件或敏感内容提交到版本库，见根目录 `.gitignore`）。

## 常见问题

- **`npm: command not found`**：未安装 Node.js，请从 [nodejs.org](https://nodejs.org/) 或包管理器安装。
- **Vite 无法解析 `element-plus`**：删除 `client/node_modules/element-plus` 后在该目录重新执行 `npm install`。
- **前端接口 404 / 跨域**：确认后端已启动，且前端通过 **3000** 访问（开发模式下 `/api`、`/uploads` 会代理到 3001）。
