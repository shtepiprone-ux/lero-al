# Task 748 REWORK — orchestrator review evidence, round 2 (2026-08-13)

**Status: NOT COMMITTED** — `git ls-files` returns 0 here and `git status` shows `??`, so a clone of
this repository does not contain this folder. Non-ignored is a precondition, not the goal; staging
would clear the `??` marker and still put nothing in a clone. Only a commit does that. The same is
true of the round-2 ledger and of `../2026-08-13-task748-rework/` — recorded as finding **G8**, which
is charged to the reviewer's own artifact set as much as to the executor's.
By contrast the round-1 folder `../2026-08-13-task748/` IS committed (14 files, `ce22b1b5e`).

Reviewer: Opus. Subject: the uncommitted Task 748 REWORK change set on
`task/q0-ci-rendered-locale-split`, base `ce22b1b5ee8e7e78f5923b77c56f7fc485ac6522`
(docs-only on top of the parent's I0 `d3ffd6d6c…`, so `src/` content is unchanged from it).

Round 1 evidence is at `../2026-08-13-task748/`, retained and still valid, with one
self-correction appended (see G3 below and that folder's README).

| Artifact | Establishes |
|---|---|
| `rr1-branch-equivalence.mjs` / `.txt` | **RR1 is correct.** The real `className` expressions from both trees, evaluated with the project's own `cn()`, across all four branches. Over-budget: byte-identical. Under-budget: clean utility→module swap. Exit 0. |
| `g1-gate-blindness-probe.mjs`, `g1-gate-blindness.txt` | **G1.** The submitted RR4 harness, byte-identical except the RR1 fix is reverted in the two `E*b` after-side expressions. A full F-A regression is reported as `DELTA`, forgiven by the id-keyed whitelist, and the gate exits **0** with a summary line identical to the passing run. |
| `g3-destructive-var-chain.txt` | **G3.** Why the PerfDevOverlay Part B witness reads `rgb(0, 0, 0)` on both sides: `--destructive` → `--brand-900` → `--mantine-color-brand-9`, which MantineProvider injects at runtime and which is absent from `.next/static/css`. Also corrects the round-1 reviewer artifact's placeholder red. |
| `g4-fixture-vs-real-classlist.mjs` / `.txt` | **G4.** The comparator's Part B BEFORE fixture carries `text-foreground` and `hover:bg-muted`, which real tailwind-merge deletes — contradicting the "byte-identical … not invented" claim at `real-before-after-comparator.mjs:38-40`. Exit 1. Explains why the measured value is nevertheless right, and why that is luck the fixture does not encode. |
| `state-audit.txt` | Census `TOTAL 0`; `git diff src/app/globals.css` empty; backlog 80 lines; the executor did not touch the round-1 reviewer artifacts; `aria-expanded` absent from base-ui's Button; `@custom-variant dark (&:is(.dark *))` with no `.dark` toggle anywhere in `src/`. |

## Not re-run by the reviewer

`npx vitest` and `npm run build` still cannot execute from the reviewer's Linux bridge
(`node_modules` holds Windows-built rollup/lightningcss bindings). The executor's native
transcripts — 1347/1347, portal 4/4, build exit 0 at 619 kB, `check:review-ledger` 2/2 — are
carried, not independently verified. `check:mojibake` and `check:review-ledger --file` were
re-run here and are clean.

The executor's own `real-before-after-comparator.mjs` was not re-run here either: it hardcodes
`C:/Claude_Code_Projects/lero-al-i0-d3ffd6/…`, an absolute machine-local path outside the
repository and outside this bridge's mount, so it is reproducible only on the machine holding that
export at that exact location (finding G5).

## Reviewer corrections

Two errors in this review's own first issue, both raised by the owner and both accepted:

1. **G3 was graded P1 and should be P0.** It defeats RR3/AC3 directly — a P0 criterion of the
   rework contract — so `openP0: 0` alongside `RR3: UNVERIFIED` was internally inconsistent. The
   ledger now reads `openP0: 1`.
2. **G5 asserted the I0 export had been deleted. That was unfounded.** This bridge mounts only
   `C:\Claude_Code_Projects\lero-al`, so no sibling directory is observable from it; a failing
   `ls` was evidence of the mount boundary, not of a deletion. The owner confirms both
   `…\lero-al-i0-d3ffd6\storybook-static` and `…\lero-al-i0-d3ffd6\.next\static\css` exist.
   The real finding is fresh-clone reproducibility and the external absolute path — a narrower and
   more accurate claim than the one first filed. Reading a tool's scope limit as a fact about the
   world is the same error class this review has been charging against the executor, and it is
   recorded here for the same reason.

3. **RR6 was graded VERIFIED on the relocation out of `.screenshots/` alone.** Its criterion (AC6)
   is "resolves from a fresh clone", which untracked files cannot satisfy, so the requirement was
   not merely unproven — it was false. RR6 is now `UNVERIFIED` with finding **G8**. AC6's own second
   clause said "staged, not `??`"; that was weaker than its first clause and should have read
   "committed".

A fourth correction, carried from round 1 and already applied: `cascade-repro.mjs` used a
**placeholder** `--destructive`; the real chain resolves to `#8E322B`. See `g3-destructive-var-chain.txt`.
