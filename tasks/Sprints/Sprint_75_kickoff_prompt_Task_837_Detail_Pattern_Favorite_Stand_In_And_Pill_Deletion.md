# Task 837 — the detail pattern's Story shows a bordered stand-in where production renders the real borderless FavoriteButton, and the pill shape it also proves has no consumer at all

Sprint 75 · P2 · QA profile **Q3**

**Status: ✅ `APPROVED` 2026-09-18 (Opus review 4, Revision 1 / run3) — archived in `docs/backlog-archive.md`.
Owner accepted the §16.5 and §13.4 visual tuples 2026-09-18 (*"Візуально підтвержую - все ок."*).** (Filed `READY FOR
SONNET` 2026-09-17; review 2 `PARTIALLY VERIFIED` 2026-09-18; review 3 `NEEDS REVISION` 2026-09-18 → §16.) Independent of every other open Sprint 75 task. Filed by the owner's
visual review of Task 826 (2026-09-17).

## 1. Mode and task type

`IMPLEMENTATION` — one pattern Story's slot fidelity, plus deletion of an unconsumed variant from a migrated Mantine
primitive and every downstream reference to it. Bundle: **Storybook / Visual Proof** (Mantine path) + component
deletion audit (`agent-contract` 9).

## 2. Objective

Make the listing-detail proof surface show what production actually renders, and delete the variant that nothing
renders. Two measured defects: ① `Patterns/Mantine/ListingDetailPattern` fills its behaviour-bearing `favorite` slot
with a hand-rolled `ActionIcon variant="default"` that draws a visible grey border, while every real `FavoriteButton`
render is borderless; ② `FavoriteButton`'s `shape="pill"` branch, its `size` prop, its hardcoded
`bd="1px solid var(--border)"` and the `theme.other.radius.favoritePill` token exist only to serve a consumer that
was removed — no production file renders the pill.

## 3. Verified context — measured 2026-09-17 by the orchestrator

### 3.1 Owner decisions, quoted verbatim with date

- **2026-09-17, on the defect's location:** *"я бачу цей бордер у ListingDetailPattern Story"* and *"вибач, у header
  сайту все ок, проблема лише на сторінці деталей оголошення"* — with a screenshot of
  `Patterns/Mantine/ListingDetailPattern → Default` at Desktop 1440px / GB English showing the bordered heart in the
  badges row. **The site header is explicitly NOT in scope.**
- **2026-09-17, on the pill:** owner selected **"Delete the pill shape"** over keeping it and stripping its hardcode.
- **2026-09-17, binding constraint:** *"задача має бути зроблена без hardcode, канонічно згідно Mantine,
  використовуючи канонічні відступи та токени!"*

### 3.2 Rendered measurement (built `storybook-static`, 1440×900, `locale:en`, computed styles)

| Node | Size | Computed `border-top` |
|---|---|---|
| `ListingDetailPattern/Default` — `DemoFavorite` ×6 | 34×34, radius 12px | `1px solid rgb(152, 162, 179)` — **visible** |
| `FavoriteButton/Default` — pill ×2 | 50×44, radius 18px | `1px solid oklch(0.922 0 0)` — **visible** |
| `FavoriteButton/Default` — icon ×10 (inline, overlay, bare) | 32×32, radius 9999px | `1px solid rgba(0, 0, 0, 0)` — transparent |
| `ListingCard/Default`, `ListingCardPattern/Default` — real button | 32×32, radius 9999px | `1px solid rgba(0, 0, 0, 0)` — transparent |
| `ListingDetailView/ArchivedListing` — real button, disabled | 32×32, radius 9999px | `1px solid rgba(0, 0, 0, 0)` — transparent |
| `HeaderView/Default` — header heart (`HeaderActions.tsx:37-45`) | 44×44, radius 8px | `1px solid rgba(0, 0, 0, 0)` — transparent |

`FACT` — the visible border exists on exactly two node classes: the `DemoFavorite` stand-in and the real component's
pill shape. `INFERENCE` (from the six transparent rows) — no real `FavoriteButton` render carries a visible border on
any surface, so nothing in production needs a border removed. **Re-measure at I0; do not cite these numbers as final.**

`FACT` — `MantineListingDetailPattern.tsx:164`'s own comment says *"The favorite ActionIcon (size=\"lg\", 42px) is
taller than a Badge"*. The measured stand-in is **34×34**, and after R1 the row renders the real **32×32** button.
The comment is calibrated on a node production never renders, and its number is wrong even for the stand-in.

### 3.3 The stand-in and its precedent

