# Sprint 47 — Layout-shell de-hybrid (Footer, then Header)

**Opened:** 2026-08-01. **State:** 🟠 **OPEN.** **Epic:** MM (Mantine/TailAdmin) Phase-2.

> **Two sprints are open at once.** Sprint 46 (`Sprint_46_ListingCard_DeTailwind_And_Overlay_Exit.md`) remains open
> with **zero landed tasks**. 47 is opened in parallel because the owner selected 673 as the next kickoff on
> 2026-08-01 and 673 does not fit 46's goal — 46 is a single dependency chain (691 → 702 → 695) around the listing
> card and the `--overlay` token pair, and the layout shell is not part of it. Sequencing between 46 and 47 is an
> owner call; nothing here blocks 46, and nothing in 46 blocks this.

## Goal

Remove the Mantine/Tailwind **hybrid** from the two app-shell layout views. Both currently pair Mantine primitives
with verbatim Tailwind utility classes — `HeaderView` does it deliberately (Task 629 added `unstyled` to every
`Group`/`Anchor`/`Text` so the Tailwind chain keeps 100% of the styling), and `FooterView` does it by omission
(Mantine `Box`/`Stack`/`Group`/`Flex` wrapping raw `<p>`/`<span>`/`<a>` that carry the utilities).

The sprint ends when both files hold **zero raw Tailwind utility classes** and their rendered output is unchanged.

## Owner decisions — source of truth, not to be re-litigated

| ID | Question put to the owner | Ruling |
|---|---|---|
| **D28** (2026-08-01) | `backlog.md:52` records 673 as "mechanism-only (owner 2026-07-29, as in 672)", but the decision text itself was never written down anywhere. Two incompatible readings exist: keep `unstyled` and move the utilities into a module (zero visual delta), or drop `unstyled` and let Mantine style the chrome (visual delta, needs a TailAdmin reference row that does not exist). Which? | **Mechanism-only, zero visual delta.** Keep `unstyled` where it exists and add it where a raw element becomes a Mantine primitive. Utilities become Mantine style props where a prop exists, and a colocated `.module.css` where one does not — the **Task 688 D16 pattern**. No restyle, no token change, no spacing/typography edit. |
| **D29** (2026-08-01) | One task for both files, or split? | **Split, footer first.** `FooterView` establishes the pattern with no risk exposure; `HeaderView` inherits it afterwards. |

D28 supersedes nothing — it is the first written form of a ruling the backlog had only summarised.

## Tasks

| # | State | Scope | Depends on |
|---|---|---|---|
| **673** | `KICKOFF FILED` | `FooterView.tsx` de-hybrid — **16** `className=` sites, 8 raw HTML elements (`<p>`×4, `<span>`×3, `<a>`×1). Zero critical-flow exposure, zero `check:design-tokens` violations, and `.site-footer` has **zero consumers repo-wide**. `Sprint_47_kickoff_prompt_Task_673_FooterView_DeHybrid.md` | — |
| **706** | reserved | `HeaderView.tsx` de-hybrid — **11** `className=` sites. Carries everything 673 does not: the P0 critical flow *Authenticated header hydration* (599/601), three live `.site-header` consumers, and Task 684's hardcoded 97px/65px notification clearance measured off this header's own height. Inherits 673's proven module pattern. | 673 |

## Why footer first — the asymmetry, measured 2026-08-01

| | `FooterView` (673) | `HeaderView` (706) |
|---|---|---|
| `className=` sites | 16 | 11 |
| Marker class consumers | `.site-footer` → **0** | `.site-header` → **3** (`check-header-id-parity.mjs:147`, `MantineRootProvider.tsx:34`, `task612-qa-listinggallery-lightbox-portal.mjs:57`) |
| `docs/critical-flow-registry.md` | none — the two `footer` hits are Drawer/card footer slots, not the site footer | **P0** *Authenticated header hydration — NotificationBell SSR shell* (599/601) |
| `check:design-tokens` contribution | 0 | **5** of the live 28 (`:110` ×3, `:128` ×2, all `min-[390px]`) |
| Downstream geometry contract | none | Task 684 hardcodes **97px @ 320/375** and **65px @ 390/1024** as the measured `header.site-header` height |
| Component kind | server component, prop-driven, hook-free | `'use client'`, hydration-sensitive |

## Preconditions before 706 starts

- 673 must be `APPROVED`, and its `.module.css` reproduction convention must be the one 706 copies.
- Re-measure `header.site-header` height at 320/375/390/1024 **before** editing, and treat
  `MantineRootProvider.tsx:34`'s 97/65 pair as a hard invariant — a 1px header change silently misplaces every
  Mantine notification.
- `HeaderView`'s 5 `min-[390px]` violations are an arbitrary-value breakpoint with **no entry in
  `theme.ts`** — moving them into a module media query is the only thing in either task that legitimately changes
  `check:design-tokens` (28 → 23). Do not fold that claim into 673, which contributes 0.

## Sprint exit criteria

1. `grep -c 'className=' src/components/layout/FooterView.tsx src/components/layout/HeaderView.tsx` returns only
   sites whose value is a preserved canonical class (`site-footer`, `site-header`, `container-wide`) or a
   `styles.*` reference — zero raw Tailwind utilities.
2. Both stories' full enrolled cell sets keep their pre-task PNG md5 and verdict, under the `docs/storybook-governance.md`
   §14.11 (D26) comparator. A changed cell is a finding, not a tolerance.
3. `check:design-tokens` at **23**, attributed entirely to 706.
4. `npm run test:header-hydration-id-parity` and `npm run check:header-id-parity` green on 706, with the pre-edit
   baseline recorded first.
5. `npm run build` exit 0 on both.
