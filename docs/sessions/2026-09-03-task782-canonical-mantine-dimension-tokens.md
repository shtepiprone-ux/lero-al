# Session Archive: Task 782 — Canonical Mantine Dimension Tokens — 2026-09-03

**Status:** `PARTIALLY IMPLEMENTED` — see §14 for the exact gap. Sonnet executor, `.claude/skills/execute-task/SKILL.md`.
**Platform receipt:** `node -p process.platform` → `win32` (first command, this session). Node `v22.22.3`.
**Precondition verified:** Task 781's diff was already committed at session start (`git log` showed `8b46e5646`/`ac9d01a99` at HEAD; `git status --porcelain` clean). Baseline B taken before any edit.

---

## 1. Files Changed

| File | Rationale |
|---|---|
| `src/design-system/mantine/theme.ts` | R1/R2 — `MantineThemeOther` augmentation (`iconSize`/`boxSize` typed scales), `other.iconSize`/`other.boxSize` values, `ThemeIcon` component `vars` block for the 4 project sizes above/outside Mantine's native ladder |
| `src/stories/mantine/primitives/DimensionTokens.stories.tsx` (new) | AC1/AC2 — Phase 1 standalone canonical proof, renders every scale key at its rendered size |
| `messages/{en,sq,uk,it}.json` | 3 new `storybook.mantine.dimension_tokens_*` keys (DimensionTokens story headings) — `check:i18n` parity maintained |
| `scripts/check-design-tokens.mjs` | Phase 3 — new `raw-dimension-prop` detection category (`size\|miw\|maw\|mih\|mah\|w\|h={N}`, `={0}` excluded) |
| `scripts/__tests__/check-design-tokens.test.ts` | 8 new unit tests for `raw-dimension-prop` (positive/negative/±0/string-token/comment/two-armed-plant cases) |
| `src/components/ui/PasswordRequirementsHint.tsx` | Phase 2 sweep — 2× `size={14}` → `theme.other.iconSize.compact` |
| `src/components/shared/AgentCtaButton.tsx` | sweep — `size={16}` → `.standard` |
| `src/components/shared/FiltersPanel.tsx` | sweep — `size={16}` → `.standard` |
| `src/components/shared/HeroSearchFallback.tsx` | sweep — `maw={768}` → `theme.other.boxSize.content` |
| `src/components/shared/HeroSearchView.tsx` | sweep — 2× `size={16}` → `.standard` |
| `src/components/shared/HowItWorksSteps.tsx` | sweep — `maw={768}`→`.content`; `ThemeIcon size={56}`→`"spotlight"`; `Icon size={24}`→`.decorative`; `ThemeIcon size={24}`→`"decorative"` |
| `src/components/shared/LocaleSwitcher.tsx` | sweep — 2× `size={12}` → `.badge` |
| `src/components/shared/LocationCombobox.tsx` | sweep — `size={16}` → `.standard` |
| `src/components/shared/YearCombobox.tsx` | sweep — `size={16}` → `.standard` |
| `src/components/layout/HeaderActions.tsx` | sweep — 2× `size={20}` → `.roomy` |
| `src/components/layout/HeaderView.tsx` | sweep — `size={20}` → `.roomy` |
| `src/components/layout/MobileNavDrawer.tsx` | sweep — `Avatar size={40}`→`.banner`; `LogOut size={16}`→`.standard` |
| `src/components/layout/UserMenu.tsx` | sweep — 5× `size={16}`→`.standard`; `Avatar size={28}`→`.feature`; `ChevronDown size={12}`→`.badge`; `maw={120}`→`boxSize.truncateLabel` |
| `src/components/admin/AdminUsersTable.tsx` | sweep — 14 sites, `size={14/40/10/12}` → `.compact/.banner/.micro/.badge` (bulk value-mapped) |
| `src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx` | fix — the file's `vi.mock('@mantine/core', …)` lacked `useMantineTheme`, breaking all 21 tests after the sweep; added a literal `other.iconSize` stub |
| `src/modules/listings/components/ActiveFilterChips.tsx` | sweep — `size={12}` → `.badge` |
| `src/modules/listings/components/FavoriteButton.tsx` | sweep — `size={16}`→`.standard`; `size={32}`→`.prominent` |
| `src/modules/listings/components/ListingsFilterBar.tsx` | sweep — 2× `size={14}` → `.compact` |
| `src/modules/listings/components/ListingsFilters.tsx` | sweep — `AccordionSection` gained its own `useMantineTheme()`; `size={14/16/20}`→`.compact/.standard/.roomy` |
| `src/modules/listings/components/ListingsShellView.tsx` | sweep + **R5/D69-8**: `miw={{sm:192}}` removed from "Показати ще"; `ThemeIcon size={64}`→`"colossal"`; `Loader size={16}`→`.standard`; **F9**: empty-state `<Text fw={600} size="lg">` → `<Text component="h3" …>` (heading semantics restored); **F3**: inline action-row `Flex`/`Box` replaced by `<ListingsActionRow>` |
| `src/modules/listings/components/ListingsActionRow.tsx` (new) | **F3** — extracted the action-row wrapper (previously inline in `ListingsShellView.tsx`) into its own production component so `ListingsShellView.tsx` and its canonical story consume the same source, not a duplicated markup |
| `src/modules/listings/components/ListingsSortBar.tsx` | sweep — 3× `size={16}` → `.standard`; **F5**: count `<Text>` gained `data-testid="listings-count-text"` |
| `src/modules/listings/components/SaveSearchButton.tsx` | sweep — `size={16/14}`→`.standard/.compact`; **F10**: trigger label no longer hidden below 640px (was `visibleFrom="sm"` inside a `w="100%"` button — icon-only full-width control); unused `Box` import removed |
| `src/modules/listings/components/SaveToCollectionButton.tsx` | sweep — `size={28}` → `.feature` |
| `src/app/[locale]/page.tsx` | sweep (Server Component, static `theme` import + `!` — see file comment) — `maw={768/576/672}`→`boxSize.content/.prose/.ctaSection`; `size={48}`→`iconSize.hero` |
| `src/modules/locations/components/PopularLocationsView.tsx` | sweep (Server Component) — `h={112}`→`boxSize.thumbnail`; `size={14}`→`iconSize.compact` |
| `src/modules/notifications/components/NotificationBellView.tsx` | sweep — `Indicator size={16}`→`.standard`; `Bell size={20}`→`.roomy` |
| `src/modules/notifications/components/NotificationCenter.tsx` | sweep — `size={14}` → `.compact` |
| `src/modules/notifications/components/NotificationItem.tsx` | sweep — `h={8}`/`w={8}` → `boxSize.statusDot` |
| `src/design-system/mantine/patterns/MantineCopyIdButton.tsx` | sweep — 2× `size={10}` → `.micro` |
| `src/design-system/mantine/patterns/MantineEmptyLoadingErrorState.tsx` | sweep — `maw={360}`→`boxSize.emptyState`; `ThemeIcon size={48}`→`"hero"` |
| `src/design-system/mantine/patterns/MantineListingContactPattern.tsx` | sweep — 9 sites incl. `CheckIconBadge`'s own `useMantineTheme()` (separate local function, needed its own hook call) |
| `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` | sweep — 3× `size={16}` → `.standard` |
| `src/design-system/mantine/patterns/MantineCombobox.tsx` | sweep — `Combobox.Options mah={220}` → `boxSize.dropdownPanel` (file was already `design-tokens-allowlist.json`-exempt for an unrelated reason, masking this from the detector; converted anyway for AC3) |
| `src/design-system/mantine/patterns/RangeDatePicker.tsx` | sweep — `w={280}`→`.compactTrigger`; 4× `size={16/14}`→`.standard/.compact` (file also allowlist-exempt for unrelated reasons) |
| `src/modules/auth/components/AuthSheet.tsx` | sweep — 3 separate local view functions (`ForgotPasswordView`/`CompanyField`/`RegisterView`) each gained their own `useMantineTheme()`; `size={48/48/16}`→`.hero/.hero/.standard` (file also allowlist-exempt for an unrelated reason) |
| `scripts/task772-listings-overflow-probe.mjs` | **F5**: retargeted the dead `span.font-semibold` locator to `[data-testid="listings-count-text"]`; **F12**: added a real fail-closed sort/save-search rect overlap + 44px-floor assertion (previously recorded, never asserted) |
| `docs/critical-flow-registry.md` | **F4** — `FilterMultiToggle` → `FilterChoiceGroup` (the component was deleted in Task 781; this row described it as still live) |
| `docs/component-catalog.md` | **F4** — removed the stale `FilterMultiToggle` catalog row |
| `docs/component-coverage-matrix.md` | **F4** — removed the stale `FilterMultiToggle` coverage row |
| `docs/storybook-governance.md` | **F4** — 3 historical mentions reworded to avoid the literal deleted name while staying historically accurate |
| `scripts/story-coverage-exempt.json` | **F4** — removed the stale `FilterMultiToggle.tsx` exemption entry |
| `docs/sessions/2026-09-03-task781-listings-mantine-surface-completion.md` | **F11** — dated corrections for the "25 tests" (actual 12) and "every ad-hoc style object replaced" (one residual at `ListingsSortBar.tsx:65`) claims |
| `tasks/Sprints/Sprint_69_Listings_Finishes_The_Mantine_Migration.md` | **F8/AC10** — exit criterion 3 now records the owner-directed `market_type` no-deselect exception |
| `src/stories/patterns/mantine/ListingsShellView.stories.tsx` | **F3** — `saveSearchSlot` now renders the real `SaveSearchButton` (was `null`) |
| `src/stories/patterns/mantine/ListingsActionRow.stories.tsx` | **F3** — rewritten to import the real `ListingsActionRow` production component + real `SaveSearchButton`, no longer hand-duplicates the `Flex`/`Box` wrapper |
| `src/stories/patterns/mantine/SaveSearchButton.stories.tsx` (new) | **F3/AC6** — standalone canonical story: `Default`, `OpenModal` (play-driven), `Pending` (play-driven) |

