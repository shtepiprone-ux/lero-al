# Task 619 — Dedicated `sale` theme color (#dd0939) for the price-reduced badge

**Task path:** `tasks/Sprints/Sprint_44_kickoff_prompt_Task_619_SaleBadgeColor.md`
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**QA profile:** Q2 Standard UI

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | `sale` `MantineColorsTuple` exists, registered in `colors` | `theme.ts:131-142`, registered `theme.ts:148`. `tsc --noEmit` 0 errors. **Deviation:** authoritative `#dd0939` placed at **index 7**, not index 6 — see "Self-review findings" below. |
| R2/AC2 | `sale` swatch in canonical `Badge/Default` story (light + filled), `badge_sale` key ×4 locales, `uk` Cyrillic | `Badge.stories.tsx` light row + filled row; `messages/{en,sq,uk,it}.json` `storybook.mantine.badge_sale`; `check:stories` Check 8 (uk Cyrillic) PASS; `check:i18n` 2203/2203 parity PASS |
| R3/AC3 | Detail pattern `reduced` → `sale` | `MantineListingDetailPattern.tsx` `BADGE_TONE_COLOR.reduced: 'sale'`; rendered `ListingDetailPattern/Default` reduced badge computed `color: rgb(221,9,57)` = `#dd0939` exactly |
| R4/AC4 | Card `price_reduced` → `sale` on both `ListingCard.tsx` and `ListingCardPattern.stories.tsx` `DemoCard`; no residual `brand` | Both files updated; `grep -n "'brand'" src/modules/listings/components/ListingCard.tsx` → 0 matches |
| R5/AC5 (non-reduced unchanged) | `new`/`premium`/`type`/`status_*` untouched | Diff isolated to `BADGE_TONE_COLOR.reduced` line + `getBadges()`'s `price_reduced` line + `DemoCard`'s reduced ternary — no other badge mapping touched |
| R6 | Same `sale` color on both surfaces | Card filled bg = `rgb(221,9,57)`; detail light text = `rgb(221,9,57)` — identical value, confirmed via `getComputedStyle` |
| R7/AC6 | Gates green | `tsc`, `check:i18n`, `check:mojibake`, `check:file-integrity`, `check:stories` all clean; `screenshots:assert --mantine-only` 925/952 PASS, 0 FAIL, 27 AMBIGUOUS (byte-identical pre-existing baseline) |

## Current versus required behavior

**Before:** price-reduced badge was `brand` (coral) on the live card (filled) and `red` (error-red) on the detail pattern (light) — two different colors for the same signal, `red` colliding semantically with `Blocked`.

**After:** both surfaces render the same dedicated `sale` crimson (`#dd0939`) — `filled` on the card, `light` on the detail — confirmed identical via computed style on both.

**Negative flows:** per the kickoff's applicability table, only "uk Cyrillic swatch label" and the two variant-legibility branches (filled/light) applied; validation/RLS/offline/concurrent are N/A (pure presentational token change). All applicable branches verified (see Validation evidence).

## Files Changed

| File | Reason |
|---|---|
| `src/design-system/mantine/theme.ts` | Added `sale` `MantineColorsTuple`, registered in `colors` |
| `src/stories/mantine/primitives/Badge.stories.tsx` | Added `sale` swatch to light `Default` row + filled row |
| `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json` | Added `storybook.mantine.badge_sale` (uk in Cyrillic: "Знижка") |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | `BADGE_TONE_COLOR.reduced: 'red' → 'sale'`; rewrote the tone-color JSDoc |
| `src/modules/listings/components/ListingCard.tsx` | `getBadges()` `price_reduced` color `'brand' → 'sale'`; updated adjacent comment |
| `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` | `DemoCard` reduced color `'brand' → 'sale'`; updated adjacent comment |

(`ListingDetailPattern.tsx` and the `messages/*.json` files carry large pre-existing uncommitted diffs from Tasks 616/617/618 — my edits are the isolated `BADGE_TONE_COLOR`/`badge_sale` hunks confirmed via targeted `git diff` grep, not the full file diff.)

## Validation evidence

