# Session Archive: backlog consolidation, review-verdict recording, and sprint-discipline restoration — 2026-08-01

**Mode:** Opus orchestrator, documentation only. **No `src/` file was touched.** **Owner:** present throughout,
rejected two intermediate results and made both structural calls.

## 1. What triggered it

Two things, in this order. First, the **unrecorded review verdicts for 703/704/705** — the preceding session
reviewed them but ran out of context before writing anything down, and the owner opened this session by saying so.
Second, a cleanup of `docs/backlog.md`, which had grown to **10,290 words in 80 lines**, two of them
multi-thousand-word paragraphs. The cleanup then widened into a full audit as each pass surfaced a further defect.

## 2. Files changed

| File | Change |
|---|---|
| `docs/backlog.md` | Rewritten. 10,290 → ~2,150 words. Sections restructured 8 → 8 with all duplication removed. |
| `docs/backlog-archive.md` | +17 ledger rows (662 · 663 · 664 · 666 · 668 · 669 · 671+675 · 681+684 · 685 · 686 · 688 · 690+693 · 692 · 696 · 699 · 701 · 703 · 704+705), date-sorted into position. One dangling link corrected. |
| `docs/sessions/…task703….md` | §11 — orchestrator review outcome. |
| `docs/sessions/…task704….md` | §16 — orchestrator review outcome, interim `NEEDS REVISION` lifted. |
| `docs/sessions/…task705….md` | §15 — orchestrator review outcome. |
| `tasks/Sprints/Sprint_45_Unsprinted_Period_621_to_705.md` | **New.** The 621–705 gap closed as one named period. |
| `tasks/Sprints/Sprint_46_ListingCard_DeTailwind_And_Overlay_Exit.md` | **New.** First planned sprint since 44. |
| `CLAUDE.md` | Sprint-assignment rule added to "Task and review rules". |
| `.claude/skills/create-task/SKILL.md` | Blocking sprint pre-check, placed **before** the document-structure section. |
| `docs/ai-behavior.md` | Sprint rule added to "Task File Location Rules". |

## 3. Review verdicts recorded — the session's substantive outcome

**703 `APPROVED`. 704 + 705 `APPROVED` as one pair, 704's interim 🛑 `NEEDS REVISION` LIFTED.**

Provenance, stated precisely because it matters for how much these records are worth: the reviews themselves were
**performed in the preceding session**, which ran out of context before writing them down — that unrecorded state is
exactly what opened this session. The **owner supplied the full review text in-session**, and it was transcribed
verbatim into each task's log. A first pass had instead **reconstructed** verdicts from backlog prose, carrying a
disclaimer that it was "a record of the verdict, not a transcript"; that pass was **discarded wholesale** once the
real text arrived, not merged with it.

What the real reviews carried that the reconstruction had missed or got backwards:

- **703** — the sole deviation is an **orchestrator defect**, not an executor one: the kickoff's I3 described the
  cell total growing past 260 while A2 of the same task forbade a new story matrix. The executor complied with A2 and
  *flagged the contradiction*. The reconstruction had reported 260/260 as a plain executor success.
- **704/705** — the freeze's `*, *::before, *::after` reach is **deliberately not narrowed** (narrowing to the
  Skeleton alone would leave every other animated story non-deterministic under capture). The reconstruction had
  described this as incidental "identical reach".
- **704/705** — the anticipated "missed page-creation site" defect **never existed**: `check-stories-rendered.mjs`
  has exactly one, `newPage()`:845, with `emulateMedia`:852.
- **704/705** — `skeleton-chrome.css` diffed against `HEAD` shows **33/2**, fencing D27.
- **F1 `P3`** (`check-homepage-grid.mjs` lacks `emulateMedia`) came with an **assessment on the merits** — that gate
  reads layout only, opacity does not move layout, the one theoretical vector pre-dates 705 — so it is closed as
  harmless rather than left as an open follow-up, which is how the reconstruction had filed it.
- The **one-commit shape for 704+705 was a review decision**: 704's code was `NEEDS REVISION` and never committed,
  705 corrects it in place, and splitting them would write a rejected state into permanent history.

**701**'s review already existed in its own log from 2026-07-31; it was read and used to correct that task's ledger
row, not rewritten.

## 4. The sprint gap

Sprints 0–44 were planned up front and ended at **Task 620**. Tasks **621–705** then ran with no sprint above them
for roughly six weeks. Nobody noticed. The visible consequence: `docs/mantine-tailadmin-migration-tracker.md` (last
touched 2026-07-06, highest task 556) went on naming DatePicker, PhoneField, FiltersPanel and HeroSearch as the next
slices — **all four were already done** — because no sprint boundary ever forced it to be re-read.

