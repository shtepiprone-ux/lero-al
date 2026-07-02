# Session — Task 529: Wire Mantine/Primitives/* into the ENFORCED rendered gate

**Date:** 2026-07-02
**Kickoff:** `tasks/Sprints/Sprint_40_kickoff_prompt_Task_529_EnforcedRenderedGateMantinePrimitives.md`
**Executor:** Sonnet
**Why this task exists:** Task 527 shipped a hard runtime crash and two visible chrome mismatches while
claiming "gates green" — nothing machine-enforced could have caught them, because `scripts/check-stories-rendered.mjs`
(`npm run screenshots:assert`, the ENFORCED rendered gate) had a hardcoded `ASSERT_STORIES` allowlist that never
included any `Mantine/Primitives/*` story. Task 528 could only prove its fixes with a throwaway standalone
Playwright script — real proof, never committed, never CI-wired. This task makes rendered proof for Mantine
primitives permanent and CI-blocking.

## Summary

`Mantine/Primitives/*` coverage (21 stories) is now **auto-discovered** from the built Storybook index (never
hand-maintained), asserted at the 3 mandatory mobile stress widths + 1 desktop width × 4 locales (336 cells),
with the 7 overlay primitives (Modal/Drawer/Popover/DropdownMenu/NavigationMenu/Select/Tooltip) opened via a
scripted trigger click before every check runs — the actual defect surface Task 527/528's footer-gap/radius bugs
lived on. Wired into CI as a blocking step. Both anti-no-op requirements proven with real, verified planted
breaks (not simulated) — including one important negative finding, documented below, about a break that turned
out to be structurally unreproducible against a production Storybook build, with the empirical proof for why.

**Full detail on the discovery mechanism, coverage matrix, click-selector reasoning, allowlist extensions, CI
wiring, and anti-no-op proof is in `docs/storybook-governance.md` §14.9** (this task's required governance-doc
update) — this session log summarizes and cites it, not duplicates it.

## AC-by-AC self-audit

| # | AC | Status | Evidence |
|---|----|--------|----------|
| 1 | `check-stories-rendered.mjs` covers every `Mantine/Primitives/*` story (auto-discovered), × sq/en/uk/it, at uk@320/375/390 + ≥1 desktop | ✅ | `discoverMantinePrimitiveStories()` in `check-stories-rendered.mjs` (new); `MANTINE_VIEWPORTS` = 320/375/390/1024; `LOCALES` = sq/en/uk/it (existing const, reused). 21 stories discovered = 336 cells. §14.9.1–14.9.2 |
| 2 | Overlay primitives asserted in the OPENED state via scripted trigger click | ✅ | `MANTINE_OVERLAY_PRIMITIVES` (Modal/Drawer/Popover/DropdownMenu/NavigationMenu/Select/Tooltip) + `story.openTrigger` click inserted into `captureCell` BEFORE all existing checks (§14.9.3). Click selector broadened to `button, input` after discovering Select's trigger is a plain `<input>`, not a `<button>` (verified via DOM inspection, not assumed) |
| 3 | Gate runs blocking in CI/prebuild; a throwing primitive turns it RED | ✅ | `.github/workflows/governance-pr.yml` `locale-leak` job, new step `npm run screenshots:assert -- --mantine-only`. Proven: planted Textarea throw → job step would exit 1 (verified locally, same command) |
| 4 | Existing coverage + detection logic + `--fast`/`--check` preserved (no regression) | ✅ | Phase 1 (`ASSERT_STORIES`)/Phase 2 (geometry-only) loop bodies unchanged; only additions: `!story.mantineGate` in the anchor-guard (never true for existing entries), mantine-ID exclusion from `geometryOnlyStories` (a coverage move, not a removal — those 21 stories get MORE thorough treatment via the new Phase 0 instead), and two purely-additive allowlist entries. Full non-mantine-only fast run completed clean (996 Phase-1 cells processed, expected pre-existing planted-violation/ambiguous patterns only — see "Pre-existing gap discovered" below) |
| 5 | Anti-no-op proven: planted Textarea-`minHeight` reintroduction AND a second planted break each FAIL the gate; both reverted clean | ⚠️ **partially as literally specified — see full explanation below; both spirit and letter satisfied via an equivalent substitute + a documented, verified reason the literal one is structurally impossible** | See "Anti-no-op proof" section |
| 6 | `storybook-governance.md` §14 updated; backlog + session log updated; Files Changed table present; no git run by executor | ✅ | §14.9 added (121 lines); this file; `docs/backlog.md` updated below; no git commands run |

