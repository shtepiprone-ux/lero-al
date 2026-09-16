# Task 824 — The listing gallery: canonical Mantine thumbnail squares, nav controls, and the mobile swipe view

> **Sprint 75 · Q3 Full Visual Matrix · CONSOLIDATED 2026-09-13.**
> This file replaces the previous five stacked revision sections (§16–§20). Their content is either
> **closed** (recorded in §3 below), **still binding** (restated in §4 and §5), or **superseded**.
> Nothing in this task requires reading an earlier version of this kickoff. The full narrative history
> lives in the session log and in git — see §14.
>
> **Status: NEEDS REVISION (Opus review 6, 2026-09-16). Route: this file, §15.**
> §7's R37–R41 are partly closed — §15.1 records exactly which, and supersedes the rest.
> Do not re-execute a §7 row that §15.1 marks `CLOSED`.

---

## 1. Mode and task type

Implementation re-entry, UI/visual, Mantine-migrated surface. **QA profile `Q3 Full Visual Matrix`**
(`docs/qa-profiles.md`) — migrated Mantine primitives and high-risk responsive work. Not Q4: no critical
flow, auth path, RLS policy or data write is touched.

Executor: Sonnet, via `.claude/skills/execute-task/SKILL.md`. Sonnet cannot approve this task; its strongest
completion status is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 2. Objective

The listing gallery's thumbnail row is canonical Mantine squares, not a stretching `SimpleGrid`; the lightbox
and the closed gallery share one set of nav controls; below the `sm` breakpoint both browse by swipe with
infinite wrap and no arrows or thumbnails; and every dimension comes from a registered token.

**That product work is done and verified.** What remains is not product behaviour. It is the evidence record:
this task has now been returned five times, and four of those returns were the same defect — the session log
stating numbers that its own retained transcripts do not contain. §7 closes exactly that, plus one production
edit whose stated cause is wrong. Read §10 before you write a single number anywhere.

## 3. State of play — verified closed, do not re-do

Verified by Opus against the raw artifacts, not against the completion report. Re-running any of this is waste;
changing any of it is a regression.

**Product behaviour — closed.**

- Thumbnail squares via `AspectRatio ratio={1}` in `GalleryThumbnailButton`; 44×44 measured identical at 768 /
  1024 / 1440, absent below `sm`, no horizontal page overflow at any width (`142`).
- `GalleryNavActionIcon`, `GalleryDesktopNavigation`, `GalleryThumbnailButton` live in
  `src/design-system/mantine/patterns/`, each with its own canonical Story and manifest entry (D824-2).
- Desktop thumbnail click selects only; the lightbox opens from the main photo (D824-3).
- `theme.other.borderWidth.galleryThumbActive`, `boxSize.paginationSegment`,
  `boxSize.paginationSegmentThickness` registered and consumed; no raw literals (D824-4).
- Mobile: pointer-drag and `ArrowLeft`/`ArrowRight` share the touch state machine; infinite wrap holds under
  interrupted settles; the swallowed-first-tap bug is fixed and **measured with real input** —
  `page.touchscreen.tap()` opens the lightbox on the first tap at 320 and 390, plain and post-drag (`167`).
- Desktop lightbox reserves space for its strip: column flex, `flex-1 min-h-0` media, `shrink-0` strip in
  normal flow, `max-h-[85vh]` deleted. `bottom <= top` at 1024/1440 × 700/800/900, 6/6 (`167`).
- The media frame is aspect-ratio independent: landscape `1200×675` and portrait `675×1200`, both
  `complete:true`, identical rect at all six combinations (`193` lines 6-23).
- Leading-thumbnail stranding in the relocated strip is fixed: `justify-start` + an `mx-auto` inner row; at 24
  photos / 1024 the first thumbnail is `left:72` against `stripLeft:64`, fully visible, and the last stays
  reachable at max scroll (`193` lines 24-27).
- `src/design-system/media/appImageConfig.ts` and `AppImage.module.css` are byte-identical to `HEAD` and
  absent from `git status` — confirmed independently by the owner's own status run.

**Evidence discipline — closed.**

