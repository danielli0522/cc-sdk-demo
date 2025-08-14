#!/usr/bin/env node

/**
 * Code Refactoring Tool using Claude Code SDK
 * 
 * 功能特性：
 * - 智能代码重构分析和执行
 * - 多种重构类型支持
 * - 安全的备份和回滚机制
 * - 详细的重构报告
 * - 批量文件处理
 */

import { claude } from '@instantlyeasy/claude-code-sdk-ts';
import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { createHash } from 'crypto';

/**
 * 重构类型枚举
 */
export enum RefactorType {
  EXTRACT_FUNCTION = 'extract_function',
  RENAME_VARIABLE = 'rename_variable', 
  OPTIMIZE_PERFORMANCE = 'optimize_performance',
  IMPROVE_READABILITY = 'improve_readability',
  ADD_TYPES = 'add_types',
  MODERNIZE_SYNTAX = 'modernize_syntax',
  REMOVE_DEAD_CODE = 'remove_dead_code',
  CUSTOM = 'custom'
}

/**
 * 重构配置接口
 */
export interface RefactorConfig {
  /** 重构类型 */
  type: RefactorType;
  /** 目标文件或目录 */
  target: string | string[];
  /** 自定义重构指令（当 type 为 CUSTOM 时） */
  customInstructions?: string;
  /** 是否创建备份 */
  createBackup: boolean;
  /** 备份目录 */
  backupDir?: string;
  /** 是否自动确认重构 */
  autoConfirm: boolean;
  /** 包含的文件扩展名 */
  includeExtensions: string[];
  /** 排除的文件模式 */
  excludePatterns: string[];
  /** 重构偏好设置 */
  preferences: RefactorPreferences;
}

/**
 * 重构偏好设置
 */
export interface RefactorPreferences {
  /** 代码风格 */
  codeStyle: 'standard' | 'google' | 'airbnb' | 'prettier';
  /** 目标 ES 版本 */
  targetESVersion: 'ES2020' | 'ES2021' | 'ES2022' | 'ESNext';
  /** 是否使用严格类型 */
  strictTypes: boolean;
  /** 是否保留注释 */
  preserveComments: boolean;
  /** 函数最大行数 */
  maxFunctionLength: number;
  /** 是否使用现代语法特性 */
  useModernSyntax: boolean;
}

/**
 * 重构结果接口
 */
export interface RefactorResult {
  /** 是否成功 */
  success: boolean;
  /** 处理的文件列表 */
  filesProcessed: string[];
  /** 变更统计 */
  changes: RefactorChange[];
  /** 备份信息 */
  backupInfo?: BackupInfo;
  /** 错误信息 */
  errors: string[];
  /** 总耗时 */
  duration: number;
  /** 重构报告 */
  report: string;
}

/**
 * 单个重构变更
 */
export interface RefactorChange {
  /** 文件路径 */
  filePath: string;
  /** 变更类型 */
  changeType: string;
  /** 变更描述 */
  description: string;
  /** 变更行数 */
  linesChanged: number;
  /** 变更前的代码片段 */
  before?: string;
  /** 变更后的代码片段 */
  after?: string;
}

/**
 * 备份信息
 */
export interface BackupInfo {
  /** 备份ID */
  backupId: string;
  /** 备份目录 */
  backupPath: string;
  /** 备份时间 */
  timestamp: Date;
  /** 备份的文件列表 */
  files: string[];
}

/**
 * 代码重构工具类
 */
export class CodeRefactor {
  private config: RefactorConfig;
  private claude: any;

  constructor(config: Partial<RefactorConfig>) {
    this.config = this.mergeWithDefaults(config);
    this.claude = claude()
      .withModel('claude-3-5-sonnet-20241022')
      .allowTools('Read', 'Write', 'Edit', 'LS', 'Grep')
      .withTimeout(60000)
      .skipPermissions(); // 自动确认编辑，避免交互式输入
  }

