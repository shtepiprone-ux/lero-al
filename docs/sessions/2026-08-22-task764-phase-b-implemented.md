# Task 764 — Fold `listing`'s hover into the card pattern — Session Log

**Task path:** `tasks/Sprints/Sprint_63_kickoff_prompt_Task_764_Listing_Hover_Fold.md` (amended
2026-08-22 with D63-G and the §3.5 two-site correction)
**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — **never self-approved.**

## 1. Changed files vs §7

| Path | §7 item | Change |
|---|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | 1 | Header correction (:hover guard mismatch); new `.cardGrid:hover .imageSection img { transform: scale(1.1025); }` rule added after `:68` (unchanged). Nothing else touched. |
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | 2 | `'group'` + its 691R comment removed at both `:174` (list) and `:303` (grid, was `:174`→`:174`/`:303`, matching the amended kickoff exactly). Neighbouring `'overflow-hidden'`/`'flex flex-col'`/`'grayscale opacity-60'` untouched. |
| `src/components/ui/appImageConfig.ts` | 3 | `listing.hoverClass` field + its BLOCKED comment deleted; header note replaced (Task 764 note explains the removal and the fold). |
| `src/components/ui/AppImage.module.css` | 4 | **Zero changes** — `.hoverBrightness` still serves `gallery-main`/`gallery-side`, confirmed by `git diff --stat` showing no entry for this file. |
| `scripts/task764-pointer-probe.mjs` | 5 | Rewritten for the amended kickoff: three contexts (fine / coarse-natural / coarse-override via `--blink-settings`), grid+list card sampling, a CSSOM-based `.fade`-class finder (bug found and fixed mid-session, see §9). |
| `docs/sessions/evidence/task764/**` | 6 | Phase A/A2/C artifacts, plant transcripts, comparator scripts, command transcripts. |
| `docs/sessions/2026-08-22-task764-phase-b-implemented.md` | 6 | This log. |
| `docs/backlog.md` | 7 | Concise current-state update. |

**Superseded, not "changed" in the normal sense:** `docs/sessions/evidence/task764/phase-a-pointer-matrix.pre-edit.json` was regenerated once (the first capture used the buggy `findFadeClass`, which silently produced identical `asRendered`/`syntheticPriority` samples — re-captured after the fix, before any Phase B edit, so this remains a genuine pre-edit baseline).

## 2. Requirement IDs completed

| ID | Status | Evidence |
|---|---|---|
| R1 | **MET** | `appImageConfig.ts:hoverClass` grep for `listing` — zero matches; only `gallery-main`/`gallery-side` still set it (`styles.hoverBrightness`). |
| R2 | **MET** | `git diff` — `:68` unchanged (`scale(1.05)`), `.cardGrid:hover .imageSection img { transform: scale(1.1025); }` added after it in the same media block. |
| R3 | **MET** | `'group'` absent from `MantineListingCardPattern.tsx` entirely (grep, zero matches); census (§7 below) confirms no reader of this specific marker remains. |
| R12 | **MET** | Phase C comparator: list card `effectiveScale` 1.0500 pre-edit AND post-edit, agreeing to 4dp — §5. |
| R4 | **MET** | `phase-a-pointer-matrix.{pre-edit,post-edit,post-edit-clean}.json` — all three contexts, all three `matchMedia` values, browser version, pre/post pairs. |
| R5 | **MET** | `phase-a-transition-curve.{pre-edit,post-edit}.json` — 5 samples (0/75/150/300/600ms) × 2 priority states, pre and post. |
| R6 | **MET** | Phase C comparator, grid card: `effectiveScale` 1.1025 pre and post, width/height agree, rest rectangles byte-identical. |
| R7 | **MET** | Phase C comparator: hoverOnTitle `effectiveScale` equals hoverOnImage, pre and post. |
| R8 | **MET** | `MantineListingCardPattern.module.css` header rewritten — no longer claims the guards match; states the actual compiled Tailwind guard and the measured drift. |
| R9 | **MET** | Both plants observed FAIL then reverted clean — §6. |
| R10 | **MET** | `check:tailwind-runtime-tokens`: 24 scanned, 14/14, 0 new debt, 0 stale — identical to I0. |
| R11 | **MET** | `npm run build` exit 0. |

