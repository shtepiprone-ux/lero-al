# Kickoff — Task 488 — Table primitive (CRM card-wrapped, mobile→cards) → TailAdmin (Sprint 37, MM Phase 1, P1.10)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews the real diff + rendered story side-by-side with the TailAdmin archive).
> **Epic:** MM (Mantine UI migration). **Sprint:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md`.
> **Program/tracker:** `docs/mantine-tailadmin-migration-tracker.md`. **Reference (copy-source):** `docs/tailadmin-style-reference.md` §6b "Admin table (CRM card-wrapped)" + `demo_tailadmin_com.zip`.
> **Theme:** `src/design-system/mantine/theme.ts`. **Story path:** `src/stories/mantine/primitives/Table.stories.tsx`.
> **Precedent (copy the proof-path EXACTLY):** Task 490 SegmentedControl + Task 489 Tabs + Task 491 Avatar primitive stories; **canonical data-table source:** `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` + Task 485 admin-table composition.
> **This is the LAST Phase-1 primitive.** After 488 ✅, Task 485 REWORK2 reopens as the first Phase-4 surface proof (AdminUsersTable should need only composition).

## 🔴🔴 OWNER P0 — THE DEFINING RULE OF THIS TASK (do not soften, do not "scroll instead")
**Every data table converts to STACKED CARDS below `sm` (640px) — one card per row. Horizontal scrolling of table content on mobile is FORBIDDEN: not page-level, and not an internal `ScrollArea`/`overflow-x`. The mobile reader reads cards, never side-scrolls a table.** (Owner standing directive, restated 2026-06-25; now codified in `docs/mantine-responsive-design-system.md` §7 "P0 table gate".) At ≥`sm` the desktop §6b card-wrapped table is kept (a desktop-only `ScrollArea` inside the card is fine there). A data table left scrolling horizontally on mobile = TASK FAILURE, rejected on sight. This is table-specific and does NOT change the §7.1 rule that `SegmentedControl`/`Tabs` (controls, not tables) MAY swipe-scroll.

## Hard contract (P0 — verified against the diff on return; see `docs/agent-contract.md` clauses 1–15)
- Do NOT change scope. Phase-1 = `theme.components.Table` defaults + ONE proof story only. **NO product-surface edits** (no `src/components/**`, no `src/app/**`, no admin/listing tables).
- **🔴 Do NOT modify `src/design-system/mantine/patterns/MantineDataTableToCards.tsx`** (or any pattern file). The story **CONSUMES** it (configures `columns`/`rows`/`card`), it does not edit it. Its API and its mobile table→cards transform MUST stay untouched. If you believe a §6b value or the cards behavior can only be achieved by editing the pattern → **STOP and ASK the orchestrator.**
- Do NOT invent architecture. If a §6b value cannot be matched without a raw-value hack, or it needs a CSS selector beyond a trivial `theme.components.Table.styles` block (e.g. `[data-hover]`, `:hover`, striped-row selectors) → **STOP and ASK** (same boundary Tabs/SegmentedControl used to defer `[data-active]` selectors). Document any deferral.
- Do NOT remove/alter existing Table or DataTableToCards consumer behavior. Only ADD/adjust `theme.components.Table` defaults + the new story.
- Execute the AC literally. Self-validate BEFORE claiming complete (tsc=0, AC-by-AC table, read-back every written file per clause 14).
- Update `docs/backlog.md` + add a session log under `docs/sessions/` with a **Files Changed** table. **Do NOT run git** (single-writer; the orchestrator emits commits).

## Pre-read (rule-index: UI/layout/component task — load ONLY these)
**Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this task touches NO registry flow; confirm and state so).
**Required:** `docs/mantine-responsive-design-system.md` (§6.1 TailAdmin token map incl. Table row, **§7 "P0 table gate" — THE rule for this task**, §7.1 spacing rhythm + Table `verticalSpacing`/`horizontalSpacing`, §7.2 admin data-card anatomy [the mobile card design], §8 + §8.1 Mantine Storybook proof rules + page-gutter, §16 acceptance gates) ← **FIRST READ**; `docs/ui-rules.md`; `docs/component-rules.md`; `docs/qa-rules.md`.
**This task specifically:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md` (§ Task 488 + Shared DoD); `docs/tailadmin-style-reference.md` §6b; `src/design-system/mantine/patterns/MantineDataTableToCards.tsx` (READ — confirm its `card` config + table→cards transform; do NOT edit); `src/stories/mantine/primitives/SegmentedControl.stories.tsx` + `Avatar.stories.tsx` (proof-path templates); the existing `Patterns/Mantine/DataTableToCards` story (reference for how rows/columns/card are wired).

## Required values (TailAdmin §6b — copy EXACTLY, zero invented values)
**Desktop (≥`sm`) card-wrapped table:**
- **Card wrapper:** `Paper` `radius="2xl"` (16) + **`gray-2` border** + `overflow="hidden"` (row borders clip to rounded corners).
- **Table:** `withRowBorders`; `--table-border-color: var(--mantine-color-gray-1)` (#f2f4f7).
- **Head:** `thead` `bg = gray-0` (#f9fafb) + border-y `gray-1`; **`Th` `size="xs"` (12px) `fw=500` `c="gray.5"` (#667085), NOT uppercase** (`textTransform: 'none'`).
- **Body:** `Td` text **14px (theme-`sm`)** `c="gray.7"` (#344054), **`whiteSpace: 'nowrap'`** (desktop only — on mobile there are no table cells, there are cards).
- **Rhythm:** `verticalSpacing="sm"` (12) + `horizontalSpacing="xl"` (24) = CRM `px-6 py-3`. (Already in theme defaults — VERIFY.)
- **Row hover:** background `gray-0` (`highlightOnHover` already true — verify; if it needs `[data-hover]`/CSS-var beyond a trivial styles block, defer + document).

**Mobile (<`sm`) cards** — render via `MantineDataTableToCards` `card` config per `docs/mantine-responsive-design-system.md` §7.2 anatomy (header id + actions, primary avatar/title/subtitle + status badge, meta rows `Group justify="space-between"`). No table cells, no horizontal scroll.

## Current state to verify & preserve
`src/design-system/mantine/theme.ts` ALREADY has `components.Table` (confirm at ~L237):
```ts
Table: {
  defaultProps: { striped: false, highlightOnHover: true, verticalSpacing: 'sm', horizontalSpacing: 'xl' },
},
```
EXTEND it to carry the remaining §6b chrome **via theme tokens only** (the executor verifies each against Mantine's actual default and only adds what is NOT already correct):
- `defaultProps.withRowBorders: true`.
- `styles.table: { '--table-border-color': 'var(--mantine-color-gray-1)' }`.
- `styles.thead: { backgroundColor: 'var(--mantine-color-gray-0)' }`.
- `styles.th: { fontSize: 'var(--mantine-font-size-xs)', fontWeight: 500, color: 'var(--mantine-color-gray-5)', textTransform: 'none' }`.
- `styles.td: { fontSize: 'var(--mantine-font-size-sm)', color: 'var(--mantine-color-gray-7)', whiteSpace: 'nowrap' }`.
For ANY value Mantine's default already matches, leave it out and SAY SO. Anything needing a selector beyond `table/thead/th/td/tr` trivial styles (hover/striping) → **STOP and ASK / defer-with-reason** (Tabs/Seg `[data-active]` precedent). No raw hex/px; `overflow`/`radius`/border live on the `Paper` wrapper (canonical Card/Paper chrome — reuse, do not re-declare), not as raw Table styles.

## Story to create — `src/stories/mantine/primitives/Table.stories.tsx`
> **First verify** a Table primitive story does NOT already exist at that path. If one exists → **STOP and ASK** (do not overwrite). The `Patterns/Mantine/DataTableToCards` *pattern* story is separate and must NOT be edited.

The story **CONSUMES `MantineDataTableToCards`** (it does not hand-roll a `<Table>` and it does not duplicate the pattern's logic — canonical-first, Task 426). This is the only way to prove BOTH halves of the gate in one story: the §6b desktop table AND the mandatory mobile cards.
- `title: 'Mantine/Primitives/Table'`, single export **`Default`** only (no per-viewport/per-locale/Pass/Fail exports — forbidden by §8/§13/§16).
- `parameters: { skipCanvas: true, layout: 'fullscreen' }`.
- Locale via `context.globals.locale`; all headers + word-cells via `storyT(locale, key)` from `'../../_storyI18n'`.
- Modest padded canvas: outer `Box p="xl"` (Sprint 37 DoD §6).
- Provide `MantineDataTableToCards` with **4 columns** (User / Role / Status / Registered) × **~4 rows** of representative admin data, **and a `card` config** (§7.2 anatomy: avatar + name/subtitle, status badge, role/date meta rows) so the mobile path renders the designed card — NOT a generic label dump.
- Status/role cell values via `storyT()` (reuse `seg_demo_*` where they fit); proper names/dates may be literal sample data (state this). Use the canonical `Badge` for the status cell and `Avatar` (40px) for the user cell — they're already styled by Tasks 486/491.

### i18n keys (namespace `storybook.mantine.*`, ALL 4 locales sq/en/uk/it — same key set)
First check whether equivalent header/role/status keys already exist under `storybook.mantine` (the `seg_demo_*` role/status set is likely reusable for the role/status cells) and **reuse** them (say which). For column headers, add a 4-header set with locale-NATIVE labels, at least ONE deliberately long in uk to exercise wrap (cards) / nowrap (desktop):
- `table_demo_col_user` — en "User" · uk "Користувач" · sq "Përdoruesi" · it "Utente"
- `table_demo_col_role` — en "Role" · uk "Роль" · sq "Roli" · it "Ruolo"
- `table_demo_col_status` — en "Status" · uk "Статус" · sq "Statusi" · it "Stato"
- `table_demo_col_registered` — en "Registered" · uk "Дата реєстрації" (deliberately long) · sq "Regjistruar" · it "Registrato"
Exact key parity across all four files; `check:i18n` stays green with matched counts. Reuse-and-note rather than duplicate where a string already exists.

## Positive flow (happy path)
1. Open Storybook → `Mantine/Primitives/Table → Default`, locale=en, viewport 1440 (desktop).
2. **Desktop table** renders inside a **rounded-16 `Paper` with a flat `gray-2` border + `overflow:hidden`** (no shadow); header row = `gray-0` bg, headers **12px `fw500` `gray.5`, NOT uppercase**, separated by a `gray-1` border; body rows = **14px `gray.7`** nowrap with `gray-1` dividers; cell padding reads as `px-6 py-3`; row hover → `gray-0`.
3. Resize to 1024 and 768 → still the §6b desktop table, legible.
4. **Resize to <640 (480/375/320) → the table TRANSFORMS into stacked cards** (one per row, §7.2 anatomy: avatar + name/subtitle, status badge, role/date meta rows). **No table is visible; nothing scrolls horizontally.**
5. Switch locale (en→uk→sq→it via toolbar): headers (desktop) + card fields (mobile) update from `storyT()`; uk renders Cyrillic; no missing-key/raw-key leak.
6. Side-by-side vs `demo_tailadmin_com.zip` §6b: desktop card-wrapped table (gray-0 head, gray-1 dividers, non-uppercase gray-5 headers, gray-7 body); mobile = clean stacked cards.

## Negative flow (every off-happy-path branch)
- **<640 mobile = cards, ZERO horizontal scroll** (page AND internal). Verify at **320** there is no side-scroll anywhere; the long uk header ("Дата реєстрації") becomes a card meta-row **label that wraps**, not a scrolling column.
- **Long cell on desktop (≥640):** stays `nowrap` inside the card-wrapped table; desktop-only `ScrollArea` within the `Paper` may engage (acceptable on desktop ONLY). This must NOT leak onto mobile.
- **0 rows:** the cards/table region shows an empty/`No data` label (use the pattern's empty path — do not rebuild it), NOT a header-only shell.
- **Missing/unknown locale:** `storyT` falls back to `en` (no crash, no raw key).
- **SSR/first render:** the table↔cards switch is driven by the pattern's responsive logic; it returns its SSR/base value pre-hydration — **document the caveat** in a code comment + session log (cite the `MantineDialogDrawerPattern`/`MantineDataTableToCards` precedent). Inline content, no flash concern.

## 🔴 Mobile <640 gate (OWNER P0 — see the defining rule at the top)
- Below 640: **stacked cards only, one per row, full-width edge-to-edge** (the `Box p="xl"` story gutter is the only inset). **NO horizontal scroll of any kind.** Cards follow §7.2 anatomy; ≥44px touch targets on any card action; all 4 locales (sq/en/uk/it) wrap, never clip, never overflow.
- At ≥640: the §6b card-wrapped desktop table (desktop-only internal `ScrollArea` acceptable).
- The table→cards transform is the canonical `MantineDataTableToCards` behavior — **consume it, do not re-implement or regress it.**

## 🔴 Rendered proof (clauses 12–13 + Sprint 37 DoD §3 — machine-produced is the canonical gate)
- After writing the story, **rebuild Storybook** so the new story is in the build, then run the assert harness and paste the result into the session log:
  ```
  npm run build-storybook
  npm run screenshots:assert
  ```
  (Full run — NOT `--fast` — Sprint 37 DoD §3 requires the **480** cells.)
- Required matrix cells, each PASS with concrete evidence:
  - **Desktop (table surface): 768 / 1024 / 1440 × en/uk** — card-wrapped §6b table? gray-0 head / gray-5 non-uppercase 12px headers? gray-7 14px nowrap cells? gray-1 dividers? 24×12 rhythm? hover gray-0?
  - **Mobile (cards): 320 / 375 / 480 × en/uk + sq@320 + it@320**, **uk@320/375/390 mandatory** — renders as STACKED CARDS (no table)? **ZERO horizontal scroll (page + internal)?** §7.2 card anatomy intact? long-uk label wraps in its meta row?
- If the harness cannot capture the freshly-added story here, say so explicitly and attach the per-cell evidence you DID capture; the orchestrator/owner does the manual Storybook toolbar matrix + side-by-side at review (as for Tasks 486/487/489/490/491, per §13.10). "tsc=0/build green" is NOT rendered proof.

## Gates (all must pass; paste transcript into the session log)
`tsc --noEmit` = 0 · `npm run check:i18n` (matched key counts ×4) · `npm run check:stories` (0 violations) · `npm run check:design-tokens` (0 violations). Zero hardcode: no raw hex/rgb/named colors (use `gray.0/1/5/7`, `brand` tokens + `var(--mantine-color-*)`), no raw spacing/radius px (theme tokens only; §7.1 exemptions only), no raw user-facing strings, no raw `<table>/<th>/<td>` HTML (Mantine `Table.*` via the pattern), no Tailwind `sm:` responsive class.

## Acceptance criteria (each maps to a flow + is verifiable in the diff/render)
1. `theme.components.Table` extended to carry §6b desktop chrome via theme tokens only (withRowBorders + border-color gray-1 + thead gray-0 + Th xs/fw500/gray.5/non-uppercase + Td sm/gray.7/nowrap), each addition justified against Mantine's default, any selector-level value (hover/striping) **deferred-with-reason**. No raw hex/px. → Positive flow 2.
2. New `src/stories/mantine/primitives/Table.stories.tsx` exists: single `Default`, `skipCanvas:true`+`layout:'fullscreen'`, `Box p="xl"` canvas, **consumes `MantineDataTableToCards`** (4 cols × ~4 rows + a §7.2 `card` config), Avatar + Badge cells. → Positive flow 1–4.
3. Headers + role/status cells via `storyT()`; new/reused `storybook.mantine.*` keys in all 4 locales with parity; uk Cyrillic + the long-uk header present. → Positive flow 5.
4. **🔴 Mobile = cards, ZERO horizontal scroll (page + internal) at <640**, proven in the rendered matrix at 320/375/390; §7.2 card anatomy intact; long-uk label wraps. → Mobile gate / Negative flow.
5. Desktop ≥640 = §6b card-wrapped table (desktop-only internal ScrollArea acceptable, never leaking to mobile). → Positive flow 2–3.
6. Rendered matrix (desktop 768/1024/1440 × en/uk + mobile 320/375/480 × en/uk + sq/it@320; uk@320/375/390) attached, or explicit manual-fallback note with captured evidence. → Rendered proof.
7. All gates green; zero hardcode; scope clean — **`MantineDataTableToCards.tsx` and all pattern/product-surface files untouched** (confirm in diff). → Hard contract.
8. `docs/backlog.md` + session log `docs/sessions/2026-06-25-task488-table-primitive.md` updated; Files Changed table present; **no git commands emitted by the executor**.

## Files expected to change (the orchestrator cross-checks the real diff against this)
- `src/stories/mantine/primitives/Table.stories.tsx` (NEW — consumes `MantineDataTableToCards`).
- `src/design-system/mantine/theme.ts` (EXTEND `components.Table` per the documented §6b decision).
- `messages/{en,sq,uk,it}.json` (new `table_demo_col_*` keys, unless an equivalent already exists — say which; reuse `seg_demo_*` for role/status cells if applicable).
- `docs/backlog.md` + `docs/sessions/2026-06-25-task488-table-primitive.md`.
Anything else — especially `MantineDataTableToCards.tsx` or any `src/components/**` / `src/app/**` — = scope creep → STOP and ASK.

## Run order context
Sprint 37 Phase-1 Batch A: 486 Badge ✅ → 487 Card ✅ → 491 Avatar ✅ → 489 Tabs ✅ (`0bfa564b8`) → 490 SegmentedControl ✅ (`dbf5393e6`) → **488 Table (this task — LAST primitive)**. After 488 ✅, reopen **Task 485 REWORK2** as the first Phase-4 surface proof. Task numbering — last used: 491; next free: 492 (this task reuses the already-reserved 488).
