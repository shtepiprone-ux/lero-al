# Task 554 — Persisted rendered matrix for the LocationCombobox add-location sub-panel (Sprint 41 / Epic MM Phase-2)

**Type:** Storybook / rendered-proof (UI). **Executor:** Sonnet 4.6.
**Origin:** Task 553 review gap (orchestrator, 2026-07-05). Task 553 migrated `LocationCombobox` (main
field + admin add-location sub-panel) to Mantine and is HELD. Its main-field proof rides on the already-gated
`MantineCombobox` primitive matrix, but the **new composed sub-panel** (toggle `Anchor` + `TextInput` + region
`MantineCombobox` + Add/Cancel `Button`s) has **no persisted, machine-produced rendered matrix** — its only proof
was a temporary Storybook story that was created, screenshotted, then deleted, plus ephemeral live-dev checks.
The Sprint-33 rendered-evidence gate (`orchestrator-role.md`) + agent-contract clause 12 require a persisted
`screenshots:assert` matrix for a new UI surface. This task supplies exactly that. **No product-code behavior
changes — story + gate only.**

## Pre-read (rule-index → Storybook / visual-snapshot task + UI style source of truth)

- `docs/agent-contract.md` (clauses 1–16; esp. 11, 12, 13, 16) + `docs/backlog.md` + `docs/critical-flow-registry.md`
  (already carries the Task-553 "Admin add-location sub-panel" row — do not duplicate it).
- `docs/mantine-responsive-design-system.md` §8 (Mantine Storybook proof path) + §13 (rebuild plan).
- `docs/storybook-governance.md` §14 (enforced gates: `check:stories`, no-hardcode, `layout:'fullscreen'`+canvas,
  Default-only, no `Ukrainian*`/`globals.locale` pin) + `docs/storybook-visual-snapshots.md`.
- `docs/tailadmin-style-reference.md` §6s (the toggle chrome this task must render) + §6d/§6e/§6l (field/item chrome).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- Reference the EXISTING pattern: `src/stories/mantine/primitives/Combobox.stories.tsx`
  (`title`, `parameters:{ skipCanvas:true, layout:'fullscreen' }`, `storyT` i18n, `MantineStoryShell`,
  single `Default` export, toolbar-driven viewport/locale) and `src/stories/_storyI18n.ts` / `_MantineStoryShell`.

## 🔴 Gate-phase decision (orchestrator ruling, 2026-07-05) — READ BEFORE STARTING

The gate has THREE phases (`scripts/check-stories-rendered.mjs`): **Phase 0** = `Mantine/Primitives/*`
auto-discovery, runs UNCONDITIONALLY incl. `--mantine-only`/`--fast`, full Layer 1+2+3, **opens overlay stories
via a scripted trigger click** (lines 243-246, 682-686); **Phase 1** = `ASSERT_STORIES`, **skipped under
`--mantine-only`** (line 1187); **Phase 2** = geometry-only auto-discovery, **skipped under `--mantine-only`**
and **never opens overlays** (lines 238-239). The recurring gate the owner runs every Mantine slice is
`screenshots:assert -- --mantine-only` (Phase 0 only). Therefore a story that lands in Phase 1 or Phase 2 gets
**zero standing enforcement** — a one-time local artifact only. **This task MUST route the sub-panel proof into
Phase 0**, opened via the existing overlay-openTrigger mechanism, so it is machine-produced, opened, full-chrome
+ geometry, AND permanently enforced under the same `--mantine-only` command. (Orchestrator-authorized scope
expansion: the minimal single-story script touch needed to include this ONE composite in Phase-0 overlay-open
handling — see Scope item 2.)

## Scope (do EXACTLY this — nothing else)

