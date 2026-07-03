# Task 533 — Pagination primitive → TailAdmin conformance (Sprint 40 · Batch D · P1.13)

**Type:** UI / primitive styling conformance (theme-token + new Storybook story; possibly one small scoped CSS file). Mantine = source of truth.
**Sprint:** Sprint 40 (TailAdmin conformance, all primitives) — Batch D (feedback/misc) slice, follows Task 532 (Alert).
**Governance:** agent-contract clauses 1–16 (esp. 11 mobile/compact-control, 12 rendered matrix, 13 story gate, 16 TailAdmin style). Per-slice DoD = `tasks/Sprints/Sprint_40_TailAdmin_Conformance_AllPrimitives.md` → "Per-slice Definition of Done".

> **This is a PRIMITIVE slice, not a surface migration.** Scope = make the Mantine `Pagination` primitive render to the
> TailAdmin `/pagination` reference at the theme level + ship its `Mantine/Primitives/Pagination` Storybook story with
> rendered proof. **Do NOT migrate the legacy `@/components/ui/pagination` compound component** (shadcn — its own Phase 4/5
> work) and **do NOT rewrite the existing consumer's behavior** (`MantineAdminSurfacePattern.tsx` already renders
> `<Pagination …>`). Touch only the Mantine theme + the new story + its i18n keys (+ a minimal scoped `pagination-chrome.css`
> ONLY if step 2 proves the edge-control border cannot be expressed via `theme.ts` — see STOP-and-ASK below).

## Pre-read (rule-index → UI/layout/component task)

