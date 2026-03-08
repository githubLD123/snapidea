# SnapIdea 部署指南

本指南基于《长时间运行智能体的有效调度/编排框架》准则，详细说明如何部署 SnapIdea 项目。

## 架构概述

SnapIdea 采用了以下智能体调度/编排功能：

1. **任务队列管理** - `services/taskScheduler.ts`
   - 支持并发任务限制（默认 3 个）
   - 任务状态跟踪（pending/running/completed/failed）
   - 进度报告和持久化

2. **智能重试机制** - `services/geminiService.ts`
   - 指数退避重试策略
   - 可配置的最大重试次数（默认 3 次）
   - 错误分类和恢复策略

3. **缓存系统**
   - 图像分析结果缓存（默认 1 小时）
   - 减少重复 API 调用
   - 提升响应速度

4. **超时控制**
   - API 调用超时（默认 30 秒）
   - 防止任务永久挂起

## 本地开发部署

### 1. 环境准备

确保已安装：
- Node.js 18+
- npm 或 yarn

### 2. 安装依赖

```bash
cd snapidea
npm install
```

### 3. 配置环境变量

创建 `.env.local` 文件（参考 `.env.example`）：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的 Gemini API Key：

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here

# 可选配置
API_TIMEOUT=30000
MAX_RETRIES=3
MAX_CONCURRENT_TASKS=3
CACHE_DURATION=3600000
```

### 4. 获取 Gemini API Key

1. 访问 [Google AI Studio](https://aistudio.google.com)
2. 登录或注册 Google 账号
3. 创建新的 API Key
4. 将 API Key 填入 `.env.local`

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用

## 生产部署

### 使用 Vercel 部署（推荐）

1. 提交代码到 GitHub 仓库

2. 访问 [Vercel](https://vercel.com) 并导入项目

3. 在 Vercel 项目设置中添加环境变量：
   - `GEMINI_API_KEY`: 你的 API Key
   - `API_TIMEOUT`: 30000
   - `MAX_RETRIES`: 3
   - `MAX_CONCURRENT_TASKS`: 3
   - `CACHE_DURATION`: 3600000

4. 部署！Vercel 会自动构建和部署

### 使用 Netlify 部署

1. 提交代码到 GitHub 仓库

2. 访问 [Netlify](https://netlify.com) 并导入项目

3. 在 Netlify 项目设置中：
   - Build command: `npm run build`
   - Publish directory: `dist`
   - 添加环境变量（同上）

4. 部署！

### 使用 Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

构建并运行：

```bash
docker build -t snapidea .
docker run -p 80:80 snapidea
```

## 配置调优

### 并发任务限制

根据你的 API 配额调整 `MAX_CONCURRENT_TASKS`：
- 免费配额：2-3
- 付费配额：5-10

### 重试策略

对于不稳定的网络环境，可以增加 `MAX_RETRIES`：
```env
MAX_RETRIES=5
```

### 缓存时长

对于变化不大的内容，可以延长缓存时间：
```env
CACHE_DURATION=86400000  # 24 小时
```

## 监控和维护

### 任务统计

应用会显示：
- 总灵感数量
- 待办任务数量
- 分类数量
- 运行中的任务数

### 缓存管理

可以通过浏览器控制台清除缓存：
```javascript
localStorage.removeItem('analysis-cache');
location.reload();
```

### 日志查看

浏览器控制台会输出：
- 任务状态变化
- 缓存命中情况
- 重试信息
- 错误详情

## 故障排除

### API Key 无效

1. 检查 API Key 是否正确
2. 确认 API Key 没有过期
3. 尝试重新生成 API Key

### 分析失败

1. 检查网络连接
2. 查看浏览器控制台错误
3. 确认图片格式支持（PNG/JPG）
4. 尝试减小图片大小

### 任务队列阻塞

清除任务历史：
```javascript
localStorage.removeItem('analysis-tasks');
location.reload();
```

## 安全注意事项

1. 不要将 `.env.local` 提交到 Git
2. 在生产环境中使用环境变量而非硬编码
3. 考虑使用 API 网关或代理来保护 API Key
4. 定期轮换 API Key

## 性能优化建议

1. **图片压缩**：在上传前压缩大图片
2. **懒加载**：对于大量灵感列表使用虚拟滚动
3. **增量更新**：只更新变化的部分
4. **IndexedDB**：对于大量数据考虑使用 IndexedDB 替代 localStorage
