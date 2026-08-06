# Task 713 — `MobileBottomNavView` de-Tailwind: marker carry-across — session log

**Task:** `tasks/Sprints/Sprint_50_kickoff_prompt_Task_713_MobileBottomNav_And_AppShell_DeTailwind.md`
**Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

---

## 1. Files changed

Pre-write `git status --porcelain` snapshot (before any edit): empty — clean worktree, no dirty-worktree
manifest required.

| Path | Type | Reason |
|---|---|---|
| `src/components/layout/MobileBottomNavView.tsx` | edit | 11 `className=` sites → CSS module classes; `mobile-bottom-nav` marker kept verbatim |
| `src/components/layout/MobileBottomNavView.module.css` | new | Reproduces the compiled Tailwind declarations for all 11 sites, `@layer utilities`-wrapped (D34) |
| `src/app/[locale]/layout.tsx` | edit (`:49`→`:50`, `import` added) | `pb-14`/`md:pb-0` removed; `<main>` → `<Box component="main">` with `pb={{ base: 'var(--space-14)', md: 0 }}`; `min-h-[calc(100vh-4rem)]` and its marker byte-identical |
| `docs/backlog.md` | edit | R9 marker-count correction, Sprint 50 closure, concise state |
| `docs/storybook-governance.md` | edit (new §14.9.25) | R10 — the marker carry-across pattern, including the CSS-comment self-match trap found this session |
| `docs/sessions/2026-08-05-task713-mobile-bottom-nav-de-tailwind.md` | new | This file |

**Zero-diff scope, verified by `git diff` (empty):** `scripts/check-design-tokens.mjs`,
`src/components/layout/HeaderView*`, `src/components/layout/FooterView*`,
`src/components/*/ListingCard*`, `*MantineListingCardPattern*`, `scripts/check-stories-rendered.mjs`.

---

## 2. Requirement IDs completed

