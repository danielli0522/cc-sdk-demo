#!/usr/bin/env node

/**
 * 项目文档生成器命令行界面
 */

import { createProjectAnalyzer, DocumentType, AnalysisConfig } from './project-analyzer.js';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import readline from 'readline';

interface CLIOptions {
  projectName?: string;
  projectPath?: string;
  output?: string;
  type?: string;
  interactive?: boolean;
  help?: boolean;
}

/**
 * 解析命令行参数
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--project-name':
      case '-n':
        options.projectName = args[++i];
        break;
      case '--project-path':
      case '-p':
        options.projectPath = args[++i];
        break;
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
      case '--type':
      case '-t':
        options.type = args[++i];
        break;
      case '--interactive':
      case '-i':
        options.interactive = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
🤖 AI驱动的项目文档生成器 - Claude Code SDK

用法:
  doc-generator [选项]

选项:
  -n, --project-name <name>    项目名称
  -p, --project-path <path>    项目路径 (默认: ./)
  -o, --output <dir>           输出目录 (默认: ./docs)
  -t, --type <type>            文档类型 (overview|flow|diagnosis|all)
  -i, --interactive            交互式模式
  -h, --help                   显示帮助信息

文档类型:
  overview                     技术总览文档
  flow                        复杂流程分析文档  
  diagnosis                   问题诊断解决方案文档
  all                         生成所有文档 (默认)

示例:
  doc-generator --project-name MyApp --project-path ./src
  doc-generator --type overview --output ./documentation
  doc-generator --interactive
`);
}

/**
 * 交互式输入
 */
async function interactiveInput(): Promise<AnalysisConfig> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise(resolve => {
      rl.question(prompt, resolve);
    });
  };

  try {
    console.log('🤖 欢迎使用AI项目文档生成器!');
    console.log('请按照提示输入项目信息：\n');

    const projectName = await question('📝 请输入项目名称: ');
    if (!projectName.trim()) {
      throw new Error('项目名称不能为空');
    }

    const projectPath = await question('📁 请输入项目路径 (默认: ./): ') || './';
    
    // 验证项目路径
    try {
      await fs.access(resolve(projectPath));
    } catch (error) {
      throw new Error(`项目路径不存在: ${projectPath}`);
    }

    const outputDir = await question('📂 请输入输出目录 (默认: ./docs): ') || './docs';

    console.log('\n📋 请选择要生成的文档类型:');
    console.log('1. 技术总览文档 (Technical Overview)');
    console.log('2. 复杂流程分析文档 (Complex Flow Analysis)');
    console.log('3. 问题诊断解决方案文档 (Problem Diagnosis)');
    console.log('4. 生成所有文档 (推荐)');
    
    const typeChoice = await question('请选择 (1-4, 默认: 4): ') || '4';
    
    let generateAll = true;
    let specificType: DocumentType | undefined;
    
    switch (typeChoice) {
      case '1':
        generateAll = false;
        specificType = DocumentType.TECHNICAL_OVERVIEW;
        break;
      case '2':
        generateAll = false;
        specificType = DocumentType.COMPLEX_FLOW_ANALYSIS;
        break;
      case '3':
        generateAll = false;
        specificType = DocumentType.PROBLEM_DIAGNOSIS_SOLUTION;
        break;
      case '4':
      default:
        generateAll = true;
        break;
    }

    console.log('\n⚙️ 高级选项 (可选):');
    const maxFilesInput = await question('📊 最大分析文件数 (默认: 200): ');
    const maxFiles = maxFilesInput ? parseInt(maxFilesInput) : 200;

    const customExtensions = await question('📄 自定义文件扩展名 (用逗号分隔，留空使用默认): ');
    const includeExtensions = customExtensions 
      ? customExtensions.split(',').map(ext => ext.trim())
      : undefined;

    const customExcludes = await question('🚫 自定义排除目录 (用逗号分隔，留空使用默认): ');
    const excludePatterns = customExcludes
      ? customExcludes.split(',').map(pattern => pattern.trim())
      : undefined;

    return {
      projectName,
      projectPath: resolve(projectPath),
      outputDir,
      generateAll,
      maxFiles,
      includeExtensions,
      excludePatterns
    } as AnalysisConfig;

  } finally {
    rl.close();
  }
}

/**
 * 验证配置
 */
async function validateConfig(config: Partial<AnalysisConfig>): Promise<void> {
  if (!config.projectName) {
    throw new Error('项目名称不能为空');
  }

  if (!config.projectPath) {
    throw new Error('项目路径不能为空');
  }

  try {
    await fs.access(config.projectPath);
  } catch (error) {
    throw new Error(`项目路径不存在: ${config.projectPath}`);
  }
}

