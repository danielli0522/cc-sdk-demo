# 智能代码重构工具

基于 Claude Code SDK 的智能代码重构工具，支持多种重构类型和自定义重构指令。

## 🌟 特性

- **多种重构类型**：支持函数提取、变量重命名、性能优化、可读性改善等
- **智能分析**：使用 Claude AI 进行代码分析和重构建议
- **安全重构**：自动备份，支持一键回滚
- **批量处理**：支持多文件和目录批量重构
- **类型安全**：完整的 TypeScript 类型支持
- **可配置性**：灵活的配置选项和偏好设置
- **详细报告**：生成详细的重构报告和变更说明

## 📦 安装

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 全局安装（可选）
npm install -g .
```

## 🚀 快速开始

### 命令行使用

```bash
# 基础使用 - 改善代码可读性
refactor --target ./src --type improve_readability

# 提取重复代码为函数
refactor --target app.js --type extract_function --auto-confirm

# 使用配置文件
refactor --config ./refactor-config.json

# 性能优化
refactor --target ./utils --type optimize_performance --no-backup

# 回滚到之前的版本
refactor --rollback abc12345
```

### 编程接口使用

```typescript
import { createRefactor, RefactorType } from 'claude-code-refactor';

// 创建重构器实例
const refactor = createRefactor({
  type: RefactorType.IMPROVE_READABILITY,
  target: './src/legacy-code.js',
  createBackup: true,
  autoConfirm: true,
  preferences: {
    codeStyle: 'standard',
    useModernSyntax: true,
    maxFunctionLength: 50
  }
});

// 执行重构
const result = await refactor.refactor();

console.log(`重构完成: ${result.success}`);
console.log(`处理文件: ${result.filesProcessed.length}`);
console.log(`变更数量: ${result.changes.length}`);
```

## 🔧 重构类型

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `extract_function` | 提取函数 | 消除重复代码，提高复用性 |
| `rename_variable` | 重命名变量 | 改善变量名的可读性 |
| `optimize_performance` | 性能优化 | 改进算法和数据结构 |
| `improve_readability` | 改善可读性 | 简化复杂逻辑，改善代码结构 |
| `add_types` | 添加类型 | 为 JavaScript 代码添加 TypeScript 类型 |
| `modernize_syntax` | 现代化语法 | 使用 ES6+ 现代语法特性 |
| `remove_dead_code` | 移除死代码 | 清理未使用的代码和导入 |
| `custom` | 自定义重构 | 根据自定义指令进行重构 |

## ⚙️ 配置选项

### 基础配置

```json
{
  "type": "improve_readability",
  "target": "./src",
  "createBackup": true,
  "backupDir": "./refactor-backups",
  "autoConfirm": false,
  "includeExtensions": [".ts", ".js", ".tsx", ".jsx"],
  "excludePatterns": ["node_modules", "dist", "build", ".git"]
}
```

### 重构偏好

```json
{
  "preferences": {
    "codeStyle": "standard",
    "targetESVersion": "ES2022",
    "strictTypes": true,
    "preserveComments": true,
    "maxFunctionLength": 50,
    "useModernSyntax": true
  }
}
```

### 自定义重构

```json
{
  "type": "custom",
  "customInstructions": "请将所有的 var 声明改为 const 或 let，并添加类型注解"
}
```

## 📋 使用示例

### 示例 1: 改善遗留代码可读性

```bash
refactor --target legacy-app.js --type improve_readability --auto-confirm
```

**重构前:**
```javascript
function processData(data) {
    var result = [];
    for (var i = 0; i < data.length; i++) {
        if (data[i].status == 'active') {
            if (data[i].type == 'user') {
                if (data[i].age > 18) {
                    result.push({
                        id: data[i].id,
                        name: data[i].name,
                        email: data[i].email
                    });
                }
            }
        }
    }
    return result;
}
```

**重构后:**
```javascript
function processData(data) {
    return data
        .filter(item => item.status === 'active')
        .filter(item => item.type === 'user')
        .filter(item => item.age > 18)
        .map(item => ({
            id: item.id,
            name: item.name,
            email: item.email
        }));
}
```

### 示例 2: 提取重复代码

```bash
refactor --target utils.js --type extract_function
```

识别并提取重复的代码块为独立函数，提高代码复用性。

### 示例 3: 性能优化

```bash
refactor --target data-processor.js --type optimize_performance
```

优化循环、算法复杂度和数据结构使用。

## 🛡️ 安全特性

### 自动备份

每次重构前自动创建备份：

```bash
# 创建备份（默认行为）
refactor --target app.js --type modernize_syntax

# 禁用备份
refactor --target app.js --type modernize_syntax --no-backup
```

### 一键回滚

```bash
# 查看备份列表
ls ./refactor-backups

# 回滚到指定版本
refactor --rollback abc12345
```

### 权限控制

工具只能访问指定的文件和目录，确保安全性：

```json
{
  "target": "./src",
  "excludePatterns": ["node_modules", ".env", "config/secrets"]
}
```

## 📊 重构报告

每次重构完成后，工具会生成详细的报告：

```json
{
  "success": true,
  "filesProcessed": ["app.js", "utils.js"],
  "changes": [
    {
      "filePath": "app.js",
      "changeType": "improve_readability",
      "description": "简化了嵌套条件语句",
      "linesChanged": 15
    }
  ],
  "backupInfo": {
    "backupId": "abc12345",
    "backupPath": "./refactor-backups/backup-abc12345",
    "timestamp": "2024-12-19T10:30:00.000Z"
  },
  "duration": 2500,
  "report": "详细的重构分析和建议..."
}
```

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行功能演示
npm run demo

# 运行特定测试
node dist/test/test-runner.js test
```

## 🔍 故障排除

### 常见问题

**Q: 重构失败，显示认证错误？**
A: 确保已正确安装并登录 Claude CLI：
```bash
npm install -g @anthropic-ai/claude-code
claude login
```

**Q: 某些文件没有被处理？**
A: 检查文件扩展名和排除模式：
```json
{
  "includeExtensions": [".ts", ".js", ".tsx", ".jsx"],
  "excludePatterns": ["node_modules", "dist"]
}
```

**Q: 重构结果不符合预期？**
A: 尝试调整重构偏好或使用自定义指令：
```json
{
  "type": "custom",
  "customInstructions": "具体的重构要求..."
}
```

### 调试模式

启用详细日志输出：

```bash
DEBUG=true refactor --target app.js --type improve_readability
```

## 📚 进阶使用

### 批量重构多个项目

```bash
# 创建批处理脚本
#!/bin/bash
for dir in project1 project2 project3; do
  cd $dir
  refactor --target src --type improve_readability --auto-confirm
  cd ..
done
```

### 集成到 CI/CD

```yaml
# .github/workflows/refactor.yml
name: Code Refactor
on: [push]
jobs:
  refactor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install -g claude-code-refactor
      - run: refactor --target src --type improve_readability --auto-confirm
```

### 自定义重构规则

```typescript
// 扩展重构器
class CustomRefactor extends CodeRefactor {
  async customRefactorRule(filePath: string): Promise<void> {
    // 自定义重构逻辑
  }
}
```

## 🤝 贡献

欢迎贡献代码、报告问题或提出改进建议！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Claude Code SDK](https://github.com/anthropics/claude-code) - 提供强大的 AI 代码分析能力
- [Anthropic](https://www.anthropic.com) - Claude AI 模型
- 所有贡献者和测试者

---

**让 AI 帮助你写出更好的代码！** 🚀

