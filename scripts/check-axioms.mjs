// Reads the output of `lake env lean` on the check files of one project and
// fails unless every expected theorem depends only on Lean's three standard
// axioms. Usage: node scripts/check-axioms.mjs <project> <output file>
import fs from 'node:fs';

const STANDARD = new Set(['propext', 'Classical.choice', 'Quot.sound']);

export function parseAxiomReport(text) {
  const found = new Map();
  const re = /'([^']+)' depends on axioms: \[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(text))) {
    found.set(m[1], m[2].split(',').map((s) => s.trim()).filter(Boolean));
  }
  const none = /'([^']+)' does not depend on any axioms/g;
  while ((m = none.exec(text))) found.set(m[1], []);
  return found;
}

export function checkReport(text, expect) {
  const problems = [];
  const errors = text.split('\n').filter((l) => /^[^\s:]+:\d+:\d+: error|^error/.test(l));
  for (const l of errors) problems.push(`Lean error: ${l}`);
  if (/sorryAx/.test(text)) problems.push('sorryAx appears in the report');
  const found = parseAxiomReport(text);
  for (const name of expect) {
    if (!found.has(name)) { problems.push(`no axiom report for ${name}`); continue; }
    const extra = found.get(name).filter((a) => !STANDARD.has(a));
    if (extra.length) problems.push(`${name} depends on non-standard axioms: ${extra.join(', ')}`);
  }
  return { problems, found };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [project, file] = process.argv.slice(2);
  const manifest = JSON.parse(fs.readFileSync(new URL('../lean/checks.json', import.meta.url), 'utf8'));
  const p = manifest.projects[project];
  if (!p || !file) { console.error('usage: check-axioms.mjs <project> <output file>'); process.exit(2); }
  const { problems, found } = checkReport(fs.readFileSync(file, 'utf8'), p.expect);
  for (const name of p.expect) if (found.has(name)) console.log(`${name}: [${found.get(name).join(', ')}]`);
  if (problems.length) { for (const q of problems) console.error(`FAIL: ${q}`); process.exit(1); }
  console.log(`OK: ${p.expect.length} theorems in ${project} depend only on the three standard axioms.`);
}
