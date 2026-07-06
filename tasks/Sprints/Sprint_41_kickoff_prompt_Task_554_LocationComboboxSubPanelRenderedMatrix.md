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

## Scope (do EXACTLY this — nothing else)

1. **Add ONE persisted story** that renders `LocationCombobox` **with the add-location sub-panel present AND
   visibly OPEN**, so the `screenshots:assert` harness captures the toggle, the `TextInput`, the region trigger,
   and the Add/Cancel buttons in one frame at every breakpoint × locale.
   - Props that make the sub-panel render: pass `regions` + `onAddLocation` (a no-op stub returning a resolved
     `{ id }` is fine — this is a render proof, not an interaction test; the interaction is already covered by
     `LocationCombobox.smoke.test.tsx`).
   - The panel must be **OPEN in the captured frame**. `LocationCombobox` opens the panel only via internal
     `showAdd` state (clicking "+ add_location"); there is no prop to force it open. Choose the cleanest
     mechanism that fits the harness: (a) a Storybook `play` function that clicks the toggle, IF the
     `screenshots:assert` pipeline captures post-`play` state; or (b) a thin **story-file-only** wrapper that
     renders the sub-panel open. **Do NOT add a force-open prop to the product `LocationCombobox` component** —
     that is product-code scope creep. **If neither (a) nor (b) is achievable cleanly without touching product
     code, STOP and ASK the orchestrator — do not invent a component API.**
   - Location & naming: follow the existing Mantine story convention. Because `LocationCombobox` is a shared
     composite (not a `design-system/mantine/primitives` primitive), place it under the composites story area if
     one exists; otherwise mirror the primitives folder convention and note the placement in the session log.
     `title` e.g. `Mantine/Composites/LocationCombobox` (confirm against the existing title taxonomy; match it).
   - **Zero hardcode:** every visible string + `aria-label` via `storyT`/`t()` against `storybook.mantine.*`
     with full sq/en/uk/it parity. NO raw literals, NO `parameters.layout:'centered'|'padded'`, NO story export
     named `/Ukrainian/`, NO `globals:{locale:'uk'}` pin, NO raw `<button>/<input>`. `Default` export only;
     locale/viewport come from the toolbar (one `LocaleStress` at most, per §8/§14).

2. **Run `npm run screenshots:assert -- --mantine-only`** and capture the sub-panel story cells into the
   manifest. The story must PASS the gate (no h-scroll at 320; full-width text/container controls at <640).

3. **No changes to** `LocationCombobox.tsx`, `MantineCombobox.tsx`, any consumer, `messages/*` (beyond adding
   any NEW `storybook.mantine.*` story-only keys this story needs, in all 4 locales), or the registry.

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
2. `screenshots:assert --mantine-only` PASSES with the sub-panel cells present; manifest path + a per-cell
   matrix (14 breakpoints × sq/en/uk/it, **uk@320/375/390 mandatory**) pasted into the session log with real
   evidence (full-width fields/buttons <640, toggle exemption noted, no h-scroll@320). → step 2–3.
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