`FACT` — `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx:39-45`:

```tsx
function DemoFavorite({ l }: { l: string }) {
  return (
    <ActionIcon variant="default" size="lg" radius="xl" aria-label={storyT(l, 'storybook.mantine.card_favorite_aria_add')}>
      <Heart size={18} />
    </ActionIcon>
  )
}
```

Assembled into `base.favorite` at `:184` and consumed at `:228`, `:250`, `:272`, `:295`, `:318`, `:340`.

`FACT` — the real node is `ListingDetailView.tsx:248-254`: `<FavoriteButton key="favorite" listingId isFavorited
disabled disabledLabel />` — no `className`, no `overlay`, default `shape='icon'` (`FavoriteButton.tsx:56`).

`FACT` — precedent for the fix already exists in this repo: `ListingCardPattern.stories.tsx:193-194` (Task 656) fills
the same kind of slot with the **real** `FavoriteButton`, and `FavoriteButton.stories.tsx:86` supplies
`AuthContext.Provider` with a signed-in fixture because `FavoriteButton` calls `useAuth()` unconditionally.
`ListingDetailPattern.stories.tsx` currently imports no `AuthContext`.

`FACT` — clause 16c: *"A pattern Story that receives a behavior-bearing node through a slot is not proof for that node
unless it renders the real production component."* `FavoriteButton` is enrolled
(`scripts/mantine-migration-scope.json:73`) and has its own canonical Story, so the stand-in has no remaining
justification.

### 3.4 Pill deletion audit — every live downstream reference (`agent-contract` 9)

| Reference | Path | Disposition |
|---|---|---|
| `shape="pill"` call sites | `FavoriteButton.stories.tsx:153-154` **only** | delete with the pill section |
| `shape` prop + its JSDoc | `FavoriteButton.tsx:22`, `:56` | delete |
| `size` prop (*"Has no effect on icon shape"*) | `FavoriteButton.tsx:24`, `:56` | delete — no call site passes it |
| `PILL_SIZE_MAP` + its comment | `FavoriteButton.tsx:48-55`, `:178` | delete |
| pill branch, `bd`, `radius` | `FavoriteButton.tsx:171-181` | delete |
| `Button` import | `FavoriteButton.tsx:6` | delete if unused after the branch goes |
| `theme.other.radius.favoritePill` | `theme.ts:560` value, `:134` type `radius: Record<'favoritePill', string>` | delete — `git grep other.radius` finds **one** consumer, `FavoriteButton.tsx:179` |
| pill unit test | `FavoriteButton.test.tsx:238-239` — `it('pill shape (ListingContact action row) radius/border match …')`, `renderButton({ shape: 'pill', size: 'lg' })` | delete the test |
| cross-reference comment | `SaveToCollectionButton.tsx:30` — *"Mirrors FavoriteButton.tsx's PILL_SIZE_MAP exactly"* | rewrite self-contained; **do not touch that file's own live pill** |

`FACT` — `ListingContact.tsx` does **not** render `FavoriteButton` at all (zero import hits), and
`git grep -F 'shape="pill"' -- src` outside `src/stories` returns nothing. Task 211 put the pill in that action row
in 2026-05; Task 784 D69-25 / Task 793 re-homed the favorite to the badges row and left the pill unconsumed. Every
other `shape="pill"` hit in the repository is inside an immutable `docs/sessions/` log or a retained evidence
transcript — **do not edit those.**

`CONTRADICTION to record, not to act on` — Task 826's executor reported the pill as *"used in the ListingContact.tsx
action row"* and *"a deliberate Task 653 decision"*. The first half is false at `HEAD`; the second was true when
written and its premise (matching a legacy sibling in that row) no longer exists.

### 3.5 Clause 16d / GR-1 census

`FACT` — `node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineListingDetailPattern.tsx`
→ `GR-1 CENSUS COMPLETE — 8 nodes; tier1 8 migrated+enrolled+story; tier2 0; tier3 0`, exit 0.

`FACT` — the same census on the real consumer `ListingDetailView.tsx` visits 36 nodes and blocks on 16, **all
baselined** in `scripts/surface-census-baseline.json`. `ListingShareButton.tsx` is one of them (`manifest:no`,
`story:no`, baselined under three surface keys) and is **filed as Task 838**; the gallery/dialog/similar/recently-
viewed blocks belong to **794**, **795**, **804** and **834**. None of those 16 is in this task's scope.

