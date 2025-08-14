#!/usr/bin/env node

/**
 * 代码重构工具基础使用示例
 */

import { createRefactor, RefactorType } from '../src/code-refactor.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 示例1: 基础重构 - 改善可读性
 */
async function example1_BasicRefactor(): Promise<void> {
  console.log('📖 示例1: 基础代码可读性改善');
  console.log('='.repeat(40));

  // 创建示例代码文件
  const sampleCode = `
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
`;

  const testFile = join(__dirname, 'sample-code.js');
  await fs.writeFile(testFile, sampleCode);

  try {
    // 创建重构器实例
    const refactor = createRefactor({
      type: RefactorType.IMPROVE_READABILITY,
      target: testFile,
      createBackup: true,
      autoConfirm: true,
      preferences: {
        codeStyle: 'standard',
        preserveComments: true,
        maxFunctionLength: 30,
        useModernSyntax: true
      }
    });

    // 执行重构
    console.log('🚀 开始重构...');
    const result = await refactor.refactor();

    // 显示结果
    console.log('\n📊 重构结果:');
    console.log(`✅ 成功: ${result.success}`);
    console.log(`📁 处理文件: ${result.filesProcessed.length}`);
    console.log(`🔄 变更数: ${result.changes.length}`);
    console.log(`⏱️  耗时: ${result.duration}ms`);

    if (result.backupInfo) {
      console.log(`💾 备份ID: ${result.backupInfo.backupId}`);
    }

    // 显示重构后的代码
    const refactoredCode = await fs.readFile(testFile, 'utf-8');
    console.log('\n📄 重构后的代码:');
    console.log('```javascript');
    console.log(refactoredCode);
    console.log('```');

  } catch (error) {
    console.error('❌ 重构失败:', error.message);
  } finally {
    // 清理测试文件
    try {
      await fs.unlink(testFile);
    } catch (error) {
      // 忽略清理错误
    }
  }
}

/**
 * 示例2: 批量重构 - 多文件处理
 */
async function example2_BatchRefactor(): Promise<void> {
  console.log('\n📁 示例2: 批量文件重构');
  console.log('='.repeat(40));

  // 创建多个测试文件
  const files = [
    {
      name: 'utils.js',
      content: `
var helper = {
    formatDate: function(date) {
        var d = new Date(date);
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    },
    validateInput: function(input) {
        if (input == null || input == undefined) {
            return false;
        }
        return true;
    }
};
`
    },
    {
      name: 'api.js',
      content: `
function makeRequest(url, data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                callback(null, JSON.parse(xhr.responseText));
            } else {
                callback(new Error('Request failed'));
            }
        }
    };
    xhr.send(JSON.stringify(data));
}
`
    }
  ];

  const testDir = join(__dirname, 'batch-test');
  await fs.mkdir(testDir, { recursive: true });

  try {
    // 创建测试文件
    for (const file of files) {
      await fs.writeFile(join(testDir, file.name), file.content);
    }

    // 执行批量重构
    const refactor = createRefactor({
      type: RefactorType.MODERNIZE_SYNTAX,
      target: testDir,
      createBackup: true,
      autoConfirm: true,
      includeExtensions: ['.js'],
      preferences: {
        targetESVersion: 'ES2022',
        useModernSyntax: true,
        strictTypes: false
      }
    });

    console.log('🚀 开始批量重构...');
    const result = await refactor.refactor();

    console.log('\n📊 批量重构结果:');
    console.log(`✅ 成功: ${result.success}`);
    console.log(`📁 处理文件: ${result.filesProcessed.length}`);
    console.log(`🔄 总变更数: ${result.changes.length}`);

    // 显示每个文件的变更
    result.changes.forEach(change => {
      console.log(`   📄 ${change.filePath}: ${change.description}`);
    });

    if (result.report) {
      console.log('\n📋 重构报告:');
      console.log(result.report);
    }

  } catch (error) {
    console.error('❌ 批量重构失败:', error.message);
  } finally {
    // 清理测试目录
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  }
}

