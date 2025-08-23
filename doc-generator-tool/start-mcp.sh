#!/bin/bash

echo "🚀 MCP文档生成器服务启动脚本"
echo "================================"

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js版本过低，需要18+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js版本检查通过: $(node -v)"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 构建项目
if [ ! -d "dist" ]; then
    echo "🔨 构建项目..."
    npm run build
fi

# 选择启动模式
echo ""
echo "请选择启动模式:"
echo "1) 启动MCP服务器"
echo "2) 运行MCP客户端示例"
echo "3) 运行Claude SDK集成示例"
echo "4) 启动所有服务"
echo "5) 退出"
echo ""

read -p "请输入选择 (1-5): " choice

case $choice in
    1)
        echo "🔧 启动MCP服务器..."
        npm run mcp:server
        ;;
    2)
        echo "📱 运行MCP客户端示例..."
        npm run mcp:client
        ;;
    3)
        echo "🤖 运行Claude SDK集成示例..."
        npm run mcp:demo
        ;;
    4)
        echo "🚀 启动所有服务..."
        echo "启动MCP服务器..."
        npm run mcp:server &
        SERVER_PID=$!
        
        sleep 2
        
        echo "运行客户端示例..."
        npm run mcp:client
        
        echo "运行SDK集成示例..."
        npm run mcp:demo
        
        echo "停止MCP服务器..."
        kill $SERVER_PID
        ;;
    5)
        echo "👋 退出"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "✅ 操作完成！"