---

## 2. Requirement ledger (R1–R15)

| ID | Status | Evidence |
|---|---|---|
| R1 | DONE | `theme.other.iconSize`/`.boxSize` typed via `MantineThemeOther` augmentation; nested-key typo two-armed proof: `06-ac1-planted-nested-key.log` (exit 2) / `07-ac1-reverted-nested-key.log` (exit 0). **Caveat** — Mantine's OWN base `MantineThemeOther` interface has `[key: string]: any` (`node_modules/@mantine/core/lib/core/MantineProvider/theme.types.d.ts:151-153`); a **top-level** `theme.other.<wrongKey>` typo is NOT caught (verified, not assumed) — only nested `iconSize.<wrongKey>`/`boxSize.<wrongKey>` typos are, which is the scale the task actually cares about. Documented, not silently claimed as fully closed. |
| R2 | DONE | `ThemeIcon.vars` registers `--ti-size-decorative/hero/spotlight/colossal`; mechanism verified by reading `resolve-vars.cjs`/`merge-vars.cjs` (not assumed — closes A1). 4 real call sites converted to string tokens (`HowItWorksSteps.tsx`×2, `MantineEmptyLoadingErrorState.tsx`, `ListingsShellView.tsx`). |
| R3 | DONE (detector scope) / **PARTIAL (literal grep)** | `check:design-tokens` 86→0 (`31-phase2-detector-after-sweep.log`). Literal `grep -rnoE 'size=\{[0-9]+\}\|…' src` still shows 47+11 matches — **all inside `.stories.tsx` fixture files** (verified — see §5). Story-file literals are, by design, out of the detector's structural exclusion scope (matches `.test.tsx`/`__tests__` treatment) and out of `A3`'s spirit; not converted. 3 remaining non-story matches are inside `//`/`{/* */}` comments (verified line-by-line), not live code. |
| R4 | DONE | New `raw-dimension-prop` category; 8 unit tests; repo-level two-armed plant (post-sweep, genuinely clean revert): `32-ac4-final-plant-planted.log` (exit 1, names `ListingsFilters.tsx`) / `33-ac4-final-plant-reverted.log` (exit 0). `={0}` non-flag case verified against 9 real `={0}` sites in `src` (none flagged). |
| R5 | DONE | `miw={{sm:192}}` removed from `ListingsShellView.tsx`'s "Показати ще" button — confirmed absent via `grep`. |
| R6 | DONE | See F3 closure in §3 below. |
| R7 | DONE | `FilterMultiToggle` — 0 occurrences in all 5 named files (verified via grep); `governance:components` exit 0. |
| R8 | **BLOCKED (native evidence)** | Locator retargeted (`[data-testid="listings-count-text"]`) and the target `data-testid` added to `ListingsSortBar.tsx`. The probe itself requires a running route server + auth storage state, unavailable in this sandbox — cannot produce a fresh `renderedCountText` run. Owner-native command below. |
| R9 | **PARTIAL** | Δ4/Δ5/Δ6 unchanged since Task 781/this task (see §6). Δ7 (rounding): 0 by construction — every measured value became an exact scale key, no value was rounded to a nearby rung. Rendered before/after captures for all Δs require the full visual matrix — see §7 (P capture incomplete in this sandbox). |
| R10 | DONE | Sprint 69 file's exit criterion 3 now records the owner-directed exception; RTL coverage identified at `filterLeafComponents.smoke.test.tsx:185,203` (pre-existing, Task 781R — proven to cover the exact `allowDeselect`/no-`allowDeselect` mechanism `ListingsFilters.tsx` wires to `market_type`/`property_type`, confirmed by reading the consumer's prop wiring, not re-derived). |
| R11 | DONE | `ListingsShellView.tsx` empty-state title: `<Text fw={600} size="lg">` → `<Text component="h3" fw={600} size="lg">`. |
| R12 | DONE | `SaveSearchButton.tsx`'s trigger no longer hides its label below 640px; stays `w="100%"` with the label always visible — documented in the file (state: label shown, not un-full-widthed). |
| R13 | DONE (log) / **BLOCKED (probe re-run)** | Session-log figures corrected in place (§11 above). Probe assertion code added (F12); cannot execute without a live route server (same R8 blocker). |
| R14 | **PARTIAL — see §7** | `npm run build` exit 0, native win32 (`45-build-i1.log`). Baseline B crashed (exit 127, environmental, pre-existing pattern); final P completed (`54-final-P-retry.log`, exit 1: 1458/1636 PASS, 145 FAIL, 33 AMBIGUOUS). The 145 FAILs are 100% one pre-existing check (`text button not full-width at <640`) on 2 buttons this task never edited the layout of; the 33 AMBIGUOUS are the project's own standing owner-triage category. No new failure type traced to this task's diff. A literal `P \ B = ∅` arithmetic still requires an owner-native re-run of B against pre-782 `HEAD` — see §7. |
| R15 | DONE | `git diff` reviewed file-by-file (§1 table); no URL-building expression, server action, hook, or control changed outside the named F3/F5/F8/F9/F10/F12 findings. `ListingsShellView.tsx` is touched (R5/F3/F9 — all explicitly authorized by name), never claimed untouched. |

