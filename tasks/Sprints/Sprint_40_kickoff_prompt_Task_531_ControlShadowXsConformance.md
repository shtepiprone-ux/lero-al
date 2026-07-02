# Task 531 — TailAdmin conformance: control-family resting shadow (`shadow-theme-xs`)

> **Sprint 40 (TailAdmin conformance — ALL primitives). Executor: Sonnet 4.6.**
> **Why this task exists.** The Task 525 rendered audit marked **TextInput NEEDS CORRECTION (minor)**: its
> resting box-shadow renders **Mantine's own stock `xs` formula, not TailAdmin's `shadow-theme-xs`**. The same
> root cause as Task 530's `shadow-theme-lg` gap, one scale key down: `theme.ts` overrides `theme.shadows.lg`
> (Task 530) but **NOT `theme.shadows.xs`**, so every control that renders `var(--mantine-shadow-xs)` — the
> input family (TextInput/Textarea/Select/PasswordInput resting), the Button secondary/outline variant, the
> SegmentedControl track, and the two `Paper shadow="xs"` pattern consumers — shows Mantine's stock xs, not the
> cited TailAdmin value. This is the **last open delta in the Task 525 audit queue**; closing it finishes the
> Sprint 40 conformance corrections. Governed by **agent-contract clause 16** (TailAdmin style mandatory) +
> `docs/orchestrator-role.md` → "TailAdmin conformance gate". Single-source, Note-14 global fix (same finding,
> same fix, every sibling — no diverging call sites).

---

## Pre-read (rule-index → UI / layout / component task)

Always required: `docs/agent-contract.md` (clauses 1–16), `docs/backlog.md`, `docs/critical-flow-registry.md`
(scan — this touches control/overlay resting shadow, **not** a listed critical flow; confirm no registry flow is
affected).

