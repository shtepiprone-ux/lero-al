# Task 765 — Revision 1 / Revision 1.2: P3′ measured false, P3″ closes the control

**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.** Continues
`docs/sessions/2026-08-24-task765-runtime-motion-radius-tokens-blocked.md`, which records only the original
`BLOCKED` disposition and stops before P3′ and P3″ existed.

**Authorship, stated up front.** This log is **compiled by the orchestrator from the retained transcripts**, not
written by the executor session. Every value below was read out of a file under
`docs/sessions/evidence/task765/`; nothing here is reconstructed from memory or inferred. Where a transcript does
not say something, this log does not say it either.

## 1. What changed since the `BLOCKED` log

| Step | Outcome |
|---|---|
| Kickoff `REVISION 1 — P3′` (orchestrator) | Draft 1's P3 replaced: move `--motion-duration-slow: 300ms` from `:root` into `@theme inline`, consumer untouched, rebuild, expect the gate to redden on the unresolved **owned** reference. |
| Kickoff `REVISION 1.1` (orchestrator, documentation only) | Made that handoff executable: exact I0R worktree, §9.0R precedence over §9.0, attestation redirected to `phase6-platform-attestation.txt`, exhaustive execution order, `.git/index.lock` preflight. |
| Executor session, phase 6 | Ran P3′. **It did not redden.** |
| Executor session, phase 7 | Built and ran **P3″** through the gate's documented input seam. **It reddened, exactly as required.** |
| Kickoff `REVISION 1.2 — P3″ addendum` (orchestrator) | Records all three plant forms, closes AC9.3-AC9.5, ends executor scope. |

## 2. P3′ — executed, and measured false

Transcripts: `phase4/p3prime-build.txt`, `phase4/p3prime-check-css-vars.txt`, `phase4/p3prime-revert-proof.txt`.
Platform header on each: `EXECUTION_PLATFORM=win32`, `NODE_VERSION=v22.22.3`,
`CWD=C:\Claude_Code_Projects\lero-al`.

- `npm.cmd run build` — `EXIT_CODE=0`.
- `npm.cmd run check:css-vars` — verbatim:

  ```
  🔍  check:css-vars — owned custom properties (globals.css @theme/@theme inline/:root): 264
      Arm A (shipped CSS) — owned names referenced: 84
      Arm B (src/**/*.{css,tsx,ts}, excl. globals.css) — owned names referenced: 67
      Dynamic var() construction sites: 8 raw, 0 in-class (prefix could name an owned token)

  ✅  check:css-vars — 0 violations, 0 in-class dynamic sites.
  EXIT_CODE=0
  ```

- Revert proof — real `git diff` vs `phase4/clean-post-edit.diff`: `4987` bytes both sides,
  `BYTE-IDENTICAL (raw byte-array comparison): True`, `EXIT_CODE=0`.
- `phase6-platform-attestation.txt` and the six `phase6-final-*` transcripts: all `EXIT_CODE=0`.

**Why it failed, and whose defect it is.** Ownership behaved exactly as Revision 1 predicted — `owned=264`, so
`@theme inline` names are owned and `classifyReferences:468` did **not** skip the reference. The third clause of the
premise was wrong: the declaration **still shipped**. Revision 1's §3.3R generalized "`@theme inline` emits no
custom property into the bundle" from two measured rows (`--duration-slow`, `--ease-standard`, 0 declarations each)
— but those two ship nothing because **nothing references them**; Tailwind tree-shakes unused theme values. Moved
there while still referenced, `--motion-duration-slow` was still emitted, so nothing dangled.

This is the orchestrator's own instance of the standing failure mode recorded against 700 and 702: **a derived claim
about a mechanism, published as a measurement.** Draft 1's P3 was the kickoff author's; P3′ was the orchestrator's.
Both are retained in the kickoff — §3.3, §3.3R's correction block, §9.0R's phase table, §9.4R's superseded banner,
and §14's "author predictions vs measurements" row — and neither is deleted or softened.

