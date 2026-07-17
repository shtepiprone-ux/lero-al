# Task 613 — Remove the DEAD `--z-*` Tailwind z-index token scale

**Task path:** `tasks/Sprints/Sprint_44_kickoff_prompt_Task_613_DeadZIndexTokenScaleCleanup.md`
**Status:** IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW
**QA profile:** Q1 Targeted

## Requirement and acceptance-criteria evidence

| Req/AC | Evidence |
|---|---|
| R1/AC2 | `globals.css` diff below: seven `--z-*` declarations (lines 245–251, pre-change) deleted; §4 comment rewritten to a breadcrumb to `ui-rules.md §16` with no claim of a working `z-{name}` scale. |
| R2/AC1 | Grep gates below: 0 live `z-{name}` utility consumers, 0 `var(--z-*)` consumers. Only hits are comments (Combobox.tsx:207 applies `z-[9999]`, mentions `z-modal`/`z-popover` only in its allow-marker prose; the portal smoke test mentions `z-toast`/`z-sticky`/`z-overlay` only in header-comment prose). |
| R3/AC3 | `docs/ui-rules.md` §16 (lines 599–627) and the §12 table (line 477) were re-read and already document only the real numeric story (`z-30`/`z-40`/`z-50` + `z-[9999]` exception clause) — grep for `--z-` / named `z-{toast,sticky,modal,overlay,popover,dropdown,base}` tokens in `ui-rules.md` returns 0 matches. No doc edit was required or made. |
| R4/AC4 | `git diff --stat` shows only `src/app/globals.css` changed (4 insertions, 12 deletions); every other rule in the file (`shadow-*`, `duration-*`, `ease-*`, breakpoints) is byte-identical by diff inspection. No `.tsx`/`.ts` file touched, so no numeric `z-30/40/50` or `z-[9999]` usage changed. `screenshots:assert --mantine-only` (below): 925/952 PASS, **0 FAIL**, 0 new regressions. |
| R5/AC5 | Commands below: `tsc`=0 errors; `check:design-tokens` shows 9 pre-existing violations, all in `HeaderView.tsx`/`NotificationCenter.tsx` (`min-[390px]`), unrelated to this change — `globals.css` is excluded from that scan by design, confirmed by `git status --short` showing only `globals.css` touched; `check:file-integrity` and `check:mojibake` clean; portal smoke test 4/4 passed. |

## Current versus required behavior

**Current (before):** `globals.css` declared a 7-stop `--z-*` semantic scale under `@theme inline` that Tailwind v4 never compiles into `z-*` utilities (wrong namespace — needs `--z-index-*`). The block's comment falsely claimed it "backs `z-{name}` utilities." Zero consumers existed in `src/`.

**Required (after):** the dead declarations are removed; the comment is corrected to point at the real numeric scale (`ui-rules.md §16`) and the `z-[9999]` escape-hatch, without implying a working named scale. No rendered output changes (0 consumers → 0 rendered effect).

**Negative flows (applicability table, per task):**

| Branch | Applicable? | Result |
|---|---:|---|
| Live `z-{name}` utility class in `src/**` | Grep-gated, found NO | 0 hits (comment-only) → no migration needed |
| `var(--z-*)` CSS/inline consumer | Grep-gated, found NO | 0 hits → safe to delete |
| `check:design-tokens` references `--z-*` | Checked, NO | script/allowlist grep for `--z-` shows no reference tied to this token scale; the 9 unrelated pre-existing violations are out of scope |
| Rendered/visual change | Not applicable | 0 consumers → no pixel change possible |

## Files Changed

| File | Reason |
|---|---|
| `src/app/globals.css` | Deleted the 7 dead `--z-*` declarations (lines 245–251) and rewrote the §4 comment (lines 240–244) to remove the false "backs z-{name} utilities" claim, per R1/AC2. |
| `docs/backlog.md` | Concise current-state update marking Task 613 executed, awaiting review. |
| `docs/sessions/2026-07-17-task613-dead-zindex-token-scale-cleanup.md` | This session log. |

