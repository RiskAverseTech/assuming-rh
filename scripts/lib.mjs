// Shared loading and validation logic for the dataset.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import Ajv from 'ajv';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const THEOREM_DIR = path.join(ROOT, 'data', 'theorems');

export function readYaml(file) {
  // CORE_SCHEMA keeps dates as plain strings.
  return yaml.load(fs.readFileSync(file, 'utf8'), { schema: yaml.CORE_SCHEMA });
}

export function loadTaxonomy() {
  const list = readYaml(path.join(ROOT, 'data', 'meta', 'hypotheses.yaml'));
  // YAML core schema reads yes/no as strings, which is what we want.
  for (const h of list) {
    if (!['yes', 'partial', 'no'].includes(h.covered)) {
      throw new Error(`hypotheses.yaml: bad "covered" value for ${h.code}`);
    }
  }
  return list;
}

export function loadProofStatus() {
  return readYaml(path.join(ROOT, 'data', 'meta', 'proof-status.yaml'));
}

export function listTheoremFiles(dir = THEOREM_DIR) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort()
    .map((f) => path.join(dir, f));
}

let compiled = null;
function schemaValidator() {
  if (!compiled) {
    const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'schema', 'theorem.schema.json'), 'utf8'));
    compiled = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema);
  }
  return compiled;
}

const blank = (s) => s === null || s === undefined || String(s).trim() === '';

/**
 * Validate one parsed entry. Returns a list of error strings.
 * knownIds: set of ids that "related" may point to (null skips that check).
 */
export function validateEntry(entry, fileName, taxonomy, knownIds = null) {
  const errors = [];
  const validate = schemaValidator();
  if (!validate(entry)) {
    for (const e of validate.errors) {
      errors.push(`schema: ${e.instancePath || '/'} ${e.message}${e.params && e.params.allowedValues ? ' (' + e.params.allowedValues.join(', ') + ')' : ''}`);
    }
    return errors; // cross-field checks assume the shape is right
  }
  const covered = Object.fromEntries(taxonomy.map((h) => [h.code, h.covered]));
  const hyps = entry.hypotheses_required;
  const notFully = hyps.filter((h) => covered[h] !== 'yes');

  if (fileName && entry.id !== fileName.replace(/\.yaml$/, '')) {
    errors.push(`id "${entry.id}" does not match file name "${fileName}"`);
  }

  // The rule from the taxonomy: unlocked only if every hypothesis is covered.
  if (entry.status === 'unlocked' && notFully.length > 0) {
    errors.push(`status is "unlocked" but these hypotheses are not covered: ${notFully.join(', ')}`);
  }
  if (entry.status === 'still-conditional' && notFully.length === 0) {
    errors.push('status is "still-conditional" but every listed hypothesis is covered; use "unlocked" or list the missing hypothesis');
  }
  if (entry.status === 'partial') {
    if (notFully.length === 0) {
      errors.push('status is "partial" but every listed hypothesis is covered; use "unlocked"');
    }
    if (blank(entry.status_note)) {
      errors.push('status "partial" needs a status_note saying which part is unlocked');
    }
  }
  if (entry.status === 'proved-otherwise' && blank(entry.status_note)) {
    errors.push('status "proved-otherwise" needs a status_note naming the unconditional proof');
  }
  if (hyps.includes('PLUS-EXTRA') && blank(entry.status_note)) {
    errors.push('PLUS-EXTRA needs a status_note naming the extra assumption');
  }

  // Review state consistency.
  const r = entry.review;
  if (r.state === 'ai-classified' && (!blank(r.checked_by) || !blank(r.checked_on))) {
    errors.push('review.state "ai-classified" must not have checked_by or checked_on');
  }
  if (r.state !== 'ai-classified' && (blank(r.checked_by) || blank(r.checked_on))) {
    errors.push(`review.state "${r.state}" needs checked_by and checked_on`);
  }
  if (r.state === 'lean-verified' && !entry.lean.proved) {
    errors.push('review.state "lean-verified" needs lean.proved: true');
  }
  if (entry.lean.proved && blank(entry.lean.path)) {
    errors.push('lean.proved is true but lean.path is empty');
  }

  if (knownIds && entry.related) {
    for (const id of entry.related) {
      if (id === entry.id) errors.push('related lists the entry itself');
      else if (!knownIds.has(id)) errors.push(`related id "${id}" does not exist`);
    }
  }
  return errors;
}

/** Load and validate a directory. Returns { entries, problems: [{file, errors}] }. */
export function validateDir(dir = THEOREM_DIR) {
  const taxonomy = loadTaxonomy();
  const files = listTheoremFiles(dir);
  const parsed = [];
  const problems = [];
  for (const file of files) {
    try {
      parsed.push({ file, entry: readYaml(file) });
    } catch (err) {
      problems.push({ file, errors: [`YAML parse error: ${err.message.split('\n')[0]}`] });
    }
  }
  const ids = new Set();
  const dupes = new Set();
  for (const { entry } of parsed) {
    if (entry && typeof entry.id === 'string') {
      if (ids.has(entry.id)) dupes.add(entry.id);
      ids.add(entry.id);
    }
  }
  const entries = [];
  for (const { file, entry } of parsed) {
    const errors = validateEntry(entry, path.basename(file), taxonomy, ids);
    if (entry && dupes.has(entry.id)) errors.push(`duplicate id "${entry.id}"`);
    if (errors.length) problems.push({ file, errors });
    else entries.push(entry);
  }
  return { entries, problems, fileCount: files.length };
}