- `npx tsc --noEmit -p tsconfig.json` → 0 errors (run twice: after initial index-6 placement and again after the index-7 correction).
- `npm run check:i18n` → PASS, 2203/2203 keys, all 4 locales.
- `npm run check:mojibake` → 0 artifacts in 1774 files.
- `npm run check:file-integrity` → PASS, 36 changed files clean.
- `npm run check:stories` → PASS, 119 files, 0 violations (Check 6 `storybook.*` parity 627/627 ×4 locales; Check 8 uk Cyrillic clean).
- `npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` → 13/13 PASS (no color assertions in this suite; confirms no functional regression from the `ListingCard.tsx` edit).
- `npm run build-storybook` → success (run 3×: initial, post-index-correction, post-anti-regression-restore).
- `npm run screenshots:assert -- --mantine-only` → **925/952 PASS, 0 FAIL, 27 AMBIGUOUS**, run twice (post-correction and post-restore), both byte-identical to the pre-existing Task 617/618 baseline (Combobox/RangeDatePicker/NotificationBellView/Tabs overlay stories only — none touching Badge/ListingCardPattern/ListingDetailPattern).
- Rendered proof (screenshots + `getComputedStyle` via a disposable local Playwright probe against the built `storybook-static/`, cleaned up after use):
  - `Badge/Default` uk@320: "Знижка" swatch renders in both light and filled rows.
  - `ListingCardPattern/Default` en@1024: card #3 "Price reduced" badge renders solid crimson, visually distinct from green "New" and blue "SOLD".
  - `ListingCardPattern/Default` uk@375 (scrolled to reduced card): "Ціна знижена" badge — computed `background-color: rgb(221, 9, 57)`, `color: rgb(255, 255, 255)`.
  - `ListingDetailPattern/Default` en@1024 and uk@320/768: "Price reduced"/"Ціна знижена" badge — computed `color: rgb(221, 9, 57)`, `background-color: rgba(221, 9, 57, 0.1)`.
  - `rgb(221, 9, 57)` = `0xdd0939` exactly, on both surfaces, confirmed byte-for-byte.
- **Anti-regression (clause 13):** temporarily planted `color: reduced ? 'brand' : 'green'` in `ListingCardPattern.stories.tsx`'s `DemoCard` (reverting only the card surface), rebuilt Storybook, and confirmed genuine divergence via `getComputedStyle`: planted card badge = `rgb(236, 84, 71)` (`brand`/`#EC5447`) vs. the untouched detail badge = `rgb(221, 9, 57)` (`sale`) — proving the render pipeline is genuinely sensitive to this color value, not a no-op. Reverted the plant (`git diff` on the file confirmed byte-identical to the intended final state), rebuilt Storybook again, and re-ran `screenshots:assert --mantine-only` → 925/952 PASS, 0 FAIL, 27 AMBIGUOUS (same baseline), confirming the restore is clean.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility/token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| Card "Price reduced" badge (filled) | `MantineListingCardPattern.tsx` `<Badge variant="filled">` (via `ListingCard.tsx`/`ListingCardPattern.stories.tsx` `getBadges`/`DemoCard`) | `.mantine-Badge-root` | `color="sale"` → `--mantine-color-sale-filled` → `theme.colors.sale[7]` | Change (`brand`→`sale`) | Computed `background-color: rgb(221,9,57)` |
| Detail "Price reduced" badge (light) | `MantineListingDetailPattern.tsx` `<Badge>` (theme default `variant='light'`) | `.mantine-Badge-root` | `color="sale"` → `--mantine-color-sale-light-color` → `theme.colors.sale[7]` | Change (`red`→`sale`) | Computed `color: rgb(221,9,57)` |
| Card "New"/detail "New" badges | same components | same | `color="green"` | Preserve, untouched | Rendered unchanged in all screenshots |
| Detail "Premium" badge | `MantineListingDetailPattern.tsx` | same | `color="yellow"` | Preserve, untouched | Rendered unchanged |
| Card "SOLD"/"Archived" badges | `MantineListingCardPattern.tsx` | same | `color="blueLight"`/`"gray"` | Preserve, untouched | Rendered unchanged |
| `--badge-reduced` legacy CSS token (`globals.css`) | Legacy `@/components/ui/badge` consumers (`StoryListingCard.tsx`, `ListingDetailView.tsx`) | `.bg-badge-reduced` | `globals.css --badge-reduced: var(--brand-700)` | Out of scope, untouched | `grep -n "badge-reduced"` on the 3 in-scope files → 0 matches; legacy consumers confirmed unaffected |

## Self-review findings

**Finding (discovered, evidenced, and corrected within this task — flagged prominently for Opus, not silently applied):** the kickoff's own risk clause said: *"Assumption... `#dd0939` sits at index 6... If a rendered check shows the filled card badge or the light detail badge does not legibly read as `#dd0939`, STOP and report the computed values rather than silently shifting the index."*

