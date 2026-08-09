# Task 727 — Make the click-shield gate blocking in CI, and fix the contextual N6 exemption

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. **QA profile:** `Q4` Release/Critical Flow.
**Kickoff:** `tasks/Sprints/Sprint_52_kickoff_prompt_Task_727_ClickShield_CI_And_Contextual_N6.md` +
`Sprint_52_Task_727_execution_contract.md` + `Sprint_52_Task_727_rule_compliance_ledger.md`.
**Evidence root:** `.screenshots/task727-evidence/` (14 artifacts, listed in §9). **Closes Sprint 52.**

---

## 1. Task path and status

`tasks/Sprints/Sprint_52_kickoff_prompt_Task_727_ClickShield_CI_And_Contextual_N6.md` —
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

---

## 2. Requirement and acceptance-criteria evidence

| Req/AC | Evidence |
|---|---|
| R1/R2 — contextual predicate, one implementation, both call sites | `scripts/check-click-shield.mjs` — `N6_EXEMPT_PREDICATE_BODY`, a single Node-level string constant reconstructed via `new Function(...)` inside both `hitTestPage` phase-1 (formerly `:223`) and phase-2 scroll-recheck (formerly `:276`) evaluate closures. Diff inspected directly — neither site retains the unconditional `hit.closest(overlaySelector)` form. |
| R3 — inside-dialog interception is a violation, two-armed live plant | `K5-plant-fail.log` (16/16 `drawer` cells FAIL, naming `mantine-CloseButton-root`/`.mantine-Overlay-root`) → `K6-restore.txt` (post-removal `git hash-object` == pre-plant hash `31397b59e088632810b1597846fe8093cd657a45`, `git status --porcelain` shows only the expected ` M`). |
| R4 — background-page element under a backdrop still clears | `K7-must-still-clear.log`, citing `K4-drawer.log` (16/16 cells, 324 candidates, 0 violations) and `K3-modal.log` (16/16 cells, 380 candidates, 0 violations) — every background candidate behind both real open dialogs clears. |
| R5 — real scenarios, base + Modal + Drawer, not synthetic-only | `K2-base-rerun.log` (base, unchanged), `K4-drawer.log` (AuthSheet/MantineDrawer), `K3-modal.log` (LightboxView/Modal). Each records `dialog present: true` per cell. |
| R6 — every scenario runs the full 16-cell matrix | All three logs above: `Cells: 16` each, 4 locales × 4 viewports, no route-level or manual bypass. |
| R7/R8 — new blocking CI job, owner's exact sequence, log upload `if: always()` | `.github/workflows/governance-pr.yml` new `click-shield` job — diff inspected directly: `npm ci` → Playwright Chromium → `npm run build` → `npm start` (backgrounded) → curl-retry readiness probe → `BASE_URL=http://127.0.0.1:3000 npm run check:click-shield`, no `continue-on-error`, `actions/upload-artifact` step has `if: always()`. |
| R9 — no production-URL merge gate | No such job added; reserved per §14.9.31 doc note, not built. |
| R10 — `--verify-gate` extended, contextual rule covered | `K9-verify-gate.log` — 8/8 cases pass, including the 3 new: inside-`[role="dialog"]` violation, inside-dialog clean, inside-`[role="alertdialog"]` violation. |
| R11 — real defects escalated, not fixed | See §6 — one genuine gate-logic gap found (N6 exemption too narrow, interceptor-only) and **fixed** as part of R1/R2's own scope (not a `src/` product defect); no product defect was found or fixed. |
| R12 — `tsc`/`build` exit 0 | `K9-tsc.log` exit 0, `K9-build-final.log` exit 0. |
| R13 — backlog baseline before first edit, counting gates last | `J0-status.txt` — `git show HEAD:docs/backlog.md \| wc -l` = **89 lines**, read at Checkpoint 0 before any edit. Counting gates: §9, two passes. |
| AC1–AC11 | All satisfied — mapped to the R-rows above; AC2/AC3 detailed in §6, AC4/AC5 in §5, AC11 in §10. |

---

## 3. Current versus required behavior

**Before.** `check-click-shield.mjs`'s N6 exemption (`hit.closest('.mantine-Overlay-root')`) tested only the
*interceptor*, at both hit-test call sites. A real interactive control inside an open Modal/Drawer, intercepted by
that dialog's own backdrop, was silently exempted — the gate reported clean on a modal nobody could use. The gate
ran in no CI workflow and had never hit-tested an overlay state; its `--route=` sweep only ever loaded the
homepage.

