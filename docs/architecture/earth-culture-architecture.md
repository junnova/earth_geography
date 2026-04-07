# Earth Culture 架构设计文档

## 1. 架构概述

- **架构风格**：前后端分离 + 单体后端
- **设计目标**：高性能渲染、流畅交互、易于维护、数据可管理
- **技术栈总览**：

| 组件 | 技术选型 | 理由 |
|------|----------|------|
| 3D 渲染引擎 | Three.js r160+ | WebGL 社区最成熟，自定义度最高，手绘着色器支持好 |
| 前端框架 | Vue 3.4 + Vite 5 | 组合式 API + 极快 HMR，适合中型独立项目 |
| 状态管理 | Pinia | Vue 3 官方推荐，轻量够用 |
| 动画库 | GSAP 3 | 相机飞行动画、卡片过渡，业界标杆性能 |
| UI 组件库 | Element Plus | 后台管理表格/表单开箱即用 |
| 后端框架 | Express 4 (Node.js) | 轻量 REST API，与前端技术栈统一 |
| 数据库 | SQLite 3 (better-sqlite3) | 数据量 ~200 条，零配置，单文件部署 |
| 文件存储 | 本地磁盘 + 静态服务 | 图标/图片上传，生产可迁移至 OSS |
| 构建部署 | Vite build + PM2 | 前端静态部署，后端 PM2 守护进程 |

## 2. 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        浏览器                                │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │   Vue 3 应用          │  │   Three.js 渲染层            │ │
│  │  ┌────────────────┐  │  │  ┌────────────────────────┐ │ │
│  │  │ SearchBar 搜索栏│  │  │  │ Scene 场景管理器       │ │ │
│  │  ├────────────────┤  │  │  ├────────────────────────┤ │ │
│  │  │ InfoCard 信息卡片│ │  │  │ EarthMesh 地球球体     │ │ │
│  │  ├────────────────┤  │  │  │ (手绘纹理)              │ │ │
│  │  │ AdminPanel      │  │  │  ├────────────────────────┤ │ │
│  │  │ 后台管理页面     │  │  │  │ MarkerSystem 图标系统  │ │ │
│  │  └────────────────┘  │  │  │ (Sprite Billboard)      │ │ │
│  │                       │  │  ├────────────────────────┤ │ │
│  │  事件/数据绑定 ◄────►│  │  │ Controls 拖拽/缩放/惯性│ │ │
│  │                       │  │  ├────────────────────────┤ │ │
│  └──────────────────────┘  │  │ Raycaster 射线检测     │ │ │
│                             │  ├────────────────────────┤ │ │
│                             │  │ CameraAnimator GSAP    │ │ │
│                             │  └────────────────────────┘ │ │
│                             └──────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP API
┌──────────────────────▼──────────────────────────────────────┐
│                  Node.js 后端                                │
│  ┌──────────────┐ ┌──────────┐ ┌─────────────┐             │
│  │ Express      │ │ 简单鉴权  │ │ 文件上传     │             │
│  │ REST API     │ │ 中间件    │ │ (multer)    │             │
│  └──────┬───────┘ └──────────┘ └──────┬──────┘             │
│         │                              │                     │
│  ┌──────▼───────┐              ┌──────▼──────┐             │
│  │ SQLite DB    │              │ /uploads    │             │
│  │ landmarks.db │              │ 静态文件目录 │             │
│  └──────────────┘              └─────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## 3. 模块划分

### 3.1 前端模块依赖

```
App.vue (根组件)
├── EarthScene.vue (地球容器)
│   ├── three/scene.js      (场景初始化)
│   ├── three/earth.js      (地球构建)
│   ├── three/markers.js    (图标管理)
│   ├── three/controls.js   (交互控制)
│   ├── three/animation.js  (相机动画, 依赖 GSAP)
│   ├── three/raycaster.js  (点击检测)
│   └── three/utils.js      (经纬度转换)
├── SearchBar.vue (搜索栏)
│   └── api/landmarks.js → HTTP → 后端
├── InfoCard.vue (信息卡片)
│   └── api/landmarks.js → HTTP → 后端
└── admin/AdminView.vue (后台管理)
    ├── admin/LandmarkTable.vue
    ├── admin/LandmarkForm.vue
    └── api/landmarks.js → HTTP → 后端
```

