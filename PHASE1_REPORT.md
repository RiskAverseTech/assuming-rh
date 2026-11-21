# Phase 1 report

Date: 21 November 2026. Everything is local. Nothing has been pushed, published or deployed.

## What was built

- **Data**: 31 seed entries in `data/theorems/`, one YAML file each, all `ai-classified`. Counts: 17 unlocked, 1 partial, 9 still conditional, 4 proved otherwise.
- **Taxonomy** in `data/meta/hypotheses.yaml` (the seven codes, with what the claim covers). The validator and the site both read it.
- **Proof status** in `data/meta/proof-status.yaml`, with sources and a last-updated date. The banner on every page reads it.
- **Schema** in `schema/theorem.schema.json`. Two optional fields were added to the spec's model: `related` (links between entries) and `sources[].role` (conditional proof, unconditional proof, refinement, survey).
- **Validator** (`npm run validate`): schema plus cross-field rules. `unlocked` is rejected if any hypothesis is uncovered. `partial` and `proved-otherwise` need a note. `human-checked` needs a checker and a date. Ids must match file names and `related` ids must exist.
- **Validator self-test** (`npm test`): the dataset passes, four deliberately wrong fixtures are rejected for the right reason, one valid fixture passes.
- **Site** (`npm run build`, output in `dist/`): Home, Browse, one page per entry, Method, Data. JSON and CSV downloads. Light and dark themes. KaTeX rendered at build time. Readable without JavaScript. No analytics or third-party requests.
- **Repo files**: README, CONTRIBUTING, MIT and CC BY 4.0 notices, CI workflow, two issue templates, `lean/README.md`.
- **House-style check** (`npm run check-copy`): fails on any em dash in the repo or the built site.

## Stack choice

The spec suggested Astro with Pagefind and allowed something simpler with a reason. I used a plain Node build script with three pinned dependencies (`js-yaml` 5.5.0, `ajv` 8.20.0, `katex` 0.19.1; eight packages in total with their dependencies). Reasons: the spec asks for care about compromised packages, and Astro would bring in several hundred. At 31 entries a client-side filter over the table is enough for search. Pagefind or Astro can be added in phase 3 if the dataset grows into the hundreds.

Dependency checks done: every release is at least four weeks old, `npm audit` reports no known vulnerabilities, and install scripts were disabled (`--ignore-scripts`). I did not have access to a separate compromised-package list beyond the npm advisory database.

## Definition of done

| Item | Result |
|---|---|
| `validate` passes on all entries and fails on a wrong fixture | Yes. `npm test` proves both. |
| Site builds locally and every seed entry has a page | Yes, 31 pages. |
| Banner shows the proof status with a date | Yes, on every page. |
| No surname, personal detail or em dash anywhere | Checked by search and by `check-copy`. |
| This report | Here. |

## The main caveat: no primary source was read

The research agents could not open arxiv.org, ams.org, Wikipedia, Crossref or publisher sites from this environment. They saw web search summaries only. So the VERIFY items below were checked against abstracts, citing papers and secondary sources as shown in search results, not against the papers themselves. Nothing is marked `human-checked`, and every doubt is recorded in the entry's `open_questions`.

To do a real primary-source pass, the environment needs network access to at least arxiv.org and www.ams.org.

## Two seed expectations I changed

**Item 18, Bach's class group bound: `still-conditional`, not `partial`.** The proof needs the Riemann Hypothesis for the Hecke L-functions of class group characters. For a quadratic field these are not Dirichlet L-functions (a character of order above 2 gives a dihedral Artin L-function over Q). So the bound does not become unconditional for quadratic fields. The abelian-field rule in the taxonomy covers the Dedekind zeta function of the field, and that is not what this proof uses. Belabas, Diaz y Diaz and Friedman (2008) state the hypothesis in exactly this form. Confidence in the mathematics is good. Bach's own wording has not been read.

**Item 19, Hafner and McCurley: `still-conditional`, not `partial`.** Same reason: both uses of the hypothesis are about class group characters. Marked low confidence because the paper was not read.

Because of this I added a line to the `GRH-Hecke` row of the taxonomy and to the Method page warning about this trap. It will come up often in phase 3.

**Item 21, effective Chebotarev: `partial`, not `still-conditional`.** For abelian extensions of Q it is covered, which is the taxonomy's own rule. That case says little beyond primes in arithmetic progressions, and the entry says so. A reviewer may prefer `still-conditional`.

## VERIFY items