1. **Add ONE persisted `Default` story** that renders `LocationCombobox` **with the add-location sub-panel
   present AND opened by the Phase-0 overlay-trigger click**, so the harness captures the toggle, the
   `TextInput`, the region trigger, and the Add/Cancel buttons in one frame at every breakpoint × locale.
   - Props that make the sub-panel render: pass `regions` + `onAddLocation` (a no-op stub returning a resolved
     `{ id }` is fine — this is a render proof, not an interaction test; the interaction is already covered by
     `LocationCombobox.smoke.test.tsx`).
   - The panel must be **OPEN in the captured frame.** Preferred mechanism: register the story in Phase-0's
     overlay-open set so the harness clicks "+ add_location" before running its checks (matching the
     Menu/Select/Popover open-on-click precedent). **Do NOT add a force-open prop to the product
     `LocationCombobox` component.** If a story-file-only open (e.g. an in-wrapper mount effect) renders the
     panel open more cleanly than the openTrigger click, that is acceptable too — but it MUST still be a
     Phase-0-discovered story so it runs under `--mantine-only`. If neither is achievable without a product-code
     change or without pulling unrelated stories into the enforced gate, **STOP and ASK the orchestrator.**
   - **Title for Phase-0 discovery:** the story title MUST start with `Mantine/Primitives/` so Phase-0's
     title-prefix auto-discovery covers it (e.g. `Mantine/Primitives/LocationComboboxSubPanel`). This is a
     display-grouping title only; note in the session log that it is a composite proven in the primitives gate
     for enforcement reasons (confirm no existing title-taxonomy rule forbids it — if one does, STOP and ASK).
   - **Zero hardcode:** every visible string + `aria-label` via `storyT`/`t()` against `storybook.mantine.*`
     with full sq/en/uk/it parity. NO raw literals, NO `parameters.layout:'centered'|'padded'`, NO story export
     named `/Ukrainian/`, NO `globals:{locale:'uk'}` pin, NO raw `<button>/<input>`. `Default` export only;
     locale/viewport come from the toolbar (one `LocaleStress` at most, per §8/§14).

2. **Minimal, single-story script touch (orchestrator-authorized):** add ONLY what is required to include this
   one story in Phase-0 overlay-open handling (e.g. its component-name in the overlay-open set). Do NOT broaden
   Phase-0 discovery to a new prefix, do NOT add unrelated stories, do NOT alter Phase 1/2 behavior. Paste the
   exact diff of the script touch in the session log with a one-line rationale.

3. **Run `npm run screenshots:assert -- --mantine-only`** — the SAME command the owner runs every slice — and
   confirm the sub-panel story appears in Phase 0 (opened), captured into the manifest, PASSING (no h-scroll at
   320; full-width text/container controls at <640; toggle exemption noted). Paste the Phase-0 line showing the
   story count incremented and its cells green.

4. **No changes to** `LocationCombobox.tsx`, `MantineCombobox.tsx`, any consumer, `messages/*` (beyond adding
   any NEW `storybook.mantine.*` story-only keys this story needs, in all 4 locales), the registry, or Phase 1/2
   of the gate script.

## Mobile <640 full-width gate (OWNER P0, clause 11) — what the screenshots MUST prove

At **320 / 375 / 390** (uk mandatory, plus sq/en/it), the OPEN sub-panel must render:

- **`TextInput` (location name)** — full-width edge-to-edge.
- **Region `MantineCombobox` trigger** — full-width (it already passes `triggerWidth={{ base:'100%', sm:'100%' }}`).
- **Add + Cancel `Button`s** — full-width at `<640`; they stack (`flex-col`) and stretch, becoming row at `sm`.
- **Toggle `Anchor`** — the ONE documented exemption (§6s / clause 11 compact control): compact `fit-content`
  width, ≥44px touch height. Confirm it does NOT clip/overflow and its resting state has NO underline. List it
  explicitly as the exempted compact control in the session-log matrix (do not treat its non-full-width as a
  failure — it is the justified exemption).
- **No horizontal scroll at 320** in any locale; long uk/it labels wrap, never clip.

