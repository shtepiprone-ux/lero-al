# Task 749 — Clear the rendered gate's 18 blocking cells: AdminUsersTable overflow, HeroSearch and NotificationCenter mobile full-width

**Sprint:** 58 — The rendered gate's 18 blocking cells (`tasks/Sprints/Sprint_58_Rendered_Proof_Eighteen_Blocking_Cells.md`)
**Type:** UI defect remediation (product CSS/layout), 3 components, 1 gate exit code
**QA profile:** `Q3 Full Visual Matrix`
**Status:** **REVISION 1 IN FLIGHT** (2026-08-15) — §6.A, AC2, AC8, AC11, AC12 and plants P1a/P1b are superseded by
`tasks/Sprints/Sprint_58_Task_749_revision_1_AdminUsersTable_ScrollArea.md`. Everything else stands as written.
**Authorizing owner decisions:** 2026-08-15 (three, quoted verbatim in §2)

---

## 1. Objective

Take `npm run screenshots:assert -- --mantine-only` from **18 FAIL** to **0 FAIL** by fixing three product defects,
with `scripts/check-stories-rendered.mjs` and `.github/workflows/governance-pr.yml` byte-unchanged.

This is not a gate task. Nothing in this task may make a failing cell pass by changing what the gate looks at,
what it exempts, or what it tolerates.

---

## 2. The owner decisions this task executes

All three were given 2026-08-15, in the session that also confirmed the Click-Shield job is green and that the
Rendered Proof job is the only remaining red check on **PR #7**.

**D-1 — the gate stays blocking.** *"Моє рішення - gate лишається blocking і спершу виправляємо всі 18 дефектів"*
The rejected alternative was a versioned-baseline comparison in CI that blocks only on **new** FAILs. It is not to
be built here.

**D-2 — Task 593 is superseded, for this one button.** Task 724 retargeted `NotificationCenter.tsx`'s header/button
breakpoint from the custom 390px `notification-compact` token to the canonical 640px `sm`; Task 724R **V4** reverted
it on owner instruction 2026-08-07 and recorded that *"clearing it requires an owner decision superseding 593"*
(`tasks/Sprints/Sprint_53_kickoff_prompt_Task_724R_FullWidthButtons_Revision.md:145`). That decision is now given:
the threshold moves **390 -> 640**. Task 593's compact-layout intent is preserved, bounded at 640 instead of 390.

**D-3 — the HeroSearch filters button gets a three-band responsive model**, quoted from the owner:

> `>=860px`: звичайна кнопка з іконкою й текстом; `640–859px`: компактна icon-only кнопка — тут економія місця
> виправдана; `<640px`: full-width кнопка Фільтри з leading-іконкою. Full-width icon-only кнопка виглядає як
> порожній великий контейнер і гірше пояснює дію. Видимий текст робить дію зрозумілою, узгоджує її з accessible
> name і підтримує голосове керування; aria-label потрібен лише коли видимого тексту немає. Реалізаційно: текст
> локалізований, іконка лишається, active-count badge лишається, висота tap-target щонайменше 44 px.

**D-4 — one task, not three.** The three components ship in this single kickoff.

---

## 3. Verified context

Every number and line reference below was read from this worktree on **2026-08-15**
(branch `codex/fix-task741-lint-baseline`, `git status --porcelain` = 2 untracked `.click-shield-ci-fixture.*.log`
files only). Nothing here is copied from a session log's self-description.

### 3.1 The baseline the task must move

`.screenshots/rendered-assert/2026-08-15T05-29/manifest.json`:

| `summary` field | Value |
|---|---:|
| `total` | 1204 |
| `passed` | 1164 |
| `failed` | **18** |
| `ambiguousOnly` | 22 |
| `offscreenControl` | 2 |
| `ambiguousOverlap` | 22 |

The 18 cells, enumerated (`matrix[].pass === false` minus the 22 `ambiguousOnly` cells):

```
Admin/AdminUsersTable/Default            x sq x mobile-320
Admin/AdminUsersTable/Default            x uk x mobile-320
Mantine/Primitives/HeroSearch/Default    x {en,it,sq,uk} x {mobile-320, mobile-375, mobile-390}   (12)
Mantine/Primitives/NotificationBellView/Default x {en,it,sq,uk} x mobile-390                      (4)
```

Identical set in the two independently captured runs compared at
`docs/reviews/artifacts/2026-08-14-task741-review/screenshots-assert-mantineonly-failset-diff.txt` (`0 added /
0 removed`). **The gate is not flaky on these cells** — reproducing them is not part of this task's risk.

### 3.2 The assertion each cell fails — read from the gate's own source

**(a) `fullWidthButtonsAtMobile`** — `scripts/check-stories-rendered.mjs:1230-1317`. At `viewport.width < 640`, for
every `.mantine-Button-root` that is visible (`offsetWidth > 1`), is **not** an `isChipSetMember`, and **has a
`.mantine-Button-label` child**, the button must satisfy
`offsetWidth >= parentContentWidth - FULL_WIDTH_TOLERANCE` (`:489`, tolerance **8px**).