- Transcripts are verbatim command output again (`195` 9 687 B with every lint warning; `206` 6 954 B with
  every token violation; `208` 4 907 B with Next's route table; `209` 376 517 B). This is the standard §10
  now makes permanent.
- The measurement harness is retained at `docs/sessions/evidence/task824/harness_r19_measure.mjs`.
- Real `page.mouse` CDP input does not move `dragOffset` in this headless environment — tried twice (`142`,
  `193`), raw inert output retained, and the earlier "capture confirmed working" claim withdrawn. Correct
  outcome; do not retry it.
- Session-log §12.3's AC13/AC19/AC26 lines and §13.7's table (including `189` superseded by `190`) are
  corrected in place and marked.
- The eight `git status` paths that belong to no Files Changed table are classified as parallel Opus/owner
  work, with the `MantineListingCardTrack.module.css` line-209→208 forensics that settle it.

**Gates — the expected final state.** `typecheck` / `lint` / `check:stories` / `check:story-coverage` /
`check:rendered-scope` / `check:surface-census:changed` / `check:pattern-enrolment` / `check:media-enrolment`
and every `*:verify` exit 0. `check:design-tokens:strict` 50 violations (ceiling 56) and
`check:tailwind-runtime-tokens` 1 row both exit 1 by design — the count is the criterion, not the exit code.
`check:locale-leak:mantine-only` 158 leaks, unchanged since the 2026-09-11 baseline. `build` and
`build-storybook` exit 0. The per-surface census exits **1** on `LightboxView.tsx` alone — that is Task 825's,
reconciled against `01_baseline_surface-census.txt`, and it stays. The seven protected gate scripts' diff is
empty.

**Still open and not closable here:** AC12a's owner visual-QA matrix (owner-only, not satisfiable by
automation) and real-device confirmation on a physical phone.

## 4. Binding owner decisions — verbatim, 2026-09-12

Also recorded in `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md`. All four are
implemented; they are restated here because they are the authority for what must not be changed back.

> D824-1: A — нижче 640px додати mouse/pointer drag і keyboard arrows; mobile chrome лишається без thumbnails та side arrows.
>
> D824-2: A — винести GalleryNavActionIcon, GalleryDesktopNavigation і GalleryThumbnailButton з LightboxView у src/design-system/mantine/patterns/, із окремими Stories та enrollment.
>
> D824-3: A — desktop thumbnail click лише обирає фото; lightbox відкривається тільки через main photo.
>
> D824-4: зареєструвати потрібні значення для 2px border і 16px × 2px pagination segment як theme.other roles, без raw literals.

## 5. Binding scope rulings inherited

1. **`LightboxView.tsx` is not enrolled in the manifest.** Its census FAIL is Task 825's. Reconciled, not fixed
   here.
2. **"No gate script is edited" means logic, thresholds, scope or exit semantics.** A justified per-story
   `PER_STORY_TOKENS` data entry in `scripts/check-locale-leak.mjs` is this project's sanctioned route for a
   genuine loanword and is not a gate edit. The existing `unstyledbutton_link_label` entry is retained and
   correct (`uk` = `Посилання`, `sq` = `Lidhje`, `it` = `Link`). The seven-script empty-diff check is the
   measurement.
3. **`appImageConfig.ts`'s `lightbox` header comment stays stale on purpose.** It still says "caller is
   `max-h-[85vh]` container", which is wrong after that class was deleted. Editing that file re-enters it into
   the diff and turns `check:surface-census:changed` red again, for the sibling-script filtering gap the task
   correctly declined to fix. It belongs to Task 825 or to whichever task closes that gap. **Do not fix it.**
4. **The eight parallel-work paths** (`.claude/agents/executor.md`, `.claude/hooks/sonnet-executor-bootstrap.ps1`,
   `.claude/skills/execute-task/SKILL.md`, `docs/ai-behavior.md`, `docs/component-rules.md`,
   `docs/governance-checklists.md`, `Sprint_75_The_Gates_…md`, `MantineListingCardTrack.module.css`) are not
   this task's. Classified, not to be touched.

## 6. Pre-read bundle

`docs/golden-rules.md` in full · `docs/agent-contract.md` clauses **9, 13, 16, 16a-16d** ·
`docs/qa-profiles.md` (Q3) · **§10 of this file** · `src/modules/listings/components/LightboxView.tsx` ·
`src/stories/mantine/primitives/LightboxView.stories.tsx` · `src/design-system/media/AppImage.tsx` and
`AppImage.module.css` — specifically `.imageLayer` · `docs/sessions/evidence/task824/harness_r19_measure.mjs` ·
`docs/sessions/evidence/task824/193_r19_ac37_ac41_ac38_measurements.txt` in full · session-log §14.

Do not read §1–§20 of any earlier version of this kickoff. Everything still binding is in this file.

## 7. The remaining work — R37 to R41

