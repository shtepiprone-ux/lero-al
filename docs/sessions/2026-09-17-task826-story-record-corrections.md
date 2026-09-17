# Session Archive: Task 826 — Story record corrections + ListingDetailView call site — 2026-09-17

## 1. Task path and status

`tasks/Sprints/Sprint_75_kickoff_prompt_Task_826_Task821_Story_Record_Corrections_And_Detail_Call_Site.md`

Status: **`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`**

## 2. Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1 | Both JSDoc blocks say the component is enrolled in `scripts/mantine-migration-scope.json` and that its former tier-3 allowlist entry was removed by the 2026-09-16 owner decision; no sentence claims a current allowlist entry. | `FavoriteButton.stories.tsx:10-14`, `ListingFeatureIcon.stories.tsx:9-12`. `git grep -n "owner: \"821\"" -- src/stories` → no output, exit 1. |
| R2 | `FavoriteButton.stories.tsx` gains one labelled section rendering the real `FavoriteButton` with no `className`/`overlay` in 4 states, captioned like existing sections; JSDoc cites this section. | `FavoriteButton.stories.tsx:157-179` (new section); JSDoc `:22-25` now cites "rendered in the fourth section, \"Icon shape, no className\"". |
| R3 | `ListingsShell.tsx:9-11` comment reads Task 822 and points at `PopularLocationsView.tsx` for the `!` rationale; `:12` byte-unchanged. | `ListingsShell.tsx:9-11` diff below; `:12` outside every diff hunk. |
| R4 | No other Story section/export/title/fixture changes; `ListingFeatureIcon.stories.tsx` changes only its JSDoc. | `git diff` — `ListingFeatureIcon.stories.tsx` hunk is JSDoc lines only (`:9-12`); `FavoriteButton.stories.tsx` hunks are the JSDoc plus one appended `<Stack>`. |

### AC self-audit

| AC (exact text) | Where verified | Result |
|---|---|---|
| AC1 — `git diff` shows JSDoc-only hunks in `ListingFeatureIcon.stories.tsx`; JSDoc + one added section in `FavoriteButton.stories.tsx`; only lines 9–11 in `ListingsShell.tsx`. `git grep -n "owner: \"821\"" src/stories` returns nothing. | §5 diffs below; §5 grep transcript | ✅ |
| AC2 — the added section contains exactly four `<FavoriteButton` elements, none with `className`, `overlay` or `shape` props. | §3 quote below (four elements: `story-9`..`story-12`, only `listingId`/`isFavorited`/`disabled`/`disabledLabel`) | ✅ |
| AC3 — `check:stories`, `check:story-coverage`, `check:design-tokens:strict`, `build-storybook` exit 0. | §5, transcripts `01`, `02`, `03`, `07` — all `EXIT_CODE=0` | ✅ |

## 3. Current versus required behavior

**Before.** Both Stories' JSDoc claimed a live `owner: "821"` entry in `scripts/rendered-scope-allowlist.json` (the file has been `[]` since 2026-09-16). `FavoriteButton.stories.tsx`'s JSDoc claimed its citation of `ListingDetailView.tsx:248-254` (no `className`, no `overlay`, default `shape`) was reproduced by the file's three existing sections; none of them renders that no-`className` icon form. `ListingsShell.tsx:9-11` attributed its comment and `theme` import to Task 782 and pointed at an ambiguous `page.tsx` for the `!` rationale, when `git log -S` shows Task 822 (`5ea1e2fe5`) added them and the rationale lives in `PopularLocationsView.tsx:16`.

**After.** Both JSDoc blocks state the enrolled-in-manifest / allowlist-entry-removed fact accurately. `FavoriteButton.stories.tsx` renders a fourth section, "Icon shape, no className", showing the real `ListingDetailView.tsx:248-254` call shape in 4 states (unsaved/saved × enabled/disabled), and the JSDoc cites that section. `ListingsShell.tsx:9-11` correctly attributes Task 822 and points at `PopularLocationsView.tsx` for the `!` rationale; `:12` is byte-unchanged.

**Negative flows (from kickoff §11):**

