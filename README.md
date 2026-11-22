# Assuming RH

## In plain words

Mathematicians have a famous unsolved problem called the Riemann Hypothesis. Over more than a century they have proved hundreds of results that start with "if the Riemann Hypothesis is true, then...". Those results have been waiting for someone to prove the "if" part.

In November 2026 a proof was announced, written so that computers can check it. The check has been done and certified. Mathematicians have not yet read and understood the argument.

This project is a list of those "if... then" results. For each one it answers a simple question: **would the announced proof finish this result, or does the result need something more?**

"Something more" matters because the Riemann Hypothesis comes in several strengths. The announced proof covers the two most basic versions. Many results need a stronger version, and those stay unproven.

## Three things to know before you trust anything here

1. **The proof is verified by computer, not yet understood by people.** If a problem is ever found, nothing on this list becomes true because of it.
2. **An AI wrote every entry, and no expert has checked them yet.** Each entry says so. Treat every label as a draft.
3. **The list is incomplete.** If a result is not here, that tells you nothing about it.

If you see a mistake, please tell us. Every entry on the site has a "suggest a correction" link.

## What this does and does not mean

- **Checked by a machine is not the same as understood by people.** The formal proof has been verified, and that verification certified by the Lean community. No account of the argument that mathematicians can read, follow and explain has been reviewed. Until one has, this project says "verified", not "understood".
- **This list depends on the theorem being true, not on the proof being readable.** A result that follows from the Riemann Hypothesis follows from it whether or not anyone yet understands why the hypothesis holds. That is why a map of consequences can be drawn now, and why it has to stay provisional.
- **This project does not judge the proof.** It does not assess, endorse or add evidence for it. It records what would follow, and what would not.

## For mathematicians

> Which theorems that were proved "assuming the Riemann Hypothesis" (or a generalized version) are now unconditional, which are still waiting, and exactly which hypothesis does each one need?

An open dataset and a static website that answer that question, one theorem at a time.

## The details

**Everything here is provisional.**

1. **The formal proof is verified. The argument is not yet understood.** On 20 November 2026 Levent Alpöge released a Lean 4 formalization of a proof of the Riemann Hypothesis (RH) and of the Generalized Riemann Hypothesis for Dirichlet L-functions. On 21 November the Lean and Mathlib communities issued a joint statement, endorsed by the Lean FRO and the Mathlib Initiative, certifying that the statement and the proof of RH are correct. That statement does not mention the Dirichlet part, which the same tools were reported to accept in the public discussion. No human-readable account of the argument has been reviewed. Every "unlocked" label rests on that proof. The current status, its sources and the date it was last updated are in [`data/meta/proof-status.yaml`](data/meta/proof-status.yaml), and the site shows them in a banner on every page.
2. **Every entry carries a review state.** `ai-classified` means an AI system drafted the entry and no human expert has checked it. `human-checked` means a named person checked it against the primary source. `lean-verified` means the implication is formalized in Lean. At the moment every entry is `ai-classified`. Treat them as drafts.
3. **Corrections are wanted.** Every entry page links to a prefilled "suggest a correction" issue. See [CONTRIBUTING.md](CONTRIBUTING.md).
4. **Sources are cited on every entry**, with the place in the paper where the hypothesis is invoked when that is known. Where it is not yet recorded, the entry says so.

A wrong "unlocked" label does more harm than a missing entry. When in doubt, an entry is marked as in doubt.

## How the entries were made and checked

- Entries are drafted by an AI system from the text of each paper. For every entry drafted in the literature sweeps, the theorem and the sentence stating the hypothesis were copied verbatim, and a script confirmed that each quote appears in the paper.
- On 21 November 2026 a random sample of 15 of the 113 sweep entries was audited independently against the source papers, including the formulas as printed. 14 were correct, 1 had a minor omission in a note, and none had a mathematical error. A sample of 15 is small: it rules out a high error rate, not a modest one.
- The audit compares entries with their own papers. It does not test classifications that rest on inference, for example where a paper says only "GRH" and the variant was read off a cited lemma. Those doubts are listed under each entry's open questions and need a number theorist.

