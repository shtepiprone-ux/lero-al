# Task 832 — `check:click-shield` is red on two harness defects: the AuthSheet drawer scenario never opens, and a sub-pixel viewport edge reads as an interception

Sprint 75 · P2 · QA profile **Q4**

**Status: `READY FOR SONNET` 2026-09-17.** Independent of every other open Sprint 75 task (touches only
`scripts/check-click-shield.mjs`).

## 1. Mode and task type

`IMPLEMENTATION` — a blocking CI gate's harness is corrected. Bundles: **Regression / Critical Flow Coverage** and
**Auth** (read-only: the gate drives the guest AuthSheet, and no auth code changes). No product source changes.

## 2. Objective

`npm run check:click-shield` blocks merge in CI (`governance-pr.yml` job `click-shield`, no `continue-on-error`) and
exits 2 on every run for two reasons that have nothing to do with any PR:

1. the `drawer` scenario's trigger no longer exists (16/16 cells `SCENARIO OVERLAY NEVER OPENED`), so the
   AuthSheet drawer has had **no click-shield coverage** since 2026-09-05;
2. the `base` scenario intermittently reports a footer link as blocked with
   `elementFromPoint returned null inside the viewport`, because the gate treats a point Chromium rounds out of the
   viewport as inside it.

Re-point the drawer scenario at the real guest AuthSheet openers and correct the viewport-edge rule. Neither fix may
weaken the gate: both get planted proof.

## 3. Verified context — measured 2026-09-17 on `HEAD` `c177a0920`

### 3.1 The red runs

`FACT` — `docs/sessions/evidence/task825/90_review2_click-shield.txt` (native `win32`, `next start`,
`CLICK_SHIELD_CI_FIXTURE=1`): modal 16/16 PASS. Drawer: 16/16 `❌ SCENARIO OVERLAY NEVER OPENED — trigger not found:
header button:has(svg.lucide-heart)`. Base: `/it × mobile-320 ❌ FAIL … blocked <a class="FooterView_footerLink__SWOcW …">
"Chi siamo" @ (16,802 64x20) … reason: elementFromPoint returned null inside the viewport`. Summary:
`Interceptions: 1 … Scenario-open failures: 16`, `EXIT_CODE=2`. Earlier runs `24_final_click-shield.txt` and
`52_rev1_click-shield.txt` show the same drawer failure, with the null hit on `/it × mobile-375` instead.

### 3.2 Defect ① — cause measured, not assumed

`FACT` — `scripts/check-click-shield.mjs:169-180`: `trigger: 'header button:has(svg.lucide-heart)'`, with a comment
that the heart "is the ONE control in HeaderActions that opens [AuthSheet] … while logged out".

`FACT` — `src/components/layout/HeaderActions.tsx:28-46` (commit `1b72b26e2`, Task 787, 2026-09-05): the Favorites
heart renders only when `isAuthenticated`. The comment says: "owner "скрізь" decision 2026-09-04: guests never see
Add listing or Favorites … The prior guest branch that opened the auth sheet from a Favorites heart is removed". The
gate runs as a guest, so the selector matches nothing.

`FACT` — the live guest openers of `AuthSheet`:
- ≥ `md` (768px): `HeaderActions.tsx:48-55`, `<Group visibleFrom="md">` with `Button onClick={() => onOpenAuth('login')}`
  labelled `t('nav.login')`. The gate's `desktop-1024` viewport is ≥ 768.
- < `md`: the hamburger `ActionIcon` (`HeaderView.tsx`, `hiddenFrom="md"`, `aria-label={tc('aria_open_menu')}`, lucide
  `Menu`) opens `MobileNavDrawer` (itself a `MantineDrawer`). Its guest `Button onClick={() => openAuth('login')}`
  (`MobileNavDrawer.tsx:100`) calls `onClose()` and then `onOpenAuth(view)` (`:31-34`). The gate's mobile viewports
  are 320/375/390, all < 768.
- Labels (`messages/*.json`): `nav.login` sq `Hyr` · en `Login` · uk `Увійти` · it `Accedi`; `common.aria_open_menu`
  sq `Hap menunë` · en `Open menu` · uk `Відкрити меню` · it `Apri menu`.