| Negative flow | Applicable | Result |
|---|---|---|
| Disabled state tooltip/label | Yes | `disabledLabel={disabledLabel}` where `disabledLabel = storyT(locale, 'listing.action_disabled_sold')` — reuses the same helper/key already used by the file's first section (`:78`). |
| Long locale text | Yes | Captions use the file's existing `Group gap="xl" wrap="wrap"` / `Stack` pattern, which already wraps for the other three sections; no new wrapping behavior introduced. |
| Auth context | Yes | New section is inside the same `<AuthContext.Provider value={MOCK_SIGNED_IN_AUTH}>` that wraps the whole `render` return — unchanged. |

## 4. Files Changed

| File | Rationale |
|---|---|
| `src/stories/mantine/primitives/FavoriteButton.stories.tsx` | JSDoc corrected (R1); new "Icon shape, no className" section added rendering the real `ListingDetailView.tsx:248-254` call shape (R2); JSDoc citation retargeted to that section. |
| `src/stories/mantine/primitives/ListingFeatureIcon.stories.tsx` | JSDoc corrected (R1) — no other change. |
| `src/modules/listings/components/ListingsShell.tsx` | Comment at `:9-11` corrected to attribute Task 822 and cite `PopularLocationsView.tsx` for the `!` rationale (R3); `:12` untouched. |
| `docs/backlog.md` | 826 state line updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (2 in-place edits, net 0 line-count change — file stays at 80 lines). |
| `docs/sessions/evidence/task826/*` | Gate transcripts for this session. |
| `docs/sessions/2026-09-17-task826-story-record-corrections.md` | This session log. |

## 5. Validation evidence

QA profile: **Q2** (Story-only visible addition on a migrated component, plus text corrections — matches kickoff §13).

### 5.1 Baseline (§13.1)

```
node.exe -p process.platform          → win32
git --no-optional-locks status --porcelain   → (clean)
git --no-optional-locks hash-object FavoriteButton.stories.tsx ListingFeatureIcon.stories.tsx ListingsShell.tsx
  → c9558f196e4f1d2359fe6318606f9b785611dfa   (FavoriteButton.stories.tsx, before)
  → 295481528a3163c8eca64d684949f3adb066b9d   (ListingFeatureIcon.stories.tsx, before)
  → 865c7cc698406d39454d9f8cfcce1de825f985f   (ListingsShell.tsx, before)
```

### 5.2 Diffs (AC1)

`ListingsShell.tsx` — only lines 9–11 changed, `:12` untouched:
```diff
-// Task 782 — used inside next/dynamic's `loading` fallback, not a component body proper; see
-// page.tsx for the `!` rationale (createTheme()'s own return type is deep-partial, not this
+// Task 822 — used inside next/dynamic's `loading` fallback, not a component body proper; see
+// PopularLocationsView.tsx for the `!` rationale (createTheme()'s own return type is deep-partial, not this
 // project's runtime guarantee).
 const listingsFiltersSkeletonRowHeight = theme.other!.layout!.listingsFiltersSkeletonRowHeight
```

`ListingFeatureIcon.stories.tsx` — JSDoc-only hunk (`:9-13`), no other change (`git diff --stat` = `12 +++---`, all inside the JSDoc block).

`FavoriteButton.stories.tsx` — JSDoc hunk (`:10-25`) plus one appended `<Stack>` section (`:157-179`); `git diff --stat` = `48 ++++---` (16 deletions, all inside the JSDoc; the rest are new lines for the appended section).

`git grep -n "owner: \"821\"" -- src/stories` → no output, `EXIT_CODE=1` (the expected non-zero result per kickoff §13.2).

### 5.3 New section quote (AC2)

```tsx
<Stack gap="sm">
  <Text size="xs" c="gray.5" fw={500}>
    Icon shape, no className (`ListingDetailView.tsx:248-254` detail action row) —
    default `shape`, no `overlay`, the 4 states: unsaved/saved × enabled/disabled.
  </Text>
  <Group gap="xl" wrap="wrap">
    <Stack gap={4} align="center">
      <FavoriteButton listingId="story-9" isFavorited={false} />
      <Text size="xs" c="dimmed">unsaved, enabled</Text>
    </Stack>
    <Stack gap={4} align="center">
      <FavoriteButton listingId="story-10" isFavorited />
      <Text size="xs" c="dimmed">saved, enabled</Text>
    </Stack>
    <Stack gap={4} align="center">
      <FavoriteButton listingId="story-11" isFavorited={false} disabled disabledLabel={disabledLabel} />
      <Text size="xs" c="dimmed">unsaved, disabled</Text>
    </Stack>
    <Stack gap={4} align="center">
      <FavoriteButton listingId="story-12" isFavorited disabled disabledLabel={disabledLabel} />
      <Text size="xs" c="dimmed">saved, disabled</Text>
    </Stack>
  </Group>
</Stack>
```
Exactly four `<FavoriteButton` elements (`story-9`..`story-12`); props used are only `listingId`, `isFavorited`, `disabled`, `disabledLabel` — none carries `className`, `overlay` or `shape`.

