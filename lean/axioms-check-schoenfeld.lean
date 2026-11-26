import Schoenfeld
open Schoenfeld
#check @Schoenfeld.schoenfeld_of_RH
#print axioms Schoenfeld.schoenfeld_of_RH
#print axioms Schoenfeld.schoenfeldPi_of_RH
#check @Schoenfeld.piBound_of_RH
#print axioms Schoenfeld.piBound_of_RH
#print axioms Schoenfeld.psiBound_of_RH
#print axioms Schoenfeld.thetaBound_of_RH
#print Schoenfeld.SchoenfeldPi
#print Schoenfeld.PiBound
open Lean in
#eval show CoreM Unit from do
  let env ← getEnv
  match env.getModuleIdxFor? ``RiemannHypothesis with
  | some i => logInfo m!"RiemannHypothesis is defined in {env.header.moduleNames[i.toNat]!}"
  | none => logInfo "local"
