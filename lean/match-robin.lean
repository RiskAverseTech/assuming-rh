import Robin1984.Equivalence.Theorem
import Robin1984.GRH.CyclotomicFactorization
import Solution
/-! The four definitions below are copied character for character from `src/Challenge.lean` of
https://github.com/leanprover-community/riemann-hypothesis at commit d91ae2678eea, the file the
proof was certified against. There the theorems `riemannHypothesis : RiemannHypothesis`,
`riemannZeta_eq_zero_re : RiemannZetaZerosOnLine` and
`LFunction_eq_zero_re : DirichletLZerosOnLine` are the certified statements. They are placed in
a namespace here so that they cannot clash with anything else. -/
namespace Certified

def RiemannZetaZerosOnLine : Prop :=
  ∀ s : ℂ, riemannZeta s = 0 → (¬∃ n : ℕ, s = -2 * ((n : ℂ) + 1)) → s ≠ 1 → s.re = 1 / 2

def DirichletLNonvanishingRightOfHalf : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (s : ℂ),
    1 / 2 < s.re → (χ ≠ 1 ∨ s ≠ 1) → DirichletCharacter.LFunction χ s ≠ 0

def DirichletLZerosOnLine : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N) (s : ℂ),
    0 < s.re → s.re < 1 → DirichletCharacter.LFunction χ s = 0 → s.re = 1 / 2

def PrimitiveDirichletLZerosOnLine : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N), χ.IsPrimitive →
    ∀ s : ℂ, 0 < s.re → s.re < 1 → DirichletCharacter.LFunction χ s = 0 → s.re = 1 / 2

end Certified

-- Which file defines `RiemannHypothesis`: it must be Mathlib's, not a local copy.
open Lean in
#eval show CoreM Unit from do
  let env ← getEnv
  match env.getModuleIdxFor? ``RiemannHypothesis with
  | some i => logInfo m!"RiemannHypothesis is defined in {env.header.moduleNames[i.toNat]!}"
  | none => logInfo "RiemannHypothesis is defined in this file"

/-- Mathlib's `RiemannHypothesis` is the certified zeta statement, by definition. -/
theorem Certified.riemannHypothesis_iff : RiemannHypothesis ↔ Certified.RiemannZetaZerosOnLine :=
  Iff.rfl

/-- Robin1984's Dirichlet hypothesis is the certified Dirichlet statement, by definition. -/
theorem Certified.robin_dirichlet_iff :
    Robin1984.GRH.DirichletGRH ↔ Certified.DirichletLZerosOnLine := Iff.rfl

/-- Robin's criterion, with the certified zeta statement on the right. -/
theorem Certified.robin_iff :
    (∀ n : ℕ, 5040 < n → Robin1984.robinInequality n) ↔ Certified.RiemannZetaZerosOnLine :=
  Robin1984.robin_inequality_iff_riemannHypothesis

/-- Lagarias's criterion, with the certified zeta statement on the left. -/
theorem Certified.lagarias_iff :
    Certified.RiemannZetaZerosOnLine ↔ Robin1984.LagariasElementaryCriterion :=
  Robin1984.riemann_hypothesis_iff_lagarias_elementary_criterion

#print axioms Certified.robin_dirichlet_iff
#print axioms Certified.robin_iff
#print axioms Certified.lagarias_iff
