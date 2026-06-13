# Sprint 35 — Task 422 — Kickoff Prompt for Sonnet 4.6

> Single source of truth for this task. Read this file directly; do not work from chat paraphrase.
> Single-writer git: do NOT run `git add` / `git commit`. Produce a "Files Changed" table; the
> orchestrator emits explicit-path commit commands at review.

---

### Task 422 — Fix `MOBILE_POSITIONER`'s Tailwind v3 `!important`-prefix syntax (silently no-op under Tailwind v4) and verify all 6 consuming popup primitives, closing the `NavigationMenu` bottom-sheet violation exposed by Task 421 assertion (e)

Type:        bug fix (§26.2 popup bottom-sheet contract, shared token)
Priority:    high
Area:        `src/components/ui/mobile-bottom-sheet.ts` (`MOBILE_POSITIONER` token) — consumed by
              `select.tsx`, `combobox`/`command.tsx`, `dropdown-menu.tsx`, `navigation-menu.tsx`,
              `popover.tsx` (grep to confirm exact consumer list)

Pre-read (mandatory before any code change — this is the `rule-index.md` "Storybook / visual
snapshot task" bundle, plus the Tailwind-governance pair because the bug IS a Tailwind v4
important-syntax defect):
1. `docs/agent-contract.md` (clauses 1–14; clause 11 = mobile <640 full-width + bottom-sheet gate;
   clause 12 = rendered-evidence matrix; clause 13 = Storybook no-hardcode gate; clause 14 = file
   integrity).
2. `docs/backlog.md`.
3. `docs/design-system.md` §26.2 (popup bottom-sheet contract), §26.6 (left-drawer exception),
   §27.3 (assertion (e), Task 421 — what `screenshots:assert` proves).
4. `docs/storybook-governance.md` (§14 enforced gates) + `docs/storybook-visual-snapshots.md`.
5. `docs/component-rules.md` + `docs/qa-rules.md`.
6. `docs/tailwind-governance.md` + `docs/tailwind-canonical-fragments.md` — **v4 important-modifier
   is the SUFFIX form** (`fixed!`, `[transform:none]!`); the v3 prefix form (`!fixed`) is a silent
   no-op. This is the canonical fact this whole task turns on.
7. `docs/responsive-screenshot-governance.md` §MQ (machine-detection limits).

---

## Background — finding from Task 421 (Slice 6)

Task 421 added harness assertion (e): every visible open overlay content slot (`dialog-content`,
`sheet-content` except `data-side="left"`, `select-content`, `popover-content`,
`dropdown-menu-content`, `navigation-menu-popup`) must be edge-to-edge full-width AND
bottom-anchored at `<640px`. A new minimal open-state story, `Primitives/NavigationMenu` →
`MobileOpen` (added by Task 421), exposed a **real, deterministic** failure across all 4 locales
× all `<640` viewports:

```
NavigationMenu/MobileOpen × {sq,en,uk,it} × {mobile-320,mobile-375,mobile-390,mobile-480,
canonical-560}
  ✗ popup not bottom-sheet at <640: navigation-menu-popup[data-side=bottom]
```

(20 cells in the full 14-viewport matrix; the other 5 overlay primitives — Dialog, Sheet,
Select, Popover, DropdownMenu, Command — all PASS assertion (e) using the same shared
`MOBILE_POSITIONER`/`MOBILE_POPUP` tokens from `mobile-bottom-sheet.ts`.)

## Root cause

`src/components/ui/mobile-bottom-sheet.ts`:

```ts
export const MOBILE_POSITIONER =
  "max-sm:!fixed max-sm:!inset-x-0 max-sm:!bottom-0 max-sm:!top-auto max-sm:!w-auto max-sm:!h-auto " +
  "max-sm:![transform:none] max-sm:![translate:none]"
```

This uses **Tailwind v3 `!important`-prefix syntax** (`!fixed`, `!inset-x-0`, `!w-auto`, etc. —
`!` BEFORE the utility). This project is on **Tailwind CSS v4** (`"tailwindcss": "^4"` in
`package.json`), where the important-modifier syntax is the **suffix** form (`fixed!`,
`inset-x-0!`, `w-auto!`) — the v3 prefix form is **silently ignored** (produces no CSS rule at
all, not even a non-important one).

