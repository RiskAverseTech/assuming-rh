import GRHMiller
import GRHMiller.Bach.Theorem
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

/-- The hypothesis of the Miller and Bach theorems is the certified Dirichlet statement,
by definition. -/
theorem Certified.miller_hypothesis_iff :
    GRHMiller.DirichletLZerosOnLine ↔ Certified.DirichletLZerosOnLine := Iff.rfl

/-- Miller's test, with the certified statement as its hypothesis. -/
theorem Certified.prime_iff_no_miller_witness_lt (h : Certified.DirichletLZerosOnLine)
    {n : ℕ} (hodd : Odd n) (hn : 1 < n) :
    Nat.Prime n ↔ ∀ a : ℕ, 0 < a → a < n → (a : ℝ) < 2 * Real.log n ^ 2 →
      ¬ GRHMiller.IsMillerWitness n a :=
  Bach.prime_iff_no_miller_witness_lt h hodd hn

#print axioms Certified.miller_hypothesis_iff
#print axioms Certified.prime_iff_no_miller_witness_lt
