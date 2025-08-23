#!/usr/bin/env node

/**
 * MCP客户端示例
 * 展示如何连接和使用文档生成器MCP服务
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * MCP文档生成器客户端
 */
class DocumentGeneratorMCPClient {
  private client: Client;
  private serverProcess: any;

  constructor() {
    this.client = new Client({
      name: 'document-generator-client',
      version: '1.0.0',
    });
  }

  /**
   * 连接到MCP服务器
   */
  async connect(): Promise<void> {
    // 启动MCP服务器进程
    const serverPath = join(__dirname, 'mcp-server.js');
    console.log('启动MCP服务器:', serverPath);
    
    // 检查服务器文件是否存在
    try {
      const fs = await import('fs/promises');
      await fs.access(serverPath);
    } catch (error) {
      throw new Error(`MCP服务器文件不存在: ${serverPath}`);
    }
    
    this.serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // 创建传输层
    const transport = new StdioClientTransport(this.serverProcess);

    // 连接客户端
    await this.client.connect(transport);
    console.log('✅ 已连接到MCP文档生成器服务器');
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
    }
    console.log('🔌 已断开MCP连接');
  }

  /**
   * 列出可用工具
   */
  async listTools(): Promise<any> {
    const response = await this.client.listTools();
    return response.tools;
  }

  /**
   * 分析项目
   */
  async analyzeProject(params: {
    projectName: string;
    projectPath: string;
    outputDir?: string;
    documentTypes?: string[];
    maxFiles?: number;
    useMock?: boolean;
  }): Promise<any> {
    const response = await this.client.callTool({
      name: 'analyze_project',
      arguments: params,
    });
    return response;
  }

  /**
   * 生成技术总览
   */
  async generateTechnicalOverview(params: {
    projectName: string;
    projectPath: string;
    outputDir?: string;
  }): Promise<any> {
    const response = await this.client.callTool({
      name: 'generate_technical_overview',
      arguments: params,
    });
    return response;
  }

  /**
   * 生成复杂流程分析
   */
  async generateComplexFlowAnalysis(params: {
    projectName: string;
    projectPath: string;
    outputDir?: string;
  }): Promise<any> {
    const response = await this.client.callTool({
      name: 'generate_complex_flow_analysis',
      arguments: params,
    });
    return response;
  }

  /**
   * 生成问题诊断
   */
  async generateProblemDiagnosis(params: {
    projectName: string;
    projectPath: string;
    outputDir?: string;
  }): Promise<any> {
    const response = await this.client.callTool({
      name: 'generate_problem_diagnosis',
      arguments: params,
    });
    return response;
  }

  /**
   * 列出已分析项目
   */
  async listAnalyzedProjects(): Promise<any> {
    const response = await this.client.callTool({
      name: 'list_analyzed_projects',
      arguments: {},
    });
    return response;
  }

  /**
   * 获取分析统计
   */
  async getAnalysisStatistics(projectName: string): Promise<any> {
    const response = await this.client.callTool({
      name: 'get_analysis_statistics',
      arguments: { projectName },
    });
    return response;
  }
}

/**
 * 客户端使用示例
 */
async function runClientExample(): Promise<void> {
  console.log('🚀 MCP文档生成器客户端示例');
  console.log('='.repeat(50));

  const client = new DocumentGeneratorMCPClient();

  try {
    // 连接到服务器
    await client.connect();

    // 列出可用工具
    console.log('\n📋 可用工具列表:');
    const tools = await client.listTools();
    tools.forEach((tool: any, index: number) => {
      console.log(`${index + 1}. ${tool.name}: ${tool.description}`);
    });

    // 示例1: 使用模拟分析器分析项目
    console.log('\n🔍 示例1: 使用模拟分析器分析项目');
    const mockResult = await client.analyzeProject({
      projectName: 'TestProject',
      projectPath: join(__dirname, '..'),
      outputDir: './mcp-output',
      documentTypes: ['technical-overview', 'complex-flow'],
      useMock: true,
    });

    console.log('模拟分析结果:');
    console.log(mockResult.content[0].text);

    // 示例2: 生成技术总览
    console.log('\n📄 示例2: 生成技术总览');
    const overviewResult = await client.generateTechnicalOverview({
      projectName: 'DocGenerator',
      projectPath: join(__dirname, '..'),
      outputDir: './mcp-output',
    });

    console.log('技术总览结果:');
    console.log(overviewResult.content[0].text);

    // 示例3: 列出已分析项目
    console.log('\n📊 示例3: 列出已分析项目');
    const projectsResult = await client.listAnalyzedProjects();
    console.log(projectsResult.content[0].text);

    // 示例4: 获取分析统计
    console.log('\n📈 示例4: 获取分析统计');
    const statsResult = await client.getAnalysisStatistics('TestProject');
    console.log(statsResult.content[0].text);

  } catch (error) {
    console.error('❌ 客户端示例执行失败:', error);
  } finally {
    // 断开连接
    await client.disconnect();
  }
}

/**
 * 集成到Claude Code SDK的示例
 */
async function integrateWithClaudeSDK(): Promise<void> {
  console.log('\n🤖 Claude Code SDK集成示例');
  console.log('='.repeat(50));

  try {
    // 这里可以集成到Claude Code SDK中
    // 通过MCP协议调用文档生成器服务
    
    console.log('✅ MCP服务已准备好与Claude Code SDK集成');
    console.log('📝 使用方式:');
    console.log('1. 在Claude Code配置中添加MCP服务器');
    console.log('2. 通过工具调用使用文档生成功能');
    console.log('3. 获取生成的技术文档');
    
  } catch (error) {
    console.error('❌ SDK集成失败:', error);
  }
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runClientExample()
    .then(() => integrateWithClaudeSDK())
    .then(() => {
      console.log('\n🎉 MCP客户端示例完成！');
      console.log('\n📚 使用说明:');
      console.log('- 启动MCP服务器: node src/mcp-server.js');
      console.log('- 运行客户端示例: node src/mcp-client.js');
      console.log('- 集成到其他应用: 使用DocumentGeneratorMCPClient类');
    })
    .catch(error => {
      console.error('💥 示例执行失败:', error);
      process.exit(1);
    });
}

export { DocumentGeneratorMCPClient };
