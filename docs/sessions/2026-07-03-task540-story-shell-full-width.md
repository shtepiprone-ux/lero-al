# Task 540 — `MantineStoryShell` full-width above 640 (+ edge gutter), all primitives except Table & Tabs

**Executor:** Sonnet. **Type:** Storybook / story-shell layout (NOT product code). **Status:** IMPLEMENTED,
pending orchestrator review. Kickoff: `tasks/Sprints/Sprint_40_kickoff_prompt_Task_540_StoryShellFullWidthAbove640.md`.

## Pre-read confirmation

Read (via the Read tool, in full for the relevant sections): `docs/agent-contract.md` (clauses 1–16, esp.
11/12/13/15/16), `docs/backlog.md`, `docs/critical-flow-registry.md` (scanned — no `Storybook`/`MantineStoryShell`
row exists other than the general "P0 — Storybook rendered-proof gate (Task 464)" section; story-shell layout
touches no product critical flow — confirmed), `docs/tailadmin-style-reference.md` §6m, `docs/mantine-responsive-
design-system.md` §7/§8/§8.1/§16/§18, `src/stories/mantine/_MantineStoryShell.tsx` (Task 536 baseline).

## What changed

`MantineStoryShell` (`src/stories/mantine/_MantineStoryShell.tsx`) gained a `width?: 'full' | 'constrained'` prop,
**default `'full'`**:

- **`<640` (both modes):** byte-identical to the pre-task Task 536 wrapper — transparent bg, no card chrome,
  `px="md"`/`py="md"` (16px) gutter, full-bleed. Zero lines of this path changed.
- **`≥640`, `width="full"` (default, 21 of 23 primitive stories):** the Task 536 `maw={{sm:1536}}` + `mx="auto"`
  cap is dropped. The middle `Box` instead gets `px={{ base: 0, sm: 'md', md: 'xl' }}` — **16px `640–767px`,
  24px `≥768px`** (theme `spacing.md`=16px / `spacing.xl`=24px) — reproducing the §6m-cited `p-4 md:p-6` gutter
  value exactly, zero invented numbers. Card chrome (white bg, `1px solid gray.2` border, `2xl`/16px radius, no
  shadow) and the `gray.0` page background are unchanged.
- **`≥640`, `width="constrained"` (Table + Tabs ONLY):** Task 536's original `maw={{base:'100%',sm:1536}}
  mx="auto"` column, unchanged, no gutter px added (byte-identical to pre-task).

`Table.stories.tsx` and `Tabs.stories.tsx` are the only two of the 25 story files updated to pass
`width="constrained"` to `<MantineStoryShell>`. All other 23 story files call `<MantineStoryShell>` with no
`width` prop and get the new `'full'` default automatically — no per-file changes needed for them.

Docs updated to record the owner override (clause 16 requirement — this is an explicit, dated divergence from
§6m's cap, not an undetected deviation):
- `docs/tailadmin-style-reference.md` §6m — new "Task 540 owner override (2026-07-03)" paragraph, quoting the
  owner's verbatim directive, explaining the full-width + gutter change, and clarifying it is story-harness-only
  (product surfaces still follow the 1536-capped column exactly as before).
- `docs/mantine-responsive-design-system.md` §8.1 — rewrote the rule table to document both `width` modes, the
  Task 540 rationale row, and the source-of-truth pointer for the 16/24px gutter.

## STOP-and-ASK items — resolved without pausing

1. **Card chrome at very-wide viewports (2560):** rendered `button-full__en__2560.png` (see assets) — full-width
   buttons with the 24px gutter and retained card chrome read correctly; no runaway line-length problem (button
   text stays a fixed short label, not flowing paragraph text). No STOP triggered.
2. **Table/Tabs ambiguity:** neither story mixes a table with other primitives — exemption unambiguous, applied
   directly. No STOP triggered.

## Positive flow — verified

1. `TextInput`/`Button`/`SegmentedControl` (representative `'full'` stories) at 768/1024/1440/1920/2560: card
   spans full viewport minus the 16/24px gutter, no narrow centered column. Screenshots:
   `docs/sessions/assets/task540/{textinput,button}-full__en__{768,1024,1440,1920,2560}.png`.
2. Gutter is visually consistent and edge-anchored (not clipped, not touching raw screen edge) at every sampled
   width.
3. `Table`/`Tabs` at the same widths stay in the 1536 centered column — visibly narrower than the full-width
   stories at 1920/2560. Screenshots: `docs/sessions/assets/task540/{table,tabs}-constrained__en__{768,1024,
   1440,1920,2560}.png`.
4. Locale/viewport reflow: covered by the `--mantine-only` assert matrix (uk@320/375/390 mandatory, see below) —
   no h-scroll, gutter constant.

## Negative flow — verified

- **`<640` regression guard:** the `<640` code path in `_MantineStoryShell.tsx` is unmodified (diff shows zero
  changed characters inside the `base` branches). The rendered assert matrix's mobile-320/375/390 cells for all
  23 non-Progress/non-ambiguous stories PASS identically to the pre-task baseline (Task 536 closed at
  365/368 PASS with only the same pre-existing Tabs-ambiguous entries) — proving byte-identical `<640` behavior.
- **Table/Tabs at `≥640` stay constrained:** confirmed via the screenshots above — exemption holds.
- **Overlay stories:** `offscreenControl: 0`, `outsideContainer: 0`, `bottomsheetOverflow: 0` in the final
  assert summary — no overlay/portal regression from the shell width change.
- **Very wide (2560):** see STOP-and-ASK #1 — no runaway line-length defect.

## Rendered-evidence gate (clauses 12/13) — REQUIRED evidence

**Clean run** (`npm run build-storybook` then `npm run screenshots:assert -- --mantine-only`), final/reproduced
twice for consistency:

```
Results: 381/400 PASS, 16 FAIL, 3 AMBIGUOUS (needs-owner-decision)
  loader-only: 16   (100% Mantine/Primitives/Progress/Default — ALL 4 locales × mobile-320/375/390/desktop-1024)
  ambiguous-overlap: 3   (100% Mantine/Primitives/Tabs/Default × sq/uk/it × mobile-320 — known swipe-scroll pattern)