Closed as **Sprint 45 — the unsprinted period**, covering all **85** numbers (66 closed + 19 issued-never-executed).
Sprint discipline restarts at **46**. Rule recorded in three places; binds Task **706** onward.

## 5. Stale facts found and corrected in `backlog.md`

| Claim | Was | Verified 2026-08-01 |
|---|---|---|
| 701/703/704/705 commit state | "APPROVED but UNCOMMITTED" | All committed **and pushed**: 696 `82ece5c53` · 699 `5065a6df1` · 701 `0fb66b643` · 703 `525776a16` · 704+705 `a5eed6542`. HEAD not in `origin/main`. |
| 695 overlay utilities | "33 across 8 files", `PerfDevOverlay` 10 | **33 across 7 files**; `PerfDevOverlay` 11. The old per-file split summed to 32. |
| 694 declaration site | `globals.css:311-315` | `:76-79` (`@theme inline`) + `:451-452` (`:root`) — moved by 690/693. |
| 689 | "likely closed by 699 — owner call" | **Closed, proven.** `SECTION_HEADING_FZ` has exactly the 4 census consumers; the only `1.875rem` left in `src/` is `page.tsx:31`, the hero triple 689 was forbidden to touch. |
| Cleanup step 3 | "delete 3 probes" | `scripts/` holds **13** task-numbered probes, **all 13 unwired**. |
| Epic MM | "Next primitives per tracker" | Tracker is ~150 tasks stale; filed as an owner decision. |

Verified-and-correct: `MANTINE_VIEWPORTS` = 4 widths at `:392` · manifest 15 entries · `check:design-tokens` 28 on a
live run · 691 = 25 sites (28 `className=` − 3 contract strings) · 702 = 8 · `sonner`/`next-themes` still present ·
`AdminUsersTable` absent from the manifest · 661 and 665 genuinely without a verdict.

## 6. Defects in this session's own work — recorded because the pattern is the point

Three of them, all the same failure: **measuring the metric the work passes instead of the one that catches the
defect.** This is the M1 · M2 · M4 · M5 family the backlog's own Standing notes warn about, committed while writing
that warning.

1. **"APPROVED but UNCOMMITTED"** — copied the word `uncommitted` out of session logs, true when written and stale
   when transcribed. `git log` was never opened. Caught by the owner.
2. **Eight fabricated sprints.** A first reconstruction split 621–705 into themed "sprints" 45–52. The ranges
   **overlapped in nine places** — Sprint 51 sat entirely inside Sprint 50 — because only *review* dates exist, not
   work dates, and several tasks were reviewed in batches long after implementation. Deleted. The recommendation to
   split thematically was the orchestrator's, and it was wrong; the option presented as inferior (one bucket) was the
   honest one.
3. **"без спринта — жодного"** reported while **14 numbers** (622, 623, 628, 667, 673, 676–680, 682, 683, 687, 689)
   belonged to no sprint — the check counted kickoff *files*, not numbers.

**Standing lesson, added to `docs/backlog.md`:** reconcile git state from `git log`/`git status`, never from a
session log's self-description; and a verification that cannot fail is not a verification.

## 7. Verification run at close

- Every task number, `D`/`M` identifier and commit hash present in the pre-edit `backlog.md` is still present in
  `backlog.md` + `backlog-archive.md`. Two exceptions, both deliberate: `385` (a line count, not a task) and
  `c97915760` (an md5 witness of a worktree state superseded by D19).
- Numbers owning a description in more than one section: **23 → 0**.
- Sprint 45 covers **85/85** of the 621–705 range.
- Every `sessions/*.md` link in `backlog.md` and `backlog-archive.md` resolves; the one dangling reference
  (`…task527-tailadmin-conformance-corrections.md`, which never existed) was replaced with a pointer to Task 528's log.

## 8. Left open

- **HEAD is not in `origin/main`.** Everything through 705 sits on `task/q0-ci-rendered-locale-split`.
- This session's own files are uncommitted; owner-run handoff pending.
- Owner decisions filed: refresh or demote the Epic MM tracker; ack 689's retirement; decide 670 and the other 9
  unwired probes alongside cleanup step 3.
- **661 and 665 have no sprint** — both were issued in the unsprinted period but are still open, so placing them in
  a CLOSED Sprint 45 would be wrong. Flagged for the owner.