**The `.mantine-Button-label` condition does not exclude a collapsed `MantineCountButton`, and the gate's own
comment at `:1226-1229` is wrong about that.** Mantine renders the label span **unconditionally** —
`node_modules/@mantine/core/esm/components/Button/Button.mjs:128` emits
`jsx(Box, { component: "span", mod: { loading }, ...getStyles("label"), children })` with no truthiness guard on
`children`. That is why the HeroSearch cells report `failingButtonLabels: ["2"]`: the label span exists and is
empty, and the button's whole `textContent` is the count badge. **Do not "fix" this by making the collapse drop the
label span** — that would satisfy the gate by producing the property the gate's exclusion reads, which is the exact
defect Task 724R/726 removed from this file (`docs/backlog.md`, 724 corollary ②). Record the comment defect as a
finding; do not edit `check-stories-rendered.mjs`.

**(b) `noHorizontalOverflow` + `visualIntegrity.offscreen-control`** — the AdminUsersTable pair. Measured
violations, verbatim from the manifest:

```
sq  #mantine-…-tab-verified  "✓ Agjentë të verifikuar"   right=360, viewportWidth=320
uk  #mantine-…-tab-verified  "✓ Верифіковані агенти"     right=339, viewportWidth=320
```

### 3.3 Root cause per component — mechanism, not symptom

**A. `AdminUsersTable` (2 cells).** `src/components/admin/AdminUsersTable.tsx:421-435` renders `<Tabs.List grow>`
with two `<Tabs.Tab>`. Mantine gives a grown tab `flex: 1`
(`node_modules/@mantine/core/styles.css:7135-7137`) and the tab itself `white-space: nowrap`
(`:7143-7153`, the `white-space` declaration is `:7147`). A flex item's default `min-width: auto` resolves to its
min-content size, and under `nowrap` min-content **equals** max-content — so the two tabs cannot shrink below the
sum of their label widths. In `sq` and `uk` that sum exceeds 320px and the second tab's right edge lands at 360 /
339. `en` and `it` fit at 320 and pass. **The labels are correct translations, not leaks**
(`messages/{en,sq,uk,it}.json` -> `admin.users.tab_all` / `admin.users.tab_verified`); this is a layout defect, not
an i18n one. Task 736 (classify the AdminUsersTable **locale-leak** findings) is a different number and stays
untouched.

**B. `HeroSearch` (12 cells).** `src/components/shared/HeroSearchView.tsx:128-138` renders `MantineCountButton` with
`iconOnlyBelow={860}` inside the wrapping flex row `.controls`
(`src/components/shared/HeroSearchView.module.css:68-72`). `.filtersControl` (`:104-106`) sets only
`flex-shrink: 0`, so the button stays content-width; `.searchControl` (`:109-113`) sets `flex-basis: 100%`, so
Search wraps onto its own line and leaves the filters button **alone on a line at content width**. Task 724's own
measurement, `Sprint_53_kickoff_prompt_Task_724_FullWidthButtons_13Story_Adjudication.md:107`:
`offsetWidth 75` vs `parentContentWidth 285`, parent `_controls_blflv_68` — **the only one of the 13 adjudicated
stories whose failing button's parent is a CSS-module flex row rather than a Mantine `Group`** (`:110-111`), which
is why 724 routed it out (§3.7, to the now-closed Sprint 49) instead of applying the `Group`-shaped fix.

Below 640 the collapse serves no purpose: `.typeControl` and `.locationControl` both carry `flex-basis: 100%`
(`:80-83`, `:92-96`), so the location combobox the collapse exists to protect (`HeroSearchView.tsx:113-119`) is
already alone on its own full-width row. The collapse earns its place only in the **640–859** band, where the
controls share rows. That is exactly D-3's model.

**C. `NotificationBellView` (4 cells).** `src/modules/notifications/components/NotificationCenter.tsx:37` and `:48`
switch the header to a row and the button to `w-auto` at the `notification-compact` variant, defined as
`--breakpoint-notification-compact: 24.375rem` (**390px**) in `src/app/globals.css:30-33`. At viewport **390** the
query matches, the button becomes content-width, and the gate — whose boundary is **640** — fails it. At 320 and
375 the query does not match, the button is `w-full`, and the cells pass. That is the complete explanation of why
only `mobile-390` is red. `--breakpoint-sm` is **not** overridden anywhere in `globals.css` (sole `--breakpoint-*`
declaration is `:32`), so Tailwind's `sm:` is the stock `40rem` = 640px = Mantine's `sm` = the gate's boundary.

**The Task 724 fix for this component was never committed.** `git log --all -- src/modules/notifications/components/NotificationCenter.tsx`
ends at `50c40c2f8` (2026-08-05, the `min-[390px]:` -> named-token rename). Neither `bf343a297` (724 kickoff, docs
only) nor `8113bc865` (724R, which carries every **other** production fix in that adjudication) touches the file.
`docs/storybook-governance.md:1842` records the retarget as landed; it did not land. Record this as a finding —
it is a documentation defect for the reviewer, not something to edit in this task.

