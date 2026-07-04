# Task 543 — MantineStoryShell: add the missing ≥640 edge gutter to `width="constrained"` (Tabs + Table)

> **Sprint 40 (TailAdmin Conformance — All Primitives). Owner P0, 2026-07-04.**
> **Executor:** Sonnet 4.6. **Type:** UI / story-harness layout fix — ONE file (`src/stories/mantine/_MantineStoryShell.tsx`).
> **Status:** OPEN. Independent of Task 541 (Tabs redesign) — different files, no conflict; do this FIRST to unblock the
> owner's visual review, then Task 541 continues.
> **Origin:** owner found (2026-07-04) that the `Tabs` and `Table` stories render with **0px horizontal padding from the
> screen edges** at `≥640` (e.g. 773px), while every other primitive story (TextInput, etc.) has the correct edge gutter.
> Sonnet restarted Task 541 three times without fixing it because the cause is NOT in the Tabs code — it is in the shared
> shell's `constrained` branch (a Task 540 gap), which also affects Table.

## Root cause (confirmed by orchestrator, do NOT re-investigate)

`src/stories/mantine/_MantineStoryShell.tsx`, the middle `Box` (currently lines ~43–48):

```jsx
<Box
  maw={isConstrained ? { base: '100%', sm: 1536 } : undefined}
  mx={isConstrained ? 'auto' : undefined}
  px={isConstrained ? undefined : { base: 0, sm: 'md', md: 'xl' }}   // ← BUG: gutter only for 'full'
  py={{ base: 'md', sm: 'xl' }}
>
```

The outer horizontal gutter (`sm:'md'` 16px / `md:'xl'` 24px, §6m `p-4 md:p-6`) is applied **only** for `width="full"`.
For `width="constrained"` (Table + Tabs) `px` is `undefined` → zero outer gutter. The `maw:1536`+`mx:'auto'` cap only
centers when the viewport exceeds 1536; below that (e.g. 773px) the white card spans edge-to-edge with 0px margin.

## Required fix (exact — one change)

Apply the SAME outer horizontal gutter to BOTH modes; keep the cap + centering exclusive to `constrained`:

```jsx
<Box
  maw={isConstrained ? { base: '100%', sm: 1536 } : undefined}
  mx={isConstrained ? 'auto' : undefined}
  px={{ base: 0, sm: 'md', md: 'xl' }}   // gutter for BOTH modes (was: isConstrained ? undefined : {...})
  py={{ base: 'md', sm: 'xl' }}
>
```

Do NOT change `maw`, `mx`, `py`, the inner card `Box`, the outer `bg` box, or anything else. Do NOT touch any `.stories.tsx`,
`theme.ts`, or `input-chrome.css`. This is a single-token scope. Update the block/JSDoc comment to note Task 543 added the
`constrained` edge gutter (the §6m gutter now applies in both modes; the cap/centering stays constrained-only).

## Current behavior to preserve

- **`<640` (P0 mobile gate): byte-identical.** `px.base` stays `0` → full-bleed; inner card `px.base:'md'` (16px internal)
  unchanged. The fix must not alter any `<640` cell.
- **`width="full"` stories (21 primitives): unchanged** — they already had this exact `px`, so their render is identical.
- **`constrained` cap:** Table + Tabs still cap at `1536` and center (`mx:'auto'`) at large viewports — only the missing
  ≥640 edge gutter is added.

## Positive + Negative flow

- **Positive:** at `≥640` (stress 680/773/768/1024/1440) × sq/en/uk/it, the `Tabs` and `Table` story cards are inset from
  the canvas edges by 16px (`640–767`) / 24px (`≥768`), matching the `full` stories (e.g. TextInput). At `≥1536` the column
  caps at 1536, centered, with the same 24px inner gutter.
- **Negative:**
  - (a) `<640` (uk@320/375/390): Tabs + Table remain full-bleed (base:0), no new gutter, no regression — full-width mobile
    gate intact.
  - (b) **Table must not newly clip/overflow:** adding 48px of gutter at ≥768 reduces content width — confirm the Table
    story (which is `constrained` precisely because it is wide) still renders without horizontal clip past the card, or
    scrolls within its own `ScrollArea` as before. If the Table genuinely overflows the narrower column at any canonical
    breakpoint, STOP and ASK (do not remove the gutter unilaterally).
  - (c) No `full` story shifts by a single pixel (their `px` value is unchanged).

## Pre-read (rule-index → UI / layout / component)

- `docs/agent-contract.md` (1–16) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — story-harness only, no
  product flow; confirm).
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §16.
- `docs/tailadmin-style-reference.md` §6m (the shell gutter/cap record — the values being applied).
- `docs/ui-rules.md`, `docs/qa-rules.md`.

## Gates to close (HELD until green)

- `npm run screenshots:assert -- --mantine-only` — Tabs + Table now inset at ≥640 (no 0px edge), full stories unchanged,
  no new FAIL, uk@320/375/390 still full-bleed. Attach the manifest (expect the same PASS count as HEAD minus nothing —
  a gutter change should not fail cells; if Table overflows, that is finding (b) → STOP-AND-ASK).
- Planted-violation FAIL transcript (prove the gate still catches a real overflow on this surface — reuse the proven
  shell-level `miw={{base:900,sm:0}}` method, revert after).
- `npx tsc --noEmit`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens -- --strict`,
  `check:file-integrity` — all green.
- Regression (clause 15): no registry flow touched — confirm & state.

## Acceptance criteria

1. `_MantineStoryShell.tsx` middle `Box` `px` applies `{ base: 0, sm: 'md', md: 'xl' }` in BOTH modes; `maw`/`mx` stay
   constrained-only; comment updated. No other file touched. (clause 1 scope)
2. Rendered proof: Tabs + Table cards inset 16/24px at ≥640 × sq/en/uk/it (side-by-side with a `full` story confirming
   parity); `<640` full-bleed unchanged; `full` stories pixel-identical. (clauses 11/12)
3. Table does not newly clip/overflow (finding (b)) — verified or STOP-AND-ASK raised.
4. All light gates green; native `--assert` manifest + planted-violation transcript attached.
5. Session log: Files-Changed table (one row), AC-by-AC self-audit, `Self-validation: …` line. **Do NOT run git** — HELD
   for orchestrator diff review + commit emission.

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — the orchestrator reviews the real one-file diff + the native rendered matrix,
then emits the explicit-path commit (`src/stories/mantine/_MantineStoryShell.tsx` + session log + backlog). Owner runs it
in PowerShell after the native gate.
