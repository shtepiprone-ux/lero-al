# Task 822 — `check:design-tokens:strict` is blocking and red: 50 inherited raw style values, three different kinds

Sprint 75 · P1 · QA profile **Q4** (was `Q2` in the reservation — this task corrects a detector arm, which is a gate
claim needing planted proof)

**Status: `APPROVED WITH NOTES`** — reviewed 2026-09-16, archived (review ledger `docs/reviews/2026-09-16-task822-design-tokens-strict-inherited-violations.review-ledger.json`). Filed 2026-09-16. Task **797** is sequenced after this task's commit (same detector,
test file, `theme.ts` and `PhoneField.tsx`).

## 1. Mode and task type

`IMPLEMENTATION` — governance + value-preserving token migration. Three kinds of finding get three different, named
resolutions; no rendered value changes.

## 2. Objective

Take `npm run check:design-tokens:strict` from exit 1 to exit 0 on the real tree **without** adding to
`scripts/design-tokens-allowlist.json` and **without** changing any rendered value, by:

1. fixing a detector false positive that reads media-query strings as inline style dimensions;
2. marking the four findings that are data, not style, with reasoned markers;
3. replacing every real raw style value with an existing theme token of the identical value, or with one of 11 new
   `theme.other` roles this kickoff names, each holding the identical value.

## 3. Verified context — measured 2026-09-16

### 3.1 The gate today

`FACT` — `docs/sessions/evidence/task822/design/01_check-design-tokens-strict.txt`: exit 1,
`Total: 50 raw style-value violation(s) | 0 stale-marker(s)`, `raw-dimension-prop 33`, `raw-inline-dimension 17`, in
18 files. The reservation recorded **56** on 2026-09-11; the difference is work landed since (824/821). Task 813's AC22
proved the set inherited. CI runs this command blocking in the `governance` job (`governance-pr.yml:149`).

### 3.2 Classification of all 50 findings

Every row was read in source on 2026-09-16. `px` assumes `--mantine-scale: 1`, which the runtime probe measured
(`02_runtime-mantine-spacing-vars.txt`).

**Kind A — detector false positive: a media-query string, not a style (8).** `raw-inline-dimension`'s regex
(`check-design-tokens.mjs:286-300`) starts `\b(?:width|…)\s*:\s*…`; in `'(max-width: 1023px)'` the `\b` between `-`
and `w` matches.

| Site | Source text |
|---|---|
| `src/hooks/useIsMobile.ts:18` | `window.matchMedia('(max-width: 1023px)')` |
| `src/components/admin/AdminUsersTable.tsx:93` | `useMediaQuery('(max-width: 40em)')` |
| `src/lib/imageDelivery.ts:20` ×2 | `GALLERY_MAIN_SIZES = '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 34vw'` |
| `src/lib/imageDelivery.ts:80` ×2 | `'(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'` |
| `src/lib/imageDelivery.ts:92` | `'(min-width: 640px) 360px, calc(100vw - 32px)'` |
| `src/lib/imageDelivery.ts:100` | `'(min-width: 374px) 280px, calc(82vw - 26px)'` |

**Kind B — a data object key that happens to be named `width`/`height` (4).**

| Site | Source text | Why it is not a style |
|---|---|---|
| `src/components/admin/AdminUserAvatar.tsx:83` ×2 | `console.log('[AvatarFlow] crop_blob_created', { …, width: 256, height: 256 })` | a log payload |
| `src/app/[locale]/listings/[slug]/page.tsx:125-126` | `openGraph.images[0] = { url, width: 1200, height: 630, alt }` | Next.js OG image metadata (pixel size of the image asset) |

**Kind C — a real raw style value (38).** Resolution column: an existing token with the identical value, or a new
role from §3.3.

