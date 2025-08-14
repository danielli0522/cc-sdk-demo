#!/usr/bin/env node

/**
 * 代码重构工具命令行界面
 */

import { createRefactor, RefactorType, RefactorConfig } from './code-refactor.js';
import { promises as fs } from 'fs';
import { join } from 'path';

interface CLIOptions {
  target?: string;
  type?: string;
  backup?: boolean;
  confirm?: boolean;
  config?: string;
  help?: boolean;
  rollback?: string;
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
      case '--target':
      case '-t':
        options.target = args[++i];
        break;
      case '--type':
        options.type = args[++i];
        break;
      case '--no-backup':
        options.backup = false;
        break;
      case '--auto-confirm':
      case '-y':
        options.confirm = true;
        break;
      case '--config':
      case '-c':
        options.config = args[++i];
        break;
      case '--rollback':
        options.rollback = args[++i];
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
🔧 代码重构工具 - Claude Code SDK

用法:
  refactor [选项]

选项:
  -t, --target <path>        目标文件或目录 (默认: ./)
  --type <type>             重构类型 (默认: improve_readability)
  --no-backup               不创建备份
  -y, --auto-confirm        自动确认所有操作
  -c, --config <file>       使用配置文件
  --rollback <backup-id>    回滚到指定备份
  -h, --help                显示帮助信息

重构类型:
  extract_function         提取函数
  rename_variable          重命名变量
  optimize_performance     性能优化
  improve_readability      改善可读性
  add_types               添加类型注解
  modernize_syntax        现代化语法
  remove_dead_code        移除死代码
  custom                  自定义重构

示例:
  refactor --target ./src --type improve_readability
  refactor --target app.js --type add_types --auto-confirm
  refactor --config ./refactor-config.json
  refactor --rollback abc12345
`);
}

/**
 * 加载配置文件
 */
async function loadConfig(configPath: string): Promise<Partial<RefactorConfig>> {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ 无法加载配置文件: ${configPath}`);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  try {
    // 处理回滚操作
    if (options.rollback) {
      console.log(`🔄 正在回滚到备份: ${options.rollback}`);
      const refactor = createRefactor({});
      const success = await refactor.rollback(options.rollback);
      process.exit(success ? 0 : 1);
      return;
    }

    // 构建配置
    let config: Partial<RefactorConfig> = {};

    // 加载配置文件
    if (options.config) {
      config = await loadConfig(options.config);
    }

    // 命令行参数覆盖配置文件
    if (options.target) {
      config.target = options.target;
    }

    if (options.type) {
      if (!Object.values(RefactorType).includes(options.type as RefactorType)) {
        console.error(`❌ 无效的重构类型: ${options.type}`);
        console.error('可用类型:', Object.values(RefactorType).join(', '));
        process.exit(1);
      }
      config.type = options.type as RefactorType;
    }

    if (options.backup === false) {
      config.createBackup = false;
    }

    if (options.confirm) {
      config.autoConfirm = true;
    }

    // 创建并执行重构
    const refactor = createRefactor(config);
    
    console.log('🚀 开始执行代码重构...');
    console.log(`📁 目标: ${config.target || './'}`);
    console.log(`🔧 类型: ${config.type || 'improve_readability'}`);
    console.log(`💾 备份: ${config.createBackup !== false ? '是' : '否'}`);
    console.log('');

    const result = await refactor.refactor();

    // 显示结果
    console.log('\n📊 重构结果:');
    console.log(`✅ 成功: ${result.success}`);
    console.log(`📁 处理文件: ${result.filesProcessed.length}`);
    console.log(`🔄 变更数: ${result.changes.length}`);
    console.log(`❌ 错误数: ${result.errors.length}`);
    console.log(`⏱️  耗时: ${result.duration}ms`);

    if (result.backupInfo) {
      console.log(`💾 备份ID: ${result.backupInfo.backupId}`);
      console.log(`📂 备份路径: ${result.backupInfo.backupPath}`);
    }

    if (result.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (result.changes.length > 0) {
      console.log('\n🔄 变更详情:');
      result.changes.forEach(change => {
        console.log(`  📄 ${change.filePath}`);
        console.log(`     ${change.description} (${change.linesChanged}行)`);
      });
    }

    // 显示报告
    if (result.report) {
      console.log('\n📋 重构报告:');
      console.log('='.repeat(50));
      console.log(result.report);
      console.log('='.repeat(50));
    }

    // 保存结果到文件
    const resultFile = join(process.cwd(), 'refactor-result.json');
    await fs.writeFile(resultFile, JSON.stringify(result, null, 2));
    console.log(`\n💾 详细结果已保存到: ${resultFile}`);

    process.exit(result.success ? 0 : 1);

  } catch (error) {
    console.error('💥 重构失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 执行主函数
main().catch(error => {
  console.error('💥 程序异常:', error);
  process.exit(1);
});
