#!/usr/bin/env node
// Static site generator. Reads data/, writes dist/.
// Every page is plain HTML that reads fine without JavaScript; app.js only
// adds filtering, sorting, search and the theme toggle on top.
// All links are relative, so the site works from any base path or from disk.
import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import { ROOT, validateDir, loadTaxonomy, loadProofStatus, loadWaiting } from '../scripts/lib.mjs';
import { problemPage } from './pages/problem.mjs';
import { softwarePage } from './pages/software.mjs';

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
const waiting = loadWaiting();
const waitBy = Object.fromEntries(waiting.map((w) => [w.code, w]));
entries.sort((a, b) => a.title.localeCompare(b.title));
const byId = Object.fromEntries(entries.map((e) => [e.id, e]));
// Second reading by an independent model, used only to rank entries for human checking.
const second = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'meta', 'second-reading.json'), 'utf8'));
const covered = (e) => e.hypotheses_required.every((h) => h === 'RH' || h === 'GRH-Dirichlet');
const checkReason = (e) => {
  const r = second.readings[e.id];
  if (!r || e.review.state !== 'ai-classified') return null;
  if (e.status === 'unlocked' && r.beyond >= 0.5) return 'more';
  if ((e.status === 'still-conditional' || e.status === 'partial') && !e.hypotheses_required.includes('PLUS-EXTRA') && r.dirichlet_only >= 0.7) return 'less';
  if (!e.hypotheses_required.includes('PLUS-EXTRA') && r.extra_assumption >= 0.8) return 'extra';
  return null;
};
function checkUrl(e) {
  const q = new URLSearchParams({ template: 'check.yml', title: `Checked: ${e.title}`, entry: e.id });
  return `${cfg.repo_url}/issues/new?${q}`;
}
// Reverse links, computed at build time.
const usedBy = {};
const referredBy = {};
for (const e of entries) {
  for (const id of e.rests_on || []) (usedBy[id] ||= []).push(e.id);
  for (const id of e.related || []) (referredBy[id] ||= []).push(e.id);
}
const linkList = (list) => `<ul>${list.map((id) => `<li><a href="theorems/${id}.html">${esc(byId[id].title)}</a> ${statusBadge(byId[id])}</li>`).join('')}</ul>`;

