import Cramer

/-!
Dudek's explicit short-interval theorem under RH, deduced from the sharper bound
`Cramer.primeInShortInterval_107_of_RH` in `senamakel/cramer-rh`. Written for the Assuming RH
project.

Dudek (2015): under RH, for every `x ≥ 2` there is a prime `p` with
`x - (4/π) √x log x < p ≤ x`.
-/

namespace AssumingRH

theorem dudek_of_RH (hRH : RiemannHypothesis) (x : ℝ) (hx : 2 ≤ x) :
    ∃ p : ℕ, p.Prime ∧ x - 4 / Real.pi * Real.sqrt x * Real.log x < p ∧ (p : ℝ) ≤ x := by
  have hlogx : 0 ≤ Real.log x := Real.log_nonneg (by linarith)
  have hsx : 0 ≤ Real.sqrt x := Real.sqrt_nonneg x
  have hpi : 0 < Real.pi := Real.pi_pos
  have hpos : 0 ≤ 4 / Real.pi * Real.sqrt x * Real.log x := by positivity
  obtain ⟨y, hy⟩ : ∃ y, y = x - 4 / Real.pi * Real.sqrt x * Real.log x := ⟨_, rfl⟩
  rw [← hy]
  rcases lt_or_ge y 2 with h | h
  · exact ⟨2, Nat.prime_two, by exact_mod_cast h, by exact_mod_cast hx⟩
  · obtain ⟨p, hp, h1, h2⟩ := Cramer.primeInShortInterval_107_of_RH hRH y h
    refine ⟨p, hp, h1, ?_⟩
    have hyx : y ≤ x := by rw [hy]; linarith
    have h3 : Real.sqrt y ≤ Real.sqrt x := Real.sqrt_le_sqrt hyx
    have h4 : Real.log y ≤ Real.log x := Real.log_le_log (by linarith) hyx
    have hlogy : 0 ≤ Real.log y := Real.log_nonneg (by linarith)
    have h5 : Real.sqrt y * Real.log y ≤ Real.sqrt x * Real.log x :=
      mul_le_mul h3 h4 hlogy hsx
    have hc : (107 / 100 : ℝ) ≤ 4 / Real.pi := by
      rw [le_div_iff₀ hpi]
      nlinarith [Real.pi_lt_d2]
    have h6 : 107 / 100 * (Real.sqrt y * Real.log y) ≤ 4 / Real.pi * (Real.sqrt x * Real.log x) :=
      mul_le_mul hc h5 (mul_nonneg (Real.sqrt_nonneg y) hlogy) (by positivity)
    have h7 : x = y + 4 / Real.pi * (Real.sqrt x * Real.log x) := by rw [hy]; ring
    have h8 : (p : ℝ) ≤ y + 107 / 100 * (Real.sqrt y * Real.log y) := by
      calc (p : ℝ) ≤ y + 107 / 100 * Real.sqrt y * Real.log y := h2
        _ = y + 107 / 100 * (Real.sqrt y * Real.log y) := by ring
    linarith

end AssumingRH

#check @AssumingRH.dudek_of_RH
#print axioms AssumingRH.dudek_of_RH
