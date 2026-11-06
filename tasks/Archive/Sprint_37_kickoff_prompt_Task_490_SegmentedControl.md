# Kickoff — Task 490 — SegmentedControl primitive → TailAdmin (Sprint 37, MM Phase 1, P1.12)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews the real diff + rendered story side-by-side with the TailAdmin archive).
> **Epic:** MM (Mantine UI migration). **Sprint:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md`.
> **Program/tracker:** `docs/mantine-tailadmin-migration-tracker.md`. **Reference (copy-source):** `docs/tailadmin-style-reference.md` §6c "Tabs, segmented filters" + `demo_tailadmin_com.zip`.
> **Theme:** `src/design-system/mantine/theme.ts`. **Story path:** `src/stories/mantine/primitives/SegmentedControl.stories.tsx`.
> **Precedent (copy the proof-path + the mobile-scroll pattern EXACTLY):** Task 489 Tabs — `src/stories/mantine/primitives/Tabs.stories.tsx` + `Sprint_37_kickoff_prompt_Task_489_Tabs.md` (the **ScrollArea swipe-scroll** mobile pattern below is the one the owner approved on 489); Task 491 Avatar; Task 487 Card; Task 486 Badge.

## 🔴 Owner decision baked in (2026-06-25) — DO NOT re-litigate
The owner **chose the Tabs-489 mobile pattern for this control**: at `<640` the SegmentedControl stays a **single horizontal row** and **swipe-scrolls** on overflow (invisible scrollbar) — it is **NOT** `fullWidth`-stretched, **NOT** wrapped to a second line, **NOT** compressed/truncated. This mirrors the approved Task 489 Tabs rework. The `fullWidth`/`grow` and the wrap approaches are **forbidden** here (same as they were rejected on Tabs). See "Mobile <640 gate" below.

## Hard contract (P0 — verified against the diff on return; see `docs/agent-contract.md` clauses 1–15)
- Do NOT change scope. Phase-1 = theme defaults + ONE proof story only. **NO product-surface edits** (no `src/components/**`, no `src/app/**`, no patterns, no filter/SegmentedControl consumers).
- Do NOT invent architecture. If anything is ambiguous → **STOP and ASK the orchestrator**, do not guess. In particular: if a §6c value cannot be matched without a raw-value hack, or if `theme.components.SegmentedControl` would need `styles` overrides beyond a trivial block, STOP and ASK before inventing.
- Do NOT remove/alter existing SegmentedControl consumer behavior (single-select, keyboard/aria). Only add/adjust `theme.components.SegmentedControl` defaults + the new story.
- Execute the AC literally. Self-validate BEFORE claiming complete (tsc=0, AC-by-AC table, read-back every written file per clause 14).
- Update `docs/backlog.md` + add a session log under `docs/sessions/` with a **Files Changed** table. **Do NOT run git** (single-writer; the orchestrator emits commits).

## Pre-read (rule-index: UI/layout/component task — load ONLY these)
**Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this task touches NO registry flow; confirm and state so).
**Required:** `docs/mantine-responsive-design-system.md` (§7 mobile gate, §8 Mantine Storybook proof rules, §12 patterns, §13 rebuild plan, §16 acceptance gates) ← **FIRST READ**; `docs/ui-rules.md`; `docs/component-rules.md`; `docs/qa-rules.md`.
**This task specifically:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md` (§ Task 490 + Shared DoD); `docs/tailadmin-style-reference.md` §6c (SegmentedControl block, lines ~97–104); `src/stories/mantine/primitives/Tabs.stories.tsx` (the **ScrollArea swipe-scroll** mobile pattern to copy) + `Avatar.stories.tsx`/`Badge.stories.tsx` (proof-path templates).

## Required values (TailAdmin §6c — copy EXACTLY, zero invented values)
TailAdmin segment toggle (`docs/tailadmin-style-reference.md` §6c):
- **Track / container:** gray-100 background (`bg-gray-100` → theme `gray.1` #f2f4f7), `border` gray-200 (`gray.2` #e4e7ec), `p-1`, `gap-1`, `rounded-lg`. **Content-width on desktop (NOT stretched).**
- **Item base (inactive):** `rounded-md`, `px-3 py-2`, text **theme-`sm` (14px)**, `fw=500`, text **gray-500 (`gray.5` #667085)**, hover **gray-700 (`gray.7`)**.
- **Item active (selected pill):** `bg-white`, text **gray-900 (`gray.9` #101828)**, `shadow-theme-xs` (≈ `0 1px 2px 0 rgba(0,0,0,0.05)`).
- **Mantine mapping:** `SegmentedControl` `size="sm"` (NOT `xs`), `radius="lg"` (8). Per §6c it **already renders** the gray track + white active pill + `shadow-theme-xs` out of the box.
- **Touch target:** each segment item ≥44px tall — if Mantine's `size="sm"` control height is `<44px`, raise it via theme `styles` `mih`/control min-height using the `2.75rem` exemption (the ONLY raw-value exemption) and document it.

### Theme decision to make + DOCUMENT (`theme.components.SegmentedControl`)
`src/design-system/mantine/theme.ts` **already has** `SegmentedControl: { defaultProps: { radius: 'lg', size: 'sm' } }` (confirm — lines ~181–183). Your job:
1. **First verify** Mantine's out-of-the-box `SegmentedControl` rendering against the four §6c values (track gray-1, inactive text gray-5/hover gray-7, active pill white + gray-9 text + shadow-theme-xs, 14px/fw500). Note in the session log which values Mantine's default **already matches** vs which need alignment.
2. For any value the default does NOT match (likely: inactive label = `gray.5`, active text = `gray.9`, label `fw=500`, track bg = `gray.1`), align it via `theme.components.SegmentedControl` `styles`/`defaultProps` using **theme tokens only** (no raw hex/px; `mih="2.75rem"` touch-target is the sole raw exemption). Mantine SegmentedControl `styles` keys: `root` (track), `label` (item text), `indicator` (active pill), `control`. Use these — do not invent class names.
3. If alignment needs **more than a trivial `styles` block** (e.g. a `[data-active]`/`:where()` CSS selector beyond what `styles.label` + `styles.indicator` cover), **STOP and ASK** — do not hand-roll a CSS module. (Same boundary as the Task 489 Tabs `[data-active]` text-color deferral; if you hit that boundary, document it as a deferral and ask rather than invent.)
4. `fullWidth` is **NOT** set in the theme (mobile is swipe-scroll, not stretch — see Mobile gate). Do not add it.

## Current state to verify & preserve
- `theme.components.SegmentedControl` exists with `{ defaultProps: { radius: 'lg', size: 'sm' } }`. This task may EXTEND it with a `styles` block per the decision above. That is the ONLY theme change expected.
- Do NOT add a fixed width, `fullWidth`, raw color, or a non-`shadow-theme-xs` shadow.
- No existing SegmentedControl consumers may change behavior; theme-default + story only.

## Story to create — `src/stories/mantine/primitives/SegmentedControl.stories.tsx`
Copy the Tabs/Avatar/Badge proof-path EXACTLY:
- `title: 'Mantine/Primitives/SegmentedControl'`, single export **`Default`** only (no per-viewport/per-locale/Pass/Fail exports — forbidden by §8/§13/§16).
- `parameters: { skipCanvas: true, layout: 'fullscreen' }`.
- Locale via `context.globals.locale`; labels via `storyT(locale, key)` from `'../../_storyI18n'`.
- Modest padded canvas: outer `Box p="xl"` (Sprint 37 DoD §6 — NOT edge-glued; same as Tabs/Avatar/Badge).
- All user-facing option labels via `storyT()`. Thin dev section-labels (e.g. `horizontal / swipe on overflow`) are acceptable as minimal non-content annotations only (copy the exact convention used in `Tabs.stories.tsx`).

**🔴 Mobile swipe-scroll wrapper (the core proof of this task — copy from Task 489 Tabs):** wrap each `SegmentedControl` in a Mantine `ScrollArea`:
```tsx
<ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
  <SegmentedControl ... />
</ScrollArea>
```
- `scrollbarSize={0}` → Mantine renders its own scrollbar at 0px → **no visible scrollbar track in any browser**; touch/swipe still works.
- Do **NOT** pass `fullWidth`. Do **NOT** use `useMatches`/`grow`. The control is **content-width, single row**, scrolling horizontally only when options overflow the viewport (e.g. uk long labels at 320). Same pattern, same rationale as the approved Tabs 489 rework — cite it in a code comment + the session log.

Sections (each a labeled group, stacked in a `Stack`), keep minimal + legible:
1. **Role filter (overflow/long-label stress)** — a `SegmentedControl size="sm" radius="lg"` with **3** options: All / Administrator / Blocked (labels via `t()`). The uk labels ("Адміністратор", "Заблокований") are deliberately long → proves single-row + swipe-scroll + no clip at 320. Default value = the first option.
2. **Status filter (short variant)** — a second `SegmentedControl` with **3** short options: Active / Pending / Sold (labels via `t()`). Proves the standard content-width compact render at ≥640.

### i18n keys (namespace `storybook.mantine.*`, ALL 4 locales sq/en/uk/it — same key set)
First check whether equivalent segmented-option keys already exist under `storybook.mantine` and **reuse** them (say which). There are currently **none** (`seg_*` not present). Add these 6 keys with locale-NATIVE labels (≥1 long uk label to exercise swipe at 320):
- `seg_demo_role_all` — en "All" · uk "Усі" · sq "Të gjithë" · it "Tutti"
- `seg_demo_role_admin` — en "Administrator" · uk "Адміністратор" (long) · sq "Administrator" · it "Amministratore"
- `seg_demo_role_blocked` — en "Blocked" · uk "Заблокований" (long) · sq "I bllokuar" · it "Bloccato"
- `seg_demo_status_active` — en "Active" · uk "Активний" · sq "Aktiv" · it "Attivo"
- `seg_demo_status_pending` — en "Pending" · uk "Очікує" · sq "Në pritje" · it "In attesa"
- `seg_demo_status_sold` — en "Sold" · uk "Продано" · sq "Shitur" · it "Venduto"
Maintain exact key parity across all four files; `check:i18n` must stay green with matched counts. If a needed string already exists, REUSE it and note the reuse instead of duplicating.

## Positive flow (happy path)
1. Open Storybook → `Mantine/Primitives/SegmentedControl → Default`, locale=en, viewport ≥768.
2. Each `SegmentedControl` renders **content-width, left-aligned, NOT stretched**: gray-1 track, gray-2 border, `p-1`; inactive labels **gray-5 14px fw500**; the selected pill is **white + gray-9 text + shadow-theme-xs**, `rounded-md`.
3. Click each segment → selection moves, the white pill slides to the chosen option; keyboard arrow-key navigation + `role="radiogroup"`/`aria-checked` semantics work (Mantine built-in — verify not broken).
4. Resize the toolbar to **<640** (320/375/480) → the control **stays a single horizontal row**; when options overflow (uk role filter at 320) the row **swipe-scrolls horizontally** with **no visible scrollbar**; it does **NOT** stretch full-width, wrap, or compress.
5. Switch locale (en→uk→sq→it via toolbar): option labels update from `storyT()`; uk renders Cyrillic; no missing-key/raw-key leak.
6. Side-by-side vs `demo_tailadmin_com.zip` §6c: gray track, white active pill with subtle shadow, content-width on desktop — no underline-tab look, no stretched bar.

## Negative flow (every off-happy-path branch)
- **Long uk option** ("Адміністратор"/"Заблокований") at **320**: the segment row **does not clip or truncate** the label and causes **no page horizontal scroll** — overflow is consumed by the `ScrollArea` swipe only; each label stays legible.
- **No-stretch boundary:** at ≥640 the control is content-width left-aligned (NOT `fullWidth`); below 640 it is still content-width single-row + swipe (NOT stretched, NOT wrapped). Prove both.
- **Keyboard/aria intact:** arrow-key moves selection; `aria-checked`/radiogroup semantics unchanged vs Mantine default.
- **Missing/unknown locale:** `storyT` falls back to `en` (no crash, no raw key shown).
- **Single-select integrity:** selecting one option deselects the previous; never two active pills.

## 🔴 Mobile <640 gate (OWNER P0 — owner-approved exemption shape, 2026-06-25)
- The owner has explicitly chosen **single-row + swipe-scroll** for this control (identical to the approved Task 489 Tabs). Therefore at `<640` the SegmentedControl is **content-width, single horizontal row, swipe-scroll on overflow** — this is the **documented exemption** to the default "stretch to full-width" rule, exactly as recorded for Tabs 489. **`fullWidth`, `grow`, wrap-to-2-rows, and compress/truncate are all TASK FAILURES here.**
- Touch targets: each segment ≥44px tall (`mih="2.75rem"` exemption if needed). Labels never clip; no page h-scroll at 320 (overflow lives inside the `ScrollArea`).
- At ≥640: content-width, left-aligned, compact — proven NOT stretched.
- Document this exemption in the session log with a one-line cite to Task 489 (owner-approved precedent) so the reviewer doesn't re-flag it as a full-width-gate miss.

## 🔴 Rendered proof (clauses 12–13 + Sprint 37 DoD §3 — machine-produced is the canonical gate)
- After writing the story, **rebuild Storybook** so the new story is in the build, then run the full assert harness and paste the result into the session log:
  ```
  npm run build-storybook
  npm run screenshots:assert
  ```
  (Full run — NOT `--fast` — Sprint 37 DoD §3 requires the **480** cells, which fast mode skips.)
- Required matrix cells, each PASS with concrete evidence (content-width ≥640? single row + swipe <640? gray track / white active pill + shadow? gray-9 active text / gray-5 inactive? 14px fw500? long-uk label no-clip? no page h-scroll@320?): **320 / 375 / 480 × en/uk + sq@320 + it@320 + a ≥640 cell (768) to prove not-stretched**, with **uk@320/375/390 mandatory** stress cells.
- If the harness cannot capture the freshly-added story in this environment, say so explicitly and attach the per-cell evidence you DID capture; the orchestrator/owner does the manual Storybook toolbar matrix + side-by-side at review (as for Tasks 486/487/489/491, per `mantine-responsive-design-system.md` §13.10 owner-reviewed toolbar proof). "tsc=0/build green" is NOT rendered proof and never closes the task.

## Gates (all must pass; paste transcript into the session log)
`tsc --noEmit` = 0 · `npm run check:i18n` (matched key counts ×4) · `npm run check:stories` (0 violations) · `npm run check:design-tokens` (0 violations). Zero hardcode: no raw hex/rgb/named colors (use `gray.1`/`gray.5`/`gray.9` tokens + `var(--mantine-shadow-xs)`/theme shadow for the pill), no raw spacing/radius px (theme tokens only; `mih="2.75rem"` is the only exemption), no raw user-facing strings, no raw `<button>`/Tailwind `sm:` responsive class.

## Acceptance criteria (each maps to a flow + is verifiable in the diff/render)
1. `theme.ts` `components.SegmentedControl` decision implemented and **documented**: which §6c values Mantine already matched vs which were aligned via `styles` (`root`/`label`/`indicator`/`control`) with theme tokens only; `mih`/touch-target documented if added; `fullWidth` NOT added. → Positive flow 2.
2. New `src/stories/mantine/primitives/SegmentedControl.stories.tsx` exists: single `Default`, `skipCanvas:true`+`layout:'fullscreen'`, `Box p="xl"` canvas, 2 segments (role long-label + status short) each wrapped in `ScrollArea type="auto" scrollbars="x" scrollbarSize={0}`, NO `fullWidth`/`grow`. → Positive flow 1,3,4.
3. Option labels via `storyT()`; new `storybook.mantine.seg_demo_*` keys present in all 4 locales with parity; uk Cyrillic + the long-uk labels present. → Positive flow 5.
4. Negative-flow branches present + provable: long-uk no-clip + swipe@320, no-stretch at ≥640 and <640, keyboard/aria intact, single-select integrity, locale fallback. → Negative flow.
5. **Mobile gate (owner-approved exemption):** single-row + swipe-scroll `<640` (NOT fullWidth/wrap/compress), ≥44px touch targets, labels no-clip, no page h-scroll@320; cited to Task 489 precedent. → Mobile gate.
6. Rendered matrix (320/375/480 × en/uk + sq/it@320 + 768; uk@320/375/390) attached, or explicit manual-fallback note with captured evidence. → Rendered proof.
7. All gates green; zero hardcode; scope clean (no product-surface files touched). → Hard contract.
8. `docs/backlog.md` + session log under `docs/sessions/` updated; Files Changed table present; **no git commands emitted by the executor**.

## Files expected to change (the orchestrator cross-checks the real diff against this)
- `src/stories/mantine/primitives/SegmentedControl.stories.tsx` (NEW).
- `src/design-system/mantine/theme.ts` (EXTEND `components.SegmentedControl` with a `styles` block per the documented decision; if Mantine defaults already match every §6c value, possibly story-only — state which and why).
- `messages/{en,sq,uk,it}.json` (new `seg_demo_*` keys, unless an equivalent already exists — say which).
- `docs/backlog.md` + `docs/sessions/2026-06-25-task490-segmentedcontrol-primitive.md`.
Anything else = scope creep → STOP and ASK.

## Run order context
Sprint 37: 486 Badge ✅ → 487 Card ✅ → 491 Avatar ✅ → 489 Tabs ✅ → **490 SegmentedControl (this task)** → 488 Table. After all 6 ✅, Task 485 REWORK2 reopens as the first Phase-4 surface proof (AdminUsersTable). Task numbering — last used: 491; next free: 492 (this task reuses the already-reserved 490).
