# Task 404 — Token refactor: `src/components/shared/**` + `src/components/layout/**`
**Date:** 2026-06-07  
**Sprint:** 35 | **Epic:** JJ Phase 3, area 2 of 4  
**Executor:** Sonnet 4.6  
**Status:** COMPLETE (pending orchestrator diff review)

---

## Summary

Replaced raw style-value literals in `shared/**` + `layout/**` with design tokens / named utilities (policy A). Added `--text-2xs` token. Result: **unsuppressed SHARED+LAYOUT violations = 0** (was 18: SHARED=12, LAYOUT=6).

---

## Group A — Inert swaps + computed-equality proof

| File | Raw | After | Computed proof |
|---|---|---|---|
| `shared/FilterMultiToggle.tsx:26` | `min-h-[44px]` | `min-h-11` | `min-h-11` → `--spacing-11: var(--space-11)` → `2.75rem = 44px` = identical ✓ |
| `shared/FilterToggleGroup.tsx:27` | `min-h-[44px]` | `min-h-11` | same as above ✓ |
| `shared/FilterToggleGroup.tsx:39` | `min-h-[44px]` | `min-h-11` | same as above ✓ |
| `layout/Header.tsx:191` | `max-w-[120px]` | `max-w-30` | `max-w-30` → `calc(0.25rem × 30) = 7.5rem = 120px` = identical ✓ |
| `layout/Footer.tsx:72` | `max-w-[220px]` | `max-w-55` | `max-w-55` → `calc(0.25rem × 55) = 13.75rem = 220px` = identical ✓ |

**Spacing scale verification:** `--spacing-11: var(--space-11)` wired in `globals.css` → `h-11` / `min-h-11` resolves via token. For `max-w-30` and `max-w-55`, no explicit `--spacing-30` / `--spacing-55` tokens are defined, so Tailwind v4 falls back to the default formula `N × 0.25rem` — 30 × 0.25rem = 7.5rem = 120px and 55 × 0.25rem = 13.75rem = 220px, both computed-identical to the raw px values.

---

## Group B — PerfDevOverlay path-allowlist

**Dev-only proof:**
- `src/components/shared/PerfDevOverlay.tsx` line 14: `if (process.env.NODE_ENV !== 'development') return null`
- `process.env.NODE_ENV` is a **build-time constant** in Next.js/webpack — the entire `PerfOverlayContent` render is dead-code-eliminated from production bundles
- Not reachable in production UI — tree-shaken at build time
- Contains `z-[9999]` (line 43) and `text-[10px]` (line 47)
- **Path allowlist entry added** to `scripts/design-tokens-allowlist.json`

---

## Group C — Exact-value suppressions

| File | Value | Reason |
|---|---|---|
| `shared/DatePicker.tsx:101` | `w-[272px]` | Calendar grid fixed width; off-scale (no spacing token = 272px) |
| `shared/HeroSearchClient.tsx:10` | `h-[76px]` | Hero search bar skeleton fixed height; off-scale (no spacing token = 76px) |
| `layout/MobileBottomNav.tsx:27` | `shadow-[0_-2px_16px_rgba(0,0,0,0.08)]` | Bespoke upward nav shadow (negative-y offset); no `--shadow-*` token matches upward direction |

**Detector blind spot logged (Task 408):** `shadow-[0_-2px_16px_rgba(0,0,0,0.08)]` — negative-y offset shadow may partially evade the shadow regex in more complex forms (Task 408 must harden detection for negative-offset shadows).

---

## Group D — `text-[10px]` → `text-2xs` evaluation

**Token added to `globals.css`:**
```css
--text-2xs:              0.625rem;  /* 10px — micro-label: badge/counter/helper (§22.2) */
--text-2xs--line-height: 0.75rem;   /* 12px */
```
**`docs/design-system.md §22.2` updated** with `--text-2xs` row.

### Per-occurrence log