### 3.4 Visual source map (mandatory, `docs/orchestrator-ui-task-design.md`)

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Admin users tab strip, `<640` | `AdminUsersTable.tsx:431-434` `Tabs.List grow` | `.mantine-Tabs-tab` = `.m_4ec4dce6` | Mantine unlayered component CSS: `flex: 1` from `styles.css:7135-7137`; `white-space: nowrap` `:7147`; no project token involved | **changed** — wrapping enabled via the Mantine `styles` prop | manifest `offscreen-control` rows, §3.2(b) |
| Admin tab label centring | `.mantine-Tabs-tabLabel` = `.m_42bbd1ae` | `styles.css:7178-7181` `flex: 1; text-align: center` | Mantine default | **preserved** — not touched; centring still applies to wrapped lines | `styles.css:7178` |
| HeroSearch filters trigger, `<640` | `HeroSearchView.tsx:128-138` `MantineCountButton` | `.filtersControl` (CSS module, `@layer utilities`) | `flex-shrink: 0` only (`module.css:104-106`); Mantine `Button` supplies height via `--button-height` | **changed** — full-width row + 44px floor | 724 measurement `75` vs `285`, §3.3 B |
| HeroSearch filters trigger, `640–859` | same | same | same | **preserved byte-identical** — icon-only, content width | band-700 cells, §7 AC5 |
| HeroSearch filters label collapse | `MantineCountButton.tsx:94-99` `useMediaQuery` | n/a (JS) | `@mantine/hooks`, `getInitialValueInEffect: true` | **changed** — gains a lower bound | `MantineCountButton.tsx:94-99` |
| HeroSearch active-count badge | `MantineCountButton.tsx:80-92` `Badge` in `rightSection` | `--mantine-color-gray-2` / `gray-7` | Mantine theme custom properties | **preserved** — D-3 requires the badge stays | `MantineCountButton.tsx:80-92` |
| HeroSearch Search CTA | `HeroSearchView.tsx:140-146` | `.searchControl` | `flex-basis: 100%` + `padding-inline: var(--space-6)` (`module.css:109-113`) | **preserved** — already full-width at `<640`, passes today | manifest: not in `failingButtonLabels` |
| Notification panel header row | `NotificationCenter.tsx:37` | `notification-compact:flex-row` etc. | `--breakpoint-notification-compact: 24.375rem` (`globals.css:32`) -> Tailwind v4 `@theme` breakpoint variant | **changed** — variant becomes `sm:` (stock `40rem`) | §3.3 C |
| Notification mark-all button width | `NotificationCenter.tsx:48` | `w-full notification-compact:w-auto` | same token | **changed** — becomes `w-full sm:w-auto` | §3.3 C |
| Notification bell trigger | `NotificationBellView.tsx:40` `ActionIcon` `mih/miw="2.75rem"` | `.mantine-ActionIcon-root` | not a `.mantine-Button-root`; never matched by the assertion | **out of scope** — positive evidence: the assertion’s selector at `:1301` cannot select it | `check-stories-rendered.mjs:1301` |
| Notification panel rows | `NotificationItem` | legacy Tailwind | untouched | **out of scope** — no Button, no width assertion | manifest: only one `failingButtonLabels` entry |

### 3.5 Canonical UI decision record (mandatory)

| Visible artifact | Search queries and inspected paths | Canonical Mantine story/source | Disposition | Shared style/token path and required registration |
|---|---|---|---|---|
| Full-width mobile CTA | `src/design-system/mantine/patterns/` (all), `MantineResponsiveActionFooter`, `docs/mantine-responsive-design-system.md:622`, `Mantine/Primitives/Button/Default` story | `MantineResponsiveActionFooter.tsx:50-56` — `flexDirection: 'column'` at `<640` so CTAs stack full-width | **reuse (principle only, not the component)** | HeroSearch's row is a CSS-module flex row, not a footer action stack; the *rule* (full-width below 640) is reused, the container is not replaced — 724 §3.3 explicitly forbids carrying the `Group`-shaped fix here |
| Count-in-button primitive | `src/design-system/mantine/patterns/MantineCountButton.tsx`, its smoke test, `Mantine/Primitives/CountButton/Default` | `MantineCountButton` | **extend** — canonical owner of the collapse; the new bound lands once for all consumers | Only 2 consumers exist (`grep MantineCountButton src --include=*.tsx`): `FiltersPanel.tsx:111` (passes neither collapse prop -> byte-identical) and `HeroSearchView.tsx:128`. No catalog entry changes. |
| 44px touch target | `globals.css:145`, `NotificationBellView.tsx:40` | `--space-11: 2.75rem /* 44px — touch-target floor (§12a) */` | **reuse** | Existing project token. **No new token, no raw `44px`/`2.75rem` literal.** |
| Tab strip wrapping | `Mantine/Primitives/Tabs/Default` story, `AdminCurrencyTabs.tsx`, `AdminPageShell.stories.tsx` | Mantine `Tabs` `styles` API | **reuse** | Mantine's own `styles={{ tab: … }}` slot API, the same mechanism `HeroSearchView.tsx:63-70` already uses for `SegmentedControl`. No new class, no Tailwind, no module file. |

---

## 4. Scope

**In scope — the complete allowed write set. Any path outside it makes the task `BLOCKED`, not "also fixed".**

1. `src/components/admin/AdminUsersTable.tsx`
2. `src/design-system/mantine/patterns/MantineCountButton.tsx`
3. `src/components/shared/HeroSearchView.tsx`
4. `src/components/shared/HeroSearchView.module.css`
5. `src/modules/notifications/components/NotificationCenter.tsx`
6. `src/app/globals.css` — **removal only**, the `@theme` block at `:31-33` and its 2-line comment at `:29-30`
7. `src/design-system/mantine/patterns/__tests__/MantineCountButton.smoke.test.tsx` — **additive only**, the new-prop cases required by AC7
8. `docs/backlog.md` (concise state), `docs/sessions/2026-08-15-task749-rendered-proof-mobile-remediation.md` (new)

**Out of scope — zero diff, verified by `git status --porcelain` at final state:**