  /**
   * 合并默认配置
   */
  private mergeWithDefaults(config: Partial<RefactorConfig>): RefactorConfig {
    return {
      type: config.type || RefactorType.IMPROVE_READABILITY,
      target: config.target || './',
      createBackup: config.createBackup ?? true,
      backupDir: config.backupDir || './refactor-backups',
      autoConfirm: config.autoConfirm ?? false,
      includeExtensions: config.includeExtensions || ['.ts', '.js', '.tsx', '.jsx'],
      excludePatterns: config.excludePatterns || ['node_modules', 'dist', 'build', '.git'],
      preferences: {
        codeStyle: 'standard',
        targetESVersion: 'ES2022',
        strictTypes: true,
        preserveComments: true,
        maxFunctionLength: 50,
        useModernSyntax: true,
        ...config.preferences
      },
      ...config
    } as RefactorConfig;
  }

  /**
   * 执行重构
   */
  async refactor(): Promise<RefactorResult> {
    const startTime = Date.now();
    const result: RefactorResult = {
      success: false,
      filesProcessed: [],
      changes: [],
      errors: [],
      duration: 0,
      report: ''
    };

    try {
      console.log('🚀 开始代码重构...');
      
      // 1. 收集目标文件
      const targetFiles = await this.collectTargetFiles();
      console.log(`📁 发现 ${targetFiles.length} 个文件待处理`);

      if (targetFiles.length === 0) {
        throw new Error('未找到符合条件的文件');
      }

      // 2. 创建备份
      let backupInfo: BackupInfo | undefined;
      if (this.config.createBackup) {
        backupInfo = await this.createBackup(targetFiles);
        result.backupInfo = backupInfo;
        console.log(`💾 备份已创建: ${backupInfo.backupId}`);
      }

      // 3. 执行重构
      for (const filePath of targetFiles) {
        try {
          const changes = await this.refactorFile(filePath);
          result.changes.push(...changes);
          result.filesProcessed.push(filePath);
          console.log(`✅ ${filePath} 重构完成`);
        } catch (error) {
          const errorMsg = `重构文件 ${filePath} 失败: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // 4. 生成报告
      result.report = await this.generateReport(result);
      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      console.log('🎉 重构完成!');
      console.log(`📊 处理文件: ${result.filesProcessed.length}/${targetFiles.length}`);
      console.log(`⏱️  耗时: ${result.duration}ms`);

      return result;

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.duration = Date.now() - startTime;
      console.error('💥 重构失败:', error instanceof Error ? error.message : String(error));
      return result;
    }
  }

  /**
   * 收集目标文件
   */
  private async collectTargetFiles(): Promise<string[]> {
    const targets = Array.isArray(this.config.target) ? this.config.target : [this.config.target];
    const files: string[] = [];

    for (const target of targets) {
      const stat = await fs.stat(target);
      
      if (stat.isFile()) {
        if (this.shouldIncludeFile(target)) {
          files.push(target);
        }
      } else if (stat.isDirectory()) {
        const dirFiles = await this.scanDirectory(target);
        files.push(...dirFiles);
      }
    }

    return [...new Set(files)]; // 去重
  }

  /**
   * 扫描目录
   */
  private async scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!this.shouldExcludePath(entry.name)) {
          const subFiles = await this.scanDirectory(fullPath);
          files.push(...subFiles);
        }
      } else if (entry.isFile()) {
        if (this.shouldIncludeFile(fullPath)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * 判断是否应该包含文件
   */
  private shouldIncludeFile(filePath: string): boolean {
    const ext = extname(filePath);
    return this.config.includeExtensions.includes(ext) && !this.shouldExcludePath(filePath);
  }

  /**
   * 判断是否应该排除路径
   */
  private shouldExcludePath(path: string): boolean {
    return this.config.excludePatterns.some(pattern => path.includes(pattern));
  }

  /**
   * 创建备份
   */
  private async createBackup(files: string[]): Promise<BackupInfo> {
    const backupId = createHash('md5')
      .update(Date.now().toString() + files.join(''))
      .digest('hex')
      .substring(0, 8);
    
    const backupPath = join(this.config.backupDir!, `backup-${backupId}`);
    await fs.mkdir(backupPath, { recursive: true });

    for (const filePath of files) {
      const relativePath = filePath.startsWith('./') ? filePath.substring(2) : filePath;
      const backupFilePath = join(backupPath, relativePath);
      const backupFileDir = dirname(backupFilePath);
      
      await fs.mkdir(backupFileDir, { recursive: true });
      await fs.copyFile(filePath, backupFilePath);
    }

    const backupInfo: BackupInfo = {
      backupId,
      backupPath,
      timestamp: new Date(),
      files: files
    };

    // 保存备份信息
    await fs.writeFile(
      join(backupPath, 'backup-info.json'),
      JSON.stringify(backupInfo, null, 2)
    );

    return backupInfo;
  }

  /**
   * 重构单个文件
   */
  private async refactorFile(filePath: string): Promise<RefactorChange[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const instructions = this.buildRefactorInstructions(filePath, content);

    // 使用 Claude 进行重构分析和执行
    const response = await this.claude
      .skipPermissions() // 确保跳过所有权限提示
      .inDirectory(dirname(filePath))
      .onToolUse((tool: any) => {
        console.log(`🔧 使用工具: ${tool.name}`);
      })
      .query(instructions)
      .asToolExecutions();

    // 解析重构结果
    const changes: RefactorChange[] = [];
    
    for (const execution of response) {
      if (execution.tool === 'Edit' && !execution.isError) {
        changes.push({
          filePath,
          changeType: this.config.type,
          description: this.getRefactorDescription(execution),
          linesChanged: this.calculateLinesChanged(content, execution.result),
          before: this.extractCodeSnippet(content, execution.input),
          after: this.extractCodeSnippet(execution.result, execution.input)
        });
      }
    }

    return changes;
  }

  /**
   * 构建重构指令
   */
  private buildRefactorInstructions(filePath: string, content: string): string {
    const fileInfo = `文件: ${filePath}\n文件类型: ${extname(filePath)}\n`;
    const preferences = this.formatPreferences();
    
    let instructions = `${fileInfo}\n请对以下代码进行重构，要求：\n\n`;

    switch (this.config.type) {
      case RefactorType.EXTRACT_FUNCTION:
        instructions += `1. 识别并提取重复的代码块为独立函数\n2. 为提取的函数添加合适的名称和参数\n3. 确保函数职责单一，参数不超过4个\n`;
        break;
      
      case RefactorType.RENAME_VARIABLE:
        instructions += `1. 重命名模糊或不规范的变量名\n2. 使用描述性和语义化的命名\n3. 保持命名风格一致性\n`;
        break;
      
      case RefactorType.OPTIMIZE_PERFORMANCE:
        instructions += `1. 优化循环和算法复杂度\n2. 减少不必要的重复计算\n3. 改进内存使用效率\n4. 使用更高效的数据结构\n`;
        break;
      
      case RefactorType.IMPROVE_READABILITY:
        instructions += `1. 简化复杂的条件语句和嵌套\n2. 添加必要的注释说明\n3. 改进代码结构和布局\n4. 使用更清晰的表达方式\n`;
        break;
      
      case RefactorType.ADD_TYPES:
        instructions += `1. 为所有函数添加类型注解\n2. 定义明确的接口和类型\n3. 使用泛型提高类型安全性\n4. 消除 any 类型的使用\n`;
        break;
      
      case RefactorType.MODERNIZE_SYNTAX:
        instructions += `1. 使用现代 ES6+ 语法特性\n2. 替换旧式语法为现代等价物\n3. 使用解构、箭头函数、async/await 等\n4. 优化导入导出语句\n`;
        break;
      
      case RefactorType.REMOVE_DEAD_CODE:
        instructions += `1. 识别并移除未使用的变量和函数\n2. 清理无效的导入语句\n3. 删除注释掉的代码\n4. 移除不可达的代码分支\n`;
        break;
      
      case RefactorType.CUSTOM:
        instructions += this.config.customInstructions || '按照最佳实践重构代码';
        break;
    }

    instructions += `\n${preferences}\n\n重要要求：\n`;
    instructions += `- 保持代码功能不变\n`;
    instructions += `- 确保重构后代码能正常运行\n`;
    instructions += `- 保留重要的注释和文档\n`;
    instructions += `- 使用 Edit 工具直接修改文件\n`;
    instructions += `- 为每个重构操作提供清晰的说明\n`;

    return instructions;
  }

  /**
   * 格式化偏好设置
   */
  private formatPreferences(): string {
    const prefs = this.config.preferences;
    return `代码风格偏好：
- 代码风格: ${prefs.codeStyle}
- 目标 ES 版本: ${prefs.targetESVersion}
- 严格类型: ${prefs.strictTypes ? '是' : '否'}
- 保留注释: ${prefs.preserveComments ? '是' : '否'}
- 函数最大行数: ${prefs.maxFunctionLength}
- 使用现代语法: ${prefs.useModernSyntax ? '是' : '否'}`;
  }

  /**
   * 获取重构描述
   */
  private getRefactorDescription(execution: any): string {
    // 从工具执行结果中提取描述信息
    if (execution.input && execution.input.description) {
      return execution.input.description;
    }
    return `执行了 ${this.config.type} 重构`;
  }

  /**
   * 计算变更行数
   */
  private calculateLinesChanged(before: string, after: string): number {
    const beforeLines = before.split('\n').length;
    const afterLines = after.split('\n').length;
    return Math.abs(afterLines - beforeLines);
  }

  /**
   * 提取代码片段
   */
  private extractCodeSnippet(content: string, input: any): string {
    // 提取相关的代码片段用于展示
    if (typeof content === 'string' && content.length > 200) {
      return content.substring(0, 200) + '...';
    }
    return content;
  }

  /**
   * 生成重构报告
   */
  private async generateReport(result: RefactorResult): Promise<string> {
    const reportInstructions = `
基于以下重构结果生成详细的重构报告：

处理文件数: ${result.filesProcessed.length}
总变更数: ${result.changes.length}
错误数: ${result.errors.length}
重构类型: ${this.config.type}

变更详情:
${result.changes.map(change => 
  `- ${change.filePath}: ${change.description} (${change.linesChanged}行变更)`
).join('\n')}

请生成一份包含以下内容的重构报告：
1. 重构总结
2. 主要改进点
3. 代码质量提升情况
4. 建议和注意事项
5. 后续优化建议
`;

    const report = await claude()
      .withModel('claude-3-5-sonnet-20241022')
      .query(reportInstructions)
      .asText();

    return report;
  }

  /**
   * 回滚重构
   */
  async rollback(backupId: string): Promise<boolean> {
    try {
      const backupPath = join(this.config.backupDir!, `backup-${backupId}`);
      const backupInfoPath = join(backupPath, 'backup-info.json');
      
      const backupInfoContent = await fs.readFile(backupInfoPath, 'utf-8');
      const backupInfo: BackupInfo = JSON.parse(backupInfoContent);

      for (const filePath of backupInfo.files) {
        const relativePath = filePath.startsWith('./') ? filePath.substring(2) : filePath;
        const backupFilePath = join(backupPath, relativePath);
        
        if (await fs.access(backupFilePath).then(() => true).catch(() => false)) {
          await fs.copyFile(backupFilePath, filePath);
        }
      }

      console.log(`🔄 成功回滚到备份: ${backupId}`);
      return true;
    } catch (error) {
      console.error(`❌ 回滚失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

/**
 * 创建重构工具实例的便捷函数
 */
export function createRefactor(config: Partial<RefactorConfig>): CodeRefactor {
  return new CodeRefactor(config);
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: RefactorConfig = {
  type: RefactorType.IMPROVE_READABILITY,
  target: './',
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
