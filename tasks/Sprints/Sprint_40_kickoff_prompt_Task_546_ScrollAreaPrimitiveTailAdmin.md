# Task 546 — ScrollArea primitive → TailAdmin (Phase 1 · P1.26)

> **Sprint 40 / Epic MM — Phase 1 primitive slice. Owner P0, agent-contract clause 16.**
> **Executor:** Sonnet 4.6. **Type:** UI / Mantine primitive slice (theme defaults + thin wrapper only if needed +
> story + rendered proof). Follows the P1.23 (Progress) / P1.24 (Skeleton) / P1.25 (Separator) precedent:
> **primitive + story ONLY, zero consumer migration** (that is Phase 2). **Status:** OPEN.
> Tracker row: `docs/mantine-tailadmin-migration-tracker.md` P1.26 (`scroll-area.tsx` → Mantine `ScrollArea`, ref §6).

## Scope

Build the canonical Mantine `ScrollArea` primitive (the Mantine equivalent of the legacy `scroll-area.tsx`) styled to
the TailAdmin scrollbar look, plus a `Mantine/Primitives/ScrollArea` story with rendered proof. Do NOT migrate any
consumer; do NOT touch other primitives; **do NOT touch the global `::-webkit-scrollbar` rule in `globals.css`** (see
the scope guard in Step 0 — that is an app-wide native-scrollbar layer, out of scope for a primitive task).

**Legacy contract to preserve** (`src/components/ui/scroll-area.tsx`, Base-UI `ScrollArea`):
- Root: `relative` positioned container.
- Viewport: `size-full rounded-[inherit]`, focus-visible ring (`focus-visible:ring-3 ring-ring/50`).
- Scrollbar (vertical + horizontal): a thin bar — vertical `w-2.5` (10px) / horizontal `h-2.5` (10px), `p-px`,
  `transition-colors`, `select-none touch-none`.
- Thumb: `rounded-full bg-border` (the pill thumb; `bg-border` = the gray border token).
- Corner element present.

It is a plain, non-interactive scroll container. Mantine `ScrollArea` (props: `type` `hover`|`scroll`|`auto`|`always`|
`never`, `scrollbarSize`, `scrollbars` `x`|`y`|`xy`, `offsetScrollbars`, `scrollHideDelay`) is a strict superset —
**prefer importing Mantine `ScrollArea` directly** (like Skeleton/Divider imported their primitive), no wrapper, unless
a real behavior gap appears. **If a gap appears, STOP and ASK before adding a wrapper.**

## 🔴 Step 0 — EXTRACT the reference FIRST (clause 16 — no invented values)

There is **no authoritative standalone scrollbar/ScrollArea §-row yet** — only incidental cites (§ "Scroll:
`max-w-full overflow-x-auto`"; Tabs/SegmentedControl swipe-scroll notes). Before writing any code, extract TailAdmin's
scrollbar chrome from `demo_tailadmin_com.zip` (`css/style.css` + any `custom-scrollbar`/`::-webkit-scrollbar` markup in
its HTML pages) into a NEW `docs/tailadmin-style-reference.md §6p` row:
- **Thumb color** — which gray token TailAdmin's scrollbar thumb uses. Candidate anchors already in the doc: gray-200
  `#e4e7ec` (border ramp), gray-300 `#d0d5dd`, gray-100 `#f2f4f7`. Confirm from the zip; cite the exact class /
  `css/style.css` line. Do NOT assume.
- **Track color** — transparent / a gray token (confirm).
- **Thickness** — the scrollbar width/height (e.g. `6px`? `8px`? `10px`?). Cite it. (Note: the project's own
  `globals.css` native scrollbar is `6px` with a `bg-border` thumb — a DIFFERENT layer; see the scope guard below.)
- **Radius** — thumb radius (TailAdmin scrollbars are typically fully rounded / `rounded-full`).

- **🔴 Mechanism reconciliation — the key decision, resolve it in Step 0 and record it in §6p:** TailAdmin styles the
  **native** browser scrollbar (via a `.custom-scrollbar` utility on `::-webkit-scrollbar`/`-thumb`/`-track`), whereas
  Mantine `ScrollArea` renders its **own overlay scrollbar DOM** (`.mantine-ScrollArea-scrollbar` +
  `.mantine-ScrollArea-thumb`, NOT native `::-webkit-scrollbar`). This task maps TailAdmin's thumb color + thickness +
  radius onto **Mantine's ScrollArea overlay scrollbar/thumb**. Determine the mechanism per
  `mantine-responsive-design-system.md` §18 + the Skeleton/Divider precedent:
  - Try `theme.components.ScrollArea` (`defaultProps.scrollbarSize` for thickness; `styles`/`vars` or the
    `--scrollarea-*` CSS vars for thumb color/radius) FIRST.
  - Only fall back to a scoped `scrollarea-chrome.css` (input/pagination/skeleton-chrome precedent) if you PROVE the
    thumb color/radius can't be set via theme (document the proof against Mantine's compiled `ScrollArea.mjs` +
    `ScrollArea.module.css`, exactly as Task 545 §14.9.13 did for Divider). Record the finding in
    `storybook-governance.md §14.9.x`.
