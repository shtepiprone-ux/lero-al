# Kickoff — Task 489 — Tabs primitive → TailAdmin (Sprint 37, MM Phase 1, P1.11)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews the real diff + rendered story side-by-side with the TailAdmin archive).
> **Epic:** MM (Mantine UI migration). **Sprint:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md`.
> **Program/tracker:** `docs/mantine-tailadmin-migration-tracker.md`. **Reference (copy-source):** `docs/tailadmin-style-reference.md` §6c "Tabs, segmented filters" + `demo_tailadmin_com.zip`.
> **Theme:** `src/design-system/mantine/theme.ts`. **Story path:** `src/stories/mantine/primitives/Tabs.stories.tsx`.
> **Precedent (copy the proof-path EXACTLY):** Task 491 Avatar — `src/stories/mantine/primitives/Avatar.stories.tsx` + `Sprint_37_kickoff_prompt_Task_491_Avatar.md`; Task 487 Card; Task 486 Badge.

## Hard contract (P0 — verified against the diff on return; see `docs/agent-contract.md` clauses 1–15)
- Do NOT change scope. Phase-1 = theme defaults + ONE proof story only. **NO product-surface edits** (no `src/components/**`, no `src/app/**`, no patterns, no Tabs consumers).
- Do NOT invent architecture. If anything is ambiguous → **STOP and ASK the orchestrator**, do not guess. In particular: if a §6c value cannot be matched without a raw-value hack, or if `theme.components.Tabs` would need `styles` overrides beyond `defaultProps`, STOP and ASK before inventing.
- Do NOT remove/alter existing Tabs consumer behavior (switching, panels, keyboard/aria). Only add/adjust `theme.components.Tabs` defaults + the new story.
- Execute the AC literally. Self-validate BEFORE claiming complete (tsc=0, AC-by-AC table, read-back every written file).
- Update `docs/backlog.md` + add a session log under `docs/sessions/` with a **Files Changed** table. **Do NOT run git** (single-writer; the orchestrator emits commits).

## Pre-read (rule-index: UI/layout/component task — load ONLY these)
**Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this task touches NO registry flow; confirm and state so).
**Required:** `docs/mantine-responsive-design-system.md` (§7 mobile gate incl. §7 `useMediaQuery`/responsive caveat, §8 Mantine Storybook proof rules, §12 patterns, §13 rebuild plan, §16 acceptance gates) ← **FIRST READ**; `docs/ui-rules.md`; `docs/component-rules.md`; `docs/qa-rules.md`.
**This task specifically:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md` (§ Task 489 + Shared DoD); `docs/tailadmin-style-reference.md` §6c; `src/stories/mantine/primitives/Avatar.stories.tsx` + `Badge.stories.tsx` (proof-path templates); `src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx` (precedent for the documented `useMediaQuery`/`useMatches` SSR-hydration caveat).

## Required values (TailAdmin §6c — copy EXACTLY, zero invented values)
- **Color:** `color="brand"` — active tab = brand (`#EC5447` via `primaryColor`), inactive = `gray.5` (#667085).
- **Tab label text:** theme-`sm` (14px), `fw=500`. Inactive `gray.5`, hover `gray.7`; active brand.
- **NOT stretched on desktop:** `Tabs.List` is **compact, left-aligned at ≥640**. **Full-width only `<640`** via `grow` — the consumer (here, the story) passes `grow` responsively. **`grow` unconditionally (always-on) is the stretched-tabs bug — forbidden.**
- **Variant:** Mantine default underline variant (active brand bottom indicator) is acceptable; this is the generic content-Tabs primitive. NOTE per §6c: the *All-users/Verified-agents* switch and *role/status filters* are **SegmentedControl**, NOT Tabs — that is **Task 490**, out of scope here. Do not turn this into a segmented toggle.
- **Theme default to ADD/VERIFY:** `theme.components.Tabs = { defaultProps: { color: 'brand' } }`.
  - **First verify** Mantine's out-of-the-box Tabs rendering against the four values above (color/active/inactive/size). Mantine's `color` already follows `primaryColor` (brand), so `color: 'brand'` may be **redundant/no-op** — if so, still add it **for explicit single-source self-documentation** (harmless) and say so in the session log, OR, if you judge it pure noise, document why you omitted it. Either is acceptable; **do not silently leave the decision unexplained.**
  - For any value that Mantine's default does NOT already match (e.g. inactive color ≠ `gray.5`, label size ≠ 14/`fw500`), align it via `theme.components.Tabs` `styles`/`defaultProps` using **theme tokens only** (no raw hex/px). If alignment needs more than a trivial `styles` block, STOP and ASK.

## Current state to verify & preserve
`src/design-system/mantine/theme.ts` currently has **NO** `components.Tabs` entry (confirm). This task may ADD one (see above). This is the ONLY theme change expected.
- Do NOT add a fixed width, raw color, or shadow.
- No existing Tabs consumers may change behavior; this is theme-default + story only.

## Story to create — `src/stories/mantine/primitives/Tabs.stories.tsx`
Copy the Avatar/Badge proof-path EXACTLY:
- `title: 'Mantine/Primitives/Tabs'`, single export **`Default`** only (no per-viewport/per-locale/Pass/Fail exports — forbidden by §8/§13/§16).
- `parameters: { skipCanvas: true, layout: 'fullscreen' }`.
- Locale via `context.globals.locale`; labels via `storyT(locale, key)` from `'../../_storyI18n'`.
- Modest padded canvas: outer `Box p="xl"` (Sprint 37 DoD §6 — NOT edge-glued; same as Avatar/Badge).
- All user-facing tab labels + panel text via `storyT()`. Thin dev section-labels (e.g. `default / responsive grow`) are acceptable as minimal non-content annotations only.

**Responsive `grow` (the core proof of this task):** the story is the "consumer" and computes `grow` from the viewport using the **Mantine-native responsive API** — `const grow = useMatches({ base: true, sm: false })` (full-width below `sm`/640, compact at ≥640). `useMatches`/`useMediaQuery` returns the SSR/first-render value (`base`/`false`) before hydration — **document this caveat in a code comment + the session log**, citing the `MantineDialogDrawerPattern` precedent. (Tabs are inline content, not an overlay, so there is no flash concern.) Do NOT hardcode a Tailwind `sm:` class; do NOT pass `grow` unconditionally.

Sections (each a labeled group, stacked in a `Stack`):
1. **Default tabs** — a `Tabs defaultValue=<first>` with **3** `Tabs.Tab` (labels via `t()`) + matching `Tabs.Panel` (short panel text via `t()`). `Tabs.List grow={grow}` (responsive per above), `color="brand"`. Proves: active brand indicator, inactive gray-5, 14px/`fw500`, compact-left ≥640, full-width <640.
2. **Long-label stress** — the same Tabs but using the long-uk tab label set (see i18n) to prove wrap/no-clip at 320. (May be the same Tabs block if section 1's labels already include the long uk one — your call; if you reuse one block, say so and ensure the long label is present.)

Keep it minimal and legible — this is a primitive proof, not a feature.

### i18n keys (namespace `storybook.mantine.*`, ALL 4 locales sq/en/uk/it — same key set)
First check whether equivalent tab-label keys already exist under `storybook.mantine` and **reuse** them (say which). If not, add a 3-tab set with locale-NATIVE labels, at least ONE of which is long in uk to exercise wrap at 320:
- `tabs_demo_tab_overview` — en "Overview" · uk "Огляд" · sq "Përmbledhje" · it "Panoramica"
- `tabs_demo_tab_details` — en "Details" · uk "Деталі" · sq "Detajet" · it "Dettagli"
- `tabs_demo_tab_activity` — en "Activity log" · uk "Журнал активності" (deliberately long) · sq "Regjistri i aktivitetit" · it "Registro attività"
- `tabs_demo_panel_text` — a short neutral sentence per locale (e.g. en "Panel content for the selected tab.").
Maintain exact key parity across all four files; `check:i18n` must stay green with matched counts. If a needed string already exists, REUSE it and note the reuse instead of duplicating.

## Positive flow (happy path)
1. Open Storybook → `Mantine/Primitives/Tabs → Default`, locale=en, viewport ≥768.
2. `Tabs.List` renders **compact and left-aligned** (NOT stretched full-width); active tab shows the **brand** indicator/text, inactive tabs are **gray-5**, labels are **14px `fw500`**.
3. Click each tab → the corresponding `Tabs.Panel` shows; keyboard arrow-key + Home/End navigation and `aria-selected`/`role="tab"` semantics work (Mantine built-in — verify not broken).
4. Resize the toolbar to **<640** (320/375/480) → `Tabs.List` becomes **full-width** (`grow`), tabs split the row evenly, still legible.
5. Switch locale (en→uk→sq→it via toolbar): tab labels + panel text update from `storyT()`; uk renders Cyrillic; no missing-key/raw-key leak.
6. Side-by-side vs `demo_tailadmin_com.zip` §6c: brand active, gray inactive, compact-left on desktop, no underline-chip invention.

## Negative flow (every off-happy-path branch)
- **Long uk tab label** ("Журнал активності") at **320**: label **wraps** (`whitespace-normal`, no clip) and causes **no horizontal scroll**; the tab row stays within the canvas.
- **`grow` boundary:** at exactly ≥640 the list is compact-left (NOT stretched); just below 640 it is full-width — verify the flip happens at the `sm` (40em) boundary, not elsewhere.
- **Keyboard/aria intact:** arrow-key navigation still moves focus and selection; no regression vs Mantine default.
- **Missing/unknown locale:** `storyT` falls back to `en` (no crash, no raw key shown).
- **SSR/first render:** `useMatches`/`useMediaQuery` returns `base`/`false` pre-hydration → desktop-compact on first paint, resolves to full-width after hydration on mobile. No overlay/flash concern (inline content). Documented.

## 🔴 Mobile <640 gate (OWNER P0 — MANDATORY) — Tabs IS a control, NOT exempt
- Below 640 the `Tabs.List` **MUST be full-width** (via the responsive `grow`), tabs ≥44px tall touch targets, labels wrap (sq/en/uk/it), **no clip, no horizontal scroll at 320**.
- At ≥640 the list is **compact, left-aligned** (content-width) — proven NOT stretched. `grow` unconditional is a TASK FAILURE.
- There is **no compact-exemption** for Tabs (unlike Avatar). Every textual/container surface here stays full-width + wrapping <640.
- Touch target: each tab control ≥44px high. If Mantine's default tab height is <44px at the chosen size, raise it via theme `styles.tab` `mih="2.75rem"` (the only raw-value exemption) and document it.

## 🔴 Rendered proof (clauses 12–13 + Sprint 37 DoD §3 — machine-produced is the canonical gate)
- After writing the story, **rebuild Storybook so the new story is in the build**, then run the assert harness and paste the result into the session log:
  ```
  npm run build-storybook
  npm run screenshots:assert
  ```
  (Full run — NOT `--fast` — Sprint 37 DoD §3 requires the **480** cells, which fast mode skips.)
- Required matrix cells, each PASS with concrete evidence (compact-left ≥640? full-width <640? brand active / gray inactive? 14px fw500? long-uk label wraps? no clip? no h-scroll@320? grow flips at 640?): **320 / 375 / 480 × en/uk + sq@320 + it@320 + a ≥640 cell (768) to prove not-stretched**, with **uk@320/375/390 mandatory** stress cells.
- If the harness cannot capture the freshly-added story in this environment, say so explicitly and attach the per-cell evidence you DID capture; the orchestrator/owner does the manual Storybook toolbar matrix + side-by-side at review (as for Tasks 486/487/491, per `mantine-responsive-design-system.md` §13.10 owner-reviewed toolbar proof). "tsc=0/build green" is NOT rendered proof and never closes the task.

## Gates (all must pass; paste transcript into the session log)
`tsc --noEmit` = 0 · `npm run check:i18n` (matched key counts ×4) · `npm run check:stories` (0 violations) · `npm run check:design-tokens` (0 violations). Zero hardcode: no raw hex/rgb/named colors (use `color="brand"`/`gray.5` tokens), no raw spacing/radius px (theme tokens only; `mih="2.75rem"` is the only exemption), no raw user-facing strings, no raw `<button>`/Tailwind `sm:` responsive class.

## Acceptance criteria (each maps to a flow + is verifiable in the diff/render)
1. `theme.ts` `components.Tabs` decision implemented and **documented**: either `{ defaultProps: { color: 'brand' } }` added (incl. note if redundant-but-explicit), or omitted-with-reason; any non-default §6c value (inactive gray-5, 14px/fw500) aligned via theme tokens only. → Positive flow 2.
2. New `src/stories/mantine/primitives/Tabs.stories.tsx` exists: single `Default`, `skipCanvas:true`+`layout:'fullscreen'`, `Box p="xl"` canvas, 3 tabs + panels, responsive `grow` via `useMatches({base:true, sm:false})` with the SSR caveat documented. → Positive flow 1,3,4.
3. Tab labels + panel text via `storyT()`; new/reused `storybook.mantine.*` keys present in all 4 locales with parity; uk Cyrillic + the long-uk label present. → Positive flow 5.
4. Negative-flow branches present + provable: long-uk wrap/no-clip@320, grow flips at 640 (compact ≥640 / full-width <640), keyboard/aria intact, locale fallback. → Negative flow.
5. **Mobile gate:** full-width `<640`, compact-left `≥640` (NOT stretched), ≥44px tab touch targets, labels wrap, no h-scroll@320. → Mobile gate.
6. Rendered matrix (320/375/480 × en/uk + sq/it@320 + 768; uk@320/375/390) attached, or explicit manual-fallback note with captured evidence. → Rendered proof.
7. All gates green; zero hardcode; scope clean (no product-surface files touched). → Hard contract.
8. `docs/backlog.md` + session log under `docs/sessions/` updated; Files Changed table present; **no git commands emitted by the executor**.

## Files expected to change (the orchestrator cross-checks the real diff against this)
- `src/stories/mantine/primitives/Tabs.stories.tsx` (NEW).
- `src/design-system/mantine/theme.ts` (ADD/adjust `components.Tabs` per the documented decision — may be a small change or, if Mantine defaults already match and `color:'brand'` is omitted-with-reason, possibly story-only; state which).
- `messages/{en,sq,uk,it}.json` (new `tabs_demo_*` keys, unless an equivalent already exists — say which).
- `docs/backlog.md` + `docs/sessions/2026-06-25-task489-tabs-primitive.md`.
Anything else = scope creep → STOP and ASK.

## Run order context
Sprint 37: 486 Badge ✅ → 487 Card ✅ → 491 Avatar ✅ → **489 Tabs (this task)** → 490 SegmentedControl → 488 Table. After all 6 ✅, Task 485 REWORK2 reopens as the first Phase-4 surface proof. Task numbering — last used: 491; next free: 492 (this task reuses the already-reserved 489).
