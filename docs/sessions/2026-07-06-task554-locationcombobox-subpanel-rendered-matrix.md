# Task 554 — Persisted rendered matrix for the LocationCombobox add-location sub-panel (Sprint 41 / Epic MM Phase-2)

**Executor: direct execution, no separate orchestrator layer in this session.**

## Summary

Task 553 migrated `LocationCombobox` (main field + admin add-location sub-panel) to Mantine and left
the sub-panel with no persisted, machine-produced rendered proof (only an ephemeral, deleted temp
story + live-dev checks). This task adds ONE persisted `Default` story that renders the REAL
`LocationCombobox` with the sub-panel forced open, registers it so it runs under the standing
`screenshots:assert -- --mantine-only` gate (the exact command run every Mantine slice), and proves
— via three real planted-violation attempts, not one — that the gate genuinely catches a regression
in this new surface. **No product-code behavior change** — story file only.

## Gate-phase discovery gap (surfaced mid-task, flagged before proceeding)

My first attempt placed the story under `Mantine/Composites/LocationCombobox` (following the
generic Storybook convention) and relied on a temporary, deleted proof. When re-verifying under
`--mantine-only`, I found — and confirmed empirically (0 matrix entries for the story, identical
480/462/18 baseline before and after adding it) — that `--mantine-only`'s discovery
(`discoverMantinePrimitiveStories`) is keyed strictly to the `Mantine/Primitives/` title prefix;
a `Mantine/Composites/*` story gets **zero standing enforcement** under the command the owner
actually runs every slice. I flagged this to the owner before proceeding further. The owner ruled:
route the proof into Phase 0 (retitle under `Mantine/Primitives/`, use the existing overlay-open
mechanism if possible, authorizing a minimal single-story script touch if needed) — this ruling was
then also written into the kickoff file itself as a "Gate-phase decision."

## Mechanism choice: story-file-only open, NOT the harness's generic openTrigger click

Before wiring the story into Phase 0's overlay-open Set (`MANTINE_OVERLAY_PRIMITIVES`, which makes
the harness click `#storybook-root button, input` `.first()`), I checked what that click would
actually hit. A Playwright DOM dump of the real component's render order showed:

```
0: INPUT  placeholder="All cities"   (LocationCombobox's OWN main-field trigger)
1: BUTTON "+ Add location"           (the toggle we want opened)
2: INPUT  placeholder="Name (alb.)"
3: INPUT  (region trigger)
4: BUTTON "Add"
5: BUTTON "Cancel"
```

`LocationCombobox`'s main-field trigger is **always** the first `<button>`/`<input>` in DOM order —
a structural fact of the composite's own JSX (main field renders before `{canAdd && <Anchor/>}`),
unrelated to this story and not something a story-file wrapper can reorder without touching
`LocationCombobox.tsx` (out of scope). Registering this story in the generic overlay-open Set would
therefore make the harness click the MAIN FIELD, not the toggle — opening the wrong thing and
shipping a false-green "sub-panel proof" that never actually exercised the toggle.

The kickoff's gate-phase decision explicitly permits the fallback for exactly this situation: **"If
a story-file-only open... renders the panel open more cleanly than the openTrigger click, that is
acceptable too — but it MUST still be a Phase-0-discovered story."** I used this: a `useLayoutEffect`
in the story wrapper finds the real toggle button and clicks it. `useLayoutEffect` runs synchronously
after the DOM is mutated but BEFORE the browser paints the frame, so the closed-panel state is never
actually painted — no race with the harness's readiness poll (`waitForStoryReady`, which polls every
200ms for a non-empty `#storybook-root`; my effect completes on the same tick as the initial commit,
well before any 200ms poll interval). **No `check-stories-rendered.mjs` edit was needed** — Phase-0
discovery is title-only; `openTrigger` resolves to `false` for this story (its component name is not
in the overlay-open Set), which is correct: the harness's generic click is simply skipped, and Layer
1+2+3 checks run against whatever DOM state already exists — the sub-panel, already open.

## Title placement

`Mantine/Primitives/LocationComboboxSubPanel` — `LocationCombobox` is a composite, not a primitive;
this title is a **display-grouping choice made for gate-enforcement reasons**, explicitly authorized
by the kickoff's gate-phase decision, not a taxonomy claim. Noted here and inline in the story file's
own doc comment so it isn't a silent decision.

## Stale build cache (harness gotcha, documented for future tasks)

`scripts/check-stories-rendered.mjs` only runs `npm run build-storybook` if `storybook-static/`
**does not already exist** — it does NOT rebuild on a pre-existing directory. My first `--mantine-only`
run after adding the new story still reported 30 stories / 480 cells (unchanged) because a
`storybook-static/` build from the PREVIOUS day (before this story existed) was still on disk. Fix:
`rm -rf storybook-static && npm run build-storybook` before every gate run in this session. Once
rebuilt, the story count correctly became 31 / 496 cells.

## Files Changed