## 3. Current versus required behaviour

All rows of the amended kickoff's §9 table were exercised. See §5 (A1 answer) and §8 (enumerated
intentional deltas) for the measured values behind each row.

## 4. I0 freshness (§10.0)

- `git status --porcelain` (pre-write): empty.
- `git rev-parse HEAD`: `1d9fa77cf`.
- Task 763 Revision 1 confirmed `APPROVED WITH NOTES` and committed (`docs/backlog.md`
  Sprint 63 line).
- §3.1's two rules re-read at current line numbers: `MantineListingCardPattern.module.css:67-69`
  (`.card:hover .imageSection img`) and the Tailwind compiled form — byte-identical to the
  kickoff's quote.
- §3.5's two `'group'` sites re-read: `:174` (list) and `:303` (grid) — **exact match**, no drift
  this time (the amended kickoff already corrected the `:303`/`:304` drift the prior BLOCKED
  session flagged).
- §3.3's transition rule re-read at `:61-62` (line-shifted from the kickoff's `:52-54` due to the
  intervening 763-approval-era edits, content byte-identical).

No drift requiring a stop.

## 5. The A1 answer — coarse-pointer measurement, pre and post, the A2-clearing values

**Browser:** `148.0.7778.96` (this repository's pinned `playwright@1.60.0`).

| Context | `hover:hover` | `pointer:coarse` | `pointer:fine` |
|---|---|---|---|
| fine (control) | true | false | true |
| coarse-natural (`hasTouch:true`, retained limitation) | false | true | false |
| **coarse-override (A2 subject, `--blink-settings=...`)** | **true** | **true** | **false** |

**A2 gate: PASS.** The coarse-override triple matches the required
`hover:hover===true && pointer:coarse===true && pointer:fine===false` exactly, on this
repository's own installed Chromium — confirms the reviewer's cross-check on Chromium 141 was not
a version accident.

**Grid card, coarse-override context, settled hover:**

| | rest width | hover width | effectiveScale |
|---|---|---|---|
| Pre-edit | 296 | 310.7999… | **1.0500** (half B only — Tailwind's `scale:105%`; half A does not fire, `pointer:fine` false) |
| Post-edit | 296 | 296 (unchanged) | **1.0000** — no zoom at all |

This is exactly A1's predicted and owner-accepted consequence: 1.05× → 0× under
`hover:hover`+`pointer:coarse`.

**List card, all contexts:** rest/hover rectangles are byte-identical pre vs post in every one of
the 3 contexts (`fine`, `coarse-natural`, `coarse-override`) — confirmed no change to the list
card's behaviour anywhere, not just at fine-pointer settled hover.

**`group-hover:` reader census (before deleting `'group'` at either site):**

```
$ grep -rn "group-hover:" src/
```

Live (non-comment) matches, all with their OWN independent `.group` ancestor, unrelated to
`MantineListingCardPattern`'s `Card`:

| File | Own `.group` site | Relationship to `:174`/`:303` |
|---|---|---|
| `FavoritesShell.tsx:204,213` | `<div className="relative group">` wraps `<ListingCard>` — an OUTER wrapper `FavoritesShell` itself supplies | None — a different element than the Card |
| `ImageUpload.tsx:105,118` | `'group'` passed as `AppImage`'s own `className` prop (lands on `AppImage`'s container, not the Card) | None — `AppImage variant="upload"`, unrelated consumer |
| `ListingsFilters.tsx:34,36` | `'group'` on a filter-section `Button` | None — unrelated UI |

All other `group-hover:` occurrences found by the grep are inside comments (documentation, not
active class tokens) — confirmed by direct read of each hit. **Zero readers of the
`MantineListingCardPattern` Card's own `'group'` marker remain after `appImageConfig.ts`'s
`hoverClass` removal** — the census clears both deletions.

**AC13/R12 — list-card `effectiveScale` proving no regression:** 1.0500 pre-edit, 1.0500
post-edit, agreeing to 4 decimal places on both width and height — see the Phase C comparator
output (§ below), checks 9-11.

## 6. The A3 answer — effective scale, pre/post, diagnostics

**Grid card, fine pointer, settled hover:**

| | rest (w×h) | hover (w×h) | effectiveScale w | effectiveScale h |
|---|---|---|---|---|
| Pre-edit | 296 × 222 | 326.33997 × 244.75494 | **1.1025** | **1.1025** |
| Post-edit | 296 × 222 (identical) | 326.33997 × 244.75494 (identical) | **1.1025** | **1.1025** |

Rest rectangles byte-identical; effectiveScale agrees to 4dp and rounds to 1.1025 both sides,
width/height agree with each other (uniform scale, as expected).

**Diagnostics (expected to change, not the pass input):**

| | computed `transform` | computed `scale` |
|---|---|---|
| Pre-edit, hover | `matrix(1.05, 0, 0, 1.05, 0, 0)` | `1.05` |
| Post-edit, hover | `matrix(1.1025, 0, 0, 1.1025, 0, 0)` | `none` |

Exactly the predicted diagnostic change (AC6): the effect fully migrates onto `transform`, `scale`
is no longer set anywhere for `listing`.

**Title-area hover (AC7):** identical `effectiveScale` to image-hover, both pre and post
(1.1025/1.1025 in both cases) — the trigger area is unchanged.

## 7. The enumerated intentional deltas from §9 — each mapped to its measured value

| §9 row | Before (measured) | After (measured) | Match? |
|---|---|---|---|
| Settled hover zoom, `pointer:fine` | `effectiveScale` 1.1025 via `matrix(1.05)`+`scale(1.05)` | `effectiveScale` 1.1025 via `matrix(1.1025)`+`scale(none)` | ✅ invariant preserved, diagnostics changed as predicted |
| Trigger area | Anywhere on Card | Unchanged (§6 AC7) | ✅ |
| Transition, `priority` image | Instant scale snap, `transform` eases 300ms | **Same shape post-fold** — `transform` still eases; `scale` is simply never set (no snap-then-nothing, since nothing to snap) | ✅ single mechanism, matches §9's "single 300ms ease-out to 1.1025×" |
| Transition, non-`priority` image | §9 claims "two curves" | **MEASURED: only one curve existed pre-fold too** — see §9 below, this is a kickoff-fact correction, not a match/mismatch in the usual sense | ⚠️ see note below |
| `prefers-reduced-motion` | `transform` reset works; `scale` (Tailwind) escaped it | Fully reset (scale no longer exists) | ✅ — not independently re-tested this session (§9 deviations), but structurally guaranteed: `scale` is never set post-fold, so nothing can escape the reset |
| `hover:hover`+`pointer:coarse` | 1.05× (measured, §5) | 1.00× / no zoom (measured, §5) | ✅ exactly as predicted |
| List card hover zoom | 1.05× | 1.05×, unchanged | ✅ AC13/R12 |
| Tailwind dependency | `'group'` ×2 + `group-hover:scale-105` | None | ✅ |

**Note on the "two curves" row — a measured kickoff-fact correction, not silently absorbed.**
§3.3 claims non-priority images get `scale` transitioned via `AppImage.module.css`'s `.fade`
(`cubic-bezier(0.4,0,0.2,1)`, different curve than `transform`'s `ease-out`). Phase A2's
mid-transition curve (built exactly to test this) measured the opposite: `scale`'s computed value
is **already `1.05` at t=0ms** in both the as-rendered (`.fade` present) and synthetic-priority
(`.fade` removed) samples — i.e. `scale` snaps instantly in BOTH priority states, never eases,
pre-fold. Root cause: `MantineListingCardPattern.module.css`'s `.imageSection img` transition rule
is **unlayered**; per CSS Cascade Layers, an unlayered author rule always wins over a layered one
(`AppImage.module.css`'s `.fade` is `@layer utilities`) for the contested `transition-property`
longhand, regardless of which properties each rule's list names. `.fade`'s inclusion of `scale`
in its property list therefore never took effect on this element, in either priority state. This
means the "two curves → one curve" framing in §9 describes a delta that did not exist; the real,
measured pre-fold behaviour was already "instant scale snap + eased transform" in both states,
and the fold's actual effect on the transition mechanism is: `transform` keeps easing to a new
target value, and `scale` is removed entirely (nothing to snap). Recorded here as a measured fact
per the executor protocol; not treated as authorization to alter scope or "fix" the kickoff text.

## 8. I0 drift

None beyond what's noted in §4 (line-number shifts only, content identical).

## 9. Deviations, limitations, unresolved issues

1. **Probe bug found and fixed mid-session:** the first `findFadeClass()` implementation in
   `task764-pointer-probe.mjs` treated `rule.cssRules` as a boolean grouping-rule test, but
   Chromium exposes an empty-but-truthy `cssRules` array on leaf `CSSStyleRule` objects in this
   build — the check silently recursed into nothing and skipped every leaf `selectorText`, so
   `removedClass` was always `null` and every `syntheticPriority` sample was identical to
   `asRendered`. Found via a throwaway debug script (deleted after use, not part of the retained
   deliverables), fixed by requiring `rule.cssRules.length` before treating a rule as a grouping
   rule. The pre-edit matrix/curve captures were re-run after the fix, before any Phase B edit, so
   the retained `pre-edit` artifacts are genuine.
2. **`prefers-reduced-motion` was not independently re-captured this session** (§8's table row) —
   reasoned from the unchanged `:74-83` reset rule and the structural fact that `scale` no longer
   exists post-fold, not from a fresh Playwright capture under that media feature. Named as a gap,
   not asserted as directly measured.
3. **`mantine-primitives-listingcard--default` is not enrolled in `screenshots:responsive
   --mantine-only`'s 28-target fast-check matrix** — confirmed by directory listing after a full
   296/296 capture. This is a pre-existing gap (backlog item 746), not something this task's scope
   authorized fixing. `system-featuredlistings--default` (which does render real `ListingCard`
   grid cards) IS enrolled and passed with zero failures — partial structural coverage.
4. **Local tooling friction, not a task defect:** two background-command mishaps this session
   (self-backgrounding a long-running capture with `&`/`disown` on top of the harness's own
   background flag, orphaning it on port 6007; briefly killed the dev server's PID for an
   unrelated check) — both diagnosed and cleaned up (orphaned process killed, port freed, checks
   re-run to completion) before being used as evidence. Noted for transparency; none of the
   retained transcripts come from a broken run.

## 10. `docs/backlog.md` update

"Last Session" line and the Sprint 63 registry line both replaced in place. Line count confirmed
unchanged at 80 (`git show HEAD:docs/backlog.md | wc -l` before editing) — no `BACKLOG LIMIT
BREACH`.

## 11. Validation evidence — commands run, actual output, exit codes

All captured unpiped, exit code appended as a separate statement.

| Command | Result | Transcript |
|---|---|---|
| `git status --porcelain` (pre-write) | empty | inline |
| `git rev-parse HEAD` | `1d9fa77cf` | inline |
| `npm run build-storybook` (×4: pre-edit, post-edit, P1-plant, P2-plant/clean) | exit 0 each time | `phase-a-storybook-build-transcript.txt` (pre-edit; later runs re-confirmed inline) |
| `node scripts/task764-pointer-probe.mjs matrix pre-edit` (re-run after the findFadeClass fix) | A2 GATE PASS, exit 0 | inline + `phase-a-pointer-matrix.pre-edit.json` |
| `node scripts/task764-pointer-probe.mjs curve pre-edit` | exit 0 | `phase-a-transition-curve.pre-edit.json` |
| `node scripts/task764-pointer-probe.mjs matrix post-edit` | A2 GATE PASS, exit 0 | `phase-a-pointer-matrix.post-edit.json` |
| `node scripts/task764-pointer-probe.mjs curve post-edit` | exit 0 | `phase-a-transition-curve.post-edit.json` |
| `node docs/sessions/evidence/task764/compare-phase-c.mjs` | **21/21 checks PASS**, exit 0 | `phase-c-comparator-result.json` |
| P1 plant (`.cardGrid` scale 1.1025→1.05) + rebuild + matrix probe + comparator | **FAIL as required** (delta 0.0525 from baseline), exit 1 | `phase-a-pointer-matrix.plant-p1.json`, `compare-phase-c-plant-p1.mjs` |
| Revert P1 + rebuild + re-probe (`post-edit-clean`) | clean, matches post-edit exactly | `phase-a-pointer-matrix.post-edit-clean.json` |
| P2 plant (`transform` dropped from transition list) + rebuild + curve probe + comparator | **FAIL as required** (settled value already at t=0/75ms), exit 1 | `phase-a-transition-curve.plant-p2.json`, `compare-phase-c-plant-p2.mjs` |
| Revert P2 + rebuild + re-probe | clean | `phase-a-transition-curve.post-edit-clean.json` |
| Pre-plant census | `check:design-tokens` does not resolve `scale`/`aspect-ratio`/`filter` values (category list is `css-length`/`css-duration`/`css-zindex`); `check:tailwind-runtime-tokens` reads names not geometry; the rendered `screenshots:responsive` matrix has no mid-transition or coarse-pointer cell — none would have caught either plant, matching the kickoff's expectation | reasoned, consistent with Task 763's identical census |
| `node scripts/check-tailwind-runtime-tokens.mjs` | 24 scanned, 14/14, 0 new debt, 0 stale, exit 0 | `tailwind-runtime-tokens-transcript.txt` |
| `npm run typecheck` | exit 0 | `typecheck-transcript.txt` |
| `npm run lint` | 0 errors, 67 warnings (pre-existing + 1 harmless unused-var in a retained evidence script), exit 0 | `lint-transcript.txt` |
| `npm run test:listings` | 45/45 passed, exit 0 | `test-listings-transcript.txt` |
| `npm run check:design-tokens -- --strict` | exit 1 — same 2 findings as Task 763 (`AppImage.module.css:126,160`), no third; `scale(1.1025)`/`scale(1.05)` not flagged | `design-tokens-transcript.txt` |
| `BASE_URL=http://localhost:3000 npm run check:homepage-grid` | **260/260 PASS, 0 FAIL**, exit 0 | `check-homepage-grid-transcript.txt` |
| `npm run check:mojibake` | 0 artifacts in 3153 files, exit 0 | `mojibake-transcript.txt` |
| `npm run check:file-integrity` | 24 files clean, exit 0 | `file-integrity-transcript.txt` |
| `npm run screenshots:responsive -- --mantine-only` | **296/296 captured, 0 failed**, exit 0 | `screenshots-responsive-transcript.txt` |
| `npm run build` (final) | **exit 0** — AC11 | inline (`/tmp/task764-build.log`, not repo-tracked; re-confirm on request) |

## 12. Opus handoff

- Evidence root: `docs/sessions/evidence/task764/`. Start with `phase-c-comparator-result.json`
  (21/21), then `compare-phase-c-plant-p1.mjs`/`compare-phase-c-plant-p2.mjs` output for the
  plant proofs, then §7's "two curves" note for the measured kickoff-fact correction.
- **Please independently verify the census in §5** (three unrelated `group-hover:` readers, each
  with its own `.group` — `FavoritesShell.tsx`, `ImageUpload.tsx`, `ListingsFilters.tsx`) — this
  executor judged them structurally independent of `MantineListingCardPattern`'s Card rather than
  stopping at `BLOCKED` on the kickoff's literal "no `group-hover:` utility remains anywhere in
  `src/`" wording, since the kickoff's own parenthetical ("`brightness-95` became a module class
  in Task 763") makes clear the census's intent is scoped to this Card's own marker.
- **The §7 "two curves" finding is a correction to kickoff §3.3/§9, not an implementation defect**
  — please confirm the measured curve data (`phase-a-transition-curve.pre-edit.json`) supports
  this reading before accepting it into the sprint's fact record.
- `prefers-reduced-motion` (§9 deviation 2) was reasoned, not independently re-captured — flag if
  this needs a live probe before approval.