`FACT` — `DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"]'` (`:101`) and `openScenarioOverlay` (`:193-208`)
accept **any** dialog. On mobile, `MobileNavDrawer` is also a dialog, so a two-step trigger that stopped after the
hamburger would falsely "open" the scenario. The AuthSheet login view is identifiable by its email field
(`AuthSheet.tsx:111`, `type="email"`, `autoComplete="email"`).

### 3.3 Defect ② — cause measured by execution

`FACT` — `:474-491`: a candidate is hit-tested when `cx < innerWidth && cy < innerHeight`, and a `null` from
`document.elementFromPoint(cx, cy)` is pushed as `kind: 'violation'` and counted.

`FACT, EXECUTED` — `docs/sessions/evidence/task832/design/03_probe832c.txt` (Chromium via Playwright, 320×812, DPR 1):
`elementFromPoint(160, cy)` hits for `cy` ≤ 811.25 and returns **`null`** for `cy` = 811.5, 811.75, 811.9, 811.99.
A point in the last half-pixel row is outside the viewport to Chromium but inside it to the gate. The blocked link's
rect `(16,802 64x20)` is rounded by `describe()`, so a true centre in `[811.5, 812)` matches the report.

`FACT, EXECUTED` — `02_probe832b.txt`: replaying the gate's own band offsets on `/{sq,en,uk,it}` at 320/375/390 found
**no** candidate centre in the last pixel row on this run. The hit depends on each band's exact geometry, which
explains why the failing cell moves between 320 and 375 across runs. `01_probe832.txt`: no page-level horizontal
overflow and `innerHeight === clientHeight` at every cell, so a scrollbar or overflow cause is ruled out.