### 5.4 Final gate block (§13.2) — each command, unpiped transcript, own file under `docs/sessions/evidence/task826/`

| # | Command | Exit | Transcript |
|---|---|---|---|
| 1 | `npm run check:stories` | 0 | `01-check-stories.txt` — "149 files checked, 0 violations" |
| 2 | `npm run check:story-coverage` | 0 | `02-check-story-coverage.txt` — "73 covered, 0 enrolled but unproven" |
| 3 | `npm run check:design-tokens:strict` | 0 | `03-check-design-tokens-strict.txt` — "0 violations found" |
| 4 | `npm run check:locale-leak:mantine-only` | **1** | `04-check-locale-leak.txt` — see §5.5, not attributable to this diff |
| 5 | `npm run typecheck` | 0 | `05-typecheck.txt` |
| 6 | `npm run lint` | 0 | `06-lint.txt` — "0 errors, 79 warnings" (pre-existing warnings, none in this diff's files) |
| 7 | `npm run build-storybook` | 0 | `07-build-storybook.txt` — "Storybook build completed successfully" |
| 8 | `npm run build` | 0 | `10-build.txt` — full production build, all routes compiled |
| 9 | `npm run check:file-integrity` | 0 | `08-file-integrity-pass1.txt` (pass 1) / `11-file-integrity-pass2.txt` (pass 2, final path set) |
| 10 | `npm run check:mojibake` | 0 | `09-mojibake-pass1.txt` (pass 1) / `12-mojibake-pass2.txt` (pass 2, final path set) |
| 11 | `git grep -n "owner: \"821\"" -- src/stories` | 1 (expected) | no output |
| 12 | `git diff --stat` | — | §5.2 above |
| 13 | `git hash-object` (final) | — | §5.6 below |

### 5.5 `check:locale-leak:mantine-only` — exit 1, not attributable to this diff

The kickoff's §13.2 expects this command to exit 0. It exits 1 with 392 total leaks across 142 scanned stories. I traced every leak against this task's diff using the report at `.screenshots/locale-leak/2026-09-17T18-23/report.json`:

- Filtering leaks by `storyId` for the two edited stories (`mantine-primitives-favoritebutton--default`, `mantine-primitives-listingfeatureicon--default`) returns 9 matches. All 9 are captions this diff did not touch — the pre-existing "Icon shape, `overlay`..." caption, the pre-existing "Pill shape..." caption, and `ListingFeatureIcon`'s pre-existing top caption — confirmed outside every hunk in `git diff`.
- Filtering leaks by token text unique to this task's new section (`"no className"`, `"248-254"`, `"4 states: unsaved"`, the four state captions) returns 0 matches.
- The remaining 383 leaks are on stories this task never opened: `Admin/AdminUsersTable/Default`, `Patterns/Mantine/ListingDetailView/Default`'s Leaflet map chrome (already tracked pre-existing in `docs/backlog.md` task **798**, filed by Task 791's review), `Patterns/Mantine/ListingsPageFrame/Default`, `Patterns/Mantine/SaveSearchButton/Pending`, and others.

Conclusion: this gate's non-zero exit predates and is independent of this task's 3-file diff. Full trace in `04-check-locale-leak.txt`. **I am not asserting this is fine to ship** — that call belongs to Opus; I am reporting the measured attribution so the review does not have to re-derive it.

### 5.6 Final hash-object (post-implementation)

```
git --no-optional-locks hash-object FavoriteButton.stories.tsx ListingFeatureIcon.stories.tsx ListingsShell.tsx docs/backlog.md
  → (recorded in 13-final-hash.txt, captured after this log and the backlog edit both exist on disk)
```