- `scripts/check-stories-rendered.mjs` — its assertions, `FULL_WIDTH_TOLERANCE` (`:489`), `isChipSetMember`,
  `MANTINE_VIEWPORTS` (`:393-398`), `MANTINE_STORY_EXTRA_VIEWPORTS` (`:418-419`),
  `MANTINE_PATTERN_KNOWN_FAILURES`, and the wrong comment at `:1226-1229`.
- `.github/workflows/governance-pr.yml`.
- `scripts/__tests__/css-var-resolvability.test.ts` — its `--breakpoint-notification-compact` at `:170`/`:185` is a
  **string literal inside a synthetic CSS fixture**, not a reference to `globals.css`. Deleting the real token does
  not break it. **Read it before you touch anything else, then leave it alone.**
- Every Storybook story file. **No story markup is added, extended or probed by this task** — all three components
  already have enrolled stories rendering their real production composition
  (`HeroSearch.stories.tsx`, `NotificationBellView.stories.tsx`, `AdminUsersTable.stories.tsx`), so the
  permanent-story creation gate is satisfied by reuse and there is nothing to authorize.
- `src/components/shared/HeroSearchFallback.tsx` — inspected: renders a single `Skeleton`
  (`HeroSearchFallback.tsx:20-25`), no `Button`, so `fullWidthButtonsAtMobile` is `null` for its cells. Positive
  evidence that it cannot cause or prevent any AC here.
- `FiltersPanel.tsx` — its `MantineCountButton` at `:111` passes `fullWidth` and neither collapse prop.
- The 22 `AMBIGUOUS` cells.
- `MobileBottomNavView.tsx`, Task 738, Task 736.

---

## 5. Requirement ledger

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D-1; manifest §3.1 | `Admin/AdminUsersTable/Default` x {sq,uk} x `mobile-320`: `noHorizontalOverflow: true` and `visualIntegrity.violations: []` | P0 | manifest field read | Confirmed |
| R2 | D-3 | `Mantine/Primitives/HeroSearch/Default`, all 4 locales x {320,375,390}: `fullWidthButtonsAtMobile: true`, `failingButtonLabels` absent | P0 | manifest field read | Confirmed |
| R3 | D-3 | At `<640` the filters trigger renders its **localized visible label**, its `SlidersHorizontal` leading icon, and its active-count `Badge`, at `min-height >= 44px` | P0 | DOM/computed-style probe at 320/375/390 x 4 locales | Confirmed |
| R4 | D-3 | The **640–859** band stays icon-only and content-width; `band-700` cells byte-identical (md5) | P0 | `band-700` PNG md5 before/after | Confirmed |
| R5 | D-3 | `>=860` renders icon + text as today; `desktop-1024` cells byte-identical (md5) | P0 | `desktop-1024` PNG md5 before/after | Confirmed |
| R6 | D-2 | `NotificationBellView/Default` x 4 locales x `mobile-390`: `fullWidthButtonsAtMobile: true` | P0 | manifest field read | Confirmed |
| R7 | D-2 | The header row / button width switch happens at **640**, not 390: at 390 the button is full-width and stacked below the title; at 640+ the original single row returns | P0 | computed-style probe at 390 and 640 | Confirmed |
| R8 | D-2; 724R `:404` | `--breakpoint-notification-compact` and every `notification-compact` occurrence are absent from `src/` | P1 | repo census, exact command in §9 | Confirmed |
| R9 | `MantineCountButton.tsx:21`, `:51-72` (`iconOnlyBelow` SSR contract) | The new prop is **additive**: `FiltersPanel.tsx:111`'s instance and every prop-unset instance render byte-identical, and SSR/first-client-render markup is unchanged | P1 | smoke test + `Patterns` story md5 | Confirmed |
| R10 | D-1; Sprint 58 exit 3/4 | `scripts/check-stories-rendered.mjs` and `.github/workflows/governance-pr.yml` absent from `git status --porcelain` | P0 | `git status --porcelain` | Confirmed |
| R11 | D-1 | `npm run screenshots:assert -- --mantine-only` prints `0 FAIL` and exits **0** | P0 | exit code + stdout | Confirmed |
| R12 | Sprint 58 exit 2 | `ambiguousOnly` is still **22**, same set | P0 | manifest set diff | Confirmed |
| R13 | `docs/backlog.md` recurring-failure-mode rule | Each of the three fixes has a two-armed plant that demonstrably fails before the fix and passes after | P0 | §8 plant matrix | Confirmed |
| R14 | `docs/qa-profiles.md` `Q1` row | `npm run build` exits 0 | P0 | transcript | Confirmed |
| R15 | `CLAUDE.md` — "Critical flows listed in `docs/critical-flow-registry.md` require automated regression evidence" | The three engaged rows (33, 45, 50) pass with their own authoritative commands | P0 | AC15 | Confirmed |

---

## 6. The implementation contract — one route per component

### 6.A `AdminUsersTable` — let the grown tabs wrap

> ⚠️ **SUPERSEDED 2026-08-15 — see `tasks/Sprints/Sprint_58_Task_749_revision_1_AdminUsersTable_ScrollArea.md`.**
> Revision 1 replaces this section. Do not execute the text below it.

Add a Mantine `styles` prop to the `Tabs` at `AdminUsersTable.tsx:422-435`:

```
styles={{ tab: { whiteSpace: 'normal', minWidth: 0 } }}
```

`whiteSpace: 'normal'` makes min-content the longest **word** instead of the whole label, so `flex: 1`'s
`min-width: auto` clamp no longer forces 180px per tab; `minWidth: 0` removes the clamp entirely so the 50/50 split
is guaranteed rather than merely likely. **Both are required** — `whiteSpace` alone leaves a min-content floor that
a longer future translation can breach again.