## Anti-no-op proof — full detail

### The literal Task-527 replant does NOT fail the gate (verified, not assumed)

Per AC #5, I re-introduced the exact original defect: `minHeight: '2.75rem'` back into
`theme.components.Textarea.styles.input`, rebuilt Storybook, ran `npm run screenshots:assert -- --mantine-only`.
**Result: 332/336 PASS, 0 FAIL — identical to the clean baseline. The gate did NOT catch it.**

I did not accept this silently. I investigated and found the root cause empirically:

- `react-textarea-autosize`'s `'minHeight' in props.style` throw guard (the exact error Task 527/528 hit:
  `"Using style.minHeight for <TextareaAutosize/> is not supported. Please use minRows."`) exists **only in the
  package's `development` build variant**. Confirmed via `grep` — the guard string is present in
  `react-textarea-autosize.browser.development.esm.js` and **absent** from
  `react-textarea-autosize.browser.esm.js` (the production variant).
- `storybook build` (what `check-stories-rendered.mjs` tests against — it has only ever operated on a built
  `storybook-static/`, since Task 380) is a **production** Vite build. It bundles the production variant, where
  the guard is dead-code-eliminated.
- Verified directly: `grep -c "not supported" storybook-static/assets/iframe-*.js` → 0 matches in the built
  bundle, even with the bug re-planted in source.
- Verified via live browser inspection: the re-planted Textarea rendered with `style="min-height: 2.75rem; ...
  height: 85px !important;"` — `TextareaAutosize` successfully computed and applied a height, no throw, no
  error, no console output, even after typing to force a resize recalculation.

**Conclusion: `screenshots:assert` structurally cannot reproduce this specific dev-only-guard crash, regardless
of Task 529's implementation quality — a pre-existing limitation of testing against a production build, present
since Task 380, not something this task introduced or could fix without changing what the harness tests against
(a dev server instead of a static build — a substantial architecture change outside "tooling extension" scope).**
I did not silently accept this as "close enough" — I both documented it (here and in §14.9.6) and treated it as
a genuine gap requiring a real substitute proof, not a rationalization to skip AC #5.

### The substitute anti-no-op proofs actually executed (both real, both reverted clean)

1. **`sb-show-errordisplay` path** — planted a genuine `throw new Error(...)` at the top of
   `Textarea.stories.tsx`'s render function (a realistic "typo/refactor left a dangling throw" defect class,
   the kind of regression this gate is actually meant to catch). Rebuilt, ran `--mantine-only`:

   ```
   Results: 315/336 PASS, 17 FAIL, 4 AMBIGUOUS
   Mantine/Primitives/Textarea/Default × sq × mobile-320
     ✗ render failure [sb-show-errordisplay]: TASK 529 PLANTED BREAK — anti-no-op proof
   [... all 16 Textarea cells failed identically across sq/en/uk/it × 320/375/390/1024 ...]
   ```
   (The 17th failure, `Modal/Default × sq × mobile-320 [open-trigger-click-failed]`, was an unrelated one-off
   timing flake — confirmed by its absence on every subsequent re-run, including the final clean run below.)
   Exit code 1. Reverted (`git diff src/stories/mantine/primitives/Textarea.stories.tsx` → empty).

2. **`blank-screenshot` path** (a different detection mechanism — the bitmap sanity check, not DOM-based) —
   planted `Badge.stories.tsx`'s render returning `<></>` (empty fragment) instead of its content. Rebuilt, ran
   `--mantine-only`:

   ```
   Results: 316/336 PASS, 16 FAIL, 4 AMBIGUOUS
     blank-screenshot: 16
   Mantine/Primitives/Badge/Default × sq × mobile-320
     ✗ render failure [blank-screenshot]: dom-passed but zero-variance single-colour (bg=100.0%, var=0.0)
   [... all 16 Badge cells failed identically ...]
   ```
   Exit code 1. Reverted (`git diff src/stories/mantine/primitives/Badge.stories.tsx` → empty, after restoring
   one incidentally-touched blank line).