### 3.2 后端模块划分

```
index.js (应用入口)
├── routes/landmarks.js (路由层)
│   └── controllers/landmarks.js (控制器层)
│       └── models/landmark.js (数据模型层)
│           └── db/index.js (SQLite 连接)
├── routes/upload.js (上传路由)
│   └── controllers/upload.js (上传控制器)
│       └── multer 文件处理
├── middleware/validator.js (参数校验)
├── express.static (静态资源服务)
└── cors 中间件
```

## 4. 数据库设计

### 4.1 landmarks 表结构

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 自增主键 |
| country_name | VARCHAR(100) | NOT NULL | 国家名称(中文) |
| country_code | CHAR(2) | NOT NULL | ISO 3166-1 alpha-2 |
| latitude | REAL | NOT NULL | 纬度 |
| longitude | REAL | NOT NULL | 经度 |
| landmark_name | VARCHAR(200) | NOT NULL | 文化标志名称 |
| description | TEXT | NOT NULL DEFAULT '' | 简介(200字以内) |
| icon_url | VARCHAR(500) | NOT NULL DEFAULT '' | 地球2D图标URL |
| image_url | VARCHAR(500) | DEFAULT '' | 信息卡片大图URL |
| category | VARCHAR(50) | DEFAULT '' | 类别(预留) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 更新时间 |

### 4.2 建表 SQL

```sql
CREATE TABLE IF NOT EXISTS landmarks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    country_name VARCHAR(100) NOT NULL,
    country_code CHAR(2)      NOT NULL,
    latitude    REAL         NOT NULL,
    longitude   REAL         NOT NULL,
    landmark_name VARCHAR(200) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    icon_url    VARCHAR(500) NOT NULL DEFAULT '',
    image_url   VARCHAR(500) DEFAULT '',
    category    VARCHAR(50)  DEFAULT '',
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_country_code ON landmarks(country_code);
CREATE INDEX idx_country_name ON landmarks(country_name);
```

### 4.3 缓存策略

- **前端缓存**：API 响应 → Pinia Store 缓存
  - 首次加载获取全部 landmarks 数据
  - 后续操作读取 Store，不重复请求
  - 后台管理 CRUD 后，主动刷新 Store
- **纹理贴图**：浏览器 Cache-Control 缓存，max-age=604800 (7天)
- 数据总量约 200 条，无需服务端缓存层，前端一次性加载即可

## 5. API 设计

### 5.1 RESTful 接口

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| `GET` | `/api/landmarks` | 获取全部地标 | - | `{ data: Landmark[] }` |
| `GET` | `/api/landmarks/:id` | 获取单个地标 | - | `{ data: Landmark }` |
| `POST` | `/api/landmarks` | 新增地标 | `Landmark` | `{ data: Landmark }` |
| `PUT` | `/api/landmarks/:id` | 更新地标 | `Landmark` | `{ data: Landmark }` |
| `DELETE` | `/api/landmarks/:id` | 删除地标 | - | `{ success: true }` |
| `GET` | `/api/landmarks/search?q=` | 搜索国家 | - | `{ data: Landmark[] }` |
| `POST` | `/api/upload` | 上传图片 | `multipart/form-data` | `{ url: string }` |

### 5.2 响应格式

```json
// 成功
{ "code": 200, "data": {}, "message": "ok" }

// 失败
{ "code": 400, "data": null, "message": "参数错误: country_name 不能为空" }
```

## 6. Three.js 渲染架构

### 6.1 场景对象树

