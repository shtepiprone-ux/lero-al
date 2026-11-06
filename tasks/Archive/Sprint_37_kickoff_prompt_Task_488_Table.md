# Kickoff — Task 488 — Table PRIMITIVE → TailAdmin §6b (Sprint 37, MM Phase 1, P1.10)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews the real diff + rendered story side-by-side with the TailAdmin archive).
> **Epic:** MM (Mantine UI migration). **Sprint:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md`. **Tracker:** `docs/mantine-tailadmin-migration-tracker.md`.
> **Reference (copy-source):** `docs/tailadmin-style-reference.md` §6b "Admin table (CRM card-wrapped)" + `demo_tailadmin_com.zip`.
> **Theme:** `src/design-system/mantine/theme.ts`. **Pattern component (CONSUMED, never edited):** `src/design-system/mantine/patterns/MantineDataTableToCards.tsx`.
> **This is the LAST Phase-1 primitive.** 486 Badge ✅ · 487 Card ✅ · 491 Avatar ✅ · 489 Tabs ✅ · 490 SegmentedControl ✅ · **488 Table = this task.**

## What this task IS (one sentence)
Style the **Table primitive** to TailAdmin §6b via `theme.components.Table`, and prove it with **one primitive story `Mantine/Primitives/Table`** — created by **moving the existing `Patterns/Mantine/DataTableToCards` story into the primitives group** (the table demo becomes the Table primitive). Same shape as the five sibling primitives.

## 🔴🔴 OWNER P0 — non-negotiable
1. **Correct TailAdmin §6b styles.** Every value below is copied EXACTLY from §6b — zero invented colors/px.
2. **Tables → CARDS below `sm` (640px), one card per row. NO horizontal scroll on mobile — not page-level, not internal `ScrollArea`/`overflow-x`.** (Codified: `docs/mantine-responsive-design-system.md` §7 "P0 table gate".) Desktop ≥`sm` keeps the §6b card-wrapped table (desktop-only internal `ScrollArea` is fine there). A table that side-scrolls on mobile = TASK FAILURE.

## Hard contract (P0 — verified against the diff on return; `docs/agent-contract.md` clauses 1–15)
- Do NOT change scope. Phase-1 = `theme.components.Table` §6b defaults + the ONE primitive story. **NO product-surface edits** (no `src/components/**`, no `src/app/**`).
- **🔴 Do NOT modify `MantineDataTableToCards.tsx`** (or any pattern *component*). The story CONSUMES it (configures `columns`/`rows`/`card`). If a §6b value or the cards behavior seems to need a pattern-component edit → **STOP and ASK.**
- Do NOT invent architecture. If a §6b value can't be matched without a raw-value hack, or it needs a CSS selector beyond a trivial `theme.components.Table.styles` block (`[data-hover]`, `:hover`, striping) → **STOP and ASK / defer-with-reason** (the Tabs/SegmentedControl `[data-active]` precedent).
- Self-validate BEFORE claiming complete (tsc=0, AC-by-AC table, read-back every written file per clause 14). Update `docs/backlog.md` + a session log under `docs/sessions/` with a **Files Changed** table. **Do NOT run git** (orchestrator emits commits).

## Pre-read (rule-index: UI/layout/component task — load ONLY these)
**Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — touches NO registry flow; confirm).
**Required:** `docs/mantine-responsive-design-system.md` (§6.1 token map incl. Table row, **§7 "P0 table gate"**, §7.1 spacing rhythm, §7.2 admin data-card anatomy [the mobile card design], §8 + §8.1 Storybook proof rules) ← **FIRST READ**; `docs/ui-rules.md`; `docs/component-rules.md`; `docs/qa-rules.md`.
**This task:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md` (§ Task 488 + Shared DoD); `docs/tailadmin-style-reference.md` §6b; `MantineDataTableToCards.tsx` (READ — `CardConfig` + table→cards transform; do NOT edit); the CURRENT `src/stories/patterns/mantine/DataTableToCards.stories.tsx` (the content you are moving); a sibling primitive story e.g. `src/stories/mantine/primitives/SegmentedControl.stories.tsx` (proof-path template).

## Correct §6b styles — `theme.components.Table` (the heart of this task)
`components.Table` ALREADY exists (~L237: `{ defaultProps: { striped:false, highlightOnHover:true, verticalSpacing:'sm', horizontalSpacing:'xl' } }`). EXTEND it to the full §6b chrome **via theme tokens only** — verify each against Mantine's default, add only what is not already correct, justify each in the session log:
- `defaultProps.withRowBorders: true` — row dividers ON.
- `styles.table: { '--table-border-color': 'var(--mantine-color-gray-1)' }` — dividers = gray-1 (#f2f4f7).
- `styles.thead: { backgroundColor: 'var(--mantine-color-gray-0)' }` — head bg = gray-0 (#f9fafb).
- `styles.th: { fontSize: 'var(--mantine-font-size-xs)', fontWeight: 500, color: 'var(--mantine-color-gray-5)', textTransform: 'none' }` — 12px, fw500, gray-5 (#667085), **NOT uppercase**.
- `styles.td: { fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-gray-7)', whiteSpace: 'nowrap' }` — 14px, gray-7 (#344054), nowrap (desktop).
- Rhythm `verticalSpacing="sm"` (12) + `horizontalSpacing="xl"` (24) = CRM `px-6 py-3` — already present, VERIFY.
- Row hover bg = gray-0 (`highlightOnHover` already true — verify; if it needs a selector beyond trivial styles, defer-with-reason).
The card wrapper (`Paper radius="2xl"` + `gray-2` border + `overflow:hidden`, no shadow) comes from the canonical Card/Paper chrome — **reuse it, do not re-declare a raw border/radius** (canonical-first, Task 426). No raw hex/px anywhere.

## Story — MOVE the existing demo into the primitives group
**Create** `src/stories/mantine/primitives/Table.stories.tsx` and **delete** `src/stories/patterns/mantine/DataTableToCards.stories.tsx` (its content moves here — this is the "replace the existing story" the owner asked for; ONE table story, in the primitives set).
- `title: 'Mantine/Primitives/Table'`, single `Default` export, `parameters: { skipCanvas:true, layout:'fullscreen' }`, and keep the existing **§8.1 responsive page gutter** `Box px={{ base: 'md', sm: 'xl' }} py="md"` (tracker DoD §3: canonical gutter, NOT full-bleed — full-bleed is bottom-sheet only).
- It **CONSUMES `MantineDataTableToCards`** with `columns`/`rows`/`card`/`emptyLabel` — keep the existing demo's structure (4-ish cols: User / Role / Status / Date; ~3–4 rows; the §7.2 `card` config for mobile). This is the only way to render the §6b table on desktop AND the mandatory cards on mobile; do NOT hand-roll a raw `<Table>` and do NOT duplicate the pattern's logic.
- **If deleting the pattern's only story makes `check:stories` flag the `MantineDataTableToCards` pattern as story-less, STOP and ASK** (do not invent a stub) — otherwise proceed with the move.

**Required fixes carried over from the current demo (verified in the diff):**
1. **Off-palette role badge:** the `meta` role value renders `<Badge color="blue" …>`. `blue` is NOT in the palette (gray/green/yellow/red/brand) → use a token color (`gray` or `brand`; state which). Required to keep `check:design-tokens` honest.
2. **Avatar radius:** card avatar uses `radius="xl"`; §6b/Task 491 standard is **pill** (circular) → `radius="pill"` (or inherit theme default) + `size={40}`.
3. **Long-uk stress:** ensure one header/meta label is deliberately long in uk (e.g. "Дата реєстрації") to prove wrap (mobile card) / nowrap (desktop) with no clip at 320.
4. Confirm `STATUS_COLOR` map is on-palette (green/yellow/gray — OK; no `blue`).
All visible strings via `storyT()`; reuse the existing `storybook.mantine.admin_table_col_*` / `admin_status_*` / `empty_title` keys (confirm 4-locale parity); add a key ONLY for a new long-uk label if none fits.

## Positive flow
1. `Mantine/Primitives/Table → Default`, en, 1440: §6b card-wrapped table — rounded-16 gray-2-bordered `Paper`, gray-0 head, **12px fw500 gray-5 non-uppercase** headers, gray-1 head border + row dividers, **14px gray-7 nowrap** cells, 24×12 rhythm, row hover gray-0, no shadow.
2. 1024 / 768: still the §6b table.
3. **<640 (480/375/320): TRANSFORMS to stacked cards** (§7.2 anatomy: avatar + name/subtitle, status badge, role/date meta). **No table; nothing scrolls horizontally.**
4. Locale en→uk→sq→it: headers (desktop) + card fields (mobile) update via `storyT()`; uk Cyrillic; no raw-key leak.
5. Side-by-side vs §6b archive: desktop table matches; mobile clean cards; on-palette role badge; circular avatar.

## Negative flow
- **<640 = cards, ZERO horizontal scroll** (page + internal), verified at 320; long-uk label wraps in its card meta row, never a scrolling column.
- **Long cell desktop (≥640):** nowrap inside the card; desktop-only internal `ScrollArea` may engage (acceptable desktop ONLY; must not leak to mobile).
- **0 rows:** `emptyLabel` (`empty_title`) shows — not a header-only shell (pattern's empty path; don't rebuild it).
- **Missing/unknown locale:** `storyT` → `en` fallback (no crash, no raw key).
- **SSR/first render:** table↔cards switch returns the pattern's SSR/base value pre-hydration — document the caveat (comment + log). Inline content, no flash.

## 🔴 Mobile <640 gate (OWNER P0)
Cards only, one per row, full-width edge-to-edge (Box gutter aside); **NO horizontal scroll of any kind**; §7.2 anatomy; ≥44px card-action touch targets; all 4 locales wrap, never clip/overflow. ≥640 = §6b table. Transform = canonical `MantineDataTableToCards` — consume, never regress.

## 🔴 Rendered proof (clauses 12–13 + DoD §3 — machine-produced)
Rebuild Storybook, run, paste into the session log:
```
npm run build-storybook
npm run screenshots:assert
```
(Full run — NOT `--fast` — DoD §3 needs the 480 cells.) Required cells, each PASS with concrete evidence:
- **Desktop 768 / 1024 / 1440 × en/uk:** card-wrapped §6b table? gray-0 head / gray-5 non-uppercase 12px headers? gray-7 14px nowrap cells? gray-1 dividers? 24×12? hover gray-0?
- **Mobile 320 / 375 / 480 × en/uk + sq@320 + it@320 (uk@320/375/390 mandatory):** STACKED CARDS (no table)? **ZERO horizontal scroll (page + internal)?** §7.2 anatomy? long-uk wraps? on-palette badge? circular avatar?
If the harness can't capture the moved story here, say so + attach what you captured; orchestrator/owner does the manual toolbar matrix at review (§13.10). "tsc=0/build green" is NOT rendered proof.

## Gates (paste transcript into the session log)
`tsc --noEmit` = 0 · `check:i18n` (matched ×4) · `check:stories` (0 violations) · `check:design-tokens` (0 violations — the `color="blue"` fix is required). Zero hardcode: tokens only (`gray.0/1/5/7`, `green/yellow/red/brand`, `var(--mantine-color-*)`), §7.1 spacing exemptions only, no raw strings, no raw `<table>/<th>/<td>`, no Tailwind `sm:` class.

## Acceptance criteria (each maps to a flow + verifiable in diff/render)
1. `theme.components.Table` carries the full §6b chrome via tokens only (withRowBorders + gray-1 dividers + gray-0 thead + gray-5/12px/fw500/non-uppercase Th + gray-7/14px/nowrap Td), each addition justified vs Mantine default, selector-level values deferred-with-reason. No raw hex/px. → Positive 1.
2. `src/stories/mantine/primitives/Table.stories.tsx` created (title `Mantine/Primitives/Table`, single Default, consumes `MantineDataTableToCards`) AND `src/stories/patterns/mantine/DataTableToCards.stories.tsx` deleted (story moved) — unless `check:stories` flags pattern coverage, in which case STOP and ASK. → Positive 1–3.
3. The 4 demo fixes applied (role badge on-palette, avatar pill, long-uk stress, status map confirmed); strings via `storyT()`; reused/added keys at 4-locale parity; uk Cyrillic + long-uk present. → Positive 4.
4. **🔴 Mobile = cards, ZERO horizontal scroll (page + internal) at <640**, proven 320/375/390; §7.2 anatomy intact; long-uk wraps. → Mobile gate / Negative.
5. Desktop ≥640 = §6b card-wrapped table (desktop-only internal ScrollArea acceptable, never leaking to mobile). → Positive 1–2.
6. Rendered matrix (desktop 768/1024/1440 × en/uk + mobile 320/375/480 × en/uk + sq/it@320; uk@320/375/390) attached, or explicit manual-fallback note. → Rendered proof.
7. Gates green; zero hardcode; scope clean — `MantineDataTableToCards.tsx` and all product-surface files untouched (confirm in diff). → Hard contract.
8. `docs/backlog.md` + `docs/sessions/2026-06-25-task488-table-primitive.md` updated; Files Changed table present; no git commands emitted by the executor.

## Files expected to change
- `src/stories/mantine/primitives/Table.stories.tsx` (NEW — primitive, consumes the pattern).
- `src/stories/patterns/mantine/DataTableToCards.stories.tsx` (DELETED — content moved to the primitive; STOP and ASK if this breaks `check:stories` pattern coverage).
- `src/design-system/mantine/theme.ts` (EXTEND `components.Table` to §6b).
- `messages/{en,sq,uk,it}.json` (ONLY if a new long-uk key is added; otherwise reuse existing keys — no change).
- `docs/backlog.md` + `docs/sessions/2026-06-25-task488-table-primitive.md`.
Anything else — `MantineDataTableToCards.tsx`, any `src/components/**` / `src/app/**` — = scope creep → STOP and ASK.

## Run order context
486 Badge ✅ → 487 Card ✅ → 491 Avatar ✅ → 489 Tabs ✅ (`0bfa564b8`) → 490 SegmentedControl ✅ (`dbf5393e6`) → **488 Table (this task — LAST primitive)**. After 488 ✅, reopen Task 485 REWORK2 as the first Phase-4 surface proof. Task numbering — last used: 491; next free: 492.