**Expected rendered delta, and its exact boundary.** At `mobile-375`, `mobile-390` and `desktop-1024` the two tabs
already fit their allotted half in all four locales (they pass today), so the labels do not wrap and those 12 PNGs
must be **md5-identical**. At `mobile-320` the sq and uk labels wrap to two lines and the strip grows taller — that
is the fix. `it@mobile-320` may also begin wrapping; **measure it, report it, do not assume it either way.** Any
md5 change outside `mobile-320` is a regression: stop and report, do not absorb.

Do **not** introduce a `.module.css`, a Tailwind class, `Tabs.List` scrolling, `text-overflow: ellipsis`, or a
shortened translation. Truncating a tab label is a content change nobody authorized.

### 6.B `HeroSearch` — the three-band model

**B1. `MantineCountButton` gains a lower bound (additive).** Add:

```
/**
 * Optional lower bound for `iconOnlyBelow`. When set, the collapse applies only while the
 * viewport is >= this width AND < `iconOnlyBelow`. Unset (default) = no lower bound, so an
 * instance that sets only `iconOnlyBelow` renders exactly as before.
 */
iconOnlyAbove?: number
```

Implement by narrowing the existing unconditional `useMediaQuery` at `:94-98` into one min/max range — same
`getInitialValueInEffect: true` and same `false` initial value. The unset case retains the existing
`'(max-width: 0px)'` sentinel, so `iconOnlyAbove` without `iconOnlyBelow` remains inert. Compose:

```
const belowThreshold = useMediaQuery(
  iconOnlyBelow != null
    ? iconOnlyAbove != null
      ? `(min-width: ${iconOnlyAbove}px) and (max-width: ${iconOnlyBelow - 1}px)`
      : `(max-width: ${iconOnlyBelow - 1}px)`
    : '(max-width: 0px)',
  false,
  { getInitialValueInEffect: true },
)
const collapsed = iconOnlyBelow != null && belowThreshold
```

**SSR safety is unchanged and must be proven, not assumed:** the existing hook starts `false`, so `collapsed` is
`false` on the server and on the client's first render exactly as today. The only behavioural change is
post-hydration and only for an instance that sets both props.

**B2. `HeroSearchView.tsx:128-138`** — add `iconOnlyAbove={640}` next to the existing `iconOnlyBelow={860}`. Change
nothing else in that element. **Keep `aria-label={t('advanced_filters')}` at `:133`.** It is still required by the
component's own contract for the 640–859 collapsed band, and at `<640` it is byte-identical to the visible label, so
the accessible name and the visible text match — which is precisely what D-3 asks for. Removing it would ship a
nameless icon button in the 640–859 band.

**B3. `HeroSearchView.module.css`** — `.filtersControl` at `:104-106` gains a base full-width + touch-target floor,
reset at `40rem` so the 640+ bands are untouched:

```
  .filtersControl {
    flex-shrink: 0;
    flex-basis: 100%;
    min-height: var(--space-11);
  }
  @media (min-width: 40rem) {
    .filtersControl {
      flex-basis: auto;
      min-height: 0;
    }
  }
```

`var(--space-11)` is the existing 44px touch-target token (`globals.css:145`) — **no raw `44px` or `2.75rem`
literal.** The base/`40rem` split is the same shape `.typeControl` (`:80-89`) and `.locationControl` (`:92-101`)
already use in this file.

