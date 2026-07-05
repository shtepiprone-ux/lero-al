# Task 550 — Zip-absent primitives: live-reference re-verification (Toast §6r · Slider §6q · Skeleton §6n)

**Executor: direct execution, no separate orchestrator layer in this session.**

## Summary

Corrects three Phase-1 primitives (Toast/Task 549, Slider/Task 548, Skeleton/Task 544) that were closed on
"formalize prior prose + Mantine zero-override defaults" — a closure pattern clause 16a (new, 2026-07-05)
rejected because the rendered result read as stock Mantine, not TailAdmin. The orchestrator captured live
`demo.tailadmin.com` references BEFORE this kickoff (§6r-LIVE / §6n-LIVE-equivalent "Verified orchestrator
capture results" block, both already in `docs/tailadmin-style-reference.md` when this session started) — per
clause 16a, the executor did **not** browse TailAdmin, only implemented against the orchestrator's captured
values. One primitive at a time, in the mandated order: **Toast → Slider → Skeleton.**

## 1. Toast (§6r-LIVE) — real fixes

The orchestrator's capture (`demo.tailadmin.com/notifications`, Success variant) found the real TailAdmin
compact toast is fundamentally different from Task 549's implementation:
`class="flex items-center justify-between gap-3 w-full sm:max-w-[340px] rounded-md border-b-4 border-success-500 bg-white p-3 shadow-theme-sm"`.

**Fixes applied (`theme.ts` `Notification` block, rewritten):**
1. **Accent = 4px BOTTOM border** (was Task 549's left `::before` bar) — `styles.root.borderBottom` using
   `var(--mantine-color-${color}-5)` (semantic-500 index, same tuple index Alert/Badge already use).
2. **Shadow = `shadow-theme-sm`** (was Task 549's `shadow-lg` reliance) — set as a **literal inline
   `boxShadow`**, NOT routed through `theme.shadows.sm`: 4 existing pattern consumers
   (`MantineCardGrid`/`MantineAuthFormPattern`/`MantineListingDetailPattern`/`MantineListingCardPattern`)
   already pass `shadow="sm"` on `Paper`/`Card` and currently resolve to Mantine's own stock `sm` shadow —
   overriding the shared `theme.shadows.sm` key would silently reshade all four, outside this task's scope.
3. **Icon badge = 40×40 `rounded-lg` (8px), semantic-50 tint, semantic-600 glyph** (was Mantine's 28px
   circular solid-fill badge) — `styles.icon` sets width/height/borderRadius/backgroundColor/color directly;
   the glyph color is inherited via `currentColor` by the lucide icon passed as the `icon` prop.
4. **Title = 16px/400/gray-800** (was Mantine's own 14px/500/gray-900 default) — `styles.title`.
5. **Close button = 24px** (via a NEW `defaultProps.closeButtonProps`, scoped to `Notification` only — NOT a
   global `theme.components.CloseButton` override, which would leak into Modal/Drawer's own close button).
   **Color gray-400** required a second fix: `closeButtonProps.style.color` had **zero effect** — verified via
   rendered proof — because `Notification.mjs` spreads `...closeButtonProps` BEFORE its own
   `...getStyles("closeButton")` call, so any `style`/`className` passed there is silently overwritten. Fixed
   via the static `.mantine-Notification-closeButton` class in `notification-chrome.css` instead.
6. **Left `::before` bar permanently hidden** (`notification-chrome.css`) — Task 549 un-hid it to combine with
   an icon; the real component doesn't use a left bar at all, so it now stays hidden unconditionally.
7. Radius 6px + responsive max-width (100%/`<640`, 340px `≥640`) were already correct — kept unchanged.
8. **Font-family (Outfit) — NOT applied, documented divergence.** The capture cites Outfit; this project
   retired Outfit project-wide (Task 506) because it has no Cyrillic glyphs, breaking the uk locale. Changing
   a shared/global token was also explicitly out of scope. Open Sans stays.

**Story changes:** `ICON_SIZE` 18→24 (matches the captured glyph size); comments updated; neutral/default state
keeps its icon-less, gray-bordered treatment (no live-cited "neutral" variant exists, so it reuses the same
mechanism with `color="gray"`, giving a neutral-toned bottom border, never a semantic color).

**Rendered proof (Playwright `getComputedStyle` against the built story, all 5 states, desktop-1024):**
```
success:  borderBottom 4px rgb(18,183,106)=#12B76A · iconBg rgb(236,253,243)=#ECFDF3 · iconColor rgb(3,152,85)=#039855
info:     borderBottom 4px rgb(11,165,236)=#0BA5EC  · iconBg rgb(240,249,255)=#F0F9FF · iconColor rgb(0,134,201)=#0086C9
warning:  borderBottom 4px rgb(247,144,9)=#F79009   · iconBg rgb(255,250,235)=#FFFAEB · iconColor rgb(220,104,3)=#DC6803
error:    borderBottom 4px rgb(240,68,56)=#F04438   · iconBg rgb(254,243,242)=#FEF3F2 · iconColor rgb(217,45,32)=#D92D20
neutral:  borderBottom 4px rgb(102,112,133)=#667085 (gray-500, no icon)
ALL:      borderRadius 6px · boxShadow "0 1px 3px rgba(16,24,40,.1), 0 1px 2px rgba(16,24,40,.06)"
          · maxWidth 340px (desktop-1024) / 100% (mobile-320) · icon 40×40/8px-radius · title 16px/400/rgb(29,41,57)=#1D2939
          · beforeDisplay "none" (left bar hidden) · closeButton 24×24/rgb(152,162,179)=#98A2B3
```
Every single value matches the §6r-LIVE citation exactly, byte-for-byte.

**Loader-allowlist:** re-verified empirically (story changed) — `loaderOnly: 0` across all 16 cells in the
native gate. `LOADER_ALLOWLIST` UNCHANGED.

### Post-review addendum (2026-07-05): title weight owner override

After the orchestrator's diff-level review pass (commit emitted, pending owner native run), the owner
requested the Notification title weight be **600, not the §6r-LIVE captured 400** — stronger emphasis than
the live capture shows. Applied as an explicit, documented deviation from the citation (same category as
Skeleton's "keep the shimmer" ruling): `theme.ts` `Notification.styles.title.fontWeight` changed `400 → 600`;
`docs/tailadmin-style-reference.md` §6r-LIVE gained an owner-override note directly below the original
capture line (the capture record itself is untouched — still shows the real measured `400`). Rendered proof
re-verified: all 5 story states now compute `font-weight: 600` (was `400`). Re-ran `tsc`, `check:design-tokens
--strict`, `check:file-integrity`, `build-storybook`, `screenshots:assert -- --mantine-only` — all green,
**462/480 PASS, 0 FAIL, 18 AMBIGUOUS** (identical to the pre-change baseline; only the title weight changed,
no new FAIL/ambiguous cell). The rendered-proof block above (line 58) is now superseded on this one field —
`title 16px/600/rgb(29,41,57)=#1D2939` is current; everything else in that block is unchanged.

## 2. Slider (§6q) — confirmed, zero pixel change

The orchestrator's full live component-menu sweep confirms **no value/range slider exists anywhere on
TailAdmin** (Carousel is an image slider; Form Elements has no range widget). **Ruling (owner-accepted):
token-consistency only** — judged on whether the primitive uses real TailAdmin tokens, not component-shape
parity (impossible with no reference). Re-verified via rendered `getComputedStyle` against the Task 548
build: `--slider-track-bg: #f2f4f7` (gray-100 ✓), `--slider-radius: 9999px`/`1000px` (pill ✓), fill/thumb
border `rgb(236,84,71)` = `#EC5447` (brand ✓), thumb `12px` ✓ — all four tokens unchanged, zero pixel change
required. Added a confirmation note to `docs/tailadmin-style-reference.md` §6q; no `theme.ts`/story/chrome
edits for Slider in this task.

## 3. Skeleton (§6n-LIVE) — real fixes

Task 544's "no dedicated skeleton component exists" conclusion was **wrong** — the orchestrator found real
static placeholder cards on the Layouts dashboards (`demo.tailadmin.com/layout-one`), missed originally
because the probe searched for `animate-pulse`/shimmer classes, not static placeholder markup. Captured:
`class="h-40 rounded-xl border border-gray-200 bg-gray-50"`.

**Fixes applied:**
1. **Fill = gray-50** (`#F9FAFB`, was gray-200 — Task 544's wrong Progress-track reuse) —
   `skeleton-chrome.css`, unchanged mechanism (pseudo-element `::after`, unreachable via `styles`), only the
   color token changed.
2. **Border = 1px solid gray-200** (`#E4E7EC`) — a NEW rule (none existed before). Mantine's Skeleton has no
   border property in its own compiled CSS at all, so `theme.components.Skeleton.styles.root.border` is a
   plain, uncontested addition — no chrome CSS needed.
3. **Radius = 12px** (`rounded-xl`, was 8px via the global `defaultRadius:'lg'` fallback) —
   `defaultProps.radius:'xl'`; Skeleton's own `varsResolver` already exposes `radius` as `--skeleton-radius`
   when set, so this is a direct, zero-chrome fix. `circle` skeletons are unaffected (Mantine's own ternary
   keeps `--skeleton-radius:1000px` for `circle`, a geometric certainty).
4. **Animation — OWNER RULED: KEEP Mantine's own shimmer.** TailAdmin's real placeholder is static, but the
   owner explicitly chose to retain Mantine's pulse animation over the corrected token chrome — a documented
   deviation, not an oversight.
5. Border applied uniformly to circle skeletons too (no live citation distinguishes shape); judgment call,
   documented — no counter-citation exists either way.

**Rendered proof (Playwright, all 9 Skeleton instances across the story's 5 states):**
```
rectangular: borderRadius 12px · border "1px solid rgb(228,231,236)"=#E4E7EC · afterBg rgb(249,250,251)=#F9FAFB
circle:      borderRadius 1000px · same border/fill
ALL:         animationName "m_299c329c" (Mantine's own shimmer keyframe — confirmed still active)
```
Every value matches §6n-LIVE exactly.

**Loader-allowlist:** re-verified — `loaderOnly: 0` across all 16 cells (the shimmer animation was already
present before this task too, so this is a re-confirmation, not a new finding).

## Consumer audit (unchanged from Tasks 548/549/544 — re-confirmed)

- `grep -rl "@/components/ui/slider"` / `"@/components/ui/skeleton"` project-wide → 0 consumers each.
- Sonner (`sonner`/`toast(`) consumers: 34 files, migrate ZERO (unchanged scope, `sonner.tsx` + `<Toaster>`
  untouched). Only `MantineNotificationPattern.tsx` + `MantineRootProvider.tsx` touch the Mantine
  `Notification`/`notifications` path — `MantineNotificationPattern`'s live preview cards
  (`previewItems`) use a raw `Paper`+`ThemeIcon` composition, NOT the `<Notification>` primitive, so they are
  entirely unaffected by this task's `theme.components.Notification` changes (confirmed by reading the
  component — no `<Notification>` import there).
- No other primitive/consumer imports `Skeleton`/`Slider`/`Notification` beyond their own stories and
  `theme.ts` — no cross-primitive regression surface.

## Regression (clause 15)

`grep -in "slider\|skeleton\|toast\|notification" docs/critical-flow-registry.md` → only unrelated mentions of
"toast" as an OUTCOME of other registered flows (e.g. clear-history's "neutral info toast"), none of which
reference the `Notification` COMPONENT or the Mantine notification system — those flows use Sonner, untouched
by this task. No registered flow's behavior changed.

## Gates (run once per primitive correction, all green)

```
npx tsc --noEmit                     → 0 errors (each correction)
npm run check:stories                → PASSED, 104 files, 0 violations
npm run check:i18n                   → PASSED, 4 locales, 2104 keys (no new keys this task)
npm run check:mojibake               → 0 artifacts, 1579 files
npm run check:design-tokens --strict → 0 violations, 397 files scanned (theme.ts's inline shadow-theme-sm
                                        literal did not trip the gate — theme.ts is the token-definition file)
npm run check:file-integrity         → PASSED, 12 files clean
npm run build-storybook              → built clean (Toast ×3, Skeleton ×3 — initial/planted/reverted each)
npm run screenshots:assert -- --mantine-only → 462/480 PASS, 0 FAIL, 18 AMBIGUOUS (pre-existing
                                        Combobox/Drawer/Tabs set, unchanged across every run)
```

A `Progress/Default × uk × mobile-375` blank-canvas capture flake appeared once mid-session (unrelated —
Progress wasn't touched by this task) and cleared on the very next re-run, matching the exact "transient
capture flake" pattern already documented in Task 547's session — not a regression.

## Planted-violation transcripts (AC5, one per changed story)

**Toast:** planted `<div data-testid="task550-planted-overflow" style={{width:900,height:12}}>` → 12/12
expected mobile cells (4 locales × {320,375,390}) FAILed `noHorizontalOverflow`, desktop-1024 unaffected.
Reverted → `grep` 0 matches, rebuilt, reconfirmed **462/480 PASS, 0 FAIL, 18 AMBIGUOUS** (byte-identical to
the pre-plant baseline).

**Skeleton:** same plant, same result — 12/12 expected mobile cells FAILed, desktop-1024 unaffected. Reverted
→ reconfirmed **462/480 PASS, 0 FAIL, 18 AMBIGUOUS** (byte-identical).

**Slider:** no story change this task (confirmation only) — no new planted-violation needed; Task 548's
existing planted-violation transcript still stands for this primitive's overflow-gate proof.

## Files Changed

| File | Change | Why |
|---|---|---|
| `src/design-system/mantine/theme.ts` | Rewrote `Notification` block (§6r-LIVE: borderBottom accent, literal shadow-theme-sm, 40×40 icon badge, 16px/400 title, closeButtonProps size); rewrote `Skeleton` block (added `defaultProps.radius:'xl'` + `styles.root.border`) | Real, capture-verified TailAdmin conformance fixes (clause 16a) |
| `src/design-system/mantine/notification-chrome.css` | Rewrote: permanently hide left `::before` bar (was toggled on with icon); added `.mantine-Notification-closeButton` color rule; kept responsive max-width | Accent mechanism changed to bottom-border; close-button color unreachable via `closeButtonProps` (spread-order bug found) |
| `src/design-system/mantine/skeleton-chrome.css` | Fill color gray-2 → gray-0 | §6n-LIVE cites gray-50, not gray-200 |
| `src/stories/mantine/primitives/Notification.stories.tsx` | `ICON_SIZE` 18→24; updated comments | Match captured glyph size + corrected mechanism description |
| `src/stories/mantine/primitives/Skeleton.stories.tsx` | Updated caption text (gray-200/8px → gray-50+border/12px) | Caption accuracy (Task 544's dev-annotation exemption still applies — no i18n needed) |
| `docs/tailadmin-style-reference.md` | Added Task 550 correction notes to §6n, §6q, §6r; §6r prose marked fully inert | Documents the clause 16a re-grounding for all 3 primitives |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-regenerated by `screenshots:assert` (final clean run) | Standing auto-generated artifact |
| `docs/mantine-tailadmin-migration-tracker.md` | P1.24/P1.27/P1.29 rows updated to "+ Task 550 correction/confirmation"; Phase-1 marked COMPLETE | Tracker status roll-up (added at orchestrator review — was omitted from the original table) |

No product/consumer file touched; `sonner.tsx`, `<Toaster>`, `MantineRootProvider.tsx`'s `<Notifications/>`
position, and all 34 Sonner consumers are unchanged.

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | Each of Toast/Slider/Skeleton re-grounded on a live capture with provenance; "formalized-prose/honest-negative zero-override" justification removed | ✅ | §6r-LIVE / §6n correction / §6q confirmation notes, all citing the orchestrator's pre-captured provenance (URL, date, method, selector) |
| 2 | Every Step 0.4 divergence fixed; every property positively verified against the capture; zero invented values | ✅ | Toast: 6 fixes (accent/shadow/icon/title/close-button/bar-suppression); Skeleton: 3 fixes (fill/border/radius); Slider: 0 fixes needed, confirmed matching |
| 3 | Story renders corrected chrome, proven side-by-side (rendered proof) at ≥640/320 × 4 locales; mobile gate re-confirmed; loader-allowlist re-verified | ✅ | Playwright `getComputedStyle` proof above for both changed primitives; native gate 16/16 PASS each; `loaderOnly:0` both |
| 4 | No regression: theme-only + new-file; no shared token/semantic array/`globals.css` change; all consumers unchanged | ✅ | shadow-theme-sm deliberately kept OUT of `theme.shadows` to avoid the 4 Paper/Card `shadow="sm"` consumers; close-button fix scoped to Notification only, not global `CloseButton`; zero Sonner consumers touched |
| 5 | Rendered `--assert` matrix + side-by-side captures + planted-violation transcript; all light gates green | ✅ | All transcripts above; all 6 light gates green each run |
| 6 | Session log: Files-Changed, AC self-audit, `Self-validation:` line; no git run | ✅ | This file; no `git` command executed |

## Self-validation

Self-validation: all 6 ACs met with rendered-gate evidence, for all three primitives. Toast required the most
substantial correction — 6 distinct, compiled-source-verified divergences from the orchestrator's live
capture, including one genuinely NEW finding not anticipated by the kickoff: `Notification.mjs`'s own prop
spread order silently discards a `style`/`className` passed via `closeButtonProps` (verified by testing the
inline approach first, observing zero effect via rendered proof, then reading the compiled source to confirm
why, then fixing via the established static-classname `-chrome.css` mechanism instead). The shadow-theme-sm
value was deliberately kept as a literal inline value rather than routed through the shared `theme.shadows.sm`
key, specifically to avoid a collateral regression to 4 existing `Paper`/`Card` `shadow="sm"` pattern
consumers that rely on Mantine's own stock shadow — a scope-preserving judgment call, documented inline.
Skeleton's fix was more contained (fill/border/radius, animation deliberately kept per explicit owner ruling).
Slider required zero pixel changes — confirmed via fresh rendered proof that Task 548's tokens already satisfy
the owner's token-consistency ruling. Both planted-violation transcripts (Toast, Skeleton) reproduced the
exact expected 12/12 mobile-cell failure pattern and reverted to a byte-identical baseline. Final native gate:
462/480 PASS, 0 FAIL, 18 AMBIGUOUS (identical pre-existing Combobox/Drawer/Tabs set across every run in this
session). Zero product/consumer file touched; zero shared token/semantic array modified; zero other primitive
regressed.
**HELD — no git commands run; awaiting review + explicit-path commit emission (one per primitive, per the
kickoff's commit hand-off note).**
