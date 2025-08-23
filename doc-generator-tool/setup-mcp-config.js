#!/usr/bin/env node

/**
 * MCP配置设置脚本
 * 自动生成正确的绝对路径配置
 */

import { writeFileSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupMCPConfig() {
  console.log('🔧 设置MCP配置文件');
  console.log('='.repeat(40));

  // 获取项目根目录的绝对路径
  const projectRoot = resolve(__dirname);
  const mcpServerPath = join(projectRoot, 'dist', 'src', 'mcp-server.js');
  
  console.log('📁 项目根目录:', projectRoot);
  console.log('🚀 MCP服务器路径:', mcpServerPath);

  // 读取模板配置
  const templatePath = join(__dirname, 'mcp-config-template.json');
  let config;
  
  try {
    const templateContent = readFileSync(templatePath, 'utf-8');
    config = JSON.parse(templateContent);
  } catch (error) {
    console.error('❌ 无法读取配置模板:', error.message);
    process.exit(1);
  }

  // 替换路径占位符
  config.mcpServers['document-generator'].args[0] = mcpServerPath;

  // 写入配置文件
  const configPath = join(__dirname, 'mcp-config.json');
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('✅ MCP配置文件已生成:', configPath);
  } catch (error) {
    console.error('❌ 无法写入配置文件:', error.message);
    process.exit(1);
  }

  // 验证文件是否存在
  const fs = await import('fs');
  if (fs.existsSync(mcpServerPath)) {
    console.log('✅ MCP服务器文件存在');
  } else {
    console.log('⚠️  MCP服务器文件不存在，请先运行: npm run build');
  }

  console.log('\n📋 配置内容:');
  console.log(JSON.stringify(config, null, 2));

  console.log('\n🎯 使用说明:');
  console.log('1. 将此配置文件复制到Claude Code的配置目录');
  console.log('2. 重启Claude Code');
  console.log('3. 在Claude Code中使用文档生成功能');
}

setupMCPConfig().catch(console.error);