- **🔴 Scope guard — do NOT touch `globals.css`:** the app already has a GLOBAL `::-webkit-scrollbar { width:6px;
  height:6px }` + `bg-border` thumb rule (`src/app/globals.css` ~L511–515) and a `.no-scrollbar` utility. That is the
  app-wide **native** scrollbar layer — changing it affects every scroll surface in the product, which is beyond a
  primitive slice. **This task styles the Mantine `ScrollArea` overlay scrollbar ONLY.** If Step 0 finds the global
  native scrollbar itself diverges from the TailAdmin §6p values, do NOT fix it here — note it as a FOLLOW-UP
  candidate in the session log and leave `globals.css` untouched.
- If the zip has NO custom scrollbar styling at all (relies on the browser default), extract from the closest cited
  value (the project's own `globals.css` 6px `bg-border` thumb) and say so explicitly — same honest-negative-fallback
  pattern as §6n Skeleton / §6o Separator.

Every value in the implementation must trace to that new §6p row — zero invented color/px/radius.

## Required after-behavior

- **`theme.ts` `ScrollArea` handling per §6p, `var(--mantine-*)` tokens only.** Override Mantine's default scrollbar
  thickness/thumb color to the §6p values via `theme.components.ScrollArea` (`defaultProps` + `styles`/`vars`), or a
  scoped `scrollarea-chrome.css` ONLY with proof (per Step 0). Do NOT re-implement geometry Mantine already gives
  correctly (scroll behavior, thumb drag, viewport) — document any zero-override decision, like Progress/Skeleton/
  Divider did.
- **`Mantine/Primitives/ScrollArea` story** (`skipCanvas: true` + `layout: 'fullscreen'`, `MantineStoryShell`): show the
  states — (1) **vertical scroll** — a fixed-height (`h≈180px`) box with overflowing stacked text content, vertical
  scrollbar + thumb visible; (2) **horizontal scroll** — a fixed-width region with content wider than it, horizontal
  scrollbar visible; (3) **xy** — if §6p/behavior warrants, a box that overflows both axes. Each a static, determinate
  render matching the §6p reference (thumb color/thickness/radius).
  - **🔴 i18n:** every visible caption/label/scroll-content string in the story MUST come from `storyT()` against
    `storybook.mantine.*` with full sq/en/uk/it parity — the canonical pattern used by all sibling primitive stories.
    Do NOT hardcode English captions. (Task 544's dev-annotation exemption `storybook-governance.md §14.9.11` is scoped
    to THAT one story only — it does not license new hardcoded captions here; follow the Task 545 correction.)
  - **🔴 Gate-safety (the critical nuance for THIS primitive):** the horizontal-scroll demo intentionally holds content
    WIDER than its box. That overflow MUST stay contained inside the ScrollArea viewport — the ScrollArea **root must be
    width-constrained to ≤ the story column** so the internal overflow does NOT leak into **document-level** horizontal
    scroll. The rendered gate hard-FAILs on document h-scroll at 320 (that is exactly what the planted-violation proves).
    A "scrollable region" is correct; a document that h-scrolls is a FAIL. Verify the document does not h-scroll at 320
    in any locale while the inner region still scrolls.
- **🔴 Loader-allowlist — VERIFY, do not assume:** a ScrollArea is a static container and should trip NONE of
  `waitForStoryReady`'s 6 loader signals. Confirm this empirically on the built story (like Task 544 §14.9.10 / Task 545
  §14.9.12 did). If (as expected) no signal fires, `LOADER_ALLOWLIST` stays UNCHANGED and you record the verified
  finding in `docs/storybook-governance.md §14.9.x`. If a signal unexpectedly fires, STOP and ASK. **Do NOT copy the
  Separator/Skeleton finding forward — re-verify.**
- **Consumer audit (migrate none):** `grep -rl "@/components/ui/scroll-area" src` — list every consumer in the session
  log; migrate ZERO this task (Phase 2). Current expectation: **zero consumers** (verified at kickoff time — no importer
  of the legacy `scroll-area.tsx` exists) — state it. (Note: existing Mantine `ScrollArea` usages in Tabs/SegmentedControl
  stories + `MantineDataTableToCards.tsx` are the RAW Mantine import for swipe-scroll — they are unaffected by a
  `theme.components.ScrollArea` default, and you MUST confirm the theme default does not regress their thumb/size.)

## Mobile <640 full-width gate (clause 11)