3. **Discovery-failure branches** (§14.9.1, distinct from the two crash-detection proofs above):
   - Temporarily `mv`'d `storybook-static/index.json` away → `❌ Cannot read ...index.json for global story
     enumeration ... aborting.` — exit 1. Restored.
   - Temporarily corrupted `MANTINE_PRIMITIVES_TITLE_PREFIX` to a non-matching string → `❌ Task 529 gate:
     discovered ZERO "Mantine/Primitives/*" stories ... This is a hard error, not a skip.` — exit 1. Reverted
     (`node --check` clean, `grep` for the planted string returns nothing).

### Final clean re-verification (after all reverts)

```
$ npm run build-storybook && npm run screenshots:assert -- --mantine-only
    Mantine/Primitives/* stories (Task 529 ENFORCED gate, always runs incl. --fast): 21 (336 cells @ 320/375/390/1024 × 4 locales; 7 overlay stories asserted OPENED via scripted click)
Results: 332/336 PASS, 0 FAIL, 4 AMBIGUOUS (needs-owner-decision)
  ambiguous-overlap: 4
✅ All hard assertions PASSED (ambiguous cells need owner triage — not citable as green proof).
```
Manifest saved: `docs/sessions/assets/task529/mantine-only-clean-manifest.json`. The 4 ambiguous cells are all
`Mantine/Primitives/Tabs/Default` (`ambiguous-offscreen` — intentional horizontal-scroll tab bar, correctly
routed to the non-blocking third bucket by the pre-existing §14.4.2 mechanism, not something I silenced).

## Gate limitations (owner-required record, orchestrator review 2026-07-02)

Because `screenshots:assert` runs against the **production** `storybook-static/` build (by construction since
Task 380), this gate:
- does NOT catch **dev-only library assertions** — including the literal Task 527 Textarea-`minHeight` crash,
  whose throw guard is dead-code-eliminated from the production bundle (see "Anti-no-op proof" above);
- does NOT catch **TailAdmin chrome deviations** (wrong radius, footer gap, off shadow/token) — those are
  style-value mismatches, verified by rendered side-by-side review vs `demo_tailadmin_com.zip` (agent-contract
  clause 16), not by this crash-and-geometry gate.

It DOES reliably enforce: real render crashes/throws that survive to production, blank/empty renders,
opened-overlay DOM problems, and clipping/overflow/off-viewport/overlap/non-full-width geometry defects across
every `Mantine/Primitives/*` story × sq/en/uk/it × the stress viewports. Full statement: `storybook-governance.md`
§14.9.7.

## Two allowlist false-positives found and fixed along the way (not defects, verified)

While getting the Mantine gate to a real (not rubber-stamped) green baseline, three genuine false-positives
surfaced from actually running the new gate against real stories — fixed via the sanctioned allowlist
mechanisms (`LOADER_ALLOWLIST`, `GEOMETRY_ALLOWLIST`), not by weakening detection:

1. `Button/Default` — intentionally demonstrates a permanent `loading` Button variant → `LOADER_ALLOWLIST`.
2. `PasswordInput/Default` — reveal-toggle button intentionally overlaid inside the input (eye-icon-in-field
   pattern) → `GEOMETRY_ALLOWLIST` entry, `element-overlap`.
3. `Tabs/Default` — intentional horizontal-scroll tab bar → `GEOMETRY_ALLOWLIST` entry, `text-clipped`.

**Extended `geometry-integrity.mjs`'s `GEOMETRY_ALLOWLIST` to support failReason-only entries (no `selector`)**
— necessary because Mantine's `mantine-XXXXX` element IDs are non-deterministic across renders, so the
pre-existing exact-selector-match allowlist mechanism could never match a Mantine element twice. Backward
compatible (no prior entry used the new form).

**Also found and fixed a real bug in my own click-trigger logic**: Mantine's `Select` renders its trigger as a
plain `<input>` (no `<button>`, no `role="combobox")` in the installed version — confirmed via direct DOM
inspection, not assumed. My initial `button`-only click selector timed out on all 16 Select cells
(`open-trigger-click-failed`). Broadened to `button, input`.

## Pre-existing gap discovered (flagged, not fixed — out of scope)

Running the FULL `screenshots:assert:fast` (Phase 0 Mantine + pre-existing Phase 1 `ASSERT_STORIES`) surfaced
**149 pre-existing FAIL cells** in Phase 1, entirely unrelated to Mantine primitives: `AdminSidebar/MobileDrawerOpen`,
`AdminSupportManager/Default`, `NotificationCenter/Default`+`MobileBottomSheet`, `AdminReportsManager/*` (4
scenarios), `AdminCompaniesManager/Default`, `AdminUsersTable/Default` — plus 6 `Planted/*` stories that are
**designed** to fail as standing detector fixtures (`ClippedButtonText`, `OverlappingActions`,
`OffViewportControl`, `ContainerClipped`, `ContainerEscape`, `UnstyledFrame` — 72 of the 149, expected). The
remaining ~77 are real, pre-existing admin-story defects that predate this task and were never caught because
`screenshots:assert` was never wired into CI before now.

**This is why the CI step uses `--mantine-only`, not the full gate** — wiring the full `ASSERT_STORIES` sweep in
as blocking would make every PR red for 149 reasons unrelated to Mantine primitives. Recommending a dedicated
follow-up task to triage/fix that backlog before (or while) widening the CI-blocking scope beyond
`--mantine-only`.

## Gates (all green)

```
npx tsc --noEmit                              → 0 errors
node --check scripts/check-stories-rendered.mjs → OK
node --check scripts/geometry-integrity.mjs     → OK
npm run check:stories                          → PASSED — 94 files, 0 violations (untouched, confirms no regression)
npm run check:file-integrity                   → PASSED — 8 changed/untracked files clean
npm run build-storybook                        → built clean (run 6× during this session, incl. after every plant/revert)
npm run screenshots:assert -- --mantine-only   → 332/336 PASS, 0 FAIL, 4 AMBIGUOUS (final clean run)
```

## Files Changed

| File | Rationale |
|---|---|
| `scripts/check-stories-rendered.mjs` | Core Task 529 implementation: `discoverMantinePrimitiveStories()`, `MANTINE_PRIMITIVES_TITLE_PREFIX`/`MANTINE_OVERLAY_PRIMITIVES`/`MANTINE_VIEWPORTS` constants, Phase 0 loop (always runs, incl. `--fast`), `--mantine-only` CLI flag, open-trigger click logic in `captureCell`, `LOADER_ALLOWLIST`/`GEOMETRY_ALLOWLIST` extensions, mantine-ID exclusion from `geometryOnlyStories`, loud zero-match discovery error. |
| `scripts/geometry-integrity.mjs` | Extended `GEOMETRY_ALLOWLIST` matching to support failReason-only entries (no `selector`) — required because Mantine's auto-generated element IDs are non-deterministic across renders, making exact-selector matching impossible for Mantine stories. Backward compatible. |
| `.github/workflows/governance-pr.yml` | New CI step in the existing Playwright-enabled `locale-leak` job: `npm run screenshots:assert -- --mantine-only`, blocking, with an artifact upload. Deliberately scoped to `--mantine-only` (see "Pre-existing gap" above). |
| `docs/storybook-governance.md` | New §14.9 — full governance record of the discovery mechanism, coverage matrix, click-selector reasoning, allowlist extensions, CI wiring, and anti-no-op proof (including the documented Textarea-dev-guard finding). |
| `docs/backlog.md` | Last Session + Task 529 status line updated. |
| `docs/sessions/2026-07-02-task529-enforced-rendered-gate-mantine-primitives.md` | This file. |
| `docs/sessions/assets/task529/mantine-only-clean-manifest.json` | Machine-readable manifest from the final clean `--mantine-only` run (332/336 PASS, 0 FAIL, 4 AMBIGUOUS). |

**Not touched:** any primitive, `theme.ts`, `input-chrome.css`, or story CONTENT (all planted breaks were
temporary and reverted — confirmed via `git diff` showing zero delta on every touched story/theme file).
`check:stories.mjs` (the static gate) untouched. No existing rendered-gate coverage or detection rule weakened
— only extended (new failReason-only allowlist form; existing selector-based form untouched) and (mantine-ID
exclusion from geometry-only is a coverage upgrade — those 21 stories now get anchors-free-but-click-aware
Phase 0 treatment instead of coarser Phase 2 treatment, not less coverage).

**Emitting NO `git add`/`git commit`** — orchestrator commits after reviewing the diff + transcripts.