| ID | Requirement | Sev | AC |
|---|---|---|---|
| **R37** | **Every number in the log exists in a transcript.** Session-log §14.9's `193` row says "pre-fix showing the real defects" and "`strandedBeforeOrigin: true` → `false`". `193` is 35 lines and holds exactly one `strandedBeforeOrigin` reading — line 25, `false`. session-log §14.3 attributes four pre-fix readings to "`193`'s raw output" — `scrollWidth:1076`, first thumbnail `left:-108, right:-64`, `strandedBeforeOrigin: true`, `scrollLeft = 180` — and none is in the file. session-log §14.2 states a pre-fix media rect `{left:0, right:1024, width:1024}` and cites no transcript at all. `LightboxView.tsx`'s strip comment now carries `left: -108px` as a **measured** value with nothing behind it. The numbers are internally coherent (`1076 = 896 + 180` is the one-sided-overflow signature), so this is a retention failure, not an invention — but a coherent number in prose is not evidence. **Do:** either retain the pre-fix run as `218_*` (temporarily revert the two `LightboxView.tsx` utility changes, rebuild `storybook-static`, run the retained harness, restore, and prove the restore with `git hash-object`), or delete every pre-fix number from session-log §14.2, session-log §14.3, session-log §14.9's `193` row and the source comment and say at each site that the pre-fix state was observed but not retained. | **P0** | AC43 |
| **R38** | **`min-w-0`'s stated cause is disproved by the component it names, and the edit was out of scope.** session-log §14.2 and `LightboxView.tsx`'s wrapper comment both explain the pre-fix full-width wrapper as a flex `min-width: auto` floored by "the `<img>` … whose min-content contribution can be its own natural size (1200px)". That `<img>` is `AppImage`'s, and `AppImage.module.css`'s `.imageLayer` — the class `AppImage.tsx` puts on it — is `position: absolute; inset: 0; width: 100%; height: 100%`. An out-of-flow element contributes **nothing** to any ancestor's intrinsic min-content size, decoded or not. The named mechanism cannot produce the observed effect. Two changes also landed together with no isolated comparison, and session-log §14.3 records their entanglement in its own words. Separately, the scope then in force authorised `LightboxView.tsx` only for the strip's justification rule; `min-w-0` is a second edit to a different element and needed a `STOP`. **Do — pick one and say which:** **(A)** produce a three-arm A/B in one transcript (`219_*`) at 1024 with the 24-photo fixture — `min-w-0` only, strip fix only, both — quoting the wrapper rect in each arm, then rewrite the cause to what the arms show and keep `min-w-0` only if an arm proves it load-bearing; or **(B)** revert `min-w-0`, re-run AC37 and AC41, and show both still pass without it. | **P1** | AC44 |
| **R39** | **The `GR-2 SCOPE STATED` receipt is false as written.** session-log §14.6 states "No file outside the scope then in force was touched" and files `min-w-0` under the stranding clause, which authorised the strip's justification rule only. A receipt that reclassifies an out-of-scope edit as in-scope is the failure GR receipts exist to prevent. **Do:** correct session-log §14.6's `GR-2` in place, and state it truthfully in the new session-log section — if R38 route (A) keeps `min-w-0`, name it as an out-of-scope edit authorised by **this** §7/R38, with its date. | **P1** | AC45 |
| **R40** | **The evidence range names files that do not exist, and two that do exist are in no row.** session-log §14.5 claims "one range, three places" and says `167`–`223`; session-log §14.9's header and §14.8 say `193`–`223`; the completion report said `193`–`217`. **The directory's highest transcript is `217`; `218`–`223` were never written.** Meanwhile §14.9's table ends at `215`, while `216_r19_final_file-integrity.txt` and `217_r19_final_mojibake.txt` exist and appear nowhere — the same omission already corrected once for `190`/`191`/`192`. **Do:** give session-log §14.9 a row for every transcript through the highest that exists, and state one identical range in the session log, in `docs/backlog.md` and in the completion report, written **after** the last file. | **P0** | AC46 |
| **R41** | **`docs/backlog.md`'s Task 824 entry is one physical line in a Markdown table, and it is not there right now.** The §14 update appended it hard-wrapped at ~100 characters, which pushed everything after the first break outside the table cell and took the file from 79 to 102 physical lines against a hard limit of 80. That edit has since been rolled back along with the kickoff, so the row currently carries no §14 state at all. **Do:** re-add this session's concise state to the Task 824 row **on one physical line**, and report the file's physical line count. If it cannot fit under 80, report `BACKLOG LIMIT BREACH` and consolidate historical detail into the session log — never a wrap, never a deletion of active state. | **P2** | AC47 |

