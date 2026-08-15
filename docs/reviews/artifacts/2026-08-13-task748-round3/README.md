# Task 748 REWORK2 — orchestrator review evidence, round 3 (2026-08-13)

**Status: NOT COMMITTED** — `git ls-files` returns 0 here. The owner's docs-only commit closes that,
as `647b95adf` did for rounds 1–2.

Reviewer: Opus. Subject: the uncommitted REWORK2 change set on `task/q0-ci-rendered-locale-split`,
base `647b95adf`. Verdict: **APPROVED WITH NOTES**. Ledger:
`../../2026-08-13-task748-rework2-evidence-apparatus.review-ledger.json`.

| Artifact | Establishes |
|---|---|
| `rw1-signature-gate-adversarial.txt` | **G1 closed, beyond the executor's own proof.** Four reviewer-authored mutations — a missing expected delta, an extra delta, a missing module class, a lingering overlay utility — each reddens with the correct diagnosis and exit 1, while the unmutated tree exits 0. The whitelist is signature-keyed and bidirectional, not id-keyed. |
| `state-audit.txt` | `src/` untouched this round (mtimes predate the session; RR1/RR2 lines intact; `globals.css` diff 0; census `TOTAL 0`). `git ls-files` counts for every cited path. `brand[9]` = `#8E322B` = the comparator's injected constant. Arithmetic reconciliation of the two gate numbers whose transcripts were not retained. |

## What the reviewer re-ran

Both gate scripts (real tree and the executor's probe), four adversarial mutations, the census,
`git diff src/app/globals.css`, `check:mojibake`, `check:file-integrity`,
`check:review-ledger --file`, and the `git ls-files` sweep. The comparator itself was not re-run —
it needs Playwright and the I0 export, neither reachable from the reviewer's bridge — so its three
result JSONs were audited for content, mtime ordering against the script, and internal consistency
instead.

## Why the un-transcripted gates are still supported

`npm run build`, `npm run typecheck` and `npx vitest` cannot run from the reviewer's bridge
(Windows-built rollup/lightningcss bindings on a Linux mount). They are nevertheless sound this
round by construction: **no `src/` file changed** — verified by mtime and by the RR1/RR2 lines being
byte-intact — so a docs-and-scripts-only round cannot move build output or test results, and the
round-2 ledger's carried figures remain valid. Likewise no ledger file changed, so the repo-wide
`check:review-ledger` status is unchanged from its round-2 baseline; the reviewer re-ran `--file`
against the only ledger under review and it passes.

## Reviewer cleanup owed to the owner

The four adversarial mutations were run as temporary copies inside
`docs/reviews/artifacts/2026-08-13-task748-rework/`. The bridge cannot delete files, so they were
moved to **`docs/reviews/artifacts/_to_delete/`** (`adv-drop-expected.mjs`, `adv-extra-class.mjs`,
`adv-module-missing.mjs`, `adv-overlay-lingers.mjs`). Please delete that folder — it is reviewer
scratch, not evidence. The executor's folder is otherwise untouched by the reviewer.
