#!/usr/bin/env node

/**
 * 测试脚本 - 验证 Claude CLI Raw mode 错误修复
 */

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testClaudeCliDirectly() {
    console.log('🧪 测试 Claude CLI 是否可用...');
    
    return new Promise((resolve, reject) => {
        // 测试非交互式调用
        const claude = spawn('claude', ['--version'], {
            stdio: ['pipe', 'pipe', 'pipe'], // 显式设置 stdio
            shell: true
        });
        
        let stdout = '';
        let stderr = '';
        
        claude.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        claude.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        claude.on('close', (code) => {
            console.log(`📊 Claude CLI 退出码: ${code}`);
            console.log(`📝 输出: ${stdout}`);
            if (stderr) {
                console.log(`❌ 错误: ${stderr}`);
            }
            
            if (code === 0) {
                resolve({ success: true, output: stdout });
            } else {
                reject(new Error(`Claude CLI failed with code ${code}: ${stderr}`));
            }
        });
        
        claude.on('error', (err) => {
            console.log(`💥 启动 Claude CLI 失败: ${err.message}`);
            reject(err);
        });
    });
}

async function testSimpleQuery() {
    console.log('🚀 测试简单的 Claude 查询...');
    
    return new Promise((resolve, reject) => {
        // 测试简单查询，避免交互式输入
        const claude = spawn('claude', [
            'Say hello', 
            '--no-input', // 尝试禁用输入
            '--no-confirm' // 尝试禁用确认
        ], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            env: {
                ...process.env,
                NODE_ENV: 'test',
                ANTHROPIC_NO_TTY: '1' // 设置环境变量避免 TTY 检测
            }
        });
        
        let stdout = '';
        let stderr = '';
        
        claude.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        claude.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        claude.on('close', (code) => {
            console.log(`📊 查询退出码: ${code}`);
            console.log(`📝 响应: ${stdout}`);
            if (stderr) {
                console.log(`⚠️  警告/错误: ${stderr}`);
            }
            
            if (code === 0) {
                resolve({ success: true, output: stdout });
            } else {
                reject(new Error(`Claude query failed with code ${code}: ${stderr}`));
            }
        });
        
        claude.on('error', (err) => {
            console.log(`💥 Claude 查询失败: ${err.message}`);
            reject(err);
        });
    });
}

async function testRefactorTool() {
    console.log('🔧 测试重构工具...');
    
    try {
        // 重新构建 TypeScript
        console.log('📦 构建 TypeScript 代码...');
        await new Promise((resolve, reject) => {
            const npm = spawn('npm', ['run', 'build'], {
                cwd: __dirname,
                stdio: 'inherit'
            });
            
            npm.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`Build failed with code ${code}`));
                }
            });
        });
        
        // 测试重构工具
        console.log('🛠️  运行重构工具...');
        return new Promise((resolve, reject) => {
            const refactor = spawn('node', [
                'dist/cli.js',
                '--target', 'test-example.js',
                '--type', 'improve_readability',
                '--auto-confirm'
            ], {
                cwd: __dirname,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    NODE_ENV: 'test',
                    ANTHROPIC_NO_TTY: '1'
                }
            });
            
            let stdout = '';
            let stderr = '';
            
            refactor.stdout.on('data', (data) => {
                const text = data.toString();
                console.log(text);
                stdout += text;
            });
            
            refactor.stderr.on('data', (data) => {
                const text = data.toString();
                console.log(text);
                stderr += text;
            });
            
            refactor.on('close', (code) => {
                console.log(`📊 重构工具退出码: ${code}`);
                
                if (code === 0) {
                    resolve({ success: true, output: stdout });
                } else {
                    // 即使失败也可以继续，记录详细信息
                    console.log('❌ 重构失败，但这可能帮助我们诊断问题');
                    resolve({ success: false, output: stdout, error: stderr });
                }
            });
            
            refactor.on('error', (err) => {
                console.log(`💥 重构工具启动失败: ${err.message}`);
                reject(err);
            });
        });
    } catch (error) {
        console.error('❌ 测试重构工具时出错:', error.message);
        throw error;
    }
}

async function main() {
    console.log('🏁 开始 Claude CLI 诊断测试...\n');
    
    try {
        // 1. 测试 Claude CLI 基本功能
        console.log('=== 步骤 1: 测试 Claude CLI 版本 ===');
        await testClaudeCliDirectly();
        console.log('✅ Claude CLI 基本功能正常\n');
        
        // 2. 测试简单查询
        console.log('=== 步骤 2: 测试简单查询 ===');
        try {
            await testSimpleQuery();
            console.log('✅ 简单查询测试通过\n');
        } catch (error) {
            console.log(`⚠️  简单查询失败: ${error.message}\n`);
        }
        
        // 3. 测试重构工具
        console.log('=== 步骤 3: 测试重构工具 ===');
        const refactorResult = await testRefactorTool();
        
        if (refactorResult.success) {
            console.log('✅ 重构工具测试通过');
        } else {
            console.log('⚠️  重构工具测试未完全成功，但已收集诊断信息');
        }
        
        console.log('\n🎉 测试完成！');
        
    } catch (error) {
        console.error(`💥 测试失败: ${error.message}`);
        console.error('堆栈跟踪:', error.stack);
        process.exit(1);
    }
}

// 运行测试
main();

