# Task 822 — `check:design-tokens:strict` inherited violations — session log

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`

Kickoff: `tasks/Sprints/Sprint_75_kickoff_prompt_Task_822_Design_Tokens_Strict_Inherited_Violations.md`
Evidence: `docs/sessions/evidence/task822/`

## Summary

Took `check:design-tokens:strict` from 50 violations (exit 1) to 0 (exit 0) without any allowlist
addition and without changing any rendered value, by resolving three distinct kinds of finding:

- **Kind A (8, detector false positive)** — `raw-inline-dimension`'s regex read `width`/`height`
  inside media-query strings (`'(max-width: 1023px)'`) as style properties, because an unguarded
  `\b` matches between `-` and a following letter. Fixed with a `(?<!-)` negative lookbehind.
- **Kind B (4, data not style)** — a `console.log` payload and Next.js OG image metadata both
  happen to use `width`/`height` keys. Marked with reasoned `design-tokens-allow` comments.
- **Kind C (38, real raw values)** — replaced with an existing identical-value token, or one of 11
  new `theme.other` roles (each holding the exact literal it replaces), across 16 source files.

## Files Changed

| Path | Reason |
|---|---|
| `scripts/check-design-tokens.mjs` | `raw-inline-dimension` Kind A hyphen-boundary fix (R1). |
| `scripts/__tests__/check-design-tokens.test.ts` | 9 new tests: 6 Kind A negative cases, 3 boundary-preserving positive cases (R1/AC1). |
| `src/design-system/mantine/theme.ts` | +11 `theme.other` roles (`lineHeight.*` ×3, `radius.favoritePill`, `boxSize.mainViewportOffset`, `layout.*` ×6), typed in `MantineThemeOther` (R3/§3.3). |
| `src/components/admin/AdminUserAvatar.tsx` | Kind B marker (row: log payload). |
| `src/app/[locale]/listings/[slug]/page.tsx` | Kind B marker ×2 (OG image metadata). |
| 16 Kind B/C source files (§3.2) | Each site replaced exactly per its kickoff row — see per-row ledger below. |
| `src/components/shared/__tests__/filterLeafComponents.smoke.test.tsx` | Not in original scope — a downstream unit test hardcoded the OLD `gap={6}` numeric literal's `--stack-gap` CSS custom-property STRING form (`calc(0.375rem * var(--mantine-scale))`); FilterChoiceGroup row #9's `gap="compact"` substitution legitimately changes that string (identical 6px computed value, different token-reference form — exactly the kickoff's own §5 ASSUMPTION). Updated the assertion and its two explanatory comments to the new, equally-correct value; no test was weakened. |
| `docs/design-system.md` | +§23.1.c (R6): the Kind A fix and the Kind B blind spot it does not close. |
| `docs/backlog.md` | Task 822's state line. |

`scripts/design-tokens-allowlist.json` — untouched (`git diff --stat` empty, confirmed).

## Requirement / AC evidence

### R1 / AC1 — Kind A detector fix, red then green

`15_vitest-red.txt` (unmodified detector): 6 new Kind A tests FAIL (the "does NOT flag" cases), 123
pass (includes the 3 "still flags" positive-case tests, which already passed — the boundary was
never too narrow, only too wide). `16_vitest-green.txt` (after the `(?<!-)` fix): 129/129 pass.

### R2 / AC2 — Kind B markers

`git diff` of `AdminUserAvatar.tsx` and `page.tsx` (slug route) shows exactly 4 markers, each with a
reason naming why the key is data (log payload / OG image pixel size), not style.
`check:tailwind-runtime-tokens`-style stale-marker/missing-reason counts are folded into the strict
transcript (`26_check-design-tokens-strict-final.txt`): `0 stale-marker(s), 0 missing-reason
error(s)`.

### R3 / AC3 — 11 roles + 38 sites, per-row ledger

All 11 roles added to `theme.ts` (type + runtime object), each value the exact literal it replaces
(confirmed by direct comparison against §3.2/§3.3's table during each edit). Per-row ledger:

| # | Site | Diff |
|---|---|---|
| 1 | `PasswordRequirementsHint.tsx:24` | `gap={6}` → `gap="compact"` |
| 2 | `PasswordRequirementsHint.tsx:28` | `lh="1rem"` → `lh={theme.other.lineHeight.passwordHintRow}` |
| 3-4 | `PasswordRequirementsHint.tsx:32,34` | `marginTop: 2` → `marginTop: 'var(--mantine-spacing-micro)'` |
| 5,6,8 | `PasswordRequirementsHint.tsx:52,52,58` | `gap={4}`/`mt={4}`/`gap={4}` → `"tight"` |
| 7 | `PasswordRequirementsHint.tsx:56` | `lh="19.5px"` → `lh={theme.other.lineHeight.authNoteParagraph}` |
| 9 | `FilterChoiceGroup.tsx:106` | `gap={6}` → `gap="compact"` |
| 10 | `HowItWorksSteps.tsx:29` | `mb={40}` → `mb={theme.other.layout.headingBlockGap}` |
| 11 | `HowItWorksSteps.tsx:32` | `spacing={32}` → `spacing="2xl"` |
| 12 | `PhoneField.tsx:145` | `gap={6}` → `gap="compact"` |
| 13 | `PhoneField.tsx:165` | `dropdownMinWidth={240}` → `dropdownMinWidth={theme.other.layout.phoneCountryDropdownMinWidth}` |
| 14-17 | `AdminUsersTable.tsx:146,147,162,163` | `mih`/`miw="2.75rem"` → `{theme.other.touchTarget}` |
| 18 | `FavoriteButton.tsx:179` | `radius="1.125rem"` → `radius={theme.other.radius.favoritePill}` |
| 19 | `ListingMobileCTA.tsx:71` | raw `0.75rem` → `var(--mantine-spacing-sm)` inside the `calc()` |
| 20 | `ListingsShell.tsx:15` | `pt={4}` → `pt="tight"` |
| 21 | `ListingsShell.tsx:16` | `height={32}` → `height={theme.other.layout.listingsFiltersSkeletonRowHeight}` (module-scope constant, `dynamic()` loading callback) |
| 22 | `layout.tsx:52` | `mih="calc(100vh - 4rem)"` → `` mih={`calc(100vh - ${theme.other!.boxSize!.mainViewportOffset})`} `` |
| 23 | `page.tsx:38` | `mb={40}` → `mb={layout.headingBlockGap}` (module-scope `theme.other!.layout!`, matching the existing `iconSize`/`boxSize` pattern) |
| 24 | `NotificationBellView.tsx:36` | `offset={4}` → `offset={theme.other.layout.notificationPopoverOffset}` |
| 25-26 | `NotificationBellView.tsx:39` | `mih`/`miw="2.75rem"` → `{theme.other.touchTarget}` |
| 27 | `NotificationBellView.tsx:46` | `width={320}` → `width={theme.other.layout.notificationPanelWidth}` |
| 28 | `NotificationBellView.tsx:48` | `maxHeight: 480` → `maxHeight: theme.other.layout.notificationPanelMaxHeight` |
| 29 | `NotificationCenter.tsx:80` | `py={32}` → `py="2xl"` |
| 30 | `NotificationItem.tsx:196` | `fz="1rem"` → `fz="md"` |
| 31 | `NotificationItem.tsx:197` | `lh="1.5rem"` → `lh={theme.other.lineHeight.notificationGlyph}` |
| 32 | `NotificationItem.tsx:198` | `marginTop: '0.125rem'` (+ stale marker) → `marginTop: 'var(--mantine-spacing-micro)'`; marker deleted |
| 33 | `NotificationItem.tsx:222` | `mt={2}` → `mt="micro"` |
| 34 | `NotificationItem.tsx:232` | `fz="0.625rem"` → `fz="micro"` |
| 35 | `NotificationItem.tsx:235` | `mt="0.25rem"` → `mt="tight"` |
| 36 | `NotificationItem.tsx:246` | `mt={6}` → `mt="compact"` |
| 37 | `CaptchaWidget.tsx:35` | `py={4}` → `py="tight"` |
| 38 | `CaptchaWidget.tsx:35` | `lh="19.5px"` → `lh={mantineTheme.other.lineHeight.authNoteParagraph}` (new local `useMantineTheme()` — the outer `CaptchaWidget` already uses the name `theme` for its own `'light'|'dark'|'auto'` prop, so `CaptchaDevFallback` gets its own `mantineTheme` binding to avoid shadowing) |

### R4 / AC4 — strict gate green

`26_check-design-tokens-strict-final.txt`: `Total: 0 raw style-value violation(s) | 0 stale-marker(s)
| 0 missing-reason error(s)`, exit 0. `36_diff-stat-allowlist.txt`: empty.

### R5 / AC5 — value preservation, 5 storied components, real browser, both widths

Probe: `docs/sessions/evidence/task822/19_r5_probe.mjs` (evidence-only). Since capturing "before" was
missed at the correct point in the process (should have preceded the R3 edits per kickoff §10.1),
recovered it WITHOUT git: the 5 storied components' specific changed lines were reverted to their
raw literals with ordinary file edits (never `git stash`/`checkout` — ai-behavior forbids Sonnet from
mutating git), Storybook rebuilt, probed, then the token-based fix was re-applied byte-for-byte
(confirmed via `git diff` showing the identical restored hunks) and Storybook rebuilt again for the
official "after" capture.

`21_r5_before.json` / `23_r5_after.json` — byte-equal (`diff` exit 0), at both 390×900 and 1440×900,
`locale:en`:

- FilterChoiceGroup vertical branch (`data-testid="filter-chip-row"`, the Stack instance): `gap`
  6px both.
- HowItWorksSteps: `<h2>` `marginBottom` 40px both; `SimpleGrid` `columnGap`/`rowGap` 32px both.
- PhoneField: outer `<Stack>` `gap` 6px both; country-trigger dropdown `minWidth` 240px both at
  1440px (at 390px the combobox switches to `isMobile` bottom-sheet mode — `!isMobile &&
  <Combobox.Dropdown>` — so no `Combobox.Dropdown` exists to measure at that width, in EITHER
  before or after capture; a pre-existing, `dropdownMinWidth`-independent responsive behavior, not
  a new blind spot this task introduces).
- FavoriteButton pill shape: `borderRadius` 18px both, both widths.
- NotificationBellView: trigger `minHeight`/`minWidth` 44px both, both widths; popover `width`
  320px / inner `maxHeight` 480px both at 1440px (at 390px `MantinePopover` switches to its own
  bottom-sheet pattern — same pre-existing, unrelated responsive behavior as PhoneField's dropdown).

For the remaining Kind C sites (unstoried, §3.6), the static per-row ledger above plus §3.4's
runtime-verified token values (`02_runtime-mantine-spacing-vars.txt`, part of the kickoff's own
design-time evidence) is the proof: each substituted `theme.other.X` constant is defined to equal
the exact literal it replaces (verified value-for-value at edit time), and numeric/string-literal
JS values passed to a component are rendered identically regardless of whether they originate from
a bare literal or an equal-valued named constant — there is no computation step that could diverge.
The only substitutions with genuine rendering-computation risk are the ones routed through Mantine's
own named-token CSS-variable resolution (`gap="compact"`, `spacing="2xl"`, `fz="md"`, `mt="tight"`,
etc., per kickoff §5's own ASSUMPTION) — real-browser R5 measurement above directly covers two of
those forms (`"compact"`, `"2xl"`) end-to-end.

### R6 / AC6 — documentation

`docs/design-system.md` §23.1.c added, quoted in full in the diff (`35_diff-stat.txt` line
`docs/design-system.md | 25 +++++++++++`). States the fix and the Kind B blind spot it does not
close (a data object cannot be told apart from a style object by shape alone — resolved by marker,
never by detector change or path-level allowlist).

## Validation evidence (§13.2)

| Command | Exit | Transcript |
|---|---|---|
| `node -p process.platform` | — | `10_`/`24_platform-final.txt` |
| `git status --porcelain` (baseline) | — | `12_status-before.txt` |
| `check:design-tokens:strict` (baseline) | 1 (50 findings, matches §3.2 exactly) | `13_check-design-tokens-strict-before.txt` |
| `build-storybook` (baseline) | 0 | `14_build-storybook-before.txt` |
| `vitest run check-design-tokens.test.ts` (red, pre-fix) | 1 (6 new failures, as required) | `15_vitest-red.txt` |
| `vitest run check-design-tokens.test.ts` (green, post-fix) | 0 (129/129) | `16_vitest-green.txt` |
| `vitest run check-design-tokens.test.ts` (final re-confirm) | 0 (129/129) | `25_vitest-detector-final.txt` |
| `check:design-tokens:strict` (final) | 0 (`Total: 0`) | `26_check-design-tokens-strict-final.txt` |
| `npm run typecheck` | 0 | `27_typecheck.txt` |
| `npm run lint` | 0 (75 warnings — 73 pre-existing + 1 evidence-only probe `no-undef` + 1 pre-existing shift, 0 errors) | `28_lint.txt` |
| `vitest run` (4 affected dirs) | 1 — see note below | `29_vitest-affected.txt` |
| `check:stories` | 0 (153 files, 0 violations) | `30_check-stories.txt` |
| `build-storybook` (R5 before/after) | 0 / 0 | `20_`/`22_build-storybook-r5-*.txt` |
| `npm run build` | 0 | `31_build.txt` |
| `check:file-integrity` | 0 (real; self-referential FAIL on the in-flight transcript is a capture artifact, not corruption — direct byte scan confirms) | `32_`/`34_file-integrity-final.txt` |
| `check:mojibake` | 0 (0 artifacts, 5119 files) | `33_mojibake.txt` |
| `git diff --stat` (final) | 0 | `35_diff-stat.txt` (21 files, 192 insertions, 46 deletions) |
| `git diff --stat` allowlist | 0 (empty) | `36_diff-stat-allowlist.txt` |
| `git hash-object` (final) | 0 | `37_hash-object.txt` |

**Note on `29_vitest-affected.txt` (exit 1):** 3 failed test files / 7 failed tests remain,
**pre-existing and unrelated** — confirmed via `git status --porcelain` on their source files
returning nothing (none touched this session):

- `theme.d69-18.test.tsx` — a static-source-text assertion expects `FooterView.tsx` to literally
  contain `theme.other.layout.footerGridGap`, but the real source reads
  `theme.other!.layout!.footerGridGap` (non-null assertions) — a pre-existing test/source drift,
  `FooterView.tsx` untouched.
- `ListingCard.smoke.test.tsx` (×2) — expects `.grayscale.opacity-60` on an archived-listing card;
  `ListingCard.tsx` untouched.
- `ListingGallery.portal.smoke.test.tsx` (×4) — `ReferenceError: ResizeObserver is not defined` in
  jsdom (`src/hooks/useSwipeTrackSync.ts:101`, a missing jsdom polyfill), cascading into 4 lightbox
  interaction failures; neither file touched this session.

Originally 4 failed files / 8 failed tests; the 1 file / 1 test this session's own change caused
(`filterLeafComponents.smoke.test.tsx`) was fixed (see Files Changed). This gate does not exit 0 as
the kickoff's §13.2 table expects — flagged for Opus, not silently claimed clean. All of Task 822's
own requirements (R1-R6) are independently verified through more targeted gates
(`check-design-tokens.mjs`'s own suite, `check:design-tokens:strict`, the real-browser R5 probe), so
this is reported as a known pre-existing gap rather than a blocker to this task's own scope.

## Deviations

- R5's "before" capture was performed AFTER the R3 site edits (recovered via temporary, git-free
  file reverts) rather than before them, per §10.1's stated order. No evidence integrity issue
  resulted (the recovered "before" state is provably identical to the true pre-822 source — the
  temporary revert used the exact literals §3.2 documents, and the final restore was diffed against
  the pre-revert diff to confirm byte-identical restoration), but the sequencing itself deviated
  from the kickoff's instruction.
- `filterLeafComponents.smoke.test.tsx` updated outside the originally scoped file list (see Files
  Changed) — a necessary, minimal consequence of R3 site #9, not a scope expansion.

## Limitations

- `29_vitest-affected.txt`'s 3 pre-existing failures (above) are unresolved; they predate this
  session and are outside R1-R6's scope, but the kickoff's own §13.2 table expected this command to
  exit 0.

## Opus handoff

- Please independently re-run `npm run check:design-tokens:strict` and the detector's vitest suite.
- Please confirm the `filterLeafComponents.smoke.test.tsx` fix reflects a genuine value-preserving
  representation change, not a weakened assertion (the `--stack-gap` string differs; the rendered
  pixel value does not — R5's real-browser probe is the authority, not the jsdom string).
- Please decide whether the 3 pre-existing `29_vitest-affected.txt` failures need their own filed
  task (they look unrelated to any Sprint 75 gate work touched so far).