| File:line | Decision | Reason |
|---|---|---|
| `shared/FiltersPanel.tsx:410` | **SWAPPED → `text-2xs`** | Circular h-5 w-5 active-filter counter badge; flex-centered; line-height change has no visible effect (single digit, fixed-size circular flex container) |
| `shared/HeroSearch.tsx:132` | **SWAPPED → `text-2xs`** | Circular h-5 w-5 active-filter counter badge; same pattern as FiltersPanel — micro-label, decorative counter |
| `shared/PerfDevOverlay.tsx:47` | **Group B path-allowlist** | Dev-only — covered by PerfDevOverlay path allowlist |
| `layout/MobileBottomNav.tsx:46` | **SUPPRESSED** (exact inline) | Primary FAB label for "add_listing" nav item; interactive/mobile-critical nav text; MobileBottomNav protection |
| `layout/MobileBottomNav.tsx:80` | **SUPPRESSED** (exact inline) | Primary nav item label in BottomNavItem (Button variant); interactive/mobile-critical; MobileBottomNav protection |
| `layout/MobileBottomNav.tsx:87` | **SUPPRESSED** (exact inline) | Primary nav item label in BottomNavItem (Link variant); interactive/mobile-critical; MobileBottomNav protection |

**Inertness proof for `text-2xs` swaps:**
- `font-size` (primary): `text-2xs` → `0.625rem = 10px` = identical to `text-[10px]` ✓
- `line-height` delta (documented, NOT full computed equality): `text-[10px]` sets no line-height (inherits); `text-2xs` adds `0.75rem` via `--text-2xs--line-height`. For the badge spans (h-5 w-5 circular, flex items-center justify-center), the line-height is overridden by flexbox vertical centering — **no visible shift** ✓
- Both swapped occurrences are single-line, single-digit counter labels in fixed-size circular flex containers → no multi-line vertical rhythm risk

---

## z-9999 — Combobox handling

**Context:** `src/components/shared/Combobox.tsx` — portal-mode dropdown positioning uses `dropdownStyle` object set via `setDropdownStyle()`. The `dropdownStyle` is applied as `style={portal ? dropdownStyle : ...}` to the dropdown div.

**Issue found (detector blind spot / Task 408 item):** The inline suppression `// design-tokens-allow: zIndex: 9999 — reason` does NOT work for `zIndex: N` inline style object values because the marker parser extracts only non-whitespace sequences (`\S+`), capturing `zIndex:` not `zIndex: 9999`. The detected value `"zIndex: 9999"` (with space) cannot be suppressed by the current marker format.

**Resolution:** Moved z-index from the inline style object to a Tailwind class `z-[9999]` (portal-mode only), enabling correct inline suppression:
- Removed `zIndex: 9999` from all 3 `setDropdownStyle()` calls (lines 135/159/169 originally)  
- Added `portal && 'z-[9999]'` to the dropdown div `cn()` className, with: `// design-tokens-allow: z-[9999] — portal dropdown/bottom-sheet must sit above z-modal/z-popover (50) when Combobox is portal-rendered inside a Dialog or Sheet; exceptional overlay escape-hatch (§22.4)`
- Non-portal mode retains `z-50` from the existing `!portal && 'absolute ... z-50'` class

**Occurrence classification (separate, per kickoff requirement):**
- **Line 135** (mobile full-width bottom-sheet): must be above z-50 when Combobox is inside a Dialog/Sheet → keep 9999 (consolidated into single `portal && 'z-[9999]'` class)
- **Line 159** (desktop dropdown, opens below): portal-rendered, must float above parent overlay → keep 9999
- **Line 169** (desktop dropdown, opens upward): same reasoning → keep 9999
- All 3 cases collapsed to single `portal && 'z-[9999]'` class — functionally identical, suppressed correctly

**No `--z-max` token created.** ✓

**Task 408 blind spots logged:**
1. Inline `zIndex: N` style object values cannot be suppressed by the current `// design-tokens-allow:` marker mechanism (parser uses `\S+` — stops at first whitespace, so `zIndex:` ≠ detected value `zIndex: 9999`). Task 408 must harden the parser or add a quoted-value mode.
2. Negative-offset shadows (`shadow-[0_-2px_16px_rgba(0,0,0,0.08)]`) may not be caught by simpler regex variants — Task 408 should verify the shadow detection covers negative-y-offset upward shadows.

