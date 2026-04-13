import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '4173', 10);
const API_TARGET = process.env.API_TARGET || 'http://localhost:5001';

const indexHtmlPath = path.join(__dirname, 'index.html');

const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js' || ext === '.mjs') return 'application/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.ico') return 'image/x-icon';
  return 'application/octet-stream';
};

const pipeRequestToTarget = (req, res) => {
  const targetUrl = new URL(API_TARGET);
  const isHttps = targetUrl.protocol === 'https:';
  const requestFn = isHttps ? https.request : http.request;

  const upstreamPath = req.url || '/';
  const options = {
    protocol: targetUrl.protocol,
    hostname: targetUrl.hostname,
    port: targetUrl.port || (isHttps ? 443 : 80),
    method: req.method,
    path: upstreamPath,
    headers: {
      ...req.headers,
      host: targetUrl.host,
    },
  };

  const upstreamReq = requestFn(options, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });

  upstreamReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, message: 'Upstream request failed', error: err.message }));
  });

  req.pipe(upstreamReq);
};

const serveFile = (filePath, res) => {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) throw new Error('Not a file');
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
};

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url.startsWith('/api') || url.startsWith('/uploads')) {
    return pipeRequestToTarget(req, res);
  }

  if (url.startsWith('/dist/')) {
    const filePath = path.join(__dirname, url);
    return serveFile(filePath, res);
  }

  return serveFile(indexHtmlPath, res);
});

server.listen(PORT, () => {
  console.log(`Preview server: http://localhost:${PORT}`);
  console.log(`API proxy:      ${API_TARGET}  (set API_TARGET to change)`);
});