**Required and delivered.** The exemption is now contextual: a candidate outside any active
`[role="dialog"]`/`[role="alertdialog"]` may still be cleared by an overlay (backdrop *or* dialog panel); a
candidate inside one is never exempt. Three real scenarios (base, AuthSheet Drawer, LightboxView Modal) drive the
running production build across the full 16-cell matrix each, with DOM proof the dialog was open. A new blocking
CI job runs the owner's exact sequence.

**Negative flows (kickoff §11 applicability table):**

| Negative flow | Applicable | Result |
|---|---|---|
| A scenario never opens the overlay and reports clean | Yes (A2) | Did not occur in the final runs — `openScenarioOverlay` hard-fails (exit 2) any triggered scenario whose dialog doesn't appear; both real scenarios recorded `dialog present: true` on all 32 triggered cells |
| The fix makes every open modal a violation | Yes (R4) | Occurred **first**, then fixed within scope — see §6; final state is 0 false violations across 704 real-scenario candidates |
| Only one of the two call sites is fixed | Yes | Did not occur — one shared predicate string, both sites verified by direct diff inspection |
| The job is added with `continue-on-error` | Yes | Did not occur — absent from the new job |
| Wait-for-ready is a fixed sleep | Yes | Did not occur — retried `curl` probe, tested standalone against the live server (exit 0, "ready after 1 attempt(s)") |
| A real defect is fixed inside this task | Yes (R11) | No product (`src/`) defect found or fixed. One gate-logic gap was found and fixed — in scope, since R1/R2 is precisely "fix the gate's exemption logic" (§6) |
| Locale / i18n regression | No | No `messages/*` change; `check:i18n` run as a guard, PASSED (2218/2218/2218/2218) |
| Visual / layout regression | No | No `src/` change |

---

## 4. The three real scenarios

- **`base`** — unchanged homepage sweep. `K2-base-rerun.log` is byte-identical (diffed directly) to the pre-change
  `I1-baseline.log`: 16 cells, 208 checked, 0 violations, 4 transient-cleared, in both runs.
- **`drawer`** — `AuthSheet` (`src/modules/auth/components/AuthSheet.tsx`), a real `MantineDrawer`, opened via the
  header Favorites `ActionIcon` (`header button:has(svg.lucide-heart)`) — the one HeaderActions trigger visible at
  every click-shield viewport while logged out; the header's own login/register `Button`s are `visibleFrom="md"`
  and invisible at 320/375/390. Final: `K4-drawer.log`, 16 cells, 324 candidates, 0 violations, `dialog present:
  true` on every cell.
- **`modal`** — `LightboxView` (`src/modules/listings/components/LightboxView.tsx`), the **only** production
  Mantine `Modal.Root`/`Modal.Content` (`role="dialog"`) reachable in this app — confirmed by repository search:
  `MantineModal` (`design-system/mantine/patterns/MantineModal.tsx`) has zero production consumers, only
  story/test references. Not reachable from the homepage, so this scenario targets
  `/[locale]/listings/11-mr7ucly4`, a real listing verified live 2026-08-09 (`.listing-gallery` present, cover
  opens the lightbox). Reuses the Task 612 precedent (`scripts/task612-qa-listinggallery-lightbox-portal.mjs`) for
  driving this exact component. The Task 612 fixture slug (`test-7-molyl9c8`) no longer resolves — confirmed 404
  live 2026-08-09, a month after that script was written — so the new slug is env-overridable
  (`CLICK_SHIELD_MODAL_SLUG`) for whoever next needs to replace it. Final: `K3-modal.log`, 16 cells, 380
  candidates, 0 violations, `dialog present: true` on every cell.

Every triggered-scenario cell records `dialogPresent` from a direct `document.querySelector('[role="dialog"],
[role="alertdialog"]')` check performed after the trigger click and before hit-testing — not inferred from "the
click didn't throw" (A2). `openScenarioOverlay` hard-fails (process exit 2, distinct from a 0-violation "pass")
any cell where the trigger is missing/unclickable or no dialog appears within 5s.

---

## 5. A gate-logic gap the live Drawer scenario exposed (R11 disposition)

