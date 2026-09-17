# Task 826 — Task 821's Stories carry a false allowlist claim and cite a call site they never render; one Task 822 comment names the wrong task

Sprint 75 · P3 · QA profile **Q2**

**Status: ✅ `APPROVED WITH NOTES` — review 1, 2026-09-17. Archived in `docs/backlog-archive.md`.**

Review 1 outcome (Opus, 2026-09-17): R1-R4 and AC1/AC2 are `VERIFIED` against source and the real diff; AC3's four
named commands exit 0 with `git hash-object` values equal to the shipped files. The §13.3 owner visual matrix was
**accepted by the owner on 2026-09-17** (all four tuples: 390/1440 × en/uk). Two notes, neither a code defect:

1. **Kickoff defect, mine — §13.2 required a gate that was already red.** `check:locale-leak:mantine-only` exits 1,
   and the pre-edit run at the same mode/scope (`.screenshots/locale-leak/2026-09-17T16-05`) is already **167**
   leaks, so the block's "every command exits 0" expectation was unsatisfiable when written. No acceptance criterion
   depends on that artifact (AC3 names only `check:stories`, `check:story-coverage`,
   `check:design-tokens:strict`, `build-storybook`), and this diff provably cannot add a leak: the new caption
   contains `×` (global allowlist `/[→←×÷]/`, `check-locale-leak.mjs:129`) and the four state captions start
   lowercase (`/^\.|^[a-z]/`, `:131`). Not an executor deviation.
2. **The retained locale-leak artifact is contaminated; its clean re-run belongs to Task 836, not here.**
   `.screenshots/locale-leak/2026-09-17T18-23/report.json` (392 leaks) came from a run whose `storybook-static/` was
   rewritten by `npm run build-storybook` mid-scan, so **225** of its 392 leaks are Storybook **manager chrome**
   collected through the static server's `index.html` fallback (`check-locale-leak.mjs:270-284`; HTTP 200, so the
   `catch { continue }` guard never fires) — the whole delta from 167 is `CopyIdButton` 0→210 and `CountButton`
   3→18. Session-log §5.5 calls all 392 pre-existing debt; that characterisation is wrong for those 225, while its
   conclusion (zero attributable to this diff) holds. The detector defect is Task **836**, which owns both the fix
   and the re-run.

The owner's visual review also surfaced a defect **outside this task's scope**, filed as Task **837**:
`Patterns/Mantine/ListingDetailPattern`'s `DemoFavorite` stand-in (`ActionIcon variant="default" size="lg"`) shows a
bordered 42px heart where production renders the borderless 32px `FavoriteButton`.

## 1. Mode and task type

`IMPLEMENTATION` — two Story files (JSDoc text + one new labelled section) and one source comment. Bundle:
**Storybook / Visual Proof** (Mantine path). No component logic changes.

## 2. Objective

Correct three factual defects carried as review notes: ① both Task 821 Stories claim an `owner: "821"` entry in an
allowlist that has been `[]` since 2026-09-16; ② `FavoriteButton.stories.tsx` says it reproduces
`ListingDetailView`'s call site but never renders it; ③ `ListingsShell.tsx`'s new comment attributes Task 822's code to
Task 782 and points at an ambiguous `page.tsx`. The Stories and the comment must say only what is true, and the cited
call site must be rendered.

## 3. Verified context — measured 2026-09-17 on `HEAD` `c177a0920`

`FACT` — `scripts/rendered-scope-allowlist.json` is `[]`. The owner decision of 2026-09-16 (Task 821 kickoff §16,
archive row 2026-09-16 Task 821) removed both entries after both components were enrolled.

`FACT` — `scripts/mantine-migration-scope.json:72-73` enrols `ListingFeatureIcon.tsx` and `FavoriteButton.tsx`.

`FACT` — ① `src/stories/mantine/primitives/FavoriteButton.stories.tsx:11-12` and
`src/stories/mantine/primitives/ListingFeatureIcon.stories.tsx:9-10` JSDoc: "agent-contract 16d tier-3 node;
`owner: "821"` in `scripts/rendered-scope-allowlist.json`".

