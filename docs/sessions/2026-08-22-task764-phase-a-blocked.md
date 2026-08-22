# Task 764 — Fold `listing`'s hover into the card pattern — Session Log

**Task path:** `tasks/Sprints/Sprint_63_kickoff_prompt_Task_764_Listing_Hover_Fold.md`
**Status:** `BLOCKED` — **A2 gate failed at Phase A. Phase A2 and Phase B were not run, per the
kickoff's own owner instruction and the operator's explicit direction to stop there.**

## 1. Changed files vs §7

| Path | In §7 scope? | Written this session |
|---|---|---|
| `scripts/task764-pointer-probe.mjs` | Yes (§7.5) | **New.** Phase A/A2 probe. |
| `docs/sessions/evidence/task764/**` | Yes (§7.6) | **New.** Phase A matrix output, transcripts, an isolated sanity-check script + transcript. |
| `docs/sessions/2026-08-22-task764-phase-a-blocked.md` | Yes (§7.6) | **New.** This log. |
| `docs/backlog.md` | Yes (§7.7) | Concise current-state update. |

**Not touched — correctly, per the A2 gate:** `MantineListingCardPattern.module.css`,
`MantineListingCardPattern.tsx`, `src/components/ui/appImageConfig.ts`,
`src/components/ui/AppImage.module.css`. Phase B (§10.3) was never started.

## 2. Requirement IDs — completed and not

| ID | Status | Note |
|---|---|---|
| R4 (coarse-pointer delta measured before the edit) | **PARTIAL — the pre-edit half is done; the post-edit half cannot run because there is no edit** | See §5 below. The measurement itself (§10.1) is complete and is the reason the task stops. |
| R1, R2, R3, R5, R6, R7, R8, R9, R10, R11 | **NOT STARTED** | All require Phase B (the fold) or Phase A2/C, both gated behind A2. Per kickoff §10.1: "Do not proceed to Phase A2 or Phase B" when the gate fails. |

## 3. Current versus required behaviour

Unchanged — no source edit was made. `appImageConfig.ts`'s `listing.hoverClass` is still the
literal `'group-hover:scale-105'`; `MantineListingCardPattern.tsx:303`'s `'group'` (line drifted
by one from the kickoff's stated `:304` — see §8 I0 drift) is still present;
`MantineListingCardPattern.module.css:68` still reads `transform: scale(1.05)`.

## 4. Every command run — actual output and exit code