Driving the real `drawer` scenario with only the backdrop-vs-dialog check (`hit.closest('.mantine-Overlay-root')`
vs `el.closest(dialogSelector)`) produced **136 false violations across 324 candidates** — every one a
background-page element (`HeroSearch` inputs/buttons, the mobile bottom nav, header controls) that the Drawer's
own **panel content** (not the semi-transparent `.mantine-Overlay-root` backdrop div) visually painted over. This
is exactly the "turns every open modal red" failure R4/N6 exist to prevent, from a source the kickoff's
`.mantine-Overlay-root`-only framing didn't name: a real dialog's panel legitimately owns everything it covers,
not only its backdrop.

**Disposition: fixed, not escalated.** This is not a product (`src/`) defect — AuthSheet behaves exactly as a
modal/drawer should; background content becoming unreachable while it is open is the intended behavior, identical
in kind to the already-allowed backdrop case. It is a gap in the *gate's own* detection logic, and R1/R2's own
scope is "fix the gate's exemption logic" — widening the interceptor side of the same predicate to match either
the backdrop or the active dialog's own content (candidate-side restriction unchanged) is squarely in scope, not a
`src/` fix requiring escalation under R11. Re-run after the widen: `K4-drawer.log`, 0/324 violations, 16/16 cells
clean.

This is recorded here rather than silently folded into "the fix" because A2 explicitly pre-declares this class of
finding as the most likely outcome of driving a real scenario for the first time, and the rule-compliance ledger's
D32/M1 clauses require the control to demonstrably detect (and here, initially over-detect) its own effect before
being trusted.

---

## 6. R3/AC2 — the two-armed live plant (inside-dialog interception)

The exact allowed write set for this task (`Sprint_52_Task_727_execution_contract.md` §1) does not include any
`src/` file, so the plant could not be a temporary edit to `AuthSheet.tsx` (the pattern other tasks use for
Storybook-story probes). Instead, a runtime DOM injection was added to `check-click-shield.mjs` itself (in the
allowed write set) behind a `--plant=inside-dialog` flag, run, evidenced, then removed entirely.

**First attempt failed silently at some viewports.** Appending the shield `<div class="mantine-Overlay-root">`
inside the dialog's own DOM subtree produced inconsistent results (12/16 cells failed, not 16/16) —
`document.elementFromPoint` at the target's computed center returned the target's own child (a `<path>` inside its
icon `<svg>`), not the shield, at the cells that stayed green. Root cause, isolated with a standalone probe:
Mantine's Drawer/Modal content animates via CSS `transform`, and a `transform`-bearing ancestor becomes the
containing block for `position:fixed` **descendants** too, not only `absolute` ones — a `fixed` shield appended
inside the (transformed) dialog silently had its coordinates reinterpreted relative to that ancestor instead of
the viewport, landing it away from the button it was sized to cover.

**Fix: append the shield to `document.body`** instead of inside `dialog` — no transform in its containing-block
chain, so its `position:fixed` coordinates stay viewport-relative, matching the target rect (also measured
viewport-relative via `getBoundingClientRect()`). Confirmed via the same standalone probe before touching the real
plant code.

