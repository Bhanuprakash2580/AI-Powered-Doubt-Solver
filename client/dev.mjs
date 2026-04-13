import http from 'node:http';
import https from 'node:https';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '5173', 10);
const API_TARGET = process.env.API_TARGET || 'http://localhost:5001';

const distDir = path.join(__dirname, 'dist');
const indexHtmlPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

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

  // Serve index.html for SPA routes
  return serveFile(indexHtmlPath, res);
});

const esbuildExe = (() => {
  if (process.platform === 'win32') {
    const winExe = path.join(__dirname, 'node_modules', '@esbuild', 'win32-x64', 'esbuild.exe');
    if (fs.existsSync(winExe)) return winExe;
  }
  // Fallback: try local npm bin (may be platform-specific)
  return path.join(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild');
})();

const esbuildArgs = [
  'src/main.jsx',
  '--bundle',
  '--format=esm',
  '--sourcemap',
  '--outfile=dist/bundle.js',
  '--conditions=style',
  '--jsx=automatic',
  '--loader:.js=jsx',
  '--loader:.jsx=jsx',
  '--watch=forever',
];

const esbuildProc = spawn(esbuildExe, esbuildArgs, { stdio: 'inherit', shell: false });

esbuildProc.on('exit', (code) => {
  if (code && code !== 0) process.exit(code);
});

const cleanup = () => {
  try {
    if (!esbuildProc.killed) esbuildProc.kill();
  } catch {}
  try {
    server.close();
  } catch {}
};

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('exit', () => {
  cleanup();
});

server.listen(PORT, () => {
  console.log(`Dev server: http://localhost:${PORT}`);
  console.log(`API proxy:  ${API_TARGET}  (set API_TARGET to change)`);
});
