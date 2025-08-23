#!/usr/bin/env npx tsx

/**
 * Claude Code SDK集成示例
 * 展示如何在Claude Code中使用MCP文档生成器服务
 */

import { claude } from '@instantlyeasy/claude-code-sdk-ts';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 示例1: 基础MCP集成
 */
async function basicMCPIntegration(): Promise<void> {
  console.log('🔧 示例1: 基础MCP集成');
  console.log('='.repeat(40));

  try {
    // 配置MCP服务器
    const response = await claude()
      .withMCP({
        command: 'node',
        args: [join(__dirname, '..', 'src', 'mcp-server.js')],
        env: { NODE_ENV: 'production' }
      })
      .allowTools('Read', 'Write', 'LS', 'Grep')
      .query(`
请分析当前项目并生成技术总览文档。
项目名称: ClaudeCodeDemo
项目路径: ${join(__dirname, '..')}
输出目录: ./claude-output
      `)
      .asText();

    console.log('✅ MCP集成成功！');
    console.log('📄 生成的文档:', response.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ MCP集成失败:', error);
  }
}

/**
 * 示例2: 高级MCP配置
 */
async function advancedMCPIntegration(): Promise<void> {
  console.log('\n🚀 示例2: 高级MCP配置');
  console.log('='.repeat(40));

  try {
    // 使用配置文件
    const response = await claude()
      .query(`
请执行以下操作：
1. 分析项目结构
2. 生成复杂流程分析文档
3. 生成问题诊断报告
4. 列出所有已分析的项目

项目信息：
- 名称: AdvancedDemo
- 路径: ${join(__dirname, '..')}
- 输出: ./advanced-output
- 文档类型: 全部
      `)
      .asText();

    console.log('✅ 高级MCP配置成功！');
    console.log('📊 分析结果:', response.substring(0, 300) + '...');

  } catch (error) {
    console.error('❌ 高级MCP配置失败:', error);
  }
}

/**
 * 示例3: 批量文档生成
 */
async function batchDocumentGeneration(): Promise<void> {
  console.log('\n📚 示例3: 批量文档生成');
  console.log('='.repeat(40));

  try {
    const projects = [
      { name: 'ProjectA', path: join(__dirname, '..', 'src') },
      { name: 'ProjectB', path: join(__dirname, '..', 'examples') },
      { name: 'ProjectC', path: join(__dirname, '..', 'test') }
    ];

    for (const project of projects) {
      console.log(`\n🔍 分析项目: ${project.name}`);
      
      const response = await claude()
        .withMCP({
          command: 'node',
          args: [join(__dirname, '..', 'src', 'mcp-server.js')]
        })
        .allowTools('Read', 'Write', 'LS', 'Grep')
        .query(`
请分析项目并生成技术总览文档：
- 项目名称: ${project.name}
- 项目路径: ${project.path}
- 输出目录: ./batch-output/${project.name}
- 使用模拟分析器: true
        `)
        .asText();

      console.log(`✅ ${project.name} 分析完成`);
    }

  } catch (error) {
    console.error('❌ 批量文档生成失败:', error);
  }
}

/**
 * 示例4: 自定义分析配置
 */
async function customAnalysisConfiguration(): Promise<void> {
  console.log('\n⚙️ 示例4: 自定义分析配置');
  console.log('='.repeat(40));

  try {
    const response = await claude()
      .withMCP({
        command: 'node',
        args: [join(__dirname, '..', 'src', 'mcp-server.js')]
      })
      .allowTools('Read', 'Write', 'LS', 'Grep')
      .query(`
请使用以下自定义配置分析项目：

项目配置：
- 名称: CustomConfigDemo
- 路径: ${join(__dirname, '..')}
- 输出目录: ./custom-output
- 最大文件数: 100
- 文档类型: ['technical-overview', 'problem-diagnosis']
- 排除模式: ['node_modules', 'dist', 'test']
- 包含扩展名: ['.ts', '.js', '.md', '.json']

请生成分析报告并说明配置效果。
      `)
      .asText();

    console.log('✅ 自定义配置分析完成！');
    console.log('📋 配置效果:', response.substring(0, 250) + '...');

  } catch (error) {
    console.error('❌ 自定义配置分析失败:', error);
  }
}

/**
 * 示例5: 错误处理和监控
 */
async function errorHandlingAndMonitoring(): Promise<void> {
  console.log('\n🛡️ 示例5: 错误处理和监控');
  console.log('='.repeat(40));

  try {
    // 测试错误处理
    const response = await claude()
      .withMCP({
        command: 'node',
        args: [join(__dirname, '..', 'src', 'mcp-server.js')]
      })
      .allowTools('Read', 'Write', 'LS', 'Grep')
      .onToolUse((tool) => {
        console.log(`🔧 使用工具: ${tool.name}`);
      })
      .query(`
请执行以下操作并监控执行过程：

1. 分析一个不存在的项目路径（测试错误处理）
2. 获取已分析项目的统计信息
3. 列出所有可用的分析工具

请详细报告每个步骤的执行结果和任何错误信息。
      `)
      .asText();

    console.log('✅ 错误处理和监控测试完成！');
    console.log('📊 监控结果:', response.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ 错误处理测试失败:', error);
  }
}

/**
 * 运行所有示例
 */
async function runAllExamples(): Promise<void> {
  console.log('🎯 Claude Code SDK MCP集成示例');
  console.log('='.repeat(50));

  try {
    await basicMCPIntegration();
    await advancedMCPIntegration();
    await batchDocumentGeneration();
    await customAnalysisConfiguration();
    await errorHandlingAndMonitoring();

    console.log('\n🎉 所有MCP集成示例完成！');
    console.log('\n📚 集成要点:');
    console.log('1. 使用 .withMCP() 配置MCP服务器');
    console.log('2. 使用 .allowTools() 授权工具访问');
    console.log('3. 使用 .withMCPServerPermission() 设置权限');
    console.log('4. 使用 .withConfigFile() 加载配置文件');
    console.log('5. 通过自然语言描述调用文档生成功能');

  } catch (error) {
    console.error('💥 示例执行失败:', error);
    process.exit(1);
  }
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