**§7 disposition after Opus review 6 (2026-09-16) — read §15.1 before acting on any row above.**
R38, R39 and R41 are `CLOSED`. R37 is `PARTIALLY CLOSED` (its route-(A) restore witness is still missing
and one pre-fix bullet is still unretained) and R40 is `NOT CLOSED`. AC43, AC44, AC45, AC46 and AC47 keep
their identifiers and their wording; §15 adds R42–R47 / AC48–AC53 on top of them.

## 8. Acceptance criteria

- **AC43 [R37]** — Either `218_*` contains the pre-fix harness output with the wrapper rect, the strip's
  `clientWidth`/`scrollWidth`, and the first thumbnail's `strandedBeforeOrigin: true`, **and** `215`'s recorded
  `git hash-object` value for `src/modules/listings/components/LightboxView.tsx` is reproduced after the restore
  (quote both hashes); or session-log §14.2, session-log §14.3, session-log §14.9's `193` row and the source comment contain no pre-fix number and
  each says so. No site cites `193` for a number `193` does not contain.
- **AC44 [R38]** — Either `219_*` quotes the desktop wrapper's rect at 1024 with 24 photos in three arms
  (`min-w-0` only, strip fix only, both) and the session log's root cause states what those arms show; or
  `min-w-0` is absent from `LightboxView.tsx` and a re-run quotes AC37's six identical rects and AC41's
  `strandedBeforeOrigin: false` / `firstFullyVisible: true` without it. In both cases no sentence in the session
  log or in any source comment attributes the effect to an out-of-flow `<img>`'s min-content contribution.
- **AC45 [R39]** — The new session-log section's `GR-2 SCOPE STATED` lists every path this task touched and
  classifies each against §9, naming any edit outside it and the section that authorised it; session-log §14.6's `GR-2`
  paragraph is corrected in place and marked. Quote both.
- **AC46 [R40]** — session-log §14.9 has a row for every transcript from `193` through the highest that exists, and the
  evidence range in the session log, in `docs/backlog.md`'s Task 824 line and in the completion report is one
  identical range whose upper bound is a file that exists. Quote the three range statements and the added rows.
- **AC47 [R41]** — `docs/backlog.md`'s Task 824 entry is one physical line, carries this session's state, the
  file is at most 80 physical lines, and the completion report states the measured count.

**GR-4 AC AUDIT — 5 criteria (AC43–AC47); each states an observable property. Absolutes: AC43's "no site cites
`193` for a number `193` does not contain", AC46's "upper bound is a file that exists" and AC47's "one physical
line / at most 80" are file facts, checkable by reading the files; AC44's arms are measured rects, not a
pixel-perfect claim.**

## 9. Scope

- **Editable:** `src/modules/listings/components/LightboxView.tsx` — **only** the `min-w-0` utility and the two
  comments R37/R38 touch · the session log (a new section, plus the in-place corrections R37/R39/R40 require in
  session-log §14.2, session-log §14.3, session-log §14.6, session-log §14.9) · `docs/backlog.md`'s Task 824 row, one physical line · new transcripts `218`+ and
  any harness edit under `docs/sessions/evidence/task824/`.
- **Not editable:** `src/stories/mantine/primitives/LightboxView.stories.tsx` — its fixture is closed, do not
  re-shape it · `src/design-system/media/appImageConfig.ts` and `AppImage.module.css` (§5.3) ·
  `src/hooks/useSwipeTrackSync.ts` · `src/design-system/mantine/theme.ts` · the three `patterns/Gallery*.tsx`
  files and their Stories · R7's seven protected gate scripts · `scripts/check-locale-leak.mjs` · the eight
  parallel-work paths (§5.4).
- **Out of scope:** `LightboxView.tsx`'s manifest enrolment (Task 825) · the
  `check-surface-census-changed.mjs` filtering gap · the `docs`/`tasks` `rozetka`-scoping call · Tasks 822/823's
  inherited red gates · AC12a's owner visual-QA matrix · real-device confirmation.

The temporary pre-fix revert AC43 needs is a **build-and-measure step, not a commit**: restore the file and
prove it in the same transcript.

## 10. The evidence standard — read before writing anything

Four of this task's five rejections were one defect. These rules make it mechanical rather than a matter of
care.

1. **A transcript file contains the command's output and nothing else.** Header (`platform`, `node`, `cwd`,
   `command`), then the command's verbatim stdout+stderr, then `EXIT_CODE=<n>`. No paraphrase, no truncation,
   no summary, no `AC` reference, no reconciliation prose, no arrow annotations. Analysis belongs in the
   session log, which cites the transcript. `195`, `206`, `208` are the correct shape; `169`, `180`, `182` were
   the failure.