**Result, `K5-plant-fail.log`:** 16/16 `drawer` cells FAIL after the fix, each naming the blocked control
(`mantine-Drawer-close`/`mantine-CloseButton-root`, the drawer's own close button) and the interceptor
(`div.mantine-Overlay-root`) — exactly "a modal whose own backdrop covers its own button", the shape the kickoff's
§3.2 describes. Exit code 1 (not the empty-candidate exit 2 — real candidates were checked and a real violation
was found).

**Removal, `K6-restore.txt`:** the `--plant=inside-dialog` flag and its injection block were deleted entirely from
`check-click-shield.mjs`. `git hash-object scripts/check-click-shield.mjs` post-removal ==
`31397b59e088632810b1597846fe8093cd657a45`, the hash captured immediately before the plant code was first added
(both states already carried this task's permanent R1/R2/scenario work — the hash comparison isolates the
plant-specific residue, not a comparison against the pre-task `git HEAD` state, which the file legitimately
differs from). `git status --porcelain -- scripts/check-click-shield.mjs` shows only the expected ` M` (permanent
work), nothing plant-related.

---

## 7. CI wiring and its precondition (R7/R8/R9)

`.github/workflows/governance-pr.yml` — new independent job `click-shield` (no `needs`, matching the existing
`rendered-proof`/`homepage-grid`/`locale-leak` pattern): `npm ci` → `npx playwright install chromium --with-deps`
→ `npm run build` → `nohup npm start > server.log 2>&1 &` → a retried-`curl` readiness probe (tested standalone
against the live local server: `server ready after 1 attempt(s)`, exit 0) → `BASE_URL=http://127.0.0.1:3000 npm
run check:click-shield`, no `continue-on-error`, exit code propagated from an unpiped capture (this project's own
evidence-capture rule — Task 709's `EXIT_CODE=0`-beside-real-failures lesson applies to CI scripting too, not only
manual evidence capture) → `actions/upload-artifact` with `if: always()` uploading `click-shield.log` +
`server.log`. YAML validated with `js-yaml` (`jobs: governance, rendered-proof, homepage-grid, locale-leak,
click-shield`).

**Known precondition, empirically confirmed, not yet satisfied.** `npm start` boots cleanly with zero Supabase env
vars, but every request 500s at runtime — verified directly: `.env.local` (gitignored, untracked, confirmed via
`git check-ignore -v` and `git ls-files`) temporarily moved aside, fresh `next start` on a scratch port, `curl` to
`/en` returned `HTTP_CODE=500`, and the server log showed `Error: Your project's URL and Key are required to
create a Supabase client!` thrown from `middleware.js` on the very first request. No workflow in this repository
references any Supabase secret today (`grep -rn "secrets\." .github/workflows/*.yml` returns only
`secrets.GITHUB_TOKEN` in an unrelated workflow) — none of the four pre-existing jobs ever build/start the real
Next.js app (`build-storybook` only), so none of them needed one. The new job is wired to consume
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` as repository secrets by name (`env:` block at the job
level), so it activates the moment those secrets exist, but **adding them is an owner action outside git and
outside this task's write set** — until then, this job will build successfully and then fail at the
wait-for-ready step in real CI (every route 500s). Flagged for Opus/owner, not silently worked around.

**R9.** No production-URL job was added. A post-deploy monitor remains a reserved idea (owner's own OQ2 framing),
not built here.

---

## 8. `--verify-gate` extension (R10/AC8)

Three new synthetic fixtures added (`DIALOG_VIOLATION_PAGE_HTML`, `DIALOG_CLEAN_PAGE_HTML`,
`ALERTDIALOG_VIOLATION_PAGE_HTML`) alongside the five pre-existing ones — flat pages, no CSS transform, so none of
these hit the live-app coordinate-drift caveat from §6 (recorded in the file's own comments so a future live-app
plant against this gate doesn't rediscover it from scratch). `K9-verify-gate.log`: all 8 cases pass, including all
3 new ones — inside-`[role="dialog"]` intercepted by `.mantine-Overlay-root` (FAIL, correctly), the same shape
with no shield (PASS, proving the dialog-context check alone introduces no false positive), and the
`[role="alertdialog"]` equivalent (FAIL) — implemented and self-tested per the owner decision, not claimed as
exercised against production (§3.5: `grep -rc alertdialog src/` = 0, still true, unaffected by this task).

---

## 9. Validation evidence

| # | Command | Result | Artifact |
|---|---|---|---|
| 0 | `git status --porcelain` (pre-write) + `git show HEAD:docs/backlog.md \| wc -l` | clean, baseline **89 lines** | `J0-status.txt` |
| 1 | `npm run build` · `npm start` · `BASE_URL=http://127.0.0.1:3000 npm run check:click-shield` (pre-change) | 16 cells, 0 violations, exit 0 | `I1-baseline.log` |
| 2 | R1/R2 implemented · re-run base | byte-identical to pass 1 | `K2-base-rerun.log` |
| 3 | `--scenario=drawer` (first pass, backdrop-only rule) | 136 false violations — gap found | superseded, not separately artifacted; see §5 |
| 4 | Widen predicate · `--scenario=drawer` | 16 cells, 0 violations | `K4-drawer.log` |
| 5 | `--scenario=modal` | 16 cells, 0 violations | `K3-modal.log` |
| 6 | Background-still-clears synthesis | — | `K7-must-still-clear.log` |
| 7 | `--plant=inside-dialog --scenario=drawer` | 16/16 FAIL, exit 1, named | `K5-plant-fail.log` |
| 8 | Remove plant · `git hash-object` · `git status --porcelain` | hash == pre-plant, path clean | `K6-restore.txt` |
| 9 | `.github/workflows/governance-pr.yml` new job · YAML validated | `js-yaml` parses, 5 jobs listed | inline, see §7 |
| 10 | Wait-for-ready loop, standalone | exit 0, ready after 1 attempt | inline, see §7 |
| 11 | `npm run check:click-shield:verify` | 8/8 pass, exit 0 | `K9-verify-gate.log` |
| 12 | `npx tsc --noEmit` | exit 0 | `K9-tsc.log` |
| 13 | `npm run check:i18n` | exit 0, 2218/2218/2218/2218 | `K9-i18n.log` |
| 14 | `npm run build` (final, after all edits incl. docs) | **exit 0** | `K9-build-final.log` |
| 15 | `npm run check:file-integrity:all` (pass 1, pre-log) | 2076 files clean, exit 0 | `K9-integrity-pass1.log` |
| 16 | `npm run check:mojibake` (pass 1, pre-log) | 2128 files, 0 artifacts, exit 0 | `K9-mojibake-pass1.log` |
| 17 | `npm run check:file-integrity:all` + `check:mojibake` (pass 2, final) | see §10 | `K9-integrity-pass2.log`, `K9-mojibake-pass2.log` |

---

## 10. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-click-shield.mjs` | R1/R2 contextual N6 predicate (shared, both call sites); `SCENARIOS` + `openScenarioOverlay` (R5/R6); `--scenario=` CLI flag; `runChecks()` restructured to iterate scenarios with hard-fail-on-unopened-overlay semantics (A2); `--verify-gate` extended with 3 contextual-rule fixtures (R10). |
| `.github/workflows/governance-pr.yml` | New blocking `click-shield` job (R7/R8), owner's exact sequence, Supabase secrets wired by name (precondition documented, §7). |
| `docs/storybook-governance.md` | New §14.9.31 — same content as this session log, condensed to the file's existing per-task-subsection format. |
| `docs/backlog.md` | Concise current-state update: "Last Session" replaced, Sprint 52 marked closed, task-registry row 727 updated (§12). |
| `docs/sessions/2026-08-09-task727-click-shield-ci-and-contextual-n6.md` | This file. |

No other `src/` file changed. `probe-listing-temp.mjs`, a scratch investigation script used to test the AuthSheet
trigger selector, the fixture slug, and the transform/containing-block hypothesis, was created in the repo root
and deleted before this log was written — absent from `git status --porcelain` throughout §9/§10.

---

## 11. Visual source trace / Canonical UI decision record

Not applicable — no `src/` product file changed, no visible UI artifact added or changed. This is a
verification-gate + CI-infrastructure task; R11 explicitly forbids fixing any real product defect the new
scenarios expose inside this diff (none was found — §5's finding was a gate-logic gap, not a product defect).

---

## 12. Implementation validation notes

- The zero-violation result from the first drawer/modal runs was **not** trusted at face value (A2): every
  triggered cell's `dialogPresent` was checked directly against the DOM, and the drawer scenario's *first* run
  (backdrop-only rule) did in fact surface something — 136 false violations — which was investigated to its root
  cause (§5) rather than dismissed or worked around with a narrower fix.
- The plant's first attempt silently produced inconsistent per-viewport results rather than a clean uniform
  FAIL/PASS split; this was treated as a defect in the plant methodology to root-cause (§6), not accepted as "good
  enough" partial evidence.
- The CI job's Supabase-credential precondition was verified empirically (a real `next start` without env vars,
  observed 500 response and the exact thrown error), not asserted from reading the client-construction code alone.

## 13. Assumptions, deviations, and limitations

- **A1 (dirty worktree) not needed.** `git status --porcelain` was empty at Checkpoint 0 (`J0-status.txt`) — the
  worktree started clean.
- **A2 applied twice** — once for the drawer scenario's first (false-positive) run (§5), once implicitly by
  distrusting a same-cell zero-violation result without DOM proof, which is why `dialogPresent` is checked
  directly rather than inferred.
- **A3 honored.** Session log states plainly that only `role="dialog"` is exercised live; `role="alertdialog"` is
  implemented and self-tested only (§8), matching §3.5's finding, unchanged.
- **Modal scenario fixture is a real, mutable listing**, not a synthetic fixture — `11-mr7ucly4`, verified live
  2026-08-09. This is a deliberate choice (the only real production Modal has no synthetic alternative reachable
  without inventing new seed infrastructure out of this task's scope), but it means the scenario depends on that
  listing continuing to exist with images; env-overridable via `CLICK_SHIELD_MODAL_SLUG` if it stops resolving,
  the same failure mode that already happened once to the Task 612 fixture slug in the month between that task and
  this one.
- **CI job cannot be verified end-to-end from this session** — no access to trigger a real GitHub Actions run, and
  the Supabase-secret precondition (§7) means a real run would fail at readiness today regardless. The job's
  individual pieces (build, start, readiness probe, the gate itself, YAML validity) were each verified locally/
  standalone instead.
- No owner decision was required beyond the quoted §3.1 text; the drawer-scenario false-positive finding (§5) was
  resolved as an in-scope gate-logic fix per R1/R2's own mandate, not escalated as a `src/` defect or treated as
  requiring a new owner decision.

## 14. Opus handoff

Evidence root: `.screenshots/task727-evidence/` (14 artifacts, local-only per D6). Key files for spot-check:
`K2-base-rerun.log` (R4 base-unchanged direction), `K4-drawer.log` + `K3-modal.log` (R5/R6/R4-at-scale),
`K5-plant-fail.log` + `K6-restore.txt` (R3/AC2), `K9-verify-gate.log` (R10/AC8), `K9-build-final.log` (R12).

Questions/risks for review:
1. Confirm the drawer-scenario predicate widening (§5 — interceptor side now matches the dialog's own content, not
   only `.mantine-Overlay-root`) is an acceptable in-scope extension of R1/R2's "contextual rule" mandate, not a
   deviation requiring its own owner sign-off — it was necessary to satisfy R4 as written (a change that reddens
   every open modal fails R4's own acceptance criterion), but it is a real widening of what "the exemption" means
   beyond the kickoff's literal `.mantine-Overlay-root`-only framing.
2. Confirm the Modal scenario's dependency on a real, mutable production listing (`11-mr7ucly4`) is an acceptable
   long-term CI fixture versus requiring a dedicated seed/fixture mechanism — flagged explicitly rather than
   presented as a permanent solution (§13).
3. Confirm the Supabase-secret precondition (§7) is the correct scope boundary — this task wires the job to be
   ready the moment secrets exist, but adding them is out of this task's write set and cannot be done from here.
4. Confirm the plant mechanism (§6 — a temporary CLI flag added to and then fully removed from
   `check-click-shield.mjs`, since no `src/` file was in the allowed write set) is an acceptable substitute for the
   `src/`-file-probe pattern other tasks in this repo use, given the contract's explicit write-set restriction.

## 15. Backlog update

`docs/backlog.md` updated: "Last Session" section replaced (727 supersedes the 733 entry, never appended), the
Sprint 52 summary line shortened and marked closing-pending-review, task-registry row 727 shortened from a
multi-line paragraph to a one-line pointer at this session log. Baseline was **89 lines** (`git show
HEAD:docs/backlog.md | wc -l`, read at Checkpoint 0, `J0-status.txt`). Resulting physical line count: **94 lines**
(`git diff --stat docs/backlog.md`: +13/−8, net +5). **`BACKLOG LIMIT BREACH`** — the file was already over the
~80-line target before this session (89) and this session's edit made it larger (+5) despite shortening the 727
row substantially, because the "Last Session" replacement and the two Sprint-52/task-727 corrections each added
slightly more than they removed. Per protocol, not widened further — flagged for Opus validation/consolidation at
review (same recurring shape as Task 733's identical flag one session prior).

---

## 16. Counting gates — both passes

**Pass 1** (§9, rows 15–16), taken before this log and the backlog update existed: 2076 files integrity-clean
(`K9-integrity-pass1.log`), 2128 text files scanned for mojibake, 0 artifacts (`K9-mojibake-pass1.log`).

**Pass 2** (final, after this log and the backlog update exist): 2077 files integrity-clean (`K9-integrity-
pass2.log`, +1 vs pass 1), 2129 text files scanned for mojibake, 0 artifacts (`K9-mojibake-pass2.log`, +1 vs pass
1). Reconciled to `git status --porcelain`: 4 modified (`.github/workflows/governance-pr.yml`, `docs/backlog.md`,
`docs/storybook-governance.md`, `scripts/check-click-shield.mjs`) + 1 untracked (this session log) = 5 entries; the
scanners' +1 delta is correct because only the untracked session log is a *new* file — the other 4 are
modifications to already-counted files, so the file-count denominator moves by exactly 1, not 5.