**The `@layer utilities` question, answered before you write it.** This file is wrapped in `@layer utilities` for a
specific D34 reason (header comment `:31-51`): its declarations *reproduce* prior Tailwind utilities and must keep
those utilities' losing cascade standing against Mantine's unlayered component CSS. The two new declarations are
**not** reproductions, so ask whether the layer can defeat them: Mantine's `Button` root declares neither
`flex-basis` nor `min-height` (it sizes via `height: var(--button-height)`), so there is no unlayered competitor
for either property and the layer is inert here. **Verify this by computed style, do not take it on faith** — if
`getComputedStyle` reports the button is not full-width or is under 44px at 320/375/390, the layer assumption was
wrong; report it as a finding rather than silently unlayering the file (unlayering it would re-open the Task 709 A2
regression on `.searchControl`'s `padding-inline`).

### 6.C `NotificationCenter` — 390 -> 640, then delete the dead token

**C1.** `NotificationCenter.tsx:37` and `:48` — replace every `notification-compact:` variant with `sm:`. Nothing
else on those two lines changes. Update the Task 593 comment at `:32-36` to record D-2 (2026-08-15) as the decision
that moved the threshold, naming Task 724's original retarget and 724R V4's revert so the next reader does not
re-derive this history a third time.

**C2.** Only after C1 leaves zero consumers, delete `src/app/globals.css:29-33` (the comment and the `@theme`
block). **Order matters:** Task 743 records that deleting a token in `globals.css` un-owns it *together with* its
orphaned consumers, so `check:css-vars` goes silent on `0 violations, exit 0`. Removing the last consumer first
means there is nothing for the gate to go silent about.

**C3.** `scripts/__tests__/css-var-resolvability.test.ts:170,185` keeps its `--breakpoint-notification-compact`
string. It is a synthetic fixture asserting `extractOwnedNames` parses an `@theme` block — it never reads
`globals.css`. **Zero diff.** If `npm run test` fails on that file after C2, the fixture was misread; stop and
report rather than editing the test.

---

## 7. Behavior: before -> after

### Current behavior to preserve (named, not implied)

| Preserved | Positive evidence it cannot cause or block an AC |
|---|---|
| SegmentedControl sale/rent, both comboboxes, the Search CTA, the whole `>=768` single-row HeroSearch layout | none of them is `.filtersControl`; the only module-CSS edit is scoped to that class and to `<640` |
| The HeroSearch active-count `Badge` and its gray/white variant switch | `MantineCountButton.tsx:80-92` is not touched by B1 |
| `FiltersPanel`'s Apply button | `FiltersPanel.tsx:111` passes `fullWidth` and neither collapse prop; `collapsed` is already `false` for it |
| Task 593's compact-layout **intent** (mark-all gets its own full-width row on narrow screens) | D-2 widens the band it applies to; it does not delete the stacked layout |
| The notification bottom-sheet itself | `MantinePopover`'s `<640` sheet is asserted separately by `popupBottomSheetAtMobile`, which is `true` in all four failing cells today and must stay `true` |
| AdminUsersTable's data table, `MantineDataTableToCards` switch, search, role filter | the only edit is a `styles` prop on `Tabs` |
| The gate's scope module `scripts/lib/mantine-story-scope.mjs` | `Admin/AdminUsersTable` is enrolled by exact title at `:35-41`; no title changes in this task |

### Required after behavior

| Width | HeroSearch filters trigger | Notification mark-all | Admin users tabs |
|---|---|---|---|
| `<640` | **full-width row**, leading `SlidersHorizontal` icon + localized label + count badge, `min-height >= 44px` | **full-width**, stacked below the title | wrap to 2 lines at 320 where the label needs it; no horizontal overflow in any locale |
| `640–859` | icon-only, content-width — **byte-identical to today** | single row, content-width button — **new** at 390–639, was already this way at `>=640` | unchanged |
| `>=860` | icon + label, content-width — **byte-identical to today** | single row — unchanged | unchanged |

### Positive flow

A visitor on a 375px phone loads `/sq`, sees the Filters button spanning the search card's full width with its
label and its `2` badge, taps it (44px target), applies filters; opens the notification bell, the panel opens as a
bottom sheet and "Shëno të gjitha si të lexuara" spans the sheet; an admin opens `/sq/admin/users` on a 320px phone
and both tabs are fully visible with no horizontal scroll.

### Negative-flow applicability

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | **No** | No form, schema or action changes | N/A | — |
| Authorization/RLS | **No** | No data access path changes; `markAllNotificationsRead` is untouched | N/A | — |
| Offline/network | **No** | No fetch path changes | existing global behavior | — |
| Concurrent writer | **No** | No writes added | N/A | — |
| **Long-translation stress** | **Yes** | The 2 failing AdminUsersTable cells are `sq`/`uk` only | uk and sq wrap rather than overflow at 320 | AC1, all 4 locales at 320 |
| **Zero/empty state** | **Yes** | `MantineCountButton` renders no badge at `count` 0/undefined (`:80-81`); `NotificationCenter` renders no button when `hasUnread` is false (`:28`, `:39`) | the `all read` and `empty` sections of `NotificationBellView.stories.tsx` still render no button, and the gate still reports `fullWidthButtonsAtMobile` for the remaining one | AC6, AC9 |
| **SSR / hydration** | **Yes** | B1 narrows the existing `useMediaQuery` into one range query | server and first client render are unchanged; no React hydration warning | AC9, `npm run check:hydration` |

---

## 8. Acceptance criteria

- **AC1 [R1]** Given the post-fix `--mantine-only` manifest, when the two `Admin/AdminUsersTable/Default` x
  `mobile-320` cells for `sq` and `uk` are read, then `noHorizontalOverflow === true` and
  `visualIntegrity.violations` is `[]` — and the same holds for `en` and `it`.
- **AC2 [R1]** — **RETIRED, superseded by AC2R in Revision 1** (unsatisfiable: the tab strip is
  content-width, so no mechanism that fixes 320 leaves the long-label locales byte-identical elsewhere).
  ~~Given before/after PNG md5s for `Admin/AdminUsersTable/Default`, when compared, then **every**~~
  `mobile-375`, `mobile-390` and `desktop-1024` cell is md5-identical, and every md5 change is at `mobile-320`.
  The changed set is enumerated in the report; it is not summarized as "expected".
- **AC3 [R2]** Given the post-fix manifest, when the 12 `HeroSearch/Default` mobile cells are read, then
  `fullWidthButtonsAtMobile === true` and no `failingButtonLabels` key is present.
- **AC4 [R3]** Given a Playwright/`getComputedStyle` probe of the built Storybook at 320, 375 and 390 x 4 locales,
  when the filters trigger is measured, then it has a non-empty `.mantine-Button-label`, a `[data-position="left"]`
  section, a `.mantine-Badge-root` in its right section, `offsetHeight >= 44`, and
  `offsetWidth >= parentContentWidth - 8`. The probe output is persisted as an artifact.
- **AC5 [R4,R5]** Given before/after PNG md5s for `HeroSearch/Default` **and** `HeroSearch/Fallback`, when compared,
  then all `band-700` and `desktop-1024` cells are md5-identical, and every `Fallback` cell at every viewport is
  md5-identical.
- **AC6 [R6]** Given the post-fix manifest, when the 4 `NotificationBellView/Default` x `mobile-390` cells are read,
  then `fullWidthButtonsAtMobile === true` and `popupBottomSheetAtMobile` is still `true`.
- **AC7 [R7]** Given a computed-style probe at 390 and at 640, when the mark-all button is measured, then at 390 it
  is full-width with the header stacked in a column, and at 640 it is content-width with the header in a row.
- **AC8 [R8]** — **RETIRED, superseded by AC8R in Revision 1** (its zero-diff arm contradicts the
  `toBe(257)` assertion at `css-var-resolvability.test.ts:205`, which reads the real `globals.css`).
  `git diff --stat -- scripts/__tests__/css-var-resolvability.test.ts` is empty.
- **AC9 [R9]** Given `npm run test`, when it completes, then it exits 0, the `MantineCountButton` smoke suite
  contains new cases proving (a) `iconOnlyBelow` alone behaves exactly as before, (b) `iconOnlyAbove` alone has no
  effect, (c) both together collapse only inside the band — and `npm run check:hydration` exits 0.
- **AC10 [R10]** Given `git status --porcelain` at final state, when read, then neither
  `scripts/check-stories-rendered.mjs` nor `.github/workflows/governance-pr.yml` appears, and no path outside §4's
  write set appears.
- **AC11 [R11]** — **superseded by AC11R** (PASS count depends on Revision 1 checkpoint R1).
  ORIGINAL: Given `npm run screenshots:assert -- --mantine-only`, when run to completion, then stdout contains
  `1182/1204 PASS, 0 FAIL` and the process **exits 0**. (`22 AMBIGUOUS` is printed and does not affect the exit
  code — `check-stories-rendered.mjs:1996` gates `exitCode = 1` on `failed > 0` only, and the zero-FAIL branch at
  `:2065-2073` prints `All hard assertions PASSED`.)
- **AC12 [R12]** — **superseded by AC12R** (a +2 `ambiguous-offscreen` delta is permitted).
  ORIGINAL: Given the before and after manifests, when `matrix.filter(c => c.verdict === 'ambiguous')` is
  diffed as a **set**, then `0 added / 0 removed` and the count is 22.
- **AC13 [R13]** Given the §9 plant matrix, when each arm is executed, then each produces the stated observable and
  the restore run returns the fail set to the AC11 state with `git status --porcelain` clean of plant paths.
- **AC14 [R14]** Given `npm run build`, when run last, then it exits **0**, transcript retained.
- **AC15 [R15]** Given the three engaged `docs/critical-flow-registry.md` rows, when their own authoritative
  commands are run, then all three exit 0: `npm run test:header-hydration-id-parity` (row 33, the NotificationBell
  SSR-shell chain this task edits inside), `npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx`
  (row 45), and row 50's full command set — which includes
  `src/components/shared/__tests__/heroSearch.smoke.test.tsx`, whose `:47` case forces `MantineCountButton`'s
  below-threshold branch and must still pass **unchanged**, proving `iconOnlyAbove` is additive.

---

## 9. Plant matrix — which arm consumes which input

Every plant is reverted before final verification. For each, record the pre-plant `git hash-object` of the touched
file and its absence from `git status --porcelain` afterwards.

| # | Plant | Consumed by | Required observable | Why this arm exists |
|---:|---|---|---|---|
| P1a | **RETIRED (Revision 1 §9)** — Remove **both** `whiteSpace: 'normal'` and `minWidth: 0` from the `Tabs` `styles` prop | AC1 | the same **2** cells (`sq`,`uk` x 320) fail with `offscreen-control`, right=360/339 | proves the fix, not the environment, is what turned them green |
| P1b | **RETIRED (Revision 1 §9)** — Remove **only** `minWidth: 0`, keep `whiteSpace: 'normal'` | AC1 | **measure and record** — predicted still green at today's label lengths | states honestly which half is load-bearing; a fix whose second half is never tested is a fix with an untested half |
| P2a | Remove `flex-basis: 100%` from `.filtersControl` | AC3 | the same **12** HeroSearch cells fail with `failingButtonLabels: ["2"]` | proves the CSS, not the prop, carries the width |
| P2b | Remove **only** `iconOnlyAbove={640}`, keep the CSS | AC3, AC4 | the gate stays **green** (0 FAIL) while the button renders full-width **icon-only** | **the important arm.** It proves the gate cannot see D-3's label requirement, so AC4's DOM probe — not the gate — is the only control over the owner's actual decision. Report this explicitly. |
| P3a | Restore `notification-compact:` on both lines of `NotificationCenter.tsx` | AC6 | the same **4** cells x `mobile-390` fail with `failingButtonLabels: ["Mark all as read"]` (locale-translated) | proves the threshold move, not an unrelated reflow, cleared them |
| P3b | Set the button to `w-auto` with no responsive prefix | AC6 | all **12** NotificationBellView mobile cells fail | a broader arm confirming the assertion reaches 320/375 too, which P3a alone cannot show |

---

## 10. QA profile and required evidence

**`Q3 Full Visual Matrix`** — `docs/qa-profiles.md`. It applies because this is high-risk responsive work on
migrated Mantine surfaces whose proof path is the CI-blocking rendered gate, and because a canonical pattern
(`MantineCountButton`) changes for all consumers. It is **not** promoted to `Q4`: `Q4`'s trigger is a change **to** `docs/critical-flow-registry.md`, and this task does not edit that file; there is no auth/RLS/write path
and no data-loss risk. **Three registry rows are nonetheless engaged by file** — 33, 45 and 50 — so
`CLAUDE.md`'s standing requirement applies independently of the profile letter: their own authoritative commands
are mandatory evidence (AC15). Rows 39 and 46 are inspected and not engaged; see the rule ledger for the positive
evidence.

Required evidence, all persisted under `.screenshots/task749-evidence/`:

1. **BEFORE** `--mantine-only` full run + its `manifest.json` path, captured on the unmodified tree.
2. **AFTER** run + manifest, with the fail-set **diff as a set** against the 18-cell baseline (D37 form, the shape
   of `docs/reviews/artifacts/2026-08-14-task741-review/screenshots-assert-mantineonly-failset-diff.txt`).
3. Per-story PNG md5 tables for AC2 and AC5.
4. The AC4 and AC7 computed-style probe outputs, 4 locales, every named width.
5. All six plant transcripts with their restore proofs.
6. Zero-exit transcripts for `npm run build`, `npm run test`, `npm run typecheck`, `npm run lint`,
   `npm run check:hydration`, `npm run check:design-tokens`, `npm run check:css-vars`, `npm run check:mojibake`,
   `npm run check:i18n`, `npm run check:assertion-liveness`, `npm run check:locale-leak:mantine-only`,
   `npm run check:story-coverage`.
7. The three critical-flow regression transcripts required by AC15.

**Per-story viewport warning (`docs/qa-profiles.md`, "Per-story viewport sets are not uniform"):** read each
story's widths out of the manifest. `HeroSearch` is the only story with `band-700`
(`check-stories-rendered.mjs:418-419`), and it is keyed by **component**, so it applies to **both** `Default` and
`Fallback` — 8 band-700 cells, not 4. Do not infer coverage from the union of viewports in the run.

---

## 11. Verification plan — exact commands, in order

```
git status --porcelain                                   # baseline, before any edit
npm run build-storybook
npm run screenshots:assert -- --mantine-only             # BEFORE: expect 18 FAIL, exit 1
#   … implement 6.A, 6.B, 6.C …
npm run typecheck
npm run lint
npm run test
npm run check:hydration
npm run test:header-hydration-id-parity                  # critical-flow registry row 33
npx vitest run src/components/admin/__tests__/AdminUsersTable.smoke.test.tsx          # row 45
npx vitest run src/components/shared/__tests__/heroSearch.smoke.test.tsx              # row 50 (see the row for its full set)
npm run build-storybook
npm run screenshots:assert -- --mantine-only             # AFTER: expect 0 FAIL, exit 0
npm run check:assertion-liveness
npm run check:locale-leak:mantine-only
npm run check:story-coverage
npm run check:design-tokens
npm run check:css-vars
npm run check:mojibake
npm run check:i18n
grep -rn "notification-compact" src/                     # expect 0 matches
git status --porcelain                                   # expect only §4's write set
npm run build                                            # hard gate, last, exit 0
```

A failed or unrun `npm run build` permits only `PARTIALLY IMPLEMENTED` or `BLOCKED`.

---

## 12. Pre-read bundle (exact, not "all docs")

- `docs/agent-contract.md` — clause 11 (mobile full-width), clause 16a/16c.
- `docs/mantine-responsive-design-system.md` — §6.1 spacing, `:622` ResponsiveActionFooter row.
- `docs/tailadmin-style-reference.md` — only if any visual chrome value is questioned. None is expected to change.
- `docs/storybook-governance.md` §14.9.28 (Task 724/724R/726 adjudication) — **and note its `:1842` row is wrong**,
  see §3.3 C.
- `docs/qa-profiles.md`.
- `docs/critical-flow-registry.md` rows **33**, **45**, **50** — the three flows this write set touches, and their
  authoritative commands. Rows 39 and 46 are inspected and not engaged; the reasons are in the rule ledger.
- `tasks/Sprints/Sprint_53_kickoff_prompt_Task_724R_FullWidthButtons_Revision.md:145` (V4, the decision D-2
  supersedes) and `Sprint_44_kickoff_prompt_Task_593_NotificationCenterMarkAllButtonAlignment.md`.
- `scripts/check-stories-rendered.mjs:393-419`, `:489`, `:1230-1317`, `:1996`, `:2065-2073` — read-only.
- `scripts/lib/mantine-story-scope.mjs` — read-only.

---

## 13. Completion-report contract

Report, in this order: changed files with `git hash-object` before/after · completed requirement IDs R1–R14 ·
every command run with its **actual** exit code and the quoted result line · evidence paths · the AC2/AC5 md5
tables in full · the six plant transcripts · assumptions · deviations · limitations · unresolved issues ·
**the two findings this kickoff hands you rather than asks you to fix**: (i) `check-stories-rendered.mjs:1226-1229`
claims a collapsed `MantineCountButton` renders no `.mantine-Button-label`, which
`@mantine/core/esm/components/Button/Button.mjs:128` contradicts; (ii) `docs/storybook-governance.md:1842` records
Task 724's `NotificationCenter` retarget as landed, and `git log --all` shows it never was.

Final status is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. **Never
self-approve.** Update `docs/backlog.md` with concise state and write
`docs/sessions/2026-08-15-task749-rendered-proof-mobile-remediation.md`.

---

## 14. Handoff

Execute from this saved path using `.claude/skills/execute-task/SKILL.md`. Do not re-derive the owner decisions in
§2 — they are given. If any of them turns out to be unsatisfiable as written, stop and report `BLOCKED` with the
measurement that makes it unsatisfiable; do not substitute a different route, and do not reach for the gate.
