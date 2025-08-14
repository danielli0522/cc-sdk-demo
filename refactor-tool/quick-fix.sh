#!/bin/bash

# Claude CLI 快速修复脚本

echo "🔧 Claude CLI 问题诊断和修复"
echo "================================"

# 检查 Claude CLI 是否安装
echo "📦 检查 Claude CLI 安装状态..."
if command -v claude &> /dev/null; then
    echo "✅ Claude CLI 已安装: $(claude --version)"
else
    echo "❌ Claude CLI 未安装"
    echo "请运行: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# 检查登录状态
echo ""
echo "🔐 检查登录状态..."
if claude --print "test" &> /dev/null; then
    echo "✅ Claude CLI 已登录"
else
    echo "❌ Claude CLI 未登录"
    echo ""
    echo "请运行以下命令登录:"
    echo "  claude login"
    echo ""
    echo "登录后重新运行此脚本"
    exit 1
fi

# 测试非交互式模式
echo ""
echo "🧪 测试非交互式模式..."
result=$(claude --print --dangerously-skip-permissions "Say 'Hello World'" 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ 非交互式模式工作正常"
    echo "📝 响应: $result"
else
    echo "❌ 非交互式模式测试失败"
    echo "❌ 错误: $result"
fi

# 重新构建项目
echo ""
echo "🔨 重新构建 TypeScript 项目..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
    exit 1
fi

# 测试重构工具
echo ""
echo "🛠️ 测试重构工具..."
echo "目标文件: test-example.js"
echo "重构类型: improve_readability"
echo ""

# 设置环境变量避免 TTY 问题
export ANTHROPIC_NO_TTY=1
export NODE_ENV=production

# 运行重构工具
node dist/cli.js --target test-example.js --type improve_readability --auto-confirm

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 重构工具运行成功！"
    echo ""
    echo "📂 检查备份目录: refactor-backups/"
    echo "📄 检查结果文件: refactor-result.json"
    
    # 显示重构后的文件内容
    if [ -f test-example.js ]; then
        echo ""
        echo "📝 重构后的文件内容:"
        echo "===================="
        cat test-example.js
    fi
else
    echo ""
    echo "❌ 重构工具运行失败"
    echo ""
    echo "🔍 请检查以下内容:"
    echo "1. Claude CLI 是否正确登录"
    echo "2. 网络连接是否正常"
    echo "3. API 配额是否充足"
    echo ""
    echo "📖 详细诊断信息请查看: TROUBLESHOOTING.md"
fi

echo ""
echo "🏁 诊断完成"