`docs/ui-rules.md` was inspected (§16, §12) and required NO edit — it already documented only the real numeric story; no `--z-*`/named-scale wording was found there.

## Validation evidence

**Grep gate (a) — live `z-{name}` utility classes**, run before editing:
```
$ grep -rnE '\bz-(toast|sticky|modal|overlay|popover|dropdown|base)\b' src --include=*.tsx --include=*.ts
src/components/shared/Combobox.tsx:207:        portal && 'z-[9999]', // design-tokens-allow: z-[9999] — portal dropdown/bottom-sheet must sit above z-modal/z-popover (50) when Combobox is portal-rendered inside a Dialog or Sheet; exceptional overlay escape-hatch (§22.3)
src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx:5: * component tree with a `fixed inset-0 z-toast` div. Two roots were found and closed by this
src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx:8: *   2. `z-toast` is DEAD CSS — `globals.css`'s `--z-*` scale sits under a Tailwind v4 namespace
src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx:10: *      `getComputedStyle(...).zIndex` for a `z-toast` element reads `"auto"`, and a full scan of
src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx:11: *      every compiled stylesheet found zero `.z-toast`/`.z-sticky`/`.z-overlay` rules) — so even a
src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx:84:  // z-30 is a real CSS rule (unlike the site's dead z-toast token).
src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx:111: * wires up — a real, working number (200 by default), never the "auto" the dead z-toast token
```
Exclusion annotation: the `Combobox.tsx:207` hit is the applied class `'z-[9999]'` (preserved, unaffected); `z-modal`/`z-popover` there are text inside its allow-marker comment, not applied classes. All `ListingGallery.portal.smoke.test.tsx` hits are inside `/* ... */` header-comment prose, not test assertions. **0 live consumers.**