| # | Site | Raw | Resolution (identical value) |
|---|---|---|---|
| 1 | `src/components/ui/PasswordRequirementsHint.tsx:24` | `gap={6}` | `gap="compact"` (0.375rem) |
| 2 | `…PasswordRequirementsHint.tsx:28` | `lh="1rem"` | `lh={theme.other.lineHeight.passwordHintRow}` |
| 3 | `…PasswordRequirementsHint.tsx:32` | `marginTop: 2` | `marginTop: 'var(--mantine-spacing-micro)'` (0.125rem) |
| 4 | `…PasswordRequirementsHint.tsx:34` | `marginTop: 2` | same as #3 |
| 5 | `…PasswordRequirementsHint.tsx:52` | `gap={4}` | `gap="tight"` (0.25rem) |
| 6 | `…PasswordRequirementsHint.tsx:52` | `mt={4}` | `mt="tight"` |
| 7 | `…PasswordRequirementsHint.tsx:56` | `lh="19.5px"` | `lh={theme.other.lineHeight.authNoteParagraph}` |
| 8 | `…PasswordRequirementsHint.tsx:58` | `gap={4}` | `gap="tight"` |
| 9 | `src/components/shared/FilterChoiceGroup.tsx:106` | `gap={6}` | `gap="compact"` |
| 10 | `src/components/shared/HowItWorksSteps.tsx:29` | `mb={40}` | `mb={theme.other.layout.headingBlockGap}` |
| 11 | `…HowItWorksSteps.tsx:32` | `spacing={32}` | `spacing="2xl"` (2rem) |
| 12 | `src/components/shared/PhoneField.tsx:145` | `gap={6}` | `gap="compact"` |
| 13 | `…PhoneField.tsx:165` | `dropdownMinWidth={240}` | `dropdownMinWidth={theme.other.layout.phoneCountryDropdownMinWidth}` |
| 14-17 | `src/components/admin/AdminUsersTable.tsx:146,147,162,163` | `mih`/`miw="2.75rem"` | `{theme.other.touchTarget}` (`'2.75rem'`, `theme.ts` `other.touchTarget`) |
| 18 | `src/modules/listings/components/FavoriteButton.tsx:179` | `radius="1.125rem"` | `radius={theme.other.radius.favoritePill}` |
| 19 | `src/modules/listings/components/ListingMobileCTA.tsx:71` | `paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)'` | `'calc(env(safe-area-inset-bottom) + var(--mantine-spacing-sm))'` (0.75rem) |
| 20 | `src/modules/listings/components/ListingsShell.tsx:15` | `pt={4}` | `pt="tight"` |
| 21 | `…ListingsShell.tsx:16` | `height={32}` | `height={theme.other.layout.listingsFiltersSkeletonRowHeight}` |
| 22 | `src/app/[locale]/layout.tsx:52` | `mih="calc(100vh - 4rem)"` | `` mih={`calc(100vh - ${theme.other!.boxSize!.mainViewportOffset})`} `` |
| 23 | `src/app/[locale]/page.tsx:38` | `mb={40}` | `mb={theme.other!.layout!.headingBlockGap}` |
| 24 | `src/modules/notifications/components/NotificationBellView.tsx:36` | `offset={4}` | `offset={theme.other.layout.notificationPopoverOffset}` |
| 25-26 | `…NotificationBellView.tsx:39` | `mih`/`miw="2.75rem"` | `{theme.other.touchTarget}` |
| 27 | `…NotificationBellView.tsx:46` | `width={320}` | `width={theme.other.layout.notificationPanelWidth}` |
| 28 | `…NotificationBellView.tsx:48` | `maxHeight: 480` | `maxHeight: theme.other.layout.notificationPanelMaxHeight` |
| 29 | `src/modules/notifications/components/NotificationCenter.tsx:80` | `py={32}` | `py="2xl"` |
| 30 | `src/modules/notifications/components/NotificationItem.tsx:196` | `fz="1rem"` | `fz="md"` (1rem) |
| 31 | `…NotificationItem.tsx:197` | `lh="1.5rem"` | `lh={theme.other.lineHeight.notificationGlyph}` |
| 32 | `…NotificationItem.tsx:198` | `marginTop: '0.125rem'` (+ an existing marker the gate does not match) | `marginTop: 'var(--mantine-spacing-micro)'`; delete the marker |
| 33 | `…NotificationItem.tsx:222` | `mt={2}` | `mt="micro"` |
| 34 | `…NotificationItem.tsx:232` | `fz="0.625rem"` | `fz="micro"` (`theme.fontSizes.micro`) |
| 35 | `…NotificationItem.tsx:235` | `mt="0.25rem"` | `mt="tight"` |
| 36 | `…NotificationItem.tsx:246` | `mt={6}` | `mt="compact"` |
| 37 | `src/components/auth/CaptchaWidget.tsx:35` | `py={4}` | `py="tight"` |
| 38 | `…CaptchaWidget.tsx:35` | `lh="19.5px"` | `lh={theme.other.lineHeight.authNoteParagraph}` |

Total 8 + 4 + 38 = **50**.

### 3.3 The 11 new roles — values are the literals they replace, nothing else

`FACT` — none of these values has an existing token **with a matching meaning**: `theme.ts` `spacing` is
`xs 0.5 · sm 0.75 · md 1 · lg 1.25 · xl 1.5 · 2xl 2 · 3xl 3 · micro 0.125 · tight 0.25 · compact 0.375` rem; `radius`
tops at `2xl 1rem` then `pill`; `lineHeights` are unitless; `other.layout` holds `authFormMaxWidth 400 ·
emptyStateMinBlockSize 200 · listingContactStickyOffset 80 · footerGridGap 40`, each documented to one source
(`theme.ts:136-160`). `footerGridGap` equals 40 but means the footer grid, so it is **not** reused.

