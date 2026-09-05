# Sprint 70 — the site chrome leaves Tailwind, and the mobile bar goes away

**Opened:** 2026-09-04 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Active tasks:** 1

> **Opened by owner instruction, 2026-09-04:** *"Тепер треба створити kickoff для header міграції на Minetine
> глобально по всьому проекту. На мобільних версіях треба прибрати внизу екрану header планку. Header на
> мобільних екранах має бути тільки в burger menu. Для незареєстрованих користувачів не треба показувати
> опції 'Додати оголошення', 'Обране'."*
>
> The 2026-08-01 owner rule forbids a kickoff without a sprint. This file, the kickoff, `docs/backlog.md`'s
> Sprints section and its registry row were written in the **same edit**, per the 2026-08-10 fourth-occurrence
> corollary — a number is allocated in the registry in the same edit as its kickoff, or it is not allocated
> at all.

## Why not an existing sprint — checked before opening this one

| Sprint | Its goal | Fits 787? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | **No.** Different surface, and **D28** binds it to mechanism-only changes at zero visual delta. 787 deletes a component and changes rendered chrome on every page by design. Down to three retained follow-ups (743/744/745). |
| **55** | ARIA semantics no gate sees | **No.** Semantics only. 787 changes structure and visibility; the accessible-name assertions in AC4/AC5 are evidence, not the subject. |
| **56** | Raw enum leaks and the blind detector | **No.** Localization/detector subject. |
| **57** | Delete what no longer earns its place | **Closest, and still no.** 57 is *pure* removal, each item proven inert before deletion. 787's bottom bar is **not** inert — it is live navigation on every mobile page, and its deletion is inseparable from a migration and a re-layout that 57's goal explicitly excludes. Folding it in would make 57's "proven inert first" criterion unsatisfiable. |
| **61** | The projection layer no gate reads | **No.** Markdown/ledger projection, not UI. |
| **62** | Tailwind runtime tokens outlive Tailwind | **No.** Token-emission mechanism on the Homepage set. 787 adds no token (R7). |
| **68** | `/listings` leaves Tailwind, one surface at a time | **No.** Route-scoped to `/listings`; 787 is site chrome on **every** route. 68 has zero open tasks and awaits closure. |
| **69** | `/listings` finishes the Mantine migration | **No — and it says so.** Its Task 784 execution note reads *"legacy sources, **including header/footer container migration**, stay separate."* 69's own scope statement excludes this work. |

No open sprint fits. Opened 70.

## Goal

The site chrome — the header rendered on every `/[locale]` page and the navigation reachable from it — stops
being a Tailwind surface and stops carrying a second, redundant navigation bar. Three owner requirements, one
task:

1. the header chain migrates to Mantine primitives and the canonical theme;
2. the fixed mobile bottom bar is **deleted**, with mobile navigation living in the burger menu alone;
3. **"Add listing" and "Favorites" are hidden from unauthenticated users everywhere** — mobile and desktop.

The narrower point this sprint exists to prove: **a deletion is a migration's hardest case, and this repo has
already been bitten twice by it.** Task 782's F4 deleted `FilterMultiToggle.tsx` and left live references in four
governance documents while `npm run governance:components` passed — that gate reads three named files and cannot
see a stale catalog row. And the bottom bar is not a leaf: its 56px height is reserved as bottom padding in
`src/app/[locale]/layout.tsx` and `FooterView.module.css`, a coupling its own module CSS documents in a comment.
Deleting the component without those two is how every mobile page keeps 56px of dead space that no gate measures.

## Tasks

> **This table is the single state source for the sprint.** Read state here, not from the kickoff.

| # | Title | Priority | QA | State |
|---|---|---|---|---|
| **787** | Global header Mantine migration, mobile bottom-bar removal, and guest gating of "Add listing" / "Favorites" | **P1** | **Q3** | ✅ **ARCHIVED** 2026-09-05 — `APPROVED WITH NOTES` after Revision 1, committed and pushed (`1b72b26e2`). Original review note: — implementation `VERIFIED` (R1·R3–R8, AC9 live, owner visual QA accepted **D70-2**); returned on a false reference census, one live fail-closed reference and stale state records. Revision brief → kickoff §10. → [`Sprint_70_kickoff_prompt_Task_787_…`](Sprint_70_kickoff_prompt_Task_787_Header_Mantine_Global_And_Mobile_Nav_Consolidation.md) |
| **788** | Delete the unconsumed `src/components/layout` primitive barrel — `FilterBar` · `PageShell` · `Section` · `PageHeader` + `index.ts` + 4 stories | **P2** | **Q1** | 📋 **KICKOFF FILED** (2026-09-05) — awaiting dispatch to Sonnet. → [`Sprint_70_kickoff_prompt_Task_788_…`](Sprint_70_kickoff_prompt_Task_788_Delete_The_Unconsumed_Layout_Primitive_Barrel.md) |

