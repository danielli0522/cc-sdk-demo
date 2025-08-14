#!/usr/bin/env node

/**
 * 项目文档生成器使用示例
 */

import { createProjectAnalyzer, DocumentType } from '../src/project-analyzer.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 示例1: 基础项目文档生成
 */
async function example1_BasicDocGeneration(): Promise<void> {
  console.log('📖 示例1: 基础项目文档生成');
  console.log('='.repeat(40));

  // 创建示例项目结构
  const testProjectDir = join(__dirname, 'sample-project');
  await createSampleProject(testProjectDir);

  try {
    // 配置分析器
    const analyzer = createProjectAnalyzer({
      projectName: 'SampleWebApp',
      projectPath: testProjectDir,
      outputDir: join(__dirname, 'generated-docs'),
      generateAll: true,
      maxFiles: 50
    });

    console.log('🚀 开始分析项目...');
    const result = await analyzer.analyzeProject();

    console.log('\n📊 分析结果:');
    console.log(`✅ 成功: ${result.errors.length === 0}`);
    console.log(`📁 扫描文件: ${result.statistics.filesScanned}`);
    console.log(`📏 代码行数: ${result.statistics.linesOfCode}`);
    console.log(`🔧 技术栈: ${result.statistics.detectedTechnologies.join(', ')}`);
    console.log(`📄 生成文档: ${result.generatedDocuments.length} 个`);

    if (result.generatedDocuments.length > 0) {
      console.log('\n📚 生成的文档:');
      result.generatedDocuments.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.type}`);
        console.log(`     文件: ${doc.filePath}`);
        console.log(`     大小: ${doc.content.length} 字符`);
      });
    }

    if (result.errors.length > 0) {
      console.log('\n❌ 错误信息:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('❌ 文档生成失败:', error);
  } finally {
    // 清理测试项目
    await fs.rm(testProjectDir, { recursive: true, force: true });
  }
}

/**
 * 示例2: 单个文档类型生成
 */
async function example2_SingleDocumentType(): Promise<void> {
  console.log('\n📝 示例2: 生成技术总览文档');
  console.log('='.repeat(40));

  // 针对当前项目生成技术总览
  const analyzer = createProjectAnalyzer({
    projectName: 'ClaudeCodeRefactor',
    projectPath: join(__dirname, '..'),
    outputDir: join(__dirname, 'single-doc'),
    generateAll: false,
    maxFiles: 30
  });

  try {
    console.log('📝 生成技术总览文档...');
    const result = await analyzer.analyzeProject();

    console.log(`\n📊 分析统计:`);
    console.log(`- 文件数: ${result.statistics.filesScanned}`);
    console.log(`- 代码行数: ${result.statistics.linesOfCode}`);
    console.log(`- 技术栈: ${result.statistics.detectedTechnologies.join(', ')}`);

  } catch (error) {
    console.error('❌ 文档生成失败:', error);
  }
}

/**
 * 示例3: 自定义配置演示
 */
async function example3_CustomConfiguration(): Promise<void> {
  console.log('\n⚙️ 示例3: 自定义配置演示');
  console.log('='.repeat(40));

  const customConfig = {
    projectName: 'CustomAnalysis',
    projectPath: join(__dirname, '..'),
    outputDir: join(__dirname, 'custom-docs'),
    includeExtensions: ['.ts', '.js', '.md'],
    excludePatterns: ['node_modules', 'dist', 'test', 'examples'],
    maxFiles: 20,
    generateAll: false
  };

  console.log('📋 自定义配置:');
  console.log(`- 项目名: ${customConfig.projectName}`);
  console.log(`- 包含扩展名: ${customConfig.includeExtensions.join(', ')}`);
  console.log(`- 排除模式: ${customConfig.excludePatterns.join(', ')}`);
  console.log(`- 最大文件数: ${customConfig.maxFiles}`);

  const analyzer = createProjectAnalyzer(customConfig);

  try {
    const result = await analyzer.analyzeProject();
    console.log(`\n✅ 配置验证成功`);
    console.log(`📁 实际扫描文件: ${result.statistics.filesScanned}`);

  } catch (error) {
    console.error('❌ 配置验证失败:', error);
  }
}

/**
 * 创建示例项目结构
 */
async function createSampleProject(projectDir: string): Promise<void> {
  await fs.mkdir(projectDir, { recursive: true });

  // 创建 package.json
  const packageJson = {
    name: 'sample-web-app',
    version: '1.0.0',
    dependencies: {
      'react': '^18.0.0',
      'express': '^4.18.0',
      'axios': '^1.0.0'
    },
    devDependencies: {
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0'
    }
  };

  await fs.writeFile(
    join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // 创建主应用文件
  const appJs = `
// 主应用入口
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsersFromDatabase();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const newUser = await createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'Invalid user data' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

// 数据库操作
async function getUsersFromDatabase() {
  // 模拟数据库查询
  return [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ];
}

async function createUser(userData) {
  // 模拟用户创建
  return {
    id: Date.now(),
    ...userData,
    createdAt: new Date().toISOString()
  };
}

module.exports = app;
`;

  await fs.writeFile(join(projectDir, 'app.js'), appJs);

  // 创建前端组件
  await fs.mkdir(join(projectDir, 'src', 'components'), { recursive: true });
  
  const userComponent = `
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: Omit<User, 'id'>) => {
    try {
      const response = await axios.post('/api/users', userData);
      setUsers(prev => [...prev, response.data]);
    } catch (err) {
      setError('Failed to create user');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
`;

  await fs.writeFile(join(projectDir, 'src', 'components', 'UserList.tsx'), userComponent);

  // 创建工具文件
  await fs.mkdir(join(projectDir, 'src', 'utils'), { recursive: true });
  
  const utilsFile = `
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};
`;

  await fs.writeFile(join(projectDir, 'src', 'utils', 'helpers.ts'), utilsFile);

  // 创建 README
  const readme = `
# Sample Web App

这是一个示例 Web 应用，展示了现代全栈开发的基本结构。

## 技术栈

- **后端**: Node.js + Express
- **前端**: React + TypeScript  
- **工具**: Axios, CORS

## 功能特性

- 用户管理 API
- React 组件
- TypeScript 类型安全
- 实用工具函数

## 安装和运行

\`\`\`bash
npm install
npm start
\`\`\`
`;

  await fs.writeFile(join(projectDir, 'README.md'), readme);

  console.log(`✅ 示例项目已创建: ${projectDir}`);
}

/**
 * 运行所有示例
 */
async function runAllExamples(): Promise<void> {
  console.log('🎯 项目文档生成器演示');
  console.log('='.repeat(50));

  try {
    await example1_BasicDocGeneration();
    await example2_SingleDocumentType();
    await example3_CustomConfiguration();

    console.log('\n🎉 所有示例演示完成！');
    console.log('\n📚 使用说明:');
    console.log('1. 运行命令行工具: node dist/doc-generator-cli.js');
    console.log('2. 使用交互模式: node dist/doc-generator-cli.js --interactive');
    console.log('3. 指定项目: node dist/doc-generator-cli.js --project-name MyApp --project-path ./src');

  } catch (error) {
    console.error('💥 演示失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