`INFERENCE` — a `null` hit cannot be a click interception: nothing on the page receives the click, because the point
is outside the viewport. It is a band-geometry artefact. The correct handling is to defer the candidate to another
band, and to fail closed only if no band ever resolves it.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.2 | The `drawer` scenario opens the **AuthSheet** in all 16 cells: at `desktop-1024` by clicking the header guest login button; at 320/375/390 by clicking the hamburger and then the drawer's guest login button. Buttons are located by accessible name from `messages/<locale>.json` (`nav.login`, `common.aria_open_menu`), never by a lucide class or hard-coded text. | **P0** | AC1 | Confirmed |
| **R2** | §3.2 | The scenario counts as opened only when a dialog containing `input[type="email"]` is present **and** exactly one `[role="dialog"]` is in the DOM (the nav drawer closed). Otherwise the cell is a hard scenario-open failure with a reason naming the step that failed. | **P0** | AC1, AC3 | Confirmed |
| **R3** | §3.3 | A candidate whose centre satisfies `cy >= innerHeight − 0.5` or `cx >= innerWidth − 0.5` is treated as outside the viewport **at that band** (same path as today's `below-fold`/`right-of-viewport`), not hit-tested. | **P0** | AC2, AC4 | Confirmed |
| **R4** | fail-closed | A `null` from `elementFromPoint` for a centre inside the R3 bounds no longer counts immediately. The candidate stays unresolved for later bands. If it is still unresolved (outside or `null`) after the final band, it is reported as a violation `elementFromPoint returned null at every band`. It never silently passes. | **P0** | AC4 | Confirmed |
| **R5** | Q4 | `--verify-gate` gains three arms on synthetic pages (same style as the existing fixtures): (a) a candidate whose centre is in the last half-pixel row at scroll 0 but fully visible at a later band → **clean**, no violation; (b) a candidate that can only ever sit with its centre in that row (page height = viewport) → **violation** per R4; (c) the drawer-scenario opened-check rejects a page where only a non-AuthSheet dialog is open (R2). All existing arms still pass. | **P0** | AC3, AC4 | Confirmed |
| **R6** | GR-2 | The drawer scenario's comment and printed label name the new trigger path per viewport class and the owner decision that removed the heart (Task 787, 2026-09-04). The gate still prints `Scenario-open failures`. | P1 | AC1 | Confirmed |
| **R7** | regression | `base` and `modal` results are unchanged apart from R3/R4: modal 16/16 PASS, and base shows no new interception on any cell. | **P0** | AC2 | Confirmed |

## 5. Assumptions and open questions

- `ASSUMPTION` (measured at I0) — at `desktop-1024` the guest login `Button` is visible (`visibleFrom="md"` = 768px).
  **Stop:** if not, return `BLOCKED` with the computed `display`.
- `ASSUMPTION` (measured at I0) — clicking the drawer's login button closes `MobileNavDrawer` before AuthSheet
  opens, leaving one dialog. **Stop:** if two dialogs persist after a 1000ms settle, return `BLOCKED` with the DOM
  count. That is a product observation for Opus, not a reason to relax R2.
- **Stop:** if the drawer scenario, once opened, reports an interception, that is the gate doing its job. Report it
  with blocked and interceptor elements, and do not exempt it.
- No owner decision needed: §3.2 is the owner's own 2026-09-04 decision (quoted in source), and R3/R4 are
  measurement corrections with planted proof.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` clauses 9, 14, 15 · `docs/qa-profiles.md` (Q4) ·
`docs/critical-flow-registry.md` (scan) · `scripts/check-click-shield.mjs` in full ·
`src/components/layout/HeaderActions.tsx` · `HeaderView.tsx` (hamburger block) · `MobileNavDrawer.tsx` ·
`src/modules/auth/components/AuthSheet.tsx:100-140` · `.github/workflows/governance-pr.yml` job `click-shield` ·
`docs/sessions/evidence/task832/design/*` · this kickoff.

## 7. Scope

- **Edited:** `scripts/check-click-shield.mjs` · `docs/backlog.md` (832 state line).
- **Written:** `docs/sessions/evidence/task832/*` (not `design/`) · `docs/sessions/<date>-task832-*.md`.

## 8. Out of scope

`HeaderActions`, `HeaderView`, `MobileNavDrawer`, `AuthSheet` and every other product file (no `data-*` hooks are
added: triggers are located by accessible name) · the CI workflow · `modal` scenario fixture · Task 787's guest-gating
decision.

## 9. Current and required behavior

**Before.** Drawer scenario: 16 open-failures and zero AuthSheet coverage. Base: a viewport-edge `null` is
intermittently counted as an interception. Exit 2 on every PR.
**After.** AuthSheet opens in all 16 cells and is hit-tested. An edge `null` defers to another band and fails only
if never resolved. Exit 0 on the unmodified product. Self-test proves both fixes still fail when they should.

## 10. Implementation requirements

1. **I0** (§13.1): status snapshot and hash of the script; a baseline `check:click-shield` transcript against
   `next start` with `CLICK_SHIELD_CI_FIXTURE=1` (expected exit 2 per §3.1); `--verify-gate` transcript (expected
   exit 0).
2. **Failing arms first:** add R5's arms (a), (b), (c) before changing the hit-test or the scenario. Run
   `--verify-gate` and retain the non-zero transcript, where arm (a) reports a violation under the old rule and
   arm (c) accepts the wrong dialog. If either passes on the old code, stop with `BLOCKED — TEST BLIND`.
3. Implement R3/R4 in the band loop. Keep `resolved`/`finalExcluded` semantics and add the unresolved-`null` list
   to the final report.
4. Implement R1/R2: a scenario may carry a per-viewport-class trigger sequence. Load labels with Node `readFileSync`
   (UTF-8) from `messages/<locale>.json`.
5. Node UTF-8 I/O only for every write.

## 11. Positive and negative flows

**Positive.** Guest visits `/{locale}` at each viewport, opens AuthSheet through the real control, and the gate
hit-tests the page with the sheet open: 0 interceptions.

| Negative flow | Applicable | Expected |
|---|---|---|
| Trigger label missing in a locale file | Yes | scenario-open failure naming the missing key (R2) |
| Only the nav drawer opens | Yes | scenario-open failure (R2), proven by arm (c) |
| Candidate centre in last half-pixel row, resolvable later | Yes | clean (R3/R4), arm (a) |
| Candidate never resolvable | Yes | violation (R4), arm (b) |
| Server not running / fixture env missing | Yes | existing preflight error path unchanged |
| Authenticated session | No | gate is guest-only by design |

## 12. Acceptance criteria

- **AC1 [R1, R2, R6]** — against `next start` with the fixture env, the `check:click-shield` drawer section shows
  16/16 cells with `dialog present: true`, `Scenario-open failures: 0`, and the scenario label names the new
  trigger path. Quote the drawer section and summary.
- **AC2 [R3, R7]** — the same run: modal 16/16 PASS; base shows no cell failing on `elementFromPoint returned null`;
  overall `EXIT_CODE=0`. Quote the summary and the base section.
- **AC3 [R2, R5c]** — `--verify-gate` arm (c) failed on the pre-change code (retained transcript) and passes after.
- **AC4 [R3, R4, R5a, R5b]** — `--verify-gate` arms (a) and (b): the pre-change transcript shows (a) wrongly as a
  violation. After the change, (a) is clean and (b) is a violation with the `null at every band` reason. Overall
  `--verify-gate` exit 0. Quote both transcripts.
- **AC5 [R7]** — run the full gate **three** times after the change. All three exit 0 and none reports a base
  interception. Quote the three summaries. This covers the intermittent history in §3.1.

`GR-4 AC AUDIT — 5 criteria; each states an observable property; absolutes: AC2/AC5 "exit 0" is the gate's own
contract on an unmodified product, which §3 measured as failing only for the two harness causes this task
removes.`

## 13. QA profile and verification plan

**`Q4`** — a blocking CI gate's detection logic changes, so failing-first planted arms are mandatory (AC3/AC4). No
product change, so no owner visual matrix.

### 13.1 Baseline (I0)

Start the server in a second PowerShell window first and leave it running:

```powershell
$env:CLICK_SHIELD_CI_FIXTURE = "1"
npm.cmd run build
npm.cmd run start
```

Then, in the working window:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object scripts/check-click-shield.mjs
$env:BASE_URL = "http://localhost:3000"
npm.cmd run check:click-shield
npm.cmd run check:click-shield:verify
```

Expected: `win32`; gate exit 2 with the §3.1 shape; `:verify` exit 0.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
$env:BASE_URL = "http://localhost:3000"
npm.cmd run check:click-shield:verify
npm.cmd run check:click-shield
npm.cmd run check:click-shield
npm.cmd run check:click-shield
npm.cmd run lint
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object scripts/check-click-shield.mjs docs/backlog.md
```

Expected: every command exit 0. Each run gets its own transcript with `EXIT_CODE=` appended. `npm run build` must
run while the server is stopped, then the server is restarted before the gate runs. Record that order in the
session log.

## 14. Completion report contract

Files changed with hashes · R1–R7 · I0 transcripts · failing-arm transcript · AC1–AC5 quotes · every command with
exit code and path · assumptions · deviations · limitations. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`,
`PARTIALLY IMPLEMENTED` or `BLOCKED`. No self-approval, no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Does R3/R4 hide real interceptions? | No. A real interceptor returns an element, never `null`. `null` means off-viewport (§3.3, executed). An element never resolvable still fails (R4, arm b). |
| Why labels from `messages/` instead of `data-*` attributes? | Zero product change. The labels are the i18n source of truth and already cover 4 locales. |
| Why check for the email input? | `MobileNavDrawer` is also a dialog. Without R2, the mobile path could "open" the wrong overlay (§3.2). |
| GR-1 / 16d? | No visible surface changes. |

## Appendix — rule-compliance ledger and execution contract

| Rule | Mandatory outcome | Evidence | Result |
|---|---|---|---|
| `qa-profiles` Q4 | planted failing arms before the fix | §10.2, AC3/AC4 | COMPLIANT |
| `agent-contract` 9 | final build exit 0 | §13.2 | COMPLIANT |
| `agent-contract` 14 | encoding-safe writes | §10.5 | COMPLIANT |
| GR-2 | scope stated in output | R6 | COMPLIANT |
| GR-4 | observable ACs | §12 audit | COMPLIANT |

| Checkpoint | Producer / artifact | Comparator / failure |
|---|---|---|
| 0 I0 | §13.1 transcripts | gate not exit 2 with §3.1 shape → record and report before editing |
| 1 red arms | `--verify-gate` before fix | arms (a)/(c) pass on old code → `BLOCKED — TEST BLIND` |
| 2 R3/R4 | `--verify-gate` after | any arm fails → not done |
| 3 R1/R2 | live gate run | any drawer cell not opened → not done |
| 4 stability | three live runs | any non-zero → not done |
| 5 final | §13.2 | any non-zero → not `IMPLEMENTED` |