// ---------- vocabulary ----------
const STATUS = {
  unlocked: {
    label: 'Unlocked',
    short: 'Follows from the announced proof.',
    long: 'Every hypothesis this result needs is covered by the announced proof. It follows from that proof, and stands or falls with it.',
  },
  partial: {
    label: 'Partly unlocked',
    short: 'Unlocked in a special case only.',
    long: 'Part of this result is covered by the announced proof and part is not. The note below says which part.',
  },
  'still-conditional': {
    label: 'Still conditional',
    short: 'Needs a hypothesis the announced proof does not cover.',
    long: 'This result needs at least one hypothesis that the announced proof does not cover. It stays conditional.',
  },
  'proved-otherwise': {
    label: 'Proved otherwise',
    short: 'Was conditional, later proved without any Riemann Hypothesis.',
    long: 'This result was first proved under a Riemann Hypothesis and was later proved unconditionally by other means. It does not depend on the announced proof.',
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
const authorBadge = (e) => (e.author_submitted ? ' <span class="badge author-sub">Author-submitted, unrefereed</span>' : '');
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
  const roles = { 'conditional-proof': 'Conditional proof', 'unconditional-proof': 'Unconditional proof', refinement: 'Refinement', formalization: 'Formalization', survey: 'Survey or reference' };
  return `<li>${s.role ? `<span class="role">${roles[s.role]}</span> ` : ''}${esc(s.authors)} (${s.year}). <cite>${title}</cite>.${s.venue ? ' ' + esc(s.venue) + '.' : ''}${s.doi ? ` <span class="doi">doi:${esc(s.doi)}</span>` : ''}` +
    `<div class="where">${s.role === 'formalization' ? (s.hypothesis_location ? esc(s.hypothesis_location) : '') : (s.hypothesis_location ? 'Hypothesis used at: ' + esc(s.hypothesis_location) : 'Where the hypothesis is invoked: not yet recorded.')}</div></li>`;
}

// ---------- layout ----------
function banner() {
  return `<aside class="banner" role="note" aria-label="Proof status">
  <div class="wrap">
    <strong class="banner-tag">Provisional</strong>
    <p><strong>${esc(proof.headline)}</strong> ${rich(proof.summary)}
    Every "unlocked" label on this site rests on that proof.
    <span class="banner-date">Proof status last updated ${fmtDate(proof.last_updated)}.</span>
    <a href="about.html#proof-status">Details</a></p>
  </div>
</aside>`;
}
function page({ file, title, description, body, math = false }) {
  const nav = [['index.html', 'Home'], ['problem.html', 'The problem'], ['browse.html', 'Browse'], ['waiting.html', 'Still waiting'], ['about.html', 'Method'], ['check.html', 'Help check'], ['data.html', 'Data']];
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
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(cfg.name)}">
<meta property="og:title" content="${esc(title === cfg.name ? cfg.name + ': ' + cfg.tagline : title + ' | ' + cfg.name)}">
<meta property="og:description" content="${esc(file === 'index.html' ? cfg.share_description : description)}">
<meta property="og:url" content="${esc(cfg.site_url + (file === 'index.html' ? '' : file))}">
<meta property="og:image" content="${esc(cfg.site_url)}assets/preview-card.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Assuming RH: what would a proof of the Riemann Hypothesis settle? A map of the theorems that depend on it, and the ones that need more.">
<meta name="twitter:card" content="summary_large_image">
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
  const counted = entries.filter((e) => !e.author_submitted);
  const authorSub = entries.length - counted.length;
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, counted.filter((e) => e.status === s).length]));
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
  then...". In November 2026 a proof was announced, written so that computers can check it. The
  check has been done and certified. Mathematicians have not yet read and understood the argument.</p>
  <p class="lede">This site lists those "if... then" results. For each one it answers a simple question:
  <strong>would the announced proof finish this result, or does it need something more?</strong></p>
  <p>The hypothesis comes in several strengths, and the announced proof covers the two most basic
  versions. Results that need a stronger version stay unproven.
  <a href="about.html#taxonomy">See the versions</a>.</p>
  <div class="trust" role="note" aria-labelledby="trust-h">
    <h2 id="trust-h">Three things to know before you trust anything here</h2>
    <ol>
      <li><strong>The proof is verified by computer, not yet understood by people.</strong> If a problem is ever found, nothing on this list becomes true because of it.</li>
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
  ${authorSub ? `<p class="muted">${authorSub} more ${authorSub === 1 ? 'entry is an unrefereed result' : 'entries are unrefereed results'} submitted by ${authorSub === 1 ? 'its author' : 'their authors'}. ${authorSub === 1 ? 'It is' : 'They are'} labeled and not included in the counts above. <a href="about.html#author-submitted">What that means</a>.</p>` : ''}
  <p class="muted">${unchecked} of ${entries.length} entries are AI-classified and not yet checked by a human expert.
  <a href="about.html#review-states">What the review states mean</a>.</p>
</section>
<section aria-labelledby="known-h">
  <h2 id="known-h">Some well-known results at a glance</h2>
  <ul class="known">
    ${(cfg.highlights || []).filter((id) => byId[id]).map((id) => { const e = byId[id]; const st = e.statement_plain.trim().replace(/\s+/g, ' '); const cut = st.length > 150 ? st.slice(0, st.lastIndexOf(' ', 150)) + ' ...' : st; return `<li class="status-${e.status}"><a href="theorems/${e.id}.html"><span class="known-title">${esc(e.title)}</span><span class="known-st">${esc(cut)}</span></a><span class="known-badge">${statusBadge(e)}</span></li>`; }).join('\n    ')}
  </ul>
  <p class="muted">A small selection. <a href="browse.html">Browse all ${entries.length} entries</a> or see <a href="waiting.html">what is still waiting</a>.</p>
