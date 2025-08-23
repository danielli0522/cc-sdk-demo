# MCP (Model Context Protocol) 集成指南

本文档详细说明如何将文档生成器封装为MCP服务，供其他智能体使用。

## 概述

MCP (Model Context Protocol) 是一个标准化的协议，允许AI模型与外部工具和服务进行交互。我们将文档生成器封装为MCP服务，使其可以被任何支持MCP的AI智能体使用。

## 架构设计

### 服务架构
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI智能体      │    │   MCP客户端      │    │   MCP服务器     │
│  (Claude等)     │◄──►│  (Transport)     │◄──►│  (文档生成器)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 核心组件
- **MCP服务器**: `src/mcp-server.ts` - 实现MCP协议的服务端
- **MCP客户端**: `src/mcp-client.ts` - 客户端示例和工具类
- **配置文件**: `mcp-config.json` - MCP服务配置
- **集成示例**: `examples/claude-sdk-integration.ts` - Claude Code SDK集成

## 安装和设置

### 1. 安装依赖
```bash
npm install
npm install @modelcontextprotocol/sdk @instantlyeasy/claude-code-sdk-ts
```

### 2. 构建项目
```bash
npm run build
```

### 3. 启动MCP服务器
```bash
# 开发模式
npx tsx src/mcp-server.ts

# 生产模式
npm run mcp:server
```

## 可用工具

MCP服务提供以下工具：

### 1. analyze_project
**功能**: 分析项目结构并生成技术文档

**参数**:
- `projectName` (string, 必需): 项目名称
- `projectPath` (string, 必需): 项目路径
- `outputDir` (string, 可选): 输出目录，默认 `./docs`
- `documentTypes` (array, 可选): 文档类型，默认 `['all']`
  - `technical-overview`: 技术总览
  - `complex-flow`: 复杂流程分析
  - `problem-diagnosis`: 问题诊断
  - `all`: 所有类型
- `maxFiles` (number, 可选): 最大扫描文件数，默认 200
- `useMock` (boolean, 可选): 使用模拟分析器，默认 false

**示例**:
```json
{
  "name": "analyze_project",
  "arguments": {
    "projectName": "MyProject",
    "projectPath": "/path/to/project",
    "outputDir": "./docs",
    "documentTypes": ["technical-overview", "complex-flow"],
    "maxFiles": 100,
    "useMock": false
  }
}
```

### 2. generate_technical_overview
**功能**: 生成项目技术总览文档

**参数**:
- `projectName` (string, 必需): 项目名称
- `projectPath` (string, 必需): 项目路径
- `outputDir` (string, 可选): 输出目录，默认 `./docs`

### 3. generate_complex_flow_analysis
**功能**: 生成复杂流程分析文档

**参数**: 同 `generate_technical_overview`

### 4. generate_problem_diagnosis
**功能**: 生成问题诊断与解决方案文档

**参数**: 同 `generate_technical_overview`

### 5. list_analyzed_projects
**功能**: 列出已分析的项目

**参数**: 无

### 6. get_analysis_statistics
**功能**: 获取项目分析统计信息

**参数**:
- `projectName` (string, 必需): 项目名称

## 使用方式

### 方式1: 直接使用MCP客户端

```typescript
import { DocumentGeneratorMCPClient } from './src/mcp-client.js';

async function example() {
  const client = new DocumentGeneratorMCPClient();
  
  try {
    // 连接服务器
    await client.connect();
    
    // 分析项目
    const result = await client.analyzeProject({
      projectName: 'MyProject',
      projectPath: '/path/to/project',
      outputDir: './docs',
      documentTypes: ['technical-overview'],
      useMock: false
    });
    
    console.log(result.content[0].text);
    
  } finally {
    await client.disconnect();
  }
}
```

### 方式2: 集成到Claude Code SDK

```typescript
import { claude } from '@instantlyeasy/claude-code-sdk-ts';

async function claudeIntegration() {
  const response = await claude()
    .withMCP({
      command: 'node',
      args: ['src/mcp-server.js'],
      env: { NODE_ENV: 'production' }
    })
    .allowTools('analyze_project', 'generate_technical_overview')
    .query(`
