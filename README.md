# AI信息生成器 - Traecn

基于CloudFlare Workers的AI平台管理系统，支持多平台AI服务管理和测试。

## 功能特性

- 🔐 用户认证系统（支持多用户注册登录）
- 👥 用户数据隔离（每个用户独立管理自己的数据）
- 🏢 平台管理（支持多个AI平台配置）
- 🤖 Agent管理（可配置环境变量模板）
- 🧪 AI API测试（实时测试API连接）
- 📱 响应式设计（支持PC和移动端）
- 🚀 CloudFlare Workers部署

## 技术栈

- **后端**: TypeScript + Hono框架
- **前端**: React + TypeScript + TailwindCSS
- **数据库**: CloudFlare D1
- **部署**: CloudFlare Workers

## 快速开始

### 1. 安装依赖

```bash
npm run setup
```

### 2. 开发环境

```bash
# 启动开发服务器
npm run dev

# 前端开发服务器
npm run dev:client
```

### 3. 数据库初始化

```bash
# 应用数据库迁移
npm run db:migrate
```

### 4. 构建和部署

```bash
# 构建项目
npm run build

# 部署到CloudFlare
npm run deploy
```

## 默认登录信息

- 用户名: `admin`
- 密码: `admin123`

## 用户注册

支持用户注册功能，注册后每个用户拥有独立的数据空间：
- 平台配置隔离
- Agent配置隔离
- 测试记录隔离

注册地址：https://traecn-ai-info-generator.wangjunli1983.workers.dev/register

## 项目结构

```
ai-info-generator/
├── src/                    # 后端源码
│   ├── index.ts           # 主入口文件
│   └── routes/            # API路由
├── client/                # 前端源码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 通用组件
│   │   └── contexts/      # React上下文
├── migrations/            # 数据库迁移文件
├── wrangler.toml        # CloudFlare配置
└── package.json         # 项目配置
```

## 环境变量

在 `wrangler.toml` 中配置：

```toml
[vars]
ADMIN_USERNAME = "admin"
```

## 开发说明

### 添加新的API端点

在 `src/routes/` 目录下创建新的路由文件，然后在 `src/index.ts` 中注册。

### 前端组件开发

使用React Hooks和TypeScript开发，遵循组件化设计原则。

## 部署说明

项目已配置自动部署流程：

1. 确保已安装 CloudFlare CLI: `npm install -g wrangler`
2. 运行 `wrangler login` 登录CloudFlare账号
3. 运行 `npm run deploy` 自动部署

## 生产环境

已部署到CloudFlare Workers：
- **地址**：https://traecn-ai-info-generator.wangjunli1983.workers.dev
- **状态**：已启用用户注册和数据隔离功能

## 许可证

MIT License

---
*最后更新: 2024年12月19日*