`FACT` — the pattern's own census is clean **because the census walks imports**: `favorite` and `share` arrive as
`ReactNode` slot props, so neither the census nor `check:story-coverage` can see which node fills them. That blind
spot is exactly what let this defect ship, and R6 records it.

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | ① owner 2026-09-17 | `ListingDetailPattern.stories.tsx`'s `favorite` slot renders the **real** `FavoriteButton` imported from `@/modules/listings/components/FavoriteButton`, with the `ListingDetailView.tsx:248-254` prop shape only (`listingId`, `isFavorited`, optional `disabled`/`disabledLabel`) — no `className`, no `overlay`, no size/radius/variant override. `DemoFavorite` is deleted. The render is wrapped in `AuthContext.Provider` with a signed-in fixture. | P1 | AC1, AC2, AC6 | Confirmed |
| **R2** | ② owner 2026-09-17 | The pill shape is gone: every row of §3.4 applied, `FavoriteButton` exposes no `shape` or `size` prop, and `theme.other.radius.favoritePill` no longer exists. `FavoriteButton.tsx` renders exactly one branch. | P1 | AC3, AC4 | Confirmed |
| **R3** | 16c | Each of the four remaining `Demo*` nodes in that file (`DemoShare`, `DemoInquiryTrigger`, `DemoReportTrigger`, `DemoSaveToCollection`) is dispositioned in a table in the session log: `real` (renders the production component) or `proven-equal` (a computed-style capture showing identical `variant`-driven border, radius and size against the real component). Any measured mismatch is corrected to the real component's chrome or filed as a numbered follow-up with its measurement. No node is left undecided. | P2 | AC5 | Confirmed |
| **R4** | owner 2026-09-17 | Nothing this task writes introduces a raw dimension, colour, radius or border literal. Every value comes from a Mantine prop or a `theme`/`theme.other` token. No `bd="…"` string and no Tailwind utility class is added. `check:design-tokens:strict` stays at 0. | P2 | AC4, AC7 | Confirmed |
| **R5** | §3.2 · **superseded by R8 (§16)** | ~~The badges-row comment states the measured height and the `align="center"` rule is re-measured; any style change is a separate task.~~ Replaced by R8: the owner decided the style change on 2026-09-18 and it lands in this task. | — | AC10 | Superseded |
| **R6** | Sprint 75 exit criterion 1 | `docs/storybook-governance.md` gains one concise subsection recording the slot blind spot of §3.5: a pattern Story's `ReactNode` slot is invisible to `check:story-coverage` and to `check-surface-census.mjs`, so neither can tell a real child from a hand-rolled stand-in. It either names the detector that would catch it **and** its false-positive boundary, or records in writing why none is worth building. No new gate is built in this task. | P3 | AC8 | Confirmed |
| **R7** | preserve · amended §16 | No production rendering changes **except R8's one alignment value** in `MantineListingDetailPattern.tsx` (owner decision 2026-09-18). `ListingDetailView.tsx`, `ListingCard.tsx`, `SaveToCollectionButton.tsx`'s own pill, `HeaderActions.tsx` and every `messages/*.json` are byte-unchanged except `SaveToCollectionButton.tsx:30`'s comment. | P1 | AC9 | Confirmed |
| **R8** | owner 2026-09-18 (§16) | The badges row's outer `Group` in `MantineListingDetailPattern.tsx` is `align="flex-start"`: the top edge of the favorite/share block equals the top edge of the first row of badges at every width. The D69-27 comment is rewritten to state this decision and the measured consequence. No other style value changes. | P1 | AC10, AC11 | Confirmed |

## 5. Assumptions and open questions

- `ASSUMPTION` — the story's existing `storyT(l, 'storybook.mantine.card_favorite_aria_add')` key becomes unused when
  `DemoFavorite` goes, because the real component supplies its own `aria-label` from `messages/*.json`. **Do not
  delete the key from `messages/*.json`** — verify with `git grep` whether another story still uses it, and record the
  result. A key with zero remaining consumers is a follow-up, not this task's deletion.
- `ASSUMPTION` — the real `FavoriteButton` in a pattern Story needs no `listingId` that resolves against a database;
  the existing stories pass literal fixture ids (`story-9`…). Reuse that idiom.
- `STOP` — if removing `radius: Record<'favoritePill', string>` from `MantineThemeOther` leaves the `radius` record
  empty, delete the record and its type together; if any other key exists, keep the record and delete only the one
  key. Read the type before editing it.

## 6. Pre-read rule bundle