Manifest: .screenshots/rendered-assert/2026-07-03T20-32/manifest.json
```

**The 16 Progress failures and 3 Tabs-ambiguous findings are pre-existing and OUT OF SCOPE for this task:**
- Progress (`MantineProgress.tsx`/`Progress.stories.tsx`) is uncommitted Task 539 work (still OPEN/HELD per
  `docs/backlog.md`) — this task did not touch either file. The failure reproduces **identically at
  `mobile-320`**, which is the `<640` shell path this task left byte-identical — proving the defect is intrinsic
  to the Progress story/component, not caused by the shell width change.
- The 3 Tabs-ambiguous cells are the documented swipe-scroll-tabs pattern (Tabs is a `width="constrained"`
  story; behavior unrelated to width mode) — same 3 cells Task 536 recorded as pre-existing.
- **offscreenControl/outsideContainer/bottomsheetOverflow/textClipped/elementOverlap/unstyledRender all = 0** —
  zero width/overflow/geometry regressions attributable to the shell change itself.

I re-ran the identical `--mantine-only` command twice (once immediately after implementing, once as the final
confirmation after the planted-violation revert) and got the **exact same 381/400, same 16+3 failing cells both
times** — reproducible, not flaky.

**Planted-violation FAIL transcript (proves the gate is real, per Task 536's Attempt-2 method):** temporarily
added `miw={{ base: 900, sm: 0 }}` to the shell's middle `Box` (forces a minimum width wider than the
320–390px mobile viewports → guaranteed horizontal overflow), rebuilt, reran:

```
Results (planted): 96/400 PASS, 304 FAIL, 0 AMBIGUOUS
  offscreenControl: 204, horizontal overflow detected across nearly every story × every mobile viewport × every locale
```

Reverted the plant immediately, rebuilt, reran — back to the identical clean **381/400 PASS** result above,
confirming the working tree is clean. Evidence: `docs/sessions/assets/task540/planted-violation/fail-transcript-
manifest.json` (full 400-cell manifest from the planted run) + representative FAIL screenshot
`mantine-primitives-textinput--default__uk__mobile-320.png`.

## Gates (clause 9/13/14)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npm run check:stories` | ✅ 99 files checked, 0 violations |
| `npm run check:i18n` | ✅ all 4 locales, 2082 keys, parity + no raw-enum leaks |
| `npm run check:mojibake` | ✅ 0 artifacts / 1546 files |
| `npm run check:design-tokens -- --strict` | ✅ 0 violations |
| `npm run check:file-integrity` | ✅ 44/44 files clean (final run, covers every touched + new file) |
| `npm run build-storybook` | ✅ built clean |
| `npm run screenshots:assert -- --mantine-only` | 381/400 PASS (16+3 pre-existing/out-of-scope, reproduced identically twice) |

## Regression coverage (clause 15)

Confirmed via `docs/critical-flow-registry.md` scan: no row references Storybook/story-shell files; the only
Storybook-related section is the general "P0 — Storybook rendered-proof gate (Task 464)" note, which this task
satisfies via the `--mantine-only` assert above. No product critical-flow test required — the rendered gate is
the coverage per the kickoff.

## Files Changed

