# 图像识别小工具 - 后端服务

基于Go语言的图像识别后端服务，集成百度智能云AI能力。

## 技术栈

- **框架**: Gin Web Framework
- **数据库**: MySQL + GORM
- **缓存**: Redis
- **认证**: JWT
- **图像处理**: 百度智能云图像识别API
- **文件处理**: 支持图片上传和压缩

## 功能特性

- 🔐 用户认证（登录/注册）
- 🖼️ 图像上传和处理
- 🤖 AI图像识别（动物、植物、果蔬、菜品、通用物体）
- 📊 识别历史记录管理
- 💾 图片压缩和存储
- 🚀 高性能缓存机制
- 📱 移动端API优化

## 快速开始

### 环境要求

- Go 1.21+
- MySQL 8.0+
- Redis 6.0+

### 安装依赖

```bash
cd api
go mod download
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并配置相关参数：

```bash
cp .env.example .env
```

### 数据库配置

确保MySQL服务已启动，然后运行：

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE image_recognition CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 启动服务

```bash
go run .
```

服务将在 `http://localhost:8082` 启动。

## API文档

### 认证相关

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "test123"
}
```

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123"
}
```

### 图像识别

#### 上传图片
```http
POST /api/recognize/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
type: animal
```

#### 分析图片
```http
POST /api/recognize/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "image": "base64_encoded_image_data",
  "type": "plant"
}
```

### 历史记录

#### 获取识别记录
```http
GET /api/records?page=1&page_size=10&type=animal
Authorization: Bearer <token>
```

#### 删除记录
```http
DELETE /api/records/:id
Authorization: Bearer <token>
```

## 百度智能云配置

1. 访问 [百度智能云控制台](https://console.bce.baidu.com/)
2. 创建图像识别应用
3. 获取 API Key 和 Secret Key
4. 在 `.env` 文件中配置：

```env
BAIDU_API_KEY=your-api-key
BAIDU_SECRET_KEY=your-secret-key
```

## 支持的识别类型

- `general`: 通用物体识别
- `animal`: 动物识别
- `plant`: 植物识别
- `ingredient`: 果蔬识别
- `dish`: 菜品识别

## 部署

### Docker部署

```bash
docker build -t image-recognition-api .
docker run -p 8082:8082 --env-file .env image-recognition-api
```

### 生产环境

1. 使用HTTPS
2. 配置强密码策略
3. 启用数据库连接池
4. 配置日志记录
5. 设置监控告警

## 测试账号

开发环境提供测试账号：
- 用户名: `测试用户1` / `测试用户2` / `测试用户3`
- 密码: `test123`

## 许可证

MIT License