## TailAdmin conformance (clause 16) — what the screenshots MUST match

Rendered side-by-side vs the reference: toggle = §6s (12px `text-theme-xs`, `font-medium`, `brand.7`,
hover-only underline); `TextInput`/region trigger = §6d/§6e chrome (border, radius `lg`, focus ring, shadow,
Outfit); Add/Cancel = §6/§6b button chrome. No invented color/px/radius/shadow — this task adds ZERO new style
values (it renders existing primitives), so any deviation is a bug in the story setup, not a new token.

## Positive flow (happy path)

Actor: reviewer opening the new story. Precondition: `regions` + `onAddLocation` stub supplied, panel open.
Steps: 1) story renders with the sub-panel open → 2) `screenshots:assert --mantine-only` captures it at all
14 canonical breakpoints × sq/en/uk/it → 3) every cell PASS (no h-scroll@320, full-width fields/buttons <640,
toggle exemption noted) → success state: persisted `manifest.json` + PNGs with the sub-panel visibly open.
Post-condition: `check:stories` + `check:i18n` green; the manifest path is recorded in the session log.

## Negative flow (every off-happy-path branch)

- **Gate would silently pass an empty/closed panel** → the story MUST render the panel OPEN; add an assertion or
  visible marker so a closed panel is detectable. Include a **planted-violation transcript**: temporarily render
  the panel CLOSED (or force `layout:'padded'`) and show the gate FAILs to catch the sub-panel / regresses the
  full-width cells; then revert. A gate that passes whether or not the panel is open is a no-op — not acceptable.
- **Hardcoded string slips in** → `check:stories` must FAIL on a planted raw literal; revert.
- **Locale parity break** → `check:i18n` must FAIL if a new `storybook.mantine.*` key is missing from any of the
  4 locales; revert.
- **`play`-based open not captured by the harness** → if the assert pipeline screenshots BEFORE `play` runs (so
  the panel is closed in the PNG), do NOT ship a false-green story — switch to the story-file-only open wrapper
  (mechanism b), or STOP and ASK. Document which mechanism was used and WHY in the session log.

## Acceptance criteria (each verifiable in the diff / manifest)

1. One persisted `Default` story renders `LocationCombobox` with the sub-panel **open**; product code untouched
   (verify: story-file diff only + `git diff --stat` shows no `LocationCombobox.tsx`/`MantineCombobox.tsx`
   change). → Positive flow step 1.
2. `screenshots:assert -- --mantine-only` PASSES with the sub-panel captured in **Phase 0, opened**; manifest
   path + the Phase-0 per-cell matrix (Phase-0 viewports **320/375/390/1024 × sq/en/uk/it**, uk@320/375/390
   mandatory) pasted into the session log with real evidence (full-width fields/buttons <640, toggle exemption
   noted, no h-scroll@320). The Phase-0 story-count line must show the increment. → step 2–3.
3. Planted-violation transcript proves the gate actually catches a closed/non-full-width sub-panel; reverted. →
   Negative flow branch 1.
4. Zero hardcode: `check:stories` green; any new `storybook.mantine.*` key has sq/en/uk/it parity
   (`check:i18n` green). NO `layout:'centered'|'padded'`, NO `/Ukrainian/` export, NO locale pin, NO raw
   `<button>/<input>`. → Negative flow branches 2–3.
5. Self-validation block: `tsc=0` · `check:stories`/`check:i18n`/`check:file-integrity` green · AC-by-AC table
   citing both flows · `Self-validation:` verdict line. Files-Changed table (one row per touched path + rationale).
   **Do NOT run git** — held for orchestrator diff review + commit emission.

## Out of scope

Any `LocationCombobox.tsx` / `MantineCombobox.tsx` / consumer / registry / product-`messages` behavior change;
a force-open prop on the product component; migrating any other consumer; re-doing the primitive matrix.
