# Task 764 Revision 1 (amended) — F13/F14/AC25 closure

**Task:** `tasks/Sprints/Sprint_63_Task_764_revision_1_trigger_area_restoration.md` (amended 2026-08-24,
owner decisions D63-H through D63-K)
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
**Base commit:** `1d9fa77cf8b18a75560b661a3281351d45bc46c1` (unchanged)
**QA profile:** Q4
**Scope of this run:** §10.0, then §10.6 and §10.7. Everything covered by §3.10 (AC14–AC21, AC24) is fenced
off and not re-reported here — see the prior session log
`docs/sessions/2026-08-24-task764-revision-1-trigger-area-restoration.md`.

## 1. I0 drift

`git status --porcelain` / `git rev-parse HEAD` matched the expected working set and base commit. Re-read
§3.1's `FavoritesShell:204-218` (now the corrected, non-sibling form) and §3.2's slot render site: no drift.
`rev1b-platform-attestation.txt` — `win32` confirmed.

## 2. F13 — the rewritten P3 arm (D63-H / D63-J), repeated after an owner-caught ordering defect

The first filing's P3 was void (measured `1.1025`, not `1.0000`; `.cardGrid`-scoped assertion passed under
that exact mutation — recorded in the review ledger as F13, and in the prior session log §9). D63-H/D63-J
replace it with a mutation that reconstructs the actual pre-Revision-1 regression on all three evidence paths
simultaneously:

1. `FavoritesShell.tsx` — `SaveToCollectionButton` put back outside `<ListingCard>` under a `relative group`
   wrapper (byte-identical to the pre-Revision-1 markup).
2. `ListingCard.stories.tsx`'s `FavoritesComposition` — same wrapper/sibling, so the Playwright probe drives
   the identical DOM relationship.
3. `ListingCard.smoke.test.tsx`'s containment test — same wrapper/sibling composition rendered directly
   (not via the `imageActions` prop).

**First run of this arm (superseded — retained transcript still on disk, not final evidence):** the RTL test
asserted `.cardGrid` containment before `.imageSection` containment. Under the plant, `.cardGrid` failed
first — the assertion the retained failure stack pointed at, so the transcript did not show a failure at the
`.imageSection` assertion D63-H/AC22 actually require. Owner-caught, 2026-08-24.

**Fix applied:** reordered the FINAL (non-planted) containment test's two assertions — `.imageSection` is now
asserted **before** `.cardGrid`, both retained. This is the discriminating invariant §3.2 establishes;
ordering it first guarantees a P3 regression's failure stack is unambiguous. Verified clean before planting:
`rev1b-reorder-clean-check-transcript.txt` — 14/14, `EXIT_CODE=0`.

**Repeated P3, this time with the reordered test:**

**RTL half:** `rev1b-plant-p3-rtl-transcript.txt` — `EXIT_CODE=1`. Failure stack now points explicitly at
`ListingCard.smoke.test.tsx:311`, `expect(imageSectionEl).toContainElement(saveButton)` — the
`_imageSection_c737cc` `Card.Section` element does not contain the button (a true sibling now, outside both
`.imageSection` and `.cardGrid`).

**Probe half:** `rev1b-plant-p3-build-transcript.txt` (Storybook rebuild, exit 0) →
`rev1b-plant-p3-probe-transcript.txt` → `rev1-favorites-composition.rev1b-plant-p3-v2.json`. Computed
hover-on-action `effectiveScale` = **1.0000** (w/h), matching D63-H's required observation exactly —
reproduced identically to the first run.

**Revert:** all three files reverted (exact-inverse string-replace of the same plant text). No residual
`PLANTED`/`TEMPORARY` markers (`grep`, empty). `rev1b-plant-p3-clean-transcript.txt` — 14/14 tests pass,
`EXIT_CODE=0`.

**F13 answer: both required observations reproduced and retained, with the failure stack now unambiguously
on the `.imageSection` assertion. R22/AC22's P3 arm closed.**

## 3. P4 (unchanged mechanism, re-run fresh for this session)

Same mutation as the prior session (reveal hover-arm guard narrowed to `(hover: hover) and (pointer: fine)`).
Re-run for this session's own evidence trail: `rev1b-plant-p4-build-transcript.txt` (build, exit 0) →
`rev1b-plant-p4-probe-transcript.txt` (`rev1-favorites-composition.rev1b-plant-p4.json`,
`coarseOverride.reveal.actionOpacityOnCardHover: "0"`) → `rev1b-plant-p4-fail-transcript.txt` (comparator,
`EXIT_CODE=1`). Reverted; `rev1b-favorites-probe-clean-transcript.txt` +
`rev1b-plant-p4-clean-transcript.txt` confirm clean (`EXIT_CODE=0` both).

## 4. F14 / AC25 — the AC23 differential and the P5 falsifiability proof (D63-I / D63-K)