| File | Change | Why |
|---|---|---|
| `src/stories/mantine/primitives/LocationComboboxSubPanel.stories.tsx` (new) | One `Default` story rendering the real `LocationCombobox` (regions + `onAddLocation` stub) with the sub-panel forced open via a `useLayoutEffect` click on the real toggle button; title `Mantine/Primitives/LocationComboboxSubPanel` for Phase-0 discovery | Task scope — the persisted rendered proof |
| `messages/{en,sq,uk,it}.json` | Added `storybook.mantine.location_combobox_region_north`/`_south` (2 new story-only keys, 4-locale parity) | Demo region option labels — zero hardcode |
| `docs/critical-flow-registry.md` | No change (already carries the Task-553 "Admin add-location sub-panel" row per the kickoff's instruction not to duplicate it) | N/A |
| `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` | Auto-updated by the harness itself (280→281 stories, 480→496 cells, 462→478 PASS) — not a hand edit | Harness-generated bookkeeping, regenerated on every full run |

No change to `LocationCombobox.tsx`, `MantineCombobox.tsx` (beyond what Task 553 already has pending
— confirmed via `git diff --stat`, this task added zero lines to either), any consumer, the registry,
or `scripts/check-stories-rendered.mjs` (confirmed empty diff on the script — the story-file-only
mechanism made the previously-authorized script touch unnecessary).

## Planted-violation transcripts (three attempts — two honest no-ops, one real catch)

Per the kickoff's own warning: **"A gate that passes whether or not the panel is open is a no-op —
not acceptable."** I verified this concern was real before accepting any planted-violation as valid.

**Attempt 1 — render the panel closed** (disable the `useLayoutEffect` click entirely):
```
Baseline:            478/496 PASS, 0 FAIL, 18 AMBIGUOUS
Panel-closed variant: 478/496 PASS, 0 FAIL, 18 AMBIGUOUS   ← IDENTICAL, no-op
```
Root cause: with the panel closed, only the main field (already full-width on its own) renders —
there is nothing non-full-width left for the generic geometry checks to catch. **Rejected as a
valid planted-violation** — exactly the no-op failure mode the kickoff warned against.

**Attempt 2 — shrink the wrapper's `maxWidth` from 420px to 200px** (still open, but the whole
composite narrowed):
```
maxWidth=200 variant: 478/496 PASS, 0 FAIL, 18 AMBIGUOUS   ← IDENTICAL, ALSO a no-op
```
Root cause (found by reading the actual assertion, `scripts/check-stories-rendered.mjs:884-917`):
`fullWidthControlsAtMobile` compares each control's `offsetWidth` against its **own immediate
parent's** content width, not the viewport. Narrowing an ancestor container narrows every
descendant proportionally — nothing becomes disproportionately narrow relative to its own parent,
so the check still reports `true`. **Rejected** — also a no-op, for a different reason than attempt 1.

**Attempt 3 — force ONE control narrower than its own immediate parent** (the real, valid
violation): after the toggle click commits, a second effect sets
`document.querySelectorAll('input')[1].style.width = '150px'` (the sub-panel's `TextInput`, found
positionally — locale-independent, not text-selector-based):
```
Violation build: 466/496 PASS, 12 FAIL, 18 AMBIGUOUS
```
Per-cell detail (`LocationComboboxSubPanel` only):
```
sq/en/uk/it × mobile-320/375/390  → verdict: fail, fullWidthControlsAtMobile: false   (12 cells)
sq/en/uk/it × desktop-1024        → verdict: pass, fullWidthControlsAtMobile: null    (4 cells, check doesn't apply ≥640)
```
Exactly 12 = 3 mobile viewports × 4 locales — matching the assertion's own `<640`-only scope.
**This is the valid, load-bearing planted-violation proof.** Reverted (removed both the second
effect and the width-hack); rebuilt; reran — confirmed back to `478/496 PASS, 0 FAIL, 18 AMBIGUOUS`,
byte-identical to the pre-violation baseline (`git diff --stat` on the story file confirms it matches
the version that produced that baseline, before and after).

## Gates

- `tsc --noEmit` — clean, 0 errors.
- `npm run check:stories` — PASSED, 105 files checked, 0 violations; `storybook.mantine.*` parity 543 keys × 4 locales (541 before this task, +2 new).
- `npm run check:i18n` — PASSED, 2110 keys × 4 locales, parity intact.
- `npm run check:design-tokens -- --strict` — PASSED, 0 raw-value violations across 397 files.
- `npm run check:mojibake` — PASSED, 0 artifacts in 1590 files.
- `npm run check:file-integrity` — PASSED, 16 changed files clean.
- `npm run screenshots:assert -- --mantine-only` (fresh `storybook-static` rebuild each time):
  - **Baseline (story added, open, unmodified): 478/496 PASS, 0 FAIL, 18 AMBIGUOUS** — manifest
    `.screenshots/rendered-assert/2026-07-06T06-03/manifest.json`. Story count 30→31, cells 480→496
    (+16 = 4 viewports × 4 locales), all 16 new cells PASS, all 18 pre-existing ambiguous unchanged
    (zero new ambiguous/fail from this addition).
  - Rendered evidence (uk@320, mandatory): main field trigger full-width, "+ Додати населений
    пункт" toggle compact/underlined-on-hover, "Новий населений пункт" panel with `TextInput`
    ("Назва (алб.)"), region trigger, "Додати"/"Скасувати" buttons all full-width, stacked, no
    h-scroll.
  - **Final re-confirmation after reverting all planted violations: 478/496 PASS, 0 FAIL, 18
    AMBIGUOUS** — manifest `.screenshots/rendered-assert/2026-07-06T07-03/manifest.json`,
    byte-identical to the baseline.

