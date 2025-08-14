#!/usr/bin/env node

/**
 * 代码重构工具测试运行器
 */

import { createRefactor, RefactorType } from '../src/code-refactor.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestCase {
  name: string;
  description: string;
  config: any;
  expectedChanges?: number;
  shouldSucceed: boolean;
}

/**
 * 测试用例定义
 */
const testCases: TestCase[] = [
  {
    name: '改善可读性重构',
    description: '测试对遗留代码的可读性改善',
    config: {
      type: RefactorType.IMPROVE_READABILITY,
      target: join(__dirname, 'test-data/legacy-code.js'),
      createBackup: true,
      autoConfirm: true,
      includeExtensions: ['.js'],
      preferences: {
        codeStyle: 'standard',
        preserveComments: true,
        maxFunctionLength: 30
      }
    },
    expectedChanges: 3,
    shouldSucceed: true
  },
  {
    name: '提取函数重构',
    description: '测试重复代码的函数提取',
    config: {
      type: RefactorType.EXTRACT_FUNCTION,
      target: join(__dirname, 'test-data/modern-code.ts'),
      createBackup: true,
      autoConfirm: true,
      includeExtensions: ['.ts'],
      preferences: {
        strictTypes: true,
        useModernSyntax: true
      }
    },
    expectedChanges: 2,
    shouldSucceed: true
  },
  {
    name: '性能优化重构',
    description: '测试性能问题的优化',
    config: {
      type: RefactorType.OPTIMIZE_PERFORMANCE,
      target: join(__dirname, 'test-data/modern-code.ts'),
      createBackup: false,
      autoConfirm: true
    },
    expectedChanges: 1,
    shouldSucceed: true
  },
  {
    name: '变量重命名重构',
    description: '测试不清晰变量名的重命名',
    config: {
      type: RefactorType.RENAME_VARIABLE,
      target: join(__dirname, 'test-data/modern-code.ts'),
      createBackup: false,
      autoConfirm: true
    },
    expectedChanges: 1,
    shouldSucceed: true
  },
  {
    name: '现代化语法重构',
    description: '测试旧语法的现代化',
    config: {
      type: RefactorType.MODERNIZE_SYNTAX,
      target: join(__dirname, 'test-data/legacy-code.js'),
      createBackup: false,
      autoConfirm: true,
      preferences: {
        targetESVersion: 'ES2022',
        useModernSyntax: true
      }
    },
    expectedChanges: 2,
    shouldSucceed: true
  }
];

/**
 * 运行单个测试用例
 */
async function runTestCase(testCase: TestCase): Promise<boolean> {
  console.log(`\n🧪 运行测试: ${testCase.name}`);
  console.log(`📝 描述: ${testCase.description}`);
  
  try {
    // 创建测试用的文件副本
    const originalFile = testCase.config.target;
    const testFile = originalFile.replace(/\.(js|ts)$/, '.test.$1');
    
    await fs.copyFile(originalFile, testFile);
    testCase.config.target = testFile;
    
    // 执行重构
    const refactor = createRefactor(testCase.config);
    const result = await refactor.refactor();
    
    // 验证结果
    const success = result.success === testCase.shouldSucceed;
    
    if (success) {
      console.log(`✅ 测试通过`);
      console.log(`   - 处理文件: ${result.filesProcessed.length}`);
      console.log(`   - 变更数量: ${result.changes.length}`);
      console.log(`   - 耗时: ${result.duration}ms`);
      
      if (result.backupInfo) {
        console.log(`   - 备份ID: ${result.backupInfo.backupId}`);
      }
    } else {
      console.log(`❌ 测试失败`);
      console.log(`   - 期望成功: ${testCase.shouldSucceed}`);
      console.log(`   - 实际成功: ${result.success}`);
      console.log(`   - 错误: ${result.errors.join(', ')}`);
    }
    
    // 清理测试文件
    try {
      await fs.unlink(testFile);
    } catch (error) {
      // 忽略清理错误
    }
    
    return success;
    
  } catch (error) {
    console.log(`❌ 测试异常: ${error.message}`);
    return false;
  }
}

/**
 * 创建示例配置文件
 */
