# Sprint 46 — ListingCard de-Tailwind + the overlay exit condition

**Opened:** 2026-08-01. **State:** 🟠 **OPEN — current sprint.** **Epic:** MM (Mantine/TailAdmin) Phase-2.

> **First sprint under the "every task belongs to a sprint" rule (owner, 2026-08-01)** — and the first planned sprint
> since 44. Sprint 45 is not a planned sprint: it is the name given after the fact to Tasks 621–705, which ran with
> no sprint above them for roughly six weeks. From **Task 706** onward a task may not be created without a sprint,
> and its kickoff lives at `tasks/Sprints/Sprint_NN_kickoff_prompt_Task_NNN_<Slug>.md`, never at the root of `tasks/`.

## Goal

Finish the listing-card de-Tailwind and reach the **exit condition** for the `--overlay` token pair — the point at
which the transitional `@theme inline` copy that D19 introduced can legitimately be deleted. These belong in one
sprint because they are one dependency chain: 691 is the heaviest `bg-overlay*` consumer in the repo, so 695 cannot
close until 691 and 702 land.

## Tasks

| # | State | Scope | Depends on |
|---|---|---|---|
| **691** | `KICKOFF FILED`, Q3 | `MantineListingCardPattern.tsx` de-Tailwind — 25 editable `className` sites (28 `className=` minus the 3 cross-file contract strings). Overlay chips → `var(--overlay*)`. Comparator = the D26 rendered matrix **plus** `check:homepage-grid`, both required. | 692 · 693 · 701 (all landed) |
| **702** | reserved | `ListingCard.tsx` de-Tailwind — exactly 8 `className=` sites (icon sizing + `shadow-sm`). Marker classes stay verbatim: **`.listing-card` is load-bearing**, anchoring stories in `check-stories-rendered.mjs` and acting as the grid locator in `check:homepage-grid`. | 691 |
| **694** | ✅ **`APPROVED WITH NOTES`** 2026-08-10, Q4 — **the sprint's first landed task** | **RE-SCOPED 2026-08-10 — the overlay alias is closed by D35, not deferred** (measured: it reproduces Task 690's fallback regression on `tailwindcss@4.3.0`). Delivered the brand single-source **ΔE sync gate** 661's review spawned on 2026-07-23 and that sat unfiled for sixteen days — `scripts/__tests__/brand-single-source.test.ts`, 31 tests, self-validating comparator — plus one comment-only correction to `--brand-950` (ΔE00 **3.6446 → 0**). Touched no overlay token; zero rendered delta. Three P3 documentation notes, no blocking finding. Archive row: `docs/backlog-archive.md`, 2026-08-10. | — |
| **695** | reserved | **Exit condition.** Delete the `@theme inline` `--overlay*` copy **and** the `--color-overlay*` namespace once the last of the **33** overlay utilities across **7** files is gone. **Must UPDATE 692's gate, not delete it.** Folds in 692 F1 `P3` and 662 F2 `P3`. **694 is no longer a dependency** — it stopped touching the pair on 2026-08-10 (D35), so 695's blockers are 691 · 702 alone. | 691 · 702 |
| **700** | reserved | The general `@theme`-dependency gate — fail when any `.module.css` consumes an `@theme` var whose last Tailwind-utility consumer disappears. Repo-wide scan; own blast radius, deliberately not a rider on 695. | — |

Carried in from Sprint 45 — all five numbers were issued during the unsprinted period and never executed.
691's kickoff predates the rule and stays at `tasks/kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md`;
kickoffs for 694, 695, 700 and 702 must be written **inside this sprint's directory path**.

## Preconditions before 691 starts

- **Measure `/[locale]` First Load JS first.** The 671/675 review recorded **618 kB against a 185 kB baseline** while
  a server component imports the client-component patterns barrel (`F3`, `NEEDS VERIFICATION`). 691 adds to that
  route — take the reading before, not after.
- Extend `MantineListingCardPattern.module.css` (Task 602). Mantine's `Card` CSS is **unlayered** and per the Cascade
  Layers spec always beats Tailwind's `@layer utilities`, so a `hover:shadow-*` can never win — never `!important`,
  never a layer override.
- Per-site disposition for all 25 sites is required **before** editing, grouped A–F per the kickoff.

## Sprint exit criteria

1. 691 and 702 approved, `.listing-card` md5-witnessed unchanged throughout.
2. Overlay-utility count measured at **0**. If 691 alone takes it to 0 that is a **report-only** finding — 695 must
   then update 692's gate, rather than the sprint quietly ending.
3. `check:homepage-grid` 260/260 and the D26 rendered matrix both green on every task.
4. **Owner cleanup step 3 closed** — the 3 consolidated probes deleted, and a decision recorded on 670 and the other
   9 unwired probes.

---

## Execution order (added 2026-08-08)

Re-audited against the repository on 2026-08-08. The overlay census still measures **exactly 33 utilities across 7
files** — `PerfDevOverlay` 11 · `MantineListingCardPattern` 6 · `ListingGallery` 5 · `LightboxView` 4 ·
`MantineListingGalleryPattern` 3 · `ImageUpload` 3 · `AdminUserAvatar` 1 — unchanged since it was recorded.

| Order | Task | Gate |
|---|---|---|
| **46.1** | **694** | Runnable now, blocked by nothing — **but not the task this row originally described.** The 2026-08-10 preflight measured the alias reproducing Task 690's static-fallback regression on `tailwindcss@4.3.0` and the owner closed that scope as **D35**; 694 is now the brand ΔE sync gate. For the record, the overlay declarations are at `globals.css:82-85` and `:470-471` (the backlog's `:76-79`/`:451-452` were stale) — **695 owns them now, and 694 does not touch them** |
| **46.2** | **702** | `ListingCard.tsx`, 8 sites; marker classes stay verbatim; **D34** applies |
| **46.3** | **700** | Repo-wide `@theme`-dependency gate; independent of 691 |
| **46.4** | **691** | ⛔ **Blocked on the owner.** `/[locale]` First Load JS measures 618 kB against a 185 kB baseline and has not moved across the 710/712/713/714 builds. The number exists; the go/no-go does not. Do not schedule 691 until it is answered |
| **46.5** | **695** | Blocked on 691 — it is the sprint's exit condition and cannot run before the work it measures |

**Do not reorder 46.4 ahead of 46.1–46.3.** All three are runnable while the owner decision is outstanding, and
leaving the sprint at zero landed tasks waiting on one decision is what has kept it open with nothing shipped.