## Mobile `<640` full-width gate (clause 11) — verified from the manifest, not assumed

- `TextInput` (location name) + region `MantineCombobox` trigger: `fullWidthControlsAtMobile: true`
  at 320/375/390 × all 4 locales (12/12 cells).
- Add/Cancel buttons: full-width, stacked (`flex-col`) at `<640` — confirmed visually in the uk@320
  screenshot above; `noHorizontalOverflow: true` on all 16 cells.
- Toggle `Anchor`: the ONE documented exemption (§6s) — compact `fit-content`, `mih="2.75rem"`
  (≥44px touch height) — confirmed NOT full-width (by design) and NOT flagged as a failure by the
  gate (the generic full-width check only inspects `input[type=text|email|password|search]` and
  `[data-slot="select-trigger"]`/`[data-slot="tabs-list"]` elements — an `Anchor`/`<button>` toggle
  is outside its scope entirely, so its compact width is correctly invisible to this assertion, not
  a false pass).
- No horizontal scroll at 320 in any locale (`noHorizontalOverflow: true` on all 16 cells,
  confirmed for uk mandatory + sq/en/it).

## TailAdmin conformance (clause 16)

Zero new style values added by this task (it renders `LocationCombobox`'s EXISTING primitives
unchanged). Rendered evidence (uk@320 screenshot above) shows: toggle = §6s (12px, font-medium,
brand-colored, underline on hover only — visually confirmed no resting underline); `TextInput`/
region trigger = §6d/§6e chrome (bordered, rounded, Open Sans); Add/Cancel = established Button
chrome (filled brand primary + `variant="default"` secondary). No deviation found.

## AC-by-AC self-audit

1. **One persisted `Default` story renders `LocationCombobox` with the sub-panel open; product code
   untouched.** `src/stories/mantine/primitives/LocationComboboxSubPanel.stories.tsx` (new file);
   `git diff --stat -- src/components/shared/LocationCombobox.tsx
   src/design-system/mantine/patterns/MantineCombobox.tsx` shows ONLY the pre-existing Task 553 diff,
   zero additional lines from this task. **Positive flow** step 1 satisfied.
2. **`screenshots:assert -- --mantine-only` PASSES with the sub-panel captured in Phase 0, opened;
   manifest + per-cell matrix pasted.** See Gates section — 478/496 PASS, story count 30→31, all 16
   new cells green, uk@320/375/390 confirmed via rendered screenshot + manifest assertion fields.
3. **Planted-violation transcript proves the gate actually catches a closed/non-full-width
   sub-panel; reverted.** See the three-attempt transcript above — documented honestly including
   the two no-ops (as the kickoff explicitly required me to verify, not assume), with the third
   attempt's 12 real FAILs as the valid proof, then reverted to the confirmed-identical baseline.
4. **Zero hardcode: `check:stories`/`check:i18n` green; no banned layout/locale-pin/raw controls.**
   See Gates section. The story uses `layout:'fullscreen'` (not centered/padded), `Default` export
   only, no locale pin, `storyT`/`t()` for every visible string, no raw `<button>`/`<input>` (the
   REAL `LocationCombobox`'s own Mantine primitives render those, not story-authored markup).
5. **Self-validation block.** See below.

## Self-validation

Self-validation: found and reported a real gap between the kickoff's assumption and the actual
harness (`--mantine-only` only discovers `Mantine/Primitives/*`-titled stories) before writing any
proof around a false premise — confirmed empirically (0 matrix entries, identical baseline) rather
than from code-reading alone. Chose the story-file-only open mechanism over the harness's generic
overlay-open click after verifying (via an actual DOM dump, not assumption) that the generic click
would hit the wrong element for this specific composite — documented why in the story file itself
so a future reader isn't left to rediscover this. Did not accept the first "planted-violation passes
therefore ship it" result at face value: ran it, saw it was a no-op, read the actual assertion
implementation to understand why, and only accepted a violation once it produced a real, exactly
line-item-matching 12-cell FAIL (3 mobile viewports × 4 locales, matching the assertion's own
`<640`-only scope) — then reverted and re-confirmed byte-identical to the pre-violation baseline.
Zero product-code files touched (`LocationCombobox.tsx`, `MantineCombobox.tsx`,
`check-stories-rendered.mjs` all show empty diff from this task specifically). All six light gates
green; `screenshots:assert --mantine-only` green at 478/496 (0 FAIL, 18 pre-existing ambiguous,
zero new). Git was not run — HELD for the orchestrator's diff review and commit emission.
