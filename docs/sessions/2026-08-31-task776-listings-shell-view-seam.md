# Session: Task 776 — `/listings`: extract `ListingsShellView` as the pre-migration seam — 2026-08-31

Task path: `tasks/Sprints/Sprint_68_kickoff_prompt_Task_776_Listings_Shell_View_Seam.md`
Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

## Requirement / acceptance-criteria evidence

| AC | Evidence |
|---|---|
| **AC1 [R1]** — `ListingsShell` is the only controller | `grep -nE "useSearchParams\|useAuth\|useExchangeRate\|useState\|sessionStorage\|RESTORE_KEY\|handleBeforeNavigate\|handleShowMore\|handleFavoriteToggled\|requestAnimationFrame\|fetch\(" src/modules/listings/components/ListingsShell.tsx` → all 7 `useState` hooks, `useSearchParams`, `useAuth`, `useExchangeRate`, both `fetch()` call sites, `sessionStorage` get/set/remove under `RESTORE_KEY`, `requestAnimationFrame`, and all three handlers still present (see §4 below). |
| **AC2 [R2]** — `ListingsShellView` only accepts props/slots, no forbidden imports/identifiers, no own state | `grep -nE "fetch\(\|sessionStorage\|useState\|useEffect\|useCallback\|next/navigation\|next/dynamic\|useExchangeRate\|AuthContext" src/modules/listings/components/ListingsShellView.tsx` → `NONE FOUND` (§4 below). |
| **AC3 [R3]** — URL contract, Show-more append, `listings_restore` restore, favorites set, `displayCurrency` resolution, every rendering condition unchanged; no `className`/element order/conditional differs other than by relocation | `git diff -- src/modules/listings/components/ListingsShell.tsx` (§4 below): the removed JSX block (lines 173–268 of the pre-edit file) is reproduced character-for-character inside `ListingsShellView.tsx`, with only identifier renames from local state/handlers to their prop equivalents (`setView`→`onViewChange`, `setFiltersOpen`→`onFiltersOpenChange`, `handleBeforeNavigate`→`onBeforeNavigate`, `handleShowMore`→`onShowMore`, `handleFavoriteToggled`→`onFavoriteToggled`, `allListings`→`listings`, `localFavoriteIds`→`favoriteIds`, `LISTINGS_PER_PAGE`→`perPage`). All derivation logic (`allListings`, `showLoadMore`) and the `displayCurrency` precedence line stay in `ListingsShell.tsx` untouched. |
| **AC4 [R4]** — no path outside §4 changed; `page.tsx` and `mantine-migration-scope.json` absent from diff | `git status --porcelain` → ` M src/modules/listings/components/ListingsShell.tsx` + `?? src/modules/listings/components/ListingsShellView.tsx` (plus this session log, the backlog, and Sprint 68 plan file — all named in §4 of the kickoff). `grep` for both forbidden paths against the status/diff-stat output → `NONE FOUND`. |
| **AC5 [R5]** — all §10 checks green with transcript + exit code | §3 below. |

## Current versus required behavior

**Before:** `ListingsShell.tsx` (270 lines) was both controller and view — it declared `useSearchParams`, `useAuth`,
`useExchangeRate`, all 7 `useState` hooks, the `sessionStorage` restore/save logic, `handleShowMore`'s
`fetch('/api/listings?...')`, and rendered ~95 lines of JSX (filter bar, filters Sheet, status tabs, active-filter
chips, sort bar, save-search button, empty state, listing grid/list, show-more button, pagination) directly.

**After:** `ListingsShell.tsx` is a pure controller: it owns every hook/effect/handler from the kickoff's §5 table
and renders `<ListingsShellView ... />` with 21 props (data, view state, callbacks, two slots). `ListingsShellView.tsx`
is new: a presentational component that receives all data/state via props, renders the identical JSX tree, and
declares no state, no data-fetching hook, and no `next/navigation`/`next/dynamic` import.