Required, in this order:
1. `docs/tailadmin-style-reference.md` — **§6l "Pagination"** (measured chrome, source of truth) + **§4 color palette** (gray ramp + brand) + §2 type scale + §3 radius. `demo_tailadmin_com.zip` `/pagination.html` markup is the visual reference. **The reference row already exists — do NOT re-measure, do NOT invent; if a value you need is genuinely absent from §6l, STOP and ASK.**
2. `docs/mantine-responsive-design-system.md` — §7 mobile gate, §8 Mantine Storybook proof path, §12 canonical patterns, §16 acceptance gates, **§18 theming pitfalls** (inline `theme.styles` freeze the cascade — anything state/pseudo/`:hover`-dependent or selector-dependent goes in a stylesheet, not `theme.ts`; `data-active` is the active-control attribute).
3. `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
4. `docs/storybook-governance.md` §14 + the Task 529 enforced-gate mechanism (your story is auto-discovered by `Mantine/Primitives/*` and must pass `npm run screenshots:assert -- --mantine-only`).
5. Always-required: `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — see "Regression coverage" below).

## Authoritative TailAdmin values (from §6l "Pagination", measured live 2026-07-02 — do NOT invent, do NOT re-measure)

- **Item gap (between controls):** **8px** → theme spacing token **`xs`** (`theme.ts` spacing: `xs=0.5rem/8px`).
- **Prev / Next controls:** white bg · text **gray-700 `#344054`** (`--mantine-color-gray-7`) · **1px border gray-300 `#d0d5dd`** (`--mantine-color-gray-3`) · radius **8px** (`--mantine-radius-lg`) · height **42px** · **14px** (`--mantine-font-size-sm`).
- **Active page number:** **40×40** · bg **brand** (`color="brand"` → brand-7 `#EC5447`, primaryShade 7) · **white** text · radius **8px** (`lg`).
- **Inactive page numbers:** **transparent** bg · **gray-700** text (`--mantine-color-gray-7`) · **hover bg gray-50 `#f9fafb`** (`--mantine-color-gray-0`) · radius 8px.

Token map (use these — **zero raw hex/px** in code): gap `xs`; border `var(--mantine-color-gray-3)`; inactive text `var(--mantine-color-gray-7)`; hover bg `var(--mantine-color-gray-0)`; radius `var(--mantine-radius-lg)`; type `var(--mantine-font-size-sm)`; active fill via `color="brand"`. If any needed value is not expressible as a token, **STOP and ASK — do not hardcode.**

## Current behavior to preserve (Notes 19/20 — verify by grep FIRST, list in the session log)

- **`theme.ts` currently has NO `Pagination` block** (grep-confirmed) — the primitive renders with Mantine stock defaults + whatever `color`/`size` the consumer passes. This slice ADDS a `Pagination` theme block.
- **Existing Mantine consumer (must keep working byte-for-behavior):** `src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx` L111–121 renders, inside `<Group justify={isMobile ? 'center' : 'flex-end'}>`:
  ```tsx
  <Pagination total={totalPages} value={currentPage} onChange={onPageChange} color="brand" size={isMobile ? 'sm' : 'md'} />
  ```
  Your theme block **must not break** this: `total`/`value`/`onChange` continue to work; the consumer's responsive **`size` prop must still govern control dimensions** (mobile `sm`, desktop `md`). ⚠️ **Therefore the chrome you add must be SIZE-AGNOSTIC** — style color/border/radius/hover/gap, but do **NOT** hard-pin control width/height in the theme (that would override the consumer's `size` prop and regress the mobile-compact intent). See STOP-and-ASK #2 for the 40/42px question.
- **Legacy `@/components/ui/pagination` (shadcn compound)** is untouched and must render byte-identically (you are not editing `pagination.tsx`). It uses the `ui.pagination` i18n namespace — leave those keys alone.

## Mantine `Pagination` Styles API (confirm each slot in DevTools before finalizing — §18 discipline)

Slots: **`root` · `control` · `dots`**. The active control carries **`data-active`** (Mantine sets this — verify). `withControls` (prev/next arrows) and `withEdges` (first/last) render as `.mantine-Pagination-control` too. **There is no built-in `data-edge`/`data-control` attribute distinguishing the prev/next arrow controls from the number controls** — this is the crux of STOP-and-ASK #1 below. Verify the real DOM in DevTools; do not assume.

## Required after-behavior (action by action)

1. **Add a `Pagination` component theme block to `theme.ts`** (place it near the other control blocks, e.g. after `Notification`/`Alert`), using a `styles` callback if needed so `:hover`/`data-active` resolution is **not frozen** (§18). Apply ONLY the size-agnostic chrome that Mantine slots can express cleanly:
   - `defaultProps`: `color: 'brand'`, `radius: 'lg'` (8px), `gap: 'xs'` (8px between controls). **Do NOT set `size` in defaultProps** (the consumer sets it; leaving it lets the consumer win). Cite §6l on each.
   - **`control` slot (inactive/number):** transparent bg, `color: var(--mantine-color-gray-7)`, `fontSize: var(--mantine-font-size-sm)`, `borderRadius: var(--mantine-radius-lg)`; **hover → `backgroundColor: var(--mantine-color-gray-0)`**. If Mantine's stock inactive control ships a border, remove it here so inactive numbers are borderless per §6l. (Hover/pseudo → if it can't be set via `theme.styles`, put it in a scoped `pagination-chrome.css` — document which path won, §18.)
   - **active control (`&[data-active]` — confirm attr in DevTools):** brand fill + white text is Mantine's default for `color="brand"` — verify it renders `#EC5447` bg + white text + 8px radius; only override if it doesn't.
   - **Prev/Next edge controls — 1px `gray-3` border (see STOP-and-ASK #1):** attempt via a DevTools-verified stable selector for the arrow controls (e.g. structural `:first-of-type`/`:last-of-type` within `root`, or a `:has()` on the chevron svg) in the scoped `pagination-chrome.css`. **If no reliable selector exists, STOP and ASK — do not apply the border to ALL controls (that would put a border on the transparent number controls, violating §6l), and do not invent a divergence silently.**
2. **Create the story** `src/stories/mantine/primitives/Pagination.stories.tsx` on the **Mantine proof path** (Task 482/529), matching the established `Mantine/Primitives/*` convention (see `Alert.stories.tsx`): `title: 'Mantine/Primitives/Pagination'`, `parameters.skipCanvas: true`, `layout: 'fullscreen'`, **exactly ONE `Default` export**, toolbar-driven viewport + locale (no per-viewport/per-locale/`Ukrainian*`/`Pass`/`Fail` exports, no `globals.locale` pin). The Default renders:
   - a **default cluster** (moderate `total`, e.g. 10, a mid `value`) showing inactive numbers + active number + prev/next + dots;
   - a **mobile-realistic cluster** using `siblings={1} boundaries={1}` (or `size="sm"`) so it stays **compact and does not h-scroll at 320** with a large `total` (e.g. 50) — this is the mobile stress cell;
   - localized `aria-label`s for prev/next/dots via `getControlProps`/`getItemProps` (verify the exact Mantine API) routed through `storyT()` against `storybook.mantine.pagination.*`. Any dev-facing section caption `<Text>` follows the same convention as `Alert.stories.tsx` (technical annotations are allowed; `check:stories` Check 10 pure-alpha-words pattern must still pass).
   - No raw `<div>`/`<button>` chrome, no raw user-facing strings.
3. **Add i18n keys** for the story's aria strings to all four locales `sq`/`en`/`uk`/`it` in the same key set (namespace `storybook.mantine.pagination.*`, e.g. `aria_prev`, `aria_next`, `aria_dots`, `aria_page`). Do NOT reuse or touch the legacy `ui.pagination` keys. `check:i18n` parity 4/4. Since Pagination is mostly numeric, the visible-text surface is small — the localization proof is that switching locale re-renders the aria labels (verify via DevTools/accessibility tree, not just key counts).
4. **No other primitive/theme block touched.** Only: `theme.ts` (`Pagination` block), the new story, the new i18n keys, and — only if step 1 proves a selector rule is required — a minimal scoped `pagination-chrome.css` (documented, imported the same way `input-chrome.css` is).

## Positive flow (happy path)

Actor: any surface (or the Storybook Default) rendering `<Pagination total value onChange color="brand" size=…>`.
1. A pagination cluster renders: inactive number controls transparent w/ gray-700 text, 8px radius, 8px gaps; hovering an inactive number shows a gray-50 bg. → matches `/pagination`.
2. The active page renders 40×40-ish, brand `#EC5447` fill, white text, 8px radius. → matches the active pill in `/pagination`.
3. Prev/Next controls render with white bg, gray-700 chevron/text, 1px gray-300 border, 8px radius. → matches the edge buttons in `/pagination`. (Contingent on STOP-and-ASK #1 resolution.)
4. Clicking a number/prev/next fires `onChange` with the new page (behavior unchanged from Mantine default — verify the existing consumer still paginates). Post-condition: `MantineAdminSurfacePattern` still centers on mobile / right-aligns on desktop and changes pages.

## Negative flow (every off-happy-path branch)

- **Single page (`total<=1`):** the existing consumer already guards with `totalPages > 1`; confirm the primitive itself renders sanely if a story/consumer passes `total={1}` (no crash, minimal render). Document.
- **Large `total` at 320px (mobile stress):** with `siblings/boundaries` compact settings the cluster **must not horizontally scroll at 320** in any locale (uk/it longest aria not visible but dots/ellipsis must not overflow). This is the mandatory mobile check (Pagination is a **compact control cluster** — see the clause-11 note below).
- **Disabled/edge at boundaries:** on page 1 the Prev control is disabled (Mantine default `data-disabled`) — confirm it still reads as disabled and does not lose the border treatment awkwardly; on the last page Next is disabled. Document the disabled render (dimmed per Mantine default; do not fight it unless it clashes with §6l — if it does, STOP and ASK).
- **Locale switch:** toolbar locale change re-renders the aria labels; `check:i18n` parity 4/4 across `storybook.mantine.pagination.*`.
- **Hover/focus:** inactive hover = gray-50 bg; keyboard focus ring remains visible (Mantine default — do not remove).

## Mobile <640 gate (agent-contract clause 11 — compact-control exemption applies)

- Pagination is a **compact control cluster**, which is the documented **exemption** to the full-width rule — it may stay **content-width / centered** on mobile (the consumer centers it via `Group justify="center"`), it does **NOT** need `w-full`. **BUT** it MUST **not h-scroll at 320** in any locale: use compact `siblings/boundaries` and/or `size="sm"` so the control count fits, and ellipsis/dots collapse the middle. Touch targets stay **≥44px tappable** even if the visual control box is ~40px (confirm the tap area; if the 40px control is below the 44px tap min, STOP and ASK whether to bump the mobile tap target). Verify all of this **rendered**, not asserted. State the compact-control exemption explicitly in the session log (per clause 11, every exemption must be listed with justification).

## TailAdmin conformance gate (agent-contract clause 16)

- Every value traces to **§6l "Pagination"** (+ §3 radius / §4 color / §2 type tokens) — cite the §-row in each comment; zero invented color/px/radius. `check:design-tokens:strict` green + no raw hex/px in the diff (orchestrator will grep).
- **Rendered proof SIDE-BY-SIDE with the zip `/pagination`** at **320/375/480 × en/uk + sq/it@320 (uk@320/375/390 mandatory) + one ≥640 cell**. Active pill (brand + white + radius), inactive number (transparent + gray-700 + hover gray-50), prev/next (white + gray-300 border + radius), and the 8px gaps must visibly match. `tsc=0`/gate-green is **baseline, never style proof**.

## Regression coverage (agent-contract clause 15)

Scan `docs/critical-flow-registry.md`: this slice changes only the Mantine `Pagination` theme chrome + a new story + story-only i18n keys. It touches the primitive consumed by `MantineAdminSurfacePattern` (admin table paging) — **confirm in the session log that the paging BEHAVIOR (`onChange`/`value`) is unchanged** (chrome-only). If admin-table pagination is a registered critical flow, note its row and that this is a visual-only change with no behavior delta; if it is not registered, no new row is required for a chrome-only change (state this). Beyond that, the **enforced rendered gate (Task 529)** auto-covers `Mantine/Primitives/Pagination` — confirm the story is discovered (cell count grows) and passes, and paste the gate transcript + a planted-violation FAIL transcript proving the gate is real.

## Acceptance criteria (each maps to a flow + a verifiable file:line / rendered cell)

1. `theme.ts` `Pagination` block added (`color:'brand'`, `radius:'lg'`, `gap:'xs'`, size-agnostic; inactive control transparent/gray-7/hover gray-0; active brand+white verified) — Positive steps 1–2. Verifiable at `theme.ts` `Pagination:` block (+ any documented scoped CSS).
2. Prev/Next edge controls carry the 1px `gray-3` border + white bg per §6l (or, if STOP-and-ASK #1 resolved to a documented divergence, the owner-approved outcome is recorded) — Positive step 3. Verifiable in the diff + rendered cell.
3. `src/stories/mantine/primitives/Pagination.stories.tsx` on the Mantine proof path, single `Default`, default + mobile-compact clusters, localized aria via `getControlProps`/`getItemProps` — Positive steps 1–4 + Negative large-total/boundary. Verifiable in the story file.
4. i18n `storybook.mantine.pagination.*` present in `sq/en/uk/it`, same key set, runtime-switch verified in the a11y tree — Negative "locale switch". Verifiable in the four locale files + `check:i18n` transcript.
5. No h-scroll at 320 (uk) with a large `total`; compact-control exemption documented; ≥44px tap targets — Negative mobile branch. Verifiable in the rendered matrix (uk@320/375/390 cells).
6. Rendered side-by-side vs zip `/pagination` at the required cells (active / inactive / prev-next / gaps) — clause 16. Verifiable in the attached PNG matrix.
7. Existing consumer (`MantineAdminSurfacePattern`) still paginates and still centers-mobile / right-aligns-desktop (Notes 19/20 before/after) — verifiable via a rendered check of the consumer or the story mirroring its props.
8. Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens:strict`, `check:mojibake`, `check:file-integrity`, and `screenshots:assert -- --mantine-only` (Pagination story PASS, 0 FAIL) — with a planted-violation FAIL transcript. Files Changed table + session log + `docs/backlog.md` update present. **Executor emits NO `git add`/`git commit`.**

## STOP-and-ASK triggers (do NOT invent — ask the orchestrator/owner)

1. **Edge-control border selector.** Mantine gives the prev/next arrows the same `.mantine-Pagination-control` class as number controls, with no `data-edge` attribute. If, after DevTools inspection, there is **no reliable/stable selector** to put the 1px `gray-3` border on ONLY the prev/next controls (leaving number controls transparent per §6l), STOP and ASK. Options to present: (a) structural `:first-of-type`/`:last-of-type`/`:has(svg)` selector in `pagination-chrome.css`; (b) accept a documented minor divergence (e.g. border on all or none). Do not silently pick one.
2. **Exact 40px number vs 42px prev/next height.** Mantine controls are uniform per `size`; the consumer sets `size` responsively. If the owner requires the exact §6l 40/42 split (not expressible without hard-pinning size and thus overriding the consumer), STOP and ASK. Default assumption if not asked: keep chrome size-agnostic, let the consumer's `size` govern, and document the pixel delta.
3. **≥44px tap target vs 40px control.** If the mobile control renders below the 44px tap minimum, STOP and ASK whether to bump the mobile tap area (vs accept the ~40px visual per §6l).

## Hard contract (verified against the diff on return)

No scope change (primitive theme + story + story-i18n only, + at most one scoped `pagination-chrome.css`; NO consumer rewrite, NO `pagination.tsx`/legacy edit, NO other theme block). No invented architecture — STOP and ASK on the three triggers above. Literal ACs. Self-validate before "complete" (Note 18: AC-by-AC table, tsc=0, self-diff review, runtime uk@320 walk of the mobile-compact cluster). Preserve UX flow + existing controls (Notes 19/20 — the admin-table paging consumer). File-integrity clean (clause 14): read back every written file, 0 NUL / no BOM / not truncated, paste the green transcript. Session log with a **Files Changed** table (one row per path + rationale). **Executor emits NO `git add`/`git commit`** — the orchestrator emits explicit-path commit commands at review.

## Expected Files Changed

- `src/design-system/mantine/theme.ts` — new `Pagination` block (§6l chrome, size-agnostic).
- `src/stories/mantine/primitives/Pagination.stories.tsx` — NEW, Mantine proof-path story.
- `messages/sq.json` · `messages/en.json` · `messages/uk.json` · `messages/it.json` — `storybook.mantine.pagination.*` keys (confirm the actual locale-file structure before editing; they are flat-ish under `storybook.mantine`).
- (only if required by step 1) `src/design-system/mantine/pagination-chrome.css` (or the project's established scoped-CSS location) — documented.
- `docs/backlog.md` + `docs/sessions/2026-07-03-task533-pagination-conformance.md` (+ `docs/sessions/assets/task533/` rendered PNGs).