The comment on `MOBILE_POSITIONER` states its purpose explicitly:

> Apply to Base-UI `Positioner` to override its inline-style anchor positioning at `<640px`.
> Uses `!important` ... to beat inline styles.

Base-UI's `NavigationMenuPrimitive.Positioner` sets inline `position`/`top`/`left`/`width`/
`height`/`transform` styles via floating-ui anchor positioning — inline styles win over ANY
non-`!important` class regardless of specificity or source order. Because `MOBILE_POSITIONER`'s
`!important` modifiers are currently no-ops, **none of its 8 utilities are ever applied** for
`NavigationMenuPositioner`, so at `<640px` it stays anchor-positioned near its trigger instead of
becoming a `fixed inset-x-0 bottom-0` full-width bottom sheet.

**The other 5 primitives (Dialog/Sheet/Select/Popover/DropdownMenu/Command) currently PASS (e)
despite this same bug** — most likely because their Positioner/Portal wrappers either (a) don't
receive `MOBILE_POSITIONER` at all (their bottom-sheet behavior comes entirely from
`MOBILE_POPUP`'s `max-sm:w-full max-sm:max-w-none ...` on the Popup/Content itself, which do NOT
need to override inline anchor styles), or (b) the underlying Base-UI component doesn't set
conflicting inline `position`/`transform` styles at all. **This must be verified empirically per
primitive before changing the shared token** — see "Required investigation" below.

**Scope note (verified by orchestrator at kickoff, 2026-06-13):** only `MOBILE_POSITIONER` carries
the v3 `!`-prefix bug. Its sibling tokens in `mobile-bottom-sheet.ts` — `MOBILE_POPUP`,
`MOBILE_SLIDE_ANIMATION`, `DRAG_HANDLE_WRAPPER`, `DRAG_HANDLE_BAR` — use **no** important modifier
and are correct; do NOT touch them. The fix is confined to the one token (plus, only if step 3
proves necessary, a targeted `navigation-menu.tsx` Popup class). The token's docstring (lines
10–13) still says "Tailwind `!` prefix" — update that comment to the v4 suffix form as part of the
fix so the next reader isn't misled.

## Required fix

1. Fix `MOBILE_POSITIONER` in `mobile-bottom-sheet.ts` to use Tailwind v4 suffix `!important`
   syntax:
   ```diff
   - export const MOBILE_POSITIONER =
   -   "max-sm:!fixed max-sm:!inset-x-0 max-sm:!bottom-0 max-sm:!top-auto max-sm:!w-auto max-sm:!h-auto " +
   -   "max-sm:![transform:none] max-sm:![translate:none]"
   + export const MOBILE_POSITIONER =
   +   "max-sm:fixed! max-sm:inset-x-0! max-sm:bottom-0! max-sm:top-auto! max-sm:w-auto! max-sm:h-auto! " +
   +   "max-sm:[transform:none]! max-sm:[translate:none]!"
   ```
   (Confirm exact Tailwind v4 syntax for arbitrary-property important — `[transform:none]!` —
   during implementation; adjust if the build reports an error.)