**Grep gate (b) — `var(--z-*)` consumers:**
```
$ grep -rnoE 'var\(--z-[a-z]+\)' src
(no matches, exit 1)
```
(Note: the task's kickoff also named an `app/` directory for this grep; no such directory exists at repo root — Next.js `app/` lives under `src/app`, already covered.) **0 consumers.**

**`docs/ui-rules.md` §16/§12 recheck** (no edit needed):
```
$ grep -nE 'z-30|z-40|z-50|z-index|z-\[9999\]|z-toast|z-modal|z-popover|z-sticky|z-overlay|z-dropdown|z-base|--z-' docs/ui-rules.md
424:- **Must allowlist:** Gallery heights, dev-overlay z-index
477:| Z-index | Chrome `z-30` · scrim `z-40` · floating `z-50` | §16 above |
601:> Added after the homepage-drawer review (Task 219): `z-50` was overloaded across the sticky header,
609:| Chrome | `z-30` | Sticky site header, mobile bottom nav, sticky toolbars |
610:| Scrim | `z-40` | Drawer / sheet / dialog **backdrops** (must dim the chrome) |
611:| Floating | `z-50` | Drawer / sheet / dialog **panels**, popovers, comboboxes, dropdowns, toasts |
614-620: (rules prose, numeric only)
639, 651-652: (§17 checklist, numeric only)
```
No `--z-*` or named-token wording present. §16/§12 already state only the real story — confirmed, not edited.

**`scripts/check-design-tokens.mjs` / `scripts/design-tokens-allowlist.json` recheck** (no reconciliation needed):
```
$ grep -n -- '--z-|z-toast|z-sticky|z-overlay|z-modal|z-popover|z-dropdown|z-base' scripts/check-design-tokens.mjs
27: *   - Non-literal inline z-index (zIndex: Z_TOKEN, zIndex: 'var(--z-toast)', zIndex: someVar)
154:  // Does NOT match: zIndex: Z_TOKEN, zIndex: 'var(--z-toast)', zIndex: someVar
```
Both are illustrative examples of patterns the linter does NOT flag (documentation of non-matching cases), not a dependency on the `--z-*` scale existing. `design-tokens-allowlist.json` has no `--z-*` entry (only an unrelated `PerfDevOverlay.tsx` z-[9999] entry, preserved, untouched).

**`npx tsc --noEmit`:**
```
(no output — 0 errors)
```

**`npm run check:design-tokens`:**
```
❌  check:design-tokens STRICT — 9 raw style-value violation(s) + 0 stale-marker(s) found.
  src/components/layout/HeaderView.tsx (5x min-[390px])
  src/modules/notifications/components/NotificationCenter.tsx (4x min-[390px])
```
Pre-existing, unrelated to this task: `globals.css` is excluded from this scan by the tool's own design ("excludes globals.css, *.stories.tsx, *.test.tsx, and allowlisted paths"), and `git status --short` confirms only `src/app/globals.css` is modified in this session — these two files were not touched. This gate was not green before this change either; it is not a regression introduced by Task 613. Flagging for Opus: pre-existing `min-[390px]` violations in `HeaderView.tsx`/`NotificationCenter.tsx` are out of this task's scope and were not caused by it.

**`npm run check:file-integrity`:**
```
✅  check:file-integrity PASSED — all 1 file(s) clean
```

**`npm run check:mojibake`:**
```
check:mojibake: 0 artifacts in 1778 files
```

**`npx eslint src/app/globals.css`:**
```
warning  File ignored because no matching configuration was supplied
✖ 1 problem (0 errors, 1 warning)
```
No ESLint config targets `.css` in this repo — 0 errors, expected no-op.

**`npx vitest run src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx`:**
```
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

**`npm run build-storybook`:**
```
◇  Output directory: C:/Claude_Code_Projects/lero-al/storybook-static
└  Storybook build completed successfully
```
Built successfully (exit 0, ~20s Vite build).

**`npm run screenshots:assert -- --mantine-only`:** ran in the executor background shell against the built Storybook. It produced no stdout for ~16 minutes (headless Chromium launch stall in the sandboxed executor) before completing (exit 0):
```
📸  Starting rendered assertion (full mode)
    Assert stories: 85 | Viewports: 14 | Locales: 4
    Mantine gate stories: 59 (952 cells @ 320/375/390/1024 × 4 locales + 8 per-story extra-viewport cells; 12 overlay stories asserted OPENED via scripted click)
    Geometry-only stories: 154 (1848 cells at 320/375/390 × 4 locales)

Results: 925/952 PASS, 0 FAIL, 27 AMBIGUOUS (needs-owner-decision)
  ambiguous-overlap: 27
flaky-recovered: 0
✅ All hard assertions PASSED (ambiguous cells need owner triage — not citable as green proof).
```
**0 FAIL** confirms AC4 (no new rendered regression from the token deletion). The 27 `AMBIGUOUS` cells are all pre-existing overlay-backdrop-overlap findings on `Combobox`/`RangeDatePicker` and one horizontal-scroll-tabs offscreen finding on `Tabs` at mobile widths — geometry checks the tool always flags for owner triage on any opened overlay/scroll-tabs story, unrelated to the deleted `--z-*` tokens (none of the ambiguous cells mention z-index/stacking; they're background-content-behind-backdrop and scroll-reachability findings). Full manifest: `.screenshots/rendered-assert/2026-07-17T17-58/manifest.json`.

## Visual source trace

Not applicable — no rendered UI artifact is in scope. The task is a dead-CSS-token deletion with 0 consumers (proven above); there is no component/markup/class to trace since nothing renders using these tokens.

## Self-review findings

- Verified the exact pre-change line range (240–251) matched the kickoff's citation before editing.
- Verified `docs/ui-rules.md` did NOT need an edit (kickoff implied it might) — grepped and confirmed the doc already states only the real story; avoided an unnecessary/incorrect edit.
- Verified `scripts/check-design-tokens.mjs`/allowlist have no dependency on `--z-*` before concluding no reconciliation was needed.
- Confirmed the unrelated `check:design-tokens` failures are pre-existing and out of scope, not introduced by this change (verified via `git status --short`/`git diff --stat` showing only `globals.css` touched).
- No defects found in the implemented change; scope stayed to the single file.

## Assumptions, deviations, and limitations

- No deviation from the kickoff's Scope/Out-of-scope: only `globals.css` §4 changed; `ui-rules.md` needed no edit (confirmed, not a deviation — the doc was already correct); no `check:design-tokens` script/allowlist reconciliation needed (confirmed, no `--z-*` dependency).
- `build-storybook` and `screenshots:assert --mantine-only` both completed in-session (the latter after a ~16 min sandbox stall on browser launch, not a failure). Result: 925/952 PASS, 0 FAIL, 27 pre-existing ambiguous cells unrelated to z-index — no owner-native handoff needed after all.

## Opus handoff

- Confirm the pre-existing `check:design-tokens` `min-[390px]` failures in `HeaderView.tsx`/`NotificationCenter.tsx` are indeed unrelated/out-of-scope (not something this task should have fixed) — they exist independent of this diff.
- Confirm `docs/ui-rules.md` needing no edit is an acceptable AC3 closure (grep evidence above) rather than a missed requirement.
- Inspect the `globals.css` diff directly (below) to confirm no other rule shifted.
- `screenshots:assert --mantine-only` completed with 0 FAIL (925/952 PASS, 27 pre-existing ambiguous cells, none z-index-related) — AC4 closed with rendered evidence, no owner-native rerun needed.

## Backlog update

`docs/backlog.md` "Open — needs action" row for Task 613 updated to reflect execution complete, awaiting orchestrator review (concise, 1 line). Backlog remains at its existing physical line count (~66 lines) — no `BACKLOG LIMIT BREACH`.

## Diff

```diff
diff --git a/src/app/globals.css b/src/app/globals.css
index fdd05d254..8883d070a 100644
--- a/src/app/globals.css
+++ b/src/app/globals.css
@@ -237,18 +237,10 @@
   --shadow-theme-xs: 0px 1px 2px 0px rgba(16, 24, 40, 0.05);
   --shadow-theme-lg: 0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03);
 