`docs/golden-rules.md` (GR-1, GR-2, GR-3, GR-3a, GR-4) · `docs/agent-contract.md` 9, 13, 14, 16b, 16c, 16d ·
`docs/qa-profiles.md` (Q3) · `docs/mantine-responsive-design-system.md` (Storybook proof path) ·
`docs/tailadmin-style-reference.md` (only if a visual value is questioned) · `docs/storybook-governance.md` (for R6) ·
`src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` (whole file) ·
`src/stories/patterns/mantine/ListingCardPattern.stories.tsx:180-210` (the real-slot precedent) ·
`src/stories/mantine/primitives/FavoriteButton.stories.tsx` (whole file) ·
`src/modules/listings/components/FavoriteButton.tsx` (whole file) ·
`src/modules/listings/components/FavoriteButton.module.css` ·
`src/modules/listings/components/ListingDetailView.tsx:225-260` ·
`src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:60-200` ·
`src/design-system/mantine/theme.ts:125-140` and `:550-570` ·
`src/modules/listings/components/__tests__/FavoriteButton.test.tsx:215-246` ·
`src/modules/listings/components/SaveToCollectionButton.tsx:25-40` · this kickoff.

## 7. Scope

- **Edited:** `src/stories/patterns/mantine/ListingDetailPattern.stories.tsx` ·
  `src/stories/mantine/primitives/FavoriteButton.stories.tsx` ·
  `src/modules/listings/components/FavoriteButton.tsx` ·
  `src/modules/listings/components/__tests__/FavoriteButton.test.tsx` ·
  `src/design-system/mantine/theme.ts` (delete `radius.favoritePill` + its type) ·
  `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` (comment + R8's one `align` value — §16.3) ·
  `src/modules/listings/components/SaveToCollectionButton.tsx` (line 30 comment only) ·
  `docs/storybook-governance.md` (one subsection, R6) · `docs/backlog.md` (837 state line).
- **Written:** `docs/sessions/evidence/task837/*` · `docs/sessions/<date>-task837-*.md`.
- **Review 2 ruling (Opus, 2026-09-18) — AC9 scope.** `scripts/task837-favorite-computed.mjs` is in scope as the
  §13.3 evidence producer: §13.3 required a capture without naming its producer path (a kickoff omission, not an
  executor deviation), the file has no `package.json`/CI entry, and it follows the committed `scripts/taskNNN-*.mjs`
  probe precedent (e.g. `task770-copyid-computed.mjs`). It is staged with the approved implementation.

## 8. Out of scope

`HeaderActions.tsx` and the site header — **the owner explicitly cleared it 2026-09-17** · `ListingContact.tsx` ·
`SaveToCollectionButton`'s own live pill shape, its `PILL_SIZE_MAP` and its `radius="0.75rem"` · `ListingCard.tsx` and
`ListingCard.module.css` (including `.inlineFavorite`'s negative margins — Task 762/770 provenance, already marked) ·
`ListingShareButton`'s enrolment and Story (**Task 838**) · the other 15 baselined census blocks of §3.5 ·
every `docs/sessions/` log and retained evidence transcript · `messages/*.json`.

## 9. Current and required behavior

**Before.** The canonical proof surface for the listing-detail badges row shows a 34×34 grey-bordered rounded-square
heart. Production renders a 32×32 borderless pill-radius heart. The primitive also carries a pill branch, a `size`
prop, a hardcoded border and a theme token that no production file reaches.

**After.** The pattern Story's badges row renders the real `FavoriteButton` in its real prop shape, so the Story and
production agree; `FavoriteButton` has one shape, no hardcoded border, no `size` prop and no orphan token; the
unconsumed pill proof and its test are gone; the blind spot that hid this is written down.

## 10. Implementation requirements

1. **I0** — status snapshot, `git hash-object` of all eight edited files, and a re-measure of §3.2's border table and
   §3.4's reference counts. If any differs, stop and report `BLOCKED` with the new measurement rather than
   implementing against this kickoff's numbers.
2. Edit through Node UTF-8 I/O (`readFileSync`/`writeFileSync`) — never PowerShell `Get-Content -Raw` without
   `-Encoding utf8` (Task 818/819 corollary).
3. Delete before adding: remove the pill branch first, run `typecheck`, and let the compiler enumerate the dangling
   references rather than hand-hunting them.
4. R1's new slot content copies the `ListingCardPattern.stories.tsx:180-210` idiom exactly — the same
   `AuthContext.Provider` fixture shape, no new fixture module.
5. No new Storybook page, title or export: R1 edits the existing `Patterns/Mantine/ListingDetailPattern` and R2
   removes a section from the existing `Mantine/Primitives/FavoriteButton`. Emit the `GR-3a STORY PREFLIGHT` receipt
   with decision `EXTEND` for the first and `REUSE` for the second.

## 11. Positive and negative flows

**Positive.** Open `Patterns/Mantine/ListingDetailPattern → Default` at 1440: the badges-row heart is the real
32×32 borderless button, visually identical to the one in `Mantine/Primitives/FavoriteButton`'s fourth section.

| Negative flow | Applicable | Expected |
|---|---|---|
| Unauthenticated context | Yes | `FavoriteButton` calls `useAuth()` unconditionally; without the provider the Story throws. The provider is required, not optional — assert the Story renders in all four locales. |
| Disabled/closed listing | Yes | At least one section renders `disabled` + `disabledLabel` from `storyT`, matching `ListingDetailView.tsx:238`'s closed/archived/expired branch. |
| Long locale text | Yes | The badges row wraps as it does today at 320/390; `uk` is the stress locale. |
| Type-level consumer breakage | Yes | Deleting `shape`/`size` must surface as a `typecheck` error anywhere they are still passed; zero errors after §3.4 is applied. |
| Concurrent writer / RLS / offline | No | No data path, no network call, no write. |

## 12. Acceptance criteria

- **AC1 [R1]** — Given `ListingDetailPattern.stories.tsx`, when `git grep -n "DemoFavorite" -- src` runs, then it
  returns nothing, and the file statically imports `FavoriteButton` from
  `@/modules/listings/components/FavoriteButton`. Quote the import line and the slot assignment.
- **AC2 [R1]** — Given the rendered `patterns-mantine-listingdetailpattern--default` at 1440×900 `en`, when the
  badges-row heart's computed style is captured, then `border-top-color` is fully transparent, `width`/`height` are
  32px and `border-top-left-radius` is 9999px — identical to the same capture on
  `mantine-primitives-favoritebutton--default`'s bare icon. Retain both captures.
- **AC3 [R2]** — Given the repository, when `git grep -n -F 'shape="pill"' -- src` and
  `git grep -n -F 'PILL_SIZE_MAP' -- src/modules/listings/components/FavoriteButton.tsx` and
  `git grep -n -F 'favoritePill' -- src` run, then all three return nothing. Quote all three.
- **AC4 [R2, R4]** — Given `FavoriteButton.tsx`, when read after the change, then it contains no `bd=` attribute, no
  `Button` import, exactly one `return` of a rendered element in the component body, and no raw px/rem literal.
  Quote the final render.
- **AC5 [R3]** — Given the session log, when its `Demo*` disposition table is read, then each of the four nodes has
  `real` or `proven-equal` with a retained computed-style capture path, and every mismatch names its correction or
  its filed follow-up number.
- **AC6 [R1, R5]** — **Superseded by AC10 (§16).**
- **AC7 [R4]** — Given the gate block, when `npm run check:design-tokens:strict` runs, then it exits 0 with
  `0 violations`.
- **AC8 [R6]** — Given `docs/storybook-governance.md`, when the new subsection is read, then it names both gates, the
  exact slot mechanism that hides a stand-in, and either a detector with its false-positive boundary or the written
  reason none is worth building.
- **AC9 [R7]** — Given `git diff --stat`, when read, then the only changed paths are §7's, `ListingDetailView.tsx`
  and `ListingCard.tsx` appear nowhere, and `SaveToCollectionButton.tsx`'s diff is one comment hunk.

`GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: AC3's three zero-hit greps are the
deletion's definition (§3.4 enumerates every live reference, and session logs are excluded by path), and AC9's
byte-unchanged claim is scoped to two named files with a diff as its witness.`

## 13. QA profile and verification plan

**`Q3`** — a migrated Mantine primitive loses a public variant and prop, and two canonical Stories change what they
render. `docs/qa-profiles.md` puts "new or migrated Mantine primitive" and "Storybook governance" at Q3.

### 13.1 Baseline

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object src/stories/patterns/mantine/ListingDetailPattern.stories.tsx src/stories/mantine/primitives/FavoriteButton.stories.tsx src/modules/listings/components/FavoriteButton.tsx src/modules/listings/components/__tests__/FavoriteButton.test.tsx src/design-system/mantine/theme.ts src/design-system/mantine/patterns/MantineListingDetailPattern.tsx src/modules/listings/components/SaveToCollectionButton.tsx docs/storybook-governance.md
git --no-optional-locks grep -n -F 'shape="pill"' -- src
git --no-optional-locks grep -n -F 'favoritePill' -- src
git --no-optional-locks grep -n other.radius -- src
```

Expected: `win32`; the three greps reproduce §3.4 exactly (2 story hits, 3 token hits, 1 consumer). Any difference is
`BLOCKED`.

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run check:pattern-enrolment
npm.cmd run check:rendered-scope
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -- src/modules/listings/components/__tests__/FavoriteButton.test.tsx
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
node.exe scripts\check-surface-census.mjs --surface src\design-system\mantine\patterns\MantineListingDetailPattern.tsx
git --no-optional-locks grep -n -F 'shape="pill"' -- src
git --no-optional-locks grep -n -F 'PILL_SIZE_MAP' -- src/modules/listings/components/FavoriteButton.tsx
git --no-optional-locks grep -n -F 'favoritePill' -- src
git --no-optional-locks grep -n -F 'DemoFavorite' -- src
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/stories/patterns/mantine/ListingDetailPattern.stories.tsx src/stories/mantine/primitives/FavoriteButton.stories.tsx src/modules/listings/components/FavoriteButton.tsx src/modules/listings/components/__tests__/FavoriteButton.test.tsx src/design-system/mantine/theme.ts src/design-system/mantine/patterns/MantineListingDetailPattern.tsx src/modules/listings/components/SaveToCollectionButton.tsx docs/storybook-governance.md docs/backlog.md
```

Expected: every `npm`/`node` command exits 0; the census prints `GR-1 CENSUS COMPLETE … 8 nodes`; the four `git grep`
lines print nothing and exit 1. **`check:locale-leak:mantine-only` is expected to exit 1 on pre-existing debt** — it
was already red at 167 leaks before this task (Task 836 owns the detector and the contamination). Required evidence is
not a zero exit but a diff: **no leak whose `storyId` is `patterns-mantine-listingdetailpattern--default` or
`mantine-primitives-favoritebutton--default` may be new relative to the I0 run.** Run it **after**
`build-storybook`, never concurrently — the static directory must not change under it (Task 836). Each command gets
its own unpiped transcript with `EXIT_CODE=`.

### 13.3 Rendered computed-style capture (AC2, AC5)

Capture, at 1440×900 and 390×844, `locale:en` and `uk`, for `patterns-mantine-listingdetailpattern--default` and
`mantine-primitives-favoritebutton--default`: every heart-bearing `button`/`a`, with `width`, `height`,
`border-top-width`, `border-top-style`, `border-top-color`, `border-top-left-radius`, `background-color` and
`box-shadow`. Serve the built `storybook-static` over a local static server and guard against the manager-fallback
render (assert no `#storybook-explorer-tree` in the document — Task 836's failure mode). Retain the raw JSON.

### 13.4 Owner visual review — `OWNER VISUAL QA REQUIRED`

| Story | State | Widths | Locales | Owner checks |
|---|---|---|---|---|
| `patterns-mantine-listingdetailpattern--default` | badges row, after R1 | 320, 390, 1440 | en, uk | the heart has **no** border, matches the card/detail heart, sits aligned with the badges and the share icon, nothing overlaps |
| `mantine-primitives-favoritebutton--default` | after the pill section is removed | 390, 1440 | en, uk | three sections remain, all borderless; nothing left behind where the pill was |

`320` is `uk` only (Q2 mandatory cell carried into Q3); `390`/`1440` are both locales. Ten tuples total.
**Revision 1:** the first row's tuples were returned by the owner on 2026-09-18. They are re-reviewed under §16.5.

## 14. Completion report contract

Files with before/after hashes · R1-R7 · AC1-AC9 with quotes · every command with its exit code and transcript path ·
§3.2/§3.4 I0 re-measure results · the §13.3 raw capture paths · the R3 `Demo*` disposition table · the
`storybook.mantine.card_favorite_aria_add` key-consumer result · assumptions · deviations · limitations · the §13.4
matrix handed to the owner. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED`. No self-approval, no mutating git, no `git push`.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Is any new Story markup a probe? | No. R1 replaces a stand-in with the real in-scope production consumer (`ListingDetailView.tsx:248-254`); R2 **removes** markup. No new page, title or export. |
| GR-1 / 16d? | Census run at design time: the pattern is 8/8 enrolled+storied, exit 0. The real consumer's 16 blocking nodes are all baselined and belong to 794/795/804/834/838 — none in scope. Slot nodes are invisible to the census, which is R6's subject. |
| GR-2? | `check:story-coverage` cannot see slot contents; AC2's computed-style capture, not the gate, closes R1. |
| GR-3? | `FavoriteButton` ← `src/stories/mantine/primitives/FavoriteButton.stories.tsx` (direct import, retained). |
| GR-3a? | No creation: `EXTEND` the existing pattern Story, `REUSE` the existing primitive Story. Receipt required at execution. |
| GR-4? | §12's audit line. |
| Owner decisions? | All three quoted verbatim with dates in §3.1. The task is not its own authorization. |
| Deletion audit? | §3.4 enumerates every live reference including the unit test and the orphan theme token; session logs are excluded by path. |
| Hardcode rule? | R4 + AC4 + AC7 make it observable; the deletion itself removes the repository's one `bd="…"` on this component. |

## Appendix — rule-compliance ledger and execution contract

| Rule | Mandatory outcome | Evidence | Result |
|---|---|---|---|
| `agent-contract` 16c | the pattern Story renders the real component in its slot | R1, AC1, AC2 | COMPLIANT |
| `agent-contract` 16b | no local style invented; the real component owns its chrome | R1, R4 | COMPLIANT |
| `agent-contract` 9 | deletion audits every live downstream reference and runs its gates | §3.4, AC3, §13.2 | COMPLIANT |
| `agent-contract` 14 | UTF-8 writes, no BOM/mojibake, hash witnesses | §10.2, §13.2 | COMPLIANT |
| GR-1 / 16d | census at design time and execution | §3.5, §13.2 | COMPLIANT |
| owner rule 2026-09-03 | owner visual matrix, no `screenshots:assert` | §13.4 | COMPLIANT |
| owner rule 2026-09-17 | no hardcode, canonical Mantine, canonical tokens | R4, AC4, AC7 | COMPLIANT |

| Checkpoint | Producer / artifact | Comparator / failure |
|---|---|---|
| 0 I0 | hashes + §3.2/§3.4 re-measure | any drift from this kickoff → `BLOCKED` |
| 1 pill removed | `typecheck` | any dangling `shape`/`size`/`favoritePill` reference → fix before proceeding |
| 2 slot replaced | §13.3 capture | heart border not transparent, or size ≠ 32px → revise |
| 3 final | §13.2 | any non-zero except the four greps and the pre-existing locale-leak → not `IMPLEMENTED` |
| 4 owner | §13.4 | any returned tuple → `NEEDS REVISION` |
| 5 Revision 1 | §16.4 run3 | AC10/AC11 fail, any §13.2 command non-zero (except the pre-existing locale-leak), or a new leak on either target story → not `IMPLEMENTED` |

## 16. Revision 1 — top-aligned favorite/share block (owner decision 2026-09-18, review 3)

### 16.1 Owner decision, quoted with date

- **2026-09-18, returning the §13.4 badges-row tuples:** *"FavoriteButton тепер без рамки, це супер. Але на
  стоірнці ListingDetail кнопка "Додати в обране" вирівнюється вертикально по центру, а має бути завжди зверху,
  тобто на рівні першого рядку badges"*.
- **2026-09-18, choosing between two bounded options:** owner selected **"Верхні краї врівень"** —
  `align="flex-start"`: the top of the heart equals the top of the first row of badges at every width. The owner
  accepted the measured consequence: the 32px icon's centre sits about 5px below the centre of a ~22px badge row.
  The rejected option was to centre the icon on the first row with a token-computed offset.
- This **supersedes Task 784 D69-27** (owner visual review 2026-09-04, `align="center"`). The `FavoriteButton` border
  result was accepted by the same owner message (*"FavoriteButton тепер без рамки, це супер"*).

### 16.2 Verified context (Opus, 2026-09-18)

`FACT` — `src/design-system/mantine/patterns/MantineListingDetailPattern.tsx:174`:
`<Group justify="space-between" wrap="nowrap" align="center">` is the only alignment value on the row. Its inner
badges `Group` (`gap="xs" wrap="wrap"`) and the icons `Group` (`gap="xs" wrap="nowrap"`) have no `align` of their own.
The comment at `:163-172` documents D69-27 and Task 837 R5.

`FACT` — the favorite and share icons are 32px (`theme.other.iconSize.prominent`, `theme.ts:501`). A `sm` Badge is
the theme default (`theme.ts:872`). Re-measure the Badge height at run3; do not cite ~22px as final.

`FACT` — `scripts/task784-d69-19-browser-evidence.mjs:532-550` still asserts the D69-27 centre line. It is retained
evidence from Task 784 and is not wired to `package.json` or CI (`git grep` shows only comment references from
`task781r2`/`task785`). **Do not edit or run it.** Its centre-line check is superseded by §16.1, and this section is
the record of that.

`FACT` — the pattern is rendered in production by `ListingDetailView.tsx`, so R8 changes `/listings/[slug]`. This is
the only production rendering change the task makes.

### 16.3 Required change (the whole write set for Revision 1)

1. `MantineListingDetailPattern.tsx:174` — `align="center"` → `align="flex-start"`. Change no other attribute,
   element, prop or value in that file.
2. The same file's `:163-172` comment is rewritten in about 4-6 lines. It says that Task 837 Revision 1 (owner
   decision 2026-09-18) supersedes D69-27. It gives the rule: the tops are flush with the first badge row at every
   width, including when the badges wrap. It states the measured run3 icon and badge heights, and the centre offset
   the owner accepted.
3. `scripts/task837-favorite-computed.mjs` is extended so that, for every
   `patterns-mantine-listingdetailpattern--default` cell, it records for each badges row: `firstBadgeTop`,
   `firstBadgeHeight`, `favoriteTop`, `shareTop` (`getBoundingClientRect()`, CSS px), and a `badgeRows` count
   derived from distinct Badge `top` values. It also adds the **320×800 `uk`** viewport cell for this story only.
   The AC2 fields stay unchanged. Guard the capture so it **fails** a cell that finds no Badge or no favorite in a
   badges row.
4. Session log: a new `## Revision 1 — run3` section, plus Files Changed and evidence rows. `docs/backlog.md`: the
   837 state line.

No other file. `ListingDetailView.tsx`, both Story files, `FavoriteButton.tsx`, `theme.ts` and the test are not
touched by Revision 1.

### 16.4 Acceptance criteria and verification

- **AC10 [R8]** — Given `git diff src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` relative to
  `HEAD`, when read, then the only non-comment change is `align="center"` → `align="flex-start"` on the badges-row
  outer `Group`. Quote the hunk.
- **AC11 [R8]** — Given `runs/run3/favorite-computed.json`, when each badges row of
  `patterns-mantine-listingdetailpattern--default` is read at 1440×900 (en, uk), 390×844 (en, uk) and 320×800 (uk),
  then `|favoriteTop − firstBadgeTop| < 1` and `|shareTop − firstBadgeTop| < 1` in every row. At least one captured
  cell has `badgeRows ≥ 2`, which proves the wrapped case; if none wraps, report it rather than inventing a fixture.
  AC2's 32×32 / transparent / 9999px values are unchanged.
- **Re-entry:** `remediation`. Keep run1 and run2 artifacts. Number the new transcripts from `40-` under
  `docs/sessions/evidence/task837/`, with a `-run3` suffix. Write the capture to `runs/run3/`, never to `run1`/`run2`.
- **Gate block:** re-run all of §13.2 as run3, in its stated order, after the edit. Add
  `git --no-optional-locks diff -- src/design-system/mantine/patterns/MantineListingDetailPattern.tsx` and include
  `scripts/task837-favorite-computed.mjs` in the final `hash-object` line. Then run
  `node.exe scripts\task837-favorite-computed.mjs run3` after `build-storybook` and before
  `check:locale-leak:mantine-only`. Write every redirect through Node or with `-Encoding utf8` (no BOM — review 2's
  run2 deviation). Record `node.exe -p "process.platform + ' ' + process.version"` as the first transcript.
- **Locale leak:** no new leak on either target story relative to run2's `32-check-locale-leak-run2.txt`.

### 16.5 Owner visual matrix after Revision 1 (replaces §13.4's badges-row rows)

| Story | State | Widths | Locales | Owner checks |
|---|---|---|---|---|
| `patterns-mantine-listingdetailpattern--default` | badges row, after R8 | 320, 390, 1440 | en, uk (320: uk only) | the heart and share tops are flush with the first badge row; when the badges wrap, the icons stay beside the first row; no border; nothing overlaps |

`mantine-primitives-favoritebutton--default`'s four tuples from §13.4 still need an explicit owner result. Revision 1
does not change that Story.

### 16.6 Revision quality gate

`GR-1` — pattern census 8/8 at review 2; Revision 1 adds no import. Re-run it in the run3 block. · `GR-3a` — no
Story write in Revision 1. · `GR-4 AC AUDIT — 2 new criteria; each states an observable property; absolutes: AC11's
< 1px is a sub-pixel rounding bound on an equality that flex-start guarantees, and AC10's "only non-comment change"
is scoped to one file with its diff as the witness.` · Hardcode rule (§3.1) — one Mantine `align` keyword, no value.