</section>
<section aria-labelledby="start-h">
  <h2 id="start-h">Where to start</h2>
  <ul class="plain">
    <li><a href="browse.html">Browse all entries</a>, with filters for status, hypothesis, field and review state.</li>
    <li><a href="problem.html">Read about the problem</a>: the statement, what was tried before, and what the announced proof reports doing.</li>
    <li><a href="waiting.html">See what is still waiting</a>, grouped by what would have to be proved next.</li>
    <li><a href="software.html">Software caveats</a>: whether "correct assuming GRH" in a computer algebra system can now be dropped.</li>
    <li><a href="connections.html">See which results carry the most others</a>.</li>
    <li><a href="about.html">Read the method</a>: the hypothesis taxonomy and how entries are classified.</li>
    <li><a href="data.html">Download the dataset</a> as JSON or CSV.</li>
    <li><a href="check.html">Help check</a>: the entries most worth an expert's ten minutes, and how to report what you find.</li>
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
      <td data-sort="${STATUS_ORDER.indexOf(e.status)}">${statusBadge(e)}${authorBadge(e)}</td>
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
  if (e.status === 'unlocked') auto = `Every hypothesis listed above (${e.hypotheses_required.join(', ')}) is covered by the announced proof.`;
  else if (e.status === 'still-conditional') auto = `Not covered by the announced proof: ${notFully.join(', ')}.`;
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
    <p class="badges">${statusBadge(e)} ${reviewBadge(e)}${authorBadge(e)} <span class="field">${FIELD(e.field)}</span></p>
    ${e.author_submitted ? `<p class="notice"><strong>Submitted by its author and not refereed.</strong> This result was contributed by ${esc(e.author_submitted.by)}, an author of the source cited below. The source has not been through peer review, and nobody independent has checked it for this site. It is not included in the site's headline counts.${e.author_submitted.note ? ' ' + esc(e.author_submitted.note) : ''}</p>` : ''}
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
    ${e.waiting_on ? `<p><strong>Waiting on:</strong> ${e.waiting_on.map((w) => `<a href="waiting.html#${w}">${esc(waitBy[w].name)}</a>`).join('; ')}.</p>` : ''}
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
    ${checkReason(e) ? `<p class="muted">A second automated reading of the paper disagreed with this classification, so this entry is on the list to <a href="check.html">check first</a>.</p>` : ''}
    <p><a class="button" href="${esc(correctionUrl(e))}" rel="noopener">Suggest a correction</a> <a class="button" href="${esc(checkUrl(e))}" rel="noopener">I checked this entry</a></p>
  </section>

  ${(() => {
    const rests = e.rests_on || [];
    const used = usedBy[e.id] || [];
    const rel = [...new Set([...(e.related || []), ...(referredBy[e.id] || [])])].filter((id) => !rests.includes(id) && !used.includes(id)).sort((x, y) => byId[x].title.localeCompare(byId[y].title));
    if (!rests.length && !used.length && !rel.length) return '';
    return `<section aria-labelledby="h-related"><h2 id="h-related">Connections</h2>
    ${rests.length ? `<h3>Rests on</h3><p class="muted">The proof uses these results as ingredients.</p>${linkList(rests)}` : ''}
    ${used.length ? `<h3>Used by</h3><p class="muted">These entries use this result as an ingredient.</p>${linkList(used)}` : ''}
    ${rel.length ? `<h3>Related entries</h3>${linkList(rel)}` : ''}
    </section>`;
  })()}
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
  <li><strong>Checked by a machine is not the same as understood by people.</strong> The formal proof has been
  verified, and that verification certified by the Lean community. No account of the argument that mathematicians can read,
  follow and explain has been reviewed. Until one has, this site says
  "verified", not "understood".</li>
  <li><strong>This list depends on the theorem being true, not on the proof being readable.</strong> A result
  that follows from the Riemann Hypothesis follows from it whether or not anyone yet understands why the
  hypothesis holds. That is why a map of consequences can be drawn now, and why it has to stay provisional.</li>
  <li><strong>This site does not judge the proof.</strong> It does not assess, endorse or add evidence for it.
  It records what would follow, and what would not.</li>
  <li><strong>"Unlocked" is a statement about logic.</strong> It says that every hypothesis a result needs is
  among those the proof claims. It does not say the result is now a theorem.</li>
  <li><strong>The site is about the mathematics.</strong> How the proof was found is not its subject. Entries
  drafted by an AI system are labeled as drafts because that is what they are.</li>
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

<h2 id="author-submitted">Results submitted by their authors</h2>
<p>Most entries cite a refereed paper or an arXiv preprint by someone other than the person who added the entry. Sometimes an author contributes their own new result, with a source that has not been refereed. Those entries are welcome, and they are kept apart:</p>
<ul>
  <li>They carry the label "Author-submitted, unrefereed" wherever they appear.</li>
  <li>They are left out of the counts on the home page.</li>
  <li>Their confidence is recorded as low until someone independent has checked them.</li>