## 6. Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, token path | Change or preserve | Evidence |
|---|---|---|---|---|---|
| `FavoriteButton` icon shape, no `className`, 4 states (unsaved/saved × enabled/disabled) | `FavoriteButton.tsx:160-169` — `ActionIcon variant="subtle"` | `styles.control` (`FavoriteButton.module.css`) + `[data-favorited]`/`[data-fav-disabled]`/`[data-pending]` attribute selectors | Mantine `ActionIcon` unlayered CSS; `theme.other.iconSize.prominent`; `radius="pill"` — all internal to the production component, no local override | **Render new (Story addition only — no source-component change)** | `FavoriteButton.tsx:160-169`; call site `ListingDetailView.tsx:247-255` |
| `FavoriteButton` inline/overlay/pill sections (pre-existing) | `FavoriteButton.stories.tsx:83-152` | unchanged | unchanged | **Preserve — byte-unchanged, outside every diff hunk** | `git diff` shows no hunk in these lines |
| `ListingFeatureIcon` rows (pre-existing) | `ListingFeatureIcon.stories.tsx:38-64` | unchanged | unchanged | **Preserve — JSDoc-only edit** | `git diff` |
| `ListingsShell.tsx` skeleton fallback | non-visual comment/import change only | n/a | n/a | **Preserve — comment text only, `theme.other!.layout!...` expression byte-unchanged** | `git diff` §5.2 |

## 7. Canonical UI decision record

| Artifact | Search queries + inspected paths | Canonical story/source | Disposition | Shared style/token path + registration |
|---|---|---|---|---|
| `FavoriteButton` icon shape, no `className` | Component already has its own canonical Story (`FavoriteButton.stories.tsx`, this file); searched for the production call site at `ListingDetailView.tsx:230-256` | `src/modules/listings/components/FavoriteButton.tsx` (existing production component, `shape='icon'` default path) | `reuse` — no new component, no new style, no local class added | Consumes the real component's own internal Mantine `ActionIcon`/theme tokens directly; no local override, no new registration needed (component already enrolled, `scripts/mantine-migration-scope.json:72-73`) |

## 8. Implementation validation notes

No defects found in the diff itself. One pre-existing, out-of-scope gate finding surfaced during validation: `check:locale-leak:mantine-only` exits 1 for reasons unrelated to this diff (§5.5). No fix was attempted — `ListingDetailView`'s Leaflet chrome and `AdminUsersTable`/`SaveSearchButton` are explicitly out of this task's scope (§8 of the kickoff), and the Leaflet finding is already a filed backlog item (**798**).

## 9. Assumptions, deviations, and limitations

- No new i18n key was needed (kickoff's own `ASSUMPTION`) — the new section reuses `storyT(locale, 'listing.action_disabled_sold')`, already computed once at the top of `render` and already used by the first section; the state captions ("unsaved, enabled", etc.) follow the file's existing plain-`Text` developer-caption convention, not user-facing i18n.
- Limitation: `check:locale-leak:mantine-only` exits 1 (§5.5). Traced and not attributable to this diff; flagged for Opus to decide whether it blocks approval or is accepted as pre-existing debt (consistent with the already-filed **798**).
- No deviation from the kickoff's scope, requirements, or implementation requirements (§10).

## 10. Opus handoff

- Evidence root: `docs/sessions/evidence/task826/` (13 files, listed in §5.4).
- Question for review: is the pre-existing, unattributable `check:locale-leak:mantine-only` failure (§5.5) acceptable for a `Q2` text-correction task, or does it need a companion owner decision/backlog note before `APPROVED`?
- Owner visual matrix required per kickoff §13.3: `mantine-primitives-favoritebutton--default`, new "Icon shape, no className" section, at 390/1440, en/uk — not run by Sonnet (`screenshots:assert` retired, owner decision 2026-09-03).
- Verify independently: the `git diff` hunks in §5.2, the AC2 element count in §5.3, and the `git grep` non-match for `owner: "821"`.

## 11. Backlog update

`docs/backlog.md` edited in place (2 status-word replacements, no lines added or removed): Sprint 75 row and task-registry row 57 now read **826** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` instead of `READY FOR SONNET`, with a pointer to this session log. File remains at **80 lines** (measured before and after edit) — no `BACKLOG LIMIT BREACH`.

## Self-validation

`Self-validation: tsc=0 errors · build=passes · AC table=all green · runtime locale=n/a (Storybook-only text/section change, no route) · scope=clean (3 files edited, all within kickoff §7) · integrity=PASS (pass 1 and pass 2, see §5.4) · check:locale-leak=1, traced non-attributable (§5.5)`
