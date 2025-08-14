#!/usr/bin/env node

/**
 * AI驱动的项目代码分析与技术文档生成工具
 * 基于 Claude Code SDK 实现智能项目分析
 */

import { claude } from '../../../dist/index.js';
import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { createHash } from 'crypto';

/**
 * 文档类型枚举
 */
export enum DocumentType {
  TECHNICAL_OVERVIEW = 'Technical-Overview',
  COMPLEX_FLOW_ANALYSIS = 'Complex-Flow-Analysis', 
  PROBLEM_DIAGNOSIS_SOLUTION = 'Problem-Diagnosis-Solution'
}

/**
 * 项目分析配置
 */
export interface AnalysisConfig {
  /** 项目名称 */
  projectName: string;
  /** 目标项目路径 */
  projectPath: string;
  /** 输出目录 */
  outputDir: string;
  /** 包含的文件扩展名 */
  includeExtensions: string[];
  /** 排除的目录模式 */
  excludePatterns: string[];
  /** 分析深度（最大文件数） */
  maxFiles: number;
  /** 是否生成所有文档 */
  generateAll: boolean;
  /** 自定义分析提示词 */
  customPrompt?: string;
}

/**
 * 项目结构信息
 */
export interface ProjectStructure {
  /** 项目根路径 */
  rootPath: string;
  /** 所有源代码文件 */
  sourceFiles: string[];
  /** 目录结构 */
  directoryTree: DirectoryNode;
  /** 配置文件 */
  configFiles: string[];
  /** 文档文件 */
  documentFiles: string[];
  /** 依赖信息 */
  dependencies: DependencyInfo;
}

/**
 * 目录节点
 */
export interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  size?: number;
}

/**
 * 依赖信息
 */
export interface DependencyInfo {
  packageJson?: any;
  requirements?: string[];
  goMod?: any;
  gradleBuild?: any;
  dependencies: string[];
  devDependencies: string[];
}

/**
 * 分析结果
 */
export interface AnalysisResult {
  /** 项目名称 */
  projectName: string;
  /** 生成的文档 */
  generatedDocuments: GeneratedDocument[];
  /** 分析统计 */
  statistics: AnalysisStatistics;
  /** 错误信息 */
  errors: string[];
}

/**
 * 生成的文档
 */
export interface GeneratedDocument {
  /** 文档类型 */
  type: DocumentType;
  /** 文件路径 */
  filePath: string;
  /** 文档内容 */
  content: string;
  /** 生成时间 */
  generatedAt: Date;
}

/**
 * 分析统计
 */
export interface AnalysisStatistics {
  /** 扫描的文件数 */
  filesScanned: number;
  /** 代码行数 */
  linesOfCode: number;
  /** 检测到的技术栈 */
  detectedTechnologies: string[];
  /** 分析耗时 */
  duration: number;
}

/**
 * 项目代码分析器
 */
export class ProjectAnalyzer {
  private config: AnalysisConfig;
  private claude: any;

  constructor(config: Partial<AnalysisConfig>) {
    this.config = this.mergeWithDefaults(config);
    this.claude = claude()
      .withModel('claude-3-5-sonnet-20241022')
      .allowTools('Read', 'Write', 'LS', 'Grep', 'Glob')
      .withTimeout(120000)
      .skipPermissions();
  }

  /**
   * 合并默认配置
   */
  private mergeWithDefaults(config: Partial<AnalysisConfig>): AnalysisConfig {
    return {
      projectName: config.projectName || 'UnknownProject',
      projectPath: config.projectPath || './',
      outputDir: config.outputDir || './docs',
      includeExtensions: config.includeExtensions || [
        '.js', '.ts', '.tsx', '.jsx', 
        '.py', '.java', '.go', '.rs',
        '.cpp', '.c', '.h', '.hpp',
        '.md', '.json', '.yaml', '.yml'
      ],
      excludePatterns: config.excludePatterns || [
        'node_modules', 'dist', 'build', '.git', 
        '__pycache__', '.pytest_cache', 'target',
        'vendor', '.idea', '.vscode'
      ],
      maxFiles: config.maxFiles || 200,
      generateAll: config.generateAll ?? true,
      customPrompt: config.customPrompt,
      ...config
    } as AnalysisConfig;
  }

  /**
   * 分析项目并生成文档
   */
  async analyzeProject(): Promise<AnalysisResult> {
    const startTime = Date.now();
    console.log(`🔍 开始分析项目: ${this.config.projectName}`);
    console.log(`📁 项目路径: ${this.config.projectPath}`);

    const result: AnalysisResult = {
      projectName: this.config.projectName,
      generatedDocuments: [],
      statistics: {
        filesScanned: 0,
        linesOfCode: 0,
        detectedTechnologies: [],
        duration: 0
      },
      errors: []
    };

    try {
      // 1. 扫描项目结构
      console.log('📊 扫描项目结构...');
      const projectStructure = await this.scanProjectStructure();
      result.statistics.filesScanned = projectStructure.sourceFiles.length;
      
      // 2. 分析技术栈
      console.log('🔧 分析技术栈...');
      const technologies = await this.detectTechnologies(projectStructure);
      result.statistics.detectedTechnologies = technologies;

      // 3. 计算代码行数
      console.log('📏 统计代码行数...');
      const linesOfCode = await this.countLinesOfCode(projectStructure.sourceFiles);
      result.statistics.linesOfCode = linesOfCode;

      // 4. 创建输出目录
      await fs.mkdir(this.config.outputDir, { recursive: true });

      // 5. 生成文档
      if (this.config.generateAll) {
        console.log('📝 生成技术总览文档...');
        const overview = await this.generateTechnicalOverview(projectStructure);
        result.generatedDocuments.push(overview);

        console.log('📝 生成复杂流程分析文档...');
        const flowAnalysis = await this.generateComplexFlowAnalysis(projectStructure);
        result.generatedDocuments.push(flowAnalysis);

        console.log('📝 生成问题诊断解决方案文档...');
        const problemDiagnosis = await this.generateProblemDiagnosis(projectStructure);
        result.generatedDocuments.push(problemDiagnosis);
      }

      result.statistics.duration = Date.now() - startTime;
      console.log(`✅ 分析完成，耗时: ${result.statistics.duration}ms`);

      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(errorMsg);
      console.error(`❌ 分析失败: ${errorMsg}`);
      return result;
    }
  }

  /**
   * 扫描项目结构
   */
  private async scanProjectStructure(): Promise<ProjectStructure> {
    const sourceFiles: string[] = [];
    const configFiles: string[] = [];
    const documentFiles: string[] = [];

    // 扫描所有文件
    const allFiles = await this.scanDirectory(this.config.projectPath);
    
    for (const file of allFiles) {
      const ext = extname(file);
      const baseName = basename(file);
      
      if (this.config.includeExtensions.includes(ext)) {
        if (['.md', '.txt', '.rst'].includes(ext)) {
          documentFiles.push(file);
        } else if (this.isConfigFile(baseName)) {
          configFiles.push(file);
        } else {
          sourceFiles.push(file);
        }
      }
    }

    // 限制文件数量
    const limitedSourceFiles = sourceFiles.slice(0, this.config.maxFiles);

    // 构建目录树
    const directoryTree = await this.buildDirectoryTree(this.config.projectPath);

    // 分析依赖
    const dependencies = await this.analyzeDependencies(configFiles);

    return {
      rootPath: this.config.projectPath,
      sourceFiles: limitedSourceFiles,
      directoryTree,
      configFiles,
      documentFiles,
      dependencies
    };
  }

  /**
   * 扫描目录
   */
  private async scanDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!this.shouldExcludePath(entry.name)) {
            const subFiles = await this.scanDirectory(fullPath);
            files.push(...subFiles);
          }
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️ 无法读取目录 ${dirPath}: ${error}`);
    }

    return files;
  }

  /**
   * 判断是否应该排除路径
   */
  private shouldExcludePath(path: string): boolean {
    return this.config.excludePatterns.some(pattern => path.includes(pattern));
  }

  /**
   * 判断是否为配置文件
   */
  private isConfigFile(fileName: string): boolean {
    const configPatterns = [
      'package.json', 'tsconfig.json', 'webpack.config.js',
      'requirements.txt', 'setup.py', 'pyproject.toml',
      'Dockerfile', 'docker-compose.yml', 'Makefile',
      'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle'
    ];
    return configPatterns.some(pattern => fileName.includes(pattern));
  }

  /**
   * 构建目录树
   */
  private async buildDirectoryTree(dirPath: string): Promise<DirectoryNode> {
    const stat = await fs.stat(dirPath);
    const name = basename(dirPath);

    if (stat.isFile()) {
      return {
        name,
        path: dirPath,
        type: 'file',
        size: stat.size
      };
    }

    const children: DirectoryNode[] = [];
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries.slice(0, 10)) { // 限制显示数量
        if (!this.shouldExcludePath(entry.name)) {
          const childPath = join(dirPath, entry.name);
          const childNode = await this.buildDirectoryTree(childPath);
          children.push(childNode);
        }
      }
    } catch (error) {
      // 忽略无法读取的目录
    }

    return {
      name,
      path: dirPath,
      type: 'directory',
      children
    };
  }

  /**
   * 分析依赖
   */
  private async analyzeDependencies(configFiles: string[]): Promise<DependencyInfo> {
    const dependencies: string[] = [];
    const devDependencies: string[] = [];
    let packageJson: any = null;

    for (const file of configFiles) {
      try {
        if (file.endsWith('package.json')) {
          const content = await fs.readFile(file, 'utf-8');
          packageJson = JSON.parse(content);
          
          if (packageJson.dependencies) {
            dependencies.push(...Object.keys(packageJson.dependencies));
          }
          if (packageJson.devDependencies) {
            devDependencies.push(...Object.keys(packageJson.devDependencies));
          }
        }
      } catch (error) {
        console.warn(`⚠️ 无法解析配置文件 ${file}: ${error}`);
      }
    }

    return {
      packageJson,
      dependencies,
      devDependencies
    };
  }

  /**
   * 检测技术栈
   */
  private async detectTechnologies(structure: ProjectStructure): Promise<string[]> {
    const technologies = new Set<string>();

    // 根据文件扩展名检测
    for (const file of structure.sourceFiles) {
      const ext = extname(file);
      switch (ext) {
        case '.js':
        case '.jsx':
          technologies.add('JavaScript');
          break;
        case '.ts':
        case '.tsx':
          technologies.add('TypeScript');
          break;
        case '.py':
          technologies.add('Python');
          break;
        case '.java':
          technologies.add('Java');
          break;
        case '.go':
          technologies.add('Go');
          break;
        case '.rs':
          technologies.add('Rust');
          break;
        case '.cpp':
        case '.c':
          technologies.add('C/C++');
          break;
      }
    }

    // 根据依赖检测框架
    const deps = structure.dependencies.dependencies;
    if (deps.includes('react')) technologies.add('React');
    if (deps.includes('vue')) technologies.add('Vue.js');
    if (deps.includes('angular')) technologies.add('Angular');
    if (deps.includes('express')) technologies.add('Express.js');
    if (deps.includes('fastapi')) technologies.add('FastAPI');
    if (deps.includes('django')) technologies.add('Django');

    return Array.from(technologies);
  }

  /**
   * 统计代码行数
   */
  private async countLinesOfCode(files: string[]): Promise<number> {
    let totalLines = 0;
    
    for (const file of files.slice(0, 50)) { // 限制文件数量避免超时
      try {
        const content = await fs.readFile(file, 'utf-8');
        totalLines += content.split('\n').length;
      } catch (error) {
        // 忽略无法读取的文件
      }
    }
    
    return totalLines;
  }

  /**
   * 生成技术总览文档
   */
  private async generateTechnicalOverview(structure: ProjectStructure): Promise<GeneratedDocument> {
    const prompt = this.buildTechnicalOverviewPrompt(structure);
    
    const content = await this.claude
      .inDirectory(this.config.projectPath)
      .query(prompt)
      .asText();

    const fileName = `${this.config.projectName}-Technical-Overview.md`;
    const filePath = join(this.config.outputDir, fileName);
    
    await fs.writeFile(filePath, content);

    return {
      type: DocumentType.TECHNICAL_OVERVIEW,
      filePath,
      content,
      generatedAt: new Date()
    };
  }

  /**
   * 生成复杂流程分析文档
   */
  private async generateComplexFlowAnalysis(structure: ProjectStructure): Promise<GeneratedDocument> {
    const prompt = this.buildComplexFlowAnalysisPrompt(structure);
    
    const content = await this.claude
      .inDirectory(this.config.projectPath)
      .query(prompt)
      .asText();

    const fileName = `${this.config.projectName}-Complex-Flow-Analysis.md`;
    const filePath = join(this.config.outputDir, fileName);
    
    await fs.writeFile(filePath, content);

    return {
      type: DocumentType.COMPLEX_FLOW_ANALYSIS,
      filePath,
      content,
      generatedAt: new Date()
    };
  }

  /**
   * 生成问题诊断解决方案文档
   */
  private async generateProblemDiagnosis(structure: ProjectStructure): Promise<GeneratedDocument> {
    const prompt = this.buildProblemDiagnosisPrompt(structure);
    
    const content = await this.claude
      .inDirectory(this.config.projectPath)
      .query(prompt)
      .asText();

    const fileName = `${this.config.projectName}-Problem-Diagnosis-Solution.md`;
    const filePath = join(this.config.outputDir, fileName);
    
    await fs.writeFile(filePath, content);

    return {
      type: DocumentType.PROBLEM_DIAGNOSIS_SOLUTION,
      filePath,
      content,
      generatedAt: new Date()
    };
  }

  /**
   * 构建技术总览文档提示词
   */
  private buildTechnicalOverviewPrompt(structure: ProjectStructure): string {
    return `# [PROMPT] AI驱动的代码深度分析与技术文档生成

## 1. 角色 (Persona)
你是一位顶级的AI软件架构师和代码分析引擎，拥有超过十年的企业级系统分析经验。你能够将任何复杂的代码仓库，通过深度扫描和逻辑推理，转化为一套清晰、实用且高度结构化的技术文档。

## 2. 上下文 (Context)
你将分析项目: ${this.config.projectName}
项目路径: ${this.config.projectPath}
检测到的技术栈: ${structure.dependencies.dependencies.join(', ')}
源代码文件数: ${structure.sourceFiles.length}

## 3. 任务目标
请生成 "${this.config.projectName}-Technical-Overview.md" 文档。

## 4. 执行要求

### **交付物: 项目技术总览**

#### **Part A: 项目概述**
- **项目背景与使命**: 通过分析代码和配置文件，解释项目为何存在及其核心价值。
- **主要用户角色与场景**: 描述为谁服务以及他们如何使用。

#### **Part B: 技术栈详解**
以表格形式列出所有关键技术组件及其版本，包括：
- **编程语言**: 基于文件扩展名分析
- **框架和库**: 基于依赖分析
- **工具链**: 基于配置文件分析

#### **Part C: 架构五视图分析 (统一使用Mermaid图 + 文字解释)**
为以下每个视图，生成 **1. 一个Mermaid图** 和 **2. 一段详细的文字解释**：

1. **逻辑视图 (Logical View)**: 绘制一级功能模块及其交互关系图
2. **开发视图 (Development View)**: 绘制代码模块的依赖关系图  
3. **部署视图 (Deployment View)**: 绘制典型的部署拓扑图
4. **运行视图 (Runtime View)**: 绘制运行时并发和同步异步模型
5. **数据视图 (Data View)**: 绘制核心业务模块的E-R图

#### **Part D: 核心复杂流程识别表**
识别并列出Top 30个核心复杂流程，按以下格式输出：