</ul>
<p>The label is removed when the source is published in a refereed venue or an independent expert has checked the entry.</p>

<h2 id="how">How entries are classified</h2>
<ol>
  <li>Find the original paper and the theorem that carries the hypothesis.</li>
  <li>Work out which L-functions the proof really uses, not just the name the paper gives the hypothesis.</li>
  <li>Record every hypothesis with a taxonomy code, cite the source, and note where in the paper the hypothesis is invoked when that is known.</li>
  <li>Derive the status from the codes. Record doubts as open questions on the entry.</li>
  <li>A human checks the entry against the primary source before it moves to "human-checked".</li>
</ol>

<h2 id="coverage">What has been searched, and what has not</h2>
<p>As of 22 November 2026:</p>
<ul>
  <li><strong>arXiv abstracts.</strong> arXiv's own search finds about 1,870 abstracts that mention the Riemann Hypothesis or a generalization by name, including the abbreviations GRH and ERH. All of them were screened for a conditional result, by keyword filters and by reading excerpts of the abstracts.</li>
  <li><strong>Papers opened.</strong> 816 papers found this way were opened and their main theorems read. ${entries.filter((e) => e.sources.some((x) => (x.url || '').includes('arxiv.org/abs/'))).length} of the ${entries.length} entries cite an arXiv paper. The other opened papers were set aside: unconditional, already covered by a sharper entry, the hypothesis only mentioned, or no way to tell which L-functions were meant.</li>
  <li><strong>Reference lists.</strong> Those papers cite 524 further arXiv papers that the abstract search had not found. All 524 were downloaded and their full text scanned for a conditional theorem; 46 were then read.</li>
  <li><strong>Classic papers.</strong> A small number of older journal papers were added by hand from the published text.</li>
</ul>
<p>What this does not cover:</p>
<ul>
  <li>Papers that use the hypothesis without naming it in the abstract, unless one of the papers already read cites them on arXiv.</li>
  <li>Anything that is not on arXiv, which includes most of the literature before the 1990s and many journal papers since.</li>
  <li>Secondary results. Usually only the headline conditional theorem of a paper is recorded.</li>
  <li>Mistakes in the screening. The filters and the reading were done by an AI system and can have missed papers.</li>
</ul>

<h2 id="limits">Limits of AI classification</h2>
<ul>
  <li>Most entries start as AI drafts. An AI system can misremember a constant, a range, an attribution, or which L-functions a proof needs.</li>
  <li>The hard question is usually hidden: a paper may say "GRH" and use it for Hecke or Dedekind L-functions deep inside a cited lemma. An AI draft can miss that.</li>
  <li>"Where the hypothesis is invoked" is often not yet recorded. Where it is missing, the entry says so.</li>
  <li>Statements are simplified for readability. The cited paper is the authority, never this site.</li>
  <li>An entry being absent means nothing. The dataset is not complete; see <a href="#coverage">what has been searched</a>.</li>
</ul>
<p>If you know one of these results well, please check its entry. Each entry page has a "suggest a correction" link that opens a prefilled GitHub issue.</p>

<h2 id="license">License and credit</h2>
<p>The dataset is released under CC BY 4.0 and the code under the MIT License. Maintained by ${esc(cfg.credit)}.</p>`,
  });
}

function buildWaiting() {
  const open = entries.filter((e) => e.waiting_on);
  const rows = waiting.map((w) => {
    const all = open.filter((e) => e.waiting_on.includes(w.code));
    const only = all.filter((e) => e.waiting_on.length === 1);
    return { w, all, only };
  }).sort((a, b) => b.all.length - a.all.length);
  const multi = open.filter((e) => e.waiting_on.length > 1).length;
  const within = (codes) => open.filter((e) => e.hypotheses_required.every((h) => codes.includes(h))).length;
  const ladder = [
    ['the Dedekind zeta function of every number field', within(['RH', 'GRH-Dirichlet', 'ERH-Dedekind'])],
    ['those, and every Hecke L-function', within(['RH', 'GRH-Dirichlet', 'ERH-Dedekind', 'GRH-Hecke'])],
    ['those, and every Artin L-function', within(['RH', 'GRH-Dirichlet', 'ERH-Dedekind', 'GRH-Hecke', 'GRH-Artin'])],
  ];
  const beyond = open.length - ladder[2][1];
  const top = rows[0];
  page({
    file: 'waiting.html',
    title: 'Still waiting',
    description: 'Entries the announced proof does not finish, grouped by what would have to be proved next.',
    body: `
