# Task 620 — Correct the `theme.ts` shade-index comments for the five pre-existing badge colors (index-6→index-7 documentation fix, ZERO pixel change)

## Mode and task type

Implementation task. Type: **documentation/code-comment accuracy** inside a source file (`theme.ts`). No rendered/behavioral change. Resolves the pre-existing, out-of-scope documentation defect that Task 619 discovered and flagged for the orchestrator.

## Objective

Bring the shade-index annotations on the five pre-existing Mantine color tuples (`green`, `yellow`, `red`, `blueLight`, `purple`) in `src/design-system/mantine/theme.ts` into agreement with the value Mantine **actually renders**, so the file stops asserting an authoritative "index 6" Badge value that the runtime never produces. This is an **owner-confirmed comment-only correction** (owner 2026-07-17: "visually I don't see problems in all these badges" — the current render is accepted as de-facto authoritative; only the misleading comments change). No tuple hex, no registration, no primaryShade, and no rendered pixel changes.

## Verified context

All facts below were inspected this session (read-only git + file reads + Mantine shipped source), not assumed.

- **Mechanism (traced to Mantine source, confirmed in Task 619 review):** `theme.ts:147` sets `primaryShade: 7` as a bare **number**. In `node_modules/@mantine/core/.../get-primary-shade.mjs`, `getPrimaryShade()` returns that number for **every** color (not only `theme.primaryColor`). In `.../MantineCssVariables/get-css-color-variables.mjs` (light mode) this makes, for every color `c`:
  - `--mantine-color-c-filled` = `colors[c][7]`
  - `--mantine-color-c-light-color` (Badge `variant='light'` text) = `colors[c][7]`
  - `--mantine-color-c-light` (Badge `variant='light'` bg) = `alpha(colors[c][7], 0.1)`
  - `--mantine-color-c-outline` = `colors[c][7]`
  So Badge light-text, filled-fill, and outline all read **shade index 7**, and the light background is a 10%-alpha of **index 7** — never the literal index-0 hex, and never index 6.
- **The five tuples' current comments (all in `src/design-system/mantine/theme.ts`) claim index 6 / index 0 Badge roles that the mechanism above contradicts:**
  - `green` (`theme.ts:34-45`): comment `// 6 — success-600 (Badge light text: #039855)`; actual Badge light text renders `green[7]` = `#027a48` (success-700). Also `// 0 — success-50 (Badge light bg: #ecfdf3)` — actual light bg is `alpha(#027a48, 0.1)`, a translucent tint, not the solid `#ecfdf3`.
  - `yellow` (`theme.ts:47-58`): comment `// 6 — warning-600 (Badge light text)`; actual = `yellow[7]` = `#b54708` (warning-700).
  - `red` (`theme.ts:60-71`): comment `// 6 — error-600 (Badge light text: #d92d20)`; actual = `red[7]` = `#b42318` (error-700).
  - `blueLight` (`theme.ts:77-88`): index 6 and index 7 both hold `#0086c9`, so the **rendered value is unchanged** by the mechanism (no value discrepancy); its comments describe Alert index-0/index-5 roles, not a Badge index-6 text claim. Included only for a one-line clarifying note that Badge reads index 7 (same value here).
  - `purple` (`theme.ts:97-108`): comment `// 6 — theme-purple (§4 AUTHORITATIVE — Badge light text)`; actual Badge light text renders `purple[7]` = `#6547d6` (an **approximated** stop), NOT the authoritative theme-purple `#7a5af8`. This is the only one of the five where the rendered badge is an *approximation* rather than a real cited stop.
- **The correct reference already exists in the same file:** Task 619's `sale` tuple comment (`theme.ts:110-130,139`) accurately documents the index-7 mechanism. This task makes the other five consistent with that accurate precedent.
- **Consumers of these colors' Badge role:** `Mantine/Primitives/Badge/Default` story (`src/stories/mantine/primitives/Badge.stories.tsx`) — Status row (`green`/`yellow`/`red`/`blueLight`/`purple` light) + Filled row; `MantineListingDetailPattern.tsx` (`new`=green, `premium`=yellow); `ListingCard.tsx`/`ListingCardPattern.stories.tsx` (`status_sold`=blueLight, `status_rented`=purple, etc.). None of these change — this task edits comments only.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner 2026-07-17 + Task 619 flag | The `green`/`yellow`/`red`/`purple` shade comments in `theme.ts` no longer assert index 6 as the authoritative Badge light-text stop; they state that Mantine reads **index 7** (via `primaryShade:7`) and name the true rendered hex for each. | P1 | Source diff inspection | Confirmed |
| R2 | Task 619 mechanism | The "index 0 = Badge light bg" claims on `green`/`yellow`/`red` are corrected to state the light bg is a 10%-alpha of index 7 (translucent tint), not the solid index-0 hex. | P2 | Source diff inspection | Confirmed |
| R3 | Verified context | The `purple` comment explicitly records that the Badge renders the **approximated** `purple[7]` `#6547d6`, and that the authoritative theme-purple `#7a5af8` sits at the (unrendered) index 6 — so the doc no longer implies the badge shows `#7a5af8`. | P1 | Source diff inspection | Confirmed |
| R4 | Verified context | The `blueLight` block gets a one-line clarifying note that Badge reads index 7 (value identical to index 6 here, so no discrepancy). | P3 | Source diff inspection | Confirmed |
| R5 | agent-contract §1 scope | **Zero** change to any tuple hex value, the `colors` registration, `primaryShade`, any component style, any story, any locale, or any other file. Comments only. | P0 | `git diff` shows only comment-line changes in one file | Confirmed |
| R6 | qa-profiles Q0 + §14 | Touched source file stays UTF-8 no-BOM, mojibake-free, `tsc`-clean; rendered output provably unchanged (baseline byte-identical). | P1 | Named commands below | Confirmed |