Required (UI):
- 🔴 **`docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — MANDATORY STYLE SOURCE OF TRUTH.** §5
  (shadows). **The §5 `shadow-theme-xs` row is currently an APPROXIMATION (`≈ 0 1px 2px 0 rgba(0,0,0,0.05)`,
  pure black). The authoritative zip value (`css/style.css` line 3743–3744) is `0px 1px 2px 0px rgba(16, 24, 40,
  0.05)` — a gray-900-tinted, not pure-black, alpha.** You MUST first correct §5 to carry this exact literal
  (drop the `≈`, cite the zip line) BEFORE using it. Zero invented/approximated shadow.
- `docs/mantine-responsive-design-system.md` — §7 mobile gate, §12 canonical patterns, **§18 theming pitfalls
  (esp. §18.1: `theme.components.*.styles` is applied INLINE — the reason the shadow lives as a `theme.shadows`
  scale token / a class rule, not a stateful inline style).**
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- Precedent to mirror EXACTLY: **Task 530** (`docs/sessions/2026-07-02-task530-*.md`) — same mechanism one key up
  (`theme.shadows.lg` override). Follow its grep-every-consumer + single-source + planted-regression pattern.

## Scope (do NOT exceed)

**Theme-level TailAdmin conformance for the control-family resting shadow + the §5 `shadow-theme-xs` value
correction.** Files expected in scope (confirm — nothing else without asking):
- `docs/tailadmin-style-reference.md` (§5 — replace the `shadow-theme-xs` approximation with the exact zip
  literal; authoritative, cited to `css/style.css` line 3743–3744).
- `src/design-system/mantine/theme.ts` (add `xs` to the existing `shadows: { … }` override block — the ONLY
  code change if the global-override path is confirmed safe below).
- `docs/backlog.md` + `docs/sessions/2026-07-02-task531-*.md`.

Do NOT touch: input border/focus/error chrome (`input-chrome.css` state rules), radius, padding, any control
geometry, any overlay/`shadow-theme-lg` work (Task 530), or component behavior/API. This is a single shadow-token
value correction.

## Current behavior to preserve

- All controls that consume `var(--mantine-shadow-xs)` render a subtle resting shadow TODAY — the value is just
  Mantine's stock xs, not TailAdmin's. The shadow must remain present (do not drop it), only its VALUE changes.
- **🔴 Mobile <640 full-width gate (owner P0, clause 11)** for every affected control/overlay is unchanged — this
  is a resting-shadow value swap, no layout/width/height/wrap impact. No text/container surface may become
  non-full-width at <640.
- Input state chrome (resting/focus/error/disabled border + ring + placeholder + disabled fade) from Tasks
  505/507/508/527/528 stays byte-identical — this task changes NO `input-chrome.css` rule.
- Button secondary/outline chrome (Task 527) and SegmentedControl track (Task 490/527) keep their current
  structure; only the resolved `--mantine-shadow-xs` value under them changes.

## The confirmed delta (root cause — verified in the diff, not assumed)

`theme.ts` overrides only `theme.shadows.lg` (Task 530). `theme.shadows.xs` is **NOT** overridden, so
`var(--mantine-shadow-xs)` resolves to Mantine's built-in xs. Consumers confirmed by grep
(`grep -rn "mantine-shadow-xs\|shadow=[\"']xs[\"']" src`):
1. `input-chrome.css` lines 7 / 38 / 57 — TextInput+Textarea / PasswordInput / Select resting `box-shadow`.
2. `theme.ts` line ~192 — Button `variant="outline"|"default"` `boxShadow: 'var(--mantine-shadow-xs)'`.
3. `theme.ts` line ~291 — SegmentedControl `--sc-shadow` auto-resolves to `var(--mantine-shadow-xs)`.
4. `patterns/MantineFormSectionStack.tsx:62` and `patterns/MantineNotificationPattern.tsx:92` — `Paper shadow="xs"`.
All four groups SHOULD carry the TailAdmin `shadow-theme-xs` per the Sprint 40 token baseline
("`shadow-theme-xs` — inputs/controls"), so a single-source `theme.shadows.xs` override is the correct fix — but
confirm each below before choosing it.

## Required after-behavior

1. **Extract/correct first.** Replace the §5 `shadow-theme-xs` approximation with the exact zip literal
   `0px 1px 2px 0px rgba(16, 24, 40, 0.05)`, drop the `≈`, cite `demo_tailadmin_com.zip` `css/style.css` line
   3743–3744. Every value below traces to that row.
2. **Correct shadow, single-source.** Add `xs` to the existing `theme.ts` `shadows: { … }` block so
   `var(--mantine-shadow-xs)` resolves to the cited TailAdmin value for ALL consumers. **BEFORE choosing the
   global override:** `grep -rn "mantine-shadow-xs\|shadow=[\"']xs[\"']\|shadow:\s*[\"']xs[\"']" src` and, for
   each of the 4 consumer groups above, confirm it SHOULD render TailAdmin `shadow-theme-xs` (inputs/Button
   secondary/SegmentedControl = yes per §5/§6; the two `Paper shadow="xs"` = confirm they are control-like cards
   that should match, not flat-border cards that should drop shadow). **If any consumer would visually regress or
   should NOT get the TailAdmin xs, do NOT globally override — instead apply the value only where correct (input
   family via `input-chrome.css`, Button/SegmentedControl via their `theme.ts` blocks) and STOP and ASK the
   orchestrator to confirm the scoped approach.** Either way: no diverging siblings.
3. **No other chrome touched.** Border, focus ring, error, disabled, radius, padding, geometry all stay exactly
   as they are. This task is the resting-shadow VALUE only.
4. **Expectation-setting on the rendered proof (Task 530 lesson).** The visual delta between Mantine stock xs and
   TailAdmin `shadow-theme-xs` is expected to be SUBTLE (both are `0 1px 2px 0` with only the tint/alpha
   differing). The **authoritative conformance proof is the exact value-trace to the zip**, corroborated by a
   planted-regression that shows the override applies and is scoped. **Do NOT claim a "visibly heavier/lighter"
   difference the pixels do not support** — describe the measured reality (this is the exact correction the Task
   530 review required of its session log).

## Positive flow (happy path) — per consumer group

- A TextInput/Textarea/Select/PasswordInput at rest renders the TailAdmin `shadow-theme-xs`
  (`0px 1px 2px 0px rgba(16,24,40,0.05)`); focus/error/disabled states are unchanged. A Button `variant="outline"`
  and a SegmentedControl render the same TailAdmin xs beneath their existing chrome. Post-condition: no console
  error, no layout shift, shadow present (not dropped).

## Negative flow (every off-happy-path branch)

- **Focus / error / disabled states:** each still renders its existing border/ring/fade (this task must NOT alter
  them) — the resting-shadow swap does not leak into `:focus`/`[data-error]`/`:disabled` where the existing rules
  set `box-shadow` explicitly (focus ring / `none`). Verify the focus ring and error state look identical to HEAD.
- **`Paper shadow="xs"` consumers:** if kept in the global override, confirm both the FormSection and Notification
  patterns still render acceptably (no over-heavy/҂missing shadow). If they should stay on Mantine's xs → scope
  the fix and STOP and ASK.
- **<640 mobile:** no change to width/layout/wrap; controls stay full-width bottom-sheet/edge-to-edge where
  applicable; no h-scroll@320.
- **Locale mismatch:** no strings touched → sq/en/uk/it parity trivially preserved (confirm `check:i18n` green).

## Mobile <640 full-width gate (OWNER P0, clause 11) — MANDATORY

No layout/width/height/wrap change. Every affected control stays full-width at `<640` exactly as today; overlays
stay full-width bottom sheets. Confirm no surface becomes non-full-width and no h-scroll@320 in the rendered
matrix (uk@320/375/390 mandatory).

## TailAdmin conformance gate (OWNER P0, clause 16) — MANDATORY

- Every value cited to `tailadmin-style-reference.md §5` (corrected to the exact literal first). ZERO invented or
  approximated shadow/color/px.
- **Rendered proof** at 320/375/480 × en/uk + sq/it@320 (**uk@320/375/390 mandatory**) **plus one ≥640 cell** for
  a resting input, a Button `outline`, and a SegmentedControl — the shadow is a resting-panel concern visible at
  all widths. Because the delta is subtle, the closing proof is the **exact §5 value-trace + a planted-regression
  pixel check** (comment out the `theme.shadows.xs` override → capture → confirm the ONLY differing pixels fall in
  the control's shadow region, proving the override applies and is scoped), NOT an "it looks obviously different"
  claim. `tsc=0`/gates are BASELINE, never style proof.

## Rendered gate (Task 529) + its limitation

Run `npm run build-storybook && npm run screenshots:assert -- --mantine-only` — baseline crash/geometry proof
(expected `332/336 PASS, 0 FAIL, 4 pre-existing Tabs AMBIGUOUS`). **Per `storybook-governance.md §14.9.7 this is a
crash-and-geometry gate — it does NOT catch shadow style deltas.** The TailAdmin shadow match is proven ONLY by
the §5 value-trace + planted-regression above. Both are required.