<h1>What is still waiting, and on what</h1>
<p class="lede">The announced proof covers the two most basic versions of the Riemann Hypothesis. ${open.length} of the
${entries.length} entries need more. This page groups them by what would have to be proved next to finish them.</p>
<p>The largest group is "${esc(top.w.name)}": ${top.all.length} entries wait on it, and ${top.only.length} of those need nothing else.
The same caution applies here as everywhere on this site: these groupings were drafted by an AI system and have not been checked by an expert.</p>

<div class="table-wrap" tabindex="0" role="region" aria-label="Summary of what entries are waiting on">
<table class="waiting">
  <thead><tr><th scope="col">What would need proving</th><th scope="col">Hypothesis code</th><th scope="col" class="num">Entries waiting on it</th><th scope="col" class="num">Of which need nothing else</th></tr></thead>
  <tbody>
  ${rows.map(({ w, all, only }) => `<tr><th scope="row"><a href="#${w.code}">${esc(w.name)}</a></th><td>${w.hypotheses.map(hypChip).join(' ')}</td><td class="num">${all.length}</td><td class="num">${only.length}</td></tr>`).join('\n  ')}
  </tbody>
</table>
</div>
<p class="muted">An entry is counted under every group it needs, so the middle column adds up to more than ${open.length}. ${multi} entries need more than one group.
"Need nothing else" means the entry would be fully unlocked if that one group were proved, on top of what the announced proof covers.</p>

<section aria-labelledby="next">
<h2 id="next">What would move next</h2>
<p>The author's note says he expects, "with more time", to obtain "the Extended Riemann Hypothesis too". The note does not define the term; it usually means the Riemann Hypothesis for Dedekind zeta functions of number fields. Nothing of the kind has been released. This section only counts what further results would settle here, going by the hypothesis codes on each entry.</p>
<p>If the Riemann Hypothesis were proved for:</p>
<ul>
  ${ladder.map(([label, n]) => `<li>${esc(label)}: <strong>${n} of ${open.length}</strong> waiting entries would need nothing further.</li>`).join('\n  ')}
</ul>
<p class="muted">The steps are cumulative. The remaining ${beyond} entries need the hypothesis for automorphic L-functions, or an assumption that is not a Riemann Hypothesis at all. The counts inherit every caution on this site: the codes were assigned by an AI system and have not been checked by an expert.</p>
</section>

${rows.map(({ w, all }) => `<section aria-labelledby="${w.code}">
  <h2 id="${w.code}">${esc(w.name)} <span class="count-inline">${all.length}</span></h2>
  <p>${esc(w.plain.trim())}</p>
  <ul class="wait-list">
    ${all.sort((a, b) => a.waiting_on.length - b.waiting_on.length || a.title.localeCompare(b.title)).map((e) => `<li><a href="theorems/${e.id}.html">${esc(e.title)}</a> ${statusBadge(e)}${e.waiting_on.length > 1 ? ` <span class="muted">also needs: ${e.waiting_on.filter((x) => x !== w.code).map((x) => esc(waitBy[x].name.charAt(0).toLowerCase() + waitBy[x].name.slice(1))).join('; ')}</span>` : ''}</li>`).join('\n    ')}
  </ul>
</section>`).join('\n')}

<h2 id="reading">How to read this</h2>
<ul>
  <li>These groups are finer than the hypothesis codes. Two results can both need "the Riemann Hypothesis for Dedekind zeta functions" and still wait on different fields.</li>
  <li>Partly unlocked entries appear here too, because part of them still waits.</li>
  <li>The groups say what the existing proofs use. A different proof of the same result might need less.</li>
  <li>Where a paper says only "GRH", the group was inferred from the method or from a cited result. Each entry's open questions say when that is the case.</li>