## Execution order

**787 → 788.** 787 is archived; 788 is independent of it and of 789. 788 deletes only files with a proven-zero consumer set, so it gates nothing and is gated by nothing — but it must land **before** 789, because 789 migrates a live bar in `ListingsTab.tsx` that carries a local constant named `FilterBar`, and doing that while a real `FilterBar` component still exists invites exactly the same-name confusion this sprint just measured.

Task 787's own note, retained: single task; the kickoff's §4 scope boundary is the gating, not a phase list. If the executor finds the three
requirements cannot land in one commit-sized change, it records that as a design blocker and stops — it does
**not** split the task itself, because requirements 2 and 3 are entangled (deleting `MobileBottomNavView` is
*how* requirement 3 is satisfied on mobile) and a partial landing leaves the guest FAB shipping.

## Preconditions

- A production build that can be started (`npm run build` then `npm run start`) and served locally. **This is
  not optional evidence** — see the binding decision below.
- Two auth fixtures: an **authenticated** session and a **guest** session. AC4/AC8 are unmeasurable without the
  first; AC5 without the second. **Confirm both before dispatch, not at runtime.** Absent → the affected ACs
  finish `BLOCKED` and the guest ACs are still measured.
- Storybook builds (`npm run build-storybook`).
- `sq` · `en` · `uk` resolve on `/` and `/listings`.

## Binding decision

**D70-1 — a green `npm run build` is not evidence for `/[locale]`.** On 2026-09-04 Task 784 took `lero.al` down
by calling `useMantineTheme()` in `FooterView.tsx`, a Server Component. `/[locale]` is a `ƒ` dynamic route, so
`next build` never server-rendered it; the green build was truthful and irrelevant. `tsc` types hooks as valid
anywhere, `eslint` has no rule for it, and Storybook renders every component as a client component, so all 31
browser checks passed too. **Any task in this sprint that edits a Server Component or the files it renders must
carry a real `next start` request to at least one `/[locale]` route as an acceptance criterion** (787's AC9).
This holds until Task **786**'s detector exists; when it lands, this decision is superseded by that gate, not
by a green build.

**D70-2 — the owner's visual matrix is the visual criterion, and Task 787's is accepted (2026-09-05).**
`screenshots:assert` is retired (owner decision 2026-09-03), so for every changed visible artifact in this sprint
the visual criterion stays `NOT VERIFIABLE` until the owner records an accepted/returned result per tuple; an
automated screenshot never substitutes for it. For **787** the owner reviewed the full matrix — header and drawer,
guest and authenticated, `en` and `uk`, at 375 / 768 / 1280, plus the 375 clearance cell — on the live server and
in Storybook, and recorded `accepted` on 2026-09-05, explicitly confirming that Favorites sits flush beside the
burger rather than centred, that guests see neither Favorites nor "Add listing" at any width, and that long `uk`
strings do not break the bar at 375.

## Exit criteria

1. No file in the header/navigation chain carries a Tailwind dimension or layout utility, and none imports
   `@/components/ui/*` except the non-shadcn `AppImage`.
2. `MobileBottomNav` and `MobileBottomNavView` do not exist, and **every** reference to them in `src/`,
   `scripts/` and `docs/` is either removed or classified in writing as historical prose. A green
   `governance:components` does **not** close this — 782's F4 is the precedent.
3. Both 56px clearance reservations are removed with the bar, measured rendered before and after. A mobile page
   with an unexplained 56px tail is a rejected diff, not a note.
4. No unauthenticated user can see an "Add listing" or "Favorites" affordance anywhere in the site chrome, on
   any viewport — proven by accessible-name assertions on a guest fixture, not by reading the source.
5. No authenticated destination is lost: everything reachable from the deleted bar is reachable from the burger
   menu, asserted per destination with its href.
6. No new theme value, breakpoint, token, `design-tokens-allow` marker or allowlist entry. The global
   `check:design-tokens` finding set differs from Task 784's baseline **only** by findings that lived inside
   the deleted file, each one named.
7. **D70-1 is satisfied by a transcript, not a claim** — the request, the status code and the header's presence
   in the returned HTML.
