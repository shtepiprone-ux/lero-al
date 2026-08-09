# Sprint 54 — Mobile bottom-nav overlay collision

**Opened:** 2026-08-07. **Owner decision:** 2026-08-07 — Task 724's R2 returned a measured negative result that
needs its own task, and no open sprint fits.

Why not an existing sprint, checked before opening this one:

| Sprint | Goal | Fit |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | No — different surface |
| **49** | HeroSearch gate + de-Tailwind | No — closed scope, ordered 708→709 |
| **50** | MobileBottomNav + AppShell **de-Tailwind** | **Closed** with Task 713, and this is not a de-Tailwind task |
| **52** | Gates that stopped checking | No — this is a real production interaction defect, not a detector defect |
| **53** | Mobile full-width control remediation | No — its goal is the 13 stories where `fullWidthButtonsAtMobile` resolves `false`; this collision is not one of them, and 724 §5.1 explicitly rejected fixing it there |

Opened per the 2026-08-01 owner rule: no open sprint fits → open the next one with its own plan file before
writing the kickoff.

---

## Goal

The homepage's fixed `MobileBottomNavView` paints over and intercepts clicks on page content that occupies the
same viewport band at scroll position 0. Make content in that band reachable, and prove it with the hit-test
gate that found it.

## The measurement trail — three independent runs

| When | Run | Result |
|---|---|---|
| 2026-08-06 | Task 723, pre-fix baseline at `081c03e7f` | 3 of 36 interceptions already name `span.navItemLabel` at mobile-390 — **the defect predates 723** and was masked by the notifications shield sitting on top of everything |
| 2026-08-07 | Task 723, owner-run on a production build | 16 cells, **221 elements, 9 interceptions**, 0 empty-candidate cells. Every interceptor is `MobileBottomNavView_navItem*` or `span.navItemLabel`; the blocked elements are the "View all" link (5) and the favorites heart icon (4). `desktop-1024` clean 4/4; `mobile-320` clean 3/4 |
| 2026-08-07 | Task 724, after making the CTA full-width | 16 cells, **208 elements, 4 interceptions**, 0 empty-candidate cells. All 4 at `mobile-390`, one per locale |

Task 724's R2 hypothesis — that a full-width CTA moves its centre point clear of the nav item — is **disproven**.
The CTA now spans the full width and is still blocked, because the collision is vertical, not horizontal.

## Why it is mobile-390 only, arithmetically

`MANTINE_VIEWPORTS` / `check-click-shield.mjs:75-79` use `mobile-320` and `mobile-375` at height **812**, and
`mobile-390` at height **844**. `MobileBottomNavView.module.css:51-64` sets `position: fixed`, `bottom: 0`,
`height: var(--space-14)` = **56px**, `z-index: 30`, plus an inline `paddingBottom: env(safe-area-inset-bottom)`
(`MobileBottomNavView.tsx:38`).

At mobile-390 the nav therefore occupies y **788–844**. Task 724's post-fix CTA measures **(16,782) 358×44**, so
it spans y 782–826 with its centre at y **804** — inside the nav's band, with **38 of its 44px** covered. At
812-tall viewports the nav occupies 756–812 and the reflowed content clears it.

## Root-cause hypothesis — stated as a hypothesis, for Task 725 to confirm or refute

Nav clearance exists in the codebase, but only on the footer: `FooterView.module.css:35` reserves
`padding-bottom: var(--space-14)` below `md`, and `MobileBottomNavView.module.css:42-45` documents the
bar-height/clearance coupling ("bar height 56px == `--space-14`"). A footer reserves space at the bottom of the
**document**; a `position: fixed` nav overlays the bottom of the **viewport** at every scroll position. Content
that lands in that band before the footer — such as the Featured section's CTA at scroll 0 — has no clearance at
all. **Task 725 must measure this, not inherit it.**

## Tasks