/**
 * 显示分析进度
 */
function showProgress(step: string, current: number, total: number): void {
  const percentage = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
  process.stdout.write(`\r${step} [${bar}] ${percentage}%`);
}

/**
 * 显示结果摘要
 */
function showResultSummary(result: any): void {
  console.log('\n📊 分析结果摘要:');
  console.log('='.repeat(50));
  console.log(`📝 项目名称: ${result.projectName}`);
  console.log(`📁 扫描文件: ${result.statistics.filesScanned} 个`);
  console.log(`📏 代码行数: ${result.statistics.linesOfCode.toLocaleString()} 行`);
  console.log(`🔧 技术栈: ${result.statistics.detectedTechnologies.join(', ')}`);
  console.log(`⏱️  耗时: ${result.statistics.duration}ms`);
  console.log(`📄 生成文档: ${result.generatedDocuments.length} 个`);

  if (result.generatedDocuments.length > 0) {
    console.log('\n📚 生成的文档:');
    result.generatedDocuments.forEach((doc: any, index: number) => {
      console.log(`  ${index + 1}. ${doc.type}: ${doc.filePath}`);
    });
  }

  if (result.errors.length > 0) {
    console.log('\n❌ 错误信息:');
    result.errors.forEach((error: string) => {
      console.log(`  - ${error}`);
    });
  }
}

/**
 * 生成单个文档类型
 */
async function generateSingleDocument(
  analyzer: any, 
  type: DocumentType,
  structure: any
): Promise<void> {
  const typeNames = {
    [DocumentType.TECHNICAL_OVERVIEW]: '技术总览',
    [DocumentType.COMPLEX_FLOW_ANALYSIS]: '复杂流程分析', 
    [DocumentType.PROBLEM_DIAGNOSIS_SOLUTION]: '问题诊断解决方案'
  };

  console.log(`\n📝 正在生成${typeNames[type]}文档...`);
  
  const startTime = Date.now();
  
  try {
    let document;
    switch (type) {
      case DocumentType.TECHNICAL_OVERVIEW:
        document = await analyzer.generateTechnicalOverview(structure);
        break;
      case DocumentType.COMPLEX_FLOW_ANALYSIS:
        document = await analyzer.generateComplexFlowAnalysis(structure);
        break;
      case DocumentType.PROBLEM_DIAGNOSIS_SOLUTION:
        document = await analyzer.generateProblemDiagnosis(structure);
        break;
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ ${typeNames[type]}文档生成完成 (${duration}ms)`);
    console.log(`📄 文件路径: ${document.filePath}`);
    
  } catch (error) {
    console.error(`❌ ${typeNames[type]}文档生成失败:`, error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  console.log('🚀 AI驱动的项目文档生成器');
  console.log('基于 Claude Code SDK 构建\n');

  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  try {
    let config: Partial<AnalysisConfig>;

    if (options.interactive) {
      config = await interactiveInput();
    } else {
      // 命令行参数模式
      config = {
        projectName: options.projectName || 'UnknownProject',
        projectPath: resolve(options.projectPath || './'),
        outputDir: options.output || './docs',
        generateAll: !options.type || options.type === 'all',
        maxFiles: 200
      };

      // 处理特定文档类型
      if (options.type && options.type !== 'all') {
        config.generateAll = false;
        switch (options.type) {
          case 'overview':
            break;
          case 'flow':
            break;
          case 'diagnosis':
            break;
          default:
            throw new Error(`无效的文档类型: ${options.type}`);
        }
      }
    }

    // 验证配置
    await validateConfig(config);

    console.log('\n🔍 开始分析项目...');
    console.log(`📁 项目: ${config.projectName}`);
    console.log(`📂 路径: ${config.projectPath}`);
    console.log(`💾 输出: ${config.outputDir}`);

    // 创建分析器并执行分析
    const analyzer = createProjectAnalyzer(config);
    const result = await analyzer.analyzeProject();

    // 显示结果
    showResultSummary(result);

    if (result.generatedDocuments.length > 0) {
      console.log('\n🎉 文档生成完成！');
      console.log('\n💡 建议下一步:');
      console.log('1. 查看生成的文档');
      console.log('2. 根据需要调整和完善文档内容');
      console.log('3. 将文档集成到项目文档体系中');
    } else {
      console.log('\n⚠️ 未能生成文档，请检查错误信息');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 程序异常:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