</ul>`,
  });
}

function csvCell(v) {
  const s = Array.isArray(v) ? v.join('; ') : v === null || v === undefined ? '' : String(v).trim().replace(/\s+/g, ' ');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function buildConnections() {
  const rows = entries.map((e) => ({ e, used: (usedBy[e.id] || []).length, ref: new Set([...(referredBy[e.id] || [])]).size })).filter((r) => r.used + r.ref >= 3).sort((x, y) => y.used + y.ref - (x.used + x.ref) || x.e.title.localeCompare(y.e.title)).slice(0, 40);
  const nRests = entries.filter((e) => (e.rests_on || []).length).length;
  const nLinked = entries.filter((e) => (e.rests_on || []).length || (e.related || []).length || (usedBy[e.id] || []).length || (referredBy[e.id] || []).length).length;
  page({
    file: 'connections.html',
    title: 'Connections',
    description: 'Which entries other entries point to most often.',
    body: `
<h1>Connections between entries</h1>
<p class="lede">Some results carry many others. This page lists the entries that other entries point to most often.</p>
<p>${nLinked} of the ${entries.length} entries are linked to at least one other entry. Two kinds of link are recorded:</p>
<ul>
  <li><strong>Rests on.</strong> The proof uses the other result as an ingredient. This is recorded by hand for ${nRests} entries so far, only where the entry's own notes say so.</li>
  <li><strong>Related.</strong> One entry's notes name the other: a sharper version, a special case, the same method, or a comparison. These were collected automatically from the notes.</li>
</ul>
<p class="muted">The links are incomplete. Most dependencies between results are not recorded yet, so a low count here means little. The links were drafted by an AI system and have not been checked by an expert.</p>
<div class="table-wrap" tabindex="0" role="region" aria-label="Entries most often pointed to">
<table class="waiting">
  <thead><tr><th scope="col">Entry</th><th scope="col" class="num">Used by</th><th scope="col" class="num">Named by</th></tr></thead>
  <tbody>
  ${rows.map(({ e, used, ref }) => `<tr><th scope="row"><a href="theorems/${e.id}.html">${esc(e.title)}</a> ${statusBadge(e)}</th><td class="num">${used}</td><td class="num">${ref}</td></tr>`).join('\n  ')}
  </tbody>
</table>
</div>`,
  });
}

function buildCheck() {
  const pct = (x) => `${Math.round(x * 100)}%`;
  const groups = [
    ['more', 'Marked unlocked here; the second reading says more is needed', 'These matter most. A wrong "unlocked" label is the costliest mistake this site can make. In many of them the paper states its theorem for a wider class of L-functions and the entry records only the Dirichlet case, or the paper names a Dedekind zeta function of a field that is abelian over the rationals, which factors into Dirichlet L-functions. Both are judgments of this project, not words of the paper.', (r) => r.beyond, 'says more is needed'],
    ['less', 'Marked as waiting here; the second reading says Dirichlet L-functions are enough', 'If the second reading is right, these entries are unlocked and the site is being too cautious.', (r) => r.dirichlet_only, 'says Dirichlet only'],
    ['extra', 'The second reading sees a further unproved assumption that the entry does not list', 'Sometimes this is a real omission. Sometimes the paper only mentions the conjecture in passing.', (r) => r.extra_assumption, 'sees a further assumption'],
  ];
  const lists = groups.map(([key, title, why, score, label]) => ({ key, title, why, label, items: entries.filter((e) => checkReason(e) === key).map((e) => ({ e, s: score(second.readings[e.id]) })).sort((x, y) => y.s - x.s || x.e.title.localeCompare(y.e.title)) }));
  const total = lists.reduce((n, l) => n + l.items.length, 0);
  const read = entries.filter((e) => second.readings[e.id]).length;
  const checked = entries.filter((e) => e.review.state !== 'ai-classified').length;
  page({
    file: 'check.html',
    title: 'Help check',
    description: 'The entries most worth a human check, and how to report one.',
    body: `
<h1>Help check these first</h1>
<p class="lede">${checked === 0 ? 'No entry on this site has been checked by a person yet.' : 'Most entries on this site have not been checked by a person.'} If you know some number theory and have ten minutes, this page says where they are best spent.</p>
<p>${checked} of ${entries.length} entries are human-checked so far.</p>

<h2 id="how">How to check an entry</h2>
<ol>
  <li>Open the entry and its source paper.</li>
  <li>Find the theorem, and find where its proof uses the hypothesis. The question is which L-functions the hypothesis is needed for: only the Riemann zeta function and Dirichlet L-functions, or others as well.</li>
  <li>Press "I checked this entry" on the entry page and say what you found. A report that the entry is right is as useful as a correction.</li>