## Assumptions and open questions

- **Owner decision captured (2026-07-17):** current index-7 render is accepted as authoritative; this is a comment-only fix, NOT a pixel correction. No open question blocks execution.
- Deferred (explicitly NOT in this task): if the owner ever wants the badges to render their cited TailAdmin-authoritative 600 stop (or purple to render the true `#7a5af8`), that is a separate **Q3** pixel task (re-derive the five tuples so the authoritative hex lands at index 7, plus a shade-6/7 direct-consumer inventory). Task 620 does not do this.

## Pre-read rule bundle

- `CLAUDE.md`, `docs/agent-contract.md` (§1 scope, §14 file integrity).
- `docs/qa-profiles.md` (Q0 definition).
- `src/design-system/mantine/theme.ts` (the five tuples + the accurate Task 619 `sale` comment as the style model).
- The two Mantine source files named in Verified context (`get-primary-shade.mjs`, `get-css-color-variables.mjs`) — to confirm the index-7 wording before writing it.
- Do NOT read the full docs set. Do NOT read the TailAdmin reference (no pixel change is being justified).

## Scope

- `src/design-system/mantine/theme.ts` — edit ONLY the inline shade comments on the `green`, `yellow`, `red`, `blueLight`, and `purple` tuples per R1–R4. Match the accurate wording style of the existing `sale` comment.
- `docs/backlog.md` (concise current-state line) + a session log under `docs/sessions/`.

## Out of scope

- No change to any hex in any tuple (including `sale`, `brand`, `gray`), to `colors`, to `primaryShade`, or to any `theme.components` block.
- No change to any story, locale file, pattern, or consumer component.
- No pixel/rendered change of any kind. No re-derivation of ramps. No TailAdmin re-conformance.
- No touching the `sale` comment (already accurate) beyond leaving it as the reference model.

## Current and required behavior

**Current:** `theme.ts` comments assert that `green`/`yellow`/`red`/`purple` Badge light text is the authoritative index-6 stop (e.g. `#039855`, `#d92d20`, theme-purple `#7a5af8`), and that light bg is the solid index-0 hex. Mantine actually renders index 7 (e.g. `#027a48`, `#b42318`, `#6547d6`) with a 10%-alpha-of-index-7 background. The file therefore documents values the product never shows — the defect Task 619 flagged.

**Required:** the same five tuples keep their exact hex values and rendered output, but their comments truthfully state that Badge (and filled/outline) read **index 7** under this theme's `primaryShade:7`, name the actual rendered hex, and correct the light-bg description. The file becomes internally consistent with the accurate `sale` comment. Rendered badges are byte-for-byte identical before and after.

## Implementation requirements

