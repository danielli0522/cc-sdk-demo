#!/bin/bash

echo "🚀 MCP文档生成器快速部署脚本"
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

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 生成MCP配置
echo "⚙️ 生成MCP配置..."
npm run mcp:setup

# 测试MCP服务器
echo "🧪 测试MCP服务器..."
node test-mcp.js

# 显示配置信息
echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 配置信息:"
echo "MCP配置文件: $(pwd)/mcp-config.json"
echo "MCP服务器: $(pwd)/dist/src/mcp-server.js"
echo ""
echo "🎯 下一步操作:"
echo "1. 将 mcp-config.json 复制到Claude Code配置目录"
echo "2. 重启Claude Code"
echo "3. 在Claude Code中使用文档生成功能"
echo ""
echo "📚 详细文档:"
echo "- MCP集成指南: MCP_INTEGRATION.md"
echo "- MCP部署指南: MCP_DEPLOYMENT_GUIDE.md"
echo ""
echo "🔧 可用命令:"
echo "- npm run mcp:server  # 启动MCP服务器"
echo "- npm run mcp:client  # 运行客户端示例"
echo "- npm run mcp:demo    # 运行SDK集成示例"
echo "- ./start-mcp.sh      # 交互式启动"

