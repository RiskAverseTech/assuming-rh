# Lean checks

What this project has checked in Lean so far, and how to repeat it.

Nothing here imports the announced proof of the Riemann Hypothesis. Each check is of an implication: if the hypothesis holds, then the result holds. The released proof archive still carries no license, so it is not used.

## Checked on 25 November 2026

The repository [kimihiro64/Robin1984](https://github.com/kimihiro64/Robin1984) (Apache 2.0) was built from source at commit `5ce18bf3487c68d9353276ef5811057f60d17808` with Lean `4.33.1` and the Mathlib commit pinned in its manifest. All 4,899 build jobs completed without error. The file `axioms-check.lean` in this folder was then run against the build.

| Theorem | Statement | Axioms reported |
|---|---|---|
| `Robin1984.robin_inequality_iff_riemannHypothesis` | Robin's inequality for every n above 5040 holds if and only if Mathlib's `RiemannHypothesis` | `propext`, `Classical.choice`, `Quot.sound` |
| `Robin1984.riemannHypothesis_iff_colossallyAbundant_robin` | the same, restricted to colossally abundant integers | the same three |
| `Robin1984.riemann_hypothesis_iff_lagarias_elementary_criterion` | Lagarias's inequality for every positive n holds if and only if `RiemannHypothesis` | the same three |
| `Robin1984.GRH.dirichletGRH_iff_cyclotomicDedekindRH` | the zeros of every Dirichlet L-function in the critical strip lie on the critical line if and only if the same holds for the Dedekind zeta function of every cyclotomic field | the same three |

Entries marked `lean-verified` on this basis: `robin-inequality` and `lagarias-harmonic-inequality`.

The fourth theorem is not an entry. It is the formal version of a step this dataset uses when a paper assumes the hypothesis for the zeta function of a cyclotomic field and the entry is coded as needing Dirichlet L-functions only. It covers cyclotomic fields. It does not cover other fields that are abelian over the rationals, where the dataset uses the same reasoning without a formal check.

## Limits

- Only Lean's own kernel was used. The second, independent checker and the Comparator run that the Robin1984 repository describes were not run here.
- The build was run by an AI system for this project, in a temporary cloud machine. No person has repeated it.
- The build log shows `sorry` warnings inside two dependencies (PrimeNumberTheoremAnd and LeanCert). The axiom report above shows that none of the four theorems depends on them: a theorem that used a `sorry` would list `sorryAx`.
- That a formal statement says what its plain sentence says is a human judgment. The Robin and Lagarias statements are short and were read against the entries; the remark in the Lagarias entry that equality holds only for n = 1 is not part of the formal statement.

## To repeat it

Needs [elan](https://github.com/leanprover/elan) and about 12 GB of disk. The build took about four hours on four cores; most of that is the finite certificates for Lagarias's criterion.

```bash
git clone https://github.com/kimihiro64/Robin1984.git
```

```bash
cd Robin1984 && git checkout 5ce18bf3487c68d9353276ef5811057f60d17808
```

```bash
lake exe cache get
```

```bash
lake build Solution
```

```bash
lake env lean /path/to/assuming-rh/lean/axioms-check.lean
```

## Next targets

Entries whose implication is short enough to formalize directly against Mathlib: `miller-deterministic-primality`, `least-quadratic-nonresidue`, `deterministic-square-roots-mod-p`. Each needs analytic number theory that Mathlib does not yet have, so these are real projects, not quick additions.