2. **Before writing any number, boolean or range into the session log, grep for it in the transcript you are
   about to cite.** If `Select-String` does not find it, you may not write it. This applies to every measured
   value, every count, every exit code and every "X → Y" claim.
3. **A number that was observed but not retained is not evidence.** Say "observed, not retained" and give no
   figure. Do not put an unretained number in a source-code comment either.
4. **Write the evidence range after the last transcript is written, never before.** Read the directory, take
   the highest file that exists, and use that same range everywhere.
5. **Every transcript that exists gets a row in the evidence table.** Including the ones written after the
   closing hash-object block.
6. **A GR receipt is a claim about reality.** If an edit fell outside scope, the receipt says so and names the
   authorisation. Do not reinterpret a scope clause to make a receipt true.
7. **Two changes are never proven by one measurement.** If you make two edits that could each explain an
   effect, isolate them or do not claim a cause.
8. **If the task forbids an edit you believe is necessary, stop and say so** — `STOP — OWNER DECISION
   REQUIRED`, with what you would change and why. A disclosure after the fact is not the same thing.

## 11. Verification route

If R38 route (B) is taken, or route (A) changes `LightboxView.tsx`, run this from the project root after the
last edit, and retain each transcript per §10.1:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
node.exe -p process.platform
node.exe --version
Get-Location
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:stories
npm.cmd run check:story-coverage
npm.cmd run check:rendered-scope
npm.cmd run check:rendered-scope:verify
npm.cmd run check:surface-census:changed
npm.cmd run check:surface-census:changed:verify
npm.cmd run check:pattern-enrolment
npm.cmd run check:pattern-enrolment:verify
npm.cmd run check:media-enrolment
npm.cmd run check:media-enrolment:verify
npm.cmd run check:design-tokens:strict
npm.cmd run check:tailwind-runtime-tokens
npm.cmd run build
npm.cmd run build-storybook
npm.cmd run check:locale-leak:mantine-only
npm.cmd run check:file-integrity
npm.cmd run check:mojibake
node.exe scripts\check-surface-census.mjs --surface src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx
git --no-optional-locks diff --stat -- scripts/check-rendered-scope.mjs scripts/check-surface-census.mjs scripts/check-surface-census-changed.mjs scripts/map-changed-surfaces.mjs scripts/audit-design-system-patterns.mjs scripts/check-pattern-enrolment.mjs scripts/check-media-enrolment.mjs
git --no-optional-locks status --short
```

Expected: exactly §3's "Gates" paragraph. If **no** tracked file changes (route (A) keeping `min-w-0` as is),
do **not** re-run this block — say so explicitly and add only the new measurement transcripts and the corrected
session log.

Close the pass with one `git hash-object` block captured **after** the session log's final content, then re-run
`check:file-integrity` and `check:mojibake`, then write the range (§10.4). `215`/`216`/`217` are the correct
shape.

## 12. Completion contract

Report, each with its transcript number:

- AC43's pre-fix transcript and restore hashes, **or** the four sites with their numbers removed.
- AC44's three arms, **or** the reverted-and-re-measured pair. Name the route you chose.
- AC45's corrected `GR-2` and the truthful new one.
- AC46's three identical ranges and the added rows.
- AC47's backlog line count.
- The closing `git hash-object` block.
- `GR-1 CENSUS COMPLETE`, `GR-2 SCOPE STATED`, `GR-3 STORY PROVEN`, `GR-5 STATE SYNCED` — each true as written.
- Every deviation, with the rule it departs from and why.

No mutating git. Status on completion: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` or
`PARTIALLY IMPLEMENTED`.

## 13. Carried forward — open, and not this task's

Real-device confirmation on a physical phone · capture-based pointer routing, unproven by automation and
accepted as such · `appImageConfig.ts`'s deliberately-stale comment · the `docs`/`tasks` `rozetka`-scoping
call · AC12a's owner visual-QA matrix · `check-surface-census-changed.mjs`'s tier1-vs-non-rendered-local-import
filtering gap · `LightboxView.tsx`'s enrolment (Task 825).

## 14. Where the history lives

The five superseded revision sections, their requirement ledgers R1–R36 and criteria AC1–AC42, the four owner
decisions in context, and every review verdict are in
`docs/sessions/2026-09-12-task824-gallery-thumbnail-squares-and-nav-controls.md` (§1–§14) and in this file's git
history. Requirement and criterion identifiers are **not** reused: R37–R41 and AC43–AC47 continue the original
numbering so every reference in the session log, the backlog and the evidence directory still resolves.

