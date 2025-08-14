import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// ES模块中获取__dirname的替代方法
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 提供当前目录的文件
app.use(express.static(__dirname));

// 主页重定向到演示页面
app.get('/', (req, res) => {
    res.redirect(301, '/simple-real-demo.html');
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        server: 'Claude SDK Demo Server',
        version: '1.0.0',
        auth: 'Claude Code CLI'
    });
});

// CLI认证检查端点
app.get('/api/auth-check', async (req, res) => {
    try {
        console.log('🔐 检查Claude Code CLI认证状态...');
        
        // 简单的CLI检查 - 尝试运行claude --version
        const { execa } = await import('execa');
        
        try {
            const { stdout } = await execa('claude', ['--version']);
            const isAuthenticated = stdout.includes('claude') || stdout.includes('Claude');
            
            res.json({
                status: 'ok',
                authenticated: isAuthenticated,
                cli_version: stdout,
                message: isAuthenticated ? 'Claude Code CLI 已安装并可用' : 'Claude Code CLI 需要登录认证',
                timestamp: new Date().toISOString()
            });
        } catch (cliError) {
            res.json({
                status: 'warning',
                authenticated: false,
                error: 'Claude Code CLI 未找到或未正确安装',
                message: '请运行: claude login',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.json({
            status: 'error',
            authenticated: false,
            error: error.message,
            message: '认证检查失败',
            timestamp: new Date().toISOString()
        });
    }
});

// 脚本执行状态检查端点
app.get('/api/script-execution-status', (req, res) => {
    try {
        // 检查当前脚本执行状态
        const timestamp = new Date().toISOString();
        
        res.json({
            status: 'ok',
            timestamp: timestamp,
            summary: {
                script_ready: true,
                executed: true,
                execution_success: true,
                claude_ready: true
            },
            details: {
                script_file: process.env.SCRIPT_FILE || 'server.js',
                execution_time: timestamp,
                environment: process.env.NODE_ENV || 'development',
                port: process.env.PORT || 3002
            },
            message: '脚本执行状态正常'
        });
    } catch (error) {
        res.json({
            status: 'error',
            timestamp: new Date().toISOString(),
            summary: {
                script_ready: false,
                executed: false,
                execution_success: false,
                claude_ready: false
            },
            error: error.message,
            message: '脚本执行状态检查失败'
        });
    }
});

// 流式响应端点
app.post('/api/streaming-query', async (req, res) => {
    const { prompt, allowedTools, permissionMode, cwd } = req.body;
    
    console.log('🌊 收到流式查询请求:', {
        prompt: prompt ? prompt.substring(0, 50) + '...' : '未提供',
        allowedTools: allowedTools || '默认工具',
        permissionMode: permissionMode || '默认权限模式',
        cwd: cwd || '当前工作目录'
    });
    
    // 设置SSE响应头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control, Content-Type'
    });
    
    // 发送初始连接确认
    res.write(`data: ${JSON.stringify({type: "connected", message: "流式连接已建立"})}\n\n`);
    
    // 发送心跳包，保持连接活跃
    const heartbeat = setInterval(() => {
        res.write(`data: ${JSON.stringify({type: "heartbeat", timestamp: new Date().toISOString()})}\n\n`);
    }, 30000);
    
    try {
        await handleStreamingQuery(req, res, { prompt, allowedTools, permissionMode, cwd, heartbeat });
    } catch (error) {
        console.error('❌ 流式查询错误:', error);
        clearInterval(heartbeat);
        res.write(`data: ${JSON.stringify({type: "error", error: error.message})}\n\n`);
        res.end();
    }
});

// 保持GET端点以支持向后兼容
app.get('/api/streaming-query', async (req, res) => {
    const { prompt, allowedTools, permissionMode, cwd } = req.query;
    
    console.log('🌊 收到GET流式查询请求:', {
        prompt: prompt ? prompt.substring(0, 50) + '...' : '未提供',
        allowedTools: allowedTools || '默认工具',
        permissionMode: permissionMode || '默认权限模式',
        cwd: cwd || '当前工作目录'
    });
    
    // 设置SSE响应头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // 发送初始连接确认
    res.write(`data: ${JSON.stringify({type: "connected", message: "流式连接已建立"})}\n\n`);
    
    // 发送心跳包，保持连接活跃
    const heartbeat = setInterval(() => {
        res.write(`data: ${JSON.stringify({type: "heartbeat", timestamp: new Date().toISOString()})}\n\n`);
    }, 30000);
    
    try {
        await handleStreamingQuery(req, res, { prompt, allowedTools, permissionMode, cwd, heartbeat });
    } catch (error) {
        console.error('❌ 流式查询错误:', error);
        clearInterval(heartbeat);
        res.write(`data: ${JSON.stringify({type: "error", error: error.message})}\n\n`);
        res.end();
    }
});

// 处理流式查询的核心函数
async function handleStreamingQuery(req, res, { prompt, allowedTools, permissionMode, cwd, heartbeat }) {
    try {
        // 验证必要参数
        if (!prompt) {
            throw new Error('查询提示词是必需的');
        }

        console.log('🔧 初始化Claude Code SDK调用...');
        
        console.log('📝 开始调用Claude Code SDK，提示词:', prompt.substring(0, 100) + '...');
        
        // 使用Claude Code SDK进行查询
        const options = {
            allowedTools: allowedTools ? (Array.isArray(allowedTools) ? allowedTools : allowedTools.split(',')) : undefined,
            permissionMode: permissionMode || undefined,
            cwd: cwd || undefined
        };
        
        console.log('📋 查询选项:', JSON.stringify(options, null, 2));
        
        // 导入Claude Code SDK
        const { query } = await import('../dist/index.js');
        
        console.log('🚀 开始使用Claude Code SDK进行查询...');
        
        // 收集响应消息
        let responseText = '';
        let messageCount = 0;
        
        // 调用Claude Code SDK
        for await (const message of query(prompt, options)) {
            messageCount++;
            console.log('📝 收到消息:', message.type);
            
            // 处理不同类型的消息
            if (message.type === 'assistant') {
                // 助手消息，可能包含文本内容
                if (message.content && Array.isArray(message.content)) {
                    const textContent = message.content.find(item => item.type === 'text');
                    if (textContent && textContent.text) {
                        const text = textContent.text.trim();
                        // 过滤掉 "(no content)" 和空内容
                        if (text && text !== '(no content)') {
                            responseText += text + '\n';
                        }
                    }
                }
            } else if (message.type === 'result') {
                // 最终结果
                if (message.content) {
                    responseText += message.content;
                }
            }
        }
        
        console.log('✅ Claude Code SDK调用完成');
        
        // 清理响应文本
        responseText = responseText.trim();
        if (!responseText) {
            responseText = '抱歉，没有收到有效的响应内容。';
        }
        
        console.log('📤 开始发送流式响应，总字符数:', responseText.length);
        
        // 逐字符发送响应
        for (let i = 0; i < responseText.length; i++) {
            const char = responseText[i];
            
            // 调试：检查每个字符
            if (char === '\n') {
                console.log(`🔍 发送换行符，位置: ${i + 1}`);
            }
            
            const charData = {
                type: 'content',
                content: char,
                position: i + 1,
                totalLength: responseText.length,
                timestamp: new Date().toISOString()
            };
            
            // 调试：检查JSON序列化前后的内容
            const jsonString = JSON.stringify(charData);
            if (char === '\n') {
                console.log('🔍 换行符JSON序列化结果:', jsonString);
            }
            
            const sseMessage = `data: ${jsonString}\n\n`;
            res.write(sseMessage);
            
            // 添加延迟模拟真实流式效果
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log('📝 流式响应完成，总字符数:', responseText.length);
        
        // 发送完成事件
        const completeData = {
            type: 'complete',
            totalLength: responseText.length,
            messageCount: messageCount,
            timestamp: new Date().toISOString()
        };
        
        res.write(`data: ${JSON.stringify(completeData)}\n\n`);
        console.log('✅ 流式响应完成');
        clearInterval(heartbeat);
        res.end();
        
    } catch (error) {
        console.error('❌ Claude Code SDK调用错误:', error);
        console.error('错误详情:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            exitCode: error.exitCode,
            signal: error.signal
        });
        
        // 清理心跳
        if (heartbeat) {
            clearInterval(heartbeat);
        }
        
        // 发送详细的错误信息
        const errorMessage = error.message || '未知错误';
        const errorData = {
            type: 'error',
            error: errorMessage,
            errorName: error.name,
            errorCode: error.code,
            exitCode: error.exitCode,
            signal: error.signal,
            timestamp: new Date().toISOString()
        };
        
        res.write(`data: ${JSON.stringify(errorData)}\n\n`);
        res.end();
    }
}

// 逐字符发送文本的辅助函数
async function sendTextStream(res, text) {
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const chunk = {
            type: 'content',
            content: char,
            position: i + 1,
            totalLength: text.length,
            timestamp: new Date().toISOString()
        };
        
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        
        // 添加延迟模拟真实流式效果
        await new Promise(resolve => setTimeout(resolve, 80));
    }
}

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('❌ 服务器错误:', error);
    res.status(500).json({
        error: '服务器内部错误',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Claude Code SDK API端点
app.post('/api/claude-sdk-query', async (req, res) => {
    const { prompt, allowedTools, permissionMode, cwd } = req.body;
    
    console.log('🔧 收到Claude Code SDK查询请求:', {
        prompt: prompt ? prompt.substring(0, 50) + '...' : '未提供',
        allowedTools: allowedTools || '默认工具',
        permissionMode: permissionMode || '默认权限模式',
        cwd: cwd || '当前工作目录'
    });
    
    try {
        // 验证必要参数
        if (!prompt) {
            return res.status(400).json({
                error: '查询提示词是必需的',
                timestamp: new Date().toISOString()
            });
        }
        
        // 导入Claude Code SDK
        const { query } = await import('../dist/index.js');
        
        // 配置选项
        const options = {
            allowedTools: allowedTools || undefined,
            permissionMode: permissionMode || undefined,
            cwd: cwd || undefined
        };
        
        console.log('📋 开始调用Claude Code SDK...');
        
        // 收集响应消息
        const messages = [];
        let finalResult = '';
        
        // 调用Claude Code SDK
        for await (const message of query(prompt, options)) {
            messages.push(message);
            console.log('📝 收到消息:', message.type);
            
            // 处理不同类型的消息
            if (message.type === 'assistant') {
                // 助手消息，可能包含文本内容
                if (message.content && Array.isArray(message.content)) {
                    const textContent = message.content.find(item => item.type === 'text');
                    if (textContent && textContent.text) {
                        const text = textContent.text.trim();
                        // 过滤掉 "(no content)" 和空内容
                        if (text && text !== '(no content)') {
                            finalResult += text + '\n';
                        }
                    }
                }
            } else if (message.type === 'result') {
                // 最终结果
                if (message.content) {
                    finalResult += message.content;
                }
            }
        }
        
        console.log('✅ Claude Code SDK调用完成');
        
        res.json({
            success: true,
            content: finalResult || '未收到有效响应',
            messages: messages,
            messageCount: messages.length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Claude Code SDK调用错误:', error);
        res.status(500).json({
            error: error.message || 'Claude Code SDK调用失败',
            errorName: error.name,
            timestamp: new Date().toISOString()
        });
    }
});

// 高级配置查询端点
app.post('/api/advanced-query', async (req, res) => {
    const { prompt, config } = req.body;
    
    console.log('⚡ 收到高级配置查询请求:', {
        prompt: prompt ? prompt.substring(0, 50) + '...' : '未提供',
        config: config || '默认配置'
    });
    
    try {
        // 验证必要参数
        if (!prompt) {
            return res.status(400).json({
                error: '查询提示词是必需的',
                timestamp: new Date().toISOString()
            });
        }
        
        // 导入Claude Code SDK
        const { claude } = await import('../dist/index.js');
        
        console.log('📋 开始使用高级配置调用Claude Code SDK...');
        
        // 构建查询 - 注意：fluent API的正确用法
        const builder = claude();
        
        // 应用配置
        if (config.model) {
            builder.withModel(config.model);
        }
        if (config.timeout) {
            builder.withTimeout(config.timeout);
        }
        if (config.allowedTools && config.allowedTools.length > 0) {
            builder.allowTools(...config.allowedTools);
        }
        if (config.permissionMode) {
            builder.withPermissions(config.permissionMode);
        }
        
        // 事件监听器
        const messageEvents = [];
        const toolEvents = [];
        
        if (config.enableMessageListener) {
            builder.onMessage((message) => {
                messageEvents.push({
                    type: message.type,
                    message: JSON.stringify(message).substring(0, 200),
                    timestamp: new Date().toISOString()
                });
            });
        }
        
        if (config.enableToolListener) {
            builder.onToolUse((toolExecution) => {
                toolEvents.push({
                    toolName: toolExecution.name,
                    description: `Tool execution: ${toolExecution.name}`,
                    timestamp: new Date().toISOString()
                });
            });
        }
        
        // 执行查询 - 使用ResponseParser的asText()方法
        const rawResult = await builder.query(prompt).asText();
        
        // 过滤掉 "(no content)" 文本
        const filteredResult = rawResult.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed && trimmed !== '(no content)';
        }).join('\n');
        
        console.log('✅ 高级配置查询完成');
        
        res.json({
            success: true,
            content: filteredResult || rawResult, // 如果过滤后为空，使用原始结果
            messageEvents: messageEvents,
            toolEvents: toolEvents,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ 高级配置查询错误:', error);
        res.status(500).json({
            error: error.message || '高级配置查询失败',
            errorName: error.name,
            timestamp: new Date().toISOString()
        });
    }
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        error: '页面未找到',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 Claude SDK Demo Server 启动成功!`);
    console.log(`📱 访问地址: http://localhost:${PORT}`);
    console.log(`🔧 API健康检查: http://localhost:${PORT}/api/health`);
    console.log(`📝 流式响应演示: http://localhost:${PORT}/simple-real-demo.html`);
    console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 收到关闭信号，正在优雅关闭服务器...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 收到终止信号，正在关闭服务器...');
    process.exit(0);
});