**Not re-touched in the P3 repeat round below (owner instruction, 2026-08-24): F14, AC25, the comparator, and
the baseline all stand as originally closed in this section.** Only §2 (F13) and §5/§6 (revert-integrity and
re-validation, re-run because the P3 repeat mutated-then-reverted the same evidence-path files again) reflect
this second pass.

**Baseline retained (D63-K).** `.screenshots/rendered-assert/2026-08-21T15-06/manifest.json` copied
byte-for-byte to `docs/sessions/evidence/task764/rev1b-assert-baseline-2026-08-21T15-06.manifest.json`.
`rev1b-assert-baseline-attestation.txt`: source and destination SHA-256 both
`6F56002A1AA8F8F86F263854DC06BD65737508901ED292788CDC84EFDC8E9229` — identical. Verified population:
`total=1316, passed=1209, failed=80, ambiguousOnly=27` — matches D63-K's attested numbers exactly.

**Comparator.** `docs/sessions/evidence/task764/compare-rev1b-rendered-assert.mjs` — new script, keys every
cell by `storyId × locale × viewport`, reports `added`/`removed` non-pass cells and every `listingcard` cell's
status. *(Note: `check:file-integrity` caught 4 stray NUL bytes this script's first write introduced at its
two space-delimiter join points — fixed by rewriting those exact bytes as ASCII spaces, `node --check`
confirmed syntax valid, and both the differential and P5 runs were repeated against the fixed file with
identical results before it was treated as final evidence.)*

**AC25 — P5 falsifiability proof.** Copied the current manifest
(`.screenshots/rendered-assert/2026-08-24T10-16/manifest.json`) to
`rev1b-assert-p5.manifest.json`, flipped one known-passing cell
(`mantine-primitives-listingcard--default × sq × mobile-320`, `pass`→`fail`). Ran the comparator with that
file as `--current`: `rev1b-plant-p5-transcript.txt` — `added: 1`, `EXIT_CODE=1`, `rev1b-plant-p5.json`
retained. **AC25 met.**

**AC23 — the real differential.** Revert-integrity holds (§5), so the pre-existing
`.screenshots/rendered-assert/2026-08-24T10-16/manifest.json` (SHA-256
`51D622D26C8DBBA574FC96E33F208A5A6E4E1DA713BA001A738BE5145737E0C4`, captured before this run's plants, on the
final Revision 1 tree) is the current manifest. Ran the comparator with the retained baseline:
`rev1b-assert-differential-transcript.txt` / `rev1b-assert-differential.json` —
**`added: 0`, `removed: 0`, 48/48 `listingcard` cells pass, `EXIT_CODE=0`.**

**F14 answer: `npm.cmd run check:stories` exits 0 (`rev1b-check-stories-transcript.txt`, 129 files, 0
violations); the versioned baseline is byte-identical to the source (hashes above); the differential reports
0 added / 0 removed with every `listingcard` cell passing. The raw `screenshots:assert -- --mantine-only`
exit code was not re-run as a pass input this session (D63-I makes it a diagnostic only) — its prior-session
result (1225/1332 PASS, 80 FAIL/27 AMBIGUOUS, all pre-existing/unrelated) stands unchanged since no product
code affecting rendered output changed after that run (revert-integrity, §5).**

## 5. Revert-integrity proof (repeated, after the P3 ordering fix)

