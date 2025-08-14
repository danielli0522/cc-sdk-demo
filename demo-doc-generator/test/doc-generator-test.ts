#!/usr/bin/env node

/**
 * 项目文档生成器测试
 */

import { createProjectAnalyzer, DocumentType } from '../src/project-analyzer.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestCase {
  name: string;
  description: string;
  config: any;
  shouldSucceed: boolean;
  expectedFiles?: number;
}

/**
 * 测试用例定义
 */
const testCases: TestCase[] = [
  {
    name: '基础项目分析',
    description: '测试基础的项目结构分析功能',
    config: {
      projectName: 'TestProject',
      projectPath: join(__dirname, '..'),
      outputDir: join(__dirname, 'test-output-1'),
      generateAll: false,
      maxFiles: 10
    },
    shouldSucceed: true,
    expectedFiles: 5
  },
  {
    name: '技术栈检测',
    description: '测试技术栈自动检测功能',
    config: {
      projectName: 'TechStackTest',
      projectPath: join(__dirname, '..'),
      outputDir: join(__dirname, 'test-output-2'),
      includeExtensions: ['.ts', '.js', '.json'],
      maxFiles: 20
    },
    shouldSucceed: true
  },
  {
    name: '大型项目处理',
    description: '测试大型项目的处理能力',
    config: {
      projectName: 'LargeProject',
      projectPath: join(__dirname, '../..'),
      outputDir: join(__dirname, 'test-output-3'),
      maxFiles: 100,
      generateAll: false
    },
    shouldSucceed: true
  },
  {
    name: '无效路径处理',
    description: '测试无效项目路径的错误处理',
    config: {
      projectName: 'InvalidPath',
      projectPath: '/non/existent/path',
      outputDir: join(__dirname, 'test-output-4')
    },
    shouldSucceed: false
  }
];

/**
 * 运行单个测试用例
 */