---

## 15. Sixth return — Opus review 6, 2026-09-16 — R42 to R47

The product work stays closed (§3). This return is again the evidence record, and every finding below was
measured against the real files in the review session, not against session-log §16's narrative of them.

### 15.1 Disposition of §7's R37–R41

| §7 row | Status after review 6 | Why |
|---|---|---|
| R37 / AC43 | **PARTIALLY CLOSED** | `218`/`219` do retain the wrapper rect, `clientWidth`/`scrollWidth` and `strandedBeforeOrigin: true`, and no site cites `193` for a number `193` lacks. Two conjuncts are still open: AC43's restore witness (→ R47) and one pre-fix bullet in session-log §14.3 that no transcript supports (→ R44). |
| R38 / AC44 | **CLOSED** | `219_r20_ab_three_arms.txt` holds all three arms; `STRIPFIX_ONLY`'s wrapper rect is identical to `218`'s `NEITHER`, `MINW0_ONLY` still strands. Both edits proven load-bearing; no surviving sentence attributes the effect to the out-of-flow `<img>`. |
| R39 / AC45 | **CLOSED** | session-log §14.6's `GR-2` names `min-w-0` as outside the superseded kickoff the superseded kickoff §19.5's grant and cites the superseded kickoff §20/R38 as its authorisation; session-log §16's own `GR-2` lists both touched paths against §9. |
| R40 / AC46 | **NOT CLOSED** | The range is stated three different ways across the record and one existing transcript has no row (→ R45). |
| R41 / AC47 | **CLOSED** | `docs/backlog.md` is 79 physical lines and Task 824's entry is one physical line (measured in the review session, `awk 'END{print NR}'` = 79). |

### 15.2 Requirements

