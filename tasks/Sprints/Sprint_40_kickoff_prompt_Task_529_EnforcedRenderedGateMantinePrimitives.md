# Task 529 — Wire Mantine/Primitives/* into the ENFORCED rendered gate (close the hole that let 527 slip)

> **Sprint 40 (TailAdmin conformance). Executor: Sonnet 4.6.**
> **Why this task exists (root-cause fix).** Task 527 shipped a hard runtime crash (Textarea autosize) and two
> visible mismatches while claiming "all gates green / build-storybook compiles." It slipped because the ENFORCED
> rendered gate — `scripts/check-stories-rendered.mjs` (`npm run screenshots:assert`) — has a **hardcoded story
> allowlist that does NOT include the `Mantine/Primitives/*` stories**. Task 528 could only prove its fixes with a
> **throwaway standalone Playwright script** (written, run, then deleted — never in the repo, never in CI). So the
> proof was real but **not machine-enforced**: the next UI task can still "compile green" and break a Mantine
> primitive render with nothing to catch it. This task makes rendered proof for Mantine primitives a permanent,
> CI-enforced gate. (Confirmed in `docs/sessions/2026-07-02-task528-*.md` lines 108–117.)

---

## Pre-read (rule-index → Storybook / visual snapshot task)

Always required: `docs/agent-contract.md` (clauses 1–16), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this task touches CI gate tooling, not a product flow; confirm no registry flow is affected).
Required (Storybook/visual):
- `docs/mantine-responsive-design-system.md` §8 (Mantine Storybook proof rules) + §13 (Storybook rebuild plan) — the Mantine-native proof path (`skipCanvas: true`, one `Default` per component, toolbar-driven viewport/locale).
- `docs/storybook-governance.md` — §14 enforced gates (this is the doc that must be updated to record the new coverage).
- `docs/storybook-visual-snapshots.md`.
- `docs/component-rules.md`, `docs/qa-rules.md`.

## Scope (do NOT exceed)

**Tooling + governance-doc task only. NO product code, NO primitive/theme changes, NO story-content changes.**
Files expected in scope (confirm — nothing else without asking):
- `scripts/check-stories-rendered.mjs` (the enforced gate — extend its coverage + opened-state capability)
- `package.json` ONLY if a new script alias is genuinely needed (prefer reusing `screenshots:assert`; do not add redundant scripts)
- CI config (e.g. `.github/workflows/*.yml`) — only if the gate is not already wired into CI for these stories
- `docs/storybook-governance.md` (§14 — record the new enforced coverage + the anti-no-op proof requirement)
- `docs/backlog.md` + `docs/sessions/2026-07-02-task529-*.md`

If the current gate architecture makes any of the below ambiguous (e.g. how the allowlist is built, whether an `index.json` story index exists to auto-discover from, how CI invokes the gate) → **STOP and ASK the orchestrator.** Do not invent a parallel gate.

## Current behavior to preserve

- `npm run check:stories` (`scripts/check-stories.mjs`) — the STATIC gate (no-hardcode / no-`layout:centered` / no-`Ukrainian*` / no-raw-`<button>`). **Untouched by this task.**
- `npm run screenshots:assert` (`scripts/check-stories-rendered.mjs`) — the RENDERED gate. Its existing detection logic MUST be preserved verbatim: render-failure = `pageerror` OR console-error OR `sb-show-errordisplay` in the iframe OR blank/empty canvas; URL pattern `iframe.html?id=<storyId>&globals=locale:<loc>`. All stories it currently covers must STILL be covered (no regression in the allowlist).
- `--fast` and `--check` flags must keep working with the same semantics.

## Required after-behavior

