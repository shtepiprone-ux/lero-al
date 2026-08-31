# Task 776 — `/listings`: extract `ListingsShellView` as the pre-migration seam

**Sprint 68** · **P2** · QA **Q1 Targeted** · Type: **frontend refactor — NOT a Mantine migration**
Executor: fresh Sonnet session via `.claude/skills/execute-task/SKILL.md`. Strongest valid completion status is
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`. No self-approval, no mutating Git.

## 1. Goal

Extract the JSX composition of `ListingsShell.tsx` into a new sibling `ListingsShellView.tsx`, leaving
`ListingsShell` as a pure controller component. **The task must not change DOM output, the URL contract, styles, or
any user-visible behavior.** It creates the seam that every later Sprint 68 slice edits behind, so that a future
Mantine rewrite is a change to one prop-driven view rather than to a 270-line hook container.

Sprint 68 execution-order item 2 names this slice, and its closing note names it as the entry point that carries
**no open owner decision**. It does not touch `D68-1`.

## 2. Verified context — measured 2026-08-31 on a clean worktree

| Fact | Evidence |
|---|---|
| `ListingsShell.tsx` is 270 lines, `'use client'` | `wc -l`, file line 1 |
| Its only production importer is `src/app/[locale]/listings/page.tsx:87`; props are passed positionally by name there | `git grep ListingsShell` |
| `ListingsShellView.tsx` does **not** exist | directory listing |
| No story and no test targets `ListingsShell` | `components/__tests__/` holds 6 files, none for this shell |
| `ListingsShell.tsx` is **not** in `scripts/mantine-migration-scope.json` (only `FeaturedListingsView`, `LatestListingsView`, `ListingsPageFrame`) | file read |
| The container/presentational split is an owner P0 rule | `docs/component-rules.md:34-51` |
| The repo precedent puts `useTranslations` **in the View** | `FeaturedListingsView.tsx:44`, `RecentlyViewedGridView.tsx:33`, `ListingFormShellView.tsx:4` |
| A local `interface Location { id: number; name_al: string; type: string }` is already declared per-file on this route | `ListingsFilterBar.tsx:20` |
| `rates` is `ExchangeRates \| null` from `@/lib/getExchangeRate` | `useExchangeRate.ts:7`, `ListingCard.tsx:47` |

Quoted rule, `docs/component-rules.md:44-48` — this settles the two questions the split usually raises:

> **Boundary:** the container's PUBLIC API (what pages/consumers import) stays unchanged — the split is
> INTERNAL: extract `FooView`, and the container renders `<FooView ... />`. `useTranslations`/`useFormatter`
> (i18n, provided by the global Storybook decorator) MAY live in the presentational primitive — they are not
> data-fetching.

## 3. Binding constraints

1. **No story, and this is rule-derived, not a preference.** The Storybook-First gate
   (`docs/component-rules.md:53-60`) triggers on *a changed rendered result*: "Never change a live surface's
   **appearance or behavior** without a story that renders and proves that exact change." This task's premise is a
   zero rendered delta, so the gate does not fire. **If you find you cannot preserve the rendered result, that
   exemption is void: STOP and report `BLOCKED`.** Do not add a story, and do not proceed with a visual change.
2. **No `Patterns/Mantine/*` title under any circumstance.** `scripts/lib/mantine-story-scope.mjs` makes that title
   an assertion that the component *is* canonical Mantine, and would enrol a shadcn/Tailwind component into
   `screenshots:assert --mantine-only`, `check:locale-leak --mantine-only` and `check:story-coverage`. See Sprint 68
   → "What this sprint deliberately does not inherit", item 2. `scripts/mantine-migration-scope.json` is untouched.
3. **Task 772 owns `ListingsSortBar` and the `SaveSearchButton` row** (`ListingsShell.tsx:193-206`) and forbids
   migration work there. This task moves those two call sites **verbatim**; it does not edit either component.
4. `ListingsShell`'s exported name, its `Props` interface, and its module path stay unchanged.
   `src/app/[locale]/listings/page.tsx` must not appear in the diff.

## 4. Scope — the diff may touch only these paths

1. `src/modules/listings/components/ListingsShell.tsx` — modify.
2. `src/modules/listings/components/ListingsShellView.tsx` — new.
3. A targeted test **only if** the container/view boundary cannot otherwise be verified. Default is **no new test**
   (§10 makes the boundary grep-checkable). If you add one, name it in the report and justify it.
4. This kickoff, the Sprint 68 Tasks table, and `docs/backlog.md` registry row + status.

## 5. Preserved contracts — these must remain in `ListingsShell`

| Contract | Current location |
|---|---|
| `useSearchParams`, `useAuth`, `useExchangeRate` | lines 60-62 |
| `displayCurrency` precedence: URL param → `user.preferred_currency` → `'ALL'` | line 64 |
| All seven `useState` hooks (`localFavoriteIds`, `view`, `filtersOpen`, `extraListings`, `loadedExtraPage`, `isLoadingMore`, `scrollTargetSlug`) | 67, 84-89 |
| Favorite re-sync from SSR + `handleFavoriteToggled` | 71-82 |
| `extraListings` reset keyed on `searchParams.toString()` — **not** on the `listings` prop | 96-100 |
| `sessionStorage` restore under `RESTORE_KEY = 'listings_restore'`, incl. its `page + i` catch-up fetch loop | 40, 103-127 |
| `requestAnimationFrame` scroll-to-slug effect | 130-138 |
| `handleBeforeNavigate` (writes `sessionStorage`) | 140-148 |
| `handleShowMore` (`fetch('/api/listings?...')`, `finally` reset) | 150-167 |
| Derivations `allListings` and `showLoadMore` | 169-170 |
| Both `dynamic()` calls and their `ssr: false` contract — `ListingsFilters` **with its `loading` skeleton fallback**, and `SaveSearchButton` | 12-22, 35-38 |

The `eslint-disable-line react-hooks/exhaustive-deps` on line 127 moves with its effect and stays intact.

## 6. Required shape of `ListingsShellView`

`'use client'` on line 1 (matching `FeaturedListingsView` / `RecentlyViewedGridView`). It declares its own local
`interface Location { id: number; name_al: string; type: string }`, per `ListingsFilterBar.tsx:20`'s existing
convention, and exports its props interface. It calls `useTranslations('listing')` — authorized by the §2 quote —
and after the move `ListingsShell` no longer uses `t`, so its `useTranslations` import and `const t` are removed.

Props, all supplied by the container:

- **Data** — `listings` (already merged `allListings`), `total`, `page`, `perPage`, `locations`, `tab`,
  `activeFiltersCount`, `displayCurrency: string`, `rates: ExchangeRates | null`,
  `favoriteIds: ReadonlySet<string>`.
- **View state** — `view`, `filtersOpen`, `isLoadingMore`, `showLoadMore`.
- **Callbacks** — `onViewChange`, `onFiltersOpenChange`, `onFiltersOpen`, `onShowMore`, `onBeforeNavigate`,
  `onFavoriteToggled(listingId: string, newState: boolean)`.
- **Slots (`ReactNode`)** — `filtersSlot` and `saveSearchSlot`. The container passes
  `filtersSlot={<ListingsFilters locations={locations} onClose={() => setFiltersOpen(false)} />}` and
  `saveSearchSlot={user ? <SaveSearchButton /> : null}`. This is what keeps both `dynamic()` declarations, and
  therefore the `ssr: false` contract and the auth condition, inside the container.

`ListingsShellView` must **not** contain: `fetch`, `sessionStorage`, `useState`, `useEffect`, `useCallback`,
any import from `next/navigation`, `next/dynamic`, `@/hooks/useExchangeRate` or `@/modules/auth/context/AuthContext`,
any new business state, or any change to a rendering condition, `className`, element order, or DOM structure.

Every `className` string in lines 173-268 is copied **character-for-character**. The `Sheet`/`SheetContent` wrapper,
the empty-state block, the grid/list class switch, the Show-more `Button`, and `ListingsPagination` all move as-is.

## 7. Out of scope — hard

Any Mantine migration of any kind · a Storybook story · `scripts/mantine-migration-scope.json` ·
`ListingsSortBar`, `SaveSearchButton`, `ListingsFilters`, `ListingsFilterBar`, `ListingsPagination`,
`ListingsStatusTabs`, `ActiveFilterChips`, `ListingCard` (each moves as an untouched call site) ·
Tailwind cleanup or class rewriting · CSS, theme, token or message changes · `src/app/[locale]/listings/page.tsx` ·
a route probe, a screenshot matrix, or any new CI job or gate.

Sprint 68's D775-A / D775-B / D775-C bind *migrated* surfaces. This task migrates nothing, so it introduces no
Mantine token, no responsive prop and no TailAdmin value — a diff containing one is out of scope, not an improvement.

## 8. Positive flow and negative-flow applicability

**Positive:** `/listings` renders with at least two pages of results → grid and list toggle, filter sheet open/close,
Show more appends a page, favorite toggle flips a card, navigate into a listing and return → scroll position and the
loaded-more state are restored. Identical before and after the diff.

| Branch | Applicable? | Reason | Expected |
|---|---:|---|---|
| Validation | No | No form, schema or user input is added or moved | N/A |
| Authorization / RLS | No | `useAuth` stays in the container; no data access changes | N/A |
| Offline / network | No | `fetch` call sites move zero lines and keep their existing `catch {}` / `finally` | Existing behavior |
| Concurrent writer | No | No write path | N/A |

## 9. Acceptance criteria

- **AC1 [R1]** Given the final diff, `ListingsShell` is the only controller: every hook, side effect, `fetch`,
  `sessionStorage` access and handler from §5 is still declared in `ListingsShell.tsx`.
- **AC2 [R2]** Given `ListingsShellView.tsx`, it only accepts props/slots and reproduces the prior composition:
  none of the forbidden imports or identifiers in §6 appear in it, and it declares no state of its own.
- **AC3 [R3]** Given the diff, the URL contract, Show-more append, `listings_restore` session restore, the favorites
  set, `displayCurrency` resolution and every rendering condition are unchanged — no `className`, element order or
  conditional expression differs from the pre-edit source other than by relocation.
- **AC4 [R4]** Given `git status --porcelain` and `git diff --stat`, no path outside §4 is changed;
  `src/app/[locale]/listings/page.tsx` and `scripts/mantine-migration-scope.json` are absent from both.
- **AC5 [R5]** All §10 checks are green, each with its actual transcript and exit code.

## 10. QA profile and required checks

**Q1 Targeted.** Selected because this is a behavior-preserving refactor with no user-visible or layout delta;
`docs/qa-profiles.md` states that "a logic-only task that touches a UI file does not automatically become Q3."
Q1's own approval rule applies: it can be approved without rendered screenshots **only** while no rendered UI
behavior changed — which is exactly what AC3 asserts. A rendered change invalidates the profile, not the criterion.

Run from the project root in **native Windows PowerShell** (`docs/orchestrator-role.md` → Windows-native validation
rule). Record `node.exe -p process.platform` → must be `win32`, plus the Node version, cwd, exact command and actual
exit code for each:

```powershell
npx.cmd eslint src/modules/listings/components/ListingsShell.tsx src/modules/listings/components/ListingsShellView.tsx
npm.cmd run typecheck
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
npm.cmd run build
git diff --check
```

`npm.cmd run build` exit 0 is the hard gate; a failed or unrun build permits only `PARTIALLY IMPLEMENTED` or
`BLOCKED`. AC1/AC2 are additionally grep-checkable against the two files and must be evidenced that way.

**Critical-flow note — owner-native, not executor-blocking.** `docs/critical-flow-registry.md:105` registers
`/en/listings` under "Hydration / console errors — live public routes", whose required regression evidence is
`check:hydration` on a running server. That row's own Coverage records the live public-route evidence as
**owner-run**, with no booted-Next CI step per owner scope decision. The executor therefore records it as
`MISSING EVIDENCE — owner-native` and hands the owner the exact command, per `docs/orchestrator-role.md` →
"Owner-native validation handoff":

```powershell
$env:BASE_URL="http://localhost:3000"; npm.cmd run check:hydration
```

Expected: PASS on the Listings-en cell, 0 hydration violations. Do not booted-server-probe `/listings` inside this
task — that is Task 775's and Task 772's evidence surface, not this one's.

## 11. Completion report contract

Report, in `docs/sessions/`, with a backlog state update:

1. Files changed (table) — must match the real diff exactly.
2. Requirement IDs completed (R1-R5) and each AC's evidence.
3. Every command from §10 with its actual output and exit code, plus the `win32` platform receipt.
4. The AC1/AC2 grep evidence for both files.
5. Assumptions, deviations, limitations, unresolved issues — including the owner-native `check:hydration` handoff.
6. Final status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED`. Never
   `APPROVED`. Emit no `git add`, `git commit` or `git push`.

## 12. Pre-read bundle, assumptions, quality gate

**Pre-read (legacy shadcn/Tailwind path, `docs/rule-index.md`):** `docs/agent-contract.md` ·
`docs/component-rules.md` (§ Container/Presentational Split and § Storybook-First) · `docs/ui-rules.md` ·
`docs/qa-rules.md` · `docs/qa-profiles.md` · `docs/backlog.md` · this file ·
`tasks/Sprints/Sprint_68_Listings_Leaves_Tailwind_One_Surface_At_A_Time.md`. Do **not** read the Mantine bundle;
nothing in this task is Mantine.

**Canonical UI decision record.** No visible artifact changes and no visual value is introduced: the JSX and every
`className` move verbatim. Searched and inspected: `scripts/mantine-migration-scope.json` (`ListingsShell` absent),
`src/modules/listings/components/` (no `ListingsShell` story; `ListingDetailView.stories.tsx` and
`ListingFormShellView.stories.tsx` are unrelated surfaces). Disposition: **reuse** — existing markup preserved,
no canonical source needed, no story created. This record is void the moment a visual value changes; see §3.1.

**Assumptions / open questions.** None outstanding. Open sprint decision **D68-1** does not gate this task: it
touches neither `ListingsSortBar` nor `SaveSearchButton` as components, only their existing call sites.

**Quality gate.** A fresh Sonnet session can execute this without chat context; each of R1-R5 has one binary AC and
one verification method; §5 and §7 name what must not change; the negative-flow table is selected by applicability,
not copied; no command, file, line reference or behavior in this kickoff was asserted without being read on
2026-08-31 against a clean worktree.