`FACT` — ② `FavoriteButton.stories.tsx:24-26` JSDoc cites "`ListingDetailView.tsx:248-254` (no className,
`disabledLabel` from `listing.action_disabled_*`)". The real site, `ListingDetailView.tsx:248-254`, is
`<FavoriteButton key="favorite" listingId={effectiveListingId} isFavorited={effectiveIsFavorited} disabled={favoriteDisabled} disabledLabel={favoriteDisabledLabel} />`:
default `shape` (`'icon'`), no `className`, no `overlay`. `favoriteDisabled` is true for closed/archived/expired
listings (`:238`). The Story's sections are: inline with `styles.inlineFavorite` (4 states), `overlay` (2), `pill` (2).
None renders the no-`className` icon form.

`FACT` — ③ `src/modules/listings/components/ListingsShell.tsx:9-11`:
"// Task 782 — used inside next/dynamic's `loading` fallback …; see page.tsx for the `!` rationale". `git log -S` shows
the comment and `theme` import were added by `5ea1e2fe5` (Task 822). The `!` rationale lives at
`src/modules/locations/components/PopularLocationsView.tsx:16` ("the `!` below reflects that runtime guarantee"), which
`src/app/[locale]/page.tsx:17` itself cites.

`FACT` — Story locale helper: `storyT(locale, 'listing.action_disabled_sold')` is already used in `FavoriteButton.stories.tsx`
for `disabledLabel`. Section captions in this file are plain developer-facing `Text size="xs"` strings (existing
convention in the same file).

## 4. Requirements

| ID | Source | Observable requirement | P | Verification | Status |
|---|---|---|---|---|---|
| **R1** | ① | Both JSDoc blocks say the component is enrolled in `scripts/mantine-migration-scope.json` and that its former tier-3 allowlist entry was removed by the 2026-09-16 owner decision. No sentence claims a current allowlist entry. | P2 | AC1 | Confirmed |
| **R2** | ② | `FavoriteButton.stories.tsx` gains one labelled section, "Icon shape, no className (`ListingDetailView.tsx` detail action row)", rendering the real `FavoriteButton` with **no** `className` and **no** `overlay` in 4 states: unsaved/saved × enabled/disabled (`disabledLabel` from `storyT(locale, 'listing.action_disabled_sold')`), each captioned like the existing sections. The JSDoc cite points at this section. | P2 | AC2, AC3 | Confirmed |
| **R3** | ③ | `ListingsShell.tsx:9-11` comment reads Task 822 and points at `src/modules/locations/components/PopularLocationsView.tsx` for the `!` rationale. The statement at `:12` is byte-unchanged. | P3 | AC1 | Confirmed |
| **R4** | preserve | No other Story section, export, title or fixture changes. `ListingFeatureIcon.stories.tsx` changes only its JSDoc. | P2 | AC1 | Confirmed |

## 5. Assumptions and open questions

- No owner decision needed: each item corrects a record against the repository's own state.
- `ASSUMPTION` — no new i18n key is needed. **Stop:** if a caption would need a user-facing translated string, reuse
  the file's existing developer-caption convention. Do not add keys.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` 13, 14, 16c · `docs/qa-profiles.md` (Q2) ·
`docs/mantine-responsive-design-system.md` (Storybook proof path) · both Story files ·
`src/modules/listings/components/FavoriteButton.tsx:1-60` · `ListingDetailView.tsx:230-256` ·
`ListingsShell.tsx:1-25` · `PopularLocationsView.tsx:1-20` · this kickoff.

## 7. Scope

- **Edited:** `src/stories/mantine/primitives/FavoriteButton.stories.tsx` ·
  `src/stories/mantine/primitives/ListingFeatureIcon.stories.tsx` (JSDoc only) ·
  `src/modules/listings/components/ListingsShell.tsx` (comment only) · `docs/backlog.md` (826 state line).
- **Written:** `docs/sessions/evidence/task826/*` · `docs/sessions/<date>-task826-*.md`.

## 8. Out of scope

`FavoriteButton.tsx` · `ListingDetailView.tsx` · allowlists and manifest · every other comment attributed to Task 782.

## 9. Current and required behavior

**Before.** The Stories assert a non-existent allowlist entry and a call site they do not show, and one comment names
the wrong task.
**After.** The record matches the repository, and the detail call site's exact prop shape is visible in Storybook in
all four states.

## 10. Implementation requirements

1. I0: status snapshot and `git hash-object` of the three files.
2. Edit through Node UTF-8 I/O.
3. The new section copies the existing section markup pattern (`Stack` / `Group` / captioned `Stack`) and adds no new
   style values.