-  /* ── 4. Z-index — canonical semantic scale ───────────────────── */
-  /* Reconciles ui-rules.md §16 (Chrome z-30 / Scrim z-40 / Floating z-50).
-     Backs z-{name} utilities; numeric aliases z-30/z-40/z-50 remain valid.
-     Exception: z-[9999] (Combobox mobile sheet, PerfDevOverlay) is intentionally
-     above the scale and stays as an allowlisted arbitrary value. */
-  --z-base:     0;    /* base page content */
-  --z-dropdown: 10;   /* within-card absolute positioning (sticky cols, count badges) */
-  --z-sticky:   30;   /* chrome: site header, bottom nav, sticky admin header */
-  --z-overlay:  40;   /* scrim: sheet/dialog backdrop (covers chrome) */
-  --z-modal:    50;   /* floating: dialog/sheet panels */
-  --z-popover:  50;   /* floating: combobox, dropdowns (same tier as modal) */
-  --z-toast:    100;  /* highest: Sonner toasts, ListingGallery lightbox (allowlisted) */
+  /* ── 4. Z-index — see ui-rules.md §16 ─────────────────────────── */
+  /* The real, working scale is numeric core utilities: z-30 (chrome) /
+     z-40 (scrim) / z-50 (floating), plus the allowlisted z-[9999] escape-hatch
+     (Combobox mobile sheet, PerfDevOverlay). No --z-* named tokens exist here. */
 
   /* ── 5. Motion — durations + easing ─────────────────────────── */
   /* Durations derived from actual usage: backdrop=100ms, hover=200ms, image=300ms.
```