## What has been searched, and what has not

As of 22 November 2026:

- **arXiv abstracts.** arXiv's own search finds about 1,870 abstracts that mention the Riemann Hypothesis or a generalization by name, including the abbreviations GRH and ERH. All of them were screened for a conditional result, by keyword filters and by reading excerpts of the abstracts.
- **Papers opened.** 816 papers were opened and their main theorems read. Most entries come from these. The rest were set aside: unconditional, already covered by a sharper entry, the hypothesis only mentioned, or no way to tell which L-functions were meant.
- **Classic papers.** A small number of older journal papers were added by hand from the published text.

Not covered: papers that use the hypothesis without naming it in the abstract; anything that is not on arXiv, which includes most of the literature before the 1990s; secondary results of a paper beyond its headline conditional theorem; and whatever the screening, done by an AI system, missed.

## The hypothesis taxonomy

Papers say "assuming GRH" loosely. The exact variant decides whether a result is unlocked.

| Code | Meaning | Covered by the claim? |
|---|---|---|
| `RH` | Zeros of the Riemann zeta function only | Yes |
| `GRH-Dirichlet` | All Dirichlet L-functions | Yes |
| `ERH-Dedekind` | Dedekind zeta functions of number fields | Not in general. Yes for abelian extensions of Q, including quadratic and cyclotomic fields, whose zeta functions factor into Dirichlet L-functions |
| `GRH-Hecke` | Hecke L-functions, including class group characters | No |
| `GRH-Artin` | Artin L-functions | No |
| `GRH-automorphic` | Modular form, elliptic curve, or higher automorphic L-functions | No |
| `PLUS-EXTRA` | A covered hypothesis plus another unproven assumption, for example Linear Independence of zeros | No |

An entry may list several hypotheses. It is `unlocked` only if every one is covered. The validator enforces this.

One trap worth knowing: a result about the class group of a quadratic field usually needs `GRH-Hecke`, not `ERH-Dedekind`, because class group characters are not Dirichlet characters. Such results stay conditional.

## Statuses

| Status | Meaning |
|---|---|
| `unlocked` | Every required hypothesis is covered. Follows from the announced proof. |
| `partial` | Unlocked in a named special case only. The note says which. |
| `still-conditional` | Needs at least one hypothesis that is not covered. |
| `proved-otherwise` | Was conditional, later proved unconditionally by other means. |

## Layout

```
data/theorems/*.yaml         one file per theorem (the source of truth)
data/meta/proof-status.yaml  status of the underlying proof (banner data)
data/meta/hypotheses.yaml    the taxonomy and what the claim covers
data/meta/waiting.yaml       what the not-yet-unlocked entries are waiting on
schema/theorem.schema.json   JSON Schema for a theorem file
scripts/validate.mjs         schema plus cross-field checks
scripts/test-validate.mjs    checks that the validator rejects bad fixtures
scripts/check-copy.mjs       house-style check
site/                        static site generator
lean/                        reserved for Lean corollaries
tests/fixtures/              deliberately wrong and right sample entries
```

## Use it

Needs Node 20 or newer.

```bash
npm ci --ignore-scripts
```

```bash
npm run validate
```

```bash
npm test
```

```bash
npm run build
```

```bash
npm run preview
```

`npm run build` writes the site to `dist/`. The pages use relative links only, so you can also open `dist/index.html` straight from disk.

The site is plain HTML that reads fine without JavaScript. A small script adds filtering, sorting, search and a theme switch. Math is rendered with KaTeX at build time. There are no analytics, trackers, cookies or third-party requests.

The stack is deliberately small: three pinned dependencies (`js-yaml`, `ajv`, `katex`) and about 400 lines of build script. Fewer packages means less supply-chain risk and less to maintain.

## How to cite

Cite a tagged version, and keep each entry's review state with anything you quote from it. Citation details are in `CITATION.cff`, which GitHub shows under "Cite this repository". Changes between versions are in `CHANGELOG.md`.

## License

Code: MIT, see [LICENSE](LICENSE). Dataset: CC BY 4.0, see [LICENSE-DATA](LICENSE-DATA).

Maintained by Jaz.
