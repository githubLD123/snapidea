<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# SnapIdea - AI 截图灵感管理系统

## 项目概述

SnapIdea 是一个基于 Google Gemini API 的 AI 驱动截图分析应用，帮助用户将截图转化为可操作的灵感和待办事项。

## 特性

### 🚀 核心功能

- **智能截图分析**: 使用 Gemini AI 分析截图内容
- **待办事项生成**: 自动提取任务清单
- **分类管理**: 智能分类灵感点子
- **搜索过滤**: 快速找到想要的灵感
- **任务调度**: 长时间运行智能体的有效调度框架

### 📊 系统架构

#### 任务调度/编排框架

基于《长时间运行智能体的有效调度/编排框架》，SnapIdea 实现了以下功能：

1. **任务队列管理** (`taskScheduler.ts`)
   - 并发任务限制（可配置）
   - 任务状态跟踪（pending/running/completed/failed）
   - 进度报告
   - 任务持久化到本地存储

2. **智能重试机制** (`geminiService.ts`)
   - 指数退避重试策略
   - 可配置的重试次数
   - 错误分类和恢复

3. **缓存系统**
   - 分析结果缓存
   - 过期自动清理
   - 减少重复 API 调用

4. **超时控制**
   - API 调用超时限制
   - 防止任务永久挂起

5. **资源限制**
   - 并发任务控制
   - 内存使用优化

## 快速开始

### 环境准备

确保已安装 Node.js 18+。

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 填入你的 API Key：

```env
GEMINI_API_KEY=your_gemini_api_key_here
API_TIMEOUT=30000
MAX_RETRIES=3
MAX_CONCURRENT_TASKS=3
CACHE_DURATION=3600000
```

### 3. 获取 API Key

1. 访问 [Google AI Studio](https://aistudio.google.com)
2. 登录或注册 Google 账号
3. 创建新的 API Key
4. 将 API Key 填入 `.env.local`

### 4. 运行项目

```bash
npm run dev
```

访问 http://localhost:3000 查看应用

### 5. 构建生产版本

```bash
npm run build
```

## 部署

### 本地部署

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 预览生产版本
npm run preview
```

### 云端部署

详细部署指南请参考 [DEPLOYMENT.md](DEPLOYMENT.md)

## 使用说明

### 1. 上传截图

- 点击 "导入灵感截图" 区域
- 选择一张截图（支持 PNG/JPG）
- 点击 "开始分析灵感"

### 2. 查看结果

- 分析完成后会显示：
  - 灵感标题
  - 内容摘要
  - 分类
  - 待办任务列表

### 3. 管理灵感

- 搜索功能：搜索标题、内容或想法
- 分类过滤：按分类查看灵感
- 待办管理：点击待办任务标记完成

## 配置选项

### 性能优化

```env
# API 调用超时时间（毫秒）
API_TIMEOUT=30000

# 最大重试次数
MAX_RETRIES=3

# 最大并发任务数
MAX_CONCURRENT_TASKS=3

# 缓存时长（毫秒）
CACHE_DURATION=3600000
```

## 项目结构

```
snapidea/
├─ components/          # React 组件
│  ├─ IdeaCard.tsx     # 灵感卡片组件
│  └─ UploadSection.tsx # 上传区域组件
├─ services/           # 服务层
│  ├─ geminiService.ts # AI 分析服务
│  └─ taskScheduler.ts # 任务调度器
├─ dist/              # 生产构建输出
├─ index.html         # HTML 入口
├─ App.tsx            # 主应用组件
├─ types.ts           # TypeScript 类型定义
├─ vite.config.ts     # Vite 配置
├─ package.json       # 项目依赖
├─ .env.local         # 本地环境变量
└─ DEPLOYMENT.md      # 部署指南
```

## 技术栈

- **React 19**: 前端框架
- **TypeScript**: 类型安全
- **Vite**: 构建工具
- **Google Gemini API**: AI 分析引擎
- **LocalStorage**: 本地存储
- **Tailwind CSS**: 样式框架

## 架构设计

### 任务调度流程

```
┌─────────────────────────────────────────────┐
│ 用户上传图片                                │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ 创建任务 → 加入队列                          │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ 调度器检查并发限制                          │
│ 执行任务 → 更新状态                          │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ AI 分析 → 错误处理 → 重试机制                │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│ 结果缓存 → 展示给用户                        │
└─────────────────────────────────────────────┘
```

## 错误处理

### API Key 无效

- 应用会自动检测无效的 API Key
- 提供重新输入的机会
- 支持 API Key 缓存

### 网络失败

- 自动重试机制
- 指数退避策略
- 用户友好的错误提示

## 监控和维护

### 任务统计

- 总灵感数量
- 待办任务数量
- 分类数量
- 运行中的任务数

### 控制台日志

查看浏览器控制台可获取：
- 任务状态变化
- 缓存命中情况
- 重试信息
- 错误详情

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。
