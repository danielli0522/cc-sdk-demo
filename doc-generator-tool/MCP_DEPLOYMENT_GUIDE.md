# MCP服务部署指南

## 概述

本文档详细说明如何在不同环境中部署和配置MCP文档生成器服务，解决相对路径和绝对路径的问题。

## 配置方式

### 方式1: 自动配置（推荐）

使用内置的配置脚本自动生成正确的绝对路径配置：

```bash
# 1. 构建项目
npm run build

# 2. 生成MCP配置
npm run mcp:setup
```

这将自动生成包含正确绝对路径的 `mcp-config.json` 文件。

### 方式2: 手动配置

#### 步骤1: 获取绝对路径
```bash
# 在项目根目录运行
pwd
# 输出: /path/to/your/project/doc-generator-tool

# 构建项目
npm run build

# 确认MCP服务器文件存在
ls -la dist/src/mcp-server.js
```

#### 步骤2: 创建配置文件
```json
{
  "version": "1.0",
  "name": "document-generator-mcp",
  "description": "AI驱动的项目文档生成器MCP服务",
  "mcpServers": {
    "document-generator": {
      "command": "node",
      "args": ["/path/to/your/project/doc-generator-tool/dist/src/mcp-server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "tools": {
    "allowed": [
      "analyze_project",
      "generate_technical_overview", 
      "generate_complex_flow_analysis",
      "generate_problem_diagnosis",
      "list_analyzed_projects",
      "get_analysis_statistics"
    ]
  },
  "permissions": {
    "document-generator": "whitelist"
  }
}
```

## 不同环境的配置

### 1. 本地开发环境

#### 使用Claude Code Desktop
1. 运行配置脚本：`npm run mcp:setup`
2. 将生成的 `mcp-config.json` 复制到Claude Code配置目录：
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### 使用Claude Code CLI
1. 运行配置脚本：`npm run mcp:setup`
2. 将配置添加到Claude Code CLI配置：
   ```bash
   claude config set mcp.servers.document-generator.command "node"
   claude config set mcp.servers.document-generator.args '["/path/to/mcp-server.js"]'
   ```

### 2. 生产环境部署

#### Docker部署
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/mcp-server.js"]
```

#### 使用绝对路径配置
```json
{
  "mcpServers": {
    "document-generator": {
      "command": "node",
      "args": ["/app/dist/src/mcp-server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 3. 云端部署

#### Railway部署
1. 创建 `railway.json` 配置：
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "node dist/src/mcp-server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "on_failure"
  }
}
```

2. 使用环境变量配置路径：
```json
{
  "mcpServers": {
    "document-generator": {
      "command": "node",
      "args": ["${MCP_SERVER_PATH}"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### Vercel部署
1. 创建 `vercel.json`：
```json
{
  "functions": {
    "api/mcp-server.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

2. 配置MCP服务器路径：
```json
{
  "mcpServers": {
    "document-generator": {
      "command": "node",
      "args": ["/var/task/api/mcp-server.js"]
    }
  }
}
```

## 路径配置最佳实践

### 1. 使用环境变量
```json
{
  "mcpServers": {
    "document-generator": {
      "command": "node",
      "args": ["${MCP_SERVER_PATH:-/default/path/mcp-server.js}"]
    }
  }
}
```

### 2. 使用配置文件模板
```bash
# 创建配置模板
cp mcp-config-template.json mcp-config.json

# 替换路径占位符
sed -i "s|ABSOLUTE_PATH_TO_MCP_SERVER|$(pwd)/dist/src/mcp-server.js|g" mcp-config.json
```

### 3. 使用符号链接
```bash
# 创建全局符号链接
sudo ln -s $(pwd)/dist/src/mcp-server.js /usr/local/bin/doc-generator-mcp

# 配置中使用符号链接
{
  "mcpServers": {
    "document-generator": {
      "command": "doc-generator-mcp"
    }
  }
}
```

## 验证配置

### 1. 测试MCP服务器
```bash
# 直接测试
node dist/src/mcp-server.js

# 通过配置测试
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/src/mcp-server.js
```

### 2. 测试Claude Code集成
```bash
# 运行集成测试
npm run mcp:demo

# 检查配置
claude config get mcp.servers
```

### 3. 验证工具可用性
```bash
# 测试工具调用
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "analyze_project", "arguments": {"projectName": "Test", "projectPath": ".", "useMock": true}}}' | node dist/src/mcp-server.js
```

## 故障排除

### 常见问题

#### 1. 路径不存在
```
Error: Cannot find module '/path/to/mcp-server.js'
```
**解决方案**: 确保路径正确，使用 `npm run mcp:setup` 自动生成

#### 2. 权限问题
```
Error: EACCES: permission denied
```
**解决方案**: 检查文件权限，确保可执行

#### 3. 依赖缺失
```
Error: Cannot find module '@modelcontextprotocol/sdk'
```
**解决方案**: 运行 `npm install` 安装依赖

#### 4. 构建问题
```
Error: Cannot find module './project-analyzer'
```
**解决方案**: 运行 `npm run build` 重新构建

### 调试技巧

#### 1. 启用调试日志
```bash
DEBUG=mcp:* node dist/src/mcp-server.js
```

#### 2. 检查文件存在性
```bash
ls -la dist/src/mcp-server.js
file dist/src/mcp-server.js
```

#### 3. 验证Node.js版本
```bash
node --version
npm --version
```

#### 4. 检查环境变量
```bash
echo $NODE_ENV
echo $PATH
```

## 安全考虑

### 1. 文件权限
```bash
# 设置适当的文件权限
chmod 755 dist/src/mcp-server.js
chmod 644 mcp-config.json
```

### 2. 环境隔离
```bash
# 使用虚拟环境
npm install --prefix ./mcp-env
```

### 3. 网络安全
- 在生产环境中使用HTTPS
- 配置防火墙规则
- 限制网络访问

## 性能优化

### 1. 缓存配置
```json
{
  "mcpServers": {
    "document-generator": {
      "command": "node",
      "args": ["/path/to/mcp-server.js"],
      "env": {
        "NODE_ENV": "production",
        "NODE_OPTIONS": "--max-old-space-size=4096"
      }
    }
  }
}
```

### 2. 进程管理
```bash
# 使用PM2管理进程
npm install -g pm2
pm2 start dist/src/mcp-server.js --name "mcp-server"
```

### 3. 监控和日志
```bash
# 启用详细日志
NODE_ENV=production DEBUG=mcp:* node dist/src/mcp-server.js
```

---

*最后更新: 2025-01-15*
*版本: 1.0.0*

