#!/usr/bin/env node

/**
 * MCP (Model Context Protocol) Server for Document Generator
 * 将文档生成器封装为MCP服务，供其他智能体使用
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ProjectAnalyzer, createProjectAnalyzer } from './project-analyzer.js';
import { MockProjectAnalyzer } from './mock-analyzer.js';
import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * MCP文档生成器服务器
 */
class DocumentGeneratorMCPServer {
  private server: Server;
  private analyzers: Map<string, ProjectAnalyzer | MockProjectAnalyzer> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'document-generator-mcp',
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
  }

  /**
   * 设置工具处理器
   */
  private setupToolHandlers(): void {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_project',
            description: '分析项目结构并生成技术文档',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: '项目名称',
                },
                projectPath: {
                  type: 'string',
                  description: '项目路径',
                },
                outputDir: {
                  type: 'string',
                  description: '输出目录',
                  default: './docs',
                },
                documentTypes: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['technical-overview', 'complex-flow', 'problem-diagnosis', 'all'],
                  },
                  description: '要生成的文档类型',
                  default: ['all'],
                },
                maxFiles: {
                  type: 'number',
                  description: '最大扫描文件数',
                  default: 200,
                },
                useMock: {
                  type: 'boolean',
                  description: '是否使用模拟分析器（用于测试）',
                  default: false,
                },
              },
              required: ['projectName', 'projectPath'],
            },
          },
          {
            name: 'generate_technical_overview',
            description: '生成项目技术总览文档',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: '项目名称',
                },
                projectPath: {
                  type: 'string',
                  description: '项目路径',
                },
                outputDir: {
                  type: 'string',
                  description: '输出目录',
                  default: './docs',
                },
              },
              required: ['projectName', 'projectPath'],
            },
          },
          {
            name: 'generate_complex_flow_analysis',
            description: '生成复杂流程分析文档',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: '项目名称',
                },
                projectPath: {
                  type: 'string',
                  description: '项目路径',
                },
                outputDir: {
                  type: 'string',
                  description: '输出目录',
                  default: './docs',
                },
              },
              required: ['projectName', 'projectPath'],
            },
          },
          {
            name: 'generate_problem_diagnosis',
            description: '生成问题诊断与解决方案文档',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: '项目名称',
                },
                projectPath: {
                  type: 'string',
                  description: '项目路径',
                },
                outputDir: {
                  type: 'string',
                  description: '输出目录',
                  default: './docs',
                },
              },
              required: ['projectName', 'projectPath'],
            },
          },
          {
            name: 'list_analyzed_projects',
            description: '列出已分析的项目',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_analysis_statistics',
            description: '获取项目分析统计信息',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: {
                  type: 'string',
                  description: '项目名称',
                },
              },
              required: ['projectName'],
            },
          },
        ],
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_project':
            return await this.handleAnalyzeProject(args);
          case 'generate_technical_overview':
            return await this.handleGenerateTechnicalOverview(args);
          case 'generate_complex_flow_analysis':
            return await this.handleGenerateComplexFlowAnalysis(args);
          case 'generate_problem_diagnosis':
            return await this.handleGenerateProblemDiagnosis(args);
          case 'list_analyzed_projects':
            return await this.handleListAnalyzedProjects(args);
          case 'get_analysis_statistics':
            return await this.handleGetAnalysisStatistics(args);
          default:
            throw new Error(`未知工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `工具执行失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * 处理项目分析
   */
  private async handleAnalyzeProject(args: any): Promise<any> {
    const { projectName, projectPath, outputDir = './docs', documentTypes = ['all'], maxFiles = 200, useMock = false } = args;

    // 验证项目路径
    try {
      await fs.access(projectPath);
    } catch {
      throw new Error(`项目路径不存在: ${projectPath}`);
    }

    // 创建分析器
    const analyzerKey = `${projectName}-${projectPath}`;
    let analyzer: ProjectAnalyzer | MockProjectAnalyzer;

    if (useMock) {
      analyzer = new MockProjectAnalyzer({
        analysisDepth: 'deep',
        includeArchitecture: true,
        includeMermaidDiagrams: true,
        maxFileSize: 1024 * 1024,
        excludePatterns: ['node_modules', '.git', 'dist', 'build'],
      });
    } else {
      analyzer = createProjectAnalyzer({
        projectName,
        projectPath,
        outputDir,
        maxFiles,
        generateAll: documentTypes.includes('all'),
      });
    }

    this.analyzers.set(analyzerKey, analyzer);

    // 执行分析
    const result = await analyzer.analyzeProject(projectName, projectPath);

    // 生成指定类型的文档
    const generatedDocs = [];
    if (documentTypes.includes('all') || documentTypes.includes('technical-overview')) {
      if (useMock) {
        const mockResult = result as any;
        const content = (analyzer as MockProjectAnalyzer).generateTechnicalOverview(mockResult);
        const filePath = join(outputDir, `${projectName}-Technical-overview.md`);
        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        generatedDocs.push({ type: 'technical-overview', filePath });
      } else {
        // 真实分析器会自动生成文档
        const realResult = result as any;
        generatedDocs.push(...realResult.generatedDocuments.filter((doc: any) => 
          doc.type === 'Technical-Overview'
        ));
      }
    }

    if (documentTypes.includes('all') || documentTypes.includes('complex-flow')) {
      if (useMock) {
        const mockResult = result as any;
        const content = (analyzer as MockProjectAnalyzer).generateComplexFlowAnalysis(mockResult);
        const filePath = join(outputDir, `${projectName}-Complex-flow.md`);
        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        generatedDocs.push({ type: 'complex-flow', filePath });
      } else {
        const realResult = result as any;
        generatedDocs.push(...realResult.generatedDocuments.filter((doc: any) => 
          doc.type === 'Complex-Flow-Analysis'
        ));
      }
    }

    if (documentTypes.includes('all') || documentTypes.includes('problem-diagnosis')) {
      if (useMock) {
        const mockResult = result as any;
        const content = (analyzer as MockProjectAnalyzer).generateProblemDiagnosis(mockResult);
        const filePath = join(outputDir, `${projectName}-Problem-diagnosis.md`);
        await fs.mkdir(dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        generatedDocs.push({ type: 'problem-diagnosis', filePath });
      } else {
        const realResult = result as any;
        generatedDocs.push(...realResult.generatedDocuments.filter((doc: any) => 
          doc.type === 'Problem-Diagnosis-Solution'
        ));
      }
    }

    // 处理统计信息
    let statsText = '';
    let errorsText = '';
    
    if (useMock) {
      const mockResult = result as any;
      statsText = `
📊 分析统计:
- 扫描文件数: ${mockResult.projectStructure?.totalFiles || 'N/A'}
- 代码文件数: ${mockResult.projectStructure?.codeFiles || 'N/A'}
- 检测技术栈: ${mockResult.techStack?.join(', ') || 'N/A'}
- 复杂度: ${mockResult.complexity?.overall || 'N/A'}`;
      
      if (mockResult.potentialIssues?.length > 0) {
        errorsText = `\n⚠️ 潜在问题:\n${mockResult.potentialIssues.join('\n')}`;
      }
    } else {
      const realResult = result as any;
      statsText = `
📊 分析统计:
- 扫描文件数: ${realResult.statistics?.filesScanned || 'N/A'}
- 代码行数: ${realResult.statistics?.linesOfCode || 'N/A'}
- 检测技术栈: ${realResult.statistics?.detectedTechnologies?.join(', ') || 'N/A'}
- 分析耗时: ${realResult.statistics?.duration || 'N/A'}ms`;
      
      if (realResult.errors?.length > 0) {
        errorsText = `\n⚠️ 错误信息:\n${realResult.errors.join('\n')}`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: `项目分析完成！${statsText}

📄 生成文档:
${generatedDocs.map(doc => `- ${doc.type}: ${doc.filePath}`).join('\n')}${errorsText}`,
        },
      ],
    };
  }

  /**
   * 处理技术总览生成
   */
  private async handleGenerateTechnicalOverview(args: any): Promise<any> {
    const { projectName, projectPath, outputDir = './docs' } = args;

    const analyzer = createProjectAnalyzer({
      projectName,
      projectPath,
      outputDir,
      generateAll: false,
    });

    const result = await analyzer.analyzeProject();
    const techOverview = result.generatedDocuments.find(doc => doc.type === 'Technical-Overview');

    return {
      content: [
        {
          type: 'text',
          text: `技术总览文档已生成！

📄 文档路径: ${techOverview?.filePath || 'N/A'}
📊 文档大小: ${techOverview?.content.length || 0} 字符
⏰ 生成时间: ${techOverview?.generatedAt.toISOString() || 'N/A'}`,
        },
      ],
    };
  }

  /**
   * 处理复杂流程分析生成
   */
  private async handleGenerateComplexFlowAnalysis(args: any): Promise<any> {
    const { projectName, projectPath, outputDir = './docs' } = args;

    const analyzer = createProjectAnalyzer({
      projectName,
      projectPath,
      outputDir,
      generateAll: false,
    });

    const result = await analyzer.analyzeProject();
    const flowAnalysis = result.generatedDocuments.find(doc => doc.type === 'Complex-Flow-Analysis');

    return {
      content: [
        {
          type: 'text',
          text: `复杂流程分析文档已生成！

📄 文档路径: ${flowAnalysis?.filePath || 'N/A'}
📊 文档大小: ${flowAnalysis?.content.length || 0} 字符
⏰ 生成时间: ${flowAnalysis?.generatedAt.toISOString() || 'N/A'}`,
        },
      ],
    };
  }

  /**
   * 处理问题诊断生成
   */
  private async handleGenerateProblemDiagnosis(args: any): Promise<any> {
    const { projectName, projectPath, outputDir = './docs' } = args;

    const analyzer = createProjectAnalyzer({
      projectName,
      projectPath,
      outputDir,
      generateAll: false,
    });

    const result = await analyzer.analyzeProject();
    const problemDiagnosis = result.generatedDocuments.find(doc => doc.type === 'Problem-Diagnosis-Solution');

    return {
      content: [
        {
          type: 'text',
          text: `问题诊断文档已生成！

📄 文档路径: ${problemDiagnosis?.filePath || 'N/A'}
📊 文档大小: ${problemDiagnosis?.content.length || 0} 字符
⏰ 生成时间: ${problemDiagnosis?.generatedAt.toISOString() || 'N/A'}`,
        },
      ],
    };
  }

  /**
   * 处理列出已分析项目
   */
  private async handleListAnalyzedProjects(args: any): Promise<any> {
    const projectList = Array.from(this.analyzers.keys()).map(key => {
      const [name, path] = key.split('-', 2);
      return { name, path };
    });

    return {
      content: [
        {
          type: 'text',
          text: `已分析的项目列表:

${projectList.length === 0 ? '暂无已分析的项目' : projectList.map((project, index) => 
  `${index + 1}. ${project.name} (${project.path})`
).join('\n')}`,
        },
      ],
    };
  }

  /**
   * 处理获取分析统计
   */
  private async handleGetAnalysisStatistics(args: any): Promise<any> {
    const { projectName } = args;
    
    const analyzerKey = Array.from(this.analyzers.keys()).find(key => 
      key.startsWith(projectName + '-')
    );

    if (!analyzerKey) {
      throw new Error(`未找到项目: ${projectName}`);
    }

    const analyzer = this.analyzers.get(analyzerKey);
    if (!analyzer) {
      throw new Error(`分析器未找到: ${projectName}`);
    }

    // 这里可以返回缓存的统计信息或重新分析
    return {
      content: [
        {
          type: 'text',
          text: `项目 ${projectName} 的分析统计信息:

📊 分析器类型: ${analyzer.constructor.name}
🔧 分析器状态: 已初始化
📁 缓存状态: 已缓存`,
        },
      ],
    };
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP文档生成器服务器已启动');
  }
}

// 启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new DocumentGeneratorMCPServer();
  server.start().catch(error => {
    console.error('MCP服务器启动失败:', error);
    process.exit(1);
  });
}

export { DocumentGeneratorMCPServer };