**Positive flow (identical before/after, verified by inspection since this is a zero-rendered-delta refactor
per the kickoff's Q1 profile — see "Applicability" note below):** `/listings` renders with two pages of results →
grid/list toggle drives `view` state → filter sheet open/close drives `filtersOpen` → Show more appends a page via
`onShowMore`/`handleShowMore` → favorite toggle flips a card via `onFavoriteToggled`/`handleFavoriteToggled` →
navigate into a listing writes `sessionStorage` via `onBeforeNavigate`/`handleBeforeNavigate` → return restores
scroll position and loaded-more state via the untouched mount-effect in `ListingsShell.tsx`.

**Negative-flow applicability (per kickoff §8 — reproduced, not re-derived):**

| Branch | Applicable? | Reason | Expected |
|---|---:|---|---|
| Validation | No | No form, schema or user input added/moved | N/A |
| Authorization / RLS | No | `useAuth` stays in the container; no data-access change | N/A |
| Offline / network | No | Both `fetch()` call sites move zero lines, same `catch {}` / `finally` | Existing behavior, unchanged |
| Concurrent writer | No | No write path | N/A |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/listings/components/ListingsShell.tsx` | Reduced to a pure controller: removed the presentational JSX and its direct imports (`ListingsFilterBar`, `Sheet`/`SheetContent`, `ListingsStatusTabs`, `ActiveFilterChips`, `ListingsSortBar`, `ListingCard`, `ListingsPagination`, `Button`, `Loader2`, `useTranslations`/`t`), added the `ListingsShellView` import, and now renders `<ListingsShellView>` with the 21 required props/slots. |
| `src/modules/listings/components/ListingsShellView.tsx` (new) | Presentational primitive per the container/presentational split (`docs/component-rules.md`): reproduces the moved JSX verbatim, declares its own local `Location` interface (per `ListingsFilterBar.tsx:20` convention), exports `ListingsShellViewProps`, and calls `useTranslations('listing')` (authorized by the split rule for i18n). |
| `tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md` | Updated the Tasks table row for 776 from `KICKOFF FILED` to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` and added the session-log pointer. |
| `docs/backlog.md` | Updated "Last Session", the Sprint 68 one-line summary, and the 776 registry row to the new status; added the session-log pointer. |
| `docs/sessions/2026-08-31-task776-listings-shell-view-seam.md` (new) | This session log. |

## Validation evidence

Platform receipt: `node.exe -p process.platform` → `win32`. `node.exe -v` → `v22.22.3`. cwd:
`C:\Claude_Code_Projects\lero-al`. All commands run natively in Windows PowerShell 5.1 from the project root, evidence
captured unpiped to a scratch file with `Out-File`, followed by a separate `"EXIT_CODE=$LASTEXITCODE"` append line
(per the executor evidence-capture rule), then read back with `Get-Content`.

**Note on evidence-capture path (self-correction during this session):** the first capture attempt wrote transcripts
under `docs/sessions/_tmp_*.txt` using `Out-File -Encoding utf8`, which on PowerShell 5.1 emits a UTF-8 **BOM**. Those
untracked scratch files were then picked up by `check:file-integrity` (which scans git-changed + untracked files) and
correctly failed on the stray BOM. The three `_tmp_*.txt` files were deleted (they were session scratch, not task
output) and all evidence was recaptured to the session's scratch directory outside the repository. The two actual
task files (`ListingsShell.tsx`, `ListingsShellView.tsx`) were never affected — `check:file-integrity` on them passed
cleanly once the scratch files were removed from the scanned set. See §3 evidence below.

```powershell
> npx.cmd eslint src/modules/listings/components/ListingsShell.tsx src/modules/listings/components/ListingsShellView.tsx
(no output)
EXIT_CODE=0
```

```powershell
> npm.cmd run typecheck
> lero-al@0.1.0 typecheck
> tsc --noEmit

EXIT_CODE=0
```

```powershell
> npm.cmd run check:file-integrity
> lero-al@0.1.0 check:file-integrity
> node scripts/check-file-integrity.mjs

🔍  check:file-integrity — git-changed + untracked (default)
    Checking 2 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation

✅  check:file-integrity PASSED — all 2 file(s) clean
EXIT_CODE=0
```

```powershell
> npm.cmd run check:mojibake
> lero-al@0.1.0 check:mojibake
> node scripts/check-mojibake.mjs

check:mojibake — scanning 3464 text file(s), tracked and untracked-not-ignored, under docs/ src/ app/ components/ modules/ messages/ tasks/ scripts/ + root *.md

check:mojibake: 0 artifacts in 3464 files
EXIT_CODE=0
```

```powershell
> npm.cmd run build
...
 ✓ Compiled successfully in 48s
   Checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (40/40)
   Finalizing page optimization ...
   Collecting build traces ...
├ ƒ /[locale]/listings                   18.3 kB         663 kB
...
EXIT_CODE=0
```

```powershell
> git diff --check
(no output)
EXIT_CODE=0
```

**Pass 2 — final, after every artifact exists (per `docs/ai-behavior.md` step 5a):**

```powershell
> git status --porcelain
 M docs/backlog.md
 M src/modules/listings/components/ListingsShell.tsx
 M tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md
?? docs/sessions/2026-08-31-task776-listings-shell-view-seam.md
?? src/modules/listings/components/ListingsShellView.tsx

> npm.cmd run check:file-integrity
🔍  check:file-integrity — git-changed + untracked (default)
    Checking 5 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation
✅  check:file-integrity PASSED — all 5 file(s) clean
EXIT_CODE=0

> npm.cmd run check:mojibake
check:mojibake — scanning 3461 text file(s), tracked and untracked-not-ignored, under docs/ src/ app/ components/ modules/ messages/ tasks/ scripts/ + root *.md
check:mojibake: 0 artifacts in 3461 files
EXIT_CODE=0
```

The 5 files counted by `check:file-integrity` match the 5 paths in `git status --porcelain` exactly — the path set is
final and reconciled. (The mojibake file count dropped from 3464 in the Pass-1 run to 3461 here because the Pass-1
run still counted the three now-deleted `docs/sessions/_tmp_*.txt` scratch files described above; both counts are 0
artifacts either way.)

## AC1/AC2 grep evidence (both files)

```
$ grep -nE "fetch\(|sessionStorage|useState|useEffect|useCallback|next/navigation|next/dynamic|useExchangeRate|AuthContext" src/modules/listings/components/ListingsShellView.tsx
NONE FOUND

$ grep -nE "useSearchParams|useAuth|useExchangeRate|useState|sessionStorage|RESTORE_KEY|handleBeforeNavigate|handleShowMore|handleFavoriteToggled|requestAnimationFrame|fetch\(" src/modules/listings/components/ListingsShell.tsx
3:import { useState, useEffect, useCallback } from 'react'
4:import { useSearchParams } from 'next/navigation'
23:import { useExchangeRate } from '@/hooks/useExchangeRate'
24:import { useAuth } from '@/modules/auth/context/AuthContext'
32:const RESTORE_KEY = 'listings_restore'
51:  const searchParams = useSearchParams()
52:  const { rates } = useExchangeRate()
53:  const { user } = useAuth()
58:  const [localFavoriteIds, setLocalFavoriteIds] = useState<ReadonlySet<string>>(
66:  const handleFavoriteToggled = useCallback((listingId: string, newState: boolean) => {
75:  const [view, setView] = useState<'grid' | 'list'>('grid')
76:  const [filtersOpen, setFiltersOpen] = useState(false)
77:  const [extraListings, setExtraListings] = useState<CardListingData[]>([])
78:  const [loadedExtraPage, setLoadedExtraPage] = useState(0)
79:  const [isLoadingMore, setIsLoadingMore] = useState(false)
80:  const [scrollTargetSlug, setScrollTargetSlug] = useState<string | null>(null)
93:  // On mount: restore position from sessionStorage if returning from a listing
96:      const raw = sessionStorage.getItem(RESTORE_KEY)
99:      sessionStorage.removeItem(RESTORE_KEY)
108:            const res = await fetch(`/api/listings?${params.toString()}`)
125:    requestAnimationFrame(() => {
131:  function handleBeforeNavigate(slug: string) {
133:      sessionStorage.setItem(RESTORE_KEY, JSON.stringify({
141:  async function handleShowMore() {
148:      const res = await fetch(`/api/listings?${params.toString()}`)
182:      onShowMore={handleShowMore}
183:      onBeforeNavigate={handleBeforeNavigate}
184:      onFavoriteToggled={handleFavoriteToggled}
```

`eslint-disable-line react-hooks/exhaustive-deps` (kickoff §5, was line 127) confirmed still attached to its effect
at `ListingsShell.tsx:118`.

## Visual source trace

| Visible artifact/state | Component/markup | Class/selector | Change or preserve | Evidence |
|---|---|---|---|---|
| Outer shell wrapper | `<div className="listings-shell flex flex-col gap-0">` | relocated verbatim | Relocation only | `git diff` §3 — identical string in `ListingsShellView.tsx` |
| Filters Sheet panel | `<SheetContent className="w-80 max-w-[90vw] overflow-y-auto p-5">` | relocated verbatim | Relocation only | same |
| Toolbar row | `<div className="flex items-center gap-2">` / `<div className="flex-1 min-w-0">` | relocated verbatim | Relocation only | same |
| Empty state block | `py-24 gap-4 text-center`, `h-16 w-16 rounded-2xl bg-muted`, `font-semibold text-lg`, `text-muted-foreground text-sm mt-1` | relocated verbatim | Relocation only | same |
| Grid/list class switch | `'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 pt-5'` vs `'flex flex-col gap-3 pt-5'` | relocated verbatim, same ternary | Relocation only | same |
| Show-more button | `Button variant="outline" size="lg" className="min-w-48 rounded-xl"`, `Loader2 className="h-4 w-4 animate-spin mr-2"` | relocated verbatim | Relocation only | same |
| `ListingsSortBar`, `ListingsPagination`, `ListingsFilterBar`, `ListingsStatusTabs`, `ActiveFilterChips`, `ListingCard` call sites | untouched components, moved call sites only | N/A — no className changed on these consumers | Preserve (out of scope per kickoff §7) | not edited; `git diff` shows no changes to those component files |
| `ListingsFilters` inside the Sheet | replaced with `{filtersSlot}`, container still constructs `<ListingsFilters locations={locations} onClose={...} />` unchanged | N/A | Preserve — same element, now passed as a slot instead of inlined | `ListingsShell.tsx:185` |
| `SaveSearchButton` next to sort bar | replaced with `{saveSearchSlot}`, container still constructs `user ? <SaveSearchButton /> : null` unchanged | N/A | Preserve — same conditional, now passed as a slot | `ListingsShell.tsx:186` |

No visible artifact changed; every relocated string was verified against the pre-edit `git diff` hunk shown in §3
of the "Files Changed" section above (removed lines in `ListingsShell.tsx` == added lines in `ListingsShellView.tsx`,
modulo the identifier renames listed in AC3 above).

## Canonical UI decision record

Reproduced from the kickoff (§12), re-verified in this session: no visible artifact changes and no visual value is
introduced — every JSX node and `className` moved verbatim. Searched and inspected: `scripts/mantine-migration-scope.json`
(`ListingsShell` absent — confirmed unchanged, `git status --porcelain` does not list it), `src/modules/listings/components/`
(no `ListingsShell` or `ListingsShellView` story exists or was created; `ListingDetailView.stories.tsx` and
`ListingFormShellView.stories.tsx` are unrelated surfaces, not touched). Disposition: **reuse** — existing markup
preserved, no canonical source needed, no story created.

## Implementation validation notes

No defects found during implementation. One process defect self-corrected: the first evidence-capture attempt wrote
`Out-File -Encoding utf8` transcripts into `docs/sessions/` (a scanned, tracked path), which added a BOM that
`check:file-integrity` correctly flagged. The scratch files were deleted and evidence was recaptured to the session's
scratchpad directory (outside the repo, not scanned by the gate). No implementation file was ever affected — this is
recorded as a limitation of the evidence-capture step in this session, not a defect in the shipped diff.

## Assumptions, deviations, limitations

- No assumptions were required — the kickoff's §2 verified-context table and §5/§6 contracts were followed exactly;
  no ambiguity was encountered.
- No deviation from the kickoff's required `ListingsShellViewProps` shape, prop names, or slot contract.
- **Owner-native handoff required (kickoff §10, "Critical-flow note"):** `docs/critical-flow-registry.md:105`
  registers `/en/listings` under "Hydration / console errors — live public routes" with owner-run coverage. This task
  did not run a booted-server route probe (out of scope per the kickoff — that evidence belongs to Task 775/772).
  Recorded as **MISSING EVIDENCE — owner-native**. Exact command for the owner:
  ```powershell
  $env:BASE_URL="http://localhost:3000"; npm.cmd run check:hydration
  ```
  Expected: PASS on the Listings-en cell, 0 hydration violations.
- No test was added. Per kickoff §4 item 3, the default is no new test since AC1/AC2 are grep-checkable against the
  two files (evidence above) — that boundary held; no test was needed to verify it.

## Opus handoff

Evidence locations: this file (all sections above); diffs live in the working tree
(`git diff -- src/modules/listings/components/ListingsShell.tsx` and `git status --porcelain` for the new
`ListingsShellView.tsx`). Questions/risks for the reviewer to inspect independently:

1. Confirm the AC3 claim by re-running `git diff` and comparing the removed hunk against `ListingsShellView.tsx`
   line-by-line — this session's claim of "character-for-character" relocation should be independently verified,
   not taken from this report.
2. Confirm no `Patterns/Mantine/*` story and no `scripts/mantine-migration-scope.json` entry were introduced
   (kickoff §3.2) — `git status --porcelain` above shows only the two component files changed plus doc/task files.
3. The owner-native `check:hydration` handoff above is unexecuted; it is not part of this task's Q1 gate per the
   kickoff, but the reviewer should confirm it does not block Sprint 68's later slices.

## Backlog update

`docs/backlog.md` updated: "Last Session" block (4 lines), the Sprint 68 one-line summary, and the 776 registry row
— all changed from `KICKOFF FILED` to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a session-log pointer added.
Resulting physical line count: **68 lines** (`wc -l docs/backlog.md`), within the 80-line budget. No
`BACKLOG LIMIT BREACH`.

**Self-validation:** tsc=0 errors · build=passes (exit 0) · AC table=all green · scope=clean (diff limited to
`ListingsShell.tsx` + new `ListingsShellView.tsx` + this session's doc/task-state files) · integrity=PASS ·
mojibake=PASS · git diff --check=clean.
