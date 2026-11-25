import GRHMiller
import GRHMiller.Bach.Theorem

/-!
Least quadratic non-residue below `2 (log p)^2`, deduced from Bach's theorem as formalized in
`amrehan/grh-miller` (`Bach.bach_char`). Written for the Assuming RH project.
-/

open GRHMiller

namespace AssumingRH

theorem least_quadratic_nonresidue_lt (hGRH : DirichletLZerosOnLine) (p : ℕ) [Fact p.Prime]
    (hp2 : p ≠ 2) :
    ∃ n : ℕ, 0 < n ∧ (n : ℝ) < 2 * Real.log p ^ 2 ∧ ¬ IsSquare (n : ZMod p) := by
  have hpne : NeZero p := ⟨(Fact.out : p.Prime).ne_zero⟩
  have hF : ringChar (ZMod p) ≠ 2 := by rw [ZMod.ringChar_zmod_n]; exact hp2
  set ψ : DirichletCharacter ℂ p := (quadraticChar (ZMod p)).ringHomComp (Int.castRingHom ℂ)
    with hψ
  have hψ1 : ψ ≠ 1 := by
    intro h1
    apply quadraticChar_ne_one hF
    refine MulChar.ext fun a ↦ ?_
    have := congrArg (fun χ : DirichletCharacter ℂ p ↦ χ a) h1
    simp only [hψ, MulChar.ringHomComp_apply, MulChar.one_apply_coe] at this
    rw [MulChar.one_apply_coe]
    rw [eq_intCast, Int.cast_eq_one] at this
    exact this
  by_contra hall
  push_neg at hall
  have key : ∀ n : ℕ, 0 < n → (n : ℝ) < min (2 * Real.log p ^ 2) (p : ℝ) → ψ n = 1 := by
    intro n hn0 hn
    have hlt : n < p := by exact_mod_cast lt_of_lt_of_le hn (min_le_right _ _)
    have hne : (n : ZMod p) ≠ 0 := by
      intro h
      rw [ZMod.natCast_eq_zero_iff] at h
      exact absurd (Nat.le_of_dvd hn0 h) (not_le.mpr hlt)
    have hsq := hall n hn0 (lt_of_lt_of_le hn (min_le_left _ _))
    have h1 : quadraticChar (ZMod p) n = 1 := (quadraticChar_one_iff_isSquare hne).mpr hsq
    simp only [hψ, MulChar.ringHomComp_apply, h1, map_one]
  have hb := Bach.bach_char hGRH ψ hψ1 (x := min (2 * Real.log p ^ 2) (p : ℝ)) key
  have hp_lt : (p : ℝ) < 2 * Real.log p ^ 2 := by
    rcases min_choice (2 * Real.log p ^ 2) (p : ℝ) with h | h
    · rw [h] at hb; exact absurd hb (lt_irrefl _)
    · rwa [h] at hb
  obtain ⟨a, ha⟩ := FiniteField.exists_nonsquare hF
  have ha0 : a ≠ 0 := by
    rintro rfl
    exact ha ⟨0, by simp⟩
  have hval : ((a.val : ℕ) : ZMod p) = a := ZMod.natCast_zmod_val a
  have hvpos : 0 < a.val := Nat.pos_of_ne_zero (fun h => ha0 ((ZMod.val_eq_zero a).mp h))
  have hvlt : ((a.val : ℕ) : ℝ) < 2 * Real.log p ^ 2 :=
    lt_trans (by exact_mod_cast ZMod.val_lt a) hp_lt
  exact ha (hval ▸ hall a.val hvpos hvlt)

end AssumingRH

#print axioms AssumingRH.least_quadratic_nonresidue_lt
