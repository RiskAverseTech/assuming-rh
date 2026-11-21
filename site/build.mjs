#!/usr/bin/env node
// Static site generator. Reads data/, writes dist/.
// Every page is plain HTML that reads fine without JavaScript; app.js only
// adds filtering, sorting, search and the theme toggle on top.
// All links are relative, so the site works from any base path or from disk.
import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import { ROOT, validateDir, loadTaxonomy, loadProofStatus } from '../scripts/lib.mjs';

const SITE = path.join(ROOT, 'site');
const OUT = path.join(ROOT, 'dist');
const cfg = JSON.parse(fs.readFileSync(path.join(SITE, 'site.config.json'), 'utf8'));

const { entries, problems } = validateDir();
if (problems.length) {
  console.error('Data is invalid. Run "npm run validate" for details.');
  process.exit(1);
}
const taxonomy = loadTaxonomy();
const hyp = Object.fromEntries(taxonomy.map((h) => [h.code, h]));
const proof = loadProofStatus();
entries.sort((a, b) => a.title.localeCompare(b.title));
const byId = Object.fromEntries(entries.map((e) => [e.id, e]));

// ---------- vocabulary ----------
const STATUS = {
  unlocked: {
    label: 'Unlocked',
    short: 'Unconditional if the claimed proof is accepted.',
    long: 'Every hypothesis this result needs is covered by the claimed proof. It becomes unconditional if, and only if, that proof is accepted.',
  },
  partial: {
    label: 'Partly unlocked',
    short: 'Unlocked in a special case only.',
    long: 'Part of this result is covered by the claimed proof and part is not. The note below says which part.',
  },
  'still-conditional': {
    label: 'Still conditional',
    short: 'Needs a hypothesis the claimed proof does not cover.',
    long: 'This result needs at least one hypothesis that the claimed proof does not cover. It stays conditional.',
  },
  'proved-otherwise': {
    label: 'Proved otherwise',
    short: 'Was conditional, later proved without any Riemann Hypothesis.',
    long: 'This result was first proved under a Riemann Hypothesis and was later proved unconditionally by other means. It does not depend on the claimed proof.',
  },
};
const STATUS_ORDER = ['unlocked', 'partial', 'still-conditional', 'proved-otherwise'];
const REVIEW = {
  'ai-classified': {
    label: 'AI-classified',
    long: 'Classified by an AI system from its reading of the literature. No human expert has checked this entry yet. Treat the status as a draft, not as settled.',
  },
  'human-checked': {
    label: 'Human-checked',
    long: 'A named person has checked the classification against the primary source.',
  },
  'lean-verified': {
    label: 'Lean-verified',
    long: 'The implication from the covered hypotheses to this result has been formalized in Lean and checked by the Lean kernel.',
  },
};
const COVERED = { yes: 'Covered by the claim', partial: 'Covered in a special case only', no: 'Not covered by the claim' };
const FIELD = (f) => f.split('-').map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');

// ---------- helpers ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tex = (src, display) => katex.renderToString(src, { displayMode: display, throwOnError: true, output: 'htmlAndMathml', strict: 'error' });
/** Escape text, rendering $...$ spans as inline math. */
function rich(text) {
  return String(text ?? '').trim().split(/(\$[^$]+\$)/g)
    .map((part) => (part.startsWith('$') && part.endsWith('$') && part.length > 2 ? tex(part.slice(1, -1), false) : esc(part)))
    .join('');
}
const statusBadge = (e) =>
  `<span class="badge status-${e.status}${e.review.state === 'ai-classified' ? ' draft' : ''}">${STATUS[e.status].label}</span>`;