`rev1b-plant-revert-proof.txt` (overwritten with this round's result): `git diff --stat` on
`FavoritesShell.tsx`, `ListingCard.stories.tsx`, `MantineListingCardPattern.module.css` shows the identical
per-file insertion/deletion counts (23/50/72 changed lines respectively) as both the prior session's final
Revision 1 diff and the first P3-repeat check — no drift on those three. `ListingCard.smoke.test.tsx` now
shows 58 changed lines (was 54) — **expected and deliberate**: the owner-directed assertion reorder (§2) is a
permanent change to the committed test, confirmed by inspecting the diff content directly (only the two
assertions' order and their explanatory comments changed; no plant residue). `grep` for residual
`PLANTED`/`TEMPORARY` markers across all four files: empty.

Each plant/revert pair was applied and reverted via an exact-inverse Edit (the same old/new text swapped back
verbatim), which is a structural guarantee, not merely an observed absence of diff.

**Consequence:** per §10.7, the expensive gates from §10.5 (`build`, `build-storybook`,
`screenshots:assert`, `screenshots:responsive`, `check:homepage-grid`, `check:design-tokens`,
`check:tailwind-runtime-tokens`, the Favorites/matrix probes, `compare-phase-c.mjs`) stand on their existing
Revision 1 transcripts from the prior sessions — **not re-run in this repeat** — because the revert-integrity
proof holds. Only the re-validation set below, plus the file-integrity/mojibake passes covering this repeat's
new evidence, were re-run fresh.

## 6. Re-validation set (§10.7, repeated)

| Command | Result | Transcript |
|---|---|---|
| `npm.cmd run typecheck` | `EXIT_CODE=0` | `rev1b-typecheck-transcript.txt` |
| `npx.cmd vitest run` (both card suites) | 22/22 PASS, `EXIT_CODE=0` | `rev1b-card-suites-transcript.txt` |
| `npm.cmd run check:stories` | 129 files, 0 violations, `EXIT_CODE=0` | `rev1b-check-stories-transcript.txt` |
| `npm.cmd run check:file-integrity` | 113/113 clean, `EXIT_CODE=0` | `rev1b-file-integrity-transcript.txt` |
| `npm.cmd run check:mojibake` | 0 artifacts / 3233 files, `EXIT_CODE=0` | `rev1b-mojibake-transcript.txt` |

## 7. Requirement status

| ID | Status |
|---|---|
| R22/AC22 (F13) | **Confirmed** — P3 rewritten per D63-H/D63-J, both required observations reproduced with retained transcripts and real non-zero exit codes, clean after revert. The RTL failure stack now points explicitly at the `.imageSection` assertion (owner-directed fix, §2) — the first repeat's transcript pointed at `.cardGrid` instead and was superseded. P4 re-confirmed. |
| R23/AC23 (F14) | **Confirmed** — `check:stories` exits 0; versioned baseline byte-identical (hash-verified); differential reports 0 added/0 removed with 48/48 listingcard cells passing. |
| R25/AC25 | **Confirmed** — P5 makes the comparator report `added: 1` and exit non-zero, retained transcript, clean after revert (no revert needed — P5 only writes new evidence files, touches no source). |
| R24/AC24 | Confirmed — every new transcript this session carries the five-line header and a real exit code, `win32` throughout. |

Per §3.10, AC14–AC21 and AC24 (from the prior implementation) are not re-reported — cited as already verified.

## 8. Files changed (net, after all plant/revert cycles)

Net diff vs the prior session's completion state: **none** on `FavoritesShell.tsx`,
`ListingCard.stories.tsx`, `MantineListingCardPattern.module.css` (proven, §5). `ListingCard.smoke.test.tsx`
has one net, permanent, owner-directed change: the containment test's two assertions reordered
(`.imageSection` before `.cardGrid`, both retained) — see §2.

New files across this session and its repeat:
- `docs/sessions/evidence/task764/compare-rev1b-rendered-assert.mjs` — the AC23/P5 differential comparator
  (untouched in the P3 repeat).
- `docs/sessions/evidence/task764/rev1b-*` — transcripts, manifests, and JSON results (platform attestation,
  baseline copy + attestation, P3 (superseded + repeat)/P4/P5 plant transcripts and artifacts, revert proof,
  differential transcript/result, re-validation transcripts).
- `docs/sessions/2026-08-24-task764-revision-1-f13-f14-closure.md` — this file.

`docs/backlog.md` — updated concisely (see below).

## 9. Deviations and limitations

- **Owner-caught defect, this session's first P3 pass:** the RTL containment test asserted `.cardGrid`
  before `.imageSection`, so the retained failure transcript pointed at the weaker `.cardGrid` assertion, not
  the `.imageSection` assertion D63-H/AC22 require. Fixed by reordering the two assertions in the FINAL
  (non-planted) test, then repeating the whole P3 cycle (RTL + Storybook rebuild + probe + revert) against
  the corrected test. The superseded first-pass P3 transcripts remain on disk under their original names;
  `rev1b-plant-p3-rtl-transcript.txt`, `rev1b-plant-p3-probe-transcript.txt`, and
  `rev1b-plant-p3-clean-transcript.txt` were overwritten with this repeat's results and are the ones that
  count as final evidence.
- The comparator script (`compare-rev1b-rendered-assert.mjs`) was corrupted with 4 stray NUL bytes on its
  first write (cause not established — not reproduced on inspection of the Write tool call itself). Caught by
  `check:file-integrity`, not silently missed. Fixed by replacing the exact NUL bytes with ASCII spaces
  (verified via byte-offset inspection that both corruption sites were at intended space-delimiter
  positions), confirmed with `node --check`, and both dependent runs (AC23 differential, P5) were repeated
  against the fixed file with identical results before being treated as final evidence.
- Per §10.7's explicit instruction, the expensive §10.5 gates were **not** re-run this session — they stand
  on the prior session's transcripts under the proven revert-integrity condition. This dependency is named
  here, not silently assumed.
- The raw `screenshots:assert -- --mantine-only` exit code (1, from the prior session, all-AuthSheet/unrelated
  per the prior session log §14) remains the diagnostic-only number D63-I intends; it was not re-run.

## 10. Opus handoff

Evidence: `docs/sessions/evidence/task764/rev1b-*`, `compare-rev1b-rendered-assert.mjs`. Prior-session
evidence (`rev1-*`) still applies per §3.10/§5. Ledger `docs/reviews/2026-08-24-task764-listing-hover-fold.review-ledger.json`
carries F13/F14 — both now closed by this run's evidence, pending Opus's independent verification. No
owner-run commit/push handoff emitted — Sonnet has no approval authority.
