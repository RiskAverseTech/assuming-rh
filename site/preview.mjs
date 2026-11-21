#!/usr/bin/env node
// Minimal local preview server for dist/. No dependencies.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../scripts/lib.mjs';

const OUT = path.join(ROOT, 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.csv': 'text/csv', '.woff2': 'font/woff2' };
const port = Number(process.env.PORT) || 4321;
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(OUT, path.normalize(p));
  if (!file.startsWith(OUT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`Preview at http://127.0.0.1:${port}/`));
