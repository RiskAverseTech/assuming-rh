#!/usr/bin/env bash
# Rebuilds one pinned Lean project and checks the axioms of the theorems this
# repository relies on. Usage: scripts/lean-check.sh <project> [work dir]
# The recipe for each project is in lean/checks.json.
set -euo pipefail
PROJECT="$1"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${2:-$HERE/.lean-work}"
q() { node -e "const p=require('$HERE/lean/checks.json').projects['$PROJECT'];const v=$1;process.stdout.write(Array.isArray(v)?v.join('\n'):String(v??''))"; }

REPO="$(q p.repo)"; COMMIT="$(q p.commit)"; SUB="$(q p.workdir)"
mkdir -p "$WORK"
SRC="$WORK/$PROJECT"
if [ ! -e "$SRC/.git" ]; then git clone --quiet "$REPO" "$SRC"; fi
git -C "$SRC" fetch --quiet origin "$COMMIT" || true
git -C "$SRC" checkout --quiet --detach "$COMMIT"
test "$(git -C "$SRC" rev-parse HEAD)" = "$COMMIT"

OREPO="$(q 'p.overlay&&p.overlay.repo')"
if [ -n "$OREPO" ]; then
  OCOMMIT="$(q p.overlay.commit)"
  OSRC="$WORK/$PROJECT-overlay"
  if [ ! -e "$OSRC/.git" ]; then git clone --quiet "$OREPO" "$OSRC"; fi
  git -C "$OSRC" checkout --quiet --detach "$OCOMMIT"
  test "$(git -C "$OSRC" rev-parse HEAD)" = "$OCOMMIT"
  git -C "$SRC" checkout --quiet -- .
  while IFS= read -r item || [ -n "$item" ]; do
    rm -rf "$SRC/$SUB/$item"
    cp -R "$OSRC/$item" "$SRC/$SUB/$item"
  done < <(q p.overlay.copy)
  node -e "const p=require('$HERE/lean/checks.json').projects['$PROJECT'];require('fs').appendFileSync('$SRC/$SUB/lakefile.toml',p.overlay.append_lakefile)"
fi

cd "$SRC/$SUB"
echo "== $PROJECT at $COMMIT, toolchain $(cat lean-toolchain)"
ok=0
for i in 1 2 3 4 5; do
  if lake exe cache get; then ok=1; break; fi
  echo "cache get failed (attempt $i)"; sleep 15
done
test "$ok" = 1
mapfile -t TARGETS < <(q p.build)
lake build "${TARGETS[@]}"

OUT="$WORK/$PROJECT-axioms.txt"
: > "$OUT"
while IFS= read -r f || [ -n "$f" ]; do
  echo "-- $f" >> "$OUT"
  lake env lean "$HERE/lean/$f" >> "$OUT" 2>&1 || { tail -40 "$OUT"; echo "FAIL: Lean exited with an error on $f"; exit 1; }
done < <(q p.files)
node "$HERE/scripts/check-axioms.mjs" "$PROJECT" "$OUT"
