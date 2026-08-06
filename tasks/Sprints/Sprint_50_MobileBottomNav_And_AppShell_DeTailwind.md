# Sprint 50 — MobileBottomNav + app-shell de-Tailwind

**Opened:** 2026-08-05. **Epic:** MM Phase-2. **Status:** 🟠 OPEN.

Reserved for `MobileBottomNavView` since the 2026-08-01 backlog audit; opened now with a plan file, per the owner
rule that a task may not be created without a sprint.

---

## 1. Why this sprint exists

`MobileBottomNavView` is the **last app-shell surface still carrying raw Tailwind utilities** — 11 `className=`
sites — after `FooterView` (673), `HeaderView` (706) and the homepage route shell (712). It renders on **every
route** below 768px, so it is both the highest-traffic remaining de-Tailwind target and the one with the widest
blast radius.

It also carries something no prior de-Tailwind has had to handle: **4 `design-tokens-allow` inline suppression
markers**. `check:design-tokens` treats a marker whose value is no longer detected on its physical line as a
`stale-marker` violation (`scripts/check-design-tokens.mjs:224`, `:384-393`). Removing an allow-marked utility
therefore *breaks the gate* unless the marker moves with the declaration. Neither `HeaderView.module.css` nor
`FooterView.module.css` carries a single marker — **this sprint is the first time the problem arises.**

## 2. Goal

Move `MobileBottomNavView` and its coupled app-shell clearance off raw utilities under D28/D34, and establish the
repo's first pattern for carrying a `design-tokens-allow` marker across a de-Tailwind — proven by a planted
violation, not by assertion.

## 3. Binding decisions carried in

- **D28** — de-hybrid is mechanism-only, zero visual delta. No restyle, no token change, no spacing change.
- **D34** — a D28 module reproduces the utility's cascade **layer**; wrap in `@layer utilities`. Reference:
  `src/components/shared/HeroSearchView.module.css:54`.
- **N1** (707 P3) — reproduce the compiled **token reference**, never its resolved value.
- **D32** — a migration may not be proven against a comparator not shown to fail.

## 4. Tasks

| # | State | Scope |
|---|---|---|
| **713** | `KICKOFF FILED` | `MobileBottomNavView.tsx` (11 sites, 4 markers) + `layout.tsx:49` (the coupled `pb-14`/`md:pb-0`). `Sprint_50_kickoff_prompt_Task_713_MobileBottomNav_And_AppShell_DeTailwind.md` |

## 5. Why `layout.tsx` belongs here and not in Sprint 51

Measured 2026-08-05: `layout.tsx:49` is `<main className="min-h-[calc(100vh-4rem)] pb-14 md:pb-0">`. `pb-14`
reserves clearance for `MobileBottomNavView.tsx:36`'s `fixed bottom-0 … h-14` bar, and `md:pb-0` mirrors that
component's `hiddenFrom="md"`. **The padding value and its breakpoint are both derived from the nav**, so the two
migrate in one task or risk a silent mismatch. Task 712 deferred it here for exactly this reason.

## 6. Explicitly NOT in this sprint

- `ListingCard` (702) and `MantineListingCardPattern` (691) — Sprint 46, and 691 blocks the pair.
- `min-h-[calc(100vh-4rem)]` on `layout.tsx:49` — already `design-tokens-allow`-marked and **out of scope**; only
  `pb-14`/`md:pb-0` are in play.
- Any change to `check-design-tokens.mjs` itself. The marker must work as the gate already parses it.
- Any restyle, token change, or visual adjustment — D28 forbids it.

## 7. Preconditions

- Task 712 `APPROVED WITH NOTES` and committed (`b29e9a626`); Sprint 51 has its first landed task.
- The 712 run `.screenshots/rendered-assert/2026-08-05T17-47/manifest.json` exists locally and holds the **32**
  `MobileBottomNavView` cells this sprint compares against. **Do not overwrite or delete it.**

## 8. Exit criteria

1. `MobileBottomNavView.tsx` carries zero raw Tailwind utilities; `mobile-bottom-nav` survives verbatim as a marker.
2. `layout.tsx:49`'s `pb-14`/`md:pb-0` are gone and the bar-height/clearance coupling is expressed in one place.
3. All 4 `design-tokens-allow` markers still suppress their values, `check:design-tokens` reports **0 violations
   and 0 stale-markers**, and the carry-across pattern is documented for reuse.
4. All 32 `MobileBottomNavView` cell md5s unchanged against the `2026-08-05T17-47` baseline, or every difference
   explained and owner-accepted.

## 9. Open, not owned by this sprint

**711** (re-anchor `fullWidthButtonsAtMobile` + `popupBottomSheetAtMobile` onto Mantine DOM) still has no sprint —
Sprint 50's goal is app-shell de-Tailwind, which 711 is not. It needs **Sprint 52**. Task 710's review requires it
to fold in F1 (`[no-boolean-assertions]` exit-2 arm), F2 (`ORPHAN-ENTRY` exit-1 arm), F3/F4 (the citation fixes)
and NOTE-1 (a `LIVE-THIN` threshold).