async function runTestCase(testCase: TestCase): Promise<boolean> {
  console.log(`\n🧪 运行测试: ${testCase.name}`);
  console.log(`📝 描述: ${testCase.description}`);
  
  try {
    const analyzer = createProjectAnalyzer(testCase.config);
    const result = await analyzer.analyzeProject();
    
    const success = result.errors.length === 0;
    
    if (success === testCase.shouldSucceed) {
      console.log(`✅ 测试通过`);
      
      if (success) {
        console.log(`   - 扫描文件: ${result.statistics.filesScanned}`);
        console.log(`   - 检测技术: ${result.statistics.detectedTechnologies.join(', ')}`);
        console.log(`   - 生成文档: ${result.generatedDocuments.length}`);
        console.log(`   - 耗时: ${result.statistics.duration}ms`);
        
        if (testCase.expectedFiles) {
          const filesMatch = result.statistics.filesScanned >= testCase.expectedFiles;
          console.log(`   - 文件数检查: ${filesMatch ? '通过' : '失败'}`);
        }
      }
    } else {
      console.log(`❌ 测试失败`);
      console.log(`   - 期望成功: ${testCase.shouldSucceed}`);
      console.log(`   - 实际成功: ${success}`);
      console.log(`   - 错误: ${result.errors.join(', ')}`);
      return false;
    }
    
    // 清理测试输出
    try {
      await fs.rm(testCase.config.outputDir, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
    
    return true;
    
  } catch (error) {
    if (testCase.shouldSucceed) {
      console.log(`❌ 测试异常: ${error}`);
      return false;
    } else {
      console.log(`✅ 测试通过 (预期异常)`);
      return true;
    }
  }
}

/**
 * 测试配置验证
 */
async function testConfigValidation(): Promise<boolean> {
  console.log('\n⚙️ 测试配置验证');
  
  const validConfigs = [
    {
      name: '最小配置',
      config: { projectName: 'Test', projectPath: __dirname }
    },
    {
      name: '完整配置',
      config: {
        projectName: 'FullTest',
        projectPath: __dirname,
        outputDir: './test-docs',
        includeExtensions: ['.ts', '.js'],
        excludePatterns: ['node_modules'],
        maxFiles: 50
      }
    }
  ];

  let passed = 0;
  
  for (const test of validConfigs) {
    try {
      const analyzer = createProjectAnalyzer(test.config);
      console.log(`  ✅ ${test.name}: 配置有效`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${test.name}: 配置无效 - ${error}`);
    }
  }
  
  return passed === validConfigs.length;
}

/**
 * 测试项目结构扫描
 */
async function testProjectScanning(): Promise<boolean> {
  console.log('\n📁 测试项目结构扫描');
  
  // 创建临时测试项目
  const testProjectDir = join(__dirname, 'temp-test-project');
  
  try {
    await createTestProject(testProjectDir);
    
    const analyzer = createProjectAnalyzer({
      projectName: 'ScanTest',
      projectPath: testProjectDir,
      outputDir: join(__dirname, 'scan-test-output'),
      generateAll: false
    });
    
    const result = await analyzer.analyzeProject();
    
    const success = result.statistics.filesScanned > 0;
    console.log(`  📊 扫描结果: ${success ? '成功' : '失败'}`);
    console.log(`  📁 文件数: ${result.statistics.filesScanned}`);
    console.log(`  🔧 技术栈: ${result.statistics.detectedTechnologies.join(', ')}`);
    
    return success;
    
  } finally {
    // 清理测试项目
    await fs.rm(testProjectDir, { recursive: true, force: true });
    await fs.rm(join(__dirname, 'scan-test-output'), { recursive: true, force: true });
  }
}

/**
 * 创建测试项目
 */
async function createTestProject(projectDir: string): Promise<void> {
  await fs.mkdir(projectDir, { recursive: true });
  
  // 创建 package.json
  await fs.writeFile(
    join(projectDir, 'package.json'),
    JSON.stringify({
      name: 'test-project',
      dependencies: { react: '^18.0.0', express: '^4.18.0' }
    }, null, 2)
  );
  
  // 创建源代码文件
  await fs.mkdir(join(projectDir, 'src'), { recursive: true });
  
  await fs.writeFile(
    join(projectDir, 'src', 'index.ts'),
    `
export class TestClass {
  constructor(private name: string) {}
  
  getName(): string {
    return this.name;
  }
}
`
  );
  
  await fs.writeFile(
    join(projectDir, 'src', 'utils.js'),
    `
function formatDate(date) {
  return date.toISOString();
}

module.exports = { formatDate };
`
  );
  
  // 创建 README
  await fs.writeFile(
    join(projectDir, 'README.md'),
    '# Test Project\n\nThis is a test project for document generation.'
  );
}

/**
 * 测试文档生成质量
 */
async function testDocumentGeneration(): Promise<boolean> {
  console.log('\n📝 测试文档生成质量');
  
  const testProjectDir = join(__dirname, 'doc-gen-test-project');
  
  try {
    await createTestProject(testProjectDir);
    
    const analyzer = createProjectAnalyzer({
      projectName: 'DocGenTest',
      projectPath: testProjectDir,
      outputDir: join(__dirname, 'doc-gen-output'),
      generateAll: true,
      maxFiles: 10
    });
    
    const result = await analyzer.analyzeProject();
    
    let qualityScore = 0;
    
    // 检查是否生成了预期的文档
    const expectedDocs = [
      DocumentType.TECHNICAL_OVERVIEW,
      DocumentType.COMPLEX_FLOW_ANALYSIS,
      DocumentType.PROBLEM_DIAGNOSIS_SOLUTION
    ];
    
    for (const expectedType of expectedDocs) {
      const hasDoc = result.generatedDocuments.some(doc => doc.type === expectedType);
      if (hasDoc) {
        qualityScore += 1;
        console.log(`  ✅ ${expectedType}: 已生成`);
      } else {
        console.log(`  ❌ ${expectedType}: 未生成`);
      }
    }
    
    // 检查文档内容质量
    for (const doc of result.generatedDocuments) {
      const hasMinimumContent = doc.content.length > 1000;
      const hasMermaidDiagrams = doc.content.includes('```mermaid');
      const hasStructuredContent = doc.content.includes('##');
      
      if (hasMinimumContent && hasMermaidDiagrams && hasStructuredContent) {
        qualityScore += 0.5;
        console.log(`  ✅ ${doc.type}: 内容质量良好`);
      } else {
        console.log(`  ⚠️ ${doc.type}: 内容质量需要改进`);
      }
    }
    
    const passed = qualityScore >= 3;
    console.log(`  📊 质量评分: ${qualityScore}/4`);
    
    return passed;
    
  } finally {
    // 清理测试项目和输出
    await fs.rm(testProjectDir, { recursive: true, force: true });
    await fs.rm(join(__dirname, 'doc-gen-output'), { recursive: true, force: true });
  }
}

/**
 * 运行所有测试
 */
async function runAllTests(): Promise<void> {
  console.log('🚀 开始运行项目文档生成器测试');
  console.log('='.repeat(50));
  
  let passedTests = 0;
  let totalTests = 0;
  
  // 运行基础测试用例
  for (const testCase of testCases) {
    const passed = await runTestCase(testCase);
    if (passed) passedTests++;
    totalTests++;
  }
  
  // 运行特殊测试
  console.log('\n' + '='.repeat(50));
  
  const configValidationPassed = await testConfigValidation();
  if (configValidationPassed) passedTests++;
  totalTests++;
  
  const scanningPassed = await testProjectScanning();
  if (scanningPassed) passedTests++;
  totalTests++;
  
  const docGenPassed = await testDocumentGeneration();
  if (docGenPassed) passedTests++;
  totalTests++;
  
  // 输出测试结果
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总:');
  console.log(`✅ 通过: ${passedTests}/${totalTests}`);
  console.log(`❌ 失败: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 成功率: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！文档生成器工作正常');
    process.exit(0);
  } else {
    console.log('\n⚠️ 部分测试失败，请检查实现');
    process.exit(1);
  }
}

// 主程序入口
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

