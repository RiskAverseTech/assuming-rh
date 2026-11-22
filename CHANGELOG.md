# Changelog

Notable changes to the dataset and the site. Dates are in UTC. Versions follow `MAJOR.MINOR.PATCH`: the minor number goes up when entries are added or statuses change, the patch number for corrections that change no status.

Every entry is still `ai-classified`. No entry has been checked by a person yet, and the version number below 1.0 says so.

## 0.2.0 (2026-11-22)

First tagged release.

- **687 entries:** 325 unlocked, 33 partly unlocked, 311 still conditional, 18 proved otherwise. Two of these are author-submitted and are left out of the site's headline counts.
- **arXiv screened.** Every arXiv abstract that names the Riemann Hypothesis or a generalization (about 1,870) was screened, and 816 papers were opened. The Method page says what this does and does not cover.
- **Still waiting view.** Entries the announced proof does not finish are grouped by which L-functions a further proof would have to reach, with a count of what each further result would settle.
- **Corrections along the way.** Several entries moved to "proved otherwise" when a later unconditional proof was found (among them the eighth moment of Dirichlet L-functions, the Andre-Oort conjecture, and cases of Serre's conjecture). Bach's class group bound and the Hafner-McCurley algorithm were reclassified as still conditional.
- **Audit.** A random sample of 15 early entries was checked independently against the source papers: 14 correct, 1 minor omission, no mathematical errors.
- **Proof status.** The banner and Method page record that the Lean and Mathlib communities certified the statement and proof of the Riemann Hypothesis on 21 November 2026, that the extension to Dirichlet L-functions has had less scrutiny, and that no human-readable account has been reviewed.

## 0.1.0 (2026-11-21)

- Initial dataset, schema, validator and static site.
