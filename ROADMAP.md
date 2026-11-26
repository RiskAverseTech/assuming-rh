# Roadmap: what would make this more valuable

A running list. Items move up as they get done. New ideas are added at the bottom of "Ideas" and promoted when they look worth doing. Last updated 25 November 2026.

## Done

- **A "Still waiting" view.** Entries the announced proof does not finish, grouped by which L-functions a future proof would have to reach.
- **Random audit.** 15 entries checked independently against their papers.
- **"What would move next".** The Still waiting page counts how many waiting entries each further result (Dedekind zeta functions, then Hecke, then Artin L-functions) would finish.
- **Full arXiv screen.** Every arXiv abstract that names the hypothesis has been screened and 816 papers opened. The Method page says what this does and does not cover.
- **Links between entries.** A `rests_on` field for real dependencies (recorded by hand for a first 22 entries), automatic related links from the notes, reverse links on every entry page, and a Connections page listing the results other entries point to most.
- **Help check page.** A ranked list of the entries most worth a human check (where a second, independent AI reading of the paper disagreed with ours), a report form for people who check an entry, and the second reading published as data.
- **Software caveats page.** Where PARI/GP, SageMath and Magma assume GRH, and why the announced proof does not remove that for class groups.
- **Reference list sweep.** Papers cited by the papers already read, scanned in full text.
- **Seven Lean-verified entries.** Robin's and Lagarias's inequalities, Miller's test, the least quadratic non-residue bound, the Lindelöf hypothesis, Cramér's prime gap bound and Dudek's short-interval theorem: existing formalizations were built from source and checked here, and short deductions were written for this project. Details in `lean/README.md`.
- **Journal references.** Published references and DOIs in place of "Preprint" where they could be confirmed.

## Next

1. **First human-checked entries.** Even a handful signed off by a named number theorist changes how the whole dataset is read. Nothing else on this list matters as much.
2. **More Lean proofs of the implications.** Seven entries are Lean-verified, built from existing formalizations, with short deductions written for this project. Next candidates are entries that follow from a bound already formalized (for example other consequences of Bach's bound), and the statement that GRH for Dirichlet L-functions gives the Riemann hypothesis for every abelian number field. The hypotheses of the five have been matched in Lean to the statement the proof was certified against; joining them to the proof in one build needs the full archive. Also finish the full Comparator check, which ran out of time here; a second checker (nanoda) has accepted the Robin1984 proofs.
3. **More dependencies between entries.** The first links are in. Most real dependencies (which results rest on effective Chebotarev, on Hooley's method, on the least non-residue bound) are still unrecorded and need reading the proofs.
4. **Make it citable.** Tagged releases, a changelog, a citation file and a DOI through Zenodo, so a paper can cite a fixed version.
5. **Wider coverage through citations.** Sweep the papers that cite the key sources (Bach, Lagarias and Odlyzko, Hooley) in place of keyword searches, which missed the classics.

## Ideas

- **Coverage per claim.** A second proof of GRH has been announced by other authors. Store what each claim covers as data, so the site can show an entry's status under each claim and update at once if a claim is withdrawn or a wider one appears.
- **What software can drop its caveat.** Computer algebra systems mark some results as "correct assuming GRH" (class groups, unit groups, some primality and factoring routines). List which of those caveats the announced proof would remove and which it would not. Most class group computations rest on class group characters, so they would stay conditional, which is worth saying clearly.
- **The weakest hypothesis each proof uses.** Some results need far less than the full hypothesis, for example only the absence of a zero very close to 1. Recording that shows what partial progress would already give.
- **The unconditional state of the art next to each entry.** For example the best known bound without any hypothesis beside the conditional one, so a reader sees how much the proof would improve.
- **Formal statements for every entry**, and where possible the statement in Lean.
- **A change feed.** A page and feed listing status changes, new entries and corrections, so people can follow without watching the repository.
- **Check against the Lean development itself.** When the archive has a license, confirm that each "unlocked" entry needs nothing beyond the statements it actually proves.
