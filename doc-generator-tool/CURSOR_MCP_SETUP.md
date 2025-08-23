# Cursor编辑器MCP配置指南

## 概述

本指南说明如何在Cursor编辑器中配置MCP文档生成器服务。

## 配置方式

### 方式1: 通过Cursor设置界面

1. **打开Cursor设置**
   - 按 `Cmd + ,` 打开设置
   - 或点击左下角齿轮图标 → Settings

2. **搜索MCP配置**
   - 在设置搜索框中输入 "MCP" 或 "Model Context Protocol"
   - 查找MCP服务器配置选项

3. **添加MCP服务器**
   - 点击 "Add MCP Server" 或类似按钮
   - 配置服务器信息：
     - **名称**: document-generator
     - **命令**: node
     - **参数**: `/Users/lshl124/Documents/daniel/git/code/aigc/cc-sdk-demo/doc-generator-tool/dist/src/mcp-server.js`

### 方式2: 直接编辑配置文件

1. **打开Cursor用户设置文件**
   ```bash
   code ~/Library/Application\ Support/Cursor/User/settings.json
   ```

2. **添加MCP配置**
   ```json
   {
     "editor.fontFamily": "Consolas, 'JetBrains Mono', monospace",
     "window.commandCenter": 1,
     "workbench.statusBar.visible": false,
     "aicontext.personalContext": "",
     "editor.inlineSuggest.enabled": true,
     "cursor.cpp.disabledLanguages": ["plaintext", "markdown", "scminput"],
     "git.autofetch": true,
     "workbench.colorTheme": "Visual Studio Light",
     "git.ignoreMissingGitWarning": true,
     "workbench.editorAssociations": {
       "*.html": "default"
     },
     "mcp.servers": {
       "document-generator": {
         "command": "node",
         "args": ["/Users/lshl124/Documents/daniel/git/code/aigc/cc-sdk-demo/doc-generator-tool/dist/src/mcp-server.js"],
         "env": {
           "NODE_ENV": "production"
         }
       }
     },
     "mcp.tools": {
       "allowed": [
         "analyze_project",
         "generate_technical_overview",
         "generate_complex_flow_analysis",
         "generate_problem_diagnosis",
         "list_analyzed_projects",
         "get_analysis_statistics"
       ]
     }
   }
   ```

### 方式3: 使用工作区配置

1. **在项目根目录创建 `.vscode/settings.json`**
   ```json
   {
     "mcp.servers": {
       "document-generator": {
         "command": "node",
         "args": ["${workspaceFolder}/dist/src/mcp-server.js"],
         "env": {
           "NODE_ENV": "production"
         }
       }
     },
     "mcp.tools": {
       "allowed": [
         "analyze_project",
         "generate_technical_overview",
         "generate_complex_flow_analysis",
         "generate_problem_diagnosis",
         "list_analyzed_projects",
         "get_analysis_statistics"
       ]
     }
   }
   ```

## 验证配置

### 1. 重启Cursor
配置完成后，重启Cursor编辑器以加载新的MCP配置。

### 2. 测试MCP服务
在Cursor中打开命令面板 (`Cmd + Shift + P`)，搜索MCP相关命令：
- "MCP: List Servers"
- "MCP: List Tools"
- "MCP: Test Connection"

### 3. 使用文档生成功能
在Cursor的AI聊天中，您可以尝试以下命令：
- "分析当前项目并生成技术总览"
- "生成复杂流程分析文档"
- "诊断项目问题并提供解决方案"

## 故障排除

### 常见问题

#### 1. MCP服务器未启动
```
Error: MCP server not responding
```
**解决方案**: 
- 确保MCP服务器文件存在
- 检查文件权限
- 手动启动服务器测试

#### 2. 工具不可用
```
Error: Tool not found
```
**解决方案**:
- 检查工具名称是否正确
- 确认工具已在配置中允许
- 重启Cursor编辑器

#### 3. 路径错误
```
Error: Cannot find module
```
**解决方案**:
- 使用绝对路径
- 确保路径中没有特殊字符
- 检查文件是否存在

### 调试步骤

1. **检查MCP服务器状态**
   ```bash
   node /Users/lshl124/Documents/daniel/git/code/aigc/cc-sdk-demo/doc-generator-tool/dist/src/mcp-server.js
   ```

2. **查看Cursor日志**
   - 打开命令面板
   - 搜索 "Developer: Show Logs"
   - 查看MCP相关日志

3. **测试工具调用**
   ```bash
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | node dist/src/mcp-server.js
   ```

## 高级配置

### 环境变量配置
```json
{
  "mcp.servers": {
    "document-generator": {
      "command": "node",
      "args": ["${env:MCP_SERVER_PATH}"],
      "env": {
        "NODE_ENV": "production",
        "MCP_SERVER_PATH": "/path/to/mcp-server.js"
      }
    }
  }
}
```

### 多服务器配置
```json
{
  "mcp.servers": {
    "document-generator": {
      "command": "node",
      "args": ["/path/to/doc-generator-mcp.js"]
    },
    "other-mcp-server": {
      "command": "python",
      "args": ["/path/to/other-mcp-server.py"]
    }
  }
}
```

## 最佳实践

1. **使用绝对路径** - 避免相对路径导致的路径解析问题
2. **环境隔离** - 为不同项目使用不同的MCP配置
3. **权限控制** - 只允许必要的工具访问
4. **日志记录** - 启用详细日志以便调试
5. **定期更新** - 保持MCP服务器和工具的最新版本

---

*最后更新: 2025-01-15*
*版本: 1.0.0*

