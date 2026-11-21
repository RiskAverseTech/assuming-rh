#!/usr/bin/env node
// Self-test for the validator:
//  1. the real dataset passes;
//  2. every fixture in tests/fixtures/invalid fails with the error named in
//     its first line ("# expect: <text>");
//  3. every fixture in tests/fixtures/valid passes.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, validateDir, validateEntry, readYaml, loadTaxonomy } from './lib.mjs';

let failed = 0;
const ok = (msg) => console.log(`  ok    ${msg}`);
const bad = (msg) => { failed++; console.error(`  FAIL  ${msg}`); };

const real = validateDir();
if (real.problems.length === 0 && real.entries.length > 0) ok(`dataset passes (${real.entries.length} entries)`);
else bad(`dataset has ${real.problems.length} invalid files`);

const taxonomy = loadTaxonomy();
const fx = path.join(ROOT, 'tests', 'fixtures');
for (const kind of ['invalid', 'valid']) {
  const dir = path.join(fx, kind);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.yaml')).sort()) {
    const file = path.join(dir, f);
    const errors = validateEntry(readYaml(file), f, taxonomy, null);
    if (kind === 'valid') {
      errors.length === 0 ? ok(`valid/${f} passes`) : bad(`valid/${f} should pass: ${errors.join('; ')}`);
      continue;
    }
    const m = fs.readFileSync(file, 'utf8').match(/^# expect: (.+)$/m);
    if (!m) { bad(`invalid/${f} has no "# expect:" line`); continue; }
    if (errors.length === 0) bad(`invalid/${f} passed but must fail`);
    else if (!errors.some((e) => e.includes(m[1].trim()))) bad(`invalid/${f} failed for the wrong reason: ${errors.join('; ')}`);
    else ok(`invalid/${f} rejected (${m[1].trim()})`);
  }
}
if (failed) { console.error(`\n${failed} test(s) failed.`); process.exit(1); }
console.log('\nAll validator tests passed.');