async function createExampleConfig(): Promise<void> {
  const configPath = join(__dirname, '../refactor-config.json');
  
  const exampleConfig = {
    type: 'improve_readability',
    target: './src',
    createBackup: true,
    backupDir: './refactor-backups',
    autoConfirm: false,
    includeExtensions: ['.ts', '.js', '.tsx', '.jsx'],
    excludePatterns: ['node_modules', 'dist', 'build', '.git'],
    preferences: {
      codeStyle: 'standard',
      targetESVersion: 'ES2022',
      strictTypes: true,
      preserveComments: true,
      maxFunctionLength: 50,
      useModernSyntax: true
    }
  };
  
  await fs.writeFile(configPath, JSON.stringify(exampleConfig, null, 2));
  console.log(`📝 示例配置文件已创建: ${configPath}`);
}

/**
 * 测试备份和回滚功能
 */
async function testBackupAndRollback(): Promise<boolean> {
  console.log('\n🔄 测试备份和回滚功能');
  
  try {
    const testFile = join(__dirname, 'test-data/backup-test.js');
    const originalContent = `
// 原始文件内容
function oldFunction() {
  var x = 1;
  var y = 2;
  return x + y;
}
`;
    
    // 创建测试文件
    await fs.writeFile(testFile, originalContent);
    
    // 执行重构（会创建备份）
    const refactor = createRefactor({
      type: RefactorType.MODERNIZE_SYNTAX,
      target: testFile,
      createBackup: true,
      autoConfirm: true
    });
    
    const result = await refactor.refactor();
    
    if (!result.success || !result.backupInfo) {
      console.log('❌ 重构失败或未创建备份');
      return false;
    }
    
    // 验证文件已被修改
    const modifiedContent = await fs.readFile(testFile, 'utf-8');
    if (modifiedContent === originalContent) {
      console.log('❌ 文件未被修改');
      return false;
    }
    
    console.log('✅ 文件已被重构');
    
    // 测试回滚
    const rollbackSuccess = await refactor.rollback(result.backupInfo.backupId);
    
    if (!rollbackSuccess) {
      console.log('❌ 回滚失败');
      return false;
    }
    
    // 验证文件已回滚
    const rolledBackContent = await fs.readFile(testFile, 'utf-8');
    if (rolledBackContent.trim() !== originalContent.trim()) {
      console.log('❌ 文件未正确回滚');
      return false;
    }
    
    console.log('✅ 回滚成功');
    
    // 清理测试文件
    await fs.unlink(testFile);
    
    return true;
    
  } catch (error) {
    console.log(`❌ 备份回滚测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runAllTests(): Promise<void> {
  console.log('🚀 开始运行代码重构工具测试');
  console.log('='.repeat(50));
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  // 创建示例配置
  await createExampleConfig();
  
  // 运行所有测试用例
  for (const testCase of testCases) {
    const passed = await runTestCase(testCase);
    if (passed) {
      passedTests++;
    }
  }
  
  // 测试备份和回滚
  console.log('\n' + '='.repeat(50));
  const backupTestPassed = await testBackupAndRollback();
  if (backupTestPassed) {
    passedTests++;
  }
  totalTests++;
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总:');
  console.log(`✅ 通过: ${passedTests}/${totalTests}`);
  console.log(`❌ 失败: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 成功率: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！代码重构工具运行正常');
    process.exit(0);
  } else {
    console.log('\n⚠️  部分测试失败，请检查实现');
    process.exit(1);
  }
}

/**
 * 演示功能
 */
async function demonstrateFeatures(): Promise<void> {
  console.log('\n🎬 功能演示');
  console.log('='.repeat(30));
  
  // 演示不同的重构类型
  const demos = [
    {
      type: RefactorType.IMPROVE_READABILITY,
      description: '改善代码可读性'
    },
    {
      type: RefactorType.EXTRACT_FUNCTION,
      description: '提取重复代码为函数'
    },
    {
      type: RefactorType.MODERNIZE_SYNTAX,
      description: '现代化语法结构'
    }
  ];
  
  for (const demo of demos) {
    console.log(`\n🔧 演示: ${demo.description}`);
    console.log(`   类型: ${demo.type}`);
    console.log(`   目标: test-data/legacy-code.js`);
    
    try {
      const refactor = createRefactor({
        type: demo.type,
        target: join(__dirname, 'test-data/legacy-code.js'),
        createBackup: false,
        autoConfirm: true
      });
      
      // 这里只是演示配置，不实际执行重构
      console.log(`   ✅ 配置成功`);
      
    } catch (error) {
      console.log(`   ❌ 配置失败: ${error.message}`);
    }
  }
}

// 主程序入口
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'demo':
      demonstrateFeatures();
      break;
    case 'test':
    default:
      runAllTests();
      break;
  }
}