## Validation before claiming complete (clauses 9, 12, 13, 14, 16)

- `npx tsc --noEmit` = 0.
- `npm run check:stories`, `npm run check:i18n` (sq/en/uk/it parity), `npm run check:design-tokens:strict`
  (**0 unsuppressed raw shadow/hex/px** — the shadow lives as a token, not a raw literal at a consumer),
  `npm run check:mojibake`, `npm run check:file-integrity` — all green; paste the transcript.
- `npm run screenshots:assert -- --mantine-only` green (baseline).
- **Rendered matrix + planted-regression pixel check attached** — the closing style proof, described honestly.
- AC-by-AC self-audit table citing the Positive + Negative flows by name; Files Changed table (one row/path +
  rationale); update `docs/backlog.md` + add `docs/sessions/2026-07-02-task531-*.md`.
- **Do NOT run git. Do NOT emit `git add`/`git commit`** — the orchestrator commits after diff + rendered review.

## Acceptance criteria

1. §5 `shadow-theme-xs` row corrected to the exact zip literal `0px 1px 2px 0px rgba(16, 24, 40, 0.05)` (no `≈`),
   cited to `css/style.css` line 3743–3744. (after-behavior 1)
2. `theme.shadows.xs` overridden to that value (single-source token override) OR scoped-with-STOP-and-ASK
   justification; grep evidence in the log enumerates all 4 consumer groups and confirms each is correct. No
   consumer regressed. (after-behavior 2)
3. No border/focus/error/disabled/radius/padding/geometry change — resting-shadow value only; focus + error +
   disabled render byte-identical to HEAD (rendered evidence). (after-behavior 3)
4. Mobile <640 full-width for all affected controls/overlays UNCHANGED (clause 11); no h-scroll@320; uk/it intact.
5. Rendered proof (matrix incl. ≥640 cell) + planted-regression pixel check, described honestly per the Task 530
   lesson (no overstated visual claim); `--mantine-only` gate green as baseline. (TailAdmin gate + clause 12/13)
6. Positive + every Negative branch verifiable in the diff/render; gates green; Files Changed table; backlog +
   session log updated; no git run by executor. (clauses 6a, 9, 10, 14)