</ol>
<p>Reports are public GitHub issues. With your agreement the entry will record who checked it.</p>

<h2 id="first">The one question that matters most</h2>
<p>Much of this site rests on a single classification: that <a href="theorems/bach-class-group-generators.html">Bach's bound on generators of the class group</a> stays conditional even for quadratic fields, because its proof applies the hypothesis to L-functions of class group characters, which are not Dirichlet L-functions. The <a href="software.html">Software caveats</a> page and many "still waiting" entries follow from it. If you can confirm or refute that in a sentence, please do.</p>

<h2 id="why">Why these entries</h2>
<p>${esc(second.about.what)} The model was ${esc(second.about.model)}, run on ${fmtDate(second.about.date)} over the ${read} entries for which the paper text was on file.</p>
<p>The two readings agree on most entries. The ${total} below are those where they differ, which makes them the likeliest places for a mistake, in either reading. A disagreement is not evidence that the entry is wrong.</p>

${lists.map((l) => `<section aria-labelledby="g-${l.key}">
  <h2 id="g-${l.key}">${esc(l.title)} <span class="count-inline">${l.items.length}</span></h2>
  <p>${esc(l.why)}</p>
  <ul class="wait-list">
    ${l.items.map(({ e, s }) => `<li><a href="theorems/${e.id}.html">${esc(e.title)}</a> ${statusBadge(e)} <span class="muted">second reading ${esc(l.label)}: ${pct(s)}</span></li>`).join('\n    ')}
  </ul>
</section>`).join('\n')}

<h2 id="data">The data</h2>
<p>The second reading of every entry is in the repository as <code>data/meta/second-reading.json</code>. It is not part of any entry's classification and changes no status.</p>`,
  });
}

function buildData() {
  const dataDir = path.join(OUT, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const bundle = {
    generated_from: 'data/theorems/*.yaml',
    license: 'CC BY 4.0',
    proof_status: proof,
    hypotheses: taxonomy,
    waiting_families: waiting,
    theorems: entries,
  };
  fs.writeFileSync(path.join(dataDir, 'theorems.json'), JSON.stringify(bundle, null, 2) + '\n');
  const cols = ['id', 'title', 'field', 'status', 'hypotheses_required', 'waiting_on', 'status_note', 'statement_plain', 'statement_formal', 'review_state', 'confidence', 'checked_by', 'checked_on', 'lean_proved', 'sources', 'tags', 'added'];
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
<h2>License</h2>
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
for (const f of ['style.css', 'app.js', 'preview-card.png']) fs.copyFileSync(path.join(SITE, 'assets', f), path.join(OUT, 'assets', f));
const kdist = path.join(ROOT, 'node_modules', 'katex', 'dist');
fs.copyFileSync(path.join(kdist, 'katex.min.css'), path.join(OUT, 'assets', 'katex', 'katex.min.css'));
fs.cpSync(path.join(kdist, 'fonts'), path.join(OUT, 'assets', 'katex', 'fonts'), { recursive: true, filter: (src) => !/\.(ttf|woff)$/.test(src) });
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

buildHome();
buildBrowse();
for (const e of entries) {
  try { buildEntry(e); } catch (err) { console.error(`Failed to render ${e.id}: ${err.message}`); process.exit(1); }
}
page({
  file: 'problem.html',
  title: 'The problem',
  description: 'What the Riemann Hypothesis says, what was tried before, and what the announced proof reports doing.',
  math: true,
  body: problemPage({ m: (s) => tex(s, false), M: (s) => `<div class="formal">${tex(s, true)}</div>`, esc, entryLink: (id, label) => (byId[id] ? `<a href="theorems/${id}.html">${esc(label)}</a>` : esc(label)) }),
});
page({
  file: 'software.html',
  title: 'Software caveats',
  description: 'Where computer algebra systems assume GRH, and whether the announced proof would let that caveat be dropped.',
  body: softwarePage({ esc, entryLink: (id, label) => { if (!byId[id]) throw new Error(`software page links to missing entry ${id}`); return `<a href="theorems/${id}.html">${esc(label)}</a>`; } }),
});
buildWaiting();
buildAbout();
buildData();
buildCheck();
buildConnections();
console.log(`Built ${entries.length} entry pages into dist/`);
