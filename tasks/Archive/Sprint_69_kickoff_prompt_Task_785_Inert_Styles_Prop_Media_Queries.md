# Task 785 — the eleven inert `styles`-prop media queries, and one orphaned label

**Sprint:** 69 · **Priority:** P1 · **QA profile:** **Q3** · **Filed:** 2026-09-04 · **State:** `APPROVED WITH NOTES` — closed 2026-09-04. See §14.

**Executor:** fresh Sonnet via `.claude/skills/execute-task/SKILL.md`. Strongest permitted result is
`IMPLEMENTED — AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git. D69-3 frontend exception:
**no review ledger.**

---

## 1. Mode and task type

`TASK DESIGN` → implementation kickoff. Type: **design-system defect repair** — replacing a CSS mechanism that
emits nothing with the native Mantine mechanism that does, across five canonical patterns.

## 2. Objective, and the risk that defines this task

Task 784 proved empirically that `styles={{ root: { '@media (min-width: …)': { … } } }}` emits **zero** CSS in this
Mantine version — no inline style, no generated class, no `@media` block anywhere (proof:
`docs/sessions/evidence/task784/d69-19-browser/styles-prop-media-query-defect-proof.md`). Two consumers were
repaired under D69-20. **Eleven such blocks remain, across five patterns.**

**Read this before planning anything: this is not dead-code cleanup.** At every one of the eleven sites the inert
rule is paired with a *working* declaration it was meant to override — an inline `style={{ flexDirection: 'column' }}`
or a `fullWidth` prop. Because the override never fires, all five patterns currently render **stacked and
full-width at every width, desktop included**. Repairing them will **turn on layout that has never once applied in
this codebase.** Desktop rendering of admin surfaces, both form patterns, the page header and the empty/loading/error
states *will* change. That is the intent — it restores each component's own documented spec — but it is a visible
behavioural change, not a no-op, and it is why this task is Q3 with a mandatory owner visual matrix.

## 3. Verified context — read at source, do not re-derive

### 3.1 The exact inventory (11 sites, 5 files)

| # | File | Line(s) | Inert rule at ≥ `mobileGate` | Working declaration it was meant to override |
|---|---|---|---|---|
| 1 | `MantineAdminSurfacePattern.tsx` | 85 | `flexDirection: 'row'` on the toolbar `Group` | `style={{ flexDirection: 'column' }}` (:84) |
| 2 | `MantineAdminSurfacePattern.tsx` | 105 | `width: 'auto'` on the Add `Button` | `fullWidth={isMobile}` (:104) |
| 3 | `MantineFormSectionStack.tsx` | 97 | `flexDirection: 'row'`, `alignItems: 'center'` on the actions `Group` | `style={{ flexDirection: 'column' }}` (:96) |
| 4 | `MantineFormSectionStack.tsx` | 105 | `width: 'auto'` on Cancel | `fullWidth` (:104) |
| 5 | `MantineFormSectionStack.tsx` | 114 | `width: 'auto'` on Submit | `fullWidth` (:113) |
| 6 | `MantineTwoColumnForm.tsx` | 97 | `flexDirection: 'row'`, `alignItems: 'center'` on the actions `Group` | `style={{ flexDirection: 'column' }}` (:96) |
| 7 | `MantineTwoColumnForm.tsx` | 105 | `width: 'auto'` on Cancel | `fullWidth` (:104) |
| 8 | `MantineTwoColumnForm.tsx` | 114 | `width: 'auto'` on Submit | `fullWidth` (:113) |
| 9 | `MantinePageHeaderWithActions.tsx` | 66-70 | `width: 'auto'`, `flexDirection: 'row'`, `alignItems: 'center'` on the actions wrapper | the `<sm` full-width/column block above it |
| 10 | `MantineEmptyLoadingErrorState.tsx` | 71 | `width: 'auto'` on the first action `Button` | `width: '100%'` (:70) |
| 11 | `MantineEmptyLoadingErrorState.tsx` | 109 | `width: 'auto'` on the second action `Button` | `width: '100%'` (:108) |

Line numbers are as of `HEAD` `7dd23e90b`. **Re-measure them before editing** — they are a starting point, not an
authority. The authority is the `styles={{ root: { [\`@media (min-width: ${theme.other.mobileGate})\`]: … } } }`
shape itself.

### 3.2 The mechanism, verified at source in the installed `@mantine/core`

1. `core/Box/style-props/parse-style-props/parse-style-props.mjs` — a responsive object emits real rules under
   `` `(min-width: ${theme.breakpoints[breakpoint]})` ``, read from the theme. This is the mechanism that works;
   the `styles` prop object is the one that does not.
2. `components/Flex/flex-props.mjs` — `FLEX_STYLE_PROPS_DATA` routes **`direction`** (`flexDirection`),
   **`align`** (`alignItems`), `justify`, `wrap`, `gap`, `rowGap`, `columnGap` through that same machinery.
   `Flex.mjs:58` passes them as `styleProps`. So `direction`/`align` accept responsive objects.
3. `core/Box/style-props/style-props-data.mjs:35` — **`w`** is a style prop (`{type:"spacing", property:"width"}`),
   so `w={{ base: '100%', sm: 'auto' }}` is expressible.
4. `theme.ts:317` — `breakpoints.sm = '40em'`, **byte-identical** to `theme.other.mobileGate` (`:419`). Every one of
   the eleven sites gates on `mobileGate`, so **`sm` reproduces all eleven conditions exactly.** No new breakpoint,
   no new theme value.

**Every one of the eleven maps to a supported native prop.** There is no site here that needs a CSS module, a raw
literal, or a new token. If the executor believes otherwise at any site, that is a blocker to report, not a licence
to invent one.

### 3.3 `Group` versus `Flex`

`Group` does **not** expose a responsive `direction`. Sites 1, 3, 6 and 9 set `flexDirection`, so they need
`Flex` with `direction={{ base: 'column', sm: 'row' }}` (and `align` where the inert rule set `alignItems`).
This is the exact shape D69-22 shipped for the CTA rows in `MantineListingContactPattern.tsx` — reuse it.
Swapping `Group`→`Flex` must preserve the existing `gap` and any `justify`/`align` the `Group` already had;
`Group`'s default `align` is `center` and its default `wrap` is `wrap`, so state explicitly what each converted
site keeps.

### 3.4 The orphaned label

`MantineListingContactLabels.favoriteAriaAdd` (`MantineListingContactPattern.tsx:39`) is a **required** key with no
consumer in that pattern since D69-25 moved the favorite into `MantineListingDetailPattern`. Complete reference set:
declaration `:39`; supplied by `ListingContactPattern.stories.tsx:34` and `ListingDetailPattern.stories.tsx:168`.
No production file imports either pattern (verified). **Do not delete the i18n key**
`storybook.mantine.card_favorite_aria_add` — it is still used by `DemoFavorite` in the detail story and by card
stories.

## 4. Requirements

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R1** | All eleven inert `styles`-prop media blocks are replaced by native responsive props (`direction`/`align` on `Flex`, `w` on `Button`), gated at `sm`. Zero `styles={{ root: { '@media …' } }}` blocks remain in `src/design-system/mantine/**`. | P0 | AC1 |
| **R2** | Each converted site emits a real `@media (min-width: 40em)` rule, verified in the rendered DOM — not inferred from source. | P0 | AC2 |
| **R3** | Below `sm` every converted site is byte-equivalent in behaviour to today: column direction, full-width controls. The `<640` layout must not change. | P0 | AC3 |
| **R4** | No new theme value, breakpoint, token, CSS module, `design-tokens-allow` marker, allowlist entry, or raw literal. `theme.ts` is untouched. | P0 | AC4 |
| **R5** | `favoriteAriaAdd` is removed from the interface and both story call sites; the shared i18n key is retained. | P2 | AC5 |
| **R6** | No product behaviour outside layout: no route, query, server-action, translation, a11y-name or public prop change beyond R5. `Group`→`Flex` conversions preserve gap/justify/align. | P0 | AC6 |

## 5. Acceptance criteria

- **AC1** — `grep -rn "@media (min-width" src/design-system/mantine/` returns **zero** matches inside a `styles` prop.
- **AC2** — a browser-evidence script (see §7) records, per converted site, the computed property at **375** and at
  **768**: `flex-direction` `column`→`row` for sites 1/3/6/9, and `width` full→auto for the button sites. Expected
  gate read from `theme.ts` at runtime, never hardcoded.
- **AC3** — the same script asserts the `<640` state explicitly at 375; any change there is a regression, not an
  improvement.
- **AC4** — `git diff` shows no `theme.ts` change, no new `.module.css`, no marker/allowlist text;
  `node scripts/check-design-tokens.mjs --strict --scope=mantine` → **0**, exit 0; the global finding set is
  unchanged against `docs/sessions/evidence/task784/global-after-d69-19.log`.
- **AC5** — zero `favoriteAriaAdd` matches in `src/`; `storybook.mantine.card_favorite_aria_add` still present in
  `messages/` and still used by the detail story's `DemoFavorite`; `typecheck` exit 0.
- **AC6** — the diff touches only the five patterns plus the two stories for R5.

## 6. Negative-flow applicability

| Branch | Applicable | Reason |
|---|---|---|
| Below-gate (<640) unchanged | **Yes** | R3/AC3 — the whole risk is that turning the rule on also disturbs mobile |
| Longest locale (uk/sq) at the gate | **Yes** | auto-width buttons must not clip or overflow once they stop being full-width |
| `Group`→`Flex` default drift | **Yes** | `Group` defaults `align:center`/`wrap:wrap`; `Flex` does not — state what each site keeps |
| `MantineAdminSurfacePattern`'s `isMobile` | **Yes** | site 2 pairs `fullWidth={isMobile}` (JS) with the CSS rule — decide one mechanism, do not stack both |
| `EmptyLoadingErrorState` loading/error/empty variants | Yes | sites 10/11 are in two different branches |
| Data / auth / RLS | No | no data or permission surface is touched |

## 7. Verification plan — Windows-native PowerShell only

Build a dedicated evidence script, `scripts/task785-inert-media-evidence.mjs`, on the proven shape of
`scripts/task784-d69-19-browser-evidence.mjs` (static server over `storybook-static`, named per-check records,
expectations read from `theme.ts` at runtime, `results.json` + screenshots retained). Prove each converted site in
its existing canonical story — all five exist: `AdminSurfacePattern`, `FormSectionStack`, `TwoColumnForm`,
`PageHeaderWithActions`, `EmptyLoadingErrorState` under `src/stories/patterns/mantine/`.

```powershell
node.exe -p process.platform
node scripts/check-design-tokens.mjs --strict --scope=mantine
npm.cmd run check:design-tokens
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run build-storybook
node scripts/task785-inert-media-evidence.mjs
npm.cmd run build
```

Record working directory, exact command and real exit code for each (per Note 18 §5a, read `EXIT_CODE` from inside
the log, never a wrapper's). `npm run build` exit 0 is the non-Q0 hard gate. Retain everything under
`docs/sessions/evidence/task785/`.

**`OWNER VISUAL QA REQUIRED`** — mandatory, because desktop layout changes for all five. The owner alone marks each
tuple accepted or returned; no automated result substitutes:

| Story | Locale | Viewport |
|---|---|---|
| `Patterns/Mantine/AdminSurfacePattern` | en, uk | 375, 768, 1280 |
| `Patterns/Mantine/FormSectionStack` | en, uk | 375, 768, 1280 |
| `Patterns/Mantine/TwoColumnForm` | en, uk | 375, 768, 1280 |
| `Patterns/Mantine/PageHeaderWithActions` | en, uk | 375, 768, 1280 |
| `Patterns/Mantine/EmptyLoadingErrorState` | en, uk | 375, 768, 1280 |

## 8. Completion report contract

Files changed · requirement IDs completed · a per-site table (site #, file, old inert rule, new prop, computed
before/after at 375 and 768) · commands run with actual results · the `results.json` · assumptions · deviations ·
known limitations · anything left open.

## 9. Task quality gate

| Question | Required answer |
|---|---|
| Is the mechanism proven before being required? | Yes — §3.2, read from the installed package, not assumed. |
| Could this pass while the CSS still does not fire? | No — AC2 asserts computed values in a real browser at two widths. |
| Is the `<640` state protected? | Yes — R3/AC3 make it a named regression, not an afterthought. |
| Does any site need a new value? | No — `sm` ≡ `mobileGate`; every property maps to a native prop. |
| Is the visible consequence acknowledged? | Yes — §2 states plainly that desktop layout changes for all five. |


---

## 10. Review 2026-09-04 — `PARTIALLY VERIFIED`, and a correction to this kickoff

### 10.1 AC6 was wrong. The scope is ratified; the criterion is corrected.

The executor asked (session log §12.1) whether the extra paths are in scope or whether AC6 is incomplete. **AC6 was
incomplete, and the defect is the orchestrator's.** Three ways:

1. **AC6 contradicted R1/AC1.** R1 says "zero `styles={{root:{'@media …'}}}` blocks remain in
   `src/design-system/mantine/**`" and AC1 is a directory-wide grep. AC6 then said the diff may touch only five
   named files. Those cannot both hold. R1/AC1 governs.
2. **§3.1's inventory was incomplete: 13 sites in 6 files, not 11 in 5.** `MantineResponsiveActionFooter.tsx`
   carried 2 blocks at `HEAD` (`git show HEAD:…` → lines 53, 70). They were missed because they use the **raw
   `'@media (min-width: 40em)'` string literal**, not the `${theme.other.mobileGate}` template form — so the sweep
   that produced §3.1, which searched for the template shape across a hand-listed set of five consumers inherited
   from Task 784's session log, could not see them. **The kickoff enumerated by assumption where its own AC1 told
   the executor to enumerate by grep.** Eighth recorded occurrence of "the kickoff's own measured facts are not
   exempt", and this one was written the same day it was executed.
3. **AC6 forgot R5's own file.** `favoriteAriaAdd` is declared in `MantineListingContactPattern.tsx` — a sixth
   pattern — so R5 could never be satisfied inside "five patterns plus two stories".

`EmptyLoadingErrorState.stories.tsx` is likewise ratified: §7 requires each site proven in its canonical story, and
that story never wired `onAction`, so sites 10/11 rendered no button at all. Fixing the story is the precondition
of the evidence §7 demands, not scope creep.

**AC6 is corrected to read:** *the diff touches only `src/design-system/mantine/patterns/**` files containing an
inert block, the pattern declaring `favoriteAriaAdd`, and the canonical stories required to render the converted
sites.* Against that, the diff is exactly in scope.

### 10.2 Answers to the other two questions

**§12.2 — the `alignSelf` fix.** The scoped single-Button override is correct and is preferred over widening the
`Stack`'s `align`. `Stack` defaults to `align: 'stretch'`, which stretches a flex item whose cross-size is `auto`;
opting one item out with `align-self` is the minimal correct fix, and changing the container would alter the sibling
description `Text`. The asymmetry is also right: site 11 needed no override and did not get one — its measurements
(79.06px in a 145.25px container at 640) prove it. Applying it only where measurement showed it was needed is the
right discipline.

**§12.3 — locale evidence.** Correct reading. The script covers widths; the locale dimension is reserved for the
owner matrix, which includes `uk`. That is where a regression would surface, since auto-width buttons with long
`uk`/`sq` labels are exactly the case full-width was hiding.

### 10.3 Verified

R1/AC1 (zero inert blocks remain; the four surviving `@media` hits are in real `.css` files, where they work) ·
R2/AC2 (26/26, **639 vs 640** one-pixel boundary per site — the gate is proven to fire at exactly `breakpoints.sm`,
and the script **throws** if `breakpoints.sm !== other.mobileGate` rather than trusting the kickoff's premise) ·
R3/AC3 (the 639 arm is asserted for every site, so the `<640` state is protected by measurement, not assumption) ·
R4/AC4 (`theme.ts` untouched; scoped detector 0 exit 0; the global 64-finding set **diffed byte-identical** to
`task784/global-after-d69-19.log`) · R5/AC5 (zero `favoriteAriaAdd` in `src/`, `card_favorite_aria_add` retained) ·
R6 (no behaviour change beyond the intended layout restoration).

All gates exit 0 (`i2` exit 1 is the global detector, expected). Windows-native execution established by the session
log's command table (`node.exe -p process.platform` → `win32`) and corroborated by `C:/Claude_Code_Projects` paths
throughout the transcripts.

### 10.4 Outstanding — owner only

**`OWNER VISUAL QA REQUIRED`** (§7): five stories × `en`/`uk` × 375/768/1280. Mandatory, because this task turns on
desktop layout that has never applied. **Add `Patterns/Mantine/ResponsiveActionFooter`** to that matrix — it was
discovered after the matrix was written and its two sites changed with the rest.

### 10.5 Notes (P3, non-blocking)

- The platform receipt is recorded inline in the session log's command table rather than retained as its own
  transcript. Substance satisfied; retain it as a file next time.
- `empty-error-action-width-{639,640}.png` appear in the evidence directory but correspond to no check in
  `results.json` — most likely artifacts of the first (failing) evidence run. Harmless; remove or label on the next
  touch so the directory maps 1:1 to the check set.


---

## 11. Owner visual pass, 2026-09-04 — 3 accepted, 3 returned

| Story | Result |
|---|---|
| `AdminSurfacePattern` | ✅ **ACCEPTED** |
| `EmptyLoadingErrorState` | ✅ **ACCEPTED** |
| `ResponsiveActionFooter` | ✅ **ACCEPTED** |
| `FormSectionStack` | ❌ **RETURNED** — actions sit hard left at desktop; on mobile they run wider than the inset form fields |
| `TwoColumnForm` | ❌ **RETURNED** — no side gutter, content flush to the viewport edge |
| `PageHeaderWithActions` | ❌ **RETURNED** — no side gutter, content flush to the viewport edge |

### 11.1 Attribution — checked per item, not assumed

**Only one of the four observations is Task 785's.**

| Observation | Attribution | Evidence |
|---|---|---|
| `FormSectionStack` actions **left-aligned at ≥640** | **785's, and a faithful one** | The dead rule declared only `flexDirection: 'row'` + `alignItems: 'center'` — **no `justify`**. Restoring it exactly yields `flex-start`. Nobody could see this before, because the rule never fired. The declaration was incomplete; 785 reproduced it correctly. |
| `FormSectionStack` mobile buttons **wider than the fields** | **Pre-existing, structural** | Sections are `<Paper p="md">`; the actions `Flex` is their **sibling** in the outer unpadded `<Stack gap="lg">`. At `HEAD` those buttons were also full-width in that same unpadded slot. 785 changed nothing below 640 — AC3 measured `btnWidth 639 === containerWidth 639` both before and after. |
| `TwoColumnForm` **no side gutter** | **Pre-existing** | Root is `<form><Stack gap="md">` — **byte-identical at `HEAD`**, no horizontal padding either side of this task. The story sets `skipCanvas: true`, which by design bypasses the `.container-wide py-6` decorator (`.storybook/preview.tsx:120-133`). Untouched by 785's diff. |
| `PageHeaderWithActions` **no side gutter** | **Pre-existing** | Root is `<Stack gap="xs" mb="lg">` — byte-identical at `HEAD`. Same `skipCanvas` situation. Untouched by 785's diff. |

### 11.2 Rework in this task — R7 only

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R7** | The `FormSectionStack` and `TwoColumnForm` action rows align to the **end** of the row at `sm` and above, and are unchanged below `sm`. Use `justify` as a responsive style prop on the existing `Flex`; add no wrapper, no padding, no theme value. | P2 | AC7 |

**AC7** — `task785-inert-media-evidence.mjs` gains a check per row asserting computed `justify-content` is
`flex-start` (or its unchanged current value) at **639** and `flex-end` at **640**, gate read from `theme.ts` at
runtime as the existing checks do. All existing checks continue to pass. `TwoColumnForm` is included because it has
the identical actions row and would otherwise diverge from `FormSectionStack` for no reason.

### 11.3 R8 — the `FormSectionStack` mobile inset mismatch

| ID | Requirement | Priority | Verified by |
|---|---|---|---|
| **R8** | In `MantineFormSectionStack`, the actions row is inset to the same horizontal edge as its sections' content, at every width. Use the **same spacing token** the sections already use — they are `<Paper … p="md">` (`:62`), so the row takes `px="md"`. No raw value, no wrapper element, no change to the sections themselves. | P2 | AC8 |

**AC8** — at 375 the action buttons' left and right edges align (±2px) with the inner content edge of a
`<Paper p="md">` section, asserted in `task785-inert-media-evidence.mjs` by measuring both rects; the existing
`btnWidth === containerWidth` full-width check at 639 continues to pass, since the row is still full-width *within
its now-inset container*.

**`MantineTwoColumnForm` is excluded from R8** — verified: it contains **zero** `Paper` elements (its fields sit
directly on the background), so it has no inset to mismatch. R8 applies to `FormSectionStack` alone.

### 11.4 Deferred by owner decision, 2026-09-04 — do not touch

The two **gutter** findings (`TwoColumnForm`, `PageHeaderWithActions` rendering flush to the viewport edge) are
**deferred**. Owner: *"якщо ще немає продакшн-споживача то краще поки що не чіпати ці сторі, пізніше до них
повернемось."* Both are pre-existing, both roots are byte-identical at `HEAD`, and neither pattern has a production
consumer yet — so there is no page shell to infer the gutter convention from, and guessing now risks double padding
once these patterns are wired up. **Do not add padding to those two patterns or their stories in this task.**
Recorded as a deferred owner row in `docs/backlog.md`.

### 11.5 Scope of the rework, and what re-review it needs

R7 + R8 only. No other pattern, story, theme value or mechanism changes. Re-run the full §7 command set — the
production build gate applies again — and re-run the evidence script, which must keep all 26 existing checks green
alongside the new R7/R8 assertions.

**Owner re-review after the rework: `FormSectionStack` and `TwoColumnForm` only.** `AdminSurfacePattern`,
`EmptyLoadingErrorState` and `ResponsiveActionFooter` are accepted and must not be re-run.

**Note on `TwoColumnForm` in R7:** the owner reported the left-alignment against `FormSectionStack`, but
`TwoColumnForm` carries the identical actions row and the same missing `justify`. It is included so the two do not
diverge; strike it if that is not wanted.


---

## 12. Review of the R7+R8 rework, 2026-09-04 — `PARTIALLY VERIFIED`

**R7 `VERIFIED`.** `justify={{ base: 'flex-start', sm: 'flex-end' }}` on both action rows; computed
`justify-content` measured `flex-start` at **639** and `flex-end` at **640** for each, on the same one-pixel
boundary the rest of the suite uses.

**R8 `VERIFIED`, and exactly.** `px="md"` on `FormSectionStack`'s row only. `form-section-stack-inset-375` measures
`paperContentLeft 16 / paperContentRight 359` against `flexContentLeft 16 / flexContentRight 359` — a **0px delta on
both edges**, not merely inside the ±2px tolerance. `TwoColumnForm` correctly did not receive `px` (zero `Paper`
elements — no inset to match).

**The owner's deferral was honoured exactly.** `TwoColumnForm.stories.tsx` and `PageHeaderWithActions.stories.tsx`
are absent from `git status`. No padding was added to those two patterns or their stories.

**31/31 checks, no regressions.** The 26 pre-existing checks still pass alongside the 5 new ones.

**One value moved, and it is not a loosened assertion.** `form-section-stack-*-width-639` now reads
`btnWidth 607 / containerWidth 639` where it read `639 / 639` before R8. The check is a **ratio threshold**
(`>0.55` below the gate, `<0.55` at/above), not an equality: 607/639 = 0.95 passes for the right reason, and the
pre-R8 ratio of 1.0 passes on the identical threshold, so nothing was tuned to accommodate the change. **AC8's own
wording — "the existing `btnWidth === containerWidth` full-width check" — was inaccurate: the orchestrator described
a ratio test as an equality.** Corrected here.

**Gates:** a complete second set (`rework-i0` … `rework-i11`) all exit 0, `i2`/`rework-i2` exit 1 being the global
detector as expected; its finding set **diffed byte-identical** to Task 784's baseline. The platform receipt is now
a **retained file** (`rework-i0-platform.log` → `win32`), closing §10.5's P3 note, and the two orphaned screenshots
are gone, closing the other.

**Outstanding — owner only.** Per §11.5, one re-look at **`FormSectionStack`** and **`TwoColumnForm`** at 375 / 768 /
1280. `AdminSurfacePattern`, `EmptyLoadingErrorState` and `ResponsiveActionFooter` are accepted and untouched by
this diff — do not re-run them.


---

## 13. Owner re-review of the rework, 2026-09-04

| Story | Result |
|---|---|
| `FormSectionStack` | ✅ **ACCEPTED** — R7 right-alignment and R8 inset both confirmed visually |
| `TwoColumnForm` | R7 **accepted implicitly** (buttons right-aligned at 768/1280, stacked at 375 in the owner's captures); **returned for the gutter** — "немає відступів від країв екрану" |

### 13.1 The returned item is the one already deferred

`TwoColumnForm`'s missing side gutter is **not a new finding and not R7/R8's doing**. It is the item the owner
deferred earlier the same day:

> *"якщо ще немає продакшн-споживача то краще поки що не чіпати ці сторі, пізніше до них повернемось."*

Established facts, unchanged since §11.1: the pattern's root (`<form><Stack gap="md">`) is **byte-identical at
`HEAD`** and has never carried horizontal padding; the story sets `skipCanvas: true`, which by design bypasses the
`.container-wide py-6` gutter decorator; neither the pattern nor its story is in 785's diff; and the pattern still
has **no production consumer**, so the fix-location question (pad the story vs pad the pattern) remains
undecidable without guessing.

**This needs one owner word before 785 can close** — either the deferral stands and 785 is approved, or the owner
reverses it and the gutter work is scoped as its own task with the fix location chosen. It is not reworked inside
785 either way: the mechanism repair is complete and independently verified.

**Status:** all six stories now visually accepted except this single deferred-item complaint. Everything R7/R8
touched is accepted.


---

## 14. Verdict — `APPROVED WITH NOTES` (2026-09-04)

Owner confirmed the gutter deferral stands. All six stories are visually accepted; the only outstanding complaint
was the deliberately deferred `TwoColumnForm` gutter, which is neither new nor caused by this task.

**R1-R8 all `VERIFIED`.** Thirteen inert `styles`-prop media blocks across six patterns replaced with native
responsive props; **31/31** rendered checks at a 639-vs-640 one-pixel boundary; the R8 inset measured at a **0px**
edge delta; `theme.ts` untouched; scoped detector 0; the global 64-finding set diffed byte-identical to Task 784's
baseline; a full gate set exit 0 with a retained `win32` receipt.

**Notes carried (P3, non-blocking):** none outstanding — both §10.5 notes were closed in the rework (retained
platform receipt, orphaned screenshots removed).

**Orchestrator defects recorded against this task, for the failure-mode ledger:**
1. §3.1's inventory was incomplete — **13 sites in 6 files, not 11 in 5**. `MantineResponsiveActionFooter.tsx` used
   raw `'@media (min-width: 40em)'` literals rather than the `mobileGate` template form, so a sweep keyed to the
   template shape across a hand-listed set of five files could not see it. The kickoff enumerated by assumption in
   the section whose own AC1 required a directory-wide grep.
2. AC6 contradicted R1/AC1 and forgot that R5's `favoriteAriaAdd` lives in a sixth pattern file.
3. AC8 described the evidence script's **ratio** threshold as a `btnWidth === containerWidth` equality.

All three were caught by the executor and corrected in review, not by a gate.

**Deferred, with its revisit trigger:** the bare-pattern gutters (`TwoColumnForm`, `PageHeaderWithActions`).
Revisit when either pattern gains a production consumer; only then is there a page shell from which to decide
between padding the story and padding the pattern.