```
Scene
├── AmbientLight (环境光, intensity: 0.6)
├── DirectionalLight (平行光, 模拟太阳)
├── Earth (Mesh)
│   ├── Geometry: SphereGeometry(5, 64, 64)
│   └── Material: MeshStandardMaterial
│       ├── map: 手绘风格地球纹理 (4096x2048)
│       ├── bumpMap: 地形凹凸贴图 (可选)
│       └── emissiveMap: 夜间灯光贴图 (可选, 增加梦幻感)
├── Atmosphere (Mesh, 大气层光晕)
│   ├── Geometry: SphereGeometry(5.15, 64, 64)
│   └── Material: ShaderMaterial (自定义大气散射着色器)
├── MarkerGroup (Group)
│   ├── Sprite_0 (国家图标)
│   ├── Sprite_1
│   ├── ... (约195个)
│   └── Sprite_194
└── Stars (Points, 星空背景)
    ├── Geometry: BufferGeometry (随机分布点)
    └── Material: PointsMaterial
```

### 6.2 渲染循环

```
requestAnimationFrame 循环:
  1. 检查用户是否 idle > 3s
     → 是: 自转 earth.rotation.y += 0.001
     → 否: 跳过自转
  2. controls.update() (阻尼衰减)
  3. 更新图标可见性 (背面隐藏检测)
  4. 根据相机距离调整图标缩放
  5. renderer.render(scene, camera)
  6. 回到步骤 1
```

### 6.3 背面图标遮挡算法

```
对每个 Marker:
  1. 计算 marker 法向量 N = normalize(markerPosition)
  2. 计算相机方向 V = normalize(cameraPosition - earthCenter)
  3. dot = N · V
  4. if dot < 0.2:
       marker.material.opacity = 0        // 背面完全隐藏
     else if dot < 0.4:
       marker.material.opacity = (dot - 0.2) / 0.2  // 边缘渐隐
     else:
       marker.material.opacity = 1        // 正面完全可见
```

### 6.4 手绘风格实现方案

**主方案：手绘纹理贴图**
- 使用等距柱状投影（Equirectangular）的手绘/水彩风格地球贴图
- 推荐来源：开源素材（如 Natural Earth + 后处理）或 AI 生成
- 分辨率：4096×2048（保证缩放清晰度）

**增强方案：后处理着色器**
```
渲染管线:
  地球纹理 → MeshStandardMaterial
       ↓
  EffectComposer 后处理
       ├── 边缘检测 (Sobel) → 描边效果
       ├── 色调映射 → 暖色调/柔和色彩
       └── 轻微噪点 → 纸质纹理感
       ↓
  最终画面 (梦幻手绘风)
```

## 7. 交互流程

### 7.1 点击图标查看详情

```
用户点击地球上的图标
  → Raycaster 射线检测
  → 找到命中的 Sprite
  → emit('marker-click', landmarkData) → Vue 组件层
  → InfoCard 组件接收数据，显示卡片
  → 展示国家名/标志名/图片/简介
  → 用户点击关闭按钮
  → emit('close') → 恢复正常浏览状态
```

### 7.2 搜索国家定位

```
用户在搜索框输入 "法国"
  → Pinia Store 中模糊匹配 landmarks
  → 返回匹配列表 [{country_name:"法国",...}]
  → 展示下拉建议
  → 用户选择 "法国"
  → flyTo(lat: 48.86, lon: 2.35)
  → GSAP 计算目标相机位置
  → 逐帧插值相机位置 (duration: 1s, ease: power2.inOut)
  → 地球平滑旋转至法国
  → 高亮法国图标 (放大 + 发光)
```

## 8. 部署架构

```
用户浏览器  ──HTTPS──▶  Nginx (反向代理)
                          ├── /           → 前端静态文件 (Vite build 产物)
                          ├── /api/*      → PM2 守护进程 (Express 后端)
                          └── /uploads/*  → 上传文件目录
                                              │
                                    PM2 ──▶ SQLite DB (landmarks.db)
```

**部署步骤概要：**
1. `cd client && npm run build` → 生成 `dist/`
2. `cd server && pm2 start index.js --name earth-culture`
3. Nginx 配置静态文件指向 `client/dist/`，API 代理到 `localhost:3001`

## 9. 目录结构（最终版）

