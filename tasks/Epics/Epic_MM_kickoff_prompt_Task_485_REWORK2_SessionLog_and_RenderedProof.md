# Task 485 — REWORK #2 — Close the rework: rendered proof + session-log reconciliation + stale comment

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus.
> **Status:** The card edge-anchoring code (REWORK #1) is CORRECT and verified at source against
> `Epic_MM_kickoff_prompt_Task_485_REWORK_CardEdgeAnchoring.md`. Do **NOT** change `renderDesignedCard`
> layout/logic. This rework closes the three governance gaps that block approval. UI-only; no behavior change;
> no git (orchestrator emits commits at review).

## Why this exists
The orchestrator diff-reviewed the rework and confirmed the code matches the edge-anchoring skeleton exactly,
but approval is blocked on: (1) missing machine-produced rendered proof, (2) the session log not documenting
the rework, (3) a stale in-file JSDoc comment.

## Scope (exactly these three items — nothing else)

### 1. Rendered proof matrix (clause 12 + Rendered-evidence gate — owner P0) — HARD BLOCKER
- Produce the Mantine-native rendered proof (per `docs/mantine-responsive-design-system.md` §8 proof path /
  the Task 482 `screenshots:assert` Playwright harness) for the admin card surface.
- Required cells: **320 / 375 / 480 × en / uk**, plus **sq / it @ 320** (uk@320/375/390 are mandatory stress cells).
- Each cell must show: meta labels flush at the LEFT inner edge, values flush at the RIGHT inner edge
  (no mid-card value start, no empty right gutter), badge top-right, no clip/overflow, no horizontal scroll at 320.
- Attach the PNG/JSON artifact paths into the session log. A "owner to run / not checked" cell is an auto-reject —
  the artifacts must actually exist and be referenced.

### 1a. 🔴 Story page-gutter fidelity (owner-reported 2026-06-25) — HARD BLOCKER
**Problem:** Mantine admin stories set `parameters.skipCanvas: true`, which bypasses the `withCanvas`
decorator (`.container-wide py-6`) in `.storybook/preview.tsx` and renders the component with ZERO horizontal
AND vertical padding from the viewport edge at EVERY breakpoint. The promised "Mantine-native container as the
responsive proof layer" was never added, so the rendered proof is full-bleed and does NOT represent production
(real `/admin/users/page.tsx` wraps the table in a `p-6` gutter). Capturing the matrix in a zero-gutter context
is not valid proof (the `layout:'centered'`-trap class, mirrored).
- The Mantine admin stories MUST render inside a shared decorator / Mantine container that reproduces the
  **canonical RESPONSIVE page gutter** (mirror `container-wide` / the admin shell padding via Mantine
  `Container`/`Box` with breakpoint-scaled px). Full-bleed (edge-to-edge, zero gutter) is reserved ONLY for
  bottom-sheet popups — NOT for page content cards/tables.
- After the fix, the proof matrix cells must show the representative gutter at each breakpoint (labels still
  edge-anchored to the CARD's inner padded edges, the card itself inset from the viewport by the page gutter).
- Document the decision in `docs/mantine-responsive-design-system.md` §8 (Mantine Storybook proof rules): what
  the Mantine proof gutter is, and that `skipCanvas:true` requires a Mantine container replacement (never bare
  full-bleed). If the exact gutter token is ambiguous, STOP and ASK the owner — do not guess.
- **Out of scope here (separate follow-up):** migrating `/admin/users/page.tsx`'s still-shadcn `p-6 max-w-10xl`
  wrapper to a responsive Mantine admin shell. Note it; do not do it in this rework.

### 1b. 🔴 Pixel-perfect corrections against the token matrix (§6.1 / §7.2) — HARD BLOCKER
The card currently diverges from the documented TailAdmin token matrix. Fix each, then prove in the matrix:

| # | Element | Current | Required (matrix/reference) |
|---|---|---|---|
| 1 | Card padding | `padding="md"` (16px) | **`padding="lg"` (20px)** — OWNER-DECIDED 2026-06-25 (TailAdmin cards = 20px; canonical Card default §6.1). Also fix §7.2 doc diagram (`Card padding="md" (16px)` → `lg / 20px`). Non-negotiable. |
| 2 | Avatar (mobile card) | `size="md"` (38px) | `size={40}` (40px) — parity with desktop cell + TailAdmin CRM |
| 3 | Card action icons (verify/revoke, chevron) | `ActionIcon size="sm"` (~26px) | **≥44px touch target** (P0 gate) — bump size or wrap to `mih="2.75rem"`; this is a P0 violation, not cosmetic |
| 4 | Meta values (phone/date/etc.) | `Text size="xs" c="dimmed"` (12px/gray.5) | `size="sm" c="gray.7"` (14px/gray-700) per the rework skeleton; pattern should enforce the default so consumers can't drift |
| 5 | Badge sizing | role `size="xs"` vs status `size="sm"` | one consistent badge size within the card |
| 6 | Date Stack gap | mobile `gap={0}` vs desktop `gap="xs"` | one consistent vertical rhythm |

Rule: every spacing/size/color value in the card MUST equal a §6.1/§7.x matrix token — no off-matrix px.
Where the matrix itself is ambiguous (e.g. card padding 16 vs 20), STOP and ASK the owner; do not guess.
The rendered matrix (item 1) must visibly confirm 40px avatar, ≥44px action hit-area, 14px gray-700 values.

### 1c. 🔴 Tabs + filters must match TailAdmin (owner-reported "stretched tabs / unstyled buttons") — HARD BLOCKER
Ground truth = `demo_tailadmin_com.zip` (repo root) + `docs/tailadmin-style-reference.md` §6c (just added).
Copy these EXACT values, do not invent:

**Tabs (`AdminUsersTable` "All users / Verified agents"):**
- Current `<Tabs.List grow>` stretches full-width at ALL breakpoints → that is the "stretched tabs" defect.
- Required: `<Tabs value={...} onChange={...} color="brand"><Tabs.List grow={isMobile}>` — compact, left-aligned
  on ≥640; full-width ONLY `<640` (`isMobile` already exists via `useMediaQuery('(max-width: 40em)')`).

**Role/status filters (currently two `SegmentedControl size="xs"`):**
- `size="xs"` → `size="sm"` (matches §6c segment: 14px text, white active pill + `shadow-theme-xs`, gray track).
- Desktop: content-width (NOT stretched). Mobile `<640`: `fullWidth` if it fits at 320, else keep the
  `ScrollArea scrollbars="x"` swipe wrapper (document which, per locale — uk labels are longest).
- Confirm radius `lg` (8) and the active-pill contrast read like §6c. Render-prove at 320/375/480 × en/uk.

**Open design fork (STOP and ASK the owner before doing):** TailAdmin filters tables via a "Filter" dropdown
(§6c), not chip rows. Default for this rework = keep the styled segmented control above. Only switch to the
dropdown pattern if the owner explicitly says so.

### 2. Session-log reconciliation (clause 10 / Task 264)
- Either update `docs/sessions/2026-06-25-task485-admin-table-tailadmin-composition.md` with a REWORK section, or
  add `docs/sessions/2026-06-25-task485-REWORK-card-edge-anchoring.md`.
- The Files Changed table MUST list every rework-touched path with an accurate 1-line rationale, specifically:
  - `MantineDataTableToCards.tsx` — `renderDesignedCard` rewritten to edge-anchored `space-between` meta rows (38/62 retracted) + stale JSDoc fix (item 3).
  - `AdminUsersTable.tsx` — `userCard.title` `fw={600}→fw={500}` `c="gray.7"`.
  - `docs/mantine-responsive-design-system.md` — §7.1 / §7.2 / §16 rewritten to the edge-anchored spec.
- Include the rendered matrix from item 1.

### 3. Stale in-file JSDoc — `MantineDataTableToCards.tsx`
- Fix the class/interface JSDoc (around lines 11–18) so it matches the implemented design:
  - The DESIGNED card meta is **edge-anchored `Group justify="space-between"`** (label left edge / value right edge),
    NOT "label 38% fixed, value flex". (The *generic* no-`card` fallback still uses the 38%/62% rhythm — keep that note accurate and clearly scoped to the fallback only.)
  - Title is `fw={500}` (medium), not "bold".

## Hard rules
- Do NOT alter the verified edge-anchoring layout/logic in `renderDesignedCard`.
- Tokens only; preserve all handlers/testids.
- No new user-facing strings (so locale parity stays at the current `check:i18n` baseline).

## Acceptance
1. Rendered proof artifacts exist for 320/375/480 × en/uk + sq/it@320, referenced in the session log, each showing edge-anchored rows (label left / value right), no clip/overflow, no h-scroll@320.
2. Session log Files Changed table matches the real rework diff (all paths above present with rationale).
3. `MantineDataTableToCards.tsx` JSDoc matches the implemented design (no "38% fixed" for the designed card; title "medium" not "bold").
4. tsc=0 · check:stories green · check:i18n green (unchanged baseline) · check:design-tokens green · RTL 20/20 · file-integrity clean.
5. No git; UI-only; no behavior change.
