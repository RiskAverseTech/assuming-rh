#!/usr/bin/env node
// House-style check: no em dashes anywhere in the repo or the built site.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const SKIP = new Set(['node_modules', '.git', 'fonts', 'package-lock.json']);
const TEXT = /\.(md|ya?ml|json|mjs|js|css|html|csv|txt|lean)$|^(LICENSE|LICENSE-DATA|\.gitignore)$/;
const EM_DASH = String.fromCharCode(0x2014);
const hits = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('katex')) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (TEXT.test(name)) {
      fs.readFileSync(full, 'utf8').split('\n').forEach((line, i) => {
        if (line.includes(EM_DASH)) hits.push(`${path.relative(ROOT, full)}:${i + 1}`);
      });
    }
  }
})(ROOT);
if (hits.length) {
  console.error('Em dashes found:\n' + hits.map((h) => '  ' + h).join('\n'));
  process.exit(1);
}
console.log('OK: no em dashes.');