---

## 3. F3 closure detail

**Before:** `ListingsShellView.stories.tsx` passed `saveSearchSlot={null}`; `ListingsActionRow.stories.tsx` hand-duplicated the production `Flex`/`Box` wrapper and imported `SaveSearchButton` directly rather than through the slot.

**After:**
1. Extracted `src/modules/listings/components/ListingsActionRow.tsx` (new production component) from `ListingsShellView.tsx`'s previously-inline markup — byte-identical `Flex`/`Box` props.
2. `ListingsShellView.tsx` now renders `<ListingsActionRow … saveSearchSlot={saveSearchSlot} />` instead of the inline markup.
3. `ListingsShellView.stories.tsx` passes `saveSearchSlot={<SaveSearchButton />}` (was `null`) — the shell story now genuinely exercises the real production action row.
4. `ListingsActionRow.stories.tsx` imports and renders the real `ListingsActionRow` + real `SaveSearchButton` — no more duplicated wrapper markup.
5. New standalone `SaveSearchButton.stories.tsx`: `Default` (closed), `OpenModal` (Storybook `play` function clicks the real trigger, asserts the name `TextInput` is present), `Pending` (play function clicks Save and returns without awaiting — `isPending` flips synchronously when `startTransition` starts, so the `Loader` is present at capture time regardless of how the real, unmocked server action ultimately resolves in this static environment).

This also closes a gap Task 781's OWN session log flagged as residual (R15/Δ2 there): "the `MantineModal`'s opened state … has no dedicated open-modal story cell."

`check:stories` 140/140 clean, `check:story-coverage` 27/27 clean, `tsc --noEmit` 0 errors (checkpoints `48`/`49`).

**Not yet rendered-proven in this sandbox:** the `OpenModal`/`Pending` play functions have not been exercised through an actual `screenshots:assert` pass in this session (the P capture that would prove them did not finish — §7). Storybook itself built clean with these stories present (`52-f3-build-storybook.log`, exit 0), which proves they at least mount without a build-time error, but not that the play functions correctly reach the open/pending DOM state under Playwright.

---

## 4. Phase 1 — the canonical scale

