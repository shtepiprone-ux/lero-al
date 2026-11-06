# Kickoff — Task 491 — Avatar primitive → TailAdmin (Sprint 37, MM Phase 1, P1.14)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews the real diff + rendered story side-by-side with the TailAdmin archive).
> **Epic:** MM (Mantine UI migration). **Sprint:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md`.
> **Program/tracker:** `docs/mantine-tailadmin-migration-tracker.md`. **Reference (copy-source):** `docs/tailadmin-style-reference.md` §6 "Avatar (sm)" row + §6b "Composite user cell" + `demo_tailadmin_com.zip`.
> **Theme:** `src/design-system/mantine/theme.ts`. **Story path:** `src/stories/mantine/primitives/Avatar.stories.tsx`.
> **Precedent (copy the pattern exactly):** Task 487 Card — `src/stories/mantine/primitives/Card.stories.tsx` + `Sprint_37_kickoff_prompt_Task_487_Card.md`; Task 486 Badge — `src/stories/mantine/primitives/Badge.stories.tsx`.

## Hard contract (P0 — verified against the diff on return; see `docs/agent-contract.md` clauses 1–15)
- Do NOT change scope. Phase-1 = theme defaults + ONE proof story only. **NO product-surface edits** (no `src/components/**`, no `src/app/**`, no patterns, no `AppImage`/`Avatar` consumers).
- Do NOT invent architecture. If anything is ambiguous → **STOP and ASK the orchestrator**, do not guess.
- Do NOT remove/alter existing Avatar consumer behavior (src/fallback/initials logic in `AdminUsersTable` etc.). Only add `theme.components.Avatar` defaults + the new story.
- Execute the AC literally. Self-validate BEFORE claiming complete (tsc=0, AC-by-AC table, read-back every written file).
- Update `docs/backlog.md` + add a session log under `docs/sessions/` with a **Files Changed** table. **Do NOT run git** (single-writer; the orchestrator emits commits).

## Pre-read (rule-index: UI/layout/component task — load ONLY these)
**Always:** `docs/agent-contract.md`, `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this task touches NO registry flow; confirm and state so).
**Required:** `docs/mantine-responsive-design-system.md` (§7 mobile gate, §8 Mantine Storybook proof rules, §12 patterns, §13 rebuild plan, §16 acceptance gates) ← **FIRST READ**; `docs/ui-rules.md`; `docs/component-rules.md`; `docs/qa-rules.md`.
**This task specifically:** `tasks/Sprints/Sprint_37_MM_Phase1_PrimitivesA.md` (§ Task 491 + Shared DoD); `docs/tailadmin-style-reference.md` §6 + §6b; `src/stories/mantine/primitives/Card.stories.tsx` + `Badge.stories.tsx` (templates).

## Required values (TailAdmin §6 / §6b — copy EXACTLY, zero invented values)
- **Shape:** `radius="pill"` (= TailAdmin `rounded-full`, fully circular).
- **Default/admin size:** **40px** (`h-10 w-10`, §6b composite user cell) — the standard size AdminUsersTable consumes; **parity desktop + mobile** (do NOT shrink on mobile).
- **Form/sm size:** **44px** (`h-11 w-11`, §6 "Avatar (sm)" row) — the larger form variant; demonstrate it too so the size scale is proven.
- **Fallback (no image):** **brand-tinted** surface with **uppercase initials** derived from the name (Mantine light-tint: brand bg + brand text — use `color="brand"`, NOT a raw hex). Initials uppercase.
- **Image variant:** when `src` is present, the photo fills the circle (`object-fit: cover`), cropped to the pill radius.
- **Theme default to ADD:** `theme.components.Avatar = { defaultProps: { radius: 'pill' } }`. Size is **passed by consumers** (40 standard, 44 form) — document the 40px standard in the session log; do NOT bake a fixed size into the theme default.

## Current state to verify & preserve
`src/design-system/mantine/theme.ts` currently has **NO** `components.Avatar` entry (unlike Card/Paper/Badge which Task 484 already set). **This task ADDS one** — `Avatar: { defaultProps: { radius: 'pill' } }` — placed alongside the other `components.*` entries (e.g. near `Badge`/`Card`). This is the ONLY theme change expected.
- Do NOT add a fixed `size` default, a raw color, or a shadow.
- Existing Avatar/`AppImage` consumers keep their `src`/`alt`/initials/fallback logic and any explicit size — unaffected by adding a `radius` default (pill is already their intent).

## Story to create — `src/stories/mantine/primitives/Avatar.stories.tsx`
Copy the Card/Badge proof-path EXACTLY:
- `title: 'Mantine/Primitives/Avatar'`, single export **`Default`** only (no per-viewport/per-locale/Pass/Fail exports).
- `parameters: { skipCanvas: true, layout: 'fullscreen' }`.
- Locale via `context.globals.locale`; labels via `storyT(locale, key)` from `'../../_storyI18n'`.
- Modest padded canvas: outer `Box p="xl"` (Sprint 37 DoD §6 — NOT edge-glued).
- All user-facing strings (names, subtitles) AND the image `alt` via `storyT()`. Thin dev section-labels (e.g. `40px / 44px`, `image / initials`) are acceptable only as minimal non-content annotations.

Sections (each a labeled group, stacked in a `Stack`):
1. **Image avatar** — `Avatar src={…} alt={t('storybook.mantine.avatar_demo_name')}` at **40px** and **44px**; circular, photo cropped to the circle. (Use a stable placeholder image URL already used by the repo's stories, or a data/asset the harness can load; if none exists, STOP and ASK rather than hotlinking an arbitrary external URL.)
2. **Initials fallback** — `Avatar name={t('storybook.mantine.avatar_demo_name')} color="brand"` with **no `src`** → brand-tinted circle with uppercase initials; show 40px + 44px. Proves the §6b tinted composite-cell avatar.
3. **Composite user cell (§6b)** — a `Group gap="sm"` of `Avatar (40, initials)` + a `Stack gap={2}` of name (`Text size="sm" fw={500} c="gray.7"`) + subtitle (`Text size="xs" c="gray.5"`), mirroring AdminUsersTable's cell, to prove the avatar in its real context.
4. **Negative flow** — (a) **no name / no src** → graceful placeholder (Mantine default placeholder icon or `children="?"`); no crash, no raw color; (b) **broken `src`** (invalid URL) → falls back to initials/placeholder, NOT a broken-image glyph and NOT a raw hex; (c) the long-uk name still yields correct uppercase Cyrillic initials and the composite-cell labels wrap, no clip/overflow at 320.

### i18n keys (namespace `storybook.mantine.*`, ALL 4 locales sq/en/uk/it — same key set)
First check whether equivalent keys already exist in `messages/*.json` under `storybook.mantine` and **reuse** them. If not, add these (English source shown; provide faithful, locale-NATIVE names so initials differ per locale and Cyrillic is exercised in uk):
- `avatar_demo_name` — en: "Jane Cooper" · uk: a natural Ukrainian full name (Cyrillic, e.g. "Олена Коваленко") · sq: an Albanian full name · it: an Italian full name. (Two words → 2-letter uppercase initials.)
- `avatar_demo_subtitle` — en: "Administrator" (or reuse an existing `storybook.mantine.*` role/subtitle key if one already fits — say which).
Maintain exact key parity across all four files; `check:i18n` must stay green with matched counts. If a needed string already exists, REUSE it and note the reuse instead of adding a duplicate.

## Positive flow (happy path)
1. Open Storybook → `Mantine/Primitives/Avatar → Default`, locale=en, any viewport.
2. Image avatar renders as a **circular 40px** (and 44px) photo cropped to the circle.
3. Initials avatar (no src) renders a **brand-tinted** circle with **uppercase initials** from `avatar_demo_name`.
4. Composite cell renders avatar + name + subtitle aligned per §6b.
5. Switch locale (en→uk→sq→it via toolbar): name/subtitle/alt update from `storyT()`; **uk initials are correct uppercase Cyrillic**; no missing-key/raw-key leak.
6. Side-by-side vs `demo_tailadmin_com.zip` composite user cell: circular shape, tint, size, alignment match.

## Negative flow (every off-happy-path branch)
- **No name + no src:** graceful placeholder (default icon or `?`), no crash, no raw color.
- **Broken `src`:** falls back to initials/placeholder (no broken-image glyph, no raw hex).
- **Long uk name:** correct 2-letter uppercase Cyrillic initials; composite-cell labels wrap (`whitespace-normal`), do NOT clip or cause horizontal scroll at 320.
- **Missing/unknown locale:** `storyT` falls back to `en` (no crash, no raw key shown).

## 🔴 Mobile <640 gate (OWNER P0 — MANDATORY) — Avatar is a documented COMPACT EXEMPTION
- **The Avatar itself is EXEMPT from the full-width rule** and MUST stay a fixed circular identity element (40px, parity desktop+mobile) — stretching it to full width would distort it. **State this exemption explicitly with justification in the session log** (icon-only/compact-control exemption per agent-contract clause 11). Do NOT make the avatar full-width.
- **The composite-cell CONTAINER (Section 3) is NOT exempt:** at `<640` the row must fill the available canvas width, the name/subtitle text must wrap and stay legible, and there must be **no clip and no horizontal scroll at 320**.
- Avatar is non-interactive here (no onClick) → the ≥44px touch-target rule does not apply to the avatar; if any interactive wrapper is added, it must be ≥44px (none expected — if you think one is needed, STOP and ASK).
- Exemptions list: **Avatar (fixed 40/44px circular identity element)** — the only exemption; everything textual/container stays full-width + wrapping.

## 🔴 Rendered proof (clauses 12–13 — machine-produced is the canonical gate)
- After writing the story, **rebuild Storybook so the new story is in the build**, then run the assert harness and paste the result into the session log:
  ```
  npm run build-storybook
  npm run screenshots:assert
  ```
  (Full run — NOT `--fast` — Sprint 37 DoD §3 requires the **480** cells, which fast mode skips.)
- Required matrix cells, each PASS with concrete evidence (circular? 40/44px correct? brand tint on initials? uppercase initials incl. uk Cyrillic? image cropped to circle? composite labels wrap? no clip? no h-scroll@320?): **320 / 375 / 480 × en/uk + sq@320 + it@320**, with **uk@320/375/390 mandatory** stress cells.
- If the harness cannot capture the freshly-added story in this environment, say so explicitly and attach the per-cell evidence you DID capture; the orchestrator/owner does the manual Storybook toolbar matrix + side-by-side at review (as for Tasks 486/487). "tsc=0/build green" is NOT rendered proof and never closes the task.

## Gates (all must pass; paste transcript into the session log)
`tsc --noEmit` = 0 · `npm run check:i18n` (matched key counts ×4) · `npm run check:stories` (0 violations) · `npm run check:design-tokens` (0 violations). Zero hardcode: no raw hex/rgb/named colors (tint via `color="brand"`), no raw spacing/radius px (theme tokens only; the 40/44 avatar sizes are passed as Mantine size props/numbers per §6b — document them), no raw user-facing strings/`alt`, no raw `<img>`-as-avatar.

## Acceptance criteria (each maps to a flow + is verifiable in the diff/render)
1. `theme.ts` gains `components.Avatar = { defaultProps: { radius: 'pill' } }` (no size/color/shadow baked in); placed beside the other component defaults. → Positive flow 2–3.
2. New `src/stories/mantine/primitives/Avatar.stories.tsx` exists: single `Default`, `skipCanvas:true`+`layout:'fullscreen'`, `Box p="xl"` canvas, sections 1–4 above. → Positive flow 1–4.
3. Names/subtitles/`alt` via `storyT()`; new/reused `storybook.mantine.*` keys present in all 4 locales with parity; uk yields correct Cyrillic initials. → Positive flow 5.
4. Negative-flow branches all present + visible: no-name placeholder, broken-src fallback, long-uk initials + label wrap, locale fallback. → Negative flow.
5. Avatar circular 40px (and 44px) with brand-tinted uppercase initials; **mobile parity** (not shrunk, not full-width — documented compact exemption); composite container full-width at <640 with wrapping labels, no h-scroll@320. → Mobile gate.
6. Rendered matrix (320/375/480 × en/uk + sq/it@320; uk@320/375/390) attached, or explicit manual-fallback note with captured evidence. → Rendered proof.
7. All gates green; zero hardcode; scope clean (no product-surface files touched). → Hard contract.
8. `docs/backlog.md` + session log under `docs/sessions/` updated; Files Changed table present; **no git commands emitted by the executor**.

## Files expected to change (the orchestrator cross-checks the real diff against this)
- `src/stories/mantine/primitives/Avatar.stories.tsx` (NEW).
- `src/design-system/mantine/theme.ts` (ADD `components.Avatar` `{ radius: 'pill' }` — this IS an expected change, unlike Task 487).
- `messages/{en,sq,uk,it}.json` (new `avatar_*` keys, unless an equivalent already exists — say which).
- `docs/backlog.md` + `docs/sessions/2026-06-25-task491-avatar-primitive.md`.
Anything else = scope creep → STOP and ASK.

## Run order context
Sprint 37: 486 Badge ✅ → 487 Card ✅ → **491 Avatar (this task)** → 489 Tabs → 490 SegmentedControl → 488 Table. After all 6 ✅, Task 485 REWORK2 reopens as the first Phase-4 surface proof. Task numbering — last used: 491; next free: 492.
