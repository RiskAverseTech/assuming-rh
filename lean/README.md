# Lean corollaries

Empty for now. This folder is reserved for Lean 4 proofs that specific entries follow from the covered hypotheses.

Planned first targets, because they are short:

- `miller-deterministic-primality`
- `least-quadratic-nonresidue`
- `deterministic-square-roots-mod-p`

Proofs of the form "RH implies X" need only Mathlib's statement of the Riemann Hypothesis, so they can be written without importing the proof itself. Importing the proof waits on its license: as of 21 November 2026 the released archive carried none, and the author was reported to be preparing one.

When a corollary lands, the entry's `lean.proved` and `lean.path` fields point to it and its review state can move to `lean-verified`.
