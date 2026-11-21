# Assuming RH

## In plain words

Mathematicians have a famous unsolved problem called the Riemann Hypothesis. Over more than a century they have proved hundreds of results that start with "if the Riemann Hypothesis is true, then...". Those results have been waiting for someone to prove the "if" part.

In November 2026 a proof was announced. Computers have checked it. Mathematicians have not yet agreed that it is right.

This project is a list of those "if... then" results. For each one it answers a simple question: **would the announced proof finish this result, or does the result need something more?**

"Something more" matters because the Riemann Hypothesis comes in several strengths. The announced proof covers the two most basic versions. Many results need a stronger version, and those stay unproven.

## Three things to know before you trust anything here

1. **The proof might be wrong.** If it is, nothing on this list becomes true because of it.
2. **An AI wrote every entry, and no expert has checked them yet.** Each entry says so. Treat every label as a draft.
3. **The list is incomplete.** If a result is not here, that tells you nothing about it.

If you see a mistake, please tell us. Every entry on the site has a "suggest a correction" link.

## What this does and does not mean

- **Checked by a machine is not the same as understood by people.** The proof is reported to have been checked step by step by computer. No account of the argument that mathematicians can read, follow and explain has been reviewed. Until one has, the result is not accepted, and this project treats it as a claim.
- **This list depends on the theorem being true, not on the proof being readable.** A result that follows from the Riemann Hypothesis follows from it whether or not anyone yet understands why the hypothesis holds. That is why a map of consequences can be drawn now, and why it has to stay provisional.
- **This project does not judge the proof.** It does not assess, endorse or add evidence for it. It records what would follow, and what would not.

## For mathematicians

> Which theorems that were proved "assuming the Riemann Hypothesis" (or a generalized version) are now unconditional, which are still waiting, and exactly which hypothesis does each one need?

An open dataset and a static website that answer that question, one theorem at a time.

## The details

**Everything here is provisional.**

1. **The proof is claimed, not accepted.** On 20 November 2026 Levent Alpöge released a Lean 4 formalization claiming a proof of the Riemann Hypothesis (RH) and of the Generalized Riemann Hypothesis for Dirichlet L-functions. Machine checks have been reported. The mathematical community has not accepted the result. Every "unlocked" label holds only if it is accepted. The current status, its sources and the date it was last updated are in [`data/meta/proof-status.yaml`](data/meta/proof-status.yaml), and the site shows them in a banner on every page.
2. **Every entry carries a review state.** `ai-classified` means an AI system drafted the entry and no human expert has checked it. `human-checked` means a named person checked it against the primary source. `lean-verified` means the implication is formalized in Lean. At the moment every entry is `ai-classified`. Treat them as drafts.
3. **Corrections are wanted.** Every entry page links to a prefilled "suggest a correction" issue. See [CONTRIBUTING.md](CONTRIBUTING.md).
4. **Sources are cited on every entry**, with the place in the paper where the hypothesis is invoked when that is known. Where it is not yet recorded, the entry says so.

A wrong "unlocked" label does more harm than a missing entry. When in doubt, an entry is marked as in doubt.

## How the entries were made and checked

- Entries are drafted by an AI system from the text of each paper. For every entry drafted in the literature sweeps, the theorem and the sentence stating the hypothesis were copied verbatim, and a script confirmed that each quote appears in the paper.
- On 21 November 2026 a random sample of 15 of the 113 sweep entries was audited independently against the source papers, including the formulas as printed. 14 were correct, 1 had a minor omission in a note, and none had a mathematical error. A sample of 15 is small: it rules out a high error rate, not a modest one.
- The audit compares entries with their own papers. It does not test classifications that rest on inference, for example where a paper says only "GRH" and the variant was read off a cited lemma. Those doubts are listed under each entry's open questions and need a number theorist.

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
| `unlocked` | Every required hypothesis is covered. Unconditional if the claimed proof is accepted. |
| `partial` | Unlocked in a named special case only. The note says which. |
| `still-conditional` | Needs at least one hypothesis that is not covered. |
| `proved-otherwise` | Was conditional, later proved unconditionally by other means. |

## Layout

```
data/theorems/*.yaml         one file per theorem (the source of truth)
data/meta/proof-status.yaml  status of the underlying proof (banner data)
data/meta/hypotheses.yaml    the taxonomy and what the claim covers
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

## Licence

Code: MIT, see [LICENSE](LICENSE). Dataset: CC BY 4.0, see [LICENSE-DATA](LICENSE-DATA).

Maintained by Jaz.