| Role | Value | Replaces | Source comment must cite |
|---|---|---|---|
| `other.lineHeight.passwordHintRow` | `'1rem'` | #2 | `PasswordRequirementsHint.tsx:28` pre-822 literal |
| `other.lineHeight.authNoteParagraph` | `'1.21875rem'` (19.5px) | #7, #38 | the measured pre-migration `<p>` value both files' comments cite |
| `other.lineHeight.notificationGlyph` | `'1.5rem'` | #31 | `NotificationItem.tsx:197` |
| `other.layout.headingBlockGap` | `40` | #10, #23 | `HowItWorksSteps.tsx:29`, `page.tsx:38` |
| `other.layout.phoneCountryDropdownMinWidth` | `240` | #13 | `PhoneField.tsx:165` |
| `other.layout.listingsFiltersSkeletonRowHeight` | `32` | #21 | `ListingsShell.tsx:16` |
| `other.layout.notificationPopoverOffset` | `4` | #24 | `NotificationBellView.tsx:36` |
| `other.layout.notificationPanelWidth` | `320` | #27 | `NotificationBellView.tsx:46` |
| `other.layout.notificationPanelMaxHeight` | `480` | #28 | `NotificationBellView.tsx:48` |
| `other.boxSize.mainViewportOffset` | `'4rem'` | #22 | `layout.tsx:52` |
| `other.radius.favoritePill` | `'1.125rem'` | #18 | `FavoriteButton.tsx:175-179` (Task 653 R2 sibling-match comment) |

Numbers stay numbers and rem strings stay rem strings, so Mantine's own conversion of each prop is unchanged.

### 3.4 Tokens this kickoff tells the executor to consume exist at runtime

`FACT` — `02_runtime-mantine-spacing-vars.txt` (Storybook `mantine-primitives-phonefield--default`,
`getComputedStyle(document.documentElement)`): `--mantine-spacing-micro 0.125rem`, `--mantine-spacing-tight 0.25rem`,
`--mantine-spacing-compact 0.375rem`, `--mantine-spacing-2xl 2rem`, `--mantine-spacing-sm 0.75rem`,
`--mantine-font-size-micro 0.625rem`, `--mantine-font-size-md 1rem`, `--mantine-scale 1`. They are injected by
`MantineProvider` at runtime; the static `.next/static/css` holds only Mantine's defaults, so a grep of built CSS is
**not** the existence proof here — the runtime read is. Precedent: `MantineListingCardPattern.tsx:254,287` already use
`var(--mantine-spacing-tight)` and `mt="compact"`.

`FACT` — server components read the theme through `import { theme } from '@/design-system/mantine/theme'` and
`theme.other!.x!` (`src/app/[locale]/page.tsx:13-21`); client components use `useMantineTheme()`.

### 3.5 Detector and tests

`FACT` — `scripts/__tests__/check-design-tokens.test.ts:784-840` tests `raw-dimension-prop` / `raw-inline-dimension`
with `scanContent`; `:824-829` is the two-armed planted/reverted form. Marker contract `check-design-tokens.mjs:746-760`:
one marker suppresses one exact rawValue on its physical line, a reason is mandatory.

### 3.6 Story and manifest status of the touched components

