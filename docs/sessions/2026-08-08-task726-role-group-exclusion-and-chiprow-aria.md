# Task 726 — Remove the author-appliable `[role="group"]` exclusion, then give the chip rows their accessible name back

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Task:** `tasks/Sprints/Sprint_53_kickoff_prompt_Task_726_ButtonGroupExclusion_And_ChipRowAria.md`
**Companions:** `Sprint_53_Task_726_execution_contract.md` · `Sprint_53_Task_726_rule_compliance_ledger.md`

---

## 1. Files changed

| Path | Reason |
|---|---|
| `scripts/check-stories-rendered.mjs` | R3 — deleted the `[role="group"]` skip line and its justifying comment paragraph (6 lines removed, 0 added) |
| `src/components/shared/FilterMultiToggle.tsx` | R6 — container renders `role="group"` + `aria-label` only when `ariaLabel` is supplied |
| `src/components/shared/FilterRoomsRow.tsx` | R6 — same conditional-role change |
| `src/modules/listings/components/ListingsFilters.tsx` | R6 — threaded `ariaLabel` at all 7 `FilterMultiToggle`/`FilterRoomsRow` call sites from each site's own `AccordionSection` title |
| `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | R14 — added 2 test arms: unnamed → no role/aria-label; named → role="group"+aria-label |
| `docs/storybook-governance.md` | R9 — amended §14.9.28 with the probe/restore record and the median-sensitivity worked example |
| `.claude/skills/create-task/SKILL.md` | Pre-existing owner-authored modification, untouched by this task (Class A, hash-verified unchanged) |
| `.claude/skills/execute-task/SKILL.md` | Pre-existing owner-authored modification, untouched by this task (Class A, hash-verified unchanged) |

`src/stories/mantine/primitives/Button.stories.tsx` does **not** appear in the diff — the R2 probe was reverted
byte-identical to `HEAD` (`a2279cd137a31643be9c883e9bebae3a405544ac`) before final verification, confirmed absent
from `git status --porcelain`.

`src/components/shared/FiltersPanel.tsx` — **zero diff.** All 7 of its `FilterMultiToggle`/`FilterRoomsRow` call
sites already passed `ariaLabel` (contrary to the kickoff §2.4 table's undercount of "6"; the actual count is 7 —
rooms/condition/layout_features/heating/wall_type/offer_type/purchase_conditions — plus the unrelated property-type
`SimpleGrid`'s own `aria-label`). Those names were previously inert (rendered on a role-less `<div>`); R6's
component-level fix makes them effective with no code change required in this file.

Reconciled to `git status --porcelain` (8 entries): 6 task-owned files + the 2 pre-existing Class-A skill files.

---

## 2. Requirements — R1 through R14

| ID | Verdict | Evidence |
|---|---|---|
| R1 | **Confirmed** | J1 baseline: both skill-file hashes matched §2.0 exactly; `Button.stories.tsx` absent from status, hash == `HEAD`; §2.2/§2.3 greps matched the kickoff exactly (3 shadcn `ButtonGroup` hits, 4 `role="group"` hits); manifest below |
| R2 | **Confirmed** | Probe applied (`w={100}` + `<div role="group">` wrap on the leading-icon Button); `K2-probe-before.log` — `Button/Default` absent from the 16 pre-existing failures, 1146/1184 PASS unchanged |
| R3 | **Confirmed** | `K3-gate-diff.txt` — exactly 6 deleted lines (the `:1238` selector + the 5-line `:1160-1164` comment), 0 added |
| R4 | **Confirmed** | `K4-probe-after.log` — 12 new `Button/Default` FAILs (4 locales × 3 mobile viewports), each naming the planted button ("Save changes"/"Ruaj ndryshimet"/"Зберегти зміни"/"Salva modifiche"); 1134/1184 PASS |
| R5 | **Confirmed** | `K5-probe-restored.txt` — `git hash-object` == `a2279cd137a31643be9c883e9bebae3a405544ac`; path absent from `git status --porcelain` |
| R6 | **Confirmed** | `K6-r6-diff.txt` — conditional role in both leaf components; all 7 `ListingsFilters.tsx` sites threaded from `tc(...)` matching each site's own `AccordionSection` title; `FiltersPanel.tsx` needed no rename (already `ariaLabel`) |
| R7 | **Confirmed** | Full audit below — every `role="group"`-capable render site accounted for with post-change state |
| R8 | **Confirmed** | `K9-final-matrix.log` — `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS, exit 1`; FAIL set is exactly `{HeroSearch×12, NotificationBellView/mobile-390×4}`; zero cell movement vs. 724R's approved bound |
| R9 | **Confirmed** | `docs/storybook-governance.md` §14.9.28 amended with the worked example (358px row, 200/100/90px siblings, median 100, exempted at 200/358≈56%), arithmetic re-verified against the shipped `isChipSetMember` thresholds |
| R10a | **Confirmed** | `K-R10a-whole-file-hashes.txt` — all 8 non-skill files MATCH `HEAD`; both skill files MATCH their required J1 witness (differ from `HEAD` as expected, since they were already owner-modified pre-task) |
| R10b | **Confirmed** | `K3-gate-diff.txt` — exactly 6 deletions/0 additions in `check-stories-rendered.mjs`; `isChipSetMember`, its 3 thresholds, `FULL_WIDTH_TOLERANCE = 8`, `fullWidthControlsAtMobile`, and `MANTINE_VIEWPORTS` all read unchanged post-edit |
| R11 | **Confirmed** | `K11-tsc.log` exit 0; `K10-build.log` exit 0 |
| R12 | **Confirmed** | `K11-i18n.log` — exit 0, 2218 keys identical across sq/en/uk/it, no new keys |
| R13 | **Confirmed** | Two counting-gate passes below, second genuinely after this log + backlog exist |
| R14 | **Confirmed** | `K7-smoke.log` — 10 passed, exit 0, including both new arms |

---

## 3. Current versus required behavior

**Current (before this task).** `check-stories-rendered.mjs:1238` skipped any button inside `[role="group"]` — an
attribute any component author could hand-apply to any container with no legitimate live match anywhere in the
codebase, proven exploitable by Task 724 (48/136 cells turned green with zero layout change). The two chip-row leaf
components (`FilterMultiToggle`, `FilterRoomsRow`) rendered `aria-label` unconditionally on a role-less `<div>` —
prohibited under ARIA 1.2, exposed to no assistive technology — and `ListingsFilters.tsx`'s 7 production call sites
passed no name at all, making the `/listings` mobile filter chip rows unnamed.

**Required after (achieved).** No attribute a developer can hand-apply makes a failing button pass the assertion —
proven by the R2/R4 probe resolving `true` before the deletion and `false` after it, on a control
`isChipSetMember` cannot absorb (a single-button wrapper, N<3). The chip rows announce as named groups on
`/listings` and in `FiltersPanel`, and never render a role without a name (R6/R14). Not one of the 1184 matrix
cells moved (R8). `Button.stories.tsx` is byte-identical to its pre-task state (R5).

**Negative flows exercised:**

| Branch | Result |
|---|---|
| R2's before-arm reads `false` (probe not skipped) | Did not occur — confirmed `true`, so the probe validity check passed without correction |
| R4's after-arm still reads `true` (deletion ineffective) | Did not occur — confirmed `false`, 12 named failures |
| A caller cannot supply a name | Not applicable — all 7 `ListingsFilters.tsx` sites have an `AccordionSection` title to source from; none omitted |
| A matrix cell moves | Did not occur — R8's final count is byte-identical to 724R's approved bound |
| Smoke test fails after the role change | Did not occur on the final run; one iteration failure was a test-authoring bug (querying `container.firstChild`, which is `MantineProvider`'s own internal markup, not the component's div) — fixed by querying `.flex-wrap` instead, both new arms then passed |
| A real production `Button.Group` consumer is found | Not found — §2.2 reconfirmed at J1: 3 hits, all the unrelated legacy shadcn `ButtonGroupField` |

---

## 4. J1 dirty-worktree manifest

**Class A — frozen, any difference is stop-and-report.**

| Path | Required state | Observed at J1 | Result |
|---|---|---|---|
| `.claude/skills/create-task/SKILL.md` | `951da117d14f1fdc731dcfc67f46bf9a36c173b1` | Matched exactly | `UNCHANGED` (untouched throughout) |
| `.claude/skills/execute-task/SKILL.md` | `639b883db2f23e8d03db4838c543ab8e5fcf5447` | Matched exactly | `UNCHANGED` (untouched throughout) |
| `src/stories/mantine/primitives/Button.stories.tsx` | Absent from `git status`, hash == `HEAD` `a2279cd137a31643be9c883e9bebae3a405544ac` | Confirmed absent, hash matched | `UNCHANGED` at J1 → probed at J2–J4 → restored byte-identical at J5, confirmed absent again |

**Class B — mutable design docs, witness recorded, not a stop.**

| Path | J1 witness hash |
|---|---|
| `docs/backlog.md` | `2d574fb67a1ed1607283146a4299172b3dacb136` |
| `tasks/Sprints/Sprint_53_Mobile_FullWidth_Control_Remediation.md` | `1bf78c396b3d8333d9a67a64b922c2516cb05f11` |
| `tasks/Sprints/Sprint_53_kickoff_prompt_Task_726_ButtonGroupExclusion_And_ChipRowAria.md` | `4eb31e12c7406d8d1a1d5f602af4e91a746c4f5d` |
| `Sprint_53_Task_726_execution_contract.md` | `4475d95f7646413a402f78115748f7b9ada42240` |
| `Sprint_53_Task_726_rule_compliance_ledger.md` | `0128814868234d357261a75c9eece76316e14a1f` |

No path in `git status --porcelain` at J1 fell outside Class A/B (only the two Class-A skill files were present).
No Class-B entry was staged, reverted, or committed; `docs/backlog.md` is updated by this task per §12 below (a
normal, expected Class-B move, not a stop).

---

## 5. Probe record (R2–R5)

Exact temporary diff applied at J2 (`.screenshots/task726-evidence/K1-probe-diff.txt`):

```diff
-            <Button
-              variant="filled"
-              color="brand"
-              leftSection={<Save size={16} aria-hidden />}
-            >
-              {t('button_save_changes')}
-            </Button>
+            {/* Task 726 R2 probe — TEMPORARY, reverted byte-identical at R5 */}
+            <div role="group">
+              <Button
+                variant="filled"
+                color="brand"
+                leftSection={<Save size={16} aria-hidden />}
+                w={100}
+              >
+                {t('button_save_changes')}
+              </Button>
+            </div>
```

- Before-arm (`K2-probe-before.log`): skip present, `Button/Default` absent from all 16 failures — `true`.
- After-arm (`K4-probe-after.log`): skip removed, 12 new `Button/Default` failures, each naming the button by its
  translated label — `false`.
- Revert (`K5-probe-restored.txt`): `git hash-object` == `a2279cd137a31643be9c883e9bebae3a405544ac` (`HEAD`), path
  absent from `git status --porcelain`.

Restoration used the `Edit` tool to reproduce the original text exactly — **not** `git checkout`, since mutating
Git is owner-only per the project's git policy even to revert the executor's own uncommitted edit.

---

## 6. R6 site table — `ListingsFilters.tsx`

| # | Line | Component | Name expression | Sourced from |
|---|---:|---|---|---|
| 1 | 167 | `FilterRoomsRow` | `tc('rooms_label')` | Its own `AccordionSection title={tc('rooms_label')}` (line 163) |
| 2 | 244 | `FilterMultiToggle` (condition) | `tc('condition')` | `AccordionSection title={tc('condition')}` (line 236) |
| 3 | 257 | `FilterMultiToggle` (layout_features) | `tc('layout_features')` | `AccordionSection title={tc('layout_features')}` (line 249) |
| 4 | 290 | `FilterMultiToggle` (heating) | `tc('heating')` | `AccordionSection title={tc('heating')}` (line 281) |
| 5 | 303 | `FilterMultiToggle` (wall_type) | `tc('wall_type')` | `AccordionSection title={tc('wall_type')}` (line 293) |
| 6 | 317 | `FilterMultiToggle` (offer_type) | `tc('offer_type')` | `AccordionSection title={tc('offer_type')}` (line 305) |
| 7 | 331 | `FilterMultiToggle` (purchase_conditions) | `tc('purchase_conditions')` | `AccordionSection title={tc('purchase_conditions')}` (line 318) |

No new locale keys — every `tc(...)` key already exists and is already rendered as the section's own visible title.

---

## 7. R7 audit — every `role="group"`-capable render site, post-change

Static `git grep -n 'role="group"\|role: .group.'` — 6 source-level hits:

| # | File:line | Mechanism | Named? | State |
|---|---|---|---|---|
| 1 | `src/components/ui/input-group.tsx:15,53` | Static, legacy shadcn `InputGroup` primitive | n/a | **Out of scope** (legacy Tailwind surface, outside the Mantine gate) — unchanged, hash-verified |
| 2 | `src/modules/cabinet/components/ListingsTab.tsx:171` | Static | Yes — `aria-label={t('filter_ALL')}` | **Unchanged, already correct** — hash-verified |
| 3 | `src/modules/listings/components/FavoritesTypeFilter.tsx:31` | Static | Yes — `aria-label={tf('filter_label')}` | **Unchanged, already correct** — hash-verified |
| 4 | `src/components/shared/FilterMultiToggle.tsx:21` | Conditional (`ariaLabel ? {role:'group', 'aria-label':ariaLabel} : {}`) | Conditional | **Changed this task** — never renders `role` without a name |
| 5 | `src/components/shared/FilterRoomsRow.tsx:16` | Conditional, same shape | Conditional | **Changed this task** — never renders `role` without a name |

Consumer call sites of #4/#5 (determines actual per-instance runtime state):

| Consumer | Sites | Passes `ariaLabel`? | Runtime state after this task |
|---|---:|---|---|
| `src/modules/listings/components/ListingsFilters.tsx` | 7 | **Yes (newly threaded, R6)** | `role="group"` + `aria-label` |
| `src/components/shared/FiltersPanel.tsx` | 7 | Yes (already present, now effective) | `role="group"` + `aria-label` (was inert `aria-label`-only before) |
| `src/stories/mantine/primitives/FilterControls.stories.tsx` | 2 (condition demo, rooms demo) | Yes (already present) | `role="group"` + `aria-label` |
| `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` (pre-existing 5 sites) | 5 | No (unchanged, intentional negative-flow coverage) | Plain `div`, no `role`, no `aria-label` |
| `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` (2 new R14 arms) | 2 | One unnamed, one named | Asserts both states directly |

**Reconciliation with the design docs' "12+1" / "13" figure.** 724R's own J7 audit (§2.4 of the kickoff, and
`docs/sessions/2026-08-07-task724R-fullwidth-buttons-revision.md` §J7) only enumerated the 7 `ListingsFilters.tsx` +
5 smoke-test sites (12) plus `FiltersPanel.tsx`'s unrelated property-type `SimpleGrid` (the "+1") — because at that
point neither `FilterMultiToggle` nor `FilterRoomsRow` rendered `role` in any state, so `FiltersPanel.tsx`'s 7
already-named call sites and the story's 2 demo sites were not yet part of the `role="group"` picture. Now that R6
makes the name conditional and effective, those 9 additional call sites also render `role="group"` — a **larger**
correct set than "13", not a discrepancy from it. Every one is accounted for above with its post-change state; no
unnamed group renders anywhere in `src/`.

---

## 8. Final matrix (R8)

`.screenshots/task726-evidence/K9-final-matrix.log`:

```
Results: 1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS (needs-owner-decision)
EXIT_CODE=1
```

FAIL set (16, exact):

- `Mantine/Primitives/HeroSearch/Default` × {sq, en, uk, it} × {mobile-320, mobile-375, mobile-390} = 12 (Sprint 49,
  out of scope, unchanged)
- `Mantine/Primitives/NotificationBellView/Default` × {sq, en, uk, it} × mobile-390 = 4 (Task 593's 390px decision,
  out of scope, unchanged)

Identical to 724R's approved bound. Zero cells moved.

---

## 9. Commands and exit codes

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` / `git hash-object` (J1) | Class A matched, Class B recorded | inline above |
| 2 | `git grep -n 'Button\.Group\|ButtonGroup' -- src/` / `git grep -n 'role="group"' -- src/` (J1) | §2.2/§2.3 confirmed | inline above |
| 3 | `npm run build-storybook` + `npm run screenshots:assert -- --mantine-only` (J2, probe in, skip in) | exit 1 (unrelated pre-existing failures only), `Button/Default` = `true` | `K2-build-storybook-before.log`, `K2-probe-before.log` |
| 4 | `npm run build-storybook` + `npm run screenshots:assert -- --mantine-only` (J4, probe in, skip out) | exit 1, `Button/Default` = `false` × 12, named | `K4-build-storybook-after.log`(build only ran once, reused) / `K4-probe-after.log` |
| 5 | `git hash-object` + `git status --porcelain` (J5) | matches `HEAD`, absent from status | `K5-probe-restored.txt` |
| 6 | `git grep -n 'role="group"\|role: .group.' -- src/` (J7) | 6 source hits, all accounted | `K7-role-group-audit.txt` |
| 7 | `npx vitest run .../filterLeafComponents.smoke.test.tsx` (J8) | **EXIT_CODE=0**, 10 passed | `K7-smoke.log` |
| 8 | `npm run build-storybook` + `npm run screenshots:assert -- --mantine-only` (J9, final, probe-free) | **EXIT_CODE=1**, `1146/1184 PASS, 16 FAIL, 22 AMBIGUOUS` | `K9-build-storybook-final.log`, `K9-final-matrix.log` |
| 9 | `npm run check:i18n` | **EXIT_CODE=0** | `K11-i18n.log` |
| 10 | `npx tsc --noEmit` | **EXIT_CODE=0** | `K11-tsc.log` |
| 11 | `npm run build` | **EXIT_CODE=0** — hard gate | `K10-build.log` |
| 12 | `npm run check:file-integrity` + `npm run check:mojibake` (pass 1 and pass 2, see §10) | **EXIT_CODE=0** each, both passes | `K12-*-pass1.log`, `K12-*-pass2.log` |