## 11. Positive and negative flows

**Positive.** Open `Mantine/Primitives/FavoriteButton → Default`: a fourth section shows the detail-row button in four
states.

| Negative flow | Applicable | Expected |
|---|---|---|
| Disabled state tooltip/label | Yes | `disabledLabel` from `storyT`, in all 4 locales |
| Long locale text | Yes | captions wrap and stay within the row at 390 |
| Auth context | Yes | existing `AuthContext.Provider` wrapper already covers the whole render |

## 12. Acceptance criteria

- **AC1 [R1, R3, R4]** — `git diff` shows: JSDoc-only hunks in `ListingFeatureIcon.stories.tsx`; in
  `FavoriteButton.stories.tsx`, JSDoc hunks plus one added section; in `ListingsShell.tsx`, only lines 9–11.
  `git grep -n "owner: \"821\"" src/stories` returns nothing. Quote both.
- **AC2 [R2]** — the added section contains exactly four `<FavoriteButton` elements, none with `className`, `overlay` or
  `shape` props. Quote the section.
- **AC3 [R2]** — `npm run check:stories`, `npm run check:story-coverage`, `npm run check:design-tokens:strict`,
  `npm run build-storybook` exit 0.

`GR-4 AC AUDIT — 3 criteria; each states an observable property; absolutes: AC2's "none with className" is the call
site's defining prop shape (§3 ②).`

## 13. QA profile and verification plan

**`Q2`** — a Story-only visible addition on a migrated component, plus text corrections.

### 13.1 Baseline

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
git --no-optional-locks status --porcelain
git --no-optional-locks hash-object src/stories/mantine/primitives/FavoriteButton.stories.tsx src/stories/mantine/primitives/ListingFeatureIcon.stories.tsx src/modules/listings/components/ListingsShell.tsx
```

### 13.2 Final gate block

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:design-tokens:strict
npm.cmd run check:locale-leak:mantine-only
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build-storybook
npm.cmd run build
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
git --no-optional-locks grep -n "owner: \"821\"" -- src/stories
git --no-optional-locks diff --stat
git --no-optional-locks hash-object src/stories/mantine/primitives/FavoriteButton.stories.tsx src/stories/mantine/primitives/ListingFeatureIcon.stories.tsx src/modules/listings/components/ListingsShell.tsx docs/backlog.md
```

Expected: every command exits 0, except that `git grep` prints nothing and exits 1. Each command gets its own unpiped
transcript with `EXIT_CODE=`.

### 13.3 Owner visual review — `OWNER VISUAL QA REQUIRED`

| Story | Section | Widths | Locales | Owner checks |
|---|---|---|---|---|
| `mantine-primitives-favoritebutton--default` | new "Icon shape, no className" | 390, 1440 | en, uk | four states distinct (outline/filled heart, disabled look), no overlap, captions readable |

## 14. Completion report contract

Files with hashes · R1–R4 · AC1–AC3 quotes · every command with exit code and path · assumptions · deviations ·
limitations · §13.3 matrix handed over. Status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED` or
`BLOCKED`. No self-approval, no git.

## 15. Task quality gate

| Question | Answer |
|---|---|
| Is the new section a probe? | No. It documents a real in-scope production consumer (`ListingDetailView.tsx:248-254`) that the Story already claims to cover (permanent-story gate: production consumer named). |
| GR-1 / 16d? | No production surface changes. |
| GR-3? | `FavoriteButton` ← `FavoriteButton.stories.tsx` (imports it by name). |

## Appendix — rule-compliance ledger and execution contract

| Rule | Mandatory outcome | Evidence | Result |
|---|---|---|---|
| `agent-contract` 16c | Story renders the real component's real call shape | R2 | COMPLIANT |
| permanent-story gate | named production consumer | §15 | COMPLIANT |
| owner rule 2026-09-03 | owner visual matrix | §13.3 | COMPLIANT |
| `agent-contract` 9 / 14 | build exit 0; encoding-safe writes | §13.2, §10.2 | COMPLIANT |

| Checkpoint | Producer / artifact | Comparator / failure |
|---|---|---|
| 0 I0 | hashes | — |
| 1 edits | `git diff` | hunk outside §7 → revise |
| 2 final | §13.2 | any non-zero (except the grep) → not `IMPLEMENTED` |