`FACT` — own canonical Story: `FilterChoiceGroup` (`FilterControls.stories.tsx`), `HowItWorksSteps`, `PhoneField`,
`FavoriteButton`, `NotificationBellView`. No Story: `PasswordRequirementsHint`, `AdminUserAvatar`, `AdminUsersTable`,
`ListingMobileCTA`, `ListingsShell`, `NotificationCenter`, `NotificationItem`, `CaptchaWidget`, the two app routes.
Only `FavoriteButton` is enrolled.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | §3.2 Kind A | `raw-inline-dimension` no longer matches a property name immediately preceded by `-` (so `max-width:`/`min-width:` inside a string do not fire), and still matches `maxWidth: 480`, `width: 256` and `style={{ width: 40 }}`. Tests: each Kind A string → 0 findings; each positive case → 1 finding; both written **before** the change and failing on the unmodified detector. | **P0** | AC1 | Confirmed |
| **R2** | §3.2 Kind B | Each of the 4 Kind B findings gets a same-line `design-tokens-allow: <exact rawValue> — <reason>` marker whose reason names why it is not a style (log payload / OG image asset pixel size). | **P0** | AC2 | Confirmed |
| **R3** | §3.2 Kind C, §3.3 | Each of the 38 sites is replaced exactly as its row says; the 11 roles are added to `theme.ts` with the exact values, typed in the `theme.other` augmentation, each with a comment citing its source; no other token or role is added and no site uses a different token than its row. | **P0** | AC3 | Confirmed |
| **R4** | objective | `npm run check:design-tokens:strict` exits 0 with `Total: 0`; `git diff --stat -- scripts/design-tokens-allowlist.json` is empty. | **P0** | AC4 | Confirmed |
| **R5** | value preservation | For the five storied components (§3.6), the affected computed properties (`gap`, `row-gap`, `margin-*`, `padding-*`, `line-height`, `border-radius`, `min-width`/`min-height`, `width`, `max-height`) of each changed element are byte-equal before and after, at 390×900 and 1440×900, `locale:en`, one Story state per component that renders the changed element. For the unstoried sites the proof is the static ledger of R3 plus §3.4's runtime values, and the session log says so. | **P0** | AC5 | Confirmed |
| **R6** | GR-2 | `docs/design-system.md` §23 records the Kind A boundary fix and states what `raw-inline-dimension` still cannot tell apart: a style object and any other object with a `width`/`height` key (Kind B), which stay marker-resolved. | P1 | AC6 | Confirmed |

## 5. Assumptions and open questions

- `ASSUMPTION` (reversible) — Mantine resolves `gap="compact"` to `var(--mantine-spacing-compact)` and `gap={6}` to
  `calc(0.375rem * var(--mantine-scale))`; with scale 1 both compute to 6px. R5 measures it on the storied sites.