`theme.other.iconSize` (14 keys, plain numbers, role-named — provenance for `badge`/`standard`/`decorative` cited from `globals.css:294-296`'s own `--icon-sm/md/lg` role comments): `micro`10 · `badge`12 · `compact`14 · `standard`16 · `comfortable`18 · `roomy`20 · `decorative`24 · `feature`28 · `prominent`32 · `banner`40 · `touch`44 · `hero`48 · `spotlight`56 · `colossal`64.

`theme.other.boxSize` (9 keys, rem strings, role-named — one-off container roles, not a repeating ladder): `statusDot`8px · `thumbnail`112px · `truncateLabel`120px · `dropdownPanel`220px · `compactTrigger`280px · `emptyState`360px · `prose`576px · `ctaSection`672px · `content`768px.

**I0 freshness note:** the kickoff's own §3.2 distribution (16×41·14×27·20×15·18×6·12×6·48×4·10×4·24×1·40×1·56×1·64×1, summing to 107) did **not** match this session's fresh measurement (summing to 129, with additional values 28/32/44 the kickoff's table omitted). Per the kickoff's own instruction ("never quote a number from this document as a measurement"), the fresh 14-value set above is what was actually built, not the stale 7-value set the kickoff's Phase 1 prose named.

`ThemeIcon` gains 4 project keys (`decorative`/`hero`/`spotlight`/`colossal`) via `theme.components.ThemeIcon.vars`, verified against Mantine's own merge code (`resolve-vars.cjs` → `mergeVars.cjs`): the built-in `varsResolver`'s `root` object only ever sets `--ti-size` itself, never `--ti-size-{customKey}`, so there is no key collision — both survive in the same merged inline `style`. This is a **verified mechanism**, not an assumption (closes kickoff A1).

Standalone proof: `src/stories/mantine/primitives/DimensionTokens.stories.tsx` renders every `iconSize`/`boxSize` key and the 4 `ThemeIcon` project sizes, each with its name and pixel value, `data-testid`-tagged per row for a future computed-style probe. `check:stories`/`check:story-coverage`/`tsc` all clean with the story present; `build-storybook` succeeded with it included (`14-phase1-build-storybook.log`).

**AC2's "computed width/height from a real render" requirement is only partially closed:** the story exists and typechecks, and the CSS-variable merge mechanism is source-verified (not assumed), but no Playwright-driven `getBoundingClientRect()`/`getComputedStyle()` probe was run against the built story in this sandbox to capture literal pixel proof — the `screenshots:assert` run that would provide this did not complete (§7).

---

## 5. Phase 2 — the sweep, full census

Fresh measurement this session (I0), before any edit:

| Measurement | Count | Command |
|---|---:|---|
| Raw `size={N}` in `src/**/*.tsx` | 129 | `grep -rnoE 'size=\{[0-9]+\}' src --include=*.tsx \| wc -l` |
| Files containing them | 42 | |
| …stories/tests subset | 11 | |
| Raw `miw\|maw\|mih\|mah\|w\|h={N}` (excl. `={0}`) | 20 | (kickoff's stale "30" included 10 `={0}` sites, correctly out of scope) |

After the sweep (this session's final measurement):

| Measurement | Count |
|---|---:|
| `check:design-tokens` findings (all categories) | 0 (`31-phase2-detector-after-sweep.log`) |
| Raw `size={N}` outside `.stories.tsx` and comments | 0 |
| Raw dimension-prop outside `.stories.tsx` and comments | 0 |
| Raw `size={N}` inside `.stories.tsx` (pre-existing + this task's own new `DimensionTokens`/story fixtures) | 47 |
| Raw dimension-prop inside `.stories.tsx` | 11 |

**Interpretation decision (recorded, not silent):** story-fixture literals were left unconverted. `scripts/check-design-tokens.mjs`'s own `SKIP_SUFFIXES` structurally excludes `.stories.tsx` from every category, matching the project's own documented Storybook convention (`docs/ai-behavior.md` → "DO NOT use `Math.random()`/`new Date()` in fixture data — use fixed values"). AC3's literal grep wording does not carve out this exception explicitly, so this is flagged here for Opus rather than asserted as unquestionably correct.

**2 files converted despite being masked from the detector:** `MantineCombobox.tsx` and `RangeDatePicker.tsx` (and `AuthSheet.tsx`) carry pre-existing, unrelated `scripts/design-tokens-allowlist.json` path-level entries (Google-brand SVG colors, z-index/pill-radius) which, as a structural side effect, exempt the ENTIRE file from every detector category — including this task's new one. Their raw dimension props were converted anyway (for genuine AC3 grep compliance), even though the detector itself will never flag a regression there. **Recorded finding, not fixed:** this is a pre-existing allowlist-scoping gap, out of this task's scope to resolve (the allowlist mechanism itself is untouched).

**Regression found and fixed during the sweep:** `AdminUsersTable.smoke.test.tsx`'s `vi.mock('@mantine/core', …)` did not export `useMantineTheme`, so all 21 of that file's tests failed after `AdminUsersTable.tsx` started calling the hook. Fixed by adding a literal `other.iconSize` stub to the mock (not an import, to avoid ESM/hoisting risk in a `vi.mock` factory). Verified 21/21 green after the fix (`42-adminuserstable-fix-verify.log`).

**5 pre-existing, unrelated test failures — confirmed NOT caused by this task:**
`css-var-resolvability.test.ts` (296 vs 257 count), `docs/sessions/evidence/task763/appimage-config-class-assertions.test.ts` (explicitly named `BLOCKED` in its own test title), `ListingCard.smoke.test.tsx` ×2 (`.grayscale.opacity-60` selector), `listingsFilterBar.smoke.test.tsx` ×1 (`mantine-visible-from-md` vs `-sm`). Verified via `git status --porcelain` on the implicated source files (`globals.css`, `ListingCard.tsx`, `MantineListingCardPattern.tsx`, `ListingsShellView.tsx`'s `visibleFrom` prop) — **zero diff from HEAD** on the exact lines these tests assert against. `git stash` was not available (Sonnet single-writer git restriction) to double-confirm via a byte-identical re-run; the git-status-on-implicated-lines check is the evidence actually available in this session.

---

## 6. Phase 3 — the detector

New `raw-dimension-prop` category in `scripts/check-design-tokens.mjs`: `/\b(?:size|miw|maw|mih|mah|w|h)=\{\d+\}/g`, filtered to exclude `={0}`. 8 new unit tests (`scripts/__tests__/check-design-tokens.test.ts`) — positive match, all 6 prop names, `={0}` exclusion, string-token non-match, token-reference-expression non-match, JSX-comment non-match, two-armed plant, `gap` explicitly NOT in the detected set. 106/106 total detector unit tests green (`19-phase3-unit-tests-v2.log`).

**Repo-level two-armed plant (post-sweep, genuine):**
- Planted `w={16}` at `ListingsFilters.tsx:150` → `check:design-tokens` exit 1, names exactly `ListingsFilters.tsx (1)` / `:150 "w={16}"`, zero other findings (`32-ac4-final-plant-planted.log`).
- Reverted → exit 0, `git diff --stat` on the file confirms the plant is fully removed with no residue (`33-ac4-final-plant-reverted.log`).

`={0}` false-positive check: 9 real `miw={0}` sites exist in `src` (`ListingsShellView.tsx`×2, `ListingsSortBar.tsx`×5, others); none appear in the detector's findings (verified by direct grep intersection).

---

## 7. Phase 5 — AC14 reconciliation (INCOMPLETE — the task's own single largest gap)

**Baseline B** (`screenshots:assert --mantine-only`, captured before Phase 1's first edit, `.screenshots/rendered-assert/2026-09-03T16-56/`): crashed mid-run, **exit 127**. 1086 of an expected ~1520 cells (95 stories × 4 viewports × 4 locales) were captured to disk before the crash (71%); no final JSON summary was written. The crash pattern (long, unbroken chain of `E` markers near the very end of the console stream) matches `critical-flow-registry.md`'s own prior documented occurrence of this exact failure mode with this exact command in this repo: *"the full 592-cell Mantine-only run hit a late-run Playwright browser crash unrelated to this task's stories"* — a known environmental flakiness, not something this session's edits caused (B was captured on the clean, committed tree, before any Phase 1 edit).

A side effect of the crash: its own static file server (PID, port 6008) was not torn down, which caused the first attempt at capturing **P** to fail immediately (`53-final-P-screenshots-assert.log`: "Port 6008 is already in use"). The stray process was identified (`node.exe`, started at the exact time B was launched) and terminated; **P** was then re-launched (`54-final-P-retry.log`).

**Update — the P retry finished after this section was first drafted** (`54-final-P-retry.log`, real exit code **1**, captured unpiped — the background-task notification's "exit code 0" refers to the wrapper shell command, not `screenshots:assert` itself; the `EXIT_CODE=$?` line inside the log is the authoritative value per Note 18 §5a's own warning about this exact trap):

```
Results: 1458/1636 PASS, 145 FAIL, 33 AMBIGUOUS (needs-owner-decision)
```

**145 FAIL — analyzed, not just counted.** Every single one of the 145 failures is the SAME check (`text button not full-width at <640`), and it fires on exactly 2 distinct buttons across locale/story variants:
1. The `ListingsSortBar`/`ListingsActionRow`/`ListingsShellView` family's mobile "Filters" trigger (`Filters`/`Filtrat`/`Filtri`/`Фільтри`, with the active-count badge suffix).
2. `AuthSheet.stories.tsx`'s own disabled decoy trigger button (literal text `"trigger (Story opens the drawer directly)"`) — a story-only fixture element, not production UI.

Neither button's **width/layout** was touched by this task: the Filters trigger's `flex="1 1 auto"` (intentionally NOT full-width — it shares its row with the sort combobox, Task 781R owner decision, documented in `ListingsSortBar.tsx`'s own comments) was only ever read, never edited, by this task's icon-size conversion; `AuthSheet.stories.tsx` was not modified at all (`git status` confirms). `git status` also confirms `SaveSearchButton.tsx`'s F10 label-visibility fix (the one Phase-4 change that touches a button's visible content below 640px) produces **zero** entries in the FAIL list.

**Conclusion (qualitative, not a substitute for a real B\P diff):** this specific `fullWidthButtonsAtMobile`-family check has a documented history of broad, pre-existing, un-triaged findings on this exact check (`docs/storybook-governance.md` §14.9.27/§14.9.28, Task 711/724: "148 real unplanted `false` cells across 13 distinct stories"). Task 781's own D69-10 waiver meant the full (non-`--fast`) `screenshots:assert` was **never run** against its committed code before this session — so this is very likely the FIRST time this exact check has seen `ListingsSortBar`'s post-781R mobile-filters layout, surfacing a pre-existing gap, not a regression this task introduced. This is a finding for Opus to triage (new task vs. documented exemption, matching the Task 724 precedent), not something within Task 782's own scope to fix (§8 bars re-migrating Task 781 components beyond the named F3-F12 findings, and this exact defect is not one of them).

**33 AMBIGUOUS** — all `ambiguous-overlap`, all on `Mantine/Primitives/Combobox/Default` (mobile-390, en/uk/it): "background page content behind an opened overlay's backdrop." This is the project's own standing `AMBIGUOUS` category (`docs/backlog.md`: "owner-triage by design, never citable as green proof"), about the dropdown's backdrop overlapping background buttons — unrelated to the `mah={220}`→`theme.other.boxSize.dropdownPanel` conversion in that same file (a byte-identical `13.75rem`=220px value, not a max-height regression).

`build-storybook` (a hard prerequisite for either B or P) succeeded cleanly both before Phase 1 (`01-baseline-build-storybook.log`) and after the full sweep + F3 (`52-f3-build-storybook.log`).

**What this means for AC14:** the literal `P \ B = ∅` cell-identity arithmetic cannot be produced from this session's evidence. What CAN be stated:
- `npm run build` (the separate, unconditional hard gate) — exit 0, native win32, both mid-sweep and final (`45-build-i1.log`).
- `check:design-tokens`, `check:stories`, `check:story-coverage`, `check:i18n`, `check:mojibake`, `check:file-integrity`, `lint`, and the full `vitest` suite (1465 tests, 1460 passing / 5 pre-existing-unrelated) are all clean on the final tree.
- `build-storybook` succeeded on the final tree with every new/changed story present.

**Required to close R14/AC14 fully — exact owner-native commands:**
```powershell
node.exe -p process.platform          # confirm win32
npm.cmd run build-storybook
npm.cmd run screenshots:assert        # a genuine pre-782 baseline B, run against HEAD (before this
                                       # session's commit) so the 145/33 finding above can be
                                       # mathematically diffed against P (already captured this
                                       # session: .screenshots/rendered-assert/2026-09-03T17-44/)
                                       # rather than argued qualitatively as this report does
```
This session cannot produce that clean pre-edit B itself (no mutating git available to Sonnet to check out `HEAD`
and back). The qualitative analysis above (same finding count/type, on buttons this task never edited the layout
of) is the strongest evidence available from this sandbox; a literal `P \ B = ∅` arithmetic still requires the
owner-native re-run above.

---

## 8. Δ1–Δ7 (AC9)

| Δ | What | Status |
|---|---|---|
| Δ1 | Task 781's — `ActiveFilterChips` cells | Unchanged this task; Task 781's own retained PNG evidence stands (`.screenshots/rendered-assert/2026-09-03T13-18/`, cited in that session's R15 row). |
| Δ2 | Task 781's — `MantineModal` open/bottom-sheet state | **Closed this task** (F3) — `SaveSearchButton.stories.tsx`'s new `OpenModal` cell is the dedicated open-modal proof Task 781's own session log flagged as missing. Not yet rendered-verified in this sandbox (§7). |
| Δ3 | Task 781's — `ListingsShellView` grid cells at desktop-1024 | Unchanged this task; Task 781's own retained PNG evidence stands. |
| Δ4 | Filter-chip height 28px→44px (Task 781, `theme.ts:337` `Button.styles.root.minHeight` unconditional) | Unchanged by this task — no `Button.styles` edit was made. P (`.screenshots/rendered-assert/2026-09-03T17-44/`) now exists and could be eyeballed against Task 781's own retained evidence; not done in this session (time-boxed). |
| Δ5 | Empty-state vertical padding 96px→24px (`py-24`→`py="xl"`) | Unchanged by this task — no `MantineEmptyLoadingErrorState`/`ListingsShellView` padding prop was touched (only its `maw` and `ThemeIcon size` token-converted, and its title's `component="h3"`, F9 — neither affects padding). Same P-exists-but-not-manually-diffed note as Δ4. |
| Δ6 | "Показати ще" desktop width becomes content-based (D69-8) | **This task** — `miw={{sm:192}}` removed (R5). Code change verified (`grep` confirms absence); `ListingsShellView` cells are in P at desktop-1024 for a future visual check. |
| Δ7 | Rounding when a measured value maps to a scale key | **0 by construction** — every one of the 14 `iconSize` / 9 `boxSize` keys was defined at the EXACT measured pixel value (verified: the scale was built FROM the fresh census, not the reverse), so no consumer's rendered size changed. No Δ7 finding exists. |

---

## 9. F3–F12 closure table

| ID | Sev | Status | What proves it |
|---|---|---|---|
| F3 | P1 | **DONE (code) / unverified (render)** | `ListingsActionRow.tsx` extracted; `ListingsShellView.stories.tsx` renders real `SaveSearchButton`; `ListingsActionRow.stories.tsx` renders the real production component; standalone `SaveSearchButton.stories.tsx` with `Default`/`OpenModal`/`Pending`. `check:stories`/`check:story-coverage`/`tsc` clean. Play-function render proof blocked on §7. |
| F4 | P1 | **DONE** | 0 occurrences of `FilterMultiToggle` in all 5 named files (grep-verified); `governance:components` exit 0; JSON validated. |
| F5 | P2 | **DONE (code) / unverified (probe run)** | Locator retargeted to `[data-testid="listings-count-text"]`; testid added to `ListingsSortBar.tsx`. Cannot re-run the route probe without a live server + seed DB (sandbox limitation) — owner-native command in §7-adjacent note below. |
| F6 | P2 | **PARTIAL** | Δ4/Δ5 identified and re-cited (§8); no new rendered before/after capture produced (§7 blocker). |
| F7 | P2 | **DONE** | Folded into Phase 2 — see §5 census. |
| F8 | P2 | **DONE** | Sprint 69 exit criterion 3 records the owner-directed exception; RTL coverage identified at `filterLeafComponents.smoke.test.tsx:185/203` (Task 781R, verified to match `ListingsFilters.tsx`'s actual `allowDeselect` wiring for `market_type`/`property_type`). |
| F9 | P2 | **DONE** | `ListingsShellView.tsx` empty-state title is now `<Text component="h3" …>`. |
| F10 | P2 | **DONE** | `SaveSearchButton.tsx` trigger label no longer hidden below 640px. |
| F11 | P3 | **DONE** | Task 781 session log corrected in place (both figures) with dated notes, original text preserved per F11's own instruction. |
| F12 | P3 | **DONE (code) / unverified (probe run)** | `task772-listings-overflow-probe.mjs` gained a real fail-closed overlap + 44px-floor assertion (`sortSaveViolations`, wired into `hardFail`). Cannot execute without a live server (same blocker as F5). |

**Route-probe re-run command (F5/F12/R8/R13), owner-native:**
```powershell
# requires a running app server (next start, seeded DB) and, for authenticated cells, a valid
# TASK772_AUTH_STORAGE_STATE session file — see the probe's own header comment for both.
node.exe scripts/task772-listings-overflow-probe.mjs after
```

---

## 10. Validation evidence (commands + results)

All transcripts retained under `docs/sessions/evidence/task782/*.log` (numbered chronologically).

| Command | Result |
|---|---|
| `node -p process.platform` | `win32` (first, every session) |
| `npm run build-storybook` (baseline, before Phase 1) | exit 0 |
| `npm run screenshots:assert` (baseline B) | **exit 127** — crashed ~71% through, see §7 |
| `npx tsc --noEmit` | exit 0 (8 checkpoints across the sweep, final clean) |
| `npm run check:design-tokens` (report, pre-sweep) | 86 `raw-dimension-prop` findings |
| `npm run check:design-tokens` (strict, post-sweep) | **0 violations**, exit 0 |
| AC1 two-armed plant (nested key) | planted exit 2 / reverted exit 0 |
| AC4 two-armed plant (repo-level, post-sweep) | planted exit 1 (names exact file:line) / reverted exit 0 |
| `npx vitest run scripts/__tests__/check-design-tokens.test.ts` | 106/106 |
| `npm run check:stories` | 140/140 files, 0 violations |
| `npm run check:story-coverage` | 27/27 covered, 0 unproven |
| `npm run check:i18n` | 2234/2234 keys parity, 4 locales |
| `npm run check:mojibake` | 0 artifacts / 3702 files |
| `npm run check:file-integrity` (pass 1) | 87 files clean |
| `npm run lint` | 0 errors, 72 pre-existing warnings |
| `npx vitest run` (full suite, before AdminUsersTable fix) | 1439/1465, 26 failed (18 = the mock regression, fixed; 8 = pre-existing unrelated, incl. duplicate ListingCard/filterBar counts across 2 runs) |
| `npx vitest run` (full suite, after fix) | **1460/1465**, 5 failed (all confirmed pre-existing/unrelated, §5) |
| `npx vitest run` (critical-flow named suites: `filterLeafComponents`, `filtersPanelShell`) | 39/39 |
| `npm run build` (hard gate) | **exit 0**, native win32 |
| `npm run governance:components` | exit 0 |
| `npm run build-storybook` (post-F3) | exit 0 |
| `npm run screenshots:assert` (final P) | exit **1** — 1458/1636 PASS, 145 FAIL (1 pre-existing check family), 33 AMBIGUOUS (owner-triage category) — see §7 |

---

## 11. Assumptions, deviations, and limitations

1. **AC3 story-fixture interpretation** (§5) — recorded as a decision, not silently applied. Opus should confirm or override.
2. **AC1's top-level `theme.other` index signature** (§2, R1) — a genuine, source-verified Mantine framework limitation, not a defect in this implementation; the scale-level (nested) typo guard, which is what actually matters, is proven.
3. **Phase 5 / AC14 is the task's largest open gap** — B is corrupted (environmental crash, pre-existing pattern, not caused by this session), P did not finish capturing within this session. Every other hard gate (`build`, `tsc`, full vitest, `check:design-tokens`, `check:stories`, `check:story-coverage`, `lint`) is green on the final tree.
4. **F5/F12/R8/R13's probe re-run** requires a live route server + seeded DB + (for F12's authenticated cells) a valid auth storage state — none available in this sandbox. Code changes are complete and reviewed; execution is an owner-native follow-up (command given in §9).
5. **F6's rendered before/after captures** for Δ4/Δ5 depend on the same blocked visual-matrix run as §7.
6. This session ran materially longer and covered materially more ground than a typical single kickoff — every phase (1–4) has real, verified evidence; Phase 5's reconciliation is the one requirement genuinely blocked by sandbox/environment limits rather than left undone by choice.

---

## 12. Backlog update

See `docs/backlog.md` — concise active-state entry added for Task 782, current physical line count recorded there. Baseline captured at `docs/sessions/evidence/task782/backlog-baseline-before-edit.md` before this session's edit (per §14/Note-18-§5a).

---

## 13. Opus handoff — exact open questions

1. **Is the story-fixture AC3 interpretation (§5) correct**, or does AC3 require converting the 47+11 literal values inside `.stories.tsx` files too?
2. **The 145 `text button not full-width at <640` findings (§7) — is this a new Task for the Filters-trigger layout, or an accepted exemption?** This session's read (§7) is that it's a pre-existing Task 781R design decision, never previously run through the full `screenshots:assert` matrix (D69-10 waived it), not a Task 782 regression — but this session made that call from the failure's homogeneity and untouched-file evidence, not a real B\P diff. Please independently verify (a `git stash`-based or `HEAD`-checkout-based owner-native B re-run, per §7's exact command, would settle this conclusively) before deciding whether it blocks this task's own approval or becomes a new numbered task.
3. **Does R14/AC14 block `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`?** P is now captured and analyzed (§7); the missing piece is a genuine pre-782 B to produce the literal `P \ B = ∅` arithmetic AC14 asks for. Every other gate (build, tsc, full vitest, lint, check:design-tokens, check:stories, check:story-coverage) is green.
4. **F5/F12/R8/R13** need a native route-probe run (command given in §9) — this session could not reach a live server.
5. **Please independently re-verify** the "5 pre-existing failures" claim (§5, `vitest`) — this session used `git status --porcelain` on implicated lines rather than `git stash` (unavailable to Sonnet) to establish pre-existence; a `git stash`-based re-run (owner or Opus, both permitted mutating git in their own contexts per the project's role split) would be a stronger proof.

---

## 14. Revision round 2 (2026-09-03) — F13 only: canonical mobile Filters counter

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, scoped **exclusively** to F13/R16/AC16 (the counter badge)
per the narrowed backlog state (`docs/backlog.md` Sprint 69 row: `782` `NEEDS REVISION` for **F13 only**). V1/V2/V3/V5
from §12a of the kickoff are **not** touched by this round — they belong to the prior, broader revision scope and
were not reopened by the instruction that produced this round. `screenshots:assert` was not run (owner rule,
2026-09-03: retired from task/CI proof paths); no review ledger (D69-3, frontend work).

**This section supersedes two earlier drafts of this same round**, corrected in-session on live owner feedback
before any handoff was made — recorded here for traceability, not as separate rounds:
1. First draft placed the badge in the Button's `leftSection` (between icon and label). Owner correction, live:
   *"у кнопці фільтрів Counter має бути праворуч від назви кнопки, а не між іконкою та назвою кнопки"* (the counter
   must be to the right of the button's LABEL, not between the icon and the label) — moved to `rightSection`.
2. Second draft hand-composed `Button` + raw `Badge` directly in `ListingsSortBar.tsx`. Owner correction, live:
   *"у проєкті є канонічна Mantine CountButton. Не видумуй стилі!"* (the project has a canonical Mantine
   `CountButton` — do not invent styles) — this session had not searched `src/design-system/mantine/patterns/`
   before implementing, which is exactly the omission the UI start gate exists to catch. Replaced with the
   project's actual canonical primitive, `MantineCountButton` (below).

**Platform receipt:** `node.exe -p process.platform` → `win32`. Node per this session's `npm`/`npx` invocations.

### 14.1 Files Changed (final)

| File | Reason |
|---|---|
| `src/modules/listings/components/ListingsSortBar.tsx` | Mobile filters trigger now renders via the canonical `MantineCountButton` (`src/design-system/mantine/patterns`) instead of a raw `Button`: `count={activeFiltersCount}` replaces the hand-rolled `rightSection={<Badge circle .../>}`. `MantineCountButton` renders the count as its own content-sized, non-`circle` `Badge` inline in the Button's `rightSection` — to the right of the label, matching the owner's placement correction. `Badge`/`Button` imports from `@mantine/core` replaced by `MantineCountButton` from `@/design-system/mantine/patterns` (already imported for `MantineCombobox`). Comment block rewritten to cite the canonical primitive and both owner corrections. |
| `src/stories/patterns/mantine/ListingsSortBar.stories.tsx` | Meta doc comment and `docs.description` rewritten to describe the canonical `MantineCountButton` composition (not a feature-local `Badge`/`circle`). Added `OneActiveFilter` story (`activeFiltersCount=1`) so the three required states — 0 (`Default`), 1 (`OneActiveFilter`), 12 (`ManyActiveFilters`) — are each named explicitly; `Default`/`ManyActiveFilters` were pre-existing and unchanged. |
| `src/modules/listings/components/__tests__/listingsMigratedControls.smoke.test.tsx` | Stale test title/comments (`"Badge circle"`) corrected to cite `MantineCountButton`/`rightSection`. The badge selector changed from a component-local `data-testid="listings-mobile-filters-count"` (which `MantineCountButton` does not expose — it does not forward a testid to its internal `Badge`) to `.mantine-Badge-root` scoped inside the trigger button — the SAME selector convention the canonical primitive's own test suite uses (`MantineCountButton.smoke.test.tsx:114,128`). No assertion outcome changed: badge presence/absence, its text content, and its in-flow (non-overlay) DOM position are still asserted; all 12 tests in this file pass. |

### 14.2 Canonical UI decision record (final)

| Visible artifact | Search/inspection | Canonical source | Disposition | Implementation |
|---|---|---|---|---|
| Mobile filters trigger + active-filter counter badge, `ListingsSortBar.tsx` | Corrected search (post owner feedback): `grep -rliE "count.?button" src` found `src/design-system/mantine/patterns/MantineCountButton.tsx`, its story `src/stories/mantine/primitives/CountButton.stories.tsx` (`Mantine/Primitives/CountButton`), and its smoke test. Read `MantineCountButton.tsx` in full: it wraps `Button`, accepts `count`/`leftSection`/`variant`/etc., and renders the count as a content-sized `Badge` in `rightSection` — variant-aware (`filled` host → white/brand pill, non-`filled` host incl. `variant="default"` → gray-2/gray-7 pill). Confirmed two existing production consumers use the identical shape (`variant="default"` + `leftSection` filter icon + `count`): `HeroSearchView.tsx`'s `advanced_filters` trigger and `FiltersPanel.tsx`'s apply button. | `MantineCountButton` (`src/design-system/mantine/patterns/MantineCountButton.tsx`) | **reuse** — this is not a new primitive and required no `theme.ts`/pattern-file edit; `ListingsSortBar.tsx`'s mobile filters trigger is functionally the same "secondary button + icon + active count" shape as the two existing consumers | `<MantineCountButton variant="default" ... leftSection={<SlidersHorizontal .../>} count={activeFiltersCount} ...>{t('filters_title')}</MantineCountButton>` replaces the raw `Button` |

The task's own rule ("If no canonical native Mantine composition exists for this, STOP and report BLOCKED") did not
apply, but the first two drafts of this round reached that conclusion without actually completing the required
search of `src/design-system/mantine/patterns/` first — the canonical composition existed the whole time. This is
recorded as a process defect, not a design decision: the NON-NEGOTIABLE UI START GATE requires inspecting canonical
patterns *before* writing JSX, and this round did not do that until the owner pointed at the specific component name.

### 14.3 Requirement/acceptance evidence

| Requirement | Evidence | Result |
|---|---|---|
| Story renders the real production `ListingsSortBar`, not copied JSX | `ListingsSortBar.stories.tsx:4` imports `@/modules/listings/components/ListingsSortBar` directly; `render()` calls it with props, no duplicated markup | **VERIFIED** (grep + read) |
| Story includes no-active-filters, 1-active-filter, 12-active-filters states | `Default` (`activeFiltersCount=0`), new `OneActiveFilter` (`activeFiltersCount=1`), `ManyActiveFilters` (`activeFiltersCount=12`) | **VERIFIED** (read) |
| Native Mantine `Button` sections/components only | `ListingsSortBar.tsx` now consumes `MantineCountButton` (itself a thin native-Mantine `Button` wrapper) instead of composing `Button`+`Badge` locally; no bespoke wrapper element in `ListingsSortBar.tsx` at all | **VERIFIED** (read) |
| Badge is content-sized, immediately right of the icon, inside the Button's native left section | **Superseded by live owner correction** — the owner's placement instruction, given after this requirement was written, places the counter to the right of the **label** (`rightSection`), not between the icon and label. Implemented as `rightSection` via `MantineCountButton`'s own `count` prop, consistent with the identical existing pattern in `HeroSearchView.tsx`/`FiltersPanel.tsx` | **IMPLEMENTED PER OWNER'S LIVE CORRECTION — supersedes the written task text** |
| No `circle`, absolute positioning, bespoke CSS, hard-coded width/height, hand-rolled counter | `grep -n circle src/modules/listings/components/ListingsSortBar.tsx` returns only prose comment lines, no `circle` prop or raw `Badge` at all — the counter is entirely owned by `MantineCountButton` | **VERIFIED** (grep + read) |
| Count stays inside the button, readable/unclipped for 1 and 12+ at mobile widths | Not independently pixel-measured this round (no live Storybook-server measurement script was in the given scope, and `screenshots:assert` is explicitly excluded). `MantineCountButton`'s own smoke test (`MantineCountButton.smoke.test.tsx:101-107`) already asserts the badge is not absolutely positioned; the theme's non-`circle` `Badge.styles` branch it consumes removes the `width==height` constraint that caused the original clipping — this is `INFERENCE` from an already-tested shared primitive, not a fresh rendered measurement of `ListingsSortBar` itself | **NOT INDEPENDENTLY MEASURED — owner visual review required** |
| Icon, count, label, sibling sort control stay responsive, no overlap | `flex="1 1 auto"`/`miw={0}`/`hiddenFrom="sm"`/`onClick`/`data-testid` all pass through `MantineCountButton`'s `...props` spread onto the underlying `Button` unchanged; the parent `Group`'s `wrap="wrap"` is untouched | **INFERENCE from unchanged surrounding layout and prop pass-through, not re-measured** — owner visual review required |

### 14.4 Validation evidence (final, after the canonical-primitive correction)

| Command | Result |
|---|---|
| `node.exe -p process.platform` | `win32` |
| `npm.cmd run typecheck` | exit 0 |
| `npm.cmd run check:stories` | 140 files checked, 0 violations, exit 0 |
| `npm.cmd run check:story-coverage` | 27/27 covered, 0 unproven, exit 0 |
| `npm.cmd run check:design-tokens` (strict) | 0 violations, exit 0 |
| `npx.cmd vitest run src/modules/listings/components/__tests__/listingsMigratedControls.smoke.test.tsx` | 12/12 passed, exit 0 |
| `npm.cmd run build-storybook` | exit 0 (run twice — once per draft correction; both exit 0) |
| `npm.cmd run build` (hard gate, non-Q0) | exit 0 (run twice — once per draft correction; both exit 0) |

`npm run screenshots:assert` was **not** run, per the task's explicit instruction and the owner's 2026-09-03 retirement of that gate from task/CI proof paths.

### 14.5 Assumptions, deviations, limitations

- **This round's first two implementation drafts were superseded before handoff** by live owner correction (§14, top) — the diff and all evidence in this section describe the final, corrected state only. Both corrections are preserved in the code's own comments so the reasoning survives review.
- **No new Storybook state beyond `OneActiveFilter`** was added — `Default` and `ManyActiveFilters` already existed from the prior round and needed no change; only their doc comment was rewritten.
- **`theme.ts` was not touched.** `MantineCountButton` and the canonical non-`circle` `Badge.styles` branch it relies on both already existed; this round only pointed `ListingsSortBar.tsx` at the existing shared primitive instead of hand-composing an equivalent locally. This is `reuse`, not `extend`/`create canonical`.
- **The `data-testid="listings-mobile-filters-count"` selector no longer exists** — `MantineCountButton` has no prop to forward a testid to its internal `Badge`, and adding one would mean extending the shared primitive for a single consumer's test convenience. The smoke test now uses `.mantine-Badge-root` scoped inside `[data-testid="listings-mobile-filters-trigger"]`, matching `MantineCountButton.smoke.test.tsx`'s own established convention. The full kickoff's AC16 measurement plan (§13 of the kickoff) cites the old testid as its selector; a future measurement pass should use the `.mantine-Badge-root` selector instead.
- **No pixel-level width measurement was captured** (see §14.3). That measurement script was not part of this round's given scope (`Run relevant typecheck/story checks and build Storybook` — no route/measurement probe named) and `screenshots:assert` is explicitly excluded. Reported as an open gap, not claimed as passed.
- **`docs/backlog.md`** was updated in place (baseline `git --no-optional-locks show HEAD:docs/backlog.md` = 64 lines; this session's edit brought it to 66 lines, under the 80-line limit). A concurrent session subsequently filed Task 783 (a related but separate `ListingsFilterBar` counter follow-up) in the same file — that addition was not made by this session and is left as-is per the file's current on-disk state.

### 14.6 Opus handoff — exact open questions for this round

1. **Rendered proof for the core counter claim** (badge grows with content, stays unclipped at 1 vs 12, sits correctly to the right of the label) has not been captured in this round — a computed `getBoundingClientRect().width`/`scrollWidth<=clientWidth` check on `.mantine-Badge-root` inside `[data-testid="listings-mobile-filters-trigger"]`, comparing `OneActiveFilter`/`ManyActiveFilters`, at mobile viewports, would close it. Not run because no such probe was named in the given task instructions and the given validation commands (typecheck/story checks/build Storybook) do not produce one.
2. **Owner visual review is the closing step**, per the task's own instruction ("do not self-approve"; "leave the task awaiting owner visual review of the finished canonical story"). The exact tuples to review: story `Patterns/Mantine/ListingsSortBar`, states `Default`/`OneActiveFilter`/`ManyActiveFilters`, at mobile viewports (375/390px), across the 4 locales the Storybook toolbar exposes — specifically confirming the counter now sits to the right of the "Filters" label, not between the icon and the label.
3. **Please confirm the `MantineCountButton` reuse and the `rightSection` placement are the intended final shape** — both came from live corrections mid-session rather than from the written task text, which had specified `leftSection` and did not name the canonical primitive.
4. Confirm whether the broader kickoff's V1/V2/V3/V5 (§12a) remain intentionally out of scope for this round, or should be picked up next — this round treated the backlog's "F13 only" narrowing as authoritative and did not reopen them. Note Task 783 (filed by another session while this one was in progress) covers the sibling `ListingsFilterBar` counter using the same `MantineCountButton` primitive — the two tasks should stay consistent with each other.
