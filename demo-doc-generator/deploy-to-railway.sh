#!/bin/bash

echo "🚀 Railway 部署脚本 - Demo Doc Generator"
echo "======================================="

# 检查是否安装了Railway CLI
if ! command -v railway &> /dev/null; then
    echo "📦 安装 Railway CLI..."
    npm install -g @railway/cli
fi

# 检查是否已登录
if ! railway whoami &> /dev/null; then
    echo "🔐 请登录 Railway..."
    railway login
fi

# 初始化Railway项目（如果需要）
if [ ! -f ".railway/project.json" ]; then
    echo "🎯 初始化 Railway 项目..."
    railway init
fi

# 部署项目
echo "🚀 开始部署..."
railway up

echo "✅ 部署完成！"
echo "🌍 访问你的应用: railway open"