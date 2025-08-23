# Claude CLI Raw Mode 错误解决方案

## 问题描述

在运行重构工具时遇到以下错误：
```
Error: Raw mode is not supported on the current process.stdin, which Ink uses as input stream by default.
```

## 根本原因分析

经过深入分析，发现问题的根本原因是：

1. **Claude CLI 未登录**: Claude CLI 需要先进行身份验证
2. **交互式模式冲突**: 在非 TTY 环境中运行交互式 CLI 工具
3. **权限提示**: Claude CLI 默认会提示用户确认工具使用权限

## 解决方案

### 🔧 方案 1: 登录 Claude CLI（推荐）

```bash
# 1. 登录 Claude CLI
claude login

# 2. 接受信任对话框（如果出现）
# 在交互过程中选择 "Yes" 或 "Accept"

# 3. 测试登录状态
claude --print "Hello, test message"
```

### 🛠️ 方案 2: 使用 API 密钥模式

如果无法使用 Claude CLI 登录，可以修改代码使用 API 密钥：

```typescript
// 在 code-refactor.ts 中修改构造函数
constructor(config: Partial<RefactorConfig>) {
  this.config = this.mergeWithDefaults(config);
  this.claude = claude()
    .withModel('claude-3-5-sonnet-20241022')
    .allowTools('Read', 'Write', 'Edit', 'LS', 'Grep')
    .withTimeout(60000)
    .skipPermissions() // 跳过权限提示
    // 如果有 API 密钥，添加以下行：
    // .query('prompt', { apiKey: 'your-api-key' });
}
```

### 🔍 方案 3: 环境变量配置

设置环境变量来确保非交互式运行：

```bash
export ANTHROPIC_NO_TTY=1
export NODE_ENV=production
export CI=true  # 模拟 CI 环境

# 然后运行重构工具
node dist/cli.js --target test-example.js --type improve_readability --auto-confirm
```

## 验证修复效果

### 步骤 1: 验证 Claude CLI 状态
```bash
# 检查版本
claude --version

# 检查配置
claude config list

# 测试简单查询（需要先登录）
claude --print "Say hello"
```

### 步骤 2: 测试重构工具
```bash
# 重新构建项目
npm run build

# 运行测试
node test-fix.js

# 或直接运行重构
node dist/cli.js --target test-example.js --type improve_readability --auto-confirm
```

## 已应用的修复

### ✅ 代码修改

1. **添加 `skipPermissions()`**: 自动跳过权限提示
2. **改进错误处理**: 更详细的错误信息
3. **非交互式参数**: 使用 `--print` 和 `--dangerously-skip-permissions`

### ✅ 配置优化

```typescript
// 构造函数中的修改
this.claude = claude()
  .withModel('claude-3-5-sonnet-20241022')
  .allowTools('Read', 'Write', 'Edit', 'LS', 'Grep')
  .withTimeout(60000)
  .skipPermissions(); // 关键修复

// 重构方法中的修改
const response = await this.claude
  .skipPermissions() // 确保跳过所有权限提示
  .inDirectory(dirname(filePath))
  .onToolUse((tool: any) => {
    console.log(`🔧 使用工具: ${tool.name}`);
  })
  .query(instructions)
  .asToolExecutions();
```

## 常见问题

### Q: 仍然出现 "Invalid API key" 错误？
**A**: 需要先运行 `claude login` 进行身份验证。

### Q: 登录后仍然有权限错误？
**A**: 确保在代码中添加了 `.skipPermissions()` 调用。

### Q: 在 CI/CD 环境中如何使用？
**A**: 考虑使用 API 密钥模式或设置适当的环境变量。

### Q: 如何批量处理多个文件？
**A**: 重构工具支持目录和 glob 模式：
```bash
node dist/cli.js --target "src/**/*.js" --type improve_readability --auto-confirm
```

## 注意事项

1. **备份**: 重构工具会自动创建备份，路径在 `refactor-backups/` 目录
2. **权限**: 使用 `--dangerously-skip-permissions` 需要确保运行环境安全
3. **模型选择**: 目前使用 `claude-3-5-sonnet-20241022`，可根据需要调整
4. **超时设置**: 默认 60 秒超时，可在配置中调整

## 下一步

如果问题仍然存在，可以：

1. 检查 Claude CLI 版本是否最新
2. 尝试重新安装 Claude CLI
3. 查看详细的错误日志
4. 联系 Anthropic 支持团队

---

*最后更新: 2024年*