## 3. P3″ — the control that closed it

Helper: `phase4/verify-p3doubleprime.mjs` (208 lines). It drives the gate through its own documented
`--css-dir` / `--globals-path` / `--src-dir` inputs — the same seam `check-css-var-resolvability.mjs`'s
`--verify-gate` self-test uses for all eight of its own plants and controls (`setupTempTree`, `mkdtempSync`).

**Real on every axis that carries meaning:** the real `src/app/globals.css` for ownership, the real `src/` tree
(hence the real `AppImage.module.css` consumer), a copy of the real clean built bundle, and the real target token.
The helper's only `writeFileSync` targets a file inside its own `mkdtemp` directory; every repository path is read
read-only; the temp tree is removed in a `finally` block.

Transcripts: `phase4/p3doubleprime-clean-build.txt`, `phase4/p3doubleprime-plant.txt`,
`phase4/p3doubleprime-real-tree-proof.txt`.

1. **Clean build** — `npm.cmd run build`, Next.js 15.5.18, `✓ Compiled successfully in 33.8s`, `EXIT_CODE=0`.
2. **Pre-mutation census** (fails closed if any clause is false):
   - `census.ownsTarget(real globals.css) = true`
   - `census.declarationSites(copied bundle, pre-mutation) = 1` — in `3c13108dfae01b46.css`
   - `census.bundleVarReferences(copied bundle, pre-mutation) = 1`
   - `census.appImageConsumerRefs(real AppImage.module.css) = 1`
   - `=== census PASSED — proceeding to mutation ===`
3. **Mutation** — `removed declaration text "--motion-duration-slow:.3s;"` from the copied bundle file only.
4. **Post-mutation census** — `declarationSites = 0`, `bundleVarReferences = 1`. Declaration gone, reference
   retained: the target condition, owned + referenced + unshipped.
5. **Nested gate** — `node …/scripts/check-css-var-resolvability.mjs --css-dir <temp> --globals-path <real>
   --src-dir <real>`:

   ```
   🔍  check:css-vars — owned custom properties (globals.css @theme/@theme inline/:root): 264

   ❌  2 unresolved owned var() reference(s):
       Arm A  …/task765-p3doubleprime-…/css/687fc97a2b233821.css:1  var(--motion-duration-slow) — no shipped declaration, no @property registration
       Arm B  src/components/ui/AppImage.module.css:158             var(--motion-duration-slow) — no shipped declaration, no @property registration

   --- gate stderr ---
   ❌  check:css-vars — 2 blocking finding(s). Baseline is 0.

   --- gate exit code: 1 ---
   ```

6. **Assertions** — four `PASS:` lines (exit code 1; header 264; Arm B names the AppImage consumer; at least one
   Arm A violation), then `=== P3″ PLANT CONFIRMED ===`, `TEMP_DIR_REMOVED=true`, helper `EXIT_CODE=0`.

**Two exit codes, not one.** The **nested gate's `1` is the required plant failure**; the **helper's `0` is its
assertion result**, reached only because it observed that `1`. A helper `EXIT_CODE=1` would have meant the plant did
not reproduce.

## 4. Real tree and the final gate set

- `phase4/p3doubleprime-real-tree-proof.txt` — real `git diff src/app/globals.css
  src/components/ui/AppImage.module.css` vs `phase4/clean-post-edit.diff`: `4987` bytes both sides,
  `BYTE-IDENTICAL (raw byte-array comparison): True`, `EXIT_CODE=0`.
- `phase7-platform-attestation.txt` — `EXIT_CODE=0`, `win32`, `v22.22.3`.
- `phase7-final-typecheck.txt` · `phase7-final-build.txt` · `phase7-final-build-storybook.txt` ·
  `phase7-final-check-stories.txt` · `phase7-final-check-design-tokens.txt` · `phase7-final-check-css-vars.txt` —
  each `EXIT_CODE=0`. The final `check:css-vars` reads `owned=264`, Arm A 84, Arm B 67, `0 violations`.