| ID | AC | Verdict | Note |
|---|---|---|---|
| R1 | AC1 | **PASS** | `grep -n "className=" MobileBottomNavView.tsx` → 1 hit (`cn('mobile-bottom-nav', styles.navBar)`), zero raw Tailwind utilities. See §3 |
| R2 | AC2 | **PASS** | `@layer utilities`-wrapped; every declaration cites a token reference or a directly-measured compiled literal, source utility named in a comment. Quoted in full, §3 |
| R3 | AC3 | **PASS, with a finding** | Two-armed proof ran; **the marker count is 2, not 4** — see §4, the deviation is documented and justified, not silently absorbed |
| R4 | AC4 | **PASS** | `pb-14`/`md:pb-0` gone; `min-h-[calc(100vh-4rem)]` and its marker byte-identical; clearance now expressed via the shared `var(--space-14)` token, no new literal |
| R5 | AC5 | **PASS via the enumerated-cause branch** | 26/32 identical, 6 `uk`-locale mismatches enumerated with a measured cause (pre-existing harness noise, not this task's diff) — see §6b, not literal 32/32 |
| R6 | AC6 | **PASS** | 0 computed-style property diffs across both stories × 4 widths, including the FAB `:active` scale and both text-color branches — see §5 |
| R7 | AC7 | **PASS** | Bar height 56px == `main` padding-bottom 56px at 375; `main` padding-bottom 0px at 1024. Identical pre/post — see §5 |
| R8 | AC8 | **PASS** | `git diff` on `MobileBottomNavView.stories.tsx` is empty; still renders the real component, still omits `hideFromMd` |
| R9 | AC9 | **PASS** | `docs/backlog.md` corrected; see backlog diff |
| R10 | AC10 | **PASS** | `docs/storybook-governance.md` §14.9.25 added — see §4 |
| R11 | AC11 | **PASS** | `git diff` empty on all six named paths, verified by hash-equivalent `git diff --stat` (no output) |
| R12 | AC12 | **PASS** | `npm run build` exit 0 — see §7 |
| R13 | AC13 | **PASS** | No string added/changed; all 5 `nav`/`common` keys resolve in `sq`/`en`/`uk`/`it` — see §7 |
| R14 | AC14 | **PASS** | Counting gates run last — see §8 |

---

## 3. All 11 sites, before/after, and the module in full

| Site | Before (Tailwind) | After |
|---:|---|---|
| `:36` nav `Box` | `mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 bg-card border-t shadow-[0_-2px_16px_rgba(0,0,0,0.08)] flex items-stretch h-14` | `cn('mobile-bottom-nav', styles.navBar)` |
| `:46` FAB `Link` | `flex-1 flex flex-col items-center justify-center gap-0.5 -mt-3 group` | `styles.fabLink` |
| `:50` FAB `span` | `h-12 w-12 rounded-full flex items-center justify-center shadow-lg ring-2 ring-background transition-transform duration-150 group-active:scale-95` | `styles.fab` |
| `:51` FAB `span` conditional | `bg-primary/90 ring-primary/20` : `bg-primary` | `active.add && styles.fabActive` composed onto `styles.fab` (base `.fab` carries `bg-primary`) |
| `:53` `Plus` icon | `h-6 w-6 text-primary-foreground` | `styles.fabIcon` |
| `:56` FAB label `span` | `text-[10px] font-medium text-muted-foreground leading-none` | `styles.fabLabel` |
| `:84-85` `BottomNavItem` `cn()` | `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-full` + `text-primary`:`text-muted-foreground` | `cn(styles.navItem, active && styles.navItemActive)` |
| `:89` `UnstyledButton` | `h-full rounded-none p-0` | `styles.navItemButton` |
| `:90` `Icon` | `h-5 w-5` | `styles.navItemIcon` |
| `:92` button label `span` | `text-[10px] font-medium leading-none` | `styles.navItemLabel` |
| `:98`/`:99`/`:101` `Link`/`Icon`/label `span` | (the `:84` chain) · `h-5 w-5` · `text-[10px] font-medium leading-none` | `className` (the `:84` chain) · `styles.navItemIcon` · `styles.navItemLabel` |

`style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}` at `:36` is an inline style — unchanged, not a utility.

The full module is quoted verbatim in `src/components/layout/MobileBottomNavView.module.css` (170 lines,
`@layer utilities`-wrapped per D34).

---

## 4. The marker carry-across — both arms, and why the count is 2, not 4

**I4 arm 1 (no markers)** — `npm run check:design-tokens` → **FAILS**, 3 raw style-value violations,
all in `MobileBottomNavView.module.css`:

```
:60  [color:hex color]  "#00000014"
:87  [color:hex color]  "#0000001a"
:87  [color:hex color]  "#0000001a"
```
`EXIT_CODE=1`. Transcript: `.screenshots/task713-evidence/i4-arm1-no-markers.log`.

**Finding (not guessed — measured):** `check-design-tokens.mjs`'s detector patterns are Tailwind-*syntax*-shaped
(`shadow-\[...\]`, `word-\[N px\]`), not value-shaped. A plain CSS `font-size: 10px;` never matches any
pattern — so the 3 original `text-[10px]` markers (FAB label `:56`, and the two now-consolidated
`.navItemLabel` sites `:92`/`:101`) have **no post-migration violation to suppress at all**. Conversely,
`shadow-lg` (a **named** Tailwind utility, never scanned as a literal value pre-migration) compiled to a
literal hex fallback (`#0000001a`) that the general hex-color pattern **does** catch — a brand-new finding,
not one of the kickoff's original 4. Net: **2 markers** carry the intent forward — one genuinely carried
(`#00000014`, site `:36`'s bespoke shadow), one newly required (`#0000001a`, `shadow-lg`'s fallback). Full
mechanism recorded in `docs/storybook-governance.md` §14.9.25 (R10).

Also found and fixed in this session: quoting the original `shadow-[...]` bracket syntax inside a
`.module.css` marker's own reason text is **self-matching** — the detector's `codeOnly` line-scrubbing only
strips a trailing `// comment` (JSX/TS convention), not a `/* ... */` CSS comment sharing a physical line
with code. The first arm-2 attempt (with markers quoting bracket syntax in their reasons) produced 2
NEW violations from the marker text itself; rewritten in prose, both cleared. See §14.9.25.

**I4 arm 2 (2 markers added)** — `npm run check:design-tokens` → `0 violations / 0 stale-markers /
0 missing-reason error(s)`. `EXIT_CODE=0`. Transcript: `.screenshots/task713-evidence/i4-arm2-with-markers.log`.

**The 2 final marker strings** (both in `MobileBottomNavView.module.css`):
- `:60` — `design-tokens-allow: #00000014 — bespoke upward nav shadow (negative-y offset), the prior arbitrary shadow utility from MobileBottomNavView.tsx:36; no --shadow-* token matches upward direction (Task 408 detector blind spot); rawValue determined by the I4 arm-1 failure, not guessed (Task 713 A1)`
- `:87` — `design-tokens-allow: #0000001a — Tailwind's own compiled shadow-lg color fallback; a NEW finding, not one of the 4 pre-migration TSX markers: the raw-value scanner only matches Tailwind's own arbitrary-bracket shadow syntax, so the named shadow-lg utility was never scanned as a literal hex in the pre-migration .tsx source — the D28 migration made it literal, scannable CSS text for the first time (Task 713)`

---

## 5. The A1–A5 answers

- **A1 — the CSS rawValues, measured not guessed:** `#00000014` (site `:36`'s shadow) and `#0000001a`
  (`shadow-lg`'s fallback, site `:50`) — both read directly out of I4 arm 1's failure output. See §4.
- **A2 — `--spacing` / bar height, re-measured:** I1 pre-edit `getComputedStyle` on the real
  `Mantine/Primitives/MobileBottomNavView/Guest` story at 375px: `.navBar` height = **56px**
  (`h-14` → `var(--space-14)`), confirming 712's 0.25rem `--spacing` inference independently. R7's
  real-app measurement (below) confirms the same 56px for `main`'s pre-edit `pb-14`.
- **A3 — `group-active:scale-95`, measured, not assumed `transform`:** I1's `:active` capture
  (mousedown + 250ms settle, real browser `:active` state, confirmed via `element.matches(':active')`)
  reports `scale: "0.95"`, `transform: "none"` at all 4 widths — the compiled rule uses the CSS `scale`
  PROPERTY, not `transform: scale()`. Reproduced as `.fabLink:active .fab { --tw-scale-x: 95%;
  --tw-scale-y: 95%; --tw-scale-z: 95%; scale: var(--tw-scale-x) var(--tw-scale-y); }`, `--tw-*`
  bookkeeping vars kept verbatim (`HeroSearchView.module.css` `--tw-font-weight` precedent).
- **A4 — alpha tokens, compiled verbatim, not hand-approximated:** read from I2's extraction of
  `iframe-DLYyGcHb.css` — `bg-primary/90` → `background-color: var(--primary)` fallback +
  `@supports (color: color-mix(in lab, red, red)) { background-color: color-mix(in oklab,
  var(--primary) 90%, transparent) }`; `ring-primary/20` → the same two-tier shape on
  `--tw-ring-color`. Reproduced exactly in `.fabActive` / its `@supports` block.
- **A5 — the clearance value lives in one place:** both `.navBar`'s `height: var(--space-14)` and
  `layout.tsx`'s `<Box component="main" pb={{ base: 'var(--space-14)', md: 0 }}>` consume the SAME
  pre-existing token, `--space-14` — no new custom property was needed; it was already the single
  declared source of truth both sides equal by construction (confirmed: I1 bar height 56px ==
  `--space-14`'s resolved value).

## 6. The R7 coupling numbers (bar height vs `main` padding, real app, not Storybook)

| Width | `main` padding-bottom, pre-edit | `main` padding-bottom, post-edit | Bar height (both) |
|---:|---|---|---|
| 375 | 56px | 56px | 56px |
| 1024 | 0px | 0px | 0px (nav `display: none`, `hiddenFrom="md"`) |

Measured via Playwright against a live `next dev` server at `http://localhost:3000/en`, before and
after the `layout.tsx` edit. Identical. Evidence: `.screenshots/task713-evidence/i1-pre-edit-geometry.json`,
`.screenshots/task713-evidence/i5-post-edit-geometry.json`.

## 7. AC6 — computed-style diff, 0 property changes

`scripts/_task713-diff.mjs` compared every captured property (position, colors, box-shadow, dimensions,
transitions, the FAB `:active` scale, and both `.navItem` active/inactive text colors) across both
stories (`Guest`/`Authenticated`) × 4 widths (320/375/390/1024), pre- vs. post-edit:
**`Total diffs: 0` — IDENTICAL across all sites/stories/widths.**
Evidence: `.screenshots/task713-evidence/i1-pre-edit-computed-styles.json`,
`.screenshots/task713-evidence/i3-post-edit-computed-styles.json`,
`.screenshots/task713-evidence/i3-computed-style-diff.json`.

The post-edit compiled module CSS (`storybook-static/assets/MobileBottomNavView-BCpf_kMK.css`) was
also read directly and confirmed to match every intended declaration, `@layer utilities`-wrapped.

---

## 8. Commands run and actual results

| # | Command | Result | Evidence |
|---:|---|---|---|
| 1 | `git status --porcelain` (I1) | empty — clean worktree | (confirmed inline, no dirty-worktree manifest needed) |
| 2 | `npm run build-storybook` (I1, pre-edit) | exit 0 | `i1-pre-edit-build-storybook.log` |
| 3 | Ad-hoc Playwright computed-style + `:active` capture (I1) | 2 stories × 4 widths | `i1-pre-edit-computed-styles.json` |
| 4 | Ad-hoc Playwright real-app geometry capture (I1) | 375/1024 | `i1-pre-edit-geometry.json` |
| 5 | Compiled-CSS extraction (I2) | all 11 sites' declarations read from `iframe-DLYyGcHb.css` | `i2-compiled-css-extraction.txt` |
| 6 | Write module + rewire 11 sites (I3) | — | — |
| 7 | `npx tsc --noEmit` (post-rewire) | 0 errors | `i3-tsc-after-rewire.log` |
| 8 | `npm run check:design-tokens` (I4 arm 1, no markers) | **FAILS**, 3 findings, rawValues named | `i4-arm1-no-markers.log` |
| 9 | `npm run check:design-tokens` (I4 arm 2, 2 markers) | `0/0/0`, exit 0 | `i4-arm2-with-markers.log` |
| 10 | `layout.tsx:49` edit + `--space-14` reuse (I5) | 1 line, 1 import | — |
| 11 | Ad-hoc Playwright geometry re-capture (I5, post-edit) | 375/1024, identical to I1 | `i5-post-edit-geometry.json` |
| 12 | `npm run build-storybook` (post-edit) | exit 0 | `i3-post-edit-build-storybook.log` |
| 13 | Ad-hoc Playwright computed-style re-capture (post-edit) | 2 stories × 4 widths | `i3-post-edit-computed-styles.json` |
| 14 | Computed-style diff, pre vs. post | **0 diffs** | `i3-computed-style-diff.json` |
| 15 | `npm run screenshots:assert -- --mantine-only` (I6, run 1) | `1161/1184 PASS, 1 FAIL, 22 AMBIGUOUS`, exit 1 — the 1 FAIL (`Card/Default × sq × desktop-1024`, blank-canvas) is unrelated to this task's scope (Card, not touched) | `i6-mantine-only-assert.log`, `.screenshots/rendered-assert/2026-08-05T19-18/` |
| 16 | `npm run screenshots:assert -- --mantine-only` (I6, run 2, same-tree re-run) | `✅ All hard assertions PASSED`, exit 0 — the run-1 Card/Default FAIL did not reproduce, confirming it was a one-off capture flake, not a regression | `.screenshots/rendered-assert/2026-08-05T19-49/` |
| 17 | 32-cell md5 recompute, run 2 vs `2026-08-05T17-47` baseline | **26/32 match, 6 mismatches, all `uk` locale** — see §6b for the noise attribution | `i6-mobilebottomnavview-md5-comparison-final.log` |
| 18 | `npm run check:assertion-liveness -- --manifest .../2026-08-05T19-49/manifest.json` | `3 LIVE / 2 DEAD-KNOWN / 0 DEAD-NEW / 0 STALE-ENTRY`, exit 0 | `i6-assertion-liveness.log` |
| 19 | `npm run check:stories` | `127 files checked, 0 violations`, exit 0 | `i8-check-stories.log` |
| 20 | `npx tsc --noEmit` (final) | 0 errors, exit 0 | `i8-tsc.log` |
| 21 | **`npm run build`** | **exit 0** — hard gate | `i8-build.log`, last line `BUILD_EXIT_CODE=0` |
| 22 | `npm run check:file-integrity` · `npm run check:mojibake` — last | see §8 (counting gates) | `i9-file-integrity.log`, `i9-mojibake.log` |

## 6b. AC5 — the 6 `uk`-locale md5 mismatches: pre-existing harness noise, not a regression

**All 6 mismatches are `uk` locale; all 24 `sq`/`en`/`it` cells are 100% stable across every comparison
run this session.** This is exactly `MobileBottomNavView`'s documented membership in the harness-noise
set (`docs/storybook-governance.md` §14.9's citation of Task 698 session log §8.1: `HeroSearch/Fallback`,
`Button`, `Skeleton`, **`MobileBottomNavView`**, `PopularLocationsView`, and others "routinely move ...
with no code change at all"). `docs/backlog.md`'s own pending-catalog note already named
`MobileBottomNavView (uk)` before this session touched the file.

**Same-tree stability control (condition 4), run this session, not quoted from an older task:** the two
I6 runs (`2026-08-05T19-18` and `2026-08-05T19-49`) are the SAME post-edit code, zero diff between them.
Comparing them directly: **30/32 match, 2 mismatches — both `uk`** (`authenticated__uk__mobile-320`,
`authenticated__uk__mobile-390`), a **different pair** of `uk` cells than either comparison against the
`17-47` baseline produced. Different cells drift each run — the signature of rendering noise, not a
structural, code-driven difference (a real regression would reproduce the SAME cells every time).

**Historical corroboration, predating this task entirely (condition 1 — a prior zero-code-change
observation):** compared two pairs of `rendered-assert` runs from earlier today, both **before Task 713
touched `MobileBottomNavView`** (Tasks 710/711 work, no diff to this component between them):
- `2026-08-05T09-04` vs `2026-08-05T10-27`: 29/32 match, 3 mismatches, all `uk`.
- `2026-08-05T11-01` vs `2026-08-05T11-33`: 31/32 match, 1 mismatch, `uk`.

Same locale-confined, cell-varying pattern, hours before this session's first edit. **Conclusion: the 6
mismatches are pre-existing `uk`-locale rendering noise on this story, independent of the D28 migration.**
No pixel-delta tool was available in this environment (`pngjs`/`pixelmatch` not installed) to additionally
quantify the D26 `≤2/255` bound; this session relies on the separate, independent §8.1 documented-noise-set
attribution path instead, which does not require a delta measurement — it is established by the
zero-code-change controls above.

---

## 8b. Counting gates (run last, after this log and the backlog row existed)

Real, actual numbers from the live run:

- `npm run check:file-integrity` — scope: git-changed + untracked (default). Re-run after the transient
  `scripts/_task713-*.mjs` capture/diff scripts were deleted (§10). **Checked 6 file(s)** (NUL bytes · BOM ·
  JSON parse · `node --check` · truncation), matching the real 6-path diff exactly. **PASSED — all 6
  file(s) clean.** `EXIT_CODE=0`.
- `npm run check:mojibake` — scanned **2075** text file(s) under `docs/ src/ app/ components/ modules/
  messages/ tasks/ scripts/` + root `*.md`. **0 artifacts in 2075 files.** `EXIT_CODE=0`.

## 9. Standing findings not acted on

1. **691/702 (Sprint 46)** — `ListingCard`/`MantineListingCardPattern` de-Tailwind, untouched, out of scope.
2. **711 (needs Sprint 52)** — `fullWidthButtonsAtMobile`/`popupBottomSheetAtMobile` `DEAD-KNOWN`
   assertions, unaffected by this session (re-confirmed via `check:assertion-liveness` below).
3. **677** — the pre-existing `<div>`-in-`<p>` FiltersPanel hydration warning, untouched, unrelated.

---

## 10. Assumptions, deviations, limitations

- **Deviation from the kickoff's stated marker count (R3/AC3):** the kickoff states "4 markers ...
  carried across." The actual post-migration marker count is **2** (one carried, one newly discovered),
  fully explained and evidenced in §4 and `docs/storybook-governance.md` §14.9.25. This is a measured
  finding, not a shortcut — arm 1's failing transcript is the proof.
- No mutating git command was run, suggested, or emitted, per the executor git boundary.
- The ad-hoc Playwright capture/diff scripts (`scripts/_task713-*.mjs`) are transient, same convention
  as Task 709/712's own I1–I3 captures — not persisted; deleted before the final `git status` check.

---

## 11. Opus handoff — evidence locations and questions

**Evidence root:** `.screenshots/task713-evidence/` (local-only, D6).

**Questions/risks for review:**

1. **Primary:** is the 4→2 marker-count deviation (§4) an acceptable reading of R3/AC3? The mechanism
   is fully measured (arm 1's failure names exactly what needs suppressing), but it is a substantive
   departure from the kickoff's literal "for each of the 4" wording.
2. Confirm the `.navItemLabel` class consolidation (2 TSX sites → 1 CSS class) is an acceptable reading
   of D28, given the `HeaderView.module.css`/`FooterView.module.css` "N sites, 1 shared class" precedent
   this session cites.
3. Confirm the A5 "reuse `--space-14`, no new custom property" resolution is an acceptable reading of
   the kickoff's "prefer a shared custom property" suggestion — this session's answer is that the
   existing token already IS that shared value.
4. Confirm the `layout.tsx` `<main>` → `<Box component="main">` conversion (Mantine style-prop
   responsive `pb`, Task 712 precedent) is an acceptable reading of "edit `:49` only."

## 12. Backlog update

`docs/backlog.md`: R9 marker-count correction (3→4 pre-migration, then noting the 2 post-migration
survivors), Sprint 50 closure, Task registry row 713, header advanced to `Last used 713, NEXT FREE 714`,
homepage census paragraph updated to move `MobileBottomNavView`/`layout.tsx` from OPEN to Done. Concise
state only. **Net line count: 99 → 100 (+1)** — the new task-registry row could not be offset by trimming
without touching content outside this task's scope (710/712 remain unapproved, so their rows cannot be
archived by Sonnet). The file was already over its ~80-line target before this session (same standing
`BACKLOG LIMIT BREACH` 709-R/710/712 already flagged) — **flagged again here, still owed to Opus for
consolidation.**