| ID | Requirement | Sev | AC |
|---|---|---|---|
| **R42** | **The closing hash block does not describe the shipped session log.** `250_r16_final_hash_supersedes_247.txt` records the session log as `baa31ceb66c35e5cc066f73a8550cee7c50966f5` and as **1974** physical lines, and session-log §16.10's row for `250` repeats that hash. The file on disk is `ba9caaba60152d61dfd39db955eec3ab0ff5b37a` and **1976** physical lines. `247`'s own header ("captured after this session log's own final content, nothing tracked edited afterward") and `250`'s ("supersedes 247 for one path only") are both falsified by that mismatch: the log was written to again after its own final hash. This is the Task 818 corollary verbatim — a final hash that cannot be tied to the shipped content. **Do:** make the closing hash block the genuinely last write. Write every word of the session log first, including its own evidence table and every result cell; then capture one block that hashes **every** path this task changed (`docs/backlog.md`, the session log, `src/modules/listings/components/LightboxView.tsx`) plus `git --no-optional-locks status --short`; then write nothing further. If a later correction is unavoidable, the superseding transcript is the **new highest file**, it re-hashes every path it supersedes, and the range (R45) is restated after it. | **P0** | AC48 |
| **R43** | **A hash is attributed to a transcript that does not contain it, and the real provenance is a rollback.** session-log §16.10's row for `246` reads "`docs/backlog.md` `bb17a40d…` (unchanged from `245`)". `245_r20_final_hash_and_linecount.txt` records `docs/backlog.md` as `4c0a541884db971a5c8d2f8e4d5555543b44c6bc`. `bb17a40d2433bf73508ff7c9b8b672c95ce39985` is `HEAD:docs/backlog.md` (`git --no-optional-locks rev-parse HEAD:docs/backlog.md`, run in the review session), and `246`'s own `git status` block lists no ` M docs/backlog.md` — so at `246` the backlog carried **no** §15 state at all, because §15's backlog edit had been rolled back with the kickoff (§7/R41 says so in its own words). The record states the opposite of what its own cited transcript and the repository show. **Do:** correct session-log §16.10's `246` row to state the measured fact — `bb17a40d…` is `HEAD`'s blob, the pre-edit baseline after the §15 rollback, **not** "unchanged from `245`" — and quote `245`'s `4c0a5418…` beside it so the two are not conflated again. | **P0** | AC49 |
| **R44** | **session-log §14.3's pre-fix bullet is built from post-fix numbers and a scroll target no transcript contains.** session-log §14.3 cites its whole pre-fix bullet list to `219`'s `MINW0_ONLY` arm. That arm is one line: `{"clientWidth":896,"scrollWidth":1076,"scrollLeft":0,"stripLeft":64,"firstLeft":-108,"firstRight":-64,"strandedBeforeOrigin":true}`. The bullet "Scrolled to `scrollLeft = scrollWidth - clientWidth = 180`: last thumbnail `left:908, right:952` against `stripRight:960` — reachable" has no support: `grep -r` over the whole of `docs/sessions/evidence/task824/` returns **zero** occurrences of `180`, and `scrollLeft` occurs only as `0` or `360` anywhere in the directory. `left:908, right:952` occurs only in `193` line 26 and in `220` — both **post-fix** runs at `scrollLeft=360`, `scrollWidth=1256`. The same miscitation runs through session-log §14.3's `BOTH_FINAL` bullets, which cite `219` for `scrollLeft=360`, `908`/`952` and `firstFullyVisible: true`, none of which `219` contains. session-log §16 states it re-checked session-log §14.3 and found it "already correct"; that is disproved. This is R37's defect, sixth occurrence, and §10.2 is the rule it breaks. **Do:** for every bullet in session-log §14.3, grep the transcript you cite for each number before it stays. Re-cite the post-fix bullets to `193`/`220` (which do contain them) or to the arm that does; and for the pre-fix last-thumbnail state, either retain it in a new highest-numbered transcript or delete the bullet and write "observed, not retained" per §10.3. No derived arithmetic (`1076 - 896 = 180`) may be presented as a measured scroll position. | **P0** | AC50 |
| **R45** | **The evidence range is stated three ways, one existing transcript has no row, and the upper bound is not the highest file.** session-log §16 line "session-log §15.7: `218`-`245`" contradicts session-log §15.7's own closing line (`218`–`244`), session-log §14.5 (`218`–`244`) and `245`'s own text ("not folded into that range"); `docs/backlog.md` says "evidence `218`-`245`". session-log §16 then says `250` is "not folded into the range, per that precedent" and in the next sentence gives the combined range as "`193`-`245`". `245_r20_final_hash_and_linecount.txt` exists and has a row in **no** evidence table (session-log §15.7 ends at `244`, session-log §16.10 begins at `246`), so session-log §16's "every file in that span exists on disk … and has a row in exactly one of those three tables" is false. The highest file on disk is `250`; the stated upper bound is `249`. **Do:** one range, computed from the directory after the last file exists (§10.4), stated identically in the session log, in `docs/backlog.md`'s Task 824 line and in the completion report; a row for **every** transcript that exists, `245` included (§10.5); and every sub-range quoted from another section must match that section's own words verbatim. | **P1** | AC51 |
| **R46** | **Three of the four required receipts are missing from the new section, and `GR-5` is not true.** session-log §16 emits `GR-2 SCOPE STATED` only; §12 requires `GR-1 CENSUS COMPLETE`, `GR-2 SCOPE STATED`, `GR-3 STORY PROVEN` and `GR-5 STATE SYNCED`, each true as written. `GR-5` cannot be emitted as true against the current tree: `docs/backlog.md` read `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, the sprint Tasks table read `NEEDS REVISION 2026-09-12 (Opus implementation review 3)` and this kickoff's header read `NEEDS REVISION (Opus review 5)` — three artifacts, three states. The sprint file and this kickoff are outside §9's editable list, so Opus has synced all three to review 6 in the same response that issues this revision. **Do:** emit all four receipts in the new session-log section. `GR-5` names `docs/backlog.md` and the session log as the artifacts **this** session changed and states that the kickoff and the sprint Tasks table are Opus-owned and already synced; it does not claim to have written them. | **P2** | AC52 |
| **R47** | **AC43's restore witness is still missing, and session-log §16 reports AC43 closed.** AC43's route (A) requires `215`'s recorded `git hash-object` for `src/modules/listings/components/LightboxView.tsx` — `b7fbfe07d601217154daf6aaa0bd7dfdb1355e65`, `215` line 66 — to be reproduced after the restore, with both hashes quoted. session-log §15.1 states in its own words that the checkpoint was skipped ("rather than pausing to independently verify an intermediate byte-match against `215`'s hash"); session-log §16 re-verifies only the post-edit `0640ae03…`. The revert–measure–restore therefore has no witness at all, which is the one control the 818/819 corollary makes non-optional for a plant-and-restore probe. **Do — pick one and say which:** **(A)** repeat the revert–measure–restore, capture `git hash-object src/modules/listings/components/LightboxView.tsx` immediately after the restore and before any other edit, and quote it beside `b7fbfe07…` — they must be equal, or the restore is not proven and the file must be restored from the last known-good content and re-hashed; or **(B)** state at session-log §15.1 and session-log §16 that the restore was performed but not witnessed and can no longer be witnessed retroactively, name `220`'s functional re-confirmation as the only evidence that the fix survived, and stop describing AC43 as closed — record it as `PARTIALLY VERIFIED` in the completion report. | **P1** | AC53 |

### 15.3 Acceptance criteria

- **AC48 [R42]** — The highest-numbered transcript in `docs/sessions/evidence/task824/` hashes every changed path and its recorded hash for the session log equals `git hash-object` of the shipped session log. Quote the transcript number, its recorded hash, and the value re-read after the final write; they are equal.
- **AC49 [R43]** — session-log §16.10's `246` row states `bb17a40d…` as `HEAD:docs/backlog.md` / the post-rollback pre-edit baseline and quotes `245`'s `4c0a5418…` separately. No sentence in the record says `bb17a40d…` is "unchanged from `245`".
- **AC50 [R44]** — Every number in session-log §14.3 appears in the transcript that bullet cites, proved by a quoted `Select-String` hit per bullet; and `180` appears in no session-log sentence that presents it as a measured scroll position.
- **AC51 [R45]** — One identical range string in the session log, in `docs/backlog.md`'s Task 824 line and in the completion report, whose upper bound is the highest file in the directory; every transcript that exists has exactly one row across the evidence tables, `245` included; every quoted sub-range matches its source section verbatim.
- **AC52 [R46]** — The new session-log section contains all four receipt lines, and `GR-5 STATE SYNCED` names only the artifacts this session wrote.
- **AC53 [R47]** — Either the post-restore hash equals `b7fbfe07d601217154daf6aaa0bd7dfdb1355e65` with both values quoted, or AC43 is recorded as `PARTIALLY VERIFIED` with the restore explicitly unwitnessed at session-log §15.1, session-log §16 and the completion report.

**GR-4 AC AUDIT — 6 criteria (AC48–AC53); each states a property observable by reading a file or a transcript.
Absolutes: none — AC48, AC50 and AC53 are equality-of-quoted-values checks against artifacts the executor itself
produces, and AC51's "every transcript has exactly one row" is a directory listing compared to a table.**

### 15.4 Scope for this revision — supersedes §9

- **Editable:** the session log — a new session-log §17, plus the in-place corrections R43/R44/R45 require in session-log §14.3,
  session-log §16.10 and session-log §16's range paragraph · `docs/backlog.md`'s Task 824 row, one physical line · new transcripts
  numbered above `250` under `docs/sessions/evidence/task824/` ·
  `src/modules/listings/components/LightboxView.tsx` **only if** R47 route (A) is taken and only for the
  revert–measure–restore cycle, which must end byte-identical to its start.
- **Not editable:** everything §9 lists as not editable, unchanged · this kickoff ·
  `tasks/Sprints/Sprint_75_The_Gates_That_Report_Green_On_What_They_Cannot_See.md` (Opus synced both in
  review 6).
- **Out of scope:** everything §9 lists as out of scope, unchanged.
- **Reviewer classification of the ninth `git status` path:** ` M .gitignore` adds `tech-materials/` to the
  ignore list. `EXCLUDED AS UNRELATED` — owner/parallel work, not Task 824's. §5.4 and session-log §14.7
  say "eight" unlisted paths; there are now nine. Add `.gitignore` to session-log §14.7's classification table with that
  disposition; do not edit the file.

### 15.5 Verification route

`LightboxView.tsx` is hash-identical to `242`/`245`/`246` (`0640ae0337046cbdba989b39c3f0973f995bae8f`,
re-read in the review session), so if R47 route (B) is taken **no tracked source file changes** and §11's
"no tracked file changes" branch applies: do **not** re-run the 20-command block; say so explicitly and add
only the new transcripts and the corrected session log. `docs/backlog.md` changing does not trigger the
block — state that reading of §11 in the session log rather than leaving it implicit, since session-log §16 asserted
the branch without addressing that the backlog is tracked.

If R47 route (A) is taken, `LightboxView.tsx` is written twice (revert, restore) even though it ends
unchanged, so run §11's full block from the project root after the last edit and retain each transcript per
§10.1.

Close the pass with the single block AC48 requires — after the session log's final content, hashing every
changed path — then `check:file-integrity` and `check:mojibake`, then write the range (§10.4, R45). Nothing
is written after that block.

### 15.6 Completion contract delta

§12 stands, plus: name the R47 route chosen · quote the equal-or-not hash pair · quote the one range string
three times from its three homes · quote one `Select-String` hit per corrected session-log §14.3 bullet · report
`docs/backlog.md`'s physical line count · all four GR receipts.
