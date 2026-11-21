#!/usr/bin/env node
/**
 * Smart SIP Calculator - Local Development Server
 * Serves static web assets over standard HTTP so browser OpenTelemetry calls
 * to http://localhost:4318 work smoothly without browser Mixed-Content blocks.
 *
 * Usage:
 *   node scripts/serve.js
 *   npm start
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
let PORT = parseInt(process.env.PORT || '8080', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function serveFile(req, res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  } else if (reqPath === '/analytics') {
    reqPath = '/analytics.html';
  }

  const safePath = path.normalize(path.join(ROOT_DIR, reqPath));
  if (!safePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      serveFile(req, res, path.join(safePath, 'index.html'));
    } else {
      serveFile(req, res, safePath);
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${PORT} in use, trying ${PORT + 1}...`);
    PORT++;
    server.listen(PORT);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  console.log('\n======================================================');
  console.log('🚀 Smart SIP Calculator - Local Dev & Telemetry Server');
  console.log(`🌐 Calculator:  http://localhost:${PORT}`);
  console.log(`📊 Analytics:   http://localhost:${PORT}/analytics.html`);
  console.log('📈 Grafana UI:  http://localhost:3000 (admin / admin)');
  console.log('🎯 OTel Target: http://localhost:4318 (HTTP OTLP)');
  console.log('======================================================\n');
  console.log('💡 Note: Running over http:// allows direct browser OTel telemetry');
  console.log('   to reach Grafana LGTM without Mixed-Content restrictions.\n');
});
