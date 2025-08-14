/**
 * 模拟项目分析器 - 用于测试和演示，不依赖Claude CLI
 */

import * as fs from 'fs/promises';
import * as fsExtra from 'fs-extra';
import * as path from 'path';

export interface MockAnalysisConfig {
  analysisDepth: 'basic' | 'detailed' | 'deep';
  includeArchitecture: boolean;
  includeMermaidDiagrams: boolean;
  maxFileSize: number;
  excludePatterns: string[];
}

export interface MockProjectStructure {
  totalFiles: number;
  directories: number;
  codeFiles: number;
  testFiles: number;
  configFiles: number;
  filesByExtension: { [key: string]: number };
}

export interface MockAnalysisResult {
  projectName: string;
  projectPath: string;
  techStack: string[];
  projectStructure: MockProjectStructure;
  complexity: {
    overall: 'low' | 'medium' | 'high';
    business: 'low' | 'medium' | 'high';
    technical: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
  keyFiles: string[];
  potentialIssues: string[];
}

export class MockProjectAnalyzer {
  private config: MockAnalysisConfig;

  constructor(config: Partial<MockAnalysisConfig> = {}) {
    this.config = {
      analysisDepth: 'detailed',
      includeArchitecture: true,
      includeMermaidDiagrams: true,
      maxFileSize: 1024 * 1024, // 1MB
      excludePatterns: ['node_modules', '.git', 'dist', 'build'],
      ...config
    };
  }

  /**
   * 分析项目结构和特征
   */
  async analyzeProject(projectName: string, projectPath: string): Promise<MockAnalysisResult> {
    console.log(`🔍 开始分析项目: ${projectName}`);
    console.log(`📁 项目路径: ${projectPath}`);

    // 检查项目路径是否存在
    if (!await fsExtra.pathExists(projectPath)) {
      throw new Error(`项目路径不存在: ${projectPath}`);
    }

    // 扫描项目结构
    const projectStructure = await this.scanProjectStructure(projectPath);
    
    // 检测技术栈
    const techStack = this.detectTechStack(projectStructure);
    
    // 评估复杂度
    const complexity = this.assessComplexity(projectStructure);
    
    // 找到关键文件
    const keyFiles = await this.findKeyFiles(projectPath);
    
    // 生成建议
    const recommendations = this.generateRecommendations(projectStructure, complexity);
    
    // 识别潜在问题
    const potentialIssues = this.identifyPotentialIssues(projectStructure);

    return {
      projectName,
      projectPath,
      techStack,
      projectStructure,
      complexity,
      recommendations,
      keyFiles,
      potentialIssues
    };
  }