- **Classification of unstoried components.** A value-identical substitution is a **non-visible** change under the
  execute-task story-first exemption ("a genuine non-visible … change is exempt only when the task records and the
  executor verifies that classification"). This kickoff records it; R3's ledger and R5 verify it. It does **not**
  migrate, enrol or give Stories to those components — that is not this task and no value changes.
- Stop conditions: any R5 before/after difference → `BLOCKED` naming site and values; any site whose source no longer
  matches §3.2's text at execution → `BLOCKED` with the new text; `check:design-tokens:strict` showing a finding not
  in §3.2 → `BLOCKED` (inherited set changed; do not resolve an unlisted site by analogy).
- No owner decision: the route follows `agent-contract` 16b (canonical source for every visual value) and the D824-4
  precedent (register exact-value `theme.other` roles, no raw literals, no dimension markers for style values).

## 6. Pre-read rule bundle

`scripts/check-design-tokens.mjs:1-100, 255-300, 640-800` · `scripts/__tests__/check-design-tokens.test.ts:780-960` ·
`src/design-system/mantine/theme.ts:80-175, 370-525` · `docs/design-system.md` §22-§23 ·
`docs/orchestrator-procedures.md` → "A documented token is not an implemented token" · `docs/agent-contract.md`
clauses 9, 13, 14, 16b · `docs/qa-profiles.md` (Q4) · every file in §3.2 at the cited lines · this kickoff.

## 7. Scope

- **Edited:** `scripts/check-design-tokens.mjs` (Kind A boundary only) · `scripts/__tests__/check-design-tokens.test.ts` ·
  `src/design-system/mantine/theme.ts` (+11 roles, typed) · the 16 source files §3.2 assigns Kind B or Kind C rows (`useIsMobile.ts` and `imageDelivery.ts` are Kind A only and are not edited) (plus the
  `theme`/`useMantineTheme` import where a file lacks one) · `docs/design-system.md` (§23) · `docs/backlog.md`.
- **Written:** `docs/sessions/evidence/task822/*` (not `design/`) · session log.

## 8. Out of scope

`scripts/design-tokens-allowlist.json` · any responsive-object value (Task 797) · migrating, enrolling or storying any
component · any value change · `imageDelivery.ts`/`useIsMobile.ts` logic · the Mantine theme's existing scales.

## 9. Current and required behavior

**Before.** Strict gate red with 50 on every PR; 8 of them are not styles; 38 real raw values bypass the theme.
**After.** Strict gate green; media-query strings are not read as styles; data keys are marked with reasons; every
style value is theme-sourced at an identical rendered value.

## 10. Implementation requirements

1. Order: §13.1 baseline (gate + R5 "before" captures) → R1 tests red → R1 detector fix → tests green → R2 → theme roles →
   R3 sites → R5 "after" → R6 → §13.2.
2. Client components: `useMantineTheme()`; server components (`layout.tsx`, `page.tsx`): the `theme.other!.x!` import
   form of §3.4.
3. One edit per row; read each file back through Node UTF-8 I/O.
4. R5 probe is a scratch Playwright script kept in the evidence folder, never under `scripts/`.
5. Transcripts unpiped with exit codes; final block records every changed file's hash.

## 11. Positive and negative flows

**Positive.** CI's `check:design-tokens:strict` goes green; the pages look exactly as before.

| Negative flow | Applicable | Expected |
|---|---:|---|
| `'(max-width: 1023px)'` in a string | Yes | no finding — R1 test |
| `style={{ maxWidth: 480 }}` | Yes | still a finding — R1 test |
| A Kind B marker without a reason | Yes | gate error → fix |
| A replaced value renders differently | Yes | stop — §5 |
| A new finding appears at execution | Yes | stop — §5 |
| Dark mode / locale | No | no value is theme-mode or locale dependent |

## 12. Acceptance criteria

- **AC1 [R1]** — vitest transcript before the fix fails on the new Kind A tests; after, the whole file passes. Quote
  both summaries and the test names.
- **AC2 [R2]** — `git diff` of the 2 Kind B files shows only the four markers. Quote.
- **AC3 [R3]** — `Select-String` output for all 11 role definitions with their values; `git diff` of the 14 Kind C
  files shows one hunk per §3.2 row (plus imports). Quote the role lines and a per-row ledger `row # → diff line`.
- **AC4 [R4]** — strict transcript with `Total: 0`, exit 0; empty allowlist diff. Quote.
- **AC5 [R5]** — before/after property tables for the five storied components at both widths, byte-equal. Quote the
  tables and the probe's exit code.
- **AC6 [R6]** — `docs/design-system.md` §23 entry quoted.

**GR-4 AC AUDIT — 6 criteria; each states an observable property; absolutes: AC4's `Total: 0` is the task's
objective; AC5's byte-equality is the value-preservation requirement on named properties only.**

## 13. QA profile and verification plan

**`Q4`** — a detector boundary change is a gate claim: tests fail before and pass after (AC1). Value-preserving product
edits are proven by AC5 plus the static ledger; no owner visual matrix because no value changes.

### 13.1 Baseline

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
git --no-optional-locks status --porcelain
npm.cmd run check:design-tokens:strict
npm.cmd run build-storybook
```

Expected: `win32`; strict exit 1 with exactly §3.2's 50 findings (compare line by line; any difference → §5 stop);
Storybook build exit 0. Then capture R5 "before" and run the new R1 tests red.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npx.cmd vitest run scripts/__tests__/check-design-tokens.test.ts
npm.cmd run check:design-tokens:strict
npm.cmd run typecheck
npm.cmd run lint
npx.cmd vitest run src/design-system/mantine/__tests__ src/modules/notifications src/components/shared src/modules/listings/components
npm.cmd run check:stories
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks diff --stat
```

Expected: every command exit 0. Then `git --no-optional-locks hash-object` of every path in §7's edited list, in the
same transcript.

## 14. Completion report contract

Files and hashes · R1-R6 · baseline 50-line comparison · AC1 red/green · AC2 diff · AC3 role lines and per-row ledger ·
AC4 · AC5 tables · AC6 · commands with exit codes and paths · the recorded non-visible classification for unstoried
components · assumptions · deviations · limitations. Status per execute-task. No self-approval, no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Why not allowlist the 8 media-query strings? | They are a detector defect; an allowlist would hide the next real `width:` in those files. |
| Why markers for Kind B but tokens for Kind C? | Kind B is data a regex cannot tell from a style; 16b forbids markers as a style source, not as a data annotation. |
| Why not snap to the nearest scale token (e.g. `gap={6}` → `xs`)? | That changes rendered values across 14 files and needs an owner visual matrix; this task preserves values. |
| Why no Stories for the unstoried components? | No value changes; §5 records the classification and R3/R5 verify it. Migration of those components is not this task. |
| Collision with 797? | Same four files — 797 waits for this commit. |
| GR-1 / 16d? | Not applicable: no visible change, verified by R5 and the ledger. |

## Appendix — execution contract

| Checkpoint | Producer | Comparator / failure |
|---|---|---|
| 0 baseline | strict transcript | set ≠ §3.2 → `BLOCKED` |
| 1 before | R5 probe | missing cell → no edit |
| 2 red tests | vitest | passes before fix → tests wrong |
| 3 detector | vitest | any failure → not done |
| 4 sites + roles | strict + role grep | finding remains → not done |
| 5 after | R5 probe | any difference → `BLOCKED` |
| 6 final | §13.2 | any non-zero → not `IMPLEMENTED` |