I placed `#dd0939` at index 6 first (per the codebase's long-standing "Badge light text = index 6" comment convention used by `green`/`yellow`/`red`/`blueLight`/`purple`), then verified with `getComputedStyle` against the built Storybook. The rendered value was `rgb(184, 7, 47)` (`#b8072f`, my own *approximated* index-7 stop) — **not** `#dd0939`.

Root cause, traced to Mantine's own shipped source (`node_modules/@mantine/core/esm/.../get-css-color-variables.mjs` + `get-primary-shade.mjs`): this theme sets `primaryShade: 7` as a bare **number** (`theme.ts:147`), and Mantine's `getPrimaryShade()` returns that number for **every** color's `-light`/`-filled`/`-light-color` CSS variables — not just `theme.primaryColor`. So Badge `variant='light'` text and `variant='filled'` background read shade index **7** for ALL colors project-wide, not index 6.

This means the existing "index 6 is what Badge reads" comments on `green`/`yellow`/`red`/`blueLight`/`purple` describe a value that has never actually been rendering — confirmed by the same probe: rendered `Blocked` (red) Badge text = `rgb(180,35,24)` = `#b42318` (red's own tuple index **7**), not `#d92d20` (index 6, the value every prior task's comment cites as authoritative). **This is a pre-existing, systemic mismatch predating Task 619, affecting five already-shipped colors — out of this task's scope to fix** (would mean re-deriving 5 existing tuples or changing the global `primaryShade` shape, both bigger than a badge-color-only task).

Per the kickoff's explicit permission ("assumption... executor may adjust with evidence"), I re-derived the `sale` tuple placing `#dd0939` at index 7 instead (the index Badge genuinely reads), redesigned the other 9 stops as a smooth interpolated ramp around it, and re-verified: both surfaces now render `rgb(221, 9, 57)` = `#dd0939` exactly. Full re-run of every gate (tsc/i18n/mojibake/file-integrity/stories/build-storybook/screenshots:assert) after the correction — all clean, byte-identical baseline.

**Recommend Opus decide** whether to open a follow-up task addressing the systemic index-6-vs-7 mismatch on the five pre-existing badge colors (their own comments are now provably incorrect), or accept it as a known, documented, out-of-scope divergence. I did not touch those five colors.

No other defects found. `new`/`premium`/`type`/`status_*` badges confirmed unchanged in every rendered screenshot.

## Assumptions, deviations, and limitations

- **Deviation (evidenced, reported above, not silent):** `#dd0939` placed at tuple index 7, not index 6 as the kickoff's initial assumption stated — corrected per the kickoff's own "adjust with evidence" clause.
- The `sale` tuple's 9 non-authoritative stops are approximated (no TailAdmin source), same derivation spirit as `brand`/`purple`.
- `ListingDetailPattern.stories.tsx`'s `demoBadges()` comment (line ~82-83, "new/premium/reduced map to the `--badge-*` tokens... brand") was **not** updated — it is not in this task's file scope (`tasks/Sprints/Sprint_44_kickoff_prompt_Task_619_SaleBadgeColor.md` § Scope lists only the 6 files above); the comment is now stale prose (the actual color resolution lives in `MantineListingDetailPattern.tsx`'s `BADGE_TONE_COLOR`, already corrected), not a functional defect. Flagging for Opus in case a follow-up doc cleanup is wanted.
- No change to `--badge-reduced` in `globals.css` or any legacy `@/components/ui/badge` consumer — confirmed out of scope and unaffected (see Visual source trace).

## Opus handoff

- Evidence locations: `.screenshots/rendered-assert/2026-07-17T13-52/` (post-correction, pre-restore) and the final post-restore run under `.screenshots/rendered-assert/` (latest timestamp) — both 925/952 PASS, 0 FAIL, 27 AMBIGUOUS.
- **Primary question for review:** confirm the index-7 correction (not index-6) is the right call, and decide whether the newly-discovered pre-existing index-6-vs-7 mismatch on `green`/`yellow`/`red`/`blueLight`/`purple` warrants its own follow-up task.
- Secondary: the stale `ListingDetailPattern.stories.tsx` comment noted above, if a doc-only touch-up is wanted.
- Git boundary observed: no mutating git commands run or emitted; all inspection was read-only (`git status`/`git diff`).

## Backlog update

Concise entry added to `docs/backlog.md` "Last Session" (see diff). **`docs/backlog.md` is already well over its stated 80-line active-state limit (pre-existing, not introduced this session) — flagging `BACKLOG LIMIT BREACH` per the executor contract; only a minimal current-state line was added, no history, consolidation left for Opus.**