2. **Required investigation** — for EACH of the 6 primitives consuming `MOBILE_POSITIONER`
   and/or `MOBILE_POPUP` (grep `MOBILE_POSITIONER\|MOBILE_POPUP` across `src/components/ui/`):
   re-run the full `screenshots:assert` matrix after the fix and confirm assertion (e) for ALL 6
   primitives' relevant `ASSERT_STORIES` entries (the 5 existing-passing ones AND
   `NavigationMenu/MobileOpen`). The fix activates 8 previously-dormant utilities that may now
   change rendering for primitives where `MOBILE_POSITIONER` was previously a no-op — even if
   they were already passing (e), their underlying DOM/CSS may shift (e.g. if a Positioner
   previously relied on `MOBILE_POPUP`'s `max-sm:w-full` alone and now ALSO gets
   `max-sm:fixed!` etc., verify this doesn't conflict/regress).

3. If activating `MOBILE_POSITIONER` correctly for `NavigationMenuPositioner` is sufficient to
   make `navigation-menu-popup` an edge-to-edge bottom-anchored sheet at `<640px`, no further
   `navigation-menu.tsx` changes should be needed. If NOT sufficient (e.g. the `w-(--popup-width)
   h-(--popup-height)` CSS-variable sizing on `NavigationMenuPrimitive.Popup` still wins over
   `MOBILE_POPUP`'s `max-sm:w-full`), the executor may ALSO need a targeted, documented fix to
   `navigation-menu.tsx`'s Popup/Positioner classes (e.g. ensuring `max-sm:w-full!` /
   `max-sm:max-w-none!` on the Popup wins over `w-(--popup-width)` at `<640px` — Tailwind v4
   important-suffix ordering/specificity applies here too). Document any such additional change
   explicitly in the session log with before/after class diffs and the reasoning.

---

## Positive flow (happy path)

- **Actor:** CI / owner running `npm run screenshots:assert` (full mode) after the fix.
- **Steps & system responses:**
  1. `MOBILE_POSITIONER`'s 8 utilities now generate real CSS with `!important`, overriding
     `NavigationMenuPositioner`'s inline anchor-positioning styles at `<640px`.
  2. `navigation-menu-popup[data-side=bottom]` (and its Positioner) become `fixed inset-x-0
     bottom-0`, full viewport width, `max-h-[90dvh]`, `rounded-t-2xl`.
  3. Assertion (e) for `NavigationMenu/MobileOpen` → `popupBottomSheetAtMobile: true` for all 4
     locales × all `<640` viewports.
  4. The other 5 primitives (Dialog/Sheet/Select/Popover/DropdownMenu/Command) remain
     `popupBottomSheetAtMobile: true` — no regression.
- **Success state:** `Results: 2912/2912 PASS, 0 FAIL`.

## Negative flow

- **Other 5 primitives regress:** if activating `MOBILE_POSITIONER` breaks any
  currently-passing primitive's (e) check (e.g. a primitive whose Positioner now gets
  `fixed!`/`inset-x-0!`/`bottom-0!` applied when it previously relied on different positioning),
  STOP, document the conflict per-primitive, and determine the minimal fix (e.g. that primitive
  may need to stop passing `MOBILE_POSITIONER` to its Positioner if its bottom-sheet behavior was
  already fully handled by `MOBILE_POPUP` alone — document why removing it there is safe).
- **`navigation-menu.tsx` still fails after the token fix:** apply the targeted documented
  `navigation-menu.tsx` fix described in "Required fix" step 3; if that ALSO doesn't resolve it,
  STOP with a focused failure report (exact computed styles / bounding rect at failure) rather
  than guessing further or loosening `FULL_WIDTH_TOLERANCE`.
- **`≥640px`:** all 6 primitives' desktop/tablet popup positioning (anchored dropdowns/popovers,
  not bottom sheets) must remain unchanged — verify no `sm:`/`md:`+ regression in the existing
  passing matrix cells.

---

## Mobile <640 full-width gate (OWNER P0 — clause 11) — surfaces in scope

This task makes a previously-dormant bottom-sheet token actually fire, so the <640 gate is the
core acceptance, not a side-check. Required `max-sm` end-state for every surface touched:

| Surface (open overlay at <640) | Required mobile end-state | Touch / label |
|---|---|---|
| `navigation-menu-popup` (the failing one) | `fixed inset-x-0 bottom-0`, full viewport width edge-to-edge (left=0, right=innerWidth), bottom-anchored, `rounded-t-2xl` only, `max-h-[90dvh]` internal scroll, drag-handle bar at top | ≥44px targets; sq/en/uk/it labels wrap, no clip, no h-scroll at 320 |
| Dialog · Sheet (non-`left`) · Select · Popover · DropdownMenu · Command popups | MUST REMAIN full-width bottom sheet (already passing (e)) — verify no regression after the token activates | same |

**Exemptions (must stay skipped, do NOT convert to bottom sheet):** `data-side="left"` drawers
(AdminSidebar, §26.6) and the non-UI Leaflet map-marker popup — if any ambiguity arises on those,
STOP & ASK, do not guess. At `≥640` all six primitives keep their existing anchored desktop
positioning — the fix is `max-sm:`-scoped only and MUST NOT alter any `sm:`/`md:`+ behavior.

## Rendered-evidence requirements (OWNER P0 — clauses 12 & 13; Sprint 33 gate) — BLOCKS approval

"tsc=0 / build=✅" is NOT proof and will NOT close this task. The session log MUST contain:

1. **The machine-produced `screenshots:assert` matrix** (full 52×14×4 = 2912 cells), with the
   per-cell evidence for assertion (e) on all 6 popup primitives' open-state stories. **uk@320 /
   uk@375 / uk@390 are mandatory stress cells** and must be shown explicitly PASS for
   `NavigationMenu/MobileOpen`.
2. **Before/after discrimination proof** — the pre-fix authoritative baseline is **2892/2912, 20
   FAIL** (all `NavigationMenu/MobileOpen`, from Task 421). The post-fix run must be **2912/2912,
   0 FAIL**. Paste BOTH summary lines; this delta is itself the proof that assertion (e) bites and
   the fix closes exactly the 20 cells with zero collateral. If the post-fix run is not a clean
   2912/2912, the task is INCOMPLETE — STOP and report per the Negative flow, do not approve-around it.
3. **Global-consumer enumeration (Note 14 — fix every consumer, no diverging call site):** paste the
   output of `grep -rn "MOBILE_POSITIONER\|MOBILE_POPUP" src/components/ui/` and, per consumer,
   state its assertion-(e) result before and after. A primitive left unverified = INCOMPLETE.
4. No `parameters.layout:'centered'|'padded'`, no raw string literals, no `Ukrainian*` story
   introduced (`check:stories` green) — this task adds no new stories, but confirm the gate stays green.

## Owner-native authoritative run (clause 14)

The orchestrator's Cowork sandbox `screenshots:assert` is a SCREEN, not the verdict (mount can
serve stale/fluctuating reads). The authoritative 2912/2912 result is the **owner-native** (Windows
PowerShell) or CI run. Session log notes which environment produced the attached matrix; final
sign-off uses the native number.

---

## Acceptance criteria

> Each AC maps to the Positive flow (PF) or Negative flow (NF) above.

- **AC1 (PF step 1):** `MOBILE_POSITIONER` in `mobile-bottom-sheet.ts` uses correct Tailwind v4
  important-suffix syntax, and its docstring (lines 10–13) no longer says "Tailwind `!` prefix".
  Verifiable at file:line + `npm run build-storybook` succeeds with no Tailwind warnings about
  unrecognized classes.
- **AC2 (PF steps 2–3):** Full `screenshots:assert` (2912 cells) — `NavigationMenu/MobileOpen` ×
  all 4 locales × all `<640` viewports → `popupBottomSheetAtMobile: true`, **uk@320/375/390
  shown explicitly**. Final result **2912/2912 PASS, 0 FAIL**.
- **AC2b (rendered-evidence gate, clause 12):** the session log contains the rendered matrix AND
  both summary lines — pre-fix **2892/2912 (20 FAIL)** → post-fix **2912/2912 (0 FAIL)** — proving
  the fix closes exactly the 20 `NavigationMenu/MobileOpen` cells with zero collateral. Owner-native
  or CI is the authoritative number (clause 14).
- **AC3 (PF step 4 / NF "other 5 regress"):** 0 new regressions in the other 5 primitives' (e)
  results or anywhere else in the matrix vs. the pre-fix baseline. Per-consumer before/after stated.
- **AC4 (NF "nav-menu still fails"):** if `navigation-menu.tsx` required an additional targeted fix
  (Required-fix step 3), it is documented in the session log with before/after class diffs +
  reasoning; `npx tsc --noEmit`, `npm run lint`, `npm run check:design-tokens` all green. If the
  token fix alone sufficed, state that explicitly (no `navigation-menu.tsx` change).
- **AC5 (Note 14 — every consumer):** paste `grep -rn "MOBILE_POSITIONER\|MOBILE_POPUP"
  src/components/ui/`; every listed consumer has a stated assertion-(e) result before and after.
- **AC6 (clause 14):** every touched file — 0 NUL bytes, no BOM, compiles. Paste integrity
  transcript in session log.
- `docs/backlog.md` updated; session log under `docs/sessions/` with "Files Changed" table.
  Do NOT emit `git add`/`git commit`.

## Out of scope

- Any product/admin/listing surface beyond the 6 popup primitives listed.
- Loosening `FULL_WIDTH_TOLERANCE` or any `screenshots:assert` assertion.
- `git add` / `git commit` (single-writer rule).
