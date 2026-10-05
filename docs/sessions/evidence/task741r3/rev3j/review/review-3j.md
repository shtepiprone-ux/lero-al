# Task 741 — review of Revision 3j (§18.21), Opus, 2026-10-05

`REVIEW PREFLIGHT COMPLETE — loaded in this session: .claude/skills/review-task/SKILL.md; docs/orchestrator-role.md; docs/orchestrator-procedures.md.`
(Plus `docs/agent-contract.md` 16a–16d and `docs/golden-rules.md` GR-7, GR-9, GR-10 and GR-11, read in this session.)

Mode: IMPLEMENTATION REVIEW. Q4 (kickoff header; `ListingCard.tsx` is in `docs/critical-flow-registry.md`). Platform
`win32`, Node v22.22.3, working directory `C:\Claude_Code_Projects\lero-al`. This review resumes a session that hit
its spend limit before its verdict. Every fact below was re-read or re-run in this session. The earlier session's
`diag-check.mjs/.json` is context only: its numbers were noisy and are not relied on.

## Decision: `PARTIALLY VERIFIED`

Every Revision 3j requirement (R74–R76) and AC63–AC65 is verified, and no P0/P1/P2 finding is open. Approval still
needs the owner's O46-4 matrix (§18.19.10, §18.20.7, §18.21.7): "741 can be approved after … the owner's acceptance
of O46-4" (§18.19.11). The visual criterion is `NOT VERIFIABLE` until the owner returns it.

## Requirement trace

