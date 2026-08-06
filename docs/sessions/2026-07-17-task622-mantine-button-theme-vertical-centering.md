# Session Archive: Task 622 — Mantine Button theme-wide vertical-centering fix — 2026-07-17

## Task path and status

`tasks/kickoff_prompt_Task_622_MantineButtonThemeVerticalCentering.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Summary

Fixed the theme-wide Mantine `Button` vertical-centering defect (Task 621 finding #3) at the shared
`theme.ts` level. Root cause: theme `styles.root.height:'auto'` (kept for Task 502 wrap-growth) defeats
Mantine's own `.mantine-Button-inner { height:100% }` centering mechanism — a percentage height cannot
resolve against an `auto`-height parent, so `inner` collapsed to its content height and rendered
top-aligned inside the enforced 44px box. Used the kickoff's recommended **A1** approach
(`styles.inner.minHeight`), plus one self-review correction found during implementation: the border
(1px top+bottom, present on every variant) had to be compensated in the `inner` minHeight, or root grew
to 46px instead of staying at 44px.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | Content vertically centered at theme level | Playwright DOM measurement: `rootCenter === innerCenter === labelCenter` (offset 0) for every non-loading button, all 13 canonical widths × en, all 4 locales at 320 |
| R2/AC2 | 44px minHeight preserved for every variant/size | Measured `rootHeight: 44` for all 16 story buttons at all 13 widths + 4 locales (self-review caught and fixed a 46px regression before this passed — see Self-review) |
| R3/AC3 | fullWidth stays 100%, natural-width stays shrink-to-fit | Measured `MobileNavDrawer` (Logout, fullWidth, 288/288/288px @ 320/768/1440 = 100% container), `FiltersPanelShell` (Apply/Reset, fullWidth, 288→348→348px = 100% container; toggle-grid buttons NOT fullWidth, stayed at natural width ≠ container), `AuthFormPattern` (Sign In/Create Account, fullWidth, 190/638/1310px = 100% container at each width) |
| R4/AC4 | Wrap-growth preserved, no clipping/overflow at 320 incl. uk | Long-label cell (en/sq/uk/it) wraps to 2 lines (label height 28px measured), stays centered (offset 0), root stays 44px (2-line content fits under the inner floor), `document.documentElement.scrollWidth === 320` (no h-overflow) in all 4 locales |
| R5/AC5 | Variant chrome (filled/default/subtle/light/transparent) unchanged | Diff shows zero change to `vars`, `boxShadow`, `label`, or any color/border/padding — only an `inner` key added; rendered screenshots (all 13 widths) show unchanged fill/border/text-color per variant |
| R6/AC6 | Homepage Agent-CTA (Task 621) still correct | Re-measured against `next dev`: offset 0, height 44 at 320/390/768/1440 (en) + 320 (uk); width = container (100%) at 320/390, natural (166.83px) at 768/1440; `href` correct per locale; no h-overflow at 320 in either locale |
| R7/AC7 | Only `theme.ts` Button `styles` changed; no design-token violation | `git diff` = one file, one added `inner` key + comment; `check:design-tokens` → 0 new violations in `theme.ts` (9 pre-existing, unrelated files) |

## Current versus required behavior

**Before:** every Mantine `Button` enforced `minHeight:44px` at the theme level but rendered its
icon+label content top-aligned inside that box (a ~13px offset at 1920px, per Task 621's measurement),
because the root's `height:'auto'` broke the inner's percentage-height centering mechanism. Only the
Homepage Agent-CTA had a local per-control patch (Task 621).

**After:** every Mantine `Button` site-wide renders centered at the theme level — `theme.ts` `Button.styles.inner.minHeight` gives the inner element its own definite height floor so its existing
`align-items:center` resolves against a real number instead of a collapsed one.

**Applicable negative flows:**

| Branch | Applicable? | Evidence |
|---|---:|---|
| Long-label wrap / 320px overflow | **Yes** | Confirmed no clip, no h-overflow, still centered, in en/sq/uk/it (see R4/AC4) |
| Full-width regression | **Yes** | Confirmed fullWidth stays 100%, natural stays shrink-to-fit (see R3/AC3) |
| Validation / Authorization / Offline / Concurrent-writer | No | Pure presentational theme change, no such surface (per kickoff applicability table) |

## Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/theme.ts` | Added `styles.inner: { minHeight: 'calc(2.75rem - 2 * (0.0625rem * var(--mantine-scale)))' }` to the shared `Button` theme component (inside the existing `styles` callback, alongside the untouched `root`/`label` blocks) — the single shared-primitive fix, applies to every Mantine `Button` consumer site-wide |