---

## Mobile <640 full-width gate (OWNER P0)

**Combobox mobile bottom-sheet:** The `z-[9999]` change is now applied via `portal && 'z-[9999]'` — only when `portal=true`. Non-portal mobile behavior (`!portal && 'max-sm:!fixed ...'` with `z-50`) is unchanged. The mobile full-width bottom-sheet stacking is preserved: `z-[9999]` still applied, now via className instead of inline style.

**Header:** `max-w-30` replaces `max-w-[120px]` on a desktop-only truncation span (`span` inside `hidden md:flex`). No mobile impact.

**Footer:** `max-w-55` replaces `max-w-[220px]` on a brand tagline `p` element. Applies at all breakpoints; computed-identical max-width preserves exact visual behavior.

**MobileBottomNav:** Only Group C shadow suppression (no code change) and Group D inline suppression comments added (no functional change). Touch targets, labels, layout unchanged.

**FilterMultiToggle / FilterToggleGroup:** `min-h-11` = `min-h-[44px]` = 44px — inert swap preserving the ≥44px touch-target floor.

---

## Four-part token-resolution report

**Headline: unsuppressed SHARED+LAYOUT violations = 0** (was SHARED=12, LAYOUT=6)

| Category | Count | Action |
|---|---|---|
| **Fixed swaps (Group A)** | 5 swaps | `min-h-[44px]`×3 → `min-h-11`; `max-w-[120px]` → `max-w-30`; `max-w-[220px]` → `max-w-55` |
| **Token added (Group D)** | 2 swaps | `text-[10px]` → `text-2xs` (filter counter badges in FiltersPanel + HeroSearch) |
| **Path-allowlisted (Group B)** | 1 file | `PerfDevOverlay.tsx` (dev-only, tree-shaken from production) |
| **Inline-suppressed (Group C + z-9999 + Group D nav)** | 7 suppressions | DatePicker `w-[272px]`; HeroSearchClient `h-[76px]`; MobileBottomNav shadow; MobileBottomNav nav labels ×3; Combobox `z-[9999]` (portal class) |

---

## Validation results

| Check | Result |
|---|---|
| `npm run check:design-tokens` SHARED+LAYOUT | **0 unsuppressed** (was 18) ✓ |
| `check:design-tokens` stale markers | **0** ✓ |
| `check:design-tokens` missing-reason | **0** ✓ |
| `npx tsc --noEmit` | **0 errors** ✓ |
| `npm run lint` | **0 errors** (1 pre-existing warning in unrelated file) ✓ |
| `npm run check:file-integrity` | **13/13 clean** — 0 NUL bytes, no BOM ✓ |
| `npm run screenshots:assert` | **753/812 ✓, 0 ✗, exit 0** ✓ |
| `npm run screenshots:responsive` | **292/292 captured, 0 failed, exit 0** ✓ |

### Browser getComputedStyle proof (Next.js dev server port 3000, Tailwind JIT)

**Tool:** `scripts/task404-computed-proof.mjs` — Playwright headless browser against live app.  
**Final result: 53 PASS / 0 FAIL.**

#### Group A — computed-identical inert swaps
| Swap | Before | After | Equal |
|---|---|---|---|
| `min-h-[44px]` → `min-h-11` | `minHeight: 44px` | `minHeight: 44px` | ✓ IDENTICAL |
| `max-w-[120px]` → `max-w-30` | `maxWidth: 120px` | `maxWidth: 120px` | ✓ IDENTICAL |
| `max-w-[220px]` → `max-w-55` | `maxWidth: 220px` | `maxWidth: 220px` | ✓ IDENTICAL |

#### Group D — text-2xs font-size + badge no-shift
| Check | Before | After | Pass |
|---|---|---|---|
| `--text-2xs` CSS token | — | `.625rem` compiled ✓ | ✓ |
| `text-2xs` font-size | n/a | `10px` | ✓ |
| `text-[10px]` font-size | `10px` | n/a | ✓ |
| font-size identical | `10px` | `10px` | ✓ IDENTICAL |
| line-height delta (documented) | `15px` (inherited) | `12px` (--text-2xs--line-height) | ✓ documented, not regression |
| badge height (h-5=20px) before | `20px` | — | ✓ |
| badge height (h-5=20px) after | — | `20px` | ✓ |
| badge height diff | — | `0px` | ✓ NO SHIFT |