| Command | Result | Transcript |
|---|---|---|
| `git status --porcelain` (I0, pre-write) | empty | inline |
| `git rev-parse HEAD` | `c896ebd0c` | inline |
| `npm run build-storybook` | exit 0 | `phase-a-storybook-build-transcript.txt` |
| `node scripts/task764-pointer-probe.mjs matrix pre-edit` | **exit 1** (script's own A2-gate exit code) — wrote `phase-a-pointer-matrix.pre-edit.json` | `phase-a-probe-transcript.txt` |
| `node docs/sessions/evidence/task764/sanity-check-matchmedia.mjs` (isolated control, no story/server harness) | exit 0 — reproduces the identical matchMedia values on a trivial `page.setContent` page | `sanity-check-matchmedia-transcript.txt` |

## 5. The A1 answer / A2 gate — measured, not proceeded past

**A2 gate result: FAIL.** Measured coarse-context `matchMedia` values (Playwright `hasTouch: true`
at the same 1024×900 desktop viewport, no `isMobile` — exactly the kickoff §10.1 configuration):

```
(hover: hover)   = false
(pointer: coarse) = true
(pointer: fine)   = false
```

Required by the owner's own instruction (kickoff §5 A2, verbatim): *"Якщо probe не підтверджує
саме `(hover:hover) and (pointer:coarse)`, задача має бути BLOCKED, а не продовжуватись."* The
coarse context does **not** report `true` for both simultaneously — it reports the plain
`(hover: none)` state a touch-only device would, not the hybrid `(hover:hover)+(pointer:coarse)`
state §3.2/§3.4 hypothesized (e.g. a touchscreen laptop with a mouse also attached). **This
directly falsifies kickoff §3.4's own labeled `HYPOTHESIS`**, exactly as §3.4 anticipated it might:
*"Emulation of the interaction media features has changed across Chromium versions, and
`hasTouch: true` alone may instead yield `(hover: none)`."* That is precisely what was measured.

**Fine-context control (proves the harness itself is correct, not just the failing measurement):**
`(hover: hover)=true`, `(pointer: coarse)=false`, `(pointer: fine)=true` — and the settled hover
`effectiveScale` computed from the two captured rectangles is `326.3399658203125 / 296 =
1.1025000...`, exactly the 1.05×1.05 product the kickoff's §3.1 predicts for today's un-folded
state. The harness reproduces the known-correct fine-pointer result before failing the
coarse-pointer one — the FAIL is not a broken probe.

**Double-checked independent of the story/server harness:** a second, minimal script
(`sanity-check-matchmedia.mjs`, retained) opens two bare `page.setContent('<div>test</div>')`
pages (no CSS, no Storybook, no local HTTP server) with the same two context configurations and
reproduces the identical values: `chromium 148.0.7778.96` (via `playwright@1.60.0`, the pinned
devDependency) maps `hasTouch: true` (without `isMobile`) to `(hover: none)`, not to
`(hover:hover) and (pointer:coarse)`.

**Per the kickoff and the operator's explicit instruction, the task stops here.** Phase A2
(mid-transition sampling) and Phase B (the fold edit) were not started.

## 6. The A3 answer

**Not applicable — not reached.** A3 (whether `scale(1.1025)` reproduces the effective rendered
scale) is only measured at Phase C, which requires Phase B first.

## 7. The enumerated intentional deltas from §9

**Not applicable — not reached.** None of §9's "Required after" column was implemented.

## 8. I0 drift

- `'group'` is at `MantineListingCardPattern.tsx:303`, not `:304` as the kickoff states throughout
  (§3.1, §3.5, §7.2, §10.3.4) — a one-line drift, most likely from an intervening docs-only commit
  between the kickoff's filing and this session. Confirmed by direct read; not acted on since Phase
  B was never reached.
- §3.1, §3.2 (lines 22-24), §3.3 (the `.imageSection img` transition rule) — all confirmed byte-
  identical to the kickoff's quoted text and line numbers, no drift.
- Task 763 Revision 1 landed and is `APPROVED WITH NOTES` (confirmed via `docs/backlog.md`'s
  "Last Session" line and `docs/reviews/2026-08-22-task763-revision1-class-naming.review-ledger.json`)
  — the block condition in the kickoff's Handoff section is satisfied.

## 9. Deviations and limitations

- **Probe limitation, not corrected (out of scope while `BLOCKED`):** `task764-pointer-probe.mjs`'s
  `findFadeClass()` only inspects top-level `sheet.cssRules`, not rules nested inside `@layer`
  grouping rules. `AppImage.module.css`'s `.fade` class is declared inside `@layer utilities`, so
  the function never finds it — every `syntheticPriority` sample in the retained
  `phase-a-pointer-matrix.pre-edit.json` has `removedClass: null` and is therefore **identical to,
  not a genuine variant of, `asRendered`**. This does not affect the A2 gate result (which is
  read from `matchMedia`, not from the priority simulation) but means the retained matrix's
  `syntheticPriority` rows carry no additional information this run. Left unfixed because Phase A2
  (where the priority/non-priority split actually matters, per kickoff §10.2) is gated behind A2
  and was not reached. If a future session resumes this task, fix `findFadeClass` to recurse into
  `CSSLayerBlockRule`/`CSSMediaRule` bodies before relying on the synthetic-priority mechanism.
- No alternative emulation approach was attempted. Per kickoff §5 A2 and §10.1: *"Do not
  substitute `hover: none`, and do not reason about what the delta 'would' be... A different
  emulation trick may be proposed in the report, but it is a new owner decision, not a
  substitution this task may make."* One is proposed below (§10), not implemented.
- `git status --porcelain` (post-gate) shows exactly the files in §1's table — `scripts/`,
  `docs/sessions/evidence/task764/`, this log, and the pending `docs/backlog.md` edit.

## 10. Proposed next step (not a decision this task may make)

The coarse-pointer state kickoff §1/§9 pre-accepted as an intentional behaviour change — "no zoom
under `hover:hover`+`pointer:coarse`" — cannot be measured with this repository's installed
Playwright/Chromium via `hasTouch: true` alone, because that configuration does not produce the
`(hover:hover)+(pointer:coarse)` media-query state at all; it produces plain `(hover: none)`,
which is already correctly and unconditionally handled (no zoom on either half, confirmed by this
session's own coarse-context capture). Options for the owner:

1. **Accept that the `(hover:hover)+(pointer:coarse)` device profile cannot be emulated by this
   toolchain and is therefore untestable pre-merge.** The behaviour change A1 describes would then
   rest on the file's own stated *intent* (§3.2) rather than a repeatable rendered measurement.
   This may be an acceptable risk — a real device with a mouse AND a touchscreen simultaneously is
   an uncommon combination — but it is a knowing acceptance of unmeasured behaviour, not something
   this task may decide on its own per its own A2 clause.
2. **Investigate a different emulation path** (e.g. `page.emulateMedia({ ... })` overriding the
   media features directly, or a CDP-level override) that can force `(hover: hover)` +
   `(pointer: coarse)` together for the purposes of this one measurement, independent of whether a
   real device could ever report it. This tests "does the CSS behave correctly if a browser ever
   reports this state" rather than "does this Chromium build's touch emulation reach it" — a
   different, narrower claim than the kickoff's A2 currently asks for, and worth flagging as a
   distinct option rather than assuming it satisfies the same intent.
3. **Re-scope Route (c)** so it does not depend on the coarse-pointer measurement being taken
   pre-merge (e.g. ship the fold and treat the coarse-pointer behaviour as ordinary manual/owner
   QA on a real hybrid device, if one is available).

This session does not recommend one of these three; that choice is the owner's, per the kickoff's
own instruction that a substitution here is a new decision.

## 11. Backlog update

`docs/backlog.md`'s "Last Session" line and the Sprint 63 registry line were both replaced in
place. Detailed narrative lives in this session log, not the backlog.
