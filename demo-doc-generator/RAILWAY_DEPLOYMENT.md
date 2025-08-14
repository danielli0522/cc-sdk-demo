# Railway 部署指南

## 快速部署

### 方式一：使用脚本自动部署

```bash
# 运行自动部署脚本
./deploy-to-railway.sh
```

### 方式二：手动部署

1. **安装 Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **登录 Railway**
   ```bash
   railway login
   ```

3. **初始化项目**
   ```bash
   railway init
   ```

4. **部署应用**
   ```bash
   railway up
   ```

5. **打开应用**
   ```bash
   railway open
   ```

### 方式三：GitHub 集成部署

1. 在 Railway 控制台创建新项目
2. 连接到你的 GitHub 仓库
3. 选择 `demo-doc-generator` 分支
4. Railway 将自动使用 `railway.json` 配置进行部署

## 配置说明

项目已包含以下配置文件：

- `railway.json` - Railway 部署配置
- `Procfile` - 进程定义文件
- `.github/workflows/deploy-doc-generator.yml` - GitHub Actions 自动部署

## 访问应用

部署完成后，访问提供的 Railway URL 即可看到 Claude Code 文档生成器首页。

## 功能特性

- 🎯 智能项目分析
- 📋 多文档类型支持
- 🔍 技术栈自动检测
- 📊 架构图表生成

## 故障排除

如遇到部署问题，请检查：

1. Node.js 版本 >= 18
2. Railway CLI 已正确安装和登录
3. 项目配置文件完整
4. 网络连接正常