The source implementation is unchanged throughout: §9.2's edit applied, both plants reverted, diff byte-identical.

## 5. What this does and does not prove

**Proves:** `check:css-vars` turns red on its intended condition — an **owned**, **referenced** custom property with
**no shipped declaration** — and names the offending reference on both arms. That is Task 690's regression shape and
the condition R7/AC7 rests on.

**Does not prove:** that the gate detects a deletion from `:root`. It cannot — that mutation un-owns its own
reference before either arm sees it. **The blind spot is unfixed and remains Task 743's**, now with two
reproductions recorded there: 700's last-reference deletion with TSX consumers, and 765's sibling-preserved deletion
with a static `.css` consumer. Task 765 neither fixes it nor is blocked on it.

## 6. Reviewer correction — the cell count does not survive re-derivation

`phase3/comparison-result.json` records `cellsCompared: 111`, and that figure was repeated in the executor session
log, `docs/backlog.md` and the kickoff. **It is not reproducible.** Re-derived by the reviewer directly from
`phase1/capture-baseline.json` and `phase3/capture-post.json`, walking the baseline matrix and looking up each cell
in the post capture:

| Measure | Value |
|---|---|
| stories | 3 (`…listingcard--default`, `…popularlocationsview--default`, `admin-admincompaniesmanager--default`) |
| widths | 6 (320, 375, 390, 768, 1024, 1440) |
| locales | sq/en/uk/it at 320 and 1440; `en` only at 375/390/768/1024 → 12 width-locale combinations per story, 36 in total |
| image cells | **108** (48 + 48 + 12), identical on both sides |
| property comparisons | **324** (108 × 3) |
| mismatches | **0** |
| cells present in baseline but missing from post | **0** |

The substantive AC5 claim holds — post equals baseline string-for-string on all three properties for every captured
cell — and it is verified on the **raw captures**, which are the final evidence for AC5. `comparison-result.json`'s
`cellsCompared` field is **superseded** by this re-derivation; no transcript of the original comparator invocation
was retained, so the 111 cannot be traced. Recorded as review finding **F3 (P2, RESOLVED)**: the evidence artifact
is left untouched, and every document that repeated the figure was corrected in the closure step.

## 7. Orchestrator verdict — ✅ `APPROVED WITH NOTES`, 2026-08-24

Ledger: `docs/reviews/2026-08-24-task765-runtime-motion-radius-tokens.review-ledger.json` — **10/10 primary criteria
`VERIFIED`, 0 open P0/P1/P2**, `handoff.commitPush: ALLOWED`.

**The question §13 scoped, answered:** the documented temporary input-seam control **satisfies Sprint 64 rule 1**.
It spawns the production `scripts/check-css-var-resolvability.mjs` over its own published
`--css-dir`/`--globals-path`/`--src-dir` interface — the same seam the script's `--verify-gate` self-test uses for
all eight of its own plants and controls — with real ownership, the real consumer, a real clean bundle and the real
target token. Nothing is simulated and no substitute parser is involved; the only synthetic element is the location
of the bundle copy.

Findings: **F1**, **F2** (P2, both `RESOLVED`) record the two measured-false author premises; **F3** (P2,
`RESOLVED`) the cell count above; **F4**, **F5** (P3) and **F6** (NOTE) remain open as notes — the `:root`-deletion
blind spot stays Task 743's, A2 was never closed by a compiled-utility diff, and Task 764 still has no archive row.

## 8. State at close

- Task 765: ✅ `APPROVED WITH NOTES`. **No executor action remains**; the next step is the owner's commit and push.
- R1-R8 and R10 closed on retained evidence; R9 closed at AC9.1-AC9.5.
- A fourth plant would be a scope change requiring a new owner decision, not a reviewer's request.
- Nothing committed or pushed. `src/**`, `scripts/**` and the retained evidence tree are unmodified by the
  Revision 1.2 documentation edit.
