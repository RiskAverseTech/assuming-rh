#!/usr/bin/env node
// Validate every theorem file: JSON Schema plus cross-field rules.
// Usage: node scripts/validate.mjs [directory]
import path from 'node:path';
import { validateDir, loadProofStatus, ROOT, THEOREM_DIR } from './lib.mjs';

const dir = process.argv[2] ? path.resolve(process.argv[2]) : THEOREM_DIR;
const { entries, problems, fileCount } = validateDir(dir);

let metaErrors = [];
if (dir === THEOREM_DIR) {
  try {
    const p = loadProofStatus();
    for (const key of ['status', 'headline', 'summary', 'last_updated', 'claims', 'sources']) {
      if (p[key] === undefined || p[key] === null) metaErrors.push(`proof-status.yaml: missing "${key}"`);
    }
    if (p.last_updated && !/^\d{4}-\d{2}-\d{2}$/.test(p.last_updated)) {
      metaErrors.push('proof-status.yaml: last_updated must be YYYY-MM-DD');
    }
  } catch (err) {
    metaErrors.push(`proof-status.yaml: ${err.message}`);
  }
}

for (const { file, errors } of problems) {
  console.error(`\n${path.relative(ROOT, file)}`);
  for (const e of errors) console.error(`  - ${e}`);
}
for (const e of metaErrors) console.error(`\n${e}`);

if (problems.length || metaErrors.length) {
  console.error(`\nFAILED: ${problems.length} of ${fileCount} files have problems.`);
  process.exit(1);
}
if (fileCount === 0) {
  console.error('FAILED: no theorem files found.');
  process.exit(1);
}
console.log(`OK: ${entries.length} entries valid.`);
