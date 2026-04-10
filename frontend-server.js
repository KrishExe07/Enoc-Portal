/**
 * Simple HTTP Server for Frontend
 * Serves static files from the /client directory
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// Root directory for serving static files — the /client folder
const STATIC_ROOT = path.join(__dirname, 'client');

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
    // Parse URL
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Remove query string if present
    filePath = filePath.split('?')[0];
    
    // Prevent directory traversal attacks
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    
    // Build absolute path from /client directory
    const absolutePath = path.join(STATIC_ROOT, normalizedPath);
    
    // Ensure the resolved path is within STATIC_ROOT
    if (!absolutePath.startsWith(STATIC_ROOT)) {
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.end('<h1>403 - Forbidden</h1>');
        return;
    }
    
    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    // Read and serve file
    fs.readFile(absolutePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>');
            } else {
                // Server error
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Internal Server Error</h1>');
            }
        } else {
            // Success — add caching headers for assets
            const headers = { 'Content-Type': mimeType };
            if (['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2'].includes(ext)) {
                headers['Cache-Control'] = 'public, max-age=3600'; // 1 hour cache for assets
            }
            res.writeHead(200, headers);
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   🌐 FRONTEND SERVER READY                ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║   URL      : http://localhost:${PORT}         ║`);
    console.log('║   Backend  : http://localhost:5000/api    ║');
    console.log('║   Serving  : /client directory            ║');
    console.log('║   Status   : ✅ Running                    ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log('');
    console.log('💡 If backend is not ready yet, wait a few seconds');
    console.log('📌 Press Ctrl+C to stop the server');
    console.log('');
});