1. For `green`, `yellow`, `red`: rewrite the `// 6 …(Badge light text…)` annotation to state that Badge light text / filled / outline render **index 7** (name the index-7 hex: `#027a48` / `#b54708` / `#b42318`) because `primaryShade:7` is a bare number (cite the Task 619 mechanism briefly, or reference the `sale` comment). Correct the `// 0 …(Badge light bg…)` annotation to note the light bg is `alpha(index7, 0.1)`, a translucent tint (index 0 is the tuple's lightest stop, not the literal rendered bg).
2. For `purple`: rewrite the `// 6 — theme-purple (§4 AUTHORITATIVE — Badge light text)` line so it states the authoritative theme-purple `#7a5af8` sits at index 6 but is **not** what Badge renders; Badge renders the approximated `purple[7]` `#6547d6`. Keep `#7a5af8` at index 6 unchanged (value untouched).
3. For `blueLight`: add a one-line note that Badge reads index 7 (`#0086c9`, identical to index 6 here — no value discrepancy).
4. Keep every hex digit, the `colors` object, `primaryShade`, and all component blocks byte-identical. Only comment text changes.
5. Update `docs/backlog.md` with a concise current-state line and write the session log. Do not run or emit mutating git.

## Positive and negative flows

Positive: `theme.ts` reads truthfully — each of the five tuples documents index 7 as the Badge-rendered stop (or, for `purple`, documents the approximation), matching the `sale` precedent; `tsc` clean; rendered badges unchanged.

| Branch | Applicable? | Reason | Expected | Evidence |
|---|---:|---|---|---|
| Rendered/visual change | No | comment-only edit in a `.ts` file | Baseline byte-identical | `screenshots:assert --mantine-only` unchanged |
| tsc/parse breakage from comment edit | Yes | source file touched | 0 errors | `tsc --noEmit` |
| Encoding/mojibake in edited comments | Yes | non-ASCII hex context, UTF-8 file | 0 artifacts | `check:mojibake` / `check:file-integrity` |
| i18n / RLS / validation / concurrent | No | no strings, no data path, no runtime code | N/A | — |

## Acceptance criteria

- **AC1 [R1]** Given `theme.ts` after the change, when the `green`/`yellow`/`red`/`purple` comments are read, then none asserts index 6 as the rendered authoritative Badge light-text value; each states index 7 and the true rendered hex.
- **AC2 [R2]** Given the `green`/`yellow`/`red` light-bg comments, when read, then each states the light bg is `alpha(index7, 0.1)` (translucent), not the solid index-0 hex.
- **AC3 [R3]** Given the `purple` comment, when read, then it records `#6547d6` (index 7, approximation) as the rendered Badge stop and `#7a5af8` as the unrendered index-6 authoritative value.
- **AC4 [R5]** Given `git diff src/design-system/mantine/theme.ts`, when inspected, then every changed line is a comment line; no hex, no `colors`, no `primaryShade`, no component code changed; no other file (except backlog + session log) is touched.
- **AC5 [R6]** `tsc --noEmit` = 0 errors; `check:mojibake` / `check:file-integrity` clean; `screenshots:assert --mantine-only` remains **0 FAIL** and byte-identical to the current baseline (925/952 PASS, 27 AMBIGUOUS).

## QA profile and verification plan

**Profile: Q0 Docs/Governance** (comment-only edit inside a source file). Rationale: no rendered UI behavior, no runtime logic, no strings change; the only risk is parse/encoding and an accidental non-comment edit. `docs/qa-profiles.md` Q0 requires read-after-write + structure/accuracy validation + no product validation unless a referenced command changes; the light typecheck/encoding/baseline checks below are cheap insurance that the edit stayed comment-only.

Commands / evidence:
- `npx tsc --noEmit -p tsconfig.json` → 0 errors.
- `npm run check:mojibake` and `npm run check:file-integrity` → clean.
- `git diff src/design-system/mantine/theme.ts` → attach; reviewer confirms every hunk is comment-only (AC4).
- `npm run build-storybook` then `npm run screenshots:assert -- --mantine-only` → **0 FAIL**, byte-identical baseline (proves zero rendered change). If the built-Storybook run is unavailable in the executor environment, record it as an owner-native handoff with the exact command and the expected 0-FAIL/byte-identical result — do not substitute a confidence claim.

## Completion report contract

Sonnet must report: the exact comment hunks changed (line-level `git diff` of `theme.ts`), completed requirement IDs, every command run with actual output, confirmation that no hex/`colors`/`primaryShade`/component line changed (AC4 self-audit), and the `screenshots:assert` result (or owner-native handoff for it). Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` (never self-approved). Update `docs/backlog.md` (concise) + write the session log.

## Task quality gate

- Executable by a fresh Sonnet session without chat context: yes (exact file, tuples, line ranges, per-color target wording, commands named).
- Every primary requirement has a binary AC + verification method: yes.
- Scope names what must not change (all hex, `colors`, `primaryShade`, components, stories, locales, other files): yes.
- Current/legacy boundary: current Mantine theme file; no rendered change so no visual matrix — Q0 justified with a concrete no-pixel-change reason, not a promotion.
- Visual token traced precisely: the exact index-6-vs-7 mechanism and each color's real rendered hex are named, not hand-waved.
- Owner decision captured (comment-only, no pixel change); the deferred Q3 pixel option is explicitly out of scope.
- Negative flows selected by applicability, not a generic checklist: yes.
- No uninspected command/file/behavior claimed: all citations verified this session (theme.ts reads + Mantine source + Task 619 review evidence).

---

**Task path:** `tasks/Sprints/Sprint_44_kickoff_prompt_Task_620_BadgeShadeCommentAccuracy.md`
**QA profile:** Q0 Docs/Governance
**Ambiguous/conflicting requirements:** none (owner confirmed comment-only, no pixel change).
**Owner decisions:** captured — accept current index-7 render as authoritative; fix comments only. Deferred pixel-accuracy path is a separate future Q3 task, explicitly out of scope here.
