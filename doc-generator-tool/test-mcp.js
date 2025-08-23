#!/usr/bin/env node

/**
 * 简单的MCP测试脚本
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCP() {
  console.log('🧪 测试MCP文档生成器服务');
  console.log('='.repeat(50));

  // 启动MCP服务器
  const serverPath = join(__dirname, 'dist', 'src', 'mcp-server.js');
  console.log('启动服务器:', serverPath);
  
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 测试工具列表
  console.log('\n📋 测试工具列表...');
  const listRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };

  server.stdin.write(JSON.stringify(listRequest) + '\n');
  
  server.stdout.once('data', (data) => {
    const response = JSON.parse(data.toString());
    console.log('✅ 工具列表获取成功');
    console.log('可用工具数量:', response.result.tools.length);
    response.result.tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}: ${tool.description}`);
    });
  });

  // 等待响应
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 测试项目分析
  console.log('\n🔍 测试项目分析...');
  const analyzeRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'analyze_project',
      arguments: {
        projectName: 'TestProject',
        projectPath: '.',
        useMock: true,
        documentTypes: ['technical-overview']
      }
    }
  };

  server.stdin.write(JSON.stringify(analyzeRequest) + '\n');

  server.stdout.once('data', (data) => {
    const output = data.toString();
    // 查找JSON响应
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.trim() && line.startsWith('{')) {
        try {
          const response = JSON.parse(line);
          console.log('✅ 项目分析成功');
          console.log('分析结果:', response.result.content[0].text.substring(0, 200) + '...');
          break;
        } catch (e) {
          // 忽略非JSON行
        }
      }
    }
  });

  // 等待响应
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 测试列出已分析项目
  console.log('\n📊 测试列出已分析项目...');
  const listProjectsRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'list_analyzed_projects',
      arguments: {}
    }
  };

  server.stdin.write(JSON.stringify(listProjectsRequest) + '\n');

  server.stdout.once('data', (data) => {
    const output = data.toString();
    // 查找JSON响应
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.trim() && line.startsWith('{')) {
        try {
          const response = JSON.parse(line);
          console.log('✅ 项目列表获取成功');
          console.log('项目列表:', response.result.content[0].text);
          break;
        } catch (e) {
          // 忽略非JSON行
        }
      }
    }
  });

  // 等待响应
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 关闭服务器
  server.kill();
  console.log('\n🎉 MCP测试完成！');
}

testMCP().catch(console.error);