The ScrollArea root container is full-width by default — confirm it spans edge-to-edge at `<640` with no fixed px that
clips at 320. The **scrollbar itself** (a thin overlay bar) is intrinsic-width chrome — documented exemption (not a
full-width surface, same class as Separator's vertical-rule / Skeleton's circle exemption). `≥44px` tap-target is N/A —
non-interactive (the thumb is drag-only chrome, not a focusable control). **No DOCUMENT h-scroll at 320 in any locale**
(the horizontal-scroll demo's overflow is contained inside the ScrollArea viewport — see the gate-safety nuance above).

## Positive + Negative flow

- **Positive:** `Mantine/Primitives/ScrollArea` at `≥640` and `320` × sq/en/uk/it renders the vertical (fixed-height,
  overflowing) + horizontal (fixed-width, overflowing) [+ xy if included] scroll regions with the §6p thumb color +
  thickness + radius — visibly matching the TailAdmin reference side-by-side with the zip. Scrollbar appears per
  Mantine's `type` (hover/scroll/auto) and the thumb drags.
- **Negative:** (a) uk@320/375/390 — ScrollArea root full-width, NO document h-scroll, internal horizontal overflow
  stays contained; long uk/it scroll-content wraps/scrolls, never clips the document. (b) Short/empty content — no
  scrollbar rendered (no phantom thumb) when content fits. (c) No other primitive regressed: the
  `theme.components.ScrollArea` default must NOT change the raw-Mantine `ScrollArea` swipe-scroll used by Tabs/
  SegmentedControl/DataTableToCards (confirm thumb/size unchanged there, or scope the override so it doesn't leak);
  `globals.css` native scrollbar untouched; no shared token/var modified.

## Pre-read (rule-index → UI / layout / component + Storybook)

- `docs/agent-contract.md` (clauses 1–16) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — primitive, no
  registered flow expected; confirm).
- 🔴 `docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` — extract the §6p ScrollArea/scrollbar row FIRST
  (Step 0).
- `docs/mantine-responsive-design-system.md` §7, §12, §16, §18 (theming pitfalls — theme defaultProps/styles/vars vs a
  `*-chrome.css` file; when a value IS reachable via theme, prefer it).
- `docs/storybook-governance.md` §14 (+ §14.9 for the loader-allowlist verification record; note §14.9.11 scope, and
  §14.9.13 for the "check compiled source per component" lesson).
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.

## Gates to close (HELD until green)

- `npm run screenshots:assert -- --mantine-only` — new ScrollArea story, all cells resolved, uk@320/375/390 clean, **no
  document h-scroll**, no new FAIL elsewhere; rendered side-by-side with the zip scrollbar reference. Attach the manifest.
- Planted-violation FAIL transcript (prove the gate still catches a real document overflow on this surface — e.g. remove
  the root width constraint / add a fixed over-wide element so the OVERFLOW leaks to the document — then revert clean and
  reconfirm the baseline). This is especially meaningful here since the story legitimately contains scroll overflow.
- `tsc --noEmit`, `check:stories`, `check:i18n`, `check:mojibake`, `check:design-tokens -- --strict`,
  `check:file-integrity` — all green (paste transcripts).
- Regression (clause 15): confirm no `critical-flow-registry.md` flow touched — state it.

## Acceptance criteria

1. New `tailadmin-style-reference.md §6p` scrollbar row extracted from the zip FIRST (thumb color, track, thickness,
   radius) + the native-vs-overlay mechanism decision recorded; every implementation value cited to it — zero invented
   (clause 16). `globals.css` native scrollbar left untouched (scope guard); any global-native divergence noted as a
   follow-up only.
2. `theme.ts` `ScrollArea` handling (theme defaultProps/styles/vars preferred; `scrollarea-chrome.css` only with proof)
   + `Mantine/Primitives/ScrollArea` story (vertical / horizontal [/ xy] states, `storyT` i18n parity) render matching
   the reference at ≥640 and 320 × sq/en/uk/it, with NO document h-scroll at 320.
3. `LOADER_ALLOWLIST` verified empirically — UNCHANGED if no signal fires (expected), documented in
   `storybook-governance.md §14.9.x` with rendered proof. No assumption copied from Task 545/544.
4. Consumer audit in the session log (expect zero; migrate zero — Phase 2). No other primitive regressed — explicitly
   confirm the raw-Mantine `ScrollArea` swipe-scroll (Tabs/SegmentedControl/DataTableToCards) thumb/size is unchanged by
   the theme default.
5. Rendered `--assert` matrix (uk@320/375/390 + ≥640) + planted-violation transcript (document-overflow leak); all light
   gates green.
6. Session log: Files-Changed table, AC-by-AC self-audit, `Self-validation: …` line. **Do NOT run git.**

## Commit hand-off (HELD)

Do NOT emit `git add`/`git commit`. HELD — the orchestrator reviews the real diff (Read-tool, no sandbox git) + the
rendered matrix, then emits the explicit-path commit (`theme.ts` [+ `scrollarea-chrome.css` only if justified] + the
ScrollArea story + `scripts/check-stories-rendered.mjs` only if the allowlist changed + `tailadmin-style-reference.md`
+ `storybook-governance.md` + any new i18n message keys (sq/en/uk/it) + session log + tracker + backlog). Owner runs it
in PowerShell after the native gate.
