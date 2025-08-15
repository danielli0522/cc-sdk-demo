import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT || 3000;

// MIME types mapping
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.md': 'text/markdown',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Parse URL
  const parsedUrl = url.parse(req.url);
  let pathname = `.${parsedUrl.pathname}`;
  
  // Health check endpoint
  if (pathname === './health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Claude Code Doc Generator',
      version: '1.0.0'
    }));
    return;
  }
  
  // Default to index.html for root path (doc generator homepage)
  if (pathname === './') {
    pathname = './index.html';
  }
  
  // Security: prevent directory traversal
  const safeSuffix = pathname.replace(/^(\.)+/, '.');
  const safeJoin = path.normalize(safeSuffix);
  
  fs.exists(safeJoin, (exist) => {
    if (!exist) {
      // If file doesn't exist, try to serve index.html for SPA routing
      fs.readFile('./index.html', (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end('404 Not Found');
        } else {
          res.setHeader('Content-Type', 'text/html');
          res.end(data);
        }
      });
      return;
    }
    
    // Check if path is a directory
    fs.stat(safeJoin, (err, stat) => {
      if (err) {
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      
      if (stat.isDirectory()) {
        // Try to serve index.html from directory
        const indexPath = path.join(safeJoin, 'index.html');
        fs.exists(indexPath, (exist) => {
          if (exist) {
            fs.readFile(indexPath, (err, data) => {
              if (err) {
                res.statusCode = 500;
                res.end('Internal Server Error');
              } else {
                res.setHeader('Content-Type', 'text/html');
                res.end(data);
              }
            });
          } else {
            // List directory contents
            fs.readdir(safeJoin, (err, files) => {
              if (err) {
                res.statusCode = 500;
                res.end('Internal Server Error');
                return;
              }
              
              const fileList = files.map(file => {
                return `<li><a href="${path.join(pathname, file).replace('./', '/')}">${file}</a></li>`;
              }).join('');
              
              const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Directory: ${pathname}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; }
                        h1 { color: #333; }
                        ul { list-style-type: none; padding: 0; }
                        li { margin: 10px 0; }
                        a { text-decoration: none; color: #007bff; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <h1>Directory: ${pathname}</h1>
                    <ul>${fileList}</ul>
                </body>
                </html>
              `;
              
              res.setHeader('Content-Type', 'text/html');
              res.end(html);
            });
          }
        });
        return;
      }
      
      // Serve file
      fs.readFile(safeJoin, (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        } else {
          const ext = path.parse(safeJoin).ext;
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          res.setHeader('Content-Type', contentType);
          res.end(data);
        }
      });
    });
  });
});

server.listen(port, () => {
  console.log(`🚀 Claude Code 文档生成器服务器启动成功!`);
  console.log(`📱 访问地址: http://localhost:${port}`);
  console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⏹️  收到终止信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已安全关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⏹️  收到中断信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已安全关闭');
    process.exit(0);
  });
});