A stray Node process (PID 46356) was found squatting on port 6008 (a leftover Storybook preview server from an
earlier, unrelated session) and blocking step 3. It was stopped so the harness could bind its own preview server;
no project file was touched by this action.

One unrelated, non-reproducing rendering flake (`Mantine/Primitives/Tabs/Default × sq × mobile-320`, "blank-canvas"
screenshot capture race) appeared once in the J4 intermediate run (`K4-probe-after.log`) and did **not** recur in
the final J9 run — confirmed clean in `K9-final-matrix.log`. It has no relationship to `role="group"` or Button
logic and is not attributed to this task's diff.

---

## 10. Counting gates — both passes

**Pass 1 (before this log/backlog existed):** `K12-file-integrity-pass1.log` / `K12-mojibake-pass1.log` — 8 files
checked (matches `git status --porcelain` count of 8 at that point), 0 mojibake artifacts in 2100 scanned files,
both exit 0.

**Pass 2 (final, after this log and `docs/backlog.md` were written):** `K12-file-integrity-pass2.log` /
`K12-mojibake-pass2.log` — 10 files checked (matches `git status --porcelain` count of 10: the prior 8 + this
session log `??` + `docs/backlog.md` `M`), 0 mojibake artifacts in 2101 scanned files, both exit 0.