```
earth_culture/
├── client/                        # 前端项目
│   ├── public/
│   │   └── textures/              # 地球纹理贴图
│   │       ├── earth-hand-drawn.jpg   # 手绘风格地球贴图(4096x2048)
│   │       ├── earth-bump.jpg         # 凹凸贴图(可选)
│   │       └── starfield.jpg          # 星空背景
│   ├── src/
│   │   ├── api/
│   │   │   └── landmarks.js       # 后端 API 调用封装
│   │   ├── assets/
│   │   │   ├── icons/             # 默认图标素材
│   │   │   └── styles/            # 全局样式
│   │   ├── components/
│   │   │   ├── EarthScene.vue     # 3D 地球容器组件
│   │   │   ├── InfoCard.vue       # 信息卡片弹窗
│   │   │   ├── SearchBar.vue      # 搜索栏
│   │   │   └── admin/
│   │   │       ├── AdminView.vue  # 后台管理主页面
│   │   │       ├── LandmarkTable.vue  # 数据表格
│   │   │       └── LandmarkForm.vue   # 新增/编辑表单
│   │   ├── three/
│   │   │   ├── scene.js           # 场景/相机/渲染器初始化
│   │   │   ├── earth.js           # 地球 Mesh + 大气层
│   │   │   ├── markers.js         # 图标创建/更新/遮挡
│   │   │   ├── controls.js        # OrbitControls + idle 检测
│   │   │   ├── animation.js       # 相机飞行动画 (GSAP)
│   │   │   ├── raycaster.js       # 点击检测
│   │   │   └── utils.js           # 经纬度转换等工具函数
│   │   ├── stores/
│   │   │   └── landmarks.js       # Pinia store
│   │   ├── router/
│   │   │   └── index.js           # 前端路由 (主页/后台)
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                        # 后端项目
│   ├── controllers/
│   │   ├── landmarks.js           # 地标 CRUD 逻辑
│   │   └── upload.js              # 文件上传逻辑
│   ├── models/
│   │   └── landmark.js            # 数据模型 (better-sqlite3)
│   ├── routes/
│   │   ├── landmarks.js           # 地标路由
│   │   └── upload.js              # 上传路由
│   ├── middleware/
│   │   └── validator.js           # 参数校验中间件
│   ├── db/
│   │   ├── index.js               # 数据库连接初始化
│   │   └── seed.js                # 初始化 195 国基础数据
│   ├── uploads/                   # 上传文件存储目录
│   ├── data/
│   │   └── landmarks.db           # SQLite 数据库文件
│   ├── index.js                   # 应用入口
│   └── package.json
└── docs/
    ├── requirements/
    │   └── requirements.md
    └── architecture/
        └── earth-culture-architecture.md  # 本文档
```

## 10. 核心设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 3D 库 | Three.js 而非 Globe.gl | 手绘风格需要深度自定义着色器和纹理 |
| 数据库 | SQLite 而非 MySQL | 200 条数据，零配置部署优先 |
| 数据加载 | 全量前端缓存 | 数据量极小，一次加载到 Pinia Store |
| 相机动画 | GSAP | 缓动曲线比 Three.js 自带 Tween 更丝滑 |
| 图标渲染 | Sprite | GPU 友好，200 个量级无性能压力 |

## 11. 风险与应对

| 风险 | 等级 | 应对策略 |
|------|------|----------|
| 手绘地球纹理获取困难 | 中 | 方案A：Natural Earth 开源数据 + 水彩滤镜后处理；方案B：Three.js 后处理着色器模拟；方案C：AI 生成 |
| 欧洲区域图标密集重叠 | 中 | 基于距离的聚合：缩放级别低时合并为区域图标，放大后展开 |
| 195 个 Sprite 性能 | 低 | Sprite 为 GPU 友好基本图元，200 个量级不构成瓶颈 |
| SQLite 并发写入限制 | 低 | 仅后台管理写入，单用户场景，WAL 模式即可 |
| 移动端后续适配成本 | 中 | 当前使用响应式 CSS + 触控事件预留 |
