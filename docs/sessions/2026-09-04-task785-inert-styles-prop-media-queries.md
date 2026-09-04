# Session Archive: Task 785 — the eleven inert `styles`-prop media queries, and one orphaned label — 2026-09-04

**Task path:** `tasks/Sprints/Sprint_69_kickoff_prompt_Task_785_Inert_Styles_Prop_Media_Queries.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Pre-read (executor)

`.claude/skills/execute-task/SKILL.md`, `CLAUDE.md`, `docs/agent-contract.md`, `docs/rule-index.md` →
"UI / Layout / Component" → Current Mantine path, `docs/qa-profiles.md` (Q3 confirmed), `docs/ai-behavior.md`
(Notes 14/18–23), `docs/mantine-responsive-design-system.md` §1–9, `docs/component-rules.md`, `docs/qa-rules.md`,
`docs/backlog.md`, `docs/sessions/evidence/task784/d69-19-browser/styles-prop-media-query-defect-proof.md`.

## 2. Requirement ledger (kickoff §4/§5)

| Req | Status |
|---|---|
| R1 — all 11 inert `styles`-prop media blocks replaced by native responsive props, gated at `sm` | ✅ done, plus 2 more sites discovered (§8 below) |
| R2 — each converted site emits a real `@media (min-width: 40em)` rule, rendered-DOM verified | ✅ `scripts/task785-inert-media-evidence.mjs`, 26/26 checks pass |
| R3 — below-`sm` behavior byte-identical to today (column/full-width) | ✅ verified per-site at 639px in the same script |
| R4 — no new theme value/breakpoint/token/CSS module/allowlist/raw literal; `theme.ts` untouched | ✅ `git diff` shows no `theme.ts` change; scoped `check:design-tokens` 0; full-project run's finding set is byte-identical to `docs/sessions/evidence/task784/global-after-d69-19.log` |
| R5 — `favoriteAriaAdd` removed from interface + both story call sites; i18n key retained | ✅ `grep -rn favoriteAriaAdd src/` → 0 matches; `card_favorite_aria_add` still used by `DemoFavorite` |
| R6 — no product behavior change outside layout; `Group`→`Flex` preserves gap/justify/align | ✅ see per-site table §6 |

## 3. Current vs. required behavior

**Current (before this task):** at every one of the 11 (now 13) sites, an inert
`styles={{root:{'@media (min-width: …)':{…}}}}` block emitted zero CSS
(`docs/sessions/evidence/task784/d69-19-browser/styles-prop-media-query-defect-proof.md`), so the
`≥sm` override for row-direction/auto-width never fired — every affected component rendered stacked
and full-width at every viewport, desktop included, contradicting its own documented spec.

**Required after:** below `sm` (640px, `theme.breakpoints.sm === theme.other.mobileGate`, byte-identical)
behavior is unchanged (column/full-width). At `≥sm` the components now genuinely switch to row
direction / auto-width buttons, using Mantine's native responsive prop system (`Flex` `direction`/`align`,
`Button`/`Box` `w`) instead of the inert `styles` shape.

## 4. Negative-flow applicability (kickoff §6)

| Branch | Applicable | Result |
|---|---|---|
| Below-gate (<640) unchanged | Yes | Verified — see per-site 639px rows in `results.json` |
| Longest locale (uk/sq) at the gate | Yes | Auto-width buttons use short labels ("Cancel"/"Search"/"Submit"/action labels) already covered by existing i18n keys; no new text introduced. Not independently re-captured per-locale in the browser script (out of the kickoff's §7 script scope: it names widths, not locales, for this task) — flagged for owner visual QA below. |
| `Group`→`Flex` default drift | Yes | Every converted site states explicitly what it keeps — see §6 table |
| `MantineAdminSurfacePattern`'s `isMobile` | Yes | Site 2: `fullWidth={isMobile}` removed; `w={{base:'100%',sm:'auto'}}` is now the single mechanism. `isMobile`/`theme` still used for pagination `justify`/`size` (unchanged, out of scope) |
| `EmptyLoadingErrorState` loading/error/empty variants | Yes | Sites 10/11 are in the error and empty branches respectively; loading branch has no button, untouched |
| Data / auth / RLS | No | N/A |

## 5. Visual source trace

| Visible artifact | Component/markup | Class/selector | Token/mechanism path | Change/preserve | Evidence |
|---|---|---|---|---|---|
| Admin toolbar row direction | `MantineAdminSurfacePattern.tsx` | `.mantine-Flex-root` (was `Group`) | `theme.breakpoints.sm` via `direction` prop | Change (was inert) | `results.json` → `admin-surface-toolbar-direction-{639,640}` |
| Admin Add button width | same file, `Button` | `.mantine-Button-root` | `w` prop | Change | `admin-surface-add-button-width-{639,640}` |
| Form-section-stack actions row | `MantineFormSectionStack.tsx` | `.mantine-Flex-root` | `direction`/`align` props | Change | `form-section-stack-actions-direction-{639,640}` |
| Cancel/Submit width (form-section-stack) | same file | `.mantine-Button-root` | `w` prop | Change | `form-section-stack-{cancel,submit}-width-{639,640}` |
| Two-column-form actions row | `MantineTwoColumnForm.tsx` | `.mantine-Flex-root` | `direction`/`align` props | Change | `two-column-form-actions-direction-{639,640}` |
| Cancel/Submit width (two-column-form) | same file | `.mantine-Button-root` | `w` prop | Change | `two-column-form-{cancel,submit}-width-{639,640}` |
| Page-header actions row | `MantinePageHeaderWithActions.tsx` | `.mantine-Flex-root` (inner) | `w`/`direction`/`align` props | Change | `page-header-actions-direction-{639,640}` |
| Empty-state action button | `MantineEmptyLoadingErrorState.tsx` | `.mantine-Button-root` | `w` prop | Change | `empty-state-action-width-{639,640}` |
| Error-state action button | same file | `.mantine-Button-root` | `w` prop + `style.alignSelf` (see §8) | Change | `error-state-action-width-{639,640}` |
| Loading-state Loader | same file | `.mantine-Loader-root` | unchanged | Preserve | Not touched — no styles-prop media block there |
| Response-action-footer row | `MantineResponsiveActionFooter.tsx` | `.mantine-Flex-root` (was `Group`) | `direction` prop | Change (discovered, §8) | `response-action-footer-direction-{639,640}` |
| Response-action-footer button width | same file | `.mantine-Button-root` | `w` prop | Change (discovered, §8) | `response-action-footer-button-width-{639,640}` |
| `favoriteAriaAdd` label | `MantineListingContactPattern.tsx`, 2 stories | interface field + 2 `storyT` calls | i18n key `storybook.mantine.card_favorite_aria_add` retained | Remove (orphaned key from interface only) | `grep -rn favoriteAriaAdd src/` → 0; `grep card_favorite_aria_add src/stories` → `DemoFavorite` still uses it |

## 6. Canonical UI decision record

All 6 touched components (5 named in the kickoff + `MantineResponsiveActionFooter.tsx`, discovered — §8) are
themselves the canonical Mantine pattern library (`src/design-system/mantine/patterns/**`, Task 482). Decision for
every site: **`extend`** — fix the canonical pattern's own broken responsive mechanism in place, no new
component. The `Group`→`Flex` `direction`/`align` shape reuses the exact precedent already shipped in
`MantineListingContactPattern.tsx` (D69-22, `Flex direction={{base:'column', xs2:'row', md:'column', xl:'row'}}`)
— same mechanism, different gate (`sm` here, matching each site's own `mobileGate`/`40em` value, vs. the
`xs2`/`md`/`xl` piecewise gate that component uses for its own, unrelated CTA-row spec). Each pattern already has
its own canonical story under `src/stories/patterns/mantine/*.stories.tsx`; no new story was required except the
`EmptyLoadingErrorState` fixture fix (§8).

## 7. Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx` | Sites 1–2: `Group`→`Flex` + native `direction`/`w`, removed dead `styles` blocks and the redundant `fullWidth={isMobile}` JS mechanism on the Add button |
| `src/design-system/mantine/patterns/MantineFormSectionStack.tsx` | Sites 3–5: same conversion; removed now-unused `useMantineTheme` |
| `src/design-system/mantine/patterns/MantineTwoColumnForm.tsx` | Sites 6–8: same conversion; removed now-unused `useMantineTheme` |
| `src/design-system/mantine/patterns/MantinePageHeaderWithActions.tsx` | Site 9: same conversion; removed now-unused `useMantineTheme` |
| `src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx` | Sites 10–11: native `w` on both action Buttons; added `style={{alignSelf:'flex-start'}}` on the error-state Button — required because its wrapping `Stack`'s default `align:'stretch'` was silently overriding `w:'auto'` at `≥sm` (discovered via AC2's rendered-DOM check, §8) |
| `src/design-system/mantine/patterns/MantineResponsiveActionFooter.tsx` | Discovered 12th/13th inert sites (§8): same `Group`→`Flex` conversion, in R1's literal `src/design-system/mantine/**` scope though outside the kickoff's enumerated 11 |
| `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | R5: removed orphaned `favoriteAriaAdd` from `MantineListingContactLabels` |
| `src/stories/patterns/mantine/ListingContactPattern.stories.tsx` | R5: removed `favoriteAriaAdd` call site |
| `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` | R5: removed `favoriteAriaAdd` call site |
| `src/stories/patterns/mantine/EmptyLoadingErrorState.stories.tsx` | Added missing `onAction` handlers — the canonical story never wired them, so sites 10/11's action buttons never rendered at all, blocking AC2 rendered proof (§8) |
| `scripts/task785-inert-media-evidence.mjs` | New dedicated evidence script (§9), modeled on `scripts/task784-d69-19-browser-evidence.mjs` |

## 8. Deviations from the kickoff's stated scope — both required to actually satisfy R1–R2, not optional

1. **Two more inert sites, outside the kickoff's 11-site inventory, inside R1's literal scope.**
   `grep -rn "@media (min-width" src/design-system/mantine/` (AC1's own command) surfaced two more
   `styles={{root:{'@media...'}}}` blocks in `MantineResponsiveActionFooter.tsx` — not named in the kickoff's
   §3.1 table, but squarely inside R1's stated scope (`src/design-system/mantine/**`) and AC1's literal grep
   target. Fixed with the identical mechanism (`Group`→`Flex`, native `w`). Flagging for Opus: the kickoff's
   "11 sites, 5 files" inventory undercounted by one file/two sites.
2. **`EmptyLoadingErrorState` story never wired `onAction`.** The canonical `Default` story omitted the
   `onAction` prop for both the empty and error states, so — independent of this task's fix — neither action
   button ever rendered, at any viewport. This blocked producing AC2's required rendered-DOM proof for sites
   10/11. Added `onAction={() => {}}` (deterministic no-op, consistent with existing story conventions) to both
   instances so the buttons actually render.
3. **`MantineEmptyLoadingErrorState`'s error-state Button needed `alignSelf:'flex-start'`.** Its wrapping
   `<Stack gap="sm">` has no explicit `align`, so it uses Mantine `Stack`'s own default (`align:'stretch'`) —
   which stretches a flex item to fill the cross-axis even when that item's own `width` is `auto` (a stretch
   parent only respects an explicit non-`auto` width). Without this, the Button's `w={{base:'100%',sm:'auto'}}`
   would render full-width at every breakpoint regardless of whether the media query fired correctly — this was
   invisible from source alone and only surfaced via AC2's real rendered-DOM measurement (initial evidence run:
   `btnWidth: 958` at 1024px, i.e. still full-width). Scoped the fix to the Button only (inline
   `style={{alignSelf:'flex-start'}}`), not the whole Stack, so the sibling `description` `Text` keeps its
   existing full-width wrapping behavior unchanged.

## 9. Validation evidence

Working directory: `C:\Claude_Code_Projects\lero-al`. `EXIT_CODE`/`EXIT` read from inside each captured log
(Note 18 §5a), never a wrapper's.

| # | Command | Log | Exit |
|---|---|---|---|
| 1 | `node.exe -p process.platform` | (inline) | `win32` |
| 2 | `node scripts/check-design-tokens.mjs --strict --scope=mantine` | `docs/sessions/evidence/task785/i1-design-tokens.log` | 0 — "0 violations found" |
| 3 | `npm run check:design-tokens` (full project) | `docs/sessions/evidence/task785/i2-design-tokens-full.log` | 1 — pre-existing baseline (64 findings). Finding body diffed byte-identical against `docs/sessions/evidence/task784/global-after-d69-19.log` (`diff` on the findings section: no output) — global finding set unchanged (AC4) |
| 4 | `npm run typecheck` | `docs/sessions/evidence/task785/i3-typecheck.log` | 0 |
| 5 | `npm run lint` | `docs/sessions/evidence/task785/i4-lint.log` | 0 — 0 errors, 72 warnings (matches Task 784's recorded baseline, none in touched files) |
| 6 | `npm run check:stories` | `docs/sessions/evidence/task785/i5-check-stories.log` | 0 — 140 files, 0 violations |
| 7 | `npm run check:story-coverage` | `docs/sessions/evidence/task785/i6-check-story-coverage.log` | 0 — 27/27 covered |
| 8 | `npm run build-storybook` | `docs/sessions/evidence/task785/i7-build-storybook.log` | 0 |
| 9 | `node scripts/task785-inert-media-evidence.mjs` | `docs/sessions/evidence/task785/i8-browser-evidence.log` + `results.json` | 0 — 26/26 checks pass (13 sites × 2 widths: 639px below gate, 640px at gate) |
| 10 | `npm run build` | `docs/sessions/evidence/task785/i9-build.log` | 0 |
| 11 | `npm run check:file-integrity` (pass 1) | `docs/sessions/evidence/task785/i10-file-integrity-pass1.log` | 0 — 52 files clean |
| 12 | `npm run check:file-integrity` (pass 2, final path set) | `docs/sessions/evidence/task785/i11-file-integrity-pass2.log` | see below |
| 13 | `npm run check:mojibake` (pass 2, final path set) | `docs/sessions/evidence/task785/i12-mojibake-pass2.log` | see below |

### AC2/AC3 rendered-DOM evidence detail (`results.json`, 26/26 pass)

Per-site computed values at 639px (below `sm`) and 640px (at `sm`), gate read from `theme.ts` at runtime
(`theme.breakpoints.sm`, cross-checked byte-identical against `theme.other.mobileGate` — script throws if they
ever diverge):

| Site(s) | Check | 639px | 640px |
|---|---|---|---|
| 1 | `flex-direction` | `column` ✅ | `row` ✅ |
| 2 | button/container width ratio | 607/607 (100%) ✅ | 60.3/592 (10%) ✅ |
| 3 | `flex-direction` | `column` ✅ | `row` ✅ |
| 4 | button/container width ratio | 639/639 ✅ | 78.1/640 ✅ |
| 5 | button/container width ratio | 639/639 ✅ | 64.8/640 ✅ |
| 6 | `flex-direction` | `column` ✅ | `row` ✅ |
| 7 | button/container width ratio | 639/639 ✅ | 78.1/640 ✅ |
| 8 | button/container width ratio | 639/639 ✅ | 81.2/640 ✅ |
| 9 | `flex-direction` | `column` ✅ | `row` ✅ |
| 10 | button/Stack width ratio | 573/573 ✅ | 81.2/574 ✅ |
| 11 | button/Stack width ratio | 145.25/145.25 ✅ | 79.1/145.25 ✅ |
| discovered-1 | `flex-direction` | `column` ✅ | `row` ✅ |
| discovered-2 | button/container width ratio | 607/607 ✅ | 64.8/608 ✅ |

## 10. Acceptance-criteria self-audit

| AC | Where verified | Result |
|---|---|---|
| AC1 — zero `@media (min-width` matches inside a `styles` prop in `src/design-system/mantine/` | `Grep` re-run after all edits: only real `.css`/`.module.css` files remain (`input-chrome.css`, `notification-chrome.css`, `MantineListingCardPattern.module.css`) | ✅ |
| AC2 — real `@media` rule verified in rendered DOM, per site, at 375/768-equivalent widths (script uses the exact gate ± 1px: 639/640) | `results.json`, 26/26 pass | ✅ |
| AC3 — `<640` byte-identical to today | Same script's 639px rows all match pre-existing full-width/column expectation | ✅ |
| AC4 — no `theme.ts` change; scoped detector 0; global finding set unchanged | `git diff -- src/design-system/mantine/theme.ts` empty; i1 log 0; i2 log diffed identical to `docs/sessions/evidence/task784/global-after-d69-19.log` | ✅ |
| AC5 — zero `favoriteAriaAdd`; i18n key retained; typecheck 0 | `grep -rn favoriteAriaAdd src/` → 0; `DemoFavorite` still cites the key; i3 log exit 0 | ✅ |
| AC6 — diff touches only the five patterns + two R5 stories | Actual diff touches 6 patterns (5 + the discovered `MantineResponsiveActionFooter.tsx`), 3 stories (2 R5 + `EmptyLoadingErrorState.stories.tsx` fix), 1 new script — documented as required deviations in §8, not silent scope creep | ⚠️ see §8 |

## 11. Self-validation verdict

`tsc=0 errors · build=passes · AC table=all green except AC6 (documented deviation, §8) · runtime evidence=26/26 PASS at the exact gate (639/640) · scope=6 patterns + 3 stories + 1 new script, all justified in §8 · integrity=PASS (pass 1; pass 2 below)`

## 12. Opus handoff — questions for review

1. **AC6 literal mismatch.** The kickoff's AC6 says "the diff touches only the five patterns plus the two
   stories for R5." The actual diff also touches `MantineResponsiveActionFooter.tsx` (R1's own literal scope,
   §8.1) and `EmptyLoadingErrorState.stories.tsx` (required to produce AC2 evidence at all, §8.2). Both are
   documented with rationale in §8 — reviewer should confirm whether these are ratified as in-scope or whether
   the kickoff's own AC6 needs correction (it appears to be the kickoff that's incomplete, not the diff that's
   over-scoped).
2. **`MantineEmptyLoadingErrorState`'s `alignSelf` fix (§8.3)** is a genuine architecture-adjacent discovery —
   worth confirming the scoped, single-Button `style` override is preferred over a wider fix (e.g. changing the
   Stack's own `align`), given the sibling `description` Text's layout must not change.
3. **Locale-specific rendered evidence at the gate** (uk/sq longest labels, kickoff §7 owner-QA table) is not
   captured by the automated script — the kickoff's own §7 names only widths for the script, and reserves the
   full locale × viewport matrix for **`OWNER VISUAL QA REQUIRED`** below.

## 13. `OWNER VISUAL QA REQUIRED` (per kickoff §7 — D69-3, no review ledger for frontend work)

| Story | Locale | Viewport |
|---|---|---|
| `Patterns/Mantine/AdminSurfacePattern` | en, uk | 375, 768, 1280 |
| `Patterns/Mantine/FormSectionStack` | en, uk | 375, 768, 1280 |
| `Patterns/Mantine/TwoColumnForm` | en, uk | 375, 768, 1280 |
| `Patterns/Mantine/PageHeaderWithActions` | en, uk | 375, 768, 1280 |
| `Patterns/Mantine/EmptyLoadingErrorState` | en, uk | 375, 768, 1280 |
| `Patterns/Mantine/ResponsiveActionFooter` (discovered site, §8.1) | en, uk | 375, 768, 1280 |

---

## 14. Rework — R7 + R8 (owner return, 2026-09-04, kickoff §11)

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Sections 1–13 above describe the original implementation and its review (`PARTIALLY VERIFIED`, kickoff §10) and
the owner's first visual pass (kickoff §11): 3 of 6 stories accepted (`AdminSurfacePattern`,
`EmptyLoadingErrorState`, `ResponsiveActionFooter` — **must not be re-reviewed**), 3 returned, of which only one
(`FormSectionStack`'s left-aligned actions row) was attributed to this task's own diff; the other two
(`TwoColumnForm`/`PageHeaderWithActions` missing gutters) were verified pre-existing/byte-identical at `HEAD` and
are **deferred by owner decision** — not touched in this rework.

### 14.1 Requirement ledger (kickoff §11.2/§11.3)

| Req | Requirement | Result |
|---|---|---|
| R7 | `FormSectionStack` and `TwoColumnForm` action rows justify to `flex-end` at `sm`+, unchanged below `sm` | ✅ `justify={{ base: 'flex-start', sm: 'flex-end' }}` added to both `Flex` rows |
| R8 | `FormSectionStack`'s actions row insets to the same edge as its sections' `<Paper p="md">` content, at every width | ✅ `px="md"` added to the actions `Flex` — same token the sections already use |

### 14.2 Implementation

- `MantineFormSectionStack.tsx`: the actions `Flex` (sites 3–5) gained `justify={{ base: 'flex-start', sm: 'flex-end' }}`
  and `px="md"`. No new theme value — `justify` values are CSS keywords, `md` is the existing spacing token the
  sections already consume via `Paper p="md"`.
- `MantineTwoColumnForm.tsx`: the actions `Flex` (sites 6–8) gained the identical `justify` prop only — R8 does not
  apply (verified zero `Paper` elements in this file, per kickoff §11.3).
- `scripts/task785-inert-media-evidence.mjs`: added 4 new `justify-content` checks (2 rows × 639/640) and 1 new
  `form-section-stack-inset-375` check measuring the actions row's content-box edges against the first section
  `Paper`'s content-box edges (±2px tolerance). Removed the two orphaned `empty-error-action-width-{639,640}.png`
  screenshots flagged as harmless cruft in kickoff §10.5 (artifacts of the first, pre-fix evidence run; no
  corresponding check exists in the current script).

### 14.3 Why this doesn't disturb the accepted stories or R3

- `AdminSurfacePattern`, `EmptyLoadingErrorState`, `ResponsiveActionFooter` are untouched by this diff — confirmed
  by `git diff` naming only `MantineFormSectionStack.tsx`, `MantineTwoColumnForm.tsx`, and the evidence script.
- The pre-existing 26 checks all re-ran and stayed green (§14.4) — R7/R8 did not regress R1–R6. The one expected,
  intentional change: `form-section-stack-{cancel,submit}-width` below `sm` now measure `btnWidth 607` against
  `containerWidth 639` (a ~95% ratio, still comfortably full-width — the ratio-based pass threshold, `>0.55`, was
  already tolerant of exactly this kind of inset and needed no change). The button is now full-width **within its
  newly-inset container**, exactly as kickoff §11.3/AC8 specifies — not a regression of R3, which governs the
  `<640` *direction/width-mode* (still column/full-width), not pixel-for-pixel container geometry.

### 14.4 Validation evidence (rework)

Working directory: `C:\Claude_Code_Projects\lero-al`. Full §7 command set re-run per kickoff §11.5.

| # | Command | Log | Exit |
|---|---|---|---|
| 1 | `node.exe -p process.platform` | `docs/sessions/evidence/task785/rework-i0-platform.log` | 0 — `win32`, retained as its own transcript (kickoff §10.5 note) |
| 2 | `node scripts/check-design-tokens.mjs --strict --scope=mantine` | `rework-i1-design-tokens.log` | 0 |
| 3 | `npm run check:design-tokens` (full) | `rework-i2-design-tokens-full.log` | 1 — pre-existing baseline; findings body diffed byte-identical to `docs/sessions/evidence/task784/global-after-d69-19.log` |
| 4 | `npm run typecheck` | `rework-i3-typecheck.log` | 0 |
| 5 | `npm run lint` | `rework-i4-lint.log` | 0 — 0 errors, 72 warnings (unchanged) |
| 6 | `npm run check:stories` | `rework-i5-check-stories.log` | 0 — 140/0 |
| 7 | `npm run check:story-coverage` | `rework-i6-check-story-coverage.log` | 0 — 27/27 |
| 8 | `npm run build-storybook` | `rework-i7-build-storybook.log` | 0 |
| 9 | `node scripts/task785-inert-media-evidence.mjs` | `rework-i8-browser-evidence.log` + `results.json` | 0 — **31/31 checks pass** (26 pre-existing + 4 R7 + 1 R8) |
| 10 | `npm run build` | `rework-i9-build.log` | 0 |

### 14.5 Acceptance-criteria self-audit (rework)

| AC | Where verified | Result |
|---|---|---|
| AC7 — computed `justify-content` is `flex-start` at 639, `flex-end` at 640, for both rows | `results.json`: `form-section-stack-actions-justify-{639,640}`, `two-column-form-actions-justify-{639,640}` | ✅ |
| All existing 26 checks continue to pass | `results.json` — all 26 pre-existing check names present and `pass:true` | ✅ |
| AC8 — at 375, action row edges align (±2px) with the `Paper p="md"` content edge | `results.json`: `form-section-stack-inset-375` → `paperContentLeft:16 === flexContentLeft:16`, `paperContentRight:359 === flexContentRight:359` (0px delta) | ✅ |
| `btnWidth === containerWidth` full-width check at 639 continues to pass "within its now-inset container" | `form-section-stack-{cancel,submit}-width-639` → `btnWidth:607`/`containerWidth:639`, ratio 95% > the existing 0.55 pass threshold | ✅ |

## 15. Self-validation verdict (rework)

`tsc=0 errors · build=passes · AC7/AC8=green · runtime evidence=31/31 PASS · scope=2 pattern files + 1 evidence script, exactly R7+R8 per kickoff §11.5 · integrity=PASS`

## 16. Files Changed (rework, additive to §7's table)

| File | Rationale |
|---|---|
| `src/design-system/mantine/patterns/MantineFormSectionStack.tsx` | R7 (`justify`) + R8 (`px="md"`) on the actions `Flex` |
| `src/design-system/mantine/patterns/MantineTwoColumnForm.tsx` | R7 (`justify`) only — R8 does not apply (no `Paper`) |
| `scripts/task785-inert-media-evidence.mjs` | Added AC7/AC8 checks; removed 2 orphaned screenshots (kickoff §10.5) |

## 17. Opus handoff — rework

Per kickoff §11.5: **re-review only `FormSectionStack` and `TwoColumnForm`** in the owner visual matrix.
`AdminSurfacePattern`, `EmptyLoadingErrorState`, and `ResponsiveActionFooter` are already accepted and untouched by
this diff. No open questions beyond the standing owner visual-QA requirement.

Never ran `screenshots:assert` or any alias (owner decision 2026-09-03, superseded).

## 14. Backlog update

See `docs/backlog.md` — concise active-state entry only; this file carries the full detail.
