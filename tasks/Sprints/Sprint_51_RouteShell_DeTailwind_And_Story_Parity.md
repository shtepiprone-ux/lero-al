# Sprint 51 — Route-shell de-Tailwind and canonical-story parity

**Opened:** 2026-08-05. **Epic:** MM Phase-2. **Status:** 🟠 OPEN.

---

## 1. Why this sprint exists

Two defects of the same shape, both found on 2026-08-05 while scoping the "next homepage Mantine task":

1. **The de-Tailwind census counted components, never route files.** `docs/backlog.md:22` enumerates
   `MantineListingCardPattern` · `MobileBottomNavView` · `ListingCard` as remaining and lists nine components as
   done or clean. `src/app/[locale]/page.tsx` and `src/app/[locale]/layout.tsx` appear in **no** census row, own
   **no** task number, and sit in **no** sprint — yet `page.tsx:29` carries `relative z-10` and `layout.tsx:49`
   carries `pb-14 md:pb-0`. Nothing detected this because no gate scans route files for raw utilities and
   `check:design-tokens` deliberately allows named utilities (`z-50`, `p-4`) by design
   (`scripts/check-design-tokens.mjs:26`) — only bracket forms like `z-[N]` are flagged.

2. **A canonical Mantine Story hand-copies production markup as a raw `<div>`.**
   `src/stories/mantine/primitives/HeroSearch.stories.tsx:53-54` and `:90-91` reproduce `page.tsx:28-29`'s hero band
   as `<section className="relative py-16 md:py-24" style={{background:'var(--primary)'}}>` wrapping
   `<div className="container-wide relative z-10">`, where production renders a Mantine `Box` with style props.
   That Story is in the CI-blocking `--mantine-only` matrix (40 cells). Migrating production without it would leave
   the blocking gate validating markup production no longer has — an `agent-contract` cl. 16c divergent stand-in.

Both are the same failure: **the thing that was supposed to detect drift was scoped to components, and the shell fell
through the gap.**

## 2. Goal

Close the route-shell gap on the homepage, and make the canonical Story render the real production composition
rather than a replica of it — with the 40-cell md5 comparator that 709 demonstrably failed and 709-R demonstrably
passed as the proof (D32).

## 3. Binding decisions carried in

- **D28** — de-hybrid is mechanism-only, zero visual delta. Authorizes no restyle, token, spacing or typography change.
- **D34** — a D28 module reproduces the utility's cascade **layer**; wrap in `@layer utilities`. The 602/629/650/651/653/654/656 family stays unlayered on purpose. Reference implementation: `src/components/shared/HeroSearchView.module.css:54`.
- **N1** (707 P3, carried) — reproduce the compiled **token reference**, never its resolved value.
- **D32** — a migration may not be proven against a comparator not shown to fail.
- **agent-contract cl. 16c** — a canonical Mantine Story may not be a divergent demo stand-in.

## 4. Tasks

| # | State | Scope |
|---|---|---|
| **712** | `KICKOFF FILED` | `src/app/[locale]/page.tsx:29` de-Tailwind + `HeroSearch.stories.tsx` production-parity. `Sprint_51_kickoff_prompt_Task_712_HomepageRouteShell_DeTailwind.md` |

## 5. Explicitly NOT in this sprint

- **`src/app/[locale]/layout.tsx:49`** (`min-h-[calc(100vh-4rem)] pb-14 md:pb-0`). Measured 2026-08-05:
  `pb-14` reserves clearance for `MobileBottomNavView.tsx:36`'s `fixed bottom-0 … h-14` bar, and `md:pb-0` mirrors
  that component's `hiddenFrom="md"`. The padding value and its breakpoint are **derived from the nav**, so the two
  are one coupled pair and must migrate in one task. **Folds into Sprint 50's `MobileBottomNavView` task**, whose
  number is still unissued.
- `ListingCard` (702) and `MantineListingCardPattern` (691) — Sprint 46.
- Any restyle, token change, or visual adjustment — D28 forbids it.

## 6. Preconditions

- Task **710** `APPROVED WITH NOTES` (2026-08-05); Sprint 49 closed.
- The 709-R baseline manifest `.screenshots/rendered-assert/2026-08-05T11-33/manifest.json` exists locally and holds
  the 40 herosearch cells this sprint compares against. **Do not overwrite or delete it.**

## 7. Exit criteria

1. `page.tsx` carries zero raw Tailwind utilities; `container-wide` survives verbatim as a marker.
2. `HeroSearch.stories.tsx` renders the same composition production renders, and the divergence is recorded as
   closed in `docs/storybook-governance.md`.
3. All 40 herosearch cell md5s are unchanged against the 2026-08-05T11-33 baseline, or every difference is
   explained and owner-accepted.
4. The census gap is closed in `docs/backlog.md:22` — route files named explicitly, so the next census cannot
   repeat the omission.

## 8. Open, not owned by this sprint

**711** (re-anchor `fullWidthButtonsAtMobile` + `popupBottomSheetAtMobile` onto Mantine DOM) still has no sprint.
`docs/backlog.md:40` suggested "open 51 or fold into 50"; Sprint 51's goal is route-shell de-Tailwind, which 711 is
not. **711 needs Sprint 52 or Sprint 50 — decide before writing its kickoff.** Task 710's review additionally
requires 711 to fold in F1 (`[no-boolean-assertions]` exit-2 arm), F2 (`ORPHAN-ENTRY` exit-1 arm), F3/F4 (the
`critical-flow-registry` row-50 and `2026-08-0X` citation fixes) and NOTE-1 (a `LIVE-THIN` threshold).