| # | State | What |
|---|---|---|
| **725** | `KICKOFF FILED` | Root-cause and fix the collision; prove it with `check:click-shield` at 0 interceptions across all 16 cells, plus a planted round trip. `Sprint_54_kickoff_prompt_Task_725_BottomNav_Overlay_Collision.md` |
| **729** | ✅ `APPROVED`, archived 2026-08-09 | Below-fold blind spot: the gate scanned one viewport and discarded **900 of 1812** candidates. Band scan → `checked` 912 → 1772, `excluded` → 40. Fixed a pre-existing 725 ancestor-walk bug. `Sprint_54_kickoff_prompt_Task_729_BelowFold_Blind_Spot.md` |
| **737** | ⛔ `BLOCKED`, archived 2026-08-09 — **correctly** | Live measurement refuted the kickoff's root cause: `<Footer />` is a *sibling* of `<main>`, the footer's own clearance is **104px**, and the links hit-test as reachable. **No product defect.** The kickoff carries a correction banner. `Sprint_54_kickoff_prompt_Task_737_FooterSocialLinks_Under_FAB.md` |
| **739** | ✅ `APPROVED WITH NOTES`, archived 2026-08-09 | `check-click-shield.mjs:446-447` generates clearing offsets from the fixed/sticky **ancestor's** box while the element that occludes (`.fabLink`) overhangs it by 12px — the ~11px undershoot that produced 729's 6 false positives. Fix the box, not the app. `Sprint_54_kickoff_prompt_Task_739_ClickShield_Wrong_Clearing_Box.md` |
| **740** | `KICKOFF FILED`, **P1** — closes the sprint | **The box must be the fixed system's whole extent.** 739 landed `union(hit, ancestor)`, which covers only the one descendant that happened to be `hit`. `.fabLink` (745) blocks all six footer identities and is `hit` in two, so four still undershoot by ~11px. Required: ancestor ∪ every hit-testable descendant that overflows it, with justified exclusions. `Sprint_54_kickoff_prompt_Task_740_ClickShield_System_Extent.md` |

## Preconditions

1. **Task 723 must be reviewed and landed first.** 725's only comparator is `scripts/check-click-shield.mjs`,
   which 723 introduced and which is still uncommitted and awaiting review. A comparator that has not been
   committed is not a stable baseline (**D32**).
2. **Open question for the 723 review, surfaced 2026-08-07:** 723's session log calls `check:click-shield` a
   "new blocking gate", but `grep` across `.github/workflows/*.yml` finds **no reference to it**. It exists in
   `package.json` only. Until that is resolved, any fix Task 725 lands has **no CI regression guard**.

## Exit criteria

1. `BASE_URL=… npm run check:click-shield` against a real production build reports **0 interceptions** across all
   16 cells with **`Empty-candidate cells: 0`**.
2. The root cause is stated from measurement, and the fix addresses it rather than the one element that exposed it.
3. `npm run check:click-shield:verify` still passes — the gate that proves the fix can still fail.
4. The regression-guard status is stated explicitly: either the gate runs in CI, or the task records that it does
   not and names who owns wiring it.

## Standing constraints

- **`MobileBottomNavView` is Task 713's landed work** (Sprint 50, closed, D28 mechanism-only + D34 cascade layer).
  This sprint may change it if the evidence requires, but its de-Tailwind mechanism and cascade layering must
  survive intact — a collision fix is not a licence to re-hybridise the component.
- **`FavoriteButton`'s `ActionIcon`** was one of the two blocked element classes in 723's run and did not
  reproduce in 724's. Treat it as unresolved, not as fixed.

---

## Execution order (added 2026-08-08)

**729 is the only remaining task, and it closes the sprint.** It costs a `check:click-shield` run, not the 1184-cell
matrix sweep, so it is independent of Sprint 52's ordering and can run in parallel with any of it.

Its scope was double-assigned — the backlog listed 729 under Sprint 52's remaining tasks **and** under Sprint 54.
Corrected 2026-08-08: **729 belongs to this sprint**, which is where its finding originated (Task 725) and which
names it as the closing condition.


**Task 729 kickoff filed 2026-08-09** — `Sprint_54_kickoff_prompt_Task_729_BelowFold_Blind_Spot.md`, with execution contract and rule-compliance ledger. It closed `APPROVED` and did **not** close the sprint: its widened gate reported 6 new violations, filed as 737.

---

## Execution order (revised 2026-08-09, after 737)

**739 is the only remaining task and it closes the sprint.** Cost is one production build + a 48-cell
`check:click-shield` sweep (~90s), so it stays independent of Sprint 52's matrix ordering.

**Ordering against the owner's Supabase secrets is strict and now belongs to 739, not 737.** Task 727's blocking
CI job cannot run until `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist as repository secrets;
until 739 lands, that job would fail every PR on false positives. **739 lands first.**

### What this sprint turned out to be about

It opened on a suspected layout collision and never found one. Each task located the defect one layer further
into the *gate* rather than the product: **725** refuted its own premise · **729** widened coverage and exposed a
725 bug · **737** refuted 729's finding and proved the app correct · **739** fixes the measurement that produced
it. The sprint's transferable output is that a gate reporting a number which reads as coverage — `checked`,
`violations`, `cleared` — must be able to prove what that number excludes.


**Task 740 kickoff filed 2026-08-09** — the sprint's last task. Three box errors in a row: the interceptor's box (rejected), `union(hit, ancestor)` (landed, partial), the ancestor's extent (740). Each was found by the acceptance discipline the previous one lacked — which is the sprint's real transferable output.