| Path | Rationale |
|---|---|
| `src/stories/mantine/_MantineStoryShell.tsx` | Added `width?: 'full' \| 'constrained'` prop (default `'full'`); `≥640` `'full'` drops the Task 536 1536 cap for a full-width-minus-16/24px-gutter layout; `'constrained'` preserves Task 536's 1536-centered column exactly; `<640` path unmodified. |
| `src/stories/mantine/primitives/Table.stories.tsx` | Passes `width="constrained"` — keeps the 1536-column exemption per owner directive. |
| `src/stories/mantine/primitives/Tabs.stories.tsx` | Passes `width="constrained"` — same exemption. |
| `docs/tailadmin-style-reference.md` | §6m — new dated "Task 540 owner override" paragraph recording the full-width override + 16/24px gutter citation, so clause 16 reads this as an approved divergence. |
| `docs/mantine-responsive-design-system.md` | §8.1 — rewrote the rule table to document `width="full"` (default) vs `width="constrained"` (Table/Tabs), with source-of-truth pointers. |
| `docs/backlog.md` | Last Session + Task 540 status line updated to IMPLEMENTED/pending-review with the gate summary. |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-regenerated by the required `screenshots:assert -- --mantine-only` run (`scripts/check-stories-rendered.mjs` unconditionally overwrites this file with the latest manifest on every run) — not a manual edit; reflects this task's 381/400 result. |
| `docs/sessions/2026-07-03-task540-story-shell-full-width.md` | This session log. |
| `docs/sessions/assets/task540/*.png` (20 files) | Wide-viewport (768/1024/1440/1920/2560) visual proof for 2 `'full'` stories (TextInput, Button) + 2 `'constrained'` stories (Table, Tabs) — positive-flow evidence. |
| `docs/sessions/assets/task540/planted-violation/*` | Planted-violation FAIL manifest (304/400 FAIL) + representative screenshot proving the rendered gate genuinely catches width/overflow regressions. |

**Not touched this task (pre-existing, uncommitted Task 539 work — left exactly as found):**
`src/design-system/mantine/patterns/MantineProgress.tsx`, `src/stories/mantine/primitives/Progress.stories.tsx`,
`src/design-system/mantine/theme.ts`, `src/design-system/mantine/patterns/index.ts`, `messages/{en,it,sq,uk}.json`,
`docs/mantine-tailadmin-migration-tracker.md`, `docs/sessions/2026-07-03-task539-mantine-progress-primitive.md`,
`docs/sessions/assets/task539/`. **Do NOT run git** — the orchestrator emits commits after reviewing the real
diff.

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|---|---|---|
| 1 | `MantineStoryShell` gains `width` mode, default `'full'`; `≥640` full drops the 1536 cap, full-width minus 16/24px gutter, card chrome + gray bg retained | ✅ | `_MantineStoryShell.tsx` diff; Positive 1–2; `textinput-full`/`button-full` screenshots |
| 2 | `Table.stories.tsx` + `Tabs.stories.tsx` pass `width="constrained"`; both keep Task 536 behavior | ✅ | Both files' diffs; `table-constrained`/`tabs-constrained` screenshots |
| 3 | `<640` path byte-identical to pre-task; mobile gate green | ✅ | Diff shows zero changes inside `base` branches; assert matrix mobile-320/375/390 cells pass identically to Task 536 baseline (excl. pre-existing Progress/Tabs) |
| 4 | §6m + §8.1 updated recording the owner override with date + rationale + task cite; gutter cites the zip | ✅ | Both doc diffs above |
| 5 | Rendered `--assert` matrix (uk@320/375/390 + ≥640) attached + planted-violation FAIL transcript; all light gates green | ✅ | 381/400 PASS reproduced twice; planted 96/400 PASS transcript + screenshot; all `check:*` gates green |
| 6 | No primitive's chrome (border/radius/focus/shadow/font) changed — layout width only. Overlay portals unaffected | ✅ | Diff touches only `maw`/`mx`/`px` on the middle `Box`; card `Box`'s bg/bd/bdrs/px/py untouched; `offscreenControl`/`bottomsheetOverflow` = 0 in assert summary |
| 7 | Session log: Files-Changed table, AC-by-AC self-audit, `Self-validation: …` line. No git run | ✅ | This file |

## File-integrity gate (clause 14) — final transcript

```
> npx tsc --noEmit
(0 errors)

> npm run check:file-integrity
🔍  check:file-integrity — git-changed + untracked (default)
    Checking 44 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation
✅  check:file-integrity PASSED — all 44 file(s) clean
```

**Self-validation: PASS.** All 7 ACs met with rendered evidence; `<640` path byte-identical (diff + assert
confirm); `≥640` full-width + 16/24px gutter implemented per §6m citation with zero invented values; Table/Tabs
exemption implemented and verified; owner override documented in both §6m and §8.1; rendered assert 381/400 PASS
reproduced twice with the only failures being pre-existing/out-of-scope Task 539 (Progress) and known Tabs-swipe
ambiguity, neither caused by this diff; planted-violation transcript proves the gate is real; all light gates
(`tsc`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens --strict`, `check:file-integrity`)
green. No git run by the executor.