/**
 * 示例3: 自定义重构
 */
async function example3_CustomRefactor(): Promise<void> {
  console.log('\n🎨 示例3: 自定义重构指令');
  console.log('='.repeat(40));

  const customCode = `
// 需要自定义重构的代码
class UserManager {
    constructor() {
        this.users = [];
    }
    
    addUser(user) {
        this.users.push(user);
    }
    
    removeUser(id) {
        this.users = this.users.filter(u => u.id !== id);
    }
    
    findUser(id) {
        return this.users.find(u => u.id === id);
    }
}
`;

  const testFile = join(__dirname, 'custom-refactor.js');
  await fs.writeFile(testFile, customCode);

  try {
    const refactor = createRefactor({
      type: RefactorType.CUSTOM,
      target: testFile,
      customInstructions: `
请对这个 UserManager 类进行以下改进:
1. 添加 TypeScript 类型注解
2. 添加输入验证
3. 添加错误处理
4. 改进方法命名的一致性
5. 添加 JSDoc 注释
6. 考虑使用 Map 而不是数组来提高查找性能
`,
      createBackup: true,
      autoConfirm: true,
      preferences: {
        strictTypes: true,
        preserveComments: true,
        useModernSyntax: true
      }
    });

    console.log('🚀 开始自定义重构...');
    const result = await refactor.refactor();

    console.log('\n📊 自定义重构结果:');
    console.log(`✅ 成功: ${result.success}`);
    console.log(`🔄 变更数: ${result.changes.length}`);

    if (result.success) {
      const refactoredCode = await fs.readFile(testFile, 'utf-8');
      console.log('\n📄 重构后的代码:');
      console.log('```typescript');
      console.log(refactoredCode);
      console.log('```');
    }

  } catch (error) {
    console.error('❌ 自定义重构失败:', error.message);
  } finally {
    // 清理测试文件
    try {
      await fs.unlink(testFile);
    } catch (error) {
      // 忽略清理错误
    }
  }
}

/**
 * 示例4: 配置文件使用
 */
async function example4_ConfigFile(): Promise<void> {
  console.log('\n⚙️  示例4: 使用配置文件');
  console.log('='.repeat(40));

  // 创建配置文件
  const config = {
    type: 'extract_function',
    target: './src',
    createBackup: true,
    backupDir: './refactor-backups',
    autoConfirm: false,
    includeExtensions: ['.ts', '.js'],
    excludePatterns: ['node_modules', 'dist', 'test'],
    preferences: {
      codeStyle: 'standard',
      targetESVersion: 'ES2022',
      strictTypes: true,
      preserveComments: true,
      maxFunctionLength: 40,
      useModernSyntax: true
    }
  };

  const configFile = join(__dirname, 'refactor-config.json');
  await fs.writeFile(configFile, JSON.stringify(config, null, 2));

  console.log(`📝 配置文件已创建: ${configFile}`);
  console.log('📄 配置内容:');
  console.log(JSON.stringify(config, null, 2));

  console.log('\n💡 使用配置文件的命令:');
  console.log(`refactor --config ${configFile}`);

  // 清理配置文件
  await fs.unlink(configFile);
}

/**
 * 运行所有示例
 */
async function runAllExamples(): Promise<void> {
  console.log('🎯 代码重构工具使用示例');
  console.log('='.repeat(50));

  try {
    await example1_BasicRefactor();
    await example2_BatchRefactor();
    await example3_CustomRefactor();
    await example4_ConfigFile();

    console.log('\n🎉 所有示例运行完成！');
    console.log('\n📚 更多使用方法:');
    console.log('- 查看 README.md 获取详细文档');
    console.log('- 运行 `refactor --help` 查看命令行选项');
    console.log('- 查看 test/ 目录了解测试用例');

  } catch (error) {
    console.error('💥 示例运行失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此文件，执行所有示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
