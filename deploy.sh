#!/bin/bash

# AI信息生成器自动部署脚本

echo "🚀 开始部署 AI信息生成器..."

# 检查是否安装了wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ 请先安装 wrangler: npm install -g wrangler"
    exit 1
fi

# 检查是否已登录
echo "🔍 检查CloudFlare登录状态..."
if ! wrangler whoami &> /dev/null; then
    echo "🔑 请先登录CloudFlare..."
    wrangler login
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建前端
echo "🏗️ 构建前端..."
cd client && npm install && npm run build && cd ..

# 构建后端
echo "🏗️ 构建后端..."
npm run build

# 应用数据库迁移
echo "🗄️ 应用数据库迁移..."
npm run db:migrate

# 部署到CloudFlare Workers
echo "🚀 部署到CloudFlare Workers..."
npm run deploy

echo "✅ 部署完成！"
echo "📋 项目名: Traecn-ai-info-generator"
echo "🗄️ 数据库: ai-info-generator-db-2847"