| 流程名称 | 流程入口函数 | 核心复杂性解释 | 潜在问题 | 重要程度 (高/中/低) |
| :--- | :--- | :--- | :--- | :--- |

## 5. 分析指导
请深入分析以下目录结构：
${this.formatDirectoryTree(structure.directoryTree)}

主要源代码文件：
${structure.sourceFiles.slice(0, 20).map(f => `- ${f}`).join('\n')}

请基于实际代码内容进行分析，使用 Read 工具读取关键文件内容。所有分析必须基于实际代码，严禁主观臆断。`;
  }

  /**
   * 构建复杂流程分析提示词
   */
  private buildComplexFlowAnalysisPrompt(structure: ProjectStructure): string {
    return `# [PROMPT] 复杂流程深度分析

## 角色
你是一位经验丰富的系统架构师，专门负责复杂业务流程的深度分析。

## 任务
基于之前生成的技术总览文档中识别的核心复杂流程，为项目 "${this.config.projectName}" 生成 "${this.config.projectName}-Complex-Flow-Analysis.md" 文档。

## 执行要求
针对技术总览中识别出的**重要程度为"高"和"中"**的流程，逐一进行深度分析。

为每个流程创建一个二级标题，包含：
1. **流程概述**: 业务目标、触发条件、潜在核心问题、关键非功能点
2. **Mermaid时序图**: 完整的端到端调用链时序图
3. **关键配置项**: 影响此流程行为的关键配置
4. **详细步骤分析**: 关键步骤的文字说明和业务规则

## 分析指导
请深入分析以下主要源代码文件：
${structure.sourceFiles.slice(0, 15).map(f => `- ${f}`).join('\n')}

使用 Read 和 Grep 工具深入分析代码实现，特别关注：
- 主要业务流程的入口函数
- 复杂的条件逻辑和状态管理
- 数据库操作和外部API调用
- 错误处理和异常恢复机制

所有分析必须基于实际代码内容。`;
  }

  /**
   * 构建问题诊断提示词
   */
  private buildProblemDiagnosisPrompt(structure: ProjectStructure): string {
    return `# [PROMPT] 问题诊断与快速解决方案

## 角色
你是一位经验丰富的网站可靠性工程师（SRE），专门负责系统问题的快速诊断和解决。

## 任务
基于复杂流程分析的结论，为项目 "${this.config.projectName}" 生成 "${this.config.projectName}-Problem-Diagnosis-Solution.md" 文档。

## 执行要求
为每个核心流程预测可能出现的问题并提供解决方案，严格按照以下格式输出：

| 序号 | 潜在问题现象 (用户视角) | 技术层面的根本原因 | 解决方案 |
| :--- | :--- | :--- | :--- |

## 分析重点
基于代码分析，重点关注：
- 性能瓶颈和资源消耗问题
- 并发安全和数据一致性问题  
- 错误处理和故障恢复问题
- 配置错误和环境依赖问题
- 安全漏洞和访问控制问题

## 质量要求
- 所有问题必须基于实际代码分析
- 解决方案必须具体可执行
- 优先关注高频和高影响的问题
- 提供快速定位问题的方法`;
  }

  /**
   * 格式化目录树
   */
  private formatDirectoryTree(node: DirectoryNode, indent: string = ''): string {
    let result = `${indent}${node.name}${node.type === 'directory' ? '/' : ''}\n`;
    
    if (node.children) {
      for (const child of node.children) {
        result += this.formatDirectoryTree(child, indent + '  ');
      }
    }
    
    return result;
  }
}

/**
 * 创建项目分析器实例
 */
export function createProjectAnalyzer(config: Partial<AnalysisConfig>): ProjectAnalyzer {
  return new ProjectAnalyzer(config);
}

/**
 * 默认配置
 */
export const DEFAULT_ANALYSIS_CONFIG: Partial<AnalysisConfig> = {
  outputDir: './docs',
  includeExtensions: ['.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.go'],
  excludePatterns: ['node_modules', 'dist', 'build', '.git'],
  maxFiles: 200,
  generateAll: true
};