#### MobileBottomNav at 320px (mobile-critical)
| Check | Value | Pass |
|---|---|---|
| Nav found at 320px | height=56px (h-14) | ✓ |
| Nav labels visible (text-[10px] suppressed, not swapped) | 5 labels, all visible | ✓ |
| h-scroll at 320px | scrollW=592 (pre-existing: same scrollW confirmed by git stash check pre-Task-404; token swaps are computed-identical, cannot introduce layout overflow) | ✓ PRE-EXISTING |

#### Combobox portal z-[9999] layering
| Scenario | Found | z-index | position | Pass |
|---|---|---|---|---|
| Mobile 375px — Header locale switcher (portal=true, sm:hidden) | ✓ | 9999 | fixed | ✓ |
| Desktop 1280px — inside FiltersPanel Sheet (portal=true) | ✓ | 9999 | fixed | ✓ |

**PerfDevOverlay import chain:** `src/app/[locale]/layout.tsx:57` → `<PerfDevOverlay />` rendered unconditionally. `PerfDevOverlay.tsx:14` → `if (process.env.NODE_ENV !== 'development') return null` build-time constant gates the component. Path-allowlisted in `scripts/design-tokens-allowlist.json`.

#### Locale × Breakpoint matrix (sq/en/uk/it × 320/375/390/768/1440)
All 20 cells PASS. h-scroll at 320/375/390 is pre-existing across all 4 locales (confirmed pre-Task-404 by git stash check: scrollW values identical before and after Task 404). MobileBottomNav visible at mobile widths (navVisible=true at 320/375/390). No h-scroll at 768/1440 for any locale.

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/app/globals.css` | Added `--text-2xs` + `--text-2xs--line-height` to `@theme inline` typography | Group D: owner-approved micro-label token (§22.2) |
| `docs/design-system.md` | Added `--text-2xs` row to §22.2 typography table | Document new token per Task 404 requirement |
| `scripts/design-tokens-allowlist.json` | Added `PerfDevOverlay.tsx` path allowlist entry | Group B: dev-only file proven non-production |
| `src/components/shared/FilterMultiToggle.tsx` | `min-h-[44px]` → `min-h-11` | Group A inert swap |
| `src/components/shared/FilterToggleGroup.tsx` | `min-h-[44px]` × 2 → `min-h-11` | Group A inert swap (both occurrences) |
| `src/components/layout/Header.tsx` | `max-w-[120px]` → `max-w-30` | Group A inert swap |
| `src/components/layout/Footer.tsx` | `max-w-[220px]` → `max-w-55` | Group A inert swap |
| `src/components/shared/DatePicker.tsx` | Added exact-value inline suppression for `w-[272px]` | Group C: off-scale calendar grid width |
| `src/components/shared/HeroSearchClient.tsx` | Added exact-value inline suppression for `h-[76px]` | Group C: off-scale skeleton height |
| `src/components/layout/MobileBottomNav.tsx` | Added suppressions: shadow (Group C) + 3× nav label `text-[10px]` (Group D) | Group C bespoke shadow; Group D MobileBottomNav protection |
| `src/components/shared/FiltersPanel.tsx` | `text-[10px]` → `text-2xs` (counter badge) | Group D micro-label swap |
| `src/components/shared/HeroSearch.tsx` | `text-[10px]` → `text-2xs` (counter badge) | Group D micro-label swap |
| `src/components/shared/Combobox.tsx` | Removed `zIndex: 9999` from `dropdownStyle`; added `portal && 'z-[9999]'` className with suppression | z-9999 handling: moved to Tailwind class for correct inline suppression; portal-only |
| `docs/backlog.md` | Updated last session + next tasks | Per clause 10 |
| `docs/sessions/2026-06-07-task-404-shared-layout-token-refactor.md` | This file | Per clause 10 |

---

## AC self-audit

| AC | Met? | Evidence |
|---|---|---|
| Group A swapped + computed-identical proof per item | ✓ | Spacing proof table above |
| PerfDevOverlay path-allowlisted with dev-only proof | ✓ | `process.env.NODE_ENV !== 'development'` gate documented |
| Group C exact-value suppressed with reasons | ✓ | 3 suppressions: DatePicker, HeroSearchClient, MobileBottomNav shadow |
| Group D token added to `globals.css` + §22.2 | ✓ | `--text-2xs: 0.625rem; --text-2xs--line-height: 0.75rem` added |
| Group D eligible micro-label swaps done (per-occurrence log) | ✓ | 2 swapped (FiltersPanel, HeroSearch counter badges); 3 suppressed (MobileBottomNav nav labels) |
| Group D font-size computed-identical + line-height delta documented | ✓ | 10px identical; 0.75rem LH delta documented; no visible shift in flex-centered circular badges |
| No swap on interactive/mobile-critical nav text | ✓ | MobileBottomNav labels suppressed, not swapped |
| z-9999: Combobox suppressed with reason; no `--z-max` created | ✓ | `z-[9999]` via portal className with suppression reason; no new token |
| `check:design-tokens` SHARED+LAYOUT = 0; 0 stale; 0 missing-reason | ✓ | Script output confirms |
| `tsc=0` | ✓ | No output = 0 errors |
| `lint=0 new` | ✓ | 0 errors, 1 pre-existing warning |
| `check:file-integrity` green (13 files) | ✓ | All 13 clean |
| Mobile <640 full-width preserved | ✓ | Only inert swaps + comment-only changes in MobileBottomNav; Combobox portal z-index moved to className (same computed value) |
| No `text-[10px]` unsuppressed in SHARED+LAYOUT | ✓ | 0 SHARED+LAYOUT in `check:design-tokens` output |
| MobileBottomNav nav labels NOT swapped | ✓ | All 3 MobileBottomNav `text-[10px]` inline-suppressed with MobileBottomNav protection reason |
| New detector blind spots logged for Task 408 | ✓ | 2 blind spots logged: `zIndex: N` marker-parser limitation + negative-offset shadow |
| Four-part token-resolution report present | ✓ | See above |
| `messages/*.json` untouched | ✓ | No locale file changes |
| No `git add`/`commit` from executor | ✓ | |

---

## Self-validation verdict

**Self-validation: PASS (browser-proven)** — All owner-required checks completed:

1. ✅ `screenshots:assert` — **753/812 ✓, 0 ✗, exit 0**
2. ✅ `screenshots:responsive` — **292/292 captured, 0 failed, exit 0**
3. ✅ Port 6008 conflict resolved (killed conflicting PID 20396 mid-session)
4. ✅ Group A browser `getComputedStyle` proof — all 3 swaps computed-identical (44px/120px/220px) against live Next.js dev server (port 3000, Tailwind JIT)
5. ✅ Group D `text-2xs` rendered proof — `--text-2xs = .625rem` token compiled; `text-2xs font-size = 10px` = `text-[10px] font-size = 10px`; badge h-5=20px before=after (0px diff, NO SHIFT)
6. ✅ Combobox portal z-[9999] layering proof — mobile 375px (locale switcher, portal=true): z-index=9999, position=fixed; desktop 1280px inside FiltersPanel Sheet (portal=true): z-index=9999, position=fixed
7. ✅ Locale × breakpoint matrix — sq/en/uk/it × 320/375/390/768/1440: all 20 cells PASS; h-scroll at mobile widths is pre-existing (identical scrollW values confirmed before Task 404 by git stash check)
8. ✅ PerfDevOverlay import chain — `src/app/[locale]/layout.tsx:57` → `<PerfDevOverlay />` rendered; `PerfDevOverlay.tsx:14` → `process.env.NODE_ENV !== 'development'` build-time gate → returns null in production, tree-shaken
9. ✅ Session log updated to reflect true status (this entry)

`check:design-tokens` SHARED+LAYOUT=0, `tsc=0`, `lint=0 new`, `check:file-integrity` 13/13. Task 408 blind spots logged. **No `git add`/`commit` emitted.**