No other file was touched. (Three ad-hoc Playwright scripts under `scripts/_task622-*.mjs` were created for evidence capture during this session and deleted before completion — confirmed via `git status --short` showing only `theme.ts` modified.)

## Validation evidence

1. `npm run typecheck` → **0 errors** (ran twice: once after the initial A1 edit, once after the border-compensation correction).
2. `npx eslint src/design-system/mantine/theme.ts` → **clean, no output**.
3. `npm run check:design-tokens` → **9 pre-existing violations, 0 in `theme.ts`** (`HeaderView.tsx`/`NotificationCenter.tsx` `min-[390px]` arbitrary-breakpoint findings — same pre-existing set Task 621 recorded, confirmed unrelated to this diff via `git status`).
4. `npm run check:file-integrity` → **PASSED**, 1 file clean.
5. `npm run check:mojibake` → **0 artifacts in 1783 files**.
6. Storybook rendered proof (`mantine-primitives-button--default`, Storybook dev server): captured all 13 canonical widths (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920) at `en`, plus `sq`/`uk`/`it` at 320. Visually confirmed: filled/default/subtle/light(destructive)/transparent chrome unchanged, leftSection icon+label centered (the exact "Save changes" full-width case cited in the kickoff, at 1920), disabled dim, loading spinner, 2-line wrap with no clip.
7. DOM measurement (`getBoundingClientRect`, ad-hoc Playwright against the Storybook story) — **before**: not re-measured on this exact story pre-fix (Task 621's own measurement, cited in the kickoff, is the pre-fix baseline: `rootCenter` 613.48 vs `label/sectionCenter` 600.48 at 1920px, ~13px offset). **After** (this session): `offsetRootInner`/`offsetRootLabel` = **0** for every non-loading button across all 13 widths × en and all 4 locales × 320 (only the `loading` cell shows a nonzero offset, which is Mantine's own intentional behavior — the label is `opacity:0`/`translateY(100%)` while loading, not a defect). `rootHeight` = **44** for every cell in the same matrix (self-review below covers how a 46px regression was caught and fixed before this held).
8. Full-width regression (Playwright against `mantine-primitives-mobilenavdrawer--default`, `mantine-primitives-filterspanelshell--default`, `patterns-mantine-authformpattern--default` at 320/768/1440): every `fullWidth` button measured **exactly equal to its container width** (MobileNavDrawer Logout: 288/288/288px; FiltersPanel Apply+Reset: 288/348/348px; AuthFormPattern Sign In+Create Account: 190/638/1310px); every non-fullWidth button (FiltersPanel's property/market-type/room-count/condition/etc. toggle grids) stayed at its natural content width, not the container width — no regression.
9. Homepage Agent-CTA re-verification (`next dev`, Playwright against `[data-track="register"]`): `en`@320/390/768/1440 + `uk`@320 — `offsetRootInner`/`offsetRootLabel` = 0, `rootHeight` = 44, width = container (100%) at 320/390, natural (166.83px) at 768/1440, `href` correct per locale, no horizontal overflow at 320 in either locale. Cropped element screenshots confirm the icon+label pair is visibly centered in both the full-width and natural-width renders.
10. `npm run check:hydration` (`BASE_URL=http://localhost:3000`) — see Self-review finding #2 for the full investigation. **Final clean warm run: 4/4 PASS** (Homepage en/sq/uk + Listings list en), 0 FAIL, 3 SKIP (pre-existing NOT-REAL-COVERAGE for authenticated/detail routes, unrelated to this task, same as Task 621).
11. TailAdmin side-by-side (§6 Buttons, `demo.tailadmin.com/buttons` reference cited in `tailadmin-style-reference.md:401-405`): not re-captured live — this task changes **only** the inner element's `minHeight` (a layout/centering property); it does not touch fill color, border, radius, padding-inline, or font-weight/size, all of which were already established against this reference by Tasks 484/527/589. Rendered screenshots (item 6) show the same fill/border/radius/padding as before this change, confirming no chrome regression.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Icon+label vertical position | Mantine `Button` inner | `.m_80f1301b { height:100%; align-items:center }` | theme `styles.inner.minHeight` (new) gives inner a definite height so `align-items:center` resolves correctly | **Changed** — now centered | `Button.css:122-127`, `theme.ts:335` |
| 44px touch target | theme root + inner | `styles.root.minHeight` (unchanged) + new `styles.inner.minHeight` (border-compensated) | root stays 44px because `inline-block` `height:auto` shrink-wraps inner's now-≥44px natural size | **Preserved** — measured 44px in every cell | `theme.ts:306,335`, DOM measurement item 7 |
| Wrap-growth for long labels | theme root | `styles.root.height:'auto'` (untouched) + `styles.label` (untouched) | Task 502/567 mechanism unchanged; inner's `minHeight` is a floor, not a fixed height, so wrapped content still grows past it when it needs to | **Preserved** — 2-line wrap fits under 44px in this story's content, no clip | Item 7, `theme.ts:308,336-340` |
| Full-width buttons | Mantine `[data-block]` | `display:block; width:100%` | untouched — root `display` never modified by this fix | **Preserved** — measured 100% of container at every consumer | `Button.css:50-53`, item 8 |
| Variant fills/borders | theme `vars` | `--button-bg/-color/-bd` | untouched | **Out of scope, byte-unchanged** | `theme.ts:280-295` (diff-confirmed untouched) |

## Self-review findings

Two real issues were found and fixed during this session's own adversarial self-review before reporting:

1. **Height regression (46px instead of 44px) — caught by AC2 measurement, fixed.** The initial A1 edit
   (`inner: { minHeight: '2.75rem' }`, no border compensation) passed centering (`offset: 0`) but measured
   `rootHeight: 46` for every button, not 44. Root cause: root's `height:'auto'` resolves to
   content-height + border regardless of `box-sizing:border-box` (border-box only reinterprets an
   *explicit* height, not an *auto*-computed one) — confirmed via `getComputedStyle` (`border-top-width:
   1px`, `border-bottom-width: 1px`, `box-sizing: border-box`, present even on the `filled` variant,
   whose border is `solid transparent` but still occupies border-width). With `inner` fixed at 44px, root's
   auto-height became `44 + 2(border) = 46`. Fixed by compensating the border in the `inner` minHeight
   itself: `calc(2.75rem - 2 * (0.0625rem * var(--mantine-scale)))`, tied directly to the exact border-width
   formula already present in Mantine's own compiled `Button.css:43` (not a magic number). Re-measured:
   `rootHeight: 44` for all 16 buttons × 13 widths × 4 locales.
2. **`check:hydration` transient failures — investigated, confirmed pre-existing/unrelated, not a
   regression.** The first `check:hydration` run showed `Listings list (en)` FAIL, with the violation text
   literally showing my new `inner.minHeight` value as a client-only addition missing from the server
   HTML — at first glance this looked like a genuine regression from this task. Investigation: (a) full
   error capture showed the diff was against a **stale dev-server compile** (the server was running from
   before this session's edits); (b) killing and restarting the dev server fresh still showed failures, but
   now on *different* routes each run (`Homepage sq`, `Homepage uk`, `Listings list en`, inconsistently) —
   a route-instability signature inconsistent with a deterministic CSS-only defect; (c) **decisive test:**
   temporarily reverted `theme.ts` to its exact pre-Task-622 content (verified via `git diff --stat`
   showing 0 changes) and re-ran the identical gate against the identical running server — **the same
   failures reproduced** (`Listings list (en)` + `Homepage sq`) with the fix fully absent. This proves the
   flakiness is pre-existing and unrelated to this task, matching `docs/backlog.md`'s documented
   Turbopack cold-compile flake precedent (Task 582: "a stale Turbopack `next dev` HMR cache can emit a
   one-off hydration error that does NOT survive a clean next build + fresh dev restart... re-verify with
   `check:hydration` against a freshly restarted server"). Restored the Task 622 fix (`cp` from a pre-edit
   backup, confirmed via `git diff` showing exactly the 23-line addition), re-ran `typecheck` (0 errors),
   then re-ran `check:hydration` twice more after priming routes — the second run came back **clean: 4/4
   PASS, 0 FAIL**. Recorded as the final validation evidence (item 10).

## Assumptions, deviations, and limitations

- **A1 used, with one correction.** The kickoff's recommended `styles.inner.minHeight: '2.75rem'` needed a
  border-compensation term (`- 2 * (0.0625rem * var(--mantine-scale))`) that the kickoff's suggested code
  sample did not include — found via AC2 self-review measurement, not assumed. A2 (fullWidth-gated root
  `display` change) was never needed; A1 (corrected) satisfied every acceptance criterion.
- **TailAdmin side-by-side (item 11)** was not re-captured live against `demo.tailadmin.com/buttons` in
  this session — reasoned from the fact that this diff touches only inner-element `minHeight` (layout),
  with zero change to any color/border/radius/padding token already established against that reference by
  prior Button tasks (484/527/589). If the orchestrator wants a fresh live capture regardless, flagging
  that as an open question below.
- **`check:hydration` SKIPs** (listing-detail, authenticated-homepage ×2) are pre-existing, environment-
  variable-gated (same as Task 621) — not something this task could resolve or that is affected by it.
- **`check:design-tokens`** 9 pre-existing findings in `HeaderView.tsx`/`NotificationCenter.tsx` — confirmed
  via `git status` neither file is touched by this diff (same findings Task 621 recorded).
- The `AgentCtaButton.tsx` local `styles.root: { display:'inline-flex', alignItems:'center',
  justifyContent:'center' }` override (Task 621) was left in place per the kickoff's explicit
  out-of-scope instruction — confirmed redundant-but-harmless: Homepage CTA measurement (item 9) still
  shows perfect centering with both the local override and the theme fix simultaneously active.

## Opus handoff

Evidence locations: all DOM-measurement JSON and PNG screenshots were captured to this session's
scratchpad (`C:\Users\Nox\AppData\Local\Temp\claude\...\scratchpad\`, not committed/gitignored area) and
are reproducible on demand via the same ad-hoc Playwright pattern documented in Validation evidence items
6-9 (Storybook dev server on :6006, `next dev` on :3000 — both already running in this environment).

Questions/risks for the reviewer to inspect:
1. Is the border-compensation term (`calc(2.75rem - 2 * (0.0625rem * var(--mantine-scale)))`) an acceptable
   "no raw px/rem outside the touch-target exemption" reading of R7 — it reuses the exact `--mantine-scale`
   variable and `0.0625rem` unit Mantine's own `Button.css:43` already uses for border-width, rather than a
   literal `2px`/`0.125rem` constant?
2. Is the `check:hydration` self-review (finding #2) sufficiently rigorous evidence that the transient
   failures are pre-existing and not a regression from this task, or does the orchestrator want an
   independent re-verification?
3. Confirm the reasoning for not re-capturing a live TailAdmin `/buttons` screenshot (item 11) is
   acceptable given the diff's scope (layout-only, zero chrome-token change).

## Backlog update

`docs/backlog.md` updated with a concise active-state entry (Task 622 moved from "📋 DESIGNED — awaiting
executor" to "✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW", 1 line + session pointer). Backlog physical
line count after edit: same as before (net addition ~0 lines — replaced the existing Task 622 line in
place, did not add a new one). No `BACKLOG LIMIT BREACH`.

---

## Orchestrator review addendum — 2026-07-18

Review verdict: **`APPROVED WITH NOTES`**. Three P1 evidence gaps were raised against the executor's
report and all three are now closed. Recorded here so the evidence is not lost a second time.

### Evidence artifacts (persisted — F1)

The executor's original measurements were written to a session scratchpad that no longer exists, leaving
the Q3 proof uninspectable (`docs/qa-profiles.md:56`: Q3 cannot be approved without full visual proof).
Re-captured by the reviewer to a persistent, gitignored path:

- `.screenshots/task622/measurements.json` — full DOM measurements
- `.screenshots/task622/verdict.txt` — `PASS`, `failures: 0`
- `.screenshots/task622/png/` — 13 widths × en + 4 locales @320 + consumer stories + wrap-growth cells
- `.screenshots/task622/probe.mjs` — the harness, re-runnable via `node .screenshots/task622/probe.mjs`
  (Storybook dev server on :6006). Deliberately inside the gitignored `.screenshots/` tree so it cannot
  enter the Task 622 diff (AC7 = one changed file).

Independent results: `rootHeight = 44` for all 16 buttons × 13 widths × 4 locales; `offsetRootInner` and
`offsetRootLabel` = 0 for every non-loading button; `scrollWidth = 320` (no h-overflow) in en/sq/uk/it;
AC3 confirmed across **all three** fullWidth consumers — MobileNavDrawer (1 fullWidth), AuthFormPattern
(2 fullWidth), FiltersPanelShell (49 buttons, 2 fullWidth + 47 natural-width toggle-grid buttons, all
≥44px and none incorrectly stretched to container width).

### AC4 wrap-growth — the branch the original run never exercised (F2)

The story's own long-label cell (`button_long_label`, fullWidth) wraps to only 2 lines (~28px) at 320,
which stays **under** the new 42px inner floor — so the executor's `rootHeight: 44` result did not
demonstrate growth, and the one behavior most plausibly at risk from adding a floor to `inner` was
undemonstrated. Re-probed by squeezing the container to force 3+ lines:

| locale | container | rootHeight | labelHeight | offsetRootLabel | clipped |
|---|---:|---:|---:|---:|---|
| en | 140px | 58 | 56 | 0 | no |
| en | 110px | 72 | 70 | 0 | no |
| en | 90px | 100 | 98 | 0 | no |
| uk | 140px | 72 | 70 | 0 | no |
| uk | 110px | 86 | 84 | 0 | no |
| uk | 90px | 86 | 84 | 0 | no |

AC4 growth **verified**: the button grows 44 → 58 → 72 → 100, stays centered at every wrap depth, never
clips. Secondary confirmation of the border-compensation formula: `rootHeight − labelHeight = 2px` holds
at *every* wrap depth, not only at the single 44px measurement point. The squeeze is realistic, not
synthetic — `MantineListingContactPattern.tsx:150,166` renders Buttons at `flex: 1, minWidth: 0`.

### AC5 / TailAdmin side-by-side — owner decision (F3)

Verification-plan item 10 was not run. **Owner decision (2026-07-18): not applicable to this task.**
Rationale: the diff is layout-only; `vars`, `boxShadow`, `label`, padding, radius, and colour are
byte-unchanged (confirmed by diff inspection), so per `docs/qa-profiles.md:22` chrome is not in scope.
AC5 closed on diff evidence plus this decision. Future chrome-touching Button work still requires item 10.

### Two probe false-positives (recorded so they are not re-investigated)

1. **`[data-loading]` inflates `scrollHeight`.** `Button.css:103-106` applies
   `[data-loading] .m_80f1301b { opacity:0; transform: translateY(100%) }` — Mantine deliberately pushes
   the inner a full box-height down behind the loader. Under root `overflow:hidden` this doubles
   `scrollHeight` on every loading button, before and after this task. A naive clip-guard reports 17 false
   AC4 failures; the guard must exclude `[data-loading]`.
2. **`networkidle` never settles on `FiltersPanelShell`** against the Storybook *dev* server (HMR socket +
   lazy chunks). Use `domcontentloaded` + an explicit selector wait.

### Review notes carried forward (non-blocking)

- **P3 — border-compensation scale mismatch.** The compensation term is scale-aware
  (`0.0625rem * var(--mantine-scale)`, mirroring `Button.css:43`), but the theme's own `outline`/`default`
  override sets `--button-bd: '1px solid ...'` (`theme.ts:289`) — a hard, non-scaled `1px`. At
  `--mantine-scale ≠ 1` these diverge on those two variants. `--mantine-scale` is never overridden in this
  project (grep: 0 hits), so there is no live defect. Revisit if scale is ever customised.
- **NOTE — consumer-level `styles.inner` does not collide.** `MantineListingContactPattern.tsx:158,169`
  passes `styles={{ inner: { minWidth: 0 } }}`. Verified via `@mantine/core` `get-style.cjs`: theme styles
  and component styles are spread sequentially per selector, so this is a property-level merge, not a
  replacement — the theme `minHeight` survives. This pair was outside the measured matrix and was not
  considered in the executor's self-review.
- **NOTE — candidate follow-up (Task 623).** The "44px for every size" result also shows that
  `styles.root.height:'auto'` makes the Mantine `size` prop inert for height: `size="lg"`/`xl`
  (`--button-height` 50/60px) also clamp to 44px. Pre-existing since Task 502, out of scope here, worth a
  separate task.