| # | Item | Found | Still open |
|---|---|---|---|
| 3 | Dudek 2015 | Under RH, a prime in (x - (4/pi) sqrt(x) log x, x] for all x >= 2. Later improved to constant 22/25 for x >= 4 (Carneiro, Milinovich, Soundararajan 2019). | Theorem not read directly. DOI unconfirmed, left empty. |
| 11 | Shoup 1992 | Bound O(r^4 (log r + 1)^4 (log p)^2) with r the number of prime factors of p - 1, so O((log p)^6). Prime fields only. | Shoup says "ERH". His definition was not read. Dirichlet characters mod p should suffice. |
| 13 | Lamzouri, Li, Soundararajan 2015 | Least prime in a progression is at most (phi(q) log q)^2 for q > 3. A 2017 corrigendum changes two asymptotic theorems and reportedly not this corollary. | Corollary 1.2 not read directly. For the related non-residue bound, sources disagree on "prime q" versus "all q". |
| 14 | Idoneal numbers | Unconditionally at most one more fundamental discriminant, hence at most **two** more idoneal numbers. "At most one more" is a known misstatement. Under the hypothesis the list of 65 is complete, and only real Dirichlet characters are involved. | Weinberger's exact conditional hypothesis not read. |
| 17 | arXiv 2211.08844 | Bordignon and Starichkova, Ramanujan J. 64 (2024). Under GRH every even integer above exp(exp(15.85)) is a prime plus a number with at most two prime factors. | That "GRH" means Dirichlet L-functions is inferred from the method. |
| 19 | Hafner and McCurley | See above. Reclassified. | Where the hypothesis enters was not read. |
| 23 | Ono and Soundararajan | Needs Dirichlet L-functions and L-functions of quadratic twists of an elliptic curve (weight 2 newforms). 18 exceptions, the largest 2719. Still conditional. The seed text "all sufficiently described odd integers" was replaced by the explicit list. | Theorem 1 wording not read. Ramanujan's 16 values are from memory. |
| 27 | Rónyai, Huang, Evdokimov | The hypothesis is used to find power non-residues, including in extension fields. Dirichlet L-functions are not known to suffice. Kept `still-conditional`, low confidence. | Exact variant unconfirmed in all three papers. Huang's abelian case might be unlocked and would then deserve its own entry. |
| 31 | Kuperberg, Lackenby | Kuperberg 2014 uses effective Chebotarev for non-abelian fields. Lackenby's unconditional proof is published (Adv. Math. 387, 2021) and undisputed. | Kuperberg's own wording not read. |

Other things found along the way:

- **Item 15, Siegel zeros.** The October 2026 OpenAI claim is a manuscript in a bulk release ("Uniform exclusion of Landau-Siegel zeros"), with unrefereed human rewrites as preprints. Recorded in `status_note` as the spec asked. If that work is accepted, the entry should move to `proved-otherwise`.
- **Item 25, Chebyshev's bias.** One part of the paper needs only GRH for Dirichlet L-functions (the limiting distribution exists) and is covered. The densities need Linear Independence as well. Kept `still-conditional` with a note.
- **Item 22, Koiran.** The journal version may state only "second level of the polynomial hierarchy", with AM in the revised technical report. Open question on the entry.
- **Item 28, Helfgott.** Accepted for Annals of Mathematics Studies in 2015. Could not confirm it is in print.
- **DOIs** are filled in only where a search result showed them or I am certain of them. The rest are empty and should be filled from Crossref.
- **`hypothesis_location`** is filled for 8 sources and empty for the rest. The site says "not yet recorded" where it is empty.

## Proof status: what was found

- The release is a short note and a Lean 4 archive on the author's site, with third-party mirrors on GitHub. The headline theorems are RH (Mathlib's definition) and GRH for Dirichlet L-functions. Nothing is claimed for Dedekind, Hecke or Artin L-functions, which matches the taxonomy.
- One public third-party verification run had passed its source scan but was about 41 percent through the build when checked on 21 November. Press reports say other independent kernel checks passed. Those reports were seen as search summaries only.
- **The archive has no licence file.** This matters for phase 3: the development cannot be imported or redistributed until that changes.
- The spec says "independent kernel checks have passed". I worded the banner slightly more cautiously ("checks have been reported, at least one still running") because that is what could be confirmed. Easy to change in `data/meta/proof-status.yaml`.

## Things I was unsure about

1. **Commit trailers.** The spec says public credit is "Jaz" only, including commits. I therefore left out the usual AI co-author and session trailers. The commit author name and address are the ones given in the spec. That address becomes public once the repository is pushed.
2. **Repository address.** Resolved after this report was written: the project is named Assuming RH and lives at `https://github.com/RiskAverseTech/assuming-rh`. Correction and footer links now point there.
3. **CC BY 4.0 legal text.** `LICENSE-DATA` is a notice that links to the licence. The full legal text could not be downloaded here and should be pasted in before publishing.
4. **CI workflow** is written but has never run. The two GitHub Actions are pinned to major versions and should be pinned to commit hashes before the first push.
5. **Site name.** Resolved: "Assuming RH". It is set in one place, `site/site.config.json`.
6. **Search without JavaScript.** Reading works without JavaScript. Search and filters do not, and the page says so.
7. **Accessibility** was built in (landmarks, skip link, labels, focus styles, sort state, no colour-only meaning) and checked by eye in both themes and at phone width. No automated audit or screen reader test was run.

## Questions for Jaz before phase 2

1. Final project name and domain.
2. Which GitHub account or organization hosts it.
3. Which host for the site. It is plain static files, so GitHub Pages, Cloudflare Pages or Netlify all work.
4. Whether to announce on the Lean Zulip and offer the dataset to the effort there. The search on 21 November found no dedicated catalogue. The nearest thing is a single-author GitHub issue tracking downstream targets of the proof (`1337isnot1337/solved-conjectures`, issue 80). Worth a look before launch. The Zulip itself could not be read from here.
5. Whether commits should carry an AI co-author line after all.
6. Whether to allow network access to arxiv.org and ams.org so the VERIFY items can be checked against the papers before anything is published.