```
git status --porcelain
 M .claude/skills/create-task/SKILL.md
 M .claude/skills/execute-task/SKILL.md
 M docs/backlog.md
 M docs/storybook-governance.md
 M scripts/check-stories-rendered.mjs
 M src/components/shared/FilterMultiToggle.tsx
 M src/components/shared/FilterRoomsRow.tsx
 M src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx
 M src/modules/listings/components/ListingsFilters.tsx
?? docs/sessions/2026-08-08-task726-role-group-exclusion-and-chiprow-aria.md
```

Composition reconciles exactly: 6 task-owned code/doc files + 2 pre-existing untouched Class-A skill files (hash-
verified unchanged throughout, see §4) + `docs/backlog.md` + this session log. `Button.stories.tsx` and
`FiltersPanel.tsx` correctly absent (zero diff, as required).

---

## 11. Standing findings not acted on

**721 · 722 · 717 · 727 · 728 · 729** — pre-existing Sprint 52/54 backlog items, untouched by this task; see
`docs/backlog.md` task registry for current state. **`HeroSearch`** (Sprint 49) — its 12 red cells are explicitly
out of scope per the kickoff's standing constraints and remain red by design; Sprint 49 owns closing them.

---

## 12. Assumptions, deviations, limitations

- **A1–A4 confirmed at J1** as stated in the kickoff: the worktree started dirty exactly as Class A/B predicted; A2
  (`role="group"` is the correct role for a multi-select toggle set) matches the two pre-existing correct
  consumers; A3 (no outstanding owner decision) held; A4 — `docs/critical-flow-registry.md` has no entry for
  `FilterMultiToggle`/`FilterRoomsRow`/`ListingsFilters`/`FiltersPanel`, confirmed by targeted grep, so R14's
  coverage requirement did not escalate.
