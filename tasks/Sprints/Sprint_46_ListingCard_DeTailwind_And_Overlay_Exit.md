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

> ⚠️ **This table is the single source of task state for Sprint 46.** The execution-order table below carries
> **order and gating only** — never a state claim. They drifted once (2026-08-10: this table still read
> `KICKOFF FILED` for an approved-and-committed 702, and an executor was offered it as live work), and one state
> column is the fix. Cross-check against `docs/backlog.md`'s registry before trusting either.

| # | State | Scope | Depends on |
|---|---|---|---|
| **691** | `KICKOFF FILED`, Q3 — ✅ **UNBLOCKED by D36** (owner, 2026-08-10), runs under a **no-increase** `/[locale]` First Load JS condition | `MantineListingCardPattern.tsx` de-Tailwind — 25 editable `className` sites (28 `className=` minus the 3 cross-file contract strings). Overlay chips → `var(--overlay*)`. Comparator = the D26 rendered matrix **plus** `check:homepage-grid`, both required. | 692 · 693 · 701 (all landed) |
| **702** | ✅ **`APPROVED WITH NOTES`** 2026-08-10, Q3 — **COMMITTED `0dac78755`**. Archive row: `docs/backlog-archive.md`. Spawned **742** (C3) | *(scope kept for reference; the work is done — do not hand this row to an executor)* | `ListingCard.tsx` de-Tailwind — **8** `className=` sites into a colocated `@layer utilities`-wrapped `ListingCard.module.css` (D34). Marker classes stay verbatim: **`.listing-card` is load-bearing**, anchoring 4 rows in `check-stories-rendered.mjs` and the grid locator at `check-homepage-grid.mjs:204`. **The "8" is a grep artifact** — `CLOSED_OVERLAY_STYLE` at `:56-59` reaches the DOM via `className:` (colon) at `:266` and is invisible to `grep "className="`; split out as **741**. **Dependency on 691 dropped** — measured 2026-08-10, the 8 sites touch no pattern file. `Sprint_46_kickoff_prompt_Task_702_ListingCard_DeTailwind.md`. | — |
| **741** | reserved, filed by 702's preflight | **`CLOSED_OVERLAY_STYLE` → module class.** The same two strings are duplicated at `MantineListingCardPattern.tsx:39` (JSDoc), `ListingCardPattern.stories.tsx:120` and `MantineListingCardPattern.smoke.test.tsx:105`, so migrating only the producer leaves the story and test proving raw Tailwind while production renders a module class. Whether the pattern keeps accepting arbitrary class strings is an API decision inside 691's blast radius. | 691 |
| **694** | ✅ **`APPROVED WITH NOTES`** 2026-08-10, Q4 — **the sprint's first landed task** | **RE-SCOPED 2026-08-10 — the overlay alias is closed by D35, not deferred** (measured: it reproduces Task 690's fallback regression on `tailwindcss@4.3.0`). Delivered the brand single-source **ΔE sync gate** 661's review spawned on 2026-07-23 and that sat unfiled for sixteen days — `scripts/__tests__/brand-single-source.test.ts`, 31 tests, self-validating comparator — plus one comment-only correction to `--brand-950` (ΔE00 **3.6446 → 0**). Touched no overlay token; zero rendered delta. Three P3 documentation notes, no blocking finding. Archive row: `docs/backlog-archive.md`, 2026-08-10. | — |
| **695** | reserved | **Exit condition.** Delete the `@theme inline` `--overlay*` copy **and** the `--color-overlay*` namespace once the last of the **33** overlay utilities across **7** files is gone. **Must UPDATE 692's gate, not delete it.** Folds in 692 F1 `P3` and 662 F2 `P3`. **694 is no longer a dependency** — it stopped touching the pair on 2026-08-10 (D35), so 695's blockers are 691 · 702 alone. | 691 · 702 |
| **743** | reserved — filed by 700's review, Q4 | **The ownership blind spot 700 cannot see (700 F1).** `check:css-vars` computes ownership live from `globals.css`, so **deleting** a token there un-owns it *together with its orphaned consumers* and the gate goes silent — reproduced in review at `0 violations, exit 0` with 6 live TSX consumers left in place. Must decide a scoping rule that does not reopen the 112 Mantine runtime false positives, and prove it with a planted deletion. | — |
| **744** | reserved — filed by D36, Q2 | **`/[locale]` client-chunk attribution.** Route First Load JS **619 kB** vs **184 kB** shared (measured at `0dac78755`) leaves **435 kB** route-specific client JS that has never been attributed. Deliverable is the **attribution, not a fix** — start with the `@/design-system/mantine/patterns` barrel and the homepage client islands, and say which a server/client boundary change could actually move. | — |
| **700** | ✅ **`APPROVED WITH NOTES`** 2026-08-10, Q4 — **RE-SCOPED**, owner decision 2026-08-10. Archive row: `docs/backlog-archive.md`. Spawned **743** (F1, the ownership blind spot — a defect in this kickoff's own R3) | **CSS custom-property resolvability gate.** The reserved scope — "fail when a `.module.css` consumes an `@theme` var whose last Tailwind-utility consumer disappears" — was **measured and falsified** before the kickoff was written: Tailwind v4.3.0 keeps a `@theme` var alive for **any** static `var()` reference in scanned source, and **11** vars are currently kept alive by nothing but a `.module.css`. Two natural experiments already in the repo prove it (`--space-2-5` emitted vs `--space-0-5`/`-1-5`/`-3-5` dropped; `--text-2xl` emitted vs `--text-2xl--line-height` dropped), and **0** of the **140** dropped vars has any `src/` reference. Writing the reserved gate would have shipped a gate that cannot fail. 700 now asserts a **resolvability** invariant on **two arms**: every `var(--owned)` in the shipped CSS **and** every one written in `src/**/*.{module.css,tsx,ts}`. **Draft 1 was rejected in owner review before handoff** — CSS-only, it could not catch its own cited example, because Task 690's `var(--color-overlay*)` consumers are TSX inline styles (`LightboxView.tsx:45`, `MantineListingGalleryPattern.tsx:91`) and **16** owned tokens are TSX-only; it also mis-parsed `--spacing-N` out of a comment at `globals.css:148`, so its own counts were wrong in a document requiring comment stripping — that defect is now control **C3**. Corrected: `@theme` **190**, dropped **140**, owned **259**, Arm A **78**, Arm B **55**, baseline **0**; naive unscoped = **112** Mantine runtime false positives, so ownership is computed from `globals.css`, never listed. `Sprint_46_kickoff_prompt_Task_700_CssVarResolvabilityGate.md`. | — |
| **742** | ⚠️ `PARTIALLY VERIFIED` 2026-08-11, Q4 — implementation committed `502eadf0e`; **R6/AC5 (P0) unmet, `1 added`**. Closes on one owner-authorized re-run of `--mantine-only` on the pinned `502eadf0e` tree, judged on **that** run's result (**D37**), first artifact kept `UNATTRIBUTED`. Guard gap it exposed → **745** | **Rendered-run mode provenance.** Filed as the `--mantine-only`/anchor-row pairing defect (702 C3); measurement showed the doc already exists (`storybook-governance.md:752-755`) and Q0R already made the console banner truthful, so the real gap is that **every persisted artifact still over-claims** — `manifest.json` records no mode, and the inventory header falls through to "full", currently on disk as `Global enumeration (317 stories, 1204 cells)` for a run that rendered the 1204 **mantine-only** cells. Original framing kept below for provenance. **The `screenshots:assert --mantine-only` / anchor-row pairing defect (702 C3).** `check-stories-rendered.mjs:1634` reads `MANTINE_ONLY ? [] : ASSERT_STORIES`, so `--mantine-only` skips the anchor phase for **every** story — yet kickoffs keep pairing that invocation with an AC that requires `.listing-card` anchor rows to be green. 702's AC2 was unprovable by its own §13.2 command list for exactly this reason. Fix the pairing at the source (the QA/governance doc that kickoffs copy from), not per-kickoff. **691 · 695 · 741 all inherit the same template**, which is why this is its own number rather than a rider on 700. | — |

Carried in from Sprint 45 — all five numbers were issued during the unsprinted period and never executed.
691's kickoff predates the rule and stays at `tasks/kickoff_prompt_Task_691_MantineListingCardPattern_DeTailwind.md`;
kickoffs for 694, 695, 700 and 702 must be written **inside this sprint's directory path**.

## Preconditions before 691 starts

- **Measure `/[locale]` First Load JS first — and treat it as a delta, not a budget (D36, owner, 2026-08-10).**
  Record the number at I0 and again at the end; **stop the task on any increase**. Do **not** copy a figure from any
  document: the long-standing "618 kB against a 185 kB baseline" is wrong twice — the build at `0dac78755` measures
  route **619 kB** and shared **184 kB**, and route First Load JS is not comparable to shared JS at all, so their
  difference was never a valid pre/post base for 691. The unattributed remainder (**435 kB**) is **744**'s subject,
  and the barrel suspicion (`F3`) is still `NEEDS VERIFICATION` — a hypothesis, not a finding. 691 adds no new
  client boundary and no new page dependency, which is why D36 allows it to run while attribution is outstanding.
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
> **Order and gating only.** State lives in the Tasks table above — if a row here reads like a status, it is stale.

| **46.1** | **694** | ✅ landed. Blocked by nothing — **but not the task this row originally described.** The 2026-08-10 preflight measured the alias reproducing Task 690's static-fallback regression on `tailwindcss@4.3.0` and the owner closed that scope as **D35**; 694 is now the brand ΔE sync gate. For the record, the overlay declarations are at `globals.css:82-85` and `:470-471` (the backlog's `:76-79`/`:451-452` were stale) — **695 owns them now, and 694 does not touch them** |
| **46.2** | **702** | ✅ landed 2026-08-10, committed `0dac78755`. `ListingCard.tsx`, 8 `className=` sites; marker tokens verbatim; **D34** applies (the new module is layered; the adjacent `FavoriteButton`/`MantineListingCardPattern` modules stay unlayered by design). Kickoff filed 2026-08-10. **Runnable now** — the Tasks table above listed 691 as a dependency; re-measured 2026-08-10, none of the 8 sites touches a pattern file, so the dependency is dropped and this row is authoritative |
| **46.6** | **741** | The `CLOSED_OVERLAY_STYLE` producer, split out of 702. ⛔ Blocked on **691** — it needs the pattern's story and smoke test moved with it |
| **46.3** | **700** | CSS var resolvability gate, Q4; independent of 691. **Runnable now.** Re-scoped 2026-08-10 — the reserved `@theme`-dependency premise was falsified by measurement before the kickoff was written (see the Tasks table). Its CI step goes in the `click-shield` job, the only one that runs `npm run build`, so it costs no new build |
| **46.7** | **742** | Rendered-run mode provenance, Q4 — order/gating only, state is in the Tasks table. Narrowed in preflight: the doc already exists (`storybook-governance.md:752-755`) and Q0R already made the console banner truthful, so this is not the documentation fix the row originally described. The gap is that **every persisted artifact still over-claims** — `manifest.json` records no mode, and the inventory header falls through to "full", currently sitting on disk as `Global enumeration (317 stories, 1204 cells)` for a run that rendered the 1204 **mantine-only** cells. Adds `runMode`/`phasesSkipped`, an honest header, a `NOT RUN` console line and a unit-tested pure mode function; verdicts must stay byte-identical. **Runnable now**, and worth landing before 691 · 741 · 695, whose session logs will paste these transcripts. `Sprint_46_kickoff_prompt_Task_742_RenderedRunModeProvenance.md` |
| **46.10** | **745** | Capture-validity guard gap surfaced by 742's run, Q4: a partially unstyled frame passes `styleIntegrity` and is admitted as a real width verdict. Must preserve `:690` for **valid** frames, act **before** the width verdict, and classify an exhausted-retry invalid capture as uncited `unstyled-render`. **Runnable now**, independent of 742's re-run |
| **46.8** | **743** | The ownership blind spot 700 cannot see (700 F1): deleting a token from `globals.css` un-owns it *and* its orphaned consumers, so `check:css-vars` goes silent — reproduced in review at `0 violations, exit 0` with 6 live consumers left in place. Must decide a scoping rule that does not reopen the 112 Mantine false positives, and prove it with a planted deletion. **Runnable now**, independent of 691 |
| **46.4** | **691** | ✅ **UNBLOCKED — D36** (owner, 2026-08-10). Runs under a **no-increase** perf condition: record `/[locale]` First Load JS at I0 and at the end, **stop on any increase**. **Re-measure at I0** — the standing "618 vs 185 kB" is wrong twice (build at `0dac78755`: route **619 kB**, shared **184 kB**) and compares two non-comparable quantities, which is why it was never a valid pre/post base. The unattributed **435 kB** is **744**, deliberately kept separate |
| **46.5** | **695** | Blocked on 691 — it is the sprint's exit condition and cannot run before the work it measures |
| **46.9** | **744** | `/[locale]` client-chunk attribution: name what the 435 kB route-specific JS contains, starting with the patterns barrel and the homepage client islands. **Attribution only, no remediation** (D36). Independent of 691, runnable now |

**The 46.1–46.3 rule stands, for a different reason now.** It was written because the sprint sat at zero landed
tasks waiting on one owner decision; that decision arrived as **D36** on 2026-08-10 and three tasks (694, 702, 700)
had already landed by then, which is the argument for it having been the right rule. Keep 691 after them anyway:
it is the sprint's only visually-risky task, and 741 · 695 both re-anchor onto what it lands.
