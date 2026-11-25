import Cramer
#check @Cramer.cramer_of_RH
#print axioms Cramer.cramer_of_RH
#print Cramer.CramerGapBound
#print primeGap
#print axioms Cramer.primeInShortInterval_of_RH
#print axioms Cramer.primeGapExplicit_of_RH
#print axioms Cramer.primeInShortInterval_107_of_RH
#check @Cramer.cmsPrimeInterval_of_RH
#print axioms Cramer.cmsPrimeInterval_of_RH
#print axioms Cramer.cmsPrimeGap_of_RH
#print Cramer.CMSPrimeInterval
#print Cramer.PrimeInClosedInterval
open Lean in
#eval show CoreM Unit from do
  let env ← getEnv
  match env.getModuleIdxFor? ``RiemannHypothesis with
  | some i => logInfo m!"RiemannHypothesis is defined in {env.header.moduleNames[i.toNat]!}"
  | none => logInfo "local"
