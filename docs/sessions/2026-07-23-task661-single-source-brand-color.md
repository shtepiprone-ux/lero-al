# Session Log — Task 661: Single-source brand color → true `#EC5447` everywhere (web CSS-var scale + emails)

**Date:** 2026-07-23
**Task path:** `tasks/kickoff_prompt_Task_661_SingleSource_Brand_EC5447_Web_And_Emails.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

## 1. Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence | Result |
|---|---|---|---|
| R1/AC1 | Single canonical brand source; `theme.ts` imports it; no second brand-hex literal | `src/design-system/brand.ts` created (10-shade `MantineColorsTuple` + `BRAND_PRIMARY`/`BRAND_HOVER`); `theme.ts` imports `brand` from it (old inline literal removed); grep confirms the only remaining raw `#EC5447` in `src/**` is `brand.ts` itself (§5 below) | Confirmed |
| R2/AC2 | `globals.css` `--brand-N` (light) derive from `var(--mantine-color-brand-N)`; no hand-authored oklch for those shades | `globals.css` `:root` block rewritten: `--brand-50..900` → `var(--mantine-color-brand-0..9)` (map 50→0…900→9) | Confirmed |
| R3/AC3 | `--brand-700`/`--primary` render `#EC5447`; `#D25656` drift gone app-wide; Mantine `color="brand"` unchanged | Playwright computed-style probe against `next dev`: `--brand-700`=`--primary`=`--mantine-color-brand-7`=`#EC5447` on `:root`, all 4 locales (sq/en/uk/it); full-DOM scan on `/sq/listings` found 22 elements rendering `rgb(236,84,71)` and **0** rendering `rgb(210,86,86)` (old drift); Task 659 hero `<section>` `backgroundColor` = `rgb(236, 84, 71)` (was `#D25656`) | Confirmed |
| R4/AC4 (single-knob demo) | Editing `brand.ts` moves both Mantine and CSS-var paths | Temporarily set `brand[7]` to `#00FF00`; re-probe showed `--brand-700`/`--primary`/`--mantine-color-brand-7` and the rendered hero `backgroundColor` all became `rgb(0,255,0)` together; reverted to `#EC5447`; re-probe confirmed restoration | Confirmed |
| R5/AC4 | Emails source from `brand.ts`; no raw `#EC5447` in email code | `BaseEmail.tsx` `BRAND_ACCENT`/`BRAND_AA` now `= BRAND_PRIMARY`/`BRAND_HOVER` (imported); raw hex replaced with `${BRAND_PRIMARY}` in `auth-email-hook/route.ts` (×4), `contactInquiry.ts` (×4 — task said ×2, actual count was 4, both fixed), plus 3 files the task's §3 list omitted but which grep found still hardcoding `#EC5447`: `listingInquiry.ts` (×2), `emailChange.ts` (×2), `sendTemplatedEmail.ts` (×1 local const, now `= BRAND_PRIMARY`). Final grep: `#EC5447` in `src/**` appears only in `brand.ts` (the source) and in comments (theme.ts, pagination-chrome.css, Switch.stories.tsx, BaseEmail.tsx doc comment) — zero occurrences drive a rendered color outside `brand.ts` | Confirmed |
| R6/AC5 | No component markup/logic change; no non-brand token changed; `--brand-850`/`--brand-950` handled, not silently broken | `git diff` touches only `brand.ts` (new), `theme.ts` (import swap), `globals.css` (brand block + `--accent`/`--accent-foreground`), 5 email files (hex→constant substitution only), `scripts/design-tokens-allowlist.json` (governance entry). No `.tsx` markup/logic edited. `--brand-850`: grep-confirmed zero consumers (only self-defined) → deleted (OQ1 default). `--brand-950`: kept hand-authored with a comment explaining it's intentionally not tuple-derived (near-black, not a red tint); live consumers confirmed (`HeroSearch.stories.tsx`, `PopularLocationsView.tsx`) — not touched | Confirmed |
| R7/AC6 | No i18n/user-facing string change | `git diff` contains zero `t(...)`/locale-string edits — only CSS custom-property values and hex-literal→constant swaps | Confirmed |
| R8/AC7 | `tsc` clean; `npm run build` exit 0 | `npx tsc --noEmit` → 0 errors (re-run after all edits). `npm run build` → exit 0, `✓ Compiled successfully in 82s`, 40/40 static pages generated | Confirmed |
| R9/AC8 | Stale `#EC5447`/sibling hex comments on old `--brand-700` line (and siblings) removed/corrected | Old per-shade `/* #XXXXXX */` self-comments (which the Task 660 audit proved were wrong for every shade) replaced with the true rendered hex in a comment, or removed where redundant; the mechanism is now self-evidently correct (`var(--mantine-color-brand-N)`) rather than a hand-typed value that could drift again | Confirmed |

