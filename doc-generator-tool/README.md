# Claude Code 文档生成器

一个使用 Claude Code SDK 的智能项目文档生成工具，能够自动分析代码项目并生成高质量的技术文档。

## 功能特性

- 🔍 **智能项目分析**: 自动分析项目结构、技术栈和复杂模块
- 📋 **多种文档类型**: 支持生成技术总览、复杂流程分析和问题诊断方案
- 🎯 **准确技术栈检测**: 基于文件扩展名和配置文件智能识别技术栈
- 📊 **详细架构图**: 自动生成 Mermaid 架构图和序列图
- 🔧 **灵活配置**: 支持自定义分析深度和输出格式
- 🤖 **MCP服务**: 封装为Model Context Protocol服务，供其他智能体使用
- 🔌 **多平台集成**: 支持Claude Code SDK、独立MCP客户端等多种使用方式

## 安装

```bash
# 从父目录安装依赖
npm install

# 构建项目
npm run build
```

## 使用方法

### 命令行使用

```bash
# 启动交互式CLI
npm start

# 或者直接运行
npx tsx src/doc-generator-cli.ts
```

### 编程使用

```typescript
import { ProjectAnalyzer } from './src/project-analyzer';

const analyzer = new ProjectAnalyzer({
  claude: claudeInstance,
  outputDir: './docs',
  analysisDepth: 'deep'
});

// 生成所有类型的文档
const results = await analyzer.generateAllDocuments(
  'my-project',
  '/path/to/project'
);
```

## 文档类型

### 1. 技术总览 (Technical Overview)
- 项目概述和核心功能
- 技术栈分析
- 架构图表 (逻辑、开发、部署、运行时、数据视图)
- 复杂模块识别

### 2. 复杂流程分析 (Complex Flow Analysis)
- 深入分析高复杂度和中复杂度流程
- 详细的序列图
- 关键配置说明
- 逐步流程解析

### 3. 问题诊断方案 (Problem Diagnosis & Solutions)
- 常见问题识别
- 性能瓶颈分析
- 最佳实践建议
- 故障排除指南

## 配置选项

```typescript
interface AnalysisConfig {
  analysisDepth: 'basic' | 'detailed' | 'deep';
  includeArchitecture: boolean;
  includeMermaidDiagrams: boolean;
  maxFileSize: number;
  excludePatterns: string[];
}
```

## MCP服务

### 快速启动
```bash
# 1. 构建项目
npm run build

# 2. 生成MCP配置（自动设置绝对路径）
npm run mcp:setup

# 3. 使用启动脚本
./start-mcp.sh

# 或手动启动
npm run mcp:server    # 启动MCP服务器
npm run mcp:client    # 运行客户端示例
npm run mcp:demo      # 运行Claude SDK集成示例
```

### 集成到Claude Code SDK

#### 方式1: 使用配置文件（推荐）
```bash
# 1. 生成配置
npm run mcp:setup

# 2. 将生成的 mcp-config.json 复制到Claude Code配置目录
# macOS: ~/Library/Application Support/Claude/
# Windows: %APPDATA%\Claude\
# Linux: ~/.config/Claude/
```

#### 方式2: 代码集成
```typescript
import { claude } from '@instantlyeasy/claude-code-sdk-ts';

const response = await claude()
  .withMCP({
    command: 'node',
    args: ['/absolute/path/to/dist/src/mcp-server.js']
  })
  .allowTools('Read', 'Write', 'LS', 'Grep')
  .query('分析项目并生成技术文档')
  .asText();
```

详细文档请参考: 
- [MCP集成指南](MCP_INTEGRATION.md)
- [MCP部署指南](MCP_DEPLOYMENT_GUIDE.md)

## 测试

```bash
# 运行完整测试套件
npm test

# 运行简化验证测试 (不需要Claude CLI)
npm run test:simple
```

## 示例

```bash
# 运行演示示例
npm run demo

# 运行MCP示例
npm run mcp:demo
```

## 项目结构

```
doc-generator/
├── src/
│   ├── project-analyzer.ts     # 核心分析器
│   └── doc-generator-cli.ts    # CLI接口
├── test/
│   ├── doc-generator-test.ts   # 完整测试套件
│   └── simple-validation.ts    # 简化验证测试
├── examples/
│   └── doc-generator-demo.ts   # 使用示例
└── dist/                       # 编译输出
```

## 技术栈

- **TypeScript**: 主要开发语言
- **Claude Code SDK**: AI 交互核心
- **Node.js**: 运行环境
- **fs-extra**: 文件系统操作
- **chalk**: 终端输出美化

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request!
