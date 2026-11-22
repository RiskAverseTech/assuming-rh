# Releasing

How to cut a version that people can cite.

## One-time setup: a DOI through Zenodo

Zenodo archives each GitHub release and gives it a DOI. It only archives releases made after it is switched on, so do this before the first release.

1. Sign in at zenodo.org with the GitHub account that owns the repository.
2. Open the GitHub page in the Zenodo account settings and switch on `RiskAverseTech/assuming-rh`. An organization owner may have to approve Zenodo's access first.
3. The file `.zenodo.json` in this repository tells Zenodo the title, creator, license and description to use.

## Each release

1. Make sure `main` is green: `npm run validate`, `npm test`, `npm run build`, `npm run check-copy`.
2. Update `CHANGELOG.md`, and the version and date in `CITATION.cff` and `package.json`.
3. Create a GitHub release with the tag `vX.Y.Z` from `main`, and paste that version's changelog section as the notes.
4. Zenodo picks the release up within a few minutes and assigns a DOI. Add the "concept" DOI (the one that always points to the latest version) to `CITATION.cff` as `doi:` and to the "How to cite" section of the README.

## Version numbers

- Minor (`0.2.0` to `0.3.0`): entries added or statuses changed.
- Patch (`0.2.0` to `0.2.1`): corrections that change no status.
- `1.0.0` is reserved for the first release in which a meaningful share of entries is human-checked.