请分析项目并生成技术总览文档：
- 项目名称: MyProject
- 项目路径: /path/to/project
- 输出目录: ./docs
    `)
    .asText();
    
  console.log(response);
}
```

### 方式3: 使用配置文件

```typescript
import { claude } from '@instantlyeasy/claude-code-sdk-ts';

async function configFileIntegration() {
  const response = await claude()
    .withConfigFile('mcp-config.json')
    .withMCPServerPermission('document-generator', 'whitelist')
    .query('分析当前项目并生成所有类型的文档')
    .asText();
    
  console.log(response);
}
```

## 配置文件说明

### mcp-config.json
```json
{
  "version": "1.0",
  "name": "document-generator-mcp",
  "description": "AI驱动的项目文档生成器MCP服务",
  "mcpServers": {
    "document-generator": {
      "command": "node",
      "args": ["src/mcp-server.js"],
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

## 运行示例

### 1. 运行MCP客户端示例
```bash
npm run mcp:client
```

### 2. 运行Claude SDK集成示例
```bash
npm run mcp:demo
```

### 3. 测试MCP服务器
```bash
# 启动服务器
npm run mcp:server

# 在另一个终端测试
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/src/mcp-server.js
```

## 错误处理

### 常见错误及解决方案

1. **连接失败**
   ```
   错误: MCP服务器启动失败
   解决: 检查Node.js版本 >= 18，确保依赖已安装
   ```

2. **工具调用失败**
   ```
   错误: 工具执行失败: 项目路径不存在
   解决: 检查项目路径是否正确，确保路径存在
   ```

3. **权限错误**
   ```
   错误: 工具访问被拒绝
   解决: 检查MCP配置中的权限设置
   ```

## 性能优化

### 1. 缓存机制
- 分析器实例会被缓存，避免重复初始化
- 项目分析结果可以复用

### 2. 并发控制
- 支持多个客户端同时连接
- 每个分析任务独立执行

### 3. 资源管理
- 自动清理过期的分析器实例
- 内存使用监控和优化

## 安全考虑

### 1. 权限控制
- 工具级别的权限管理
- 服务器级别的访问控制

### 2. 输入验证
- 项目路径验证
- 参数类型检查

### 3. 错误信息脱敏
- 生产环境不暴露敏感信息
- 错误日志记录

## 扩展开发

### 添加新工具

1. 在 `mcp-server.ts` 中添加工具定义
2. 实现工具处理器
3. 更新工具列表

```typescript
// 添加新工具
{
  name: 'custom_analysis',
  description: '自定义分析工具',
  inputSchema: {
    type: 'object',
    properties: {
      // 定义参数
    },
    required: ['param1']
  }
}

// 实现处理器
private async handleCustomAnalysis(args: any): Promise<any> {
  // 实现逻辑
}
```

### 自定义传输层

支持不同的传输方式：
- Stdio (当前实现)
- TCP
- WebSocket
- HTTP

## 故障排除

### 调试模式
```bash
# 启用调试日志
DEBUG=mcp:* npm run mcp:server
```

### 日志查看
```bash
# 查看服务器日志
npm run mcp:server 2>&1 | tee mcp-server.log
```

### 性能监控
```bash
# 监控资源使用
node --inspect src/mcp-server.js
```

## 最佳实践

1. **配置管理**: 使用配置文件管理MCP设置
2. **错误处理**: 实现完善的错误处理机制
3. **资源清理**: 及时清理连接和资源
4. **监控日志**: 记录关键操作和错误信息
5. **安全验证**: 验证输入参数和权限

## 相关资源

- [MCP官方文档](https://modelcontextprotocol.io/)
- [Claude Code SDK文档](https://github.com/instantlyeasy/claude-code-sdk-ts)
- [项目文档生成器](README.md)

---

*最后更新: 2025-01-15*
*版本: 1.0.0*