| ID | Observed | Source inspected | Artifact / command | Counter-check | Status |
|---|---|---|---|---|---|
| R74 | `.archived .imageSection > :first-child { opacity: 0.6 }` inside `@layer utilities`; comment as required; `{image}` first in both `Card.Section`s, one order comment in each; no wrapper | `MantineListingCardPattern.module.css:40-53`, `MantineListingCardPattern.tsx:280-288, 307-314` | — | Is `{image}` always one element? `ListingCard.tsx:205-206` always passes an `AppImage`. `AppImage.tsx:132-178` always returns one root `<div>`; with no photo it holds the `MediaPlaceholder`. The pattern Story passes an `AppImage` with `src={null}` for no-image. So `:first-child` is the photo in every consumer. | VERIFIED (FACT) |
| R76 / AC63 | 8 archived cards: root 1, image 0.6, badges 1, photo count 1, favourite 1, failures 0 | `rev3j/exec/archived-opacity-probe.mjs` | executor red `01_red.txt` (exit 1, 20 failures on 3i); green `final/08c` (exit 0); **Opus re-run** `review/archived-opacity-review.json` (exit 0, 0 failures) | Label array empty: archived cards carry no sold/rented overlay (`isListingArchived` = archived/expired), so the label check is vacuous by data, not by a probe gap | VERIFIED |
| AC63 shot | `primitive-archived-1440.png`, viewed: *Archived* badge, photo count and favourite at full contrast on a faded grey photo | — | `rev3j/exec/primitive-archived-1440.png` | — | VERIFIED |
| R75 / AC64 | Each DPR in its own context; 33/33 DPR 1.25 crops sized ×1.25; twin built in the browser only; exit 0 final, exit 1 `--plant` naming `grid-badge-new` (opacity 0.4) and `grid-photo-count` (same-colour border) | `rev3j/exec/corner-twin-probe.mjs` | `final/08d`, `final/08e`, `01b_red_plant.txt`, contact sheets | The pixel metric does not see the planted border (74.2 vs twin 78.3). The computed-style check catches it. See N1 | VERIFIED, with N1 |
| AC64 sheets | Viewed in this session (`review/sheet1-roots.png`, `review/sheet1-badges.png`, 10× rows cut from the executor's `corners-sheet-dpr1.png`): every card-root corner (rest, hover, premium, archived; grid and list) and every badge corner reads as a smooth arc, the same shape as its twin; the badge shift is the label glyphs inside the corner square | — | — | TailAdmin card crop: stray blue corner of a neighbour (saved, not scored, as the executor says) | VERIFIED |
| AC65 | badge-visible 226 badges / 0 failing; parity 8 cells, 424 comparisons, 0 diffs; R73a vitest green | 3h/3i probe scripts, untouched (mtimes 2026-10-04; their 3h/3i outputs intact) | **Opus re-runs** `review/badge-visible-review.json`, `review/parity-review.json` (both exit 0); executor `final/03_vitest.txt` (75 pass) | — | VERIFIED |
| Gates | win32; census FAIL only `ListingsShell.tsx` (expected); vitest, check:stories, story-coverage, design-tokens:strict, build-storybook, typecheck, lint (0 errors), **build**, file-integrity, mojibake, backlog-active all `EXIT_CODE=0`; the three `Select-String` lines empty | — | `rev3j/exec/final/00–19` | Timeline: source edit 07:52:17 → `storybook-static` 07:54:01 → probes 07:56–07:57 → `next build` transcript 08:01:19. `final/18_hashes.txt` lines 1–2 = the current `git hash-object` of the two R74 files | VERIFIED |
| Scope | Changed since 3i: only `MantineListingCardPattern.module.css` (0c5bd039 → d5ce8033) and `.tsx` (7621695e → 3f54c796). The other six hashed files equal 3i's `final/18_hashes.txt` (re-hashed in this session) | — | `git hash-object` this session | — | VERIFIED |

## Findings

None at P0/P1/P2.

- **N1 — NOTE (orchestrator design, R75).** The r×r area metric that §18.21.3 R75 prescribed is blind to a
  same-colour border. The planted border on the photo count scores 74.2 against a twin of 78.3, inside the 10-point
  band. The probe fails the plant only because of the computed-style check the executor added (effective opacity 1;
  no border in the fill colour). GR-11 prescribes diagonal coverage, and R75 should have kept it. The real objects pass
  both checks, so no shipped corner is affected. The lesson is carried to Task 920's reserved row.
- **N2 — NOTE (probe fidelity).** The archived badge's twin is painted outside the card, so it misses the root's
  `filter: grayscale(1)`: slate twin, grey object. Only the colour differs, not the geometry. The score stays inside
  the band (75.2 vs 78.3).
- **N3 — P3 (evidence).** `final/run-gates.ps1` names eight paths for `18_hashes`, but `final/18_hashes.txt` prints
  six lines. The two missing paths (`FavoriteButton.stories.tsx`, the pattern smoke test) are outside 3j's scope, and
  their current hashes equal 3i's (re-hashed in this session). The transcript does not match its stated command.
- **N4 — NOTE.** List favourite: white 80% fill on a white info column, so coverage is 0 for the object and its twin
  at rest and on hover. Nothing visible can be notched. Recorded as measured, which is correct.
- **Not a finding: card-root radius 6px vs TailAdmin/Omah 12px.** The card's look against the owner's reference
  (radius included) is Task 918's by owner D46-5 / D89-10, recorded in §18.20.7. The corner itself is smooth and
  matches its twin.

## GR-7 (moment: review)

`GR-7 REFERENCE RESEARCH — moment: review (741 Revision 3j); role: Opus; task: 741; subject: archived card look, card-chrome corners; references: Lahomes, Kamr, Omah, TailAdmin + Rozetka (owner, record of §18.19.4); library: docs/research/references/2026-10-04; live-checked pages (this session, 1440 and 390, full-page shots): Lahomes /property-grid → unchanged (Sold label, photo and card at effective opacity 1, filter none; cards 5.6px), Omah /property-list + /ecom-product-grid → unchanged (12px), TailAdmin /cards → unchanged (12px at 1440, 1px rgb(228,231,236)), TailAdmin /badge → unchanged (pills, opacity 1), Kamr /ecom-product-grid (logged in) → unchanged (7px, 1px rgb(194,194,194)); route inventory: Lahomes 106/106/0, Kamr 62/62/0, Omah 339/339/0, TailAdmin 88/88/0 (library), Rozetka 2/2/0; inspected in depth: the six pages above plus the Lahomes Sold card crop; workflow states operated: Kamr login, scroll to the Lahomes Sold card; options across references: a closed listing keeps its label at full opacity ← Lahomes /property-grid; no reference fades a label or badge; chosen 2026 best practice: the shipped 3j state (photo faded, badges, photo count and favourite at full contrast; WCAG 1.4.3, GR-11); absent or unverified: none; lero.al data map: ListingCard → MantineListingCardPattern isArchived (archived/expired) on /favorites, the cabinet and the card Stories; owner decisions: D46-5, D46-9, D89-10, D90-1; evidence: docs/sessions/evidence/task741r3/rev3j/review/research-review/ (gr7-review-3j-s2.*, lahomes-sold-s2.*, shots/s2-*).`

Kickoff receipt (§18.21.2) and the executor receipt (session log `## Revision 3j`) are both present. The executor
re-opened only the three pages the kickoff named and relied on library rows for Kamr and Omah. That is what §18.21.2
told it to do. The library route is permitted (owner decision 2026-10-04).

## GR-9 (one per matrix Story)

- `GR-9 REVIEW DEPTH — mantine-primitives-listingcard--default, patterns-mantine-listingcardpattern--default: elements per card 9 parts (each → MantineListingCardPattern; badges → status Badge theme entry; favourite → FavoriteButton; photo → AppImage); non-canonical props/values: NONE (3i F62 fixed by R74); production states open/new/reduced/premium/inactive/pending/sold/rented/archived/expired/no-image → rendered, missing NONE, unreachable shown NONE; variant parity grid/list 424/0 (Opus re-run), archived parts equal in both layouts (image 0.6, everything else 1); executor claims checked 9/9, contradictions NONE (N3 is a transcript gap, not a contradicted claim); evidence docs/sessions/evidence/task741r3/rev3j/review/.`
- `GR-9 REVIEW DEPTH — patterns-mantine-listingsshellview (Default, LoadingMore, ClosedTab, ClosedEmpty, Empty): elements unchanged since 3i (no archived card on /listings; the closed tab is sold/rented); non-canonical props/values: NONE; states as the 3i review; badges visible in the closed tab at 390/768/1440, 0 failing (Opus re-run); variant parity 424/0; contradictions NONE; evidence review/badge-visible-review.json, rev3i/review/review-3i.md.`
- `GR-9 REVIEW DEPTH — mantine-primitives-pagination (InCenteredGroup, Default), patterns-mantine-listingspagination, AdminListingsView Paginated, AgentStatisticsView: source unchanged since 3i (MantinePagination.tsx and pagination-chrome.css hashes equal to 3i's); receipts of the 3h/3i reviews stand; contradictions NONE; evidence rev3i/exec/final/18_hashes.txt.`

## GR-10, GR-11, GR-3

- `GR-10 CANONICAL MATCH — ListingCard / ListingCardPattern / ListingsShellView: elements 9 per card; with canonical owner 9/9; matching the original 9/9 between layouts (parity 424/0); missing or differing: NONE for 741's scope. The card against the owner's reference is Task 918 (D46-5 / D89-10, §18.20.7).`
- GR-11: the executor's 33 `GR-11 CORNER CHECK` lines (session log) were checked against `corner-twin.json` and the
  sheets. Each object is within 10 points of its twin at DPR 1 and 1.25, effective opacity 1, and no same-colour
  border. The grid favourite is the widest gap, 71 vs 77.6 at DPR 1. N1 limits what the pixel number proves. The
  computed-style check and the viewed crops close that gap.
- GR-3b/3c/3d/3e/3f/3g: R74 changes one opacity on one node. It touches no width, text size, gutter, text button,
  circle or ring, so the 3i receipts stand.

## Backlog

`GR-5 BACKLOG ACTIVE — check:backlog-active exit 0.` (run after the state edits in this review).

## Approval, 2026-10-05 — ✅ `APPROVED WITH NOTES`

The owner accepted all four O46-4 rows, verbatim *"приймаю"* for each (kickoff §18.23). Notes N1–N4 stay open as notes.
N1 is carried in Task 920's reserved row.

**Closure**
- The kickoff moved to `tasks/Archive/`. Its live references were rewritten, including the two 741 review ledgers. The
  ledger gate's violation list is identical before and after the move: 0 lines differ, and the move added no
  missing-path error.
- The archive row was added and 741 removed from the active backlog. `check:backlog-active` exits 0 (80 lines).

**Commit split.** `scripts/mantine-migration-scope.json` and `scripts/surface-census-baseline.json` also carry Task 859
hunks.
- `approval/741-*.patch` stage only 741's hunks, through `git apply --cached`.
- Each patch was proven in memory against the HEAD blob: exact context, JSON parses, and no 859 line leaks in.
- No 741 file imports a file that only 859 changed or adds.