const reviewBadge = (e) => `<span class="badge review-${e.review.state}">${REVIEW[e.review.state].label}</span>`;
const hypChip = (code) => `<span class="chip cov-${hyp[code].covered}" title="${esc(hyp[code].name)}: ${COVERED[hyp[code].covered]}">${code}</span>`;
const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1]} ${y}`;
};
function correctionUrl(e) {
  const q = new URLSearchParams({ template: 'correction.yml', title: `Correction: ${e.title}`, entry: e.id });
  return `${cfg.repo_url}/issues/new?${q}`;
}
function sourceHtml(s) {
  const link = s.doi ? `https://doi.org/${s.doi}` : s.url;
  const title = link ? `<a href="${esc(link)}" rel="noopener">${esc(s.title)}</a>` : esc(s.title);
  const roles = { 'conditional-proof': 'Conditional proof', 'unconditional-proof': 'Unconditional proof', refinement: 'Refinement', survey: 'Survey or reference' };
  return `<li>${s.role ? `<span class="role">${roles[s.role]}</span> ` : ''}${esc(s.authors)} (${s.year}). <cite>${title}</cite>.${s.venue ? ' ' + esc(s.venue) + '.' : ''}${s.doi ? ` <span class="doi">doi:${esc(s.doi)}</span>` : ''}` +
    `<div class="where">${s.hypothesis_location ? 'Hypothesis used at: ' + esc(s.hypothesis_location) : 'Where the hypothesis is invoked: not yet recorded.'}</div></li>`;
}