- **Deviation from §2.5's literal instruction** ("wrap an existing non-`fullWidth` Button"): per the kickoff's own
  measured reasoning, the literal form cannot produce a failing cell (both non-`fullWidth` Buttons in the story
  are full-width via their `Stack` parent's `align="stretch"`), so the probe also narrowed the button with `w={100}`
  — the exact shape the kickoff itself specified as the fallback (§2.5, citing Task 711 R7's plant).
- **Own defect found and fixed during implementation:** the first draft of the R14 smoke-test arms queried
  `container.firstChild`, which under `MantineProvider` is not reliably the component's own div (Mantine may
  render internal markup ahead of it). Fixed by querying `.flex-wrap`, a class both components render
  unconditionally; both arms then passed cleanly.
- **Environmental, not code:** a stray Node process from an earlier session was squatting on port 6008 and had to
  be stopped before the harness could run; one non-reproducing `Tabs/Default` screenshot-capture flake appeared in
  an intermediate run and was absent from the final run.
- **Reconciliation, not a defect:** the R7 audit surfaces 9 more `role="group"`-capable call sites than 724R's
  "12+1" figure (§7 above) — this is because `FiltersPanel.tsx`'s 7 sites and the story's 2 demo sites already
  passed `ariaLabel` before this task and only became *effective* once R6 made the component-level role
  conditional; they were not part of 724R's F2 defect scope and were not omitted, just newly in-scope for a
  complete audit.
- No requirement was left without evidence. No known gap remains.

---

## 13. Opus handoff

Evidence root: `.screenshots/task726-evidence/` (local-only, D6, `.gitignore`d — confirmed absent from
`git status --porcelain` throughout). Key artifacts: `K1`–`K3` (probe application + gate diff), `K4`–`K5` (after-arm
+ restore proof), `K6`–`K7` (R6 diff + role audit), `K9` (final matrix), `K10`–`K12` (build/i18n/tsc/counting
gates), `K-R10a-whole-file-hashes.txt`.

Specific risks/questions for review:

1. **§7's site-count reconciliation** (9 more sites than 724R's "12+1") — confirm the reasoning that this is a
   completeness improvement, not scope creep, since no code in `FiltersPanel.tsx` or the story changed.
