# Kickoff — Task 487 — Card / Paper primitive → TailAdmin (Sprint 37, MM Phase 1, P1.09)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews the real diff + rendered story side-by-side with the TailAdmin archive).
> **Epic:** MM (Mantine UI migration). **Sprint:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md`.
> **Program/tracker:** `docs/mantine-tailadmin-migration-tracker.md`. **Reference (copy-source):** `docs/tailadmin-style-reference.md` §5 (shadow) + §6 (Card) + `demo_tailadmin_com.zip`.
> **Theme:** `src/design-system/mantine/theme.ts`. **Story path:** `src/stories/mantine/primitives/Card.stories.tsx`.
> **Precedent (copy the pattern exactly):** Task 486 Badge — `src/stories/mantine/primitives/Badge.stories.tsx` + `docs/sessions/2026-06-25-task486-badge-primitive.md`.

## Hard contract (P0 — verified against the diff on return; see `docs/agent-contract.md` clauses 1–15)
- Do NOT change scope. Phase-1 = theme defaults + ONE proof story only. **NO product-surface edits** (no `src/components/**`, no `src/app/**`, no patterns).
- Do NOT invent architecture. If anything is ambiguous → **STOP and ASK the orchestrator**, do not guess.
- Do NOT remove/alter existing Card/Paper consumer behavior. Only theme `components.Card`/`components.Paper` defaults + the new story.
- Execute the AC literally. Self-validate BEFORE claiming complete (tsc=0, AC-by-AC table, read-back every written file).
- Update `docs/backlog.md` + add a session log under `docs/sessions/` with a **Files Changed** table. **Do NOT run git** (single-writer; the orchestrator emits commits).

## Pre-read (rule-index: UI/layout/component task — load ONLY these)
**Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this task touches NO registry flow; confirm and state so).
**Required:** `docs/mantine-responsive-design-system.md` (§7 mobile gate, §8 Mantine Storybook proof rules, §12 patterns, §13 rebuild plan, §16 acceptance gates) ← **FIRST READ**; `docs/ui-rules.md`; `docs/component-rules.md`; `docs/qa-rules.md`.
**This task specifically:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md` (§ Task 487 + Shared DoD); `docs/tailadmin-style-reference.md` §5 + §6; `src/stories/mantine/primitives/Badge.stories.tsx` (template).

## Required values (TailAdmin §6 Card + §5 shadow — copy EXACTLY, zero invented values)
- **Card (content):** `radius="2xl"` (16px) · `padding="lg"` (20px — owner-decided 2026-06-25, fixed, NOT responsive 20/24) · `withBorder` border color **gray-1** (`#f2f4f7`, = TailAdmin gray-100) · `bg` white · **NO shadow** (flat).
- **Paper:** matches Card chrome — `radius="2xl"` · border color gray-1 when `withBorder` · NO shadow by default. (Padding is set by consumers, not the Paper default.)
- **§5 shadow rule:** content Card/Paper = **flat, shadow none**. `shadow-theme-xs` is ONLY for inputs/controls; `shadow-theme-lg`/popover shadow is ONLY for dropdowns/popovers/menus. A content Card MUST NOT carry a shadow.
- Note: the §6b admin-table wrapper uses a **gray-2** border — that is a *consumer override* (Task 485/488), NOT the Card/Paper default. Do not change the default to gray-2.

## Current state to verify & preserve
`src/design-system/mantine/theme.ts` ALREADY contains (from Task 484):
```ts
Card:  { defaultProps: { radius: '2xl', padding: 'lg' }, styles: { root: { '--mantine-color-default-border': 'var(--mantine-color-gray-1)' } } },
Paper: { defaultProps: { radius: '2xl' },                styles: { root: { '--mantine-color-default-border': 'var(--mantine-color-gray-1)' } } },
```
- **Verify** these match §6 exactly. If they already do (expected), make **NO theme change** and SAY SO explicitly in the session log (with a §6-vs-theme comparison table, like Task 486 did). Only edit `theme.ts` if a value is actually wrong/missing (e.g. an unwanted shadow default). Do NOT add `shadow` props.
- Existing Card/Paper consumers keep their content and any explicit props (e.g. a consumer passing `withBorder`/`shadow`/custom border) — unaffected.

## Story to create — `src/stories/mantine/primitives/Card.stories.tsx`
Copy the Badge story's proof-path EXACTLY:
- `title: 'Mantine/Primitives/Card'`, single export **`Default`** only (no per-viewport/per-locale/Pass/Fail exports).
- `parameters: { skipCanvas: true, layout: 'fullscreen' }`.
- Locale via `context.globals.locale`; labels via `storyT(locale, key)` from `'../../_storyI18n'`.
- Modest padded canvas: outer `Box p="xl"` (Sprint 37 DoD §6 — NOT edge-glued).
- All CARD CONTENT strings via `storyT()`. Thin dev section-labels (like Badge's `xs / sm (default)`) are acceptable only as non-content annotations — keep them minimal; everything a user would read goes through `storyT()`.

Sections (each a labeled group, stacked in a `Stack`):
1. **Content Card (default chrome)** — a `Card` with header (title `Text fw={600}`), body (`Text` paragraph), and a footer row with a canonical Mantine `Button` (theme default). Proves radius-16, 20px padding, flat gray-1 border, white bg, **no shadow**.
2. **Paper variant** — a `Paper withBorder p="lg"` surface with a title + body, proving identical chrome (radius-16, gray-1 border, no shadow).
3. **Negative flow** — (a) `Card withBorder={false}` → no border BUT radius/padding tokens still applied (prove no raw-px leak, no shadow); (b) a **nested** `Card` inside a `Card` → no double border/shadow stacking artifact.

### i18n keys (namespace `storybook.mantine.*`, ALL 4 locales sq/en/uk/it — same key set)
First check whether equivalent keys already exist in `messages/*.json` under `storybook.mantine` and **reuse** them. If not, add these (English source shown; provide faithful sq/uk/it):
- `card_demo_title` — en: "Card title"
- `card_demo_body` — en: "Flat content card — rounded corners, gray border, no shadow."
- `card_demo_action` — en: "View details"
- `card_paper_title` — en: "Paper surface"
(Use a uk string long enough to stress-wrap, e.g. the natural Ukrainian translation — confirm it does not clip at 320.)
Maintain exact key parity across all four files; `check:i18n` must stay green with matched counts.

## Positive flow (happy path)
1. Open Storybook → `Mantine/Primitives/Card → Default`, locale=en, any viewport.
2. Content Card renders: 16px rounded corners, 20px inner padding, 1px flat **gray-1** border, white bg, **no shadow**; title + body + footer Button legible.
3. Paper variant renders identical chrome (radius-16, gray-1 border, no shadow).
4. Switch locale (en→uk→sq→it via toolbar): all card text updates from `storyT()`, no missing-key/raw-key leak.
5. Side-by-side vs `demo_tailadmin_com.zip` content card: radius/border/padding/flatness match.

## Negative flow (every off-happy-path branch)
- **`withBorder={false}`:** Card shows NO border, but STILL radius-16 + padding-20 from tokens (no raw px, no shadow). Verifiable in the rendered cell + the diff (no hardcoded `border`/`px`).
- **Nested Card:** inner Card does not produce a doubled border ring or any shadow; chrome stays flat.
- **Long uk label:** title/body wrap (`whitespace-normal`), do NOT clip or cause horizontal scroll at 320.
- **Missing/unknown locale:** `storyT` falls back to `en` (no crash, no raw key shown).

## 🔴 Mobile <640 full-width gate (OWNER P0 — MANDATORY)
- The Card/Paper container MUST be **full-width** at `<640` (fills the available canvas width inside `Box p="xl"`; NOT a fixed-width or centered card with side gaps). No `max-w` cap that leaves margins below 640.
- Footer Button: canonical Mantine `Button` — full-width (`fullWidth`/stretched) at `<640`, content-width ≥640. (If the Button primitive's own mobile full-width is not yet standardized in theme, pass `fullWidth` responsively in the story and note it; do NOT redefine the Button primitive here — that's Task 487 out of scope, flag if needed.)
- ≥44px touch target on the footer Button; labels wrap (sq/en/uk/it); no clip; **no horizontal scroll at 320**.
- Exemptions: none expected. If any surface can't be full-width, STOP and ASK.

## 🔴 Rendered proof (clauses 12–13 — machine-produced is the canonical gate)
- After writing the story, **rebuild Storybook so the new story is in the build**, then run the assert harness and paste the result into the session log:
  ```
  npm run build-storybook
  npm run screenshots:assert
  ```
  (Full run — NOT `--fast` — because Sprint 37 DoD §3 requires the **480** cells, which fast mode skips.)
- Required matrix cells, each PASS with concrete evidence (full-width <640? radius/border/no-shadow correct? label wrap? no clip? no h-scroll@320?): **320 / 375 / 480 × en/uk + sq@320 + it@320**, with **uk@320/375/390 mandatory** stress cells.
- If the harness cannot capture the freshly-added story in this environment, say so explicitly and attach the per-cell evidence you DID capture; the orchestrator/owner will do the manual Storybook toolbar matrix + side-by-side at review (as done for Task 486). "tsc=0/build green" is NOT rendered proof and never closes the task.

## Gates (all must pass; paste transcript into the session log)
`tsc --noEmit` = 0 · `npm run check:i18n` (matched key counts ×4) · `npm run check:stories` (0 violations) · `npm run check:design-tokens` (0 violations). Zero hardcode: no raw hex/rgb/named colors, no raw spacing/radius px (theme tokens only), no raw user-facing strings, no raw `<button>/<div>`-as-card.

## Acceptance criteria (each maps to a flow + is verifiable in the diff/render)
1. `theme.ts` Card/Paper defaults verified == §6 (radius 2xl, padding lg, border gray-1, shadow none); a §6-vs-theme table in the log; theme edited ONLY if a value was wrong. → Positive flow 2–3.
2. New `src/stories/mantine/primitives/Card.stories.tsx` exists: single `Default`, `skipCanvas:true`+`layout:'fullscreen'`, `Box p="xl"` canvas, sections 1–3 above. → Positive flow 1–3.
3. Card content strings via `storyT()`; new/reused `storybook.mantine.*` keys present in all 4 locales with parity. → Positive flow 4.
4. Negative flow branches all present in the story (withBorder=false, nested Card, long-uk wrap, locale fallback) and visible in the render. → Negative flow.
5. Mobile <640: Card full-width, footer Button full-width <640 (≥44px), labels wrap, no h-scroll@320. → Mobile gate.
6. Rendered matrix (320/375/480 × en/uk + sq/it@320; uk@320/375/390) attached, or explicit manual-fallback note with captured evidence. → Rendered proof.
7. All gates green; zero hardcode; scope clean (no product-surface files touched). → Hard contract.
8. `docs/backlog.md` + session log under `docs/sessions/` updated; Files Changed table present; **no git commands emitted by the executor**.

## Files expected to change (the orchestrator cross-checks the real diff against this)
- `src/stories/mantine/primitives/Card.stories.tsx` (NEW).
- `messages/{en,sq,uk,it}.json` (only if new keys are needed; else unchanged — say so).
- `src/design-system/mantine/theme.ts` (ONLY if a §6 value is actually wrong — expected: NO change).
- `docs/backlog.md` + `docs/sessions/2026-06-25-task487-card-primitive.md`.
Anything else = scope creep → STOP and ASK.

## Run order context
Sprint 37: 486 Badge ✅ → **487 Card (this task)** → 491 Avatar → 489 Tabs → 490 SegmentedControl → 488 Table. After all 6 ✅, Task 485 reopens as the first Phase-4 surface proof. Task numbering — last used: 491; next free: 492.