// ---------- layout ----------
function banner() {
  return `<aside class="banner" role="note" aria-label="Proof status">
  <div class="wrap">
    <strong class="banner-tag">Provisional</strong>
    <p><strong>${esc(proof.headline)}</strong> ${rich(proof.summary)}
    Every "unlocked" label on this site holds only if that proof is accepted.
    <span class="banner-date">Proof status last updated ${fmtDate(proof.last_updated)}.</span>
    <a href="about.html#proof-status">Details</a></p>
  </div>
</aside>`;
}
function page({ file, title, description, body, math = false }) {
  const nav = [['index.html', 'Home'], ['browse.html', 'Browse'], ['about.html', 'Method'], ['data.html', 'Data']];
  const root = file.includes('/') ? '../' : '';
  const fix = (html) => (root ? html.replace(/(href|src|action)="(?!https?:|#|mailto:|\.\.\/)([^"]+)"/g, `$1="${root}$2"`) : html);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}${title === cfg.name ? '' : ' | ' + esc(cfg.name)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(cfg.credit)}">
<meta name="color-scheme" content="light dark">
<script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="stylesheet" href="assets/style.css">
${math ? '<link rel="stylesheet" href="assets/katex/katex.min.css">' : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="index.html">${esc(cfg.name)}</a>
    <nav aria-label="Main">
      ${nav.map(([href, label]) => `<a href="${href}"${href === file ? ' aria-current="page"' : ''}>${label}</a>`).join('\n      ')}
    </nav>
    <button type="button" class="theme-toggle" hidden aria-label="Switch between light and dark theme">Theme</button>
  </div>
</header>
${banner()}
<main id="main" class="wrap">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p>Maintained by ${esc(cfg.credit)}. Data under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, code under the MIT License.
    <a href="${esc(cfg.repo_url)}">Source and corrections on GitHub</a>.</p>
    <p class="muted">No analytics, no trackers, no cookies.</p>
  </div>
</footer>
<script src="assets/app.js" defer></script>
</body>
</html>
`;
  const dest = path.join(OUT, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, fix(html));
}

// ---------- pages ----------
function buildHome() {
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, entries.filter((e) => e.status === s).length]));
  const unchecked = entries.filter((e) => e.review.state === 'ai-classified').length;
  page({
    file: 'index.html',
    title: cfg.name,
    description: cfg.tagline,
    body: `
<section class="hero">
  <h1>${esc(cfg.tagline)}</h1>
  <p class="lede">Mathematicians have a famous unsolved problem called the Riemann Hypothesis. Over more
  than a century they have proved hundreds of results that start with "if the Riemann Hypothesis is true,
  then...". In November 2026 a proof was announced. Computers have checked it. Mathematicians have not yet
  agreed that it is right.</p>
  <p class="lede">This site lists those "if... then" results. For each one it answers a simple question:
  <strong>would the announced proof finish this result, or does it need something more?</strong></p>
  <p>The hypothesis comes in several strengths, and the announced proof covers the two most basic
  versions. Results that need a stronger version stay unproven.
  <a href="about.html#taxonomy">See the versions</a>.</p>
  <div class="trust" role="note" aria-labelledby="trust-h">
    <h2 id="trust-h">Three things to know before you trust anything here</h2>
    <ol>
      <li><strong>The proof might be wrong.</strong> If it is, nothing on this list becomes true because of it.</li>
      <li><strong>An AI wrote every entry, and no expert has checked them yet.</strong> Each entry says so. Treat every label as a draft.</li>
      <li><strong>The list is incomplete.</strong> If a result is not here, that tells you nothing about it.</li>
    </ol>
    <p>If you see a mistake, please tell us. Every entry has a "suggest a correction" link.</p>
  </div>
  <form class="search" action="browse.html" method="get" role="search">
    <label for="q">Search the ${entries.length} entries</label>
    <div class="search-row">
      <input id="q" name="q" type="search" placeholder="primality, Goldbach, class group ..." autocomplete="off">
      <button type="submit">Search</button>
    </div>
    <noscript><p class="muted">Search needs JavaScript. Without it, the <a href="browse.html">browse page</a> lists every entry.</p></noscript>
  </form>
</section>
<section aria-labelledby="counts-h">
  <h2 id="counts-h">Entries by status</h2>
  <ul class="counts">
    ${STATUS_ORDER.map((s) => `<li class="count status-${s}">
      <a href="browse.html?status=${s}"><span class="num">${counts[s]}</span>
      <span class="count-label">${STATUS[s].label}</span>
      <span class="count-desc">${STATUS[s].short}</span></a></li>`).join('\n    ')}
  </ul>
  <p class="muted">${unchecked} of ${entries.length} entries are AI-classified and not yet checked by a human expert.
  <a href="about.html#review-states">What the review states mean</a>.</p>
</section>
<section aria-labelledby="start-h">
  <h2 id="start-h">Where to start</h2>
  <ul class="plain">
    <li><a href="browse.html">Browse all entries</a>, with filters for status, hypothesis, field and review state.</li>
    <li><a href="about.html">Read the method</a>: the hypothesis taxonomy and how entries are classified.</li>
    <li><a href="data.html">Download the dataset</a> as JSON or CSV.</li>
    <li>Found a mistake? Every entry page has a "suggest a correction" link.</li>
  </ul>
</section>`,
  });
}

function buildBrowse() {
  const opt = (v, label) => `<option value="${esc(v)}">${esc(label)}</option>`;
  const fields = [...new Set(entries.map((e) => e.field))].sort();
  const rows = [...entries]
    .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.title.localeCompare(b.title))
    .map((e) => {
      const hay = [e.title, e.statement_plain, e.tags.join(' '), e.sources.map((s) => s.authors + ' ' + s.year).join(' '), e.hypotheses_required.join(' ')].join(' ').toLowerCase();
      return `<tr data-status="${e.status}" data-hyps="${e.hypotheses_required.join(' ')}" data-field="${e.field}" data-review="${e.review.state}" data-search="${esc(hay)}">
      <th scope="row" data-sort="${esc(e.title.toLowerCase())}"><a href="theorems/${e.id}.html">${esc(e.title)}</a></th>
      <td data-sort="${STATUS_ORDER.indexOf(e.status)}">${statusBadge(e)}</td>
      <td data-sort="${esc(e.hypotheses_required.join(' '))}">${e.hypotheses_required.map(hypChip).join(' ')}</td>
      <td data-sort="${e.field}">${FIELD(e.field)}</td>
      <td data-sort="${Object.keys(REVIEW).indexOf(e.review.state)}">${reviewBadge(e)}</td>
    </tr>`;
    }).join('\n    ');
  page({
    file: 'browse.html',
    title: 'Browse',
    description: 'All entries with filters for status, hypothesis, field and review state.',
    body: `
<h1>Browse entries</h1>
<form class="filters" hidden aria-label="Filter entries">
  <div><label for="f-q">Search</label><input id="f-q" type="search" name="q" autocomplete="off"></div>
  <div><label for="f-status">Status</label><select id="f-status" name="status">${opt('', 'Any')}${STATUS_ORDER.map((s) => opt(s, STATUS[s].label)).join('')}</select></div>
  <div><label for="f-hyp">Hypothesis</label><select id="f-hyp" name="hyp">${opt('', 'Any')}${taxonomy.map((h) => opt(h.code, h.code)).join('')}</select></div>
  <div><label for="f-field">Field</label><select id="f-field" name="field">${opt('', 'Any')}${fields.map((f) => opt(f, FIELD(f))).join('')}</select></div>
  <div><label for="f-review">Review state</label><select id="f-review" name="review">${opt('', 'Any')}${Object.keys(REVIEW).map((r) => opt(r, REVIEW[r].label)).join('')}</select></div>
  <div class="filter-actions"><button type="reset">Clear</button></div>
</form>
<p class="result-count" aria-live="polite">${entries.length} entries</p>
<noscript><p class="muted">Filtering and sorting need JavaScript. The full list is below, grouped by status.</p></noscript>
<div class="table-wrap" tabindex="0" role="region" aria-label="Entries">
<table class="entries">
  <thead><tr>
    <th scope="col" data-col="0">Theorem</th>
    <th scope="col" data-col="1">Status</th>
    <th scope="col" data-col="2">Needs</th>
    <th scope="col" data-col="3">Field</th>
    <th scope="col" data-col="4">Review</th>
  </tr></thead>
  <tbody>
    ${rows}
  </tbody>
</table>
</div>
<p class="empty" hidden>No entries match these filters.</p>
<p class="muted legend">A dashed outline on a status means the entry is AI-classified and not yet checked by a human.
Hypothesis codes are explained on the <a href="about.html#taxonomy">method page</a>.</p>`,
  });
}

function whyHtml(e) {
  const notFully = e.hypotheses_required.filter((c) => hyp[c].covered !== 'yes');
  let auto = '';
  if (e.status === 'unlocked') auto = `Every hypothesis listed above (${e.hypotheses_required.join(', ')}) is covered by the claimed proof.`;
  else if (e.status === 'still-conditional') auto = `Not covered by the claimed proof: ${notFully.join(', ')}.`;
  else if (e.status === 'partial') auto = `Not covered in general: ${notFully.join(', ')}.`;
  else auto = `The hypotheses above belong to the earlier conditional proof and are no longer needed.`;
  return `<p>${STATUS[e.status].long}</p><p>${auto}</p>${e.status_note ? `<p class="note"><strong>Note.</strong> ${rich(e.status_note)}</p>` : ''}`;
}

function buildEntry(e) {
  const r = e.review;
  page({
    file: `theorems/${e.id}.html`,
    title: e.title,
    description: e.statement_plain.trim().replace(/\s+/g, ' ').slice(0, 200),
    math: true,
    body: `
<nav class="crumbs" aria-label="Breadcrumb"><a href="browse.html">Browse</a> <span aria-hidden="true">/</span> ${esc(e.title)}</nav>
<article class="entry">
  <header>
    <h1>${esc(e.title)}</h1>
    <p class="badges">${statusBadge(e)} ${reviewBadge(e)} <span class="field">${FIELD(e.field)}</span></p>
    ${r.state === 'ai-classified' ? `<p class="notice"><strong>Not yet human-checked.</strong> ${REVIEW[r.state].long}</p>` : ''}
  </header>

  <section aria-labelledby="h-statement">
    <h2 id="h-statement">Statement</h2>
    <p class="statement">${rich(e.statement_plain)}</p>
    ${e.statement_formal ? `<div class="formal" role="group" aria-label="Formal statement">${tex(e.statement_formal.trim(), true)}</div>` : '<p class="muted">No formal statement recorded yet.</p>'}
  </section>

  <section aria-labelledby="h-hyp">
    <h2 id="h-hyp">What it needs</h2>
    <ul class="hyps">
      ${e.hypotheses_required.map((c) => `<li class="cov-${hyp[c].covered}">
        <div class="hyp-head">${hypChip(c)} <strong>${esc(hyp[c].name)}</strong> <span class="cov-label">${COVERED[hyp[c].covered]}</span></div>
        <p>${esc(hyp[c].plain.trim())}</p>
        ${hyp[c].coverage_note ? `<p class="muted">${esc(hyp[c].coverage_note.trim())}</p>` : ''}
      </li>`).join('\n      ')}
    </ul>
  </section>

  <section aria-labelledby="h-status">
    <h2 id="h-status">Status and why</h2>
    <p>${statusBadge(e)}</p>
    ${whyHtml(e)}
  </section>

  <section aria-labelledby="h-sources">
    <h2 id="h-sources">Sources</h2>
    <ol class="sources">
      ${e.sources.map(sourceHtml).join('\n      ')}
    </ol>
  </section>

  <section aria-labelledby="h-review">
    <h2 id="h-review">Review</h2>
    <dl class="meta">
      <dt>Review state</dt><dd>${reviewBadge(e)} ${REVIEW[r.state].long}</dd>
      <dt>Confidence</dt><dd>${r.confidence}</dd>
      ${r.checked_by ? `<dt>Checked by</dt><dd>${esc(r.checked_by)} on ${fmtDate(r.checked_on)}</dd>` : ''}
      <dt>Lean</dt><dd>${e.lean.proved ? `Formalized: <code>${esc(e.lean.path)}</code>` : 'Not formalized yet.'}</dd>
      <dt>Added</dt><dd>${fmtDate(e.added)}</dd>
    </dl>
    ${r.open_questions.length ? `<h3>Open questions</h3><ul>${r.open_questions.map((q) => `<li>${rich(q)}</li>`).join('')}</ul>` : ''}
    <p><a class="button" href="${esc(correctionUrl(e))}" rel="noopener">Suggest a correction</a></p>
  </section>

  ${(e.related || []).length ? `<section aria-labelledby="h-related"><h2 id="h-related">Related entries</h2><ul>${e.related.map((id) => `<li><a href="theorems/${id}.html">${esc(byId[id].title)}</a> ${statusBadge(byId[id])}</li>`).join('')}</ul></section>` : ''}
  <p class="tags">${e.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join(' ')}</p>
</article>`,
  });
}

function buildAbout() {
  page({
    file: 'about.html',
    title: 'Method',
    description: 'The hypothesis taxonomy, how entries are classified, and the limits of AI classification.',
    body: `
<h1>Method</h1>
<p class="lede">How this dataset decides whether a conditional theorem is unlocked, and how far you should trust each label.</p>

<h2 id="proof-status">The proof this all depends on</h2>
<p><strong>${esc(proof.headline)}</strong> ${rich(proof.summary)}</p>
<dl class="meta">
  <dt>Status</dt><dd>${esc(proof.status)}</dd>
  <dt>Claimed</dt><dd><ul>${proof.claims.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></dd>
  <dt>Last updated</dt><dd>${fmtDate(proof.last_updated)}</dd>
  ${proof.caveats && proof.caveats.length ? `<dt>Caveats</dt><dd><ul>${proof.caveats.map((c) => `<li>${rich(c)}</li>`).join('')}</ul></dd>` : ''}
  <dt>Sources</dt><dd>${proof.sources.length ? `<ul>${proof.sources.map((s) => `<li>${s.url ? `<a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a>` : esc(s.label)}${s.accessed ? ` (accessed ${fmtDate(s.accessed)})` : ''}</li>`).join('')}</ul>` : 'None recorded yet.'}</dd>
</dl>
<p>If the proof is withdrawn or a gap is found, every "unlocked" and "partly unlocked" label on this site reverts to "conditional". Entries marked "proved otherwise" do not depend on it.</p>

<h2 id="meaning">What this does and does not mean</h2>
<ul>
  <li><strong>Checked by a machine is not the same as understood by people.</strong> The proof is reported to
  have been checked step by step by computer. No account of the argument that mathematicians can read,
  follow and explain has been reviewed. Until one has, the result is not accepted, and this site treats it
  as a claim.</li>
  <li><strong>This list depends on the theorem being true, not on the proof being readable.</strong> A result
  that follows from the Riemann Hypothesis follows from it whether or not anyone yet understands why the
  hypothesis holds. That is why a map of consequences can be drawn now, and why it has to stay provisional.</li>
  <li><strong>This site does not judge the proof.</strong> It does not assess, endorse or add evidence for it.
  It records what would follow, and what would not.</li>
  <li><strong>"Unlocked" is a statement about logic.</strong> It says that every hypothesis a result needs is
  among those the proof claims. It does not say the result is now a theorem.</li>
  <li><strong>The site is about the mathematics.</strong> How the proof was found is not its subject. Entries
  drafted by an AI system are labelled as drafts because that is what they are.</li>
</ul>

<h2 id="taxonomy">The hypothesis taxonomy</h2>
<p>Papers say "assuming GRH" loosely. The exact variant decides whether a result is unlocked, so every entry lists its hypotheses with these codes.</p>
<div class="table-wrap" tabindex="0" role="region" aria-label="Hypothesis taxonomy">
<table class="taxonomy">
  <thead><tr><th scope="col">Code</th><th scope="col">Meaning</th><th scope="col">Covered by the claim?</th></tr></thead>
  <tbody>
  ${taxonomy.map((h) => `<tr><th scope="row">${hypChip(h.code)}</th><td><strong>${esc(h.name)}.</strong> ${esc(h.plain.trim())}</td><td><strong>${{ yes: 'Yes', partial: 'Partly', no: 'No' }[h.covered]}.</strong> ${esc((h.coverage_note || '').trim())}</td></tr>`).join('\n  ')}
  </tbody>
</table>
</div>

<h2 id="statuses">Statuses</h2>
<dl class="defs">
  ${STATUS_ORDER.map((s) => `<dt><span class="badge status-${s}">${STATUS[s].label}</span></dt><dd>${STATUS[s].long}</dd>`).join('\n  ')}
</dl>
<p>The rule is mechanical: an entry is "unlocked" only if every hypothesis it lists is fully covered. One uncovered hypothesis makes it "still conditional", or "partly unlocked" when a named special case goes through. The validator in the repository enforces this, so a file cannot claim "unlocked" while listing an uncovered hypothesis.</p>
<p>The special case that matters most: the zeta function of an abelian extension of the rationals (a quadratic or cyclotomic field, for example) is a product of Dirichlet L-functions, so a hypothesis about that zeta function alone is covered. This does not extend to characters of the class group of such a field. Those are Hecke characters, and their L-functions are not covered.</p>

<h2 id="review-states">Review states</h2>
<dl class="defs">
  ${Object.keys(REVIEW).map((r) => `<dt><span class="badge review-${r}">${REVIEW[r].label}</span></dt><dd>${REVIEW[r].long}</dd>`).join('\n  ')}
</dl>

<h2 id="how">How entries are classified</h2>
<ol>
  <li>Find the original paper and the theorem that carries the hypothesis.</li>
  <li>Work out which L-functions the proof really uses, not just the name the paper gives the hypothesis.</li>
  <li>Record every hypothesis with a taxonomy code, cite the source, and note where in the paper the hypothesis is invoked when that is known.</li>
  <li>Derive the status from the codes. Record doubts as open questions on the entry.</li>
  <li>A human checks the entry against the primary source before it moves to "human-checked".</li>
</ol>

<h2 id="limits">Limits of AI classification</h2>
<ul>
  <li>Most entries start as AI drafts. An AI system can misremember a constant, a range, an attribution, or which L-functions a proof needs.</li>
  <li>The hard question is usually hidden: a paper may say "GRH" and use it for Hecke or Dedekind L-functions deep inside a cited lemma. An AI draft can miss that.</li>
  <li>"Where the hypothesis is invoked" is often not yet recorded. Where it is missing, the entry says so.</li>
  <li>Statements are simplified for readability. The cited paper is the authority, never this site.</li>
  <li>An entry being absent means nothing. The dataset is far from complete.</li>
</ul>
<p>If you know one of these results well, please check its entry. Each entry page has a "suggest a correction" link that opens a prefilled GitHub issue.</p>

<h2 id="licence">Licence and credit</h2>
<p>The dataset is released under CC BY 4.0 and the code under the MIT License. Maintained by ${esc(cfg.credit)}.</p>`,
  });
}

function csvCell(v) {
  const s = Array.isArray(v) ? v.join('; ') : v === null || v === undefined ? '' : String(v).trim().replace(/\s+/g, ' ');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function buildData() {
  const dataDir = path.join(OUT, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const bundle = {
    generated_from: 'data/theorems/*.yaml',
    licence: 'CC BY 4.0',
    proof_status: proof,
    hypotheses: taxonomy,
    theorems: entries,
  };
  fs.writeFileSync(path.join(dataDir, 'theorems.json'), JSON.stringify(bundle, null, 2) + '\n');
  const cols = ['id', 'title', 'field', 'status', 'hypotheses_required', 'status_note', 'statement_plain', 'statement_formal', 'review_state', 'confidence', 'checked_by', 'checked_on', 'lean_proved', 'sources', 'tags', 'added'];
  const lines = [cols.join(',')];
  for (const e of entries) {
    const row = {
      ...e,
      review_state: e.review.state, confidence: e.review.confidence, checked_by: e.review.checked_by, checked_on: e.review.checked_on,
      lean_proved: e.lean.proved,
      sources: e.sources.map((s) => `${s.authors} (${s.year}) ${s.title}${s.doi ? ' doi:' + s.doi : ''}`),
    };
    lines.push(cols.map((c) => csvCell(row[c])).join(','));
  }
  fs.writeFileSync(path.join(dataDir, 'theorems.csv'), lines.join('\n') + '\n');
  fs.copyFileSync(path.join(ROOT, 'schema', 'theorem.schema.json'), path.join(dataDir, 'theorem.schema.json'));
  page({
    file: 'data.html',
    title: 'Data',
    description: 'Download the full dataset as JSON or CSV.',
    body: `
<h1>Data</h1>
<p class="lede">The whole dataset is open. The site you are reading is generated from these same files.</p>
<ul class="downloads">
  <li><a href="data/theorems.json" download>theorems.json</a> <span class="muted">all ${entries.length} entries, the hypothesis taxonomy and the proof status</span></li>
  <li><a href="data/theorems.csv" download>theorems.csv</a> <span class="muted">one row per entry, for spreadsheets</span></li>
  <li><a href="data/theorem.schema.json" download>theorem.schema.json</a> <span class="muted">the JSON Schema every entry is validated against</span></li>
</ul>
<h2>Source of truth</h2>
<p>Each theorem lives in one YAML file in the <a href="${esc(cfg.repo_url)}">repository</a> under <code>data/theorems/</code>. To add or fix an entry, open an issue or a pull request there.</p>
<h2>Licence</h2>
<p>The dataset is released under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Please keep the review state with any entry you reuse: an AI-classified label is a draft, and presenting it as settled would mislead your readers.</p>
<h2>Fields</h2>
<dl class="defs">
  <dt><code>hypotheses_required</code></dt><dd>Taxonomy codes for everything the conditional proof needs.</dd>
  <dt><code>status</code></dt><dd><code>unlocked</code>, <code>partial</code>, <code>still-conditional</code> or <code>proved-otherwise</code>.</dd>
  <dt><code>status_note</code></dt><dd>Why, in a sentence or two. Required for partial and proved-otherwise entries.</dd>
  <dt><code>review.state</code></dt><dd><code>ai-classified</code>, <code>human-checked</code> or <code>lean-verified</code>.</dd>
  <dt><code>review.open_questions</code></dt><dd>Known doubts about the entry.</dd>
  <dt><code>sources[].hypothesis_location</code></dt><dd>Where in the paper the hypothesis is invoked, when known.</dd>
</dl>`,
  });
}

// ---------- run ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets', 'katex'), { recursive: true });
for (const f of ['style.css', 'app.js']) fs.copyFileSync(path.join(SITE, 'assets', f), path.join(OUT, 'assets', f));
const kdist = path.join(ROOT, 'node_modules', 'katex', 'dist');
fs.copyFileSync(path.join(kdist, 'katex.min.css'), path.join(OUT, 'assets', 'katex', 'katex.min.css'));
fs.cpSync(path.join(kdist, 'fonts'), path.join(OUT, 'assets', 'katex', 'fonts'), { recursive: true, filter: (src) => !/\.(ttf|woff)$/.test(src) });
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

buildHome();
buildBrowse();
for (const e of entries) {
  try { buildEntry(e); } catch (err) { console.error(`Failed to render ${e.id}: ${err.message}`); process.exit(1); }
}
buildAbout();
buildData();
console.log(`Built ${entries.length} entry pages into dist/`);