  /**
   * 扫描项目结构
   */
  private async scanProjectStructure(projectPath: string): Promise<MockProjectStructure> {
    const structure: MockProjectStructure = {
      totalFiles: 0,
      directories: 0,
      codeFiles: 0,
      testFiles: 0,
      configFiles: 0,
      filesByExtension: {}
    };

    const codeExtensions = ['.ts', '.js', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.php', '.rb', '.cs'];
    const testPatterns = ['.test.', '.spec.', '/test/', '/tests/', '__tests__'];
    const configExtensions = ['.json', '.yaml', '.yml', '.toml', '.ini', '.conf'];

    try {
      await this.scanDirectory(projectPath, structure, codeExtensions, testPatterns, configExtensions);
    } catch (error) {
      console.warn(`扫描目录时出错: ${error}`);
    }

    return structure;
  }

  /**
   * 递归扫描目录
   */
  private async scanDirectory(
    dirPath: string, 
    structure: MockProjectStructure,
    codeExtensions: string[],
    testPatterns: string[],
    configExtensions: string[]
  ): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // 跳过排除的目录
      if (this.config.excludePatterns.some(pattern => entry.name.includes(pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        structure.directories++;
        await this.scanDirectory(fullPath, structure, codeExtensions, testPatterns, configExtensions);
      } else {
        structure.totalFiles++;
        
        const ext = path.extname(entry.name);
        structure.filesByExtension[ext] = (structure.filesByExtension[ext] || 0) + 1;

        // 分类文件
        if (codeExtensions.includes(ext)) {
          structure.codeFiles++;
        }
        
        if (testPatterns.some(pattern => fullPath.includes(pattern))) {
          structure.testFiles++;
        }
        
        if (configExtensions.includes(ext) || this.isConfigFile(entry.name)) {
          structure.configFiles++;
        }
      }
    }
  }

  /**
   * 检查是否为配置文件
   */
  private isConfigFile(filename: string): boolean {
    const configFiles = [
      'package.json', 'tsconfig.json', 'webpack.config.js', 'babel.config.js',
      'Dockerfile', 'docker-compose.yml', '.gitignore', '.env', 'Makefile',
      'pyproject.toml', 'setup.py', 'requirements.txt', 'pom.xml', 'build.gradle'
    ];
    return configFiles.includes(filename) || filename.startsWith('.') && filename.includes('config');
  }

  /**
   * 检测技术栈
   */
  private detectTechStack(structure: MockProjectStructure): string[] {
    const techStack: string[] = [];
    const extensions = Object.keys(structure.filesByExtension);

    // 根据文件扩展名推断技术栈
    const techMap: { [key: string]: string } = {
      '.ts': 'TypeScript',
      '.js': 'JavaScript',
      '.jsx': 'React',
      '.tsx': 'React/TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.cpp': 'C++',
      '.c': 'C',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.cs': 'C#',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala'
    };

    for (const ext of extensions) {
      if (techMap[ext] && !techStack.includes(techMap[ext])) {
        techStack.push(techMap[ext]);
      }
    }

    // 推断框架和工具
    if (structure.filesByExtension['.ts'] || structure.filesByExtension['.js']) {
      techStack.push('Node.js');
    }

    return techStack.length > 0 ? techStack : ['Unknown'];
  }

  /**
   * 评估项目复杂度
   */
  private assessComplexity(structure: MockProjectStructure): MockAnalysisResult['complexity'] {
    const totalFiles = structure.totalFiles;
    const codeFiles = structure.codeFiles;
    const directories = structure.directories;

    // 基于文件数量和结构评估复杂度
    let overallScore = 0;
    let businessScore = 0;
    let technicalScore = 0;

    // 文件数量影响
    if (totalFiles > 100) overallScore += 2;
    else if (totalFiles > 50) overallScore += 1;

    if (codeFiles > 80) technicalScore += 2;
    else if (codeFiles > 40) technicalScore += 1;

    // 目录结构影响
    if (directories > 20) overallScore += 2;
    else if (directories > 10) overallScore += 1;

    // 技术栈多样性
    const techCount = Object.keys(structure.filesByExtension).length;
    if (techCount > 5) technicalScore += 1;

    // 测试覆盖率影响
    const testRatio = structure.testFiles / structure.codeFiles;
    if (testRatio < 0.3) businessScore += 1;

    const getLevel = (score: number) => {
      if (score >= 3) return 'high';
      if (score >= 2) return 'medium';
      return 'low';
    };

    return {
      overall: getLevel(overallScore),
      business: getLevel(businessScore),
      technical: getLevel(technicalScore)
    };
  }

  /**
   * 查找关键文件
   */
  private async findKeyFiles(projectPath: string): Promise<string[]> {
    const keyFiles: string[] = [];
    const importantFiles = [
      'README.md', 'package.json', 'tsconfig.json', 'webpack.config.js',
      'Dockerfile', 'docker-compose.yml', 'main.ts', 'index.ts', 'app.ts',
      'server.ts', 'main.js', 'index.js', 'app.js', 'server.js'
    ];

    for (const file of importantFiles) {
      const filePath = path.join(projectPath, file);
      if (await fsExtra.pathExists(filePath)) {
        keyFiles.push(file);
      }
    }

    return keyFiles;
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(structure: MockProjectStructure, complexity: MockAnalysisResult['complexity']): string[] {
    const recommendations: string[] = [];

    // 基于测试覆盖率的建议
    const testRatio = structure.testFiles / structure.codeFiles;
    if (testRatio < 0.3) {
      recommendations.push('增加单元测试覆盖率，当前测试文件比例较低');
    }

    // 基于复杂度的建议
    if (complexity.overall === 'high') {
      recommendations.push('考虑重构大型模块，降低整体复杂度');
    }

    if (complexity.technical === 'high') {
      recommendations.push('简化技术栈，减少不必要的依赖');
    }

    // 基于文件结构的建议
    if (structure.configFiles < 3) {
      recommendations.push('完善项目配置文件，如添加CI/CD配置');
    }

    if (structure.totalFiles > 200) {
      recommendations.push('考虑模块化架构，将大型项目拆分为多个子模块');
    }

    // 通用建议
    recommendations.push('定期进行代码审查，保持代码质量');
    recommendations.push('建立完善的文档体系');

    return recommendations;
  }

  /**
   * 识别潜在问题
   */
  private identifyPotentialIssues(structure: MockProjectStructure): string[] {
    const issues: string[] = [];

    // 文件结构问题
    if (structure.testFiles === 0) {
      issues.push('缺少测试文件，存在质量风险');
    }

    if (structure.configFiles === 0) {
      issues.push('缺少配置文件，可能影响部署和维护');
    }

    if (structure.totalFiles > 500) {
      issues.push('项目文件过多，可能存在维护困难');
    }

    // 代码质量问题
    const jsFiles = structure.filesByExtension['.js'] || 0;
    const tsFiles = structure.filesByExtension['.ts'] || 0;
    if (jsFiles > tsFiles && tsFiles > 0) {
      issues.push('混合使用JavaScript和TypeScript，建议统一语言');
    }

    return issues;
  }

  /**
   * 生成技术总览文档
   */
  generateTechnicalOverview(result: MockAnalysisResult): string {
    return `# ${result.projectName} - 技术总览

## 项目概述
- **项目名称**: ${result.projectName}
- **项目路径**: ${result.projectPath}
- **技术栈**: ${result.techStack.join(', ')}

## 项目结构统计
- **总文件数**: ${result.projectStructure.totalFiles}
- **目录数量**: ${result.projectStructure.directories}
- **代码文件**: ${result.projectStructure.codeFiles}
- **测试文件**: ${result.projectStructure.testFiles}
- **配置文件**: ${result.projectStructure.configFiles}

## 文件类型分布
${Object.entries(result.projectStructure.filesByExtension)
  .map(([ext, count]) => `- ${ext}: ${count} 个文件`)
  .join('\n')}

## 复杂度评估
- **整体复杂度**: ${result.complexity.overall}
- **业务复杂度**: ${result.complexity.business}
- **技术复杂度**: ${result.complexity.technical}

## 关键文件
${result.keyFiles.map(file => `- ${file}`).join('\n')}

## 架构视图

\`\`\`mermaid
graph TB
    A[应用层] --> B[业务逻辑层]
    B --> C[数据访问层]
    C --> D[存储层]
    
    subgraph "技术栈"
        E[${result.techStack[0] || 'Main Tech'}]
        F[${result.techStack[1] || 'Framework'}]
        G[${result.techStack[2] || 'Database'}]
    end
\`\`\`

## 改进建议
${result.recommendations.map(r => `- ${r}`).join('\n')}

## 潜在问题
${result.potentialIssues.length > 0 ? result.potentialIssues.map(issue => `- ${issue}`).join('\n') : '- 暂无明显问题'}

---
*文档生成时间: ${new Date().toLocaleString()}*
*分析工具: Claude Code 文档生成器 (模拟模式)*`;
  }

  /**
   * 生成复杂流程分析文档
   */
  generateComplexFlowAnalysis(result: MockAnalysisResult): string {
    return `# ${result.projectName} - 复杂流程分析

## 项目复杂度概述
- **整体复杂度**: ${result.complexity.overall}
- **业务复杂度**: ${result.complexity.business}  
- **技术复杂度**: ${result.complexity.technical}

## 高复杂度流程识别

### 1. 主业务流程
基于项目结构分析，识别出以下关键流程：

\`\`\`mermaid
sequenceDiagram
    participant Client as 客户端
    participant App as 应用层
    participant Business as 业务层
    participant Data as 数据层
    
    Client->>App: 请求处理
    App->>Business: 业务逻辑
    Business->>Data: 数据操作
    Data-->>Business: 返回结果
    Business-->>App: 处理结果
    App-->>Client: 响应数据
\`\`\`

### 2. 配置管理流程
- **配置文件数量**: ${result.projectStructure.configFiles}
- **配置复杂度**: ${result.complexity.technical}

关键配置文件：
${result.keyFiles.filter(f => f.includes('config') || f.includes('.json') || f.includes('.yml')).map(f => `- ${f}`).join('\n') || '- 暂无明显配置文件'}

### 3. 模块依赖关系

\`\`\`mermaid
graph LR
    subgraph "核心模块"
        A[主模块]
        B[工具模块]
        C[配置模块]
    end
    
    subgraph "支持模块"  
        D[测试模块]
        E[构建模块]
    end
    
    A --> B
    A --> C
    D --> A
    E --> A
\`\`\`

## 中复杂度流程

### 文件处理流程
- **总文件数**: ${result.projectStructure.totalFiles}
- **代码文件**: ${result.projectStructure.codeFiles}
- **处理复杂度**: 基于文件数量评估为 ${result.complexity.overall}

### 技术栈集成
当前使用的技术栈：
${result.techStack.map(tech => `- ${tech}`).join('\n')}

## 性能影响分析

### 文件结构影响
- 大量文件 (${result.projectStructure.totalFiles}个) 可能影响构建速度
- 目录层级 (${result.projectStructure.directories}个目录) 影响模块查找效率

### 建议优化点
${result.recommendations.slice(0, 3).map(r => `- ${r}`).join('\n')}

## 风险评估
${result.potentialIssues.length > 0 ? result.potentialIssues.map(issue => `- ⚠️ ${issue}`).join('\n') : '- ✅ 暂无明显风险'}

---
*分析深度: ${this.config.analysisDepth}*
*生成时间: ${new Date().toLocaleString()}*`;
  }

  /**
   * 生成问题诊断方案文档
   */
  generateProblemDiagnosis(result: MockAnalysisResult): string {
    return `# ${result.projectName} - 问题诊断与解决方案

## 项目健康度评估

### 整体评分
- **代码质量**: ${this.getQualityScore(result)}
- **测试覆盖**: ${this.getTestCoverageScore(result)}
- **架构合理性**: ${this.getArchitectureScore(result)}

## 已识别问题

### 🔴 高优先级问题
${result.potentialIssues.filter(issue => issue.includes('缺少') || issue.includes('风险')).map(issue => `- ${issue}`).join('\n') || '- 暂无高优先级问题'}

### 🟡 中优先级问题  
${result.potentialIssues.filter(issue => !issue.includes('缺少') && !issue.includes('风险')).map(issue => `- ${issue}`).join('\n') || '- 暂无中优先级问题'}

### 🟢 低优先级问题
- 代码文档可以进一步完善
- 可以考虑引入更多自动化工具

## 性能瓶颈分析

### 文件结构瓶颈
- **文件数量**: ${result.projectStructure.totalFiles} (${this.getFileSizeAssessment(result.projectStructure.totalFiles)})
- **目录深度**: ${result.projectStructure.directories} (${this.getDirectoryAssessment(result.projectStructure.directories)})

### 技术栈复杂度
- **使用技术数量**: ${result.techStack.length}
- **技术栈评估**: ${this.getTechStackAssessment(result.techStack.length)}

## 解决方案建议

### 立即行动项
${result.recommendations.slice(0, 2).map(r => `1. ${r}`).join('\n')}

### 短期改进 (1-3个月)
${result.recommendations.slice(2, 4).map(r => `- ${r}`).join('\n')}

### 长期规划 (3-6个月)
${result.recommendations.slice(4).map(r => `- ${r}`).join('\n')}

## 最佳实践建议

### 代码质量
- 建立代码审查流程
- 引入静态代码分析工具
- 设置代码覆盖率目标

### 项目管理
- 定期进行架构回顾
- 建立技术债务跟踪机制
- 制定重构计划

### 监控和维护
- 设置性能监控
- 建立日志系统
- 定期进行安全检查

## 风险缓解策略

### 技术风险
${this.getTechnicalRiskMitigation(result)}

### 业务风险  
${this.getBusinessRiskMitigation(result)}

## 成功指标

### 短期目标 (1个月)
- 测试覆盖率达到 ${this.getTestCoverageTarget(result)}%
- 解决 ${Math.min(result.potentialIssues.length, 3)} 个关键问题

### 中期目标 (3个月)
- 代码复杂度降低到 ${result.complexity.overall === 'high' ? 'medium' : 'low'}
- 完成核心模块重构

### 长期目标 (6个月)
- 建立完整的CI/CD流程
- 实现自动化测试覆盖

---
*诊断工具: Claude Code 文档生成器*
*诊断时间: ${new Date().toLocaleString()}*
*建议复查周期: 1个月*`;
  }

  // 辅助评估方法
  private getQualityScore(result: MockAnalysisResult): string {
    const issues = result.potentialIssues.length;
    if (issues === 0) return '优秀';
    if (issues <= 2) return '良好';
    if (issues <= 4) return '一般';
    return '需要改进';
  }

  private getTestCoverageScore(result: MockAnalysisResult): string {
    const ratio = result.projectStructure.testFiles / result.projectStructure.codeFiles;
    if (ratio >= 0.8) return '优秀';
    if (ratio >= 0.5) return '良好';
    if (ratio >= 0.3) return '一般';
    return '不足';
  }

  private getArchitectureScore(result: MockAnalysisResult): string {
    if (result.complexity.overall === 'low') return '优秀';
    if (result.complexity.overall === 'medium') return '良好';
    return '需要优化';
  }

  private getFileSizeAssessment(fileCount: number): string {
    if (fileCount < 50) return '小型项目';
    if (fileCount < 200) return '中型项目';
    return '大型项目';
  }

  private getDirectoryAssessment(dirCount: number): string {
    if (dirCount < 10) return '结构简单';
    if (dirCount < 30) return '结构适中';
    return '结构复杂';
  }

  private getTechStackAssessment(techCount: number): string {
    if (techCount <= 3) return '技术栈简洁';
    if (techCount <= 6) return '技术栈适中';
    return '技术栈复杂';
  }

  private getTestCoverageTarget(result: MockAnalysisResult): number {
    const current = (result.projectStructure.testFiles / result.projectStructure.codeFiles) * 100;
    return Math.min(80, Math.max(50, current + 20));
  }

  private getTechnicalRiskMitigation(result: MockAnalysisResult): string {
    if (result.complexity.technical === 'high') {
      return '- 制定技术栈简化计划\n- 建立技术决策评审流程';
    }
    return '- 保持当前技术栈稳定性\n- 定期评估新技术引入';
  }

  private getBusinessRiskMitigation(result: MockAnalysisResult): string {
    if (result.complexity.business === 'high') {
      return '- 梳理核心业务流程\n- 建立业务需求变更管控';
    }
    return '- 保持业务逻辑清晰\n- 定期进行业务架构回顾';
  }
}