## 2. Current versus required behavior

Matches task §9 table. Negative flows per task §11:

| Branch | Applicable? | Handling | Result |
|---|---|---|---|
| Mantine CSS var absent at `globals.css` eval | Yes | Feasibility gate run first: fetched SSR'd `/sq` HTML, confirmed `<style data-mantine-styles="true">:root, :host{--mantine-color-brand-7: #EC5447; ...}` is present in the initial server-rendered document, on `:root` — resolvable before/independent of stylesheet source order | Not blocked |
| `--brand-850` orphan / `--brand-950` near-black | Yes | OQ1 (delete, zero consumers) / OQ2 (keep hand-authored, documented, consumers confirmed) | Handled |
| Dark mode reachable after all | Yes | Grepped `setColorScheme|useMantineColorScheme|ColorSchemeToggle|toggleColorScheme` across `src/` — zero matches; `MantineRootProvider.tsx` confirmed `defaultColorScheme="light"` with no scheme-switch UI. Dark is genuinely dormant — OQ4 default applied (dark `--brand-*` overrides removed, falls through to `:root`'s Mantine-sourced values), not `BLOCKED` | Handled, not blocked |
| Alpha tint `--accent` loses translucency | Yes | OQ3 applied: dark `--accent` → `color-mix(in srgb, var(--mantine-color-brand-7) 15%, transparent)`; light `--accent` → `var(--mantine-color-brand-0)` | Handled |
| Email client ignores the color | No | Unchanged mechanism (baked hex at render); only the constant's source moved | N/A |
| i18n / auth / RLS | No | Untouched | N/A |

## 3. Files Changed

| File | Reason |
|---|---|
| `src/design-system/brand.ts` (new) | Canonical brand `MantineColorsTuple` + `BRAND_PRIMARY`/`BRAND_HOVER` — the single source of truth |
| `src/design-system/mantine/theme.ts` | Imports `brand` from `brand.ts` instead of a local literal; `MantineColorsTuple` type import kept (still used by 7 other tuples in this file) |
| `src/app/globals.css` | `:root` brand scale → `var(--mantine-color-brand-*)` aliases (50→0…900→9); `--brand-850` deleted; `--brand-950` kept hand-authored with a documentation comment; `--accent` (light) → `var(--mantine-color-brand-0)`; `.dark` brand overrides removed (falls through to `:root`); `.dark` `--accent`/`--accent-foreground` → `color-mix`/`var(--mantine-color-brand-7)` |
| `src/modules/notifications/lib/emails/BaseEmail.tsx` | `BRAND_ACCENT`/`BRAND_AA` now import `BRAND_PRIMARY`/`BRAND_HOVER` from `brand.ts` instead of a raw hex literal |
| `src/app/api/auth-email-hook/route.ts` | Raw `#EC5447` (×4) → `${BRAND_PRIMARY}` (task-named file) |
| `src/modules/notifications/lib/emails/contactInquiry.ts` | Raw `#EC5447` (×4 — 2 functions × 2 occurrences each) → `${BRAND_PRIMARY}` (task-named file, task's own count was off by 2) |
| `src/modules/notifications/lib/emails/listingInquiry.ts` | Raw `#EC5447` (×2) → `${BRAND_PRIMARY}` — found by grep beyond the task's §3 list, fixed to satisfy AC4's binary "no raw hex outside brand.ts" grep |
| `src/modules/notifications/lib/emails/emailChange.ts` | Raw `#EC5447` (×2) → `${BRAND_PRIMARY}` — same as above |
| `src/modules/notifications/lib/sendTemplatedEmail.ts` | Local `const BRAND_ACCENT = '#EC5447'` → `= BRAND_PRIMARY` (imported) — same as above |
| `scripts/design-tokens-allowlist.json` | Added a path-level entry for `src/design-system/brand.ts` (raw hex is Mantine's required `createTheme()` input format, same rationale already given to `src/design-system/mantine`) — the relocation moved the literal outside the previously-allowlisted directory, so `check:design-tokens` flagged it until this entry was added |
| `docs/backlog.md` | Concise active-state update (Task 661 status) |
| `docs/sessions/2026-07-23-task661-single-source-brand-color.md` | This session log |

## 4. Validation evidence

**Feasibility gate (step 1, run before the bulk edit):** fetched SSR HTML from `next dev` (`curl http://localhost:3000/sq`), found `<style data-mantine-styles="true">:root, :host{...--mantine-color-brand-7: #EC5447;...}` present in the initial document on `:root`. Not blocked.

**`npx tsc --noEmit`** — exit 0, no output (re-run after all file edits, including the email constant swaps).

**Computed-style probe (Playwright, `next dev`)** — 4 separate probe scripts, run then deleted (scratch, not committed):
```
computed :root vars: {"brand700":"#EC5447","primary":"#EC5447","mantineBrand7":"#EC5447"}
a section/hero backgroundColor (rendered): rgb(236, 84, 71)
```
All 4 locales:
```
sq {"brand700":"#EC5447","primary":"#EC5447","ring":"#EC5447","priceColor":"#EC5447","brand50":"#FDEEED","brand800":"#BD4339"}
en {...identical...}
uk {...identical...}
it {...identical...}
```
Full-DOM drift scan on `/sq/listings`:
```
{ "brandCount": 22, "driftCount": 0, "brandSample": ["text-primary mantine-Text-root", "mantine-ActionIcon...", ...] }
```
Task 659 hero:
```
hero section: {"bg":"rgb(236, 84, 71)","tag":"SECTION",...}
```

**R4 single-knob demo:**
```
[before revert, brand[7] = '#00FF00']
computed :root vars: {"brand700":"#00FF00","primary":"#00FF00","mantineBrand7":"#00FF00"}
a section/hero backgroundColor (rendered): rgb(0, 255, 0)
[after revert, brand[7] = '#EC5447']
computed :root vars: {"brand700":"#EC5447","primary":"#EC5447","mantineBrand7":"#EC5447"}
a section/hero backgroundColor (rendered): rgb(236, 84, 71)
```

**Standing gates:**
- `npm run check:i18n` — ✅ 4 locales, 2210 keys each, parity PASSED.
- `npm run check:mojibake` — ✅ 0 artifacts in 1873 files.
- `npm run check:file-integrity` — ✅ 11 changed files clean (NUL/BOM/JSON/parse/truncation).
- `npm run check:stories` — ✅ 125 files checked, 0 violations.
- `npm run check:design-tokens` — brand.ts's 10 hex findings resolved via allowlist entry (governance-justified, same rationale as the existing `mantine/` directory entry); 44 remaining findings are all in files this task did not touch (`page.tsx`, `PopularLocationsView.tsx`, `NotificationCenter.tsx`, `SaveToCollectionButton.module.css`) — pre-existing, out of scope, confirmed via `git status --porcelain` (none of those 4 files appear in this task's diff).

**Storybook Mantine-only rendered assertion (Q3):** `npm run screenshots:assert -- --mantine-only` — background run, completed exit code 0. Output: "⚠️ 43 cells have ambiguous findings" (all `ambiguous-overlap` on Combobox/RangeDatePicker overlay backdrops, `text-clipped-ellipsis` on a long-city-name fixture, `ambiguous-offscreen` on Tabs swipe-scroll — all pre-existing UI patterns unrelated to color) followed by **"✅ All hard assertions PASSED"**. 0 FAIL. Mantine selected: 65 stories; non-Mantine excluded: 242.

**Email render check (Q2, AC4):** Bundled `VerifyEmail.tsx` (a `BaseEmail`-wrapped, `BRAND_ACCENT`-consuming template) with esbuild and rendered it via `@react-email/render`:
```
Contains #EC5447 (BRAND_ACCENT resolved): true
Contains old drift #D25656: false
```
Confirms the `brand.ts` → `BaseEmail.BRAND_ACCENT` → consumer chain bakes the correct hex at render.

**Grep proof (AC4):**
```
grep -i '#EC5447' src/**  →  only brand.ts (source), plus comments in theme.ts / pagination-chrome.css /
                              Switch.stories.tsx / globals.css / BaseEmail.tsx doc-comment (none drive a
                              rendered color)
```

**`npm run build`** — exit 0 (captured to a log file and re-verified with an explicit `echo $?` after a non-piped run):
```
✓ Compiled successfully in 82s
✓ Generating static pages (40/40)
```

## 5. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Task-659 homepage hero | `Box component="section" bg="var(--primary)"` | inline `bg` prop | `--primary` → `--brand-700` → `var(--mantine-color-brand-7)` (was hand-authored `oklch`) | Change | Computed `backgroundColor: rgb(236,84,71)` (was `rgb(210,86,86)`) |
| Listing price / focus ring / sidebar-active / chart-1 (Tailwind/CSS-var path) | `--price-color`/`--ring`/`--sidebar-primary`/`--chart-1` semantic tokens | `var(--brand-700)` | `--brand-700` → `var(--mantine-color-brand-7)` | Change | 22-element DOM scan on `/sq/listings`, all resolve `rgb(236,84,71)`, 0 resolve the old drift |
| Mantine `color="brand"` surfaces (buttons/badges/pagination) | `theme.ts` `brand` tuple, `primaryShade:7` | Mantine's own `--mantine-color-brand-7` | unchanged value (`#EC5447`), only its *source file* moved | Preserve | `theme.ts` diff shows zero value change — only the tuple's origin moved to `brand.ts` |
| `--brand-850` (Tailwind `bg-brand-850` etc.) | n/a | n/a | removed | Change (removal) | `grep -rn "brand-850" src` before edit: only self-defined in `globals.css`, zero `.tsx`/`.css` consumers |
| `--brand-950` (hero gradient stops, city-card gradients) | `HeroSearch.stories.tsx`, `PopularLocationsView.tsx` | `from-brand-950`/`to-brand-950` Tailwind utilities | `--color-brand-950` → `--brand-950` (unchanged, hand-authored) | Preserve | `grep -rn "brand-950" src` confirmed both live consumers; value/mechanism untouched |
| Email accent (logo, CTA buttons, strip) | Inline `style` attributes in 6 email builder files | literal hex → template-literal interpolation | `brand.ts` `BRAND_PRIMARY` (via `BaseEmail.BRAND_ACCENT` or a direct import) | Change (source, not rendered value) | Rendered `VerifyEmail` HTML contains `#EC5447`, confirmed via `@react-email/render` |

## 6. Canonical UI decision record

| Visible artifact | Inspected | Canonical source | Disposition | Token/registration |
|---|---|---|---|---|
| All CSS-var brand surfaces | `globals.css` `--brand-*` → `@theme` bridge → utilities/semantic tokens (read full file, lines 1–100, 290–480) | Mantine `--mantine-color-brand-*` (from `brand.ts` tuple) | **reuse (re-point to single source)** — no new token; `brand.ts` is the source | `brand.ts` exports consumed by `theme.ts` + `globals.css` var references |
| Mantine `color="brand"` surfaces | `theme.ts` tuple (read in full) | same tuple, now via `brand.ts` | **reuse (unchanged output)** | — |
| Email accent | `BaseEmail.tsx`, `auth-email-hook/route.ts`, `contactInquiry.ts`, `listingInquiry.ts`, `emailChange.ts`, `sendTemplatedEmail.ts` (all read in full) | `brand.ts` `BRAND_PRIMARY`/`BRAND_HOVER` | **reuse** | shared constant import; `scripts/design-tokens-allowlist.json` updated for `brand.ts`'s required raw-hex literal |

No component markup/story changed — this task is color-plumbing only, so no canonical Mantine Story boundary (clause 16c) is implicated; `theme.ts`'s own tuple values are unchanged (verified byte-for-byte against the pre-edit read), so no Mantine primitive Story needs updating.

## 7. Self-review findings

- **Found and fixed (beyond task's stated scope):** the task's §3 verified-context list named only `BaseEmail.tsx`, `auth-email-hook/route.ts` (×4), and `contactInquiry.ts` (×2, actually ×4) as email hardcodes. A grep across `src/**` for `#EC5447` (case-insensitive) before starting Part B found three more files with raw hex the task didn't cite: `listingInquiry.ts` (×2), `emailChange.ts` (×2), `sendTemplatedEmail.ts` (×1, a local `const`). Fixed all of them using the identical pattern (import `BRAND_PRIMARY`, replace the literal) — required to satisfy AC4's own binary test ("`grep -i '#EC5447'` over `src/**` returns only `brand.ts`"), and squarely inside R5's general requirement ("No raw brand hex remains in email code"). Not a scope expansion beyond the task's own acceptance criterion, and not a markup/layout change — same mechanical color-constant swap already authorized for the named files.
- **Found and fixed (governance-check regression from the refactor):** moving the tuple from `theme.ts` (path-level-allowlisted for raw hex) to a new `src/design-system/brand.ts` (not under the allowlisted `mantine/` subdirectory) caused `check:design-tokens --strict` to newly flag `brand.ts`'s 10 hex literals. Added a justified allowlist entry for `brand.ts` mirroring the existing `mantine/` directory's rationale (Mantine's `createTheme()` requires raw hex input; CSS custom properties are not accepted). No values changed — this is a governance-config update, not a design decision.
- **Checked, no defect found:** dark-mode brand reachability (grepped for any scheme-toggle mechanism — none exists); `--brand-850`/`--brand-950` consumer census (both confirmed via grep before deciding delete-vs-keep); Mantine CSS-var availability timing (SSR HTML inspection, not just documentation-trust).
- **Remaining gap:** none identified against the task's stated requirements/ACs.

## 8. Assumptions, deviations, and limitations

- **OQ1 (`--brand-850`)** — deleted. Grep-confirmed zero consumers anywhere in `src/`.
- **OQ2 (`--brand-950`)** — kept hand-authored (`oklch(0.132 0.022 23)`, unchanged value), with a new comment stating it is intentionally not tuple-derived. Live consumers confirmed: `HeroSearch.stories.tsx`, `PopularLocationsView.tsx` (×3 gradient stops there).
- **OQ3 (`--accent` alpha)** — light `--accent` → `var(--mantine-color-brand-0)`; dark `--accent` → `color-mix(in srgb, var(--mantine-color-brand-7) 15%, transparent)`, preserving the original 15% translucency intent while removing the duplicated hardcoded LCH literal.
- **OQ4 (dark brand fork)** — dark mode confirmed dormant (no toggle anywhere in `src/`); dark `--brand-*` overrides removed, falling through to `:root`'s now-identical Mantine-sourced values (this is safe specifically because `theme.ts`'s `primaryShade: 7` is a bare number, so Mantine's own brand-7 is already flat across both color schemes — the old CSS-var dark brightening was the only asymmetry, and removing it does not desync from Mantine, since Mantine had no dark-specific value in the first place). Not `BLOCKED` — no dark toggle was found, so the OQ4 stop-condition did not trigger.
- **OQ5 (email auto-change limit)** — unchanged mechanism; emails still bake a hex at render (email clients cannot consume CSS variables). A future brand-color edit still requires a rebuild/redeploy to reach emails. Not a blocker, as stated in the task.
- **Beyond-scope email fixes** — see §7; three additional email files fixed beyond the task's §3 list, to satisfy AC4's own grep requirement.
- **No component markup, non-brand token, or i18n string was touched** (confirmed via `git diff` file list — only `brand.ts`, `theme.ts`'s import line, `globals.css`'s brand/accent blocks, 5 email files' hex literals, and the allowlist config).

## 9. Opus handoff

- **Evidence locations:** this session log (validation transcripts inline above); `git diff` for the exact code; `docs/governance-reports/2026-07-22-task660-brand-color-oklch-hex-drift-audit.md` (the audit this task closes).
- **Questions/risks for the reviewer to inspect:**
  1. Confirm the three beyond-scope email fixes (`listingInquiry.ts`, `emailChange.ts`, `sendTemplatedEmail.ts`) are an acceptable in-task correction rather than a scope violation — the reasoning is in §7; the alternative (leaving them hardcoded) would contradict AC4 as literally written.
  2. Confirm the `check:design-tokens` allowlist addition for `brand.ts` is an acceptable governance-config change (mirrors the pre-existing `mantine/` entry's exact rationale, no raw-value change, only a new path).
  3. The 43 AMBIGUOUS Storybook cells (overlay-backdrop overlap, ellipsis, tabs-scroll) are pre-existing per the assertion tool's own classification (not new regressions from this diff — all are structural/interaction findings unrelated to color) — worth an independent spot-check since this task did not open a pre-change baseline to diff against (the task's own step 4 only asked for "0 FAIL, note any AMBIGUOUS as pre-existing").
  4. Dark-mode: confirm the reviewer agrees no reachable toggle exists (only a grep-based check was performed, not a full UI audit) before treating OQ4's dormant-mode conclusion as final.

## 10. Backlog update

`docs/backlog.md` updated: new "Last Session (2026-07-23)" entry (4 lines) for Task 661 `IMPLEMENTED, AWAITING ORCHESTRATOR REVIEW`; prior "Last Session (2026-07-22)" demoted to "Prior Session (2026-07-22)"; task-numbering line updated to note 661. Resulting file: **75 physical lines** (under the 80-line hard limit) — no `BACKLOG LIMIT BREACH`.