1. **Coverage:** the rendered gate covers **every `Mantine/Primitives/*` story** (story IDs `mantine-primitives-<name>--default`). **Preferred implementation: auto-discover** the Mantine primitive stories from Storybook's generated story index (`index.json` / `stories.json`) filtered to the `Mantine/Primitives/` title prefix, so new primitives are covered automatically and the allowlist can never silently drift again. If no machine-readable index is available, fall back to a single explicitly-maintained list with a comment that it MUST be kept in sync — and STOP and ASK the orchestrator before choosing the fallback.
2. **Locale matrix:** each covered story is asserted across all four locales `sq/en/uk/it` (via the `globals=locale:` URL param), at the mandated stress viewports **uk@320/375/390** plus at least one desktop width (≥1024) — matching the `agent-contract` clause 12 stress cells. (Full 14-viewport sweep is acceptable but not required for the gate; the stress cells + one desktop are the minimum enforced set.)
3. **Opened-overlay states:** for the overlay primitives (`Modal`, `Drawer`, `Popover`, `DropdownMenu`, `NavigationMenu`, `Select`, `Tooltip`), the gate must capture the **opened** state (scripted trigger click) — not just the closed trigger — because the 527-class defects (footer gap, radius, crash-on-open) only manifest when the overlay is open. Reuse the exact trigger-click approach Task 528's standalone script used (documented in the 528 session log).
4. **CI-enforced + blocking:** the gate runs in CI (and/or `prebuild-storybook`) so a render failure FAILS the build. A Mantine primitive that throws (like 528's Textarea autosize crash) must turn the pipeline RED.
5. **Governance doc updated:** `docs/storybook-governance.md` §14 records that `Mantine/Primitives/*` are now under the enforced rendered gate, with the auto-discovery mechanism and the anti-no-op proof requirement.

## Positive flow (happy path)

- Run `npm run screenshots:assert` on the CURRENT (post-528, green) tree → gate discovers all `Mantine/Primitives/*` stories, renders each × 4 locales × stress viewports (+ opened state for overlays), finds zero render failures → exits 0. Transcript pasted in the session log showing the Mantine primitive story IDs actually being asserted (Textarea, Badge, Modal, Drawer, Popover, DropdownMenu, NavigationMenu, Select, Tooltip, Button, Card, Checkbox, Radio, Switch, SegmentedControl, Tabs, TextInput, PasswordInput, Avatar, Label — the full primitive set).

## Negative flow (anti-no-op — MANDATORY, this is the whole point)

- **Plant a real render break and prove the gate catches it** — this is the acceptance-critical step (a gate that can't fail is worse than none). Do BOTH:
  - (a) Re-introduce the exact 527 defect: put `minHeight: '2.75rem'` back into `theme.components.Textarea.styles.input` → run `screenshots:assert` → it MUST FAIL on `mantine-primitives-textarea--default` (autosize guard `pageerror`). Capture the FAIL transcript. **Revert cleanly.**
  - (b) Plant a throwing story or a forced `console.error` in one covered primitive → gate FAILS → revert.
  - Paste both FAIL transcripts + the clean-revert confirmation in the session log. If either planted break does NOT fail the gate, the gate is a no-op → TASK FAILURE, fix before claiming complete.
- **Missing index / discovery failure:** if the story index can't be read at runtime, the gate must ERROR loudly (non-zero), never silently pass zero stories. Prove this branch (temporarily point at a bad index path → non-zero exit) or explain why it's structurally impossible.
- **Locale/viewport param failure:** an unreachable iframe URL / navigation timeout counts as a FAILURE for that cell, not a skip.

## Out of scope / do NOT do

- Do NOT change any primitive, `theme.ts`, `input-chrome.css`, or story CONTENT (528 already fixed those — this task only observes them through the gate). The planted breaks in the negative flow are TEMPORARY and MUST be reverted.
- Do NOT touch `check:stories.mjs` (the static gate).
- Do NOT weaken any existing rendered-gate coverage or detection rule.

## Validation before claiming complete (clauses 9, 13, 14)

- `npx tsc --noEmit` = 0 (scripts are `.mjs`; run `node --check scripts/check-stories-rendered.mjs`).
- `npm run screenshots:assert` green on the real tree, WITH the Mantine primitive IDs visible in the transcript.
- Both planted-FAIL transcripts + clean reverts present.
- File-integrity transcript green for every touched file (0 NUL, no BOM, `node --check` clean, not truncated).
- AC-by-AC self-audit table citing the positive + negative flows by name.
- **"Files Changed" table** — one row per touched path + rationale.
- Update `docs/backlog.md` + add `docs/sessions/2026-07-02-task529-*.md`.
- **Do NOT run git. Do NOT emit `git add`/`git commit`.** The orchestrator emits the commit after reviewing the diff + the transcripts.

## Acceptance criteria

1. `check-stories-rendered.mjs` covers every `Mantine/Primitives/*` story (auto-discovered, or explicit list with STOP-and-ASK justification), × sq/en/uk/it, at uk@320/375/390 + ≥1 desktop. (after-behavior 1–2)
2. Overlay primitives asserted in the OPENED state via scripted trigger click. (after-behavior 3)
3. Gate runs blocking in CI/prebuild; a throwing primitive turns it RED. (after-behavior 4)
4. Existing coverage + detection logic + `--fast`/`--check` preserved (no regression). (current-behavior)
5. Anti-no-op proven: the planted Textarea-`minHeight` reintroduction AND a second planted break each FAIL the gate; both reverted clean; transcripts in the log. (negative flow — acceptance-critical)
6. `storybook-governance.md` §14 updated; backlog + session log updated; Files Changed table present; no git run by executor. (clauses 10, 13, 14)
