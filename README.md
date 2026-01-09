# 图像识别小工具

前端为 React + Taro 的移动端应用，后端为 Go（Gin）服务，集成百度智能云图像识别能力，支持多种识别类型与历史记录管理。

## 技术栈

- 前端：React + Taro、Zustand、Tailwind CSS、Lucide React、React Router DOM
- 后端：Go 1.21、Gin、GORM、MySQL/SQLite、Redis、JWT

## 功能特性

- 📱 移动端优化界面
- 🔐 用户认证系统（测试账号支持）
- 🖼️ 图像上传和预览
- 🤖 AI图像识别（多种类型）
- 📊 识别历史记录
- 📷 拍照和相册选择
- 🎨 现代化UI设计
- ⚡ 快速响应体验

## 识别类型

1. **看图识万物** - 通用物体识别
2. **动物识别** - 识别各种动物种类
3. **植物识别** - 识别植物花卉品种
4. **果蔬识别** - 识别水果蔬菜种类
5. **菜品识别** - 识别菜品名称和热量
6. **LOGO识别** - 识别图片中的LOGO品牌
7. **地标识别** - 识别图片中的地标名称
8. **车型识别** - 识别图片中的车型品牌

## 快速开始

### 环境要求

- Node.js 18+（前端）
- pnpm 8+（前端）
- Go 1.21+（后端）
- MySQL 8.0+（可选，或使用 SQLite 快速启动）
- Redis 6.0+（可选，用于缓存 access_token）

### 安装依赖

```bash
pnpm install
```

### 启动后端（Go）

```bash
cd api
cp .env.example .env.local
# 编辑 .env.local，填入百度密钥等配置（示例见下文）
go run .
```

- 健康检查：`GET http://localhost:8082/health`
- API 基路径：`http://localhost:8082/api`

快速启动（无数据库准备时）可在 `.env.local` 中加入：

```env
APP_ENV=development
PORT=8082
JWT_SECRET=your-secret-key
BAIDU_API_KEY=你的真实Key
BAIDU_SECRET_KEY=你的真实Secret
DB_DRIVER=sqlite
```

如果需要 MySQL：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=image_recognition
```

Redis 可选（用于缓存百度 access_token）：

```env
REDIS_ADDR=127.0.0.1:6379
REDIS_PASSWORD=
```

注意：在非生产环境如果未配置百度密钥，后端会返回模拟识别结果（便于本地联调）。

### 启动前端（Taro）

```bash
pnpm run dev
```

应用将在 `http://localhost:4567` 启动。

### 生产环境构建

```bash
pnpm run build
```

## 项目结构

```
src/
├── components/
├── pages/
├── stores/
├── services/
├── hooks/
├── utils/
└── assets/

api/
├── main.go            # 入口，加载 .env.local/.env，注册路由
├── image.go           # 图像识别与百度 API 交互
├── middleware.go      # 认证中间件（JWT）
├── models.go          # 数据模型与响应结构
├── redis.go           # Redis 连接与 token 缓存
├── README.md          # 后端详细文档
├── .env.example       # 后端环境变量模板
└── go.mod             # Go 模块依赖
```

## 移动端适配

- 使用Taro框架实现跨平台
- 响应式设计，支持各种屏幕尺寸
- 触摸友好的交互设计
- 优化的图片加载和显示

## 测试账号

开发环境提供测试账号：
- 用户名: `测试用户1` / `测试用户2` / `测试用户3`
- 密码: `test123`

也可以点击"快速登录为测试用户"按钮直接登录。

## 使用流程

1. **登录/注册** - 使用测试账号或注册新用户
2. **选择识别类型** - 从5种识别类型中选择
3. **上传图片** - 拍照或从相册选择图片
4. **查看结果** - 查看AI识别结果和详细信息
5. **保存历史** - 自动保存识别记录

API 详情与示例请查看 `api/README.md`。
## 环境变量

- 前端：
  - `.env.development`
    ```env
    VITE_API_BASE_URL=http://localhost:8082/api
    VITE_APP_NAME=图像识别小工具
    ```
  - `.env.production`
    ```env
    VITE_API_BASE_URL=https://your-production-api.com/api
    VITE_APP_NAME=图像识别小工具
    ```

- 后端：
  - 使用 `api/.env.local` 存放本地敏感配置（已被忽略，不会提交到仓库），`api/.env` 可用于通用非敏感配置或容器 `--env-file`。
  - 模板参考 `api/.env.example`。
  - 关键项：`BAIDU_API_KEY`、`BAIDU_SECRET_KEY`、数据库与 Redis 配置、`JWT_SECRET`。

## API 概览

- 认证：
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - 受限接口需 `Authorization: Bearer <token>`
- 图像识别：
  - `POST /api/recognize/upload`
  - `POST /api/recognize/analyze`
- 历史记录：
  - `GET /api/records`
  - `GET /api/records/:id`
  - `DELETE /api/records/:id`
  - `POST /api/records/backfill_images`
  - `POST /api/records/backfill_confidence`

示例：
```bash
# 登录获取 token
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"测试用户1","password":"test123"}'

# 使用 token 进行识别（base64）
curl -X POST http://localhost:8082/api/recognize/analyze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"image":"<base64>","type":"plant"}'
```

## 部署

- 前端（静态站点）：
  ```bash
  pnpm run build
  # 将 dist/ 部署到静态服务器
  ```

- 后端（Docker）：
  ```bash
  cd api
  docker build -t image-recognition-api .
  docker run -p 8082:8082 --env-file .env image-recognition-api
  ```

- 生产环境建议：开启 HTTPS、使用系统环境变量或 `--env-file` 注入密钥、配置数据库连接池与日志、启用监控告警。

## 开发建议

1. **组件拆分** - 保持组件小而专注
2. **状态管理** - 合理使用Zustand管理状态
3. **错误处理** - 完善的错误提示和边界处理
4. **性能优化** - 图片懒加载和缓存策略
5. **用户体验** - 加载状态、骨架屏等优化

## 许可证 License

This project is licensed under the MIT License.