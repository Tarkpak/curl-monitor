# Curl 内容监控

监控 curl 请求的响应内容变化，当内容发生变更时通过 Bark 发送推送通知。

## 功能特性

- 📝 解析 curl 命令并定时执行请求
- 🔍 深度 JSON diff 对比，精确显示变更字段
- 📱 支持 Bark 推送通知（支持自定义声音、等级、分组等）
- 🎯 多通知渠道配置，每个监控可选择不同通知人
- ⏸️ 支持暂停/恢复监控
- 📊 历史记录查看，自动清理 2 天前的数据

## 快速开始

### 本地运行

```bash
# 安装依赖
bun install
# 或
npm install

# 启动服务
bun start
# 或
node server.js
```

访问 http://localhost:4000

## 一键部署

> ⚠️ **注意**: 本应用需要后端服务支持定时任务和数据持久化。以下平台部署后，定时监控功能可能受限（Serverless 函数有执行时间限制）。建议使用 VPS 或容器部署以获得完整功能。

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/curl-monitor)

1. Fork 本仓库
2. 点击上方按钮部署
3. Vercel 会自动检测 `vercel.json` 配置并部署

### Railway (推荐)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/YOUR_TEMPLATE)

1. 点击上方按钮
2. 连接 GitHub 仓库
3. Railway 会自动部署并提供持久化存储

### Render

1. 登录 [Render](https://render.com/)
2. New → Web Service
3. 连接你的 GitHub 仓库
4. 配置：
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. 点击 Create Web Service

### Docker

```bash
# 构建镜像
docker build -t curl-monitor .

# 运行容器
docker run -d -p 4000:4000 -v $(pwd)/data:/app/data curl-monitor
```

### Docker Compose

```yaml
version: '3'
services:
  curl-monitor:
    build: .
    ports:
      - "4000:4000"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

## 配置说明

### 通知配置

支持 Bark 推送，可配置：
- 服务器地址 + 设备 Key
- 推送标题和内容（支持 `{url}` 变量）
- 声音、通知等级、分组
- 是否自动复制、是否持续响铃

### 监控配置

- **Curl 命令**: 从浏览器复制的 curl 命令
- **检测间隔**: 请求间隔时间（秒）
- **通知人**: 选择要通知的渠道

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 Web Components + Tailwind CSS
- **运行时**: 支持 Node.js / Bun

## 数据存储

- `config.json` - 通知配置
- `monitors.json` - 监控任务和历史记录

## License

MIT
