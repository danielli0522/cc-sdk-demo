#!/usr/bin/env node

/**
 * 简单的MCP客户端测试
 * 用于诊断连接问题
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCPConnection() {
  console.log('🔍 开始MCP连接测试...');
  
  try {
    // 检查服务器文件
    const serverPath = join(__dirname, 'dist/src/mcp-server.js');
    console.log('📁 服务器路径:', serverPath);
    
    const fs = await import('fs/promises');
    await fs.access(serverPath);
    console.log('✅ 服务器文件存在');
    
    // 创建客户端
    const client = new Client({
      name: 'test-client',
      version: '1.0.0',
    });
    
    console.log('🔧 启动服务器进程...');
    const serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    console.log('📡 创建传输层...');
    const transport = new StdioClientTransport(serverProcess);
    
    console.log('🔗 连接客户端...');
    await client.connect(transport);
    console.log('✅ 连接成功！');
    
    // 测试工具列表
    console.log('📋 获取工具列表...');
    const response = await client.listTools();
    console.log('✅ 工具列表:', response.tools.length, '个工具');
    
    // 清理
    serverProcess.kill();
    console.log('🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

testMCPConnection();