2. **§2.5's deviation** (narrowing the probe button beyond the literal instruction) — confirm this was the
   kickoff's own specified fallback, not an unauthorized departure.
3. **`BACKLOG LIMIT BREACH`** — `docs/backlog.md` is 96 lines post-edit (reduced from 100), still over the 80-line
   target; this task's edit was net-negative but did not and should not attempt further consolidation of unrelated
   entries.
4. Confirm the stray port-6008 process termination (§9) was an acceptable environmental cleanup, not an
   unauthorized action — no project file was touched by it.
5. `.screenshots/task726-evidence/` contained 5 pre-existing files (`j1-*.txt`, `j2-*.txt`, lowercase-prefixed,
   dated 2026-08-07 — before this session) not created by this session, consistent with a prior aborted attempt
   the kickoff's §2.1a/§4 already document (the rejected draft-2 `Button.Group` arm). Left untouched; `.screenshots/`
   is `.gitignore`d (D6) so they do not affect `git status` or this task's diff. All `K*`-prefixed files in that
   directory are this session's own evidence.

---

## 14. Backlog update

`docs/backlog.md` — "Last Session" block replaced (not appended) with a 6-line 726 close-out entry; Sprint 53 line
and the 726 task-registry row both updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. Resulting line count:
**96 lines** (down from 100 pre-edit). **`BACKLOG LIMIT BREACH`** — still over the 80-line target; flagged for
Opus consolidation of unrelated historical entries, which is out of this task's scope.
