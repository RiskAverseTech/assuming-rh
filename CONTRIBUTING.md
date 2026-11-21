# Contributing

Corrections matter more than new entries. If you know one of these results well, checking its entry is the most useful thing you can do.

## Suggest a correction

Open the entry on the site and use "Suggest a correction", or open a correction issue in this repository. Say what is wrong and, if you can, point to the theorem or section of the paper that settles it.

## Add or edit an entry

1. Copy an existing file in `data/theorems/` and rename it `<slug>.yaml`. The `id` field must equal the file name without `.yaml`.
2. Fill in the fields. The schema is `schema/theorem.schema.json`.
3. Run the checks:

```bash
npm run validate
```

```bash
npm test
```

4. Open a pull request. One theorem per file. Small pull requests are reviewed faster.

## Classifying an entry

- Read the paper's own statement of its hypothesis, then look at which L-functions the proof really uses. "GRH" in a title can mean Hecke or Dedekind L-functions in the proof.
- List every hypothesis in `hypotheses_required` using the taxonomy codes in `data/meta/hypotheses.yaml`.
- Set `status` from the codes:
  - `unlocked` only if every code is covered (`RH`, `GRH-Dirichlet`).
  - `partial` if a named special case goes through. Explain it in `status_note`.
  - `still-conditional` if any code is not covered.
  - `proved-otherwise` if an unconditional proof exists. Name it in `status_note` and cite it. Here `hypotheses_required` records what the older conditional proof used.
- Results about class groups, ray class groups or power residues over a number field usually need `GRH-Hecke`, even when the field is quadratic.
- For a `still-conditional` or `partial` entry, fill in `waiting_on` with the families from `data/meta/waiting.yaml` that the proof uses. This says which L-functions a future proof would have to reach, and it feeds the "Still waiting" page.
- If the proof needs something beyond a Riemann Hypothesis, add `PLUS-EXTRA` and name the assumption in `status_note`.
- Cite the original paper. Fill in `hypothesis_location` (the theorem or section where the hypothesis is used) when you know it.
- Put every doubt in `review.open_questions`. An honest open question is better than a confident guess.

## Review states

- `ai-classified`: drafted by an AI system, not checked by a human. `checked_by` and `checked_on` stay `null`.
- `human-checked`: you have read the primary source and confirmed the statement, the hypothesis variant and the status. Set `checked_by` to the name you want shown and `checked_on` to the date.
- `lean-verified`: the implication is formalized. Set `lean.proved: true` and `lean.path`.

Do not move an entry to `human-checked` on the strength of a survey, an abstract or an AI summary.

## Updating the proof status

Edit `data/meta/proof-status.yaml`, cite a source for the change, and update `last_updated`.

## Style

Plain language. No em dashes in any text. Keep statements short and let the cited paper carry the detail.

## License

By contributing you agree that your data contributions are released under CC BY 4.0 and your code contributions under the MIT License.
