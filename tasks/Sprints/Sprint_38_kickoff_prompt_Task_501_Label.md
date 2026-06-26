# Kickoff — Task 501 — Label primitive → TailAdmin (MM Phase 1, P1.28)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews real diff + owner renders the toolbar proof side-by-side with §6 + the owner reference).
> **Sprint:** `tasks/Sprints/Sprint_38_MM_Phase1_FormControls.md` — read its Shared DoD + 🔴 DENSITY CORRECTION first.
> **Run-order rationale:** Label is FIRST after Button because TextInput (494), Select (495), Textarea (496), PasswordInput (500)
> all reuse this label treatment — make the single-source label default now so every input inherits it.
> **You write code; you do NOT run git.** Update `docs/backlog.md` + a session log with a Files Changed table.
> **Scope = theme single-source defaults + a proof story only.** No `src/app/**`, `src/components/**`, `src/modules/**` edits.

## 🔴 OWNER UX DECISION + REFERENCE (2026-06-26) — NO REQUIRED ASTERISKS; OPTIONAL IS LABELED
**All fields are REQUIRED by default and carry NO `*` asterisk.** Fields that are NOT required get a localized
**"(optional)/(опційно)"** marker appended to the label. Owner reference (provided 2026-06-26) shows the exact pattern:
- `Email Address` — required, plain label, no marker.
- `Password` — required, plain label, no marker.
- `Job Title (optional)` — optional, the `(optional)` suffix sits inline in the label; the field also has a placeholder
  (`Add your job title`) and a quiet description/hint line below the input (`Designer, Dev, etc.`).

This supersedes the §6/Mantine asterisk convention; the sprint STOP-and-ASK trigger (c) is resolved by this decision.
The theme must SUPPRESS Mantine's default required asterisk so a `*` can never render anywhere in the app.

## Pre-read (load ONLY these)
- `docs/agent-contract.md` (clauses 1–15) + `docs/backlog.md` + `docs/critical-flow-registry.md` (scan — Label is not a registry flow; theme/story only, no behavior change).
- `docs/mantine-responsive-design-system.md` — §6 (component defaults), §7 (mobile <640 gate: labels wrap, ≥44px), §8 + §8.1 (Mantine Storybook proof path + page gutter).
- `docs/tailadmin-style-reference.md` §6 (Label row, line 66) + §6d.
- `docs/storybook-governance.md` + `docs/component-rules.md` + `docs/qa-rules.md`.

## Reference values (apply EXACTLY, zero invented values)
- §6 Label: `text-theme-sm font-medium text-gray-700` → **14px (`fz="sm"`), `fw=500`, `c="gray.7"`**.
- Label↔control association via `htmlFor` (Mantine `TextInput label=` wires this automatically through `InputWrapper`).
- **Optional marker:** localized `(optional)` suffix, visually secondary (`c="gray.5"`, `fw={400}` — quieter than the gray-7/fw500 label), appended to the label of OPTIONAL fields only.
- **Description/hint** (owner reference): Mantine `description` prop → 12px (`fz="xs"`), `c="gray.5"`, below the input. (§6d secondary-text treatment.)
- **No required asterisk** anywhere — see the OWNER UX DECISION block above.

## Current behavior to preserve
- Existing `src/components/ui/label.tsx` consumers are untouched (legacy surfaces stay on shadcn until their own migration).
- Mantine input labels (`TextInput`/`Select`/`Textarea`/`PasswordInput label=`) must render the §6 treatment via theme default, so 494–500 inherit it with no per-call styling. If `theme.components.InputLabel`/`InputDescription` already render the target values (Task 492), cite it and do NOT duplicate; add only what's missing.

## What to do
1. `src/design-system/mantine/theme.ts` → add/refine these `components`:
   - `InputLabel.styles.label`: `fontSize: 'var(--mantine-font-size-sm)'` (14px), `fontWeight: 500`, `color: 'var(--mantine-color-gray-7)'`.
   - `InputLabel.styles.required`: `{ display: 'none' }` — globally suppress Mantine's default required `*` (owner: no asterisks), even if a consumer passes `required`/`withAsterisk`.
   - `InputDescription.styles.description` (only if not already 12px/gray-5): `fontSize: 'var(--mantine-font-size-xs)'` (12px), `color: 'var(--mantine-color-gray-5)'`.
   - Token-first; `src/design-system/mantine/**` is allowlisted theme-input but still use Mantine CSS vars, no raw hex/px.
   - If any value is already present from Task 492, cite "already satisfied" and do not duplicate.
2. `src/stories/mantine/primitives/Label.stories.tsx` — NEW. Mantine proof path: `parameters:{ skipCanvas:true, layout:'fullscreen' }`, single `Default` export, `title:'Mantine/Primitives/Label'`, gutter `Box px={{base:'md',sm:'xl'}} py="md"`. Sections (mirror the owner reference — each a label↔input PAIR so association is provable):
   - **Required (default, unmarked)** — `TextInput label={t('label_email')}` → 14px/fw500/gray-7 label, NO asterisk; clicking the label focuses the input (htmlFor proof).
   - **Optional (marked, full reference pattern)** — `TextInput` with ReactNode label = `<>{t('label_job_title')} <Text span c="gray.5" fz="sm" fw={400}>{t('label_optional')}</Text></>`, `placeholder={t('label_job_placeholder')}`, `description={t('label_job_hint')}` → matches `Job Title (optional)` + `Add your job title` + `Designer, Dev, etc.`
   - **Long uk label (negative)** — `TextInput label={t('label_long')} fullWidth` → label wraps at 320, no clip, no h-scroll.
   - **Disabled control (negative)** — `TextInput label={t('label_email')} disabled` → label dimmed consistently with the disabled input.
   - All visible strings via `storyT(l, 'storybook.mantine.label_*')`. Import `Text` from `@mantine/core` for the optional suffix.
3. i18n: add to `messages/{en,uk,sq,it}.json` in the `storybook.mantine.*` namespace at full 4-locale parity (real translations; uk Cyrillic):
   - `label_email` (en `Email Address`), `label_job_title` (en `Job Title`), `label_job_placeholder` (en `Add your job title`),
     `label_job_hint` (en `Designer, Dev, etc.`), `label_long` (deliberately long uk for the wrap section), and
     `label_optional` = en `(optional)` · uk `(опційно)` · sq `(opsionale)` · it `(facoltativo)` (confirm natural wording per locale).
   - `check:i18n` parity must pass.

## Positive flow
Required field: label 14px medium gray-7, NO asterisk; clicking focuses the input (htmlFor). Optional field: label + quieter `(optional)/(опційно)` suffix in gray-5, with placeholder and a 12px gray-5 description below — exactly the owner reference. Every input full-width `<640`.

## Negative flow (all must be in the story + verifiable)
- **Long uk label** → wraps to the next line (labels are normal-flow text; confirm `InputLabel` does not clip), no clip, no h-scroll at 320, in sq/en/uk/it.
- **Disabled control** → label dimmed consistently (Mantine `data-disabled`); no bright label over a greyed field.
- **No stray asterisk** → even if `required` is passed, the `*` does not render (theme suppression); verify on the required-default section.

## 🔴 Mobile <640 full-width gate
The input controls are full-width `<640` (Mantine inputs default to full-width; the gutter `Box` provides the page inset). Labels wrap (sq/en/uk/it), never clip; no h-scroll at 320. Labels are block text, not interactive width-bearing controls (no exemption needed); the inputs they pair with carry the full-width requirement.

## Acceptance criteria
1. `theme.components.InputLabel` = §6 (14px/fw500/gray-7) + `required:{display:'none'}`; `InputDescription` = 12px/gray-5 (cite if already satisfied). → Positive.
2. `Label.stories.tsx` created (Mantine proof path, single Default; pairs: required-default + optional-marked-with-placeholder-and-hint + long-uk + disabled). → Positive + Negative.
3. New `storybook.mantine.label_*` keys ×4 locales at parity (incl. `label_optional`, hint, placeholder, long uk); `check:i18n` parity. → DoD 2.
4. Required field shows NO asterisk; optional field shows the localized quieter `(optional)` suffix + placeholder + description; clicking a label focuses its input (htmlFor). → Positive.
5. Long label wraps, no clip, no h-scroll@320; disabled label dimmed; no stray asterisk — sq/en/uk/it. → Mobile gate / Negative.
6. **Rendered proof:** owner/orchestrator toolbar verification note (Mantine `skipCanvas` path = no machine assert) — list exact cells: optional pattern (suffix+placeholder+hint) @ en@320 + uk@320; long-label wrap @ uk@320/375/390 + sq@320; disabled-dim @ any; no-asterisk @ any.
7. Gates: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens` — zero hardcode. → DoD 4.
8. No regression to existing Mantine input labels; `docs/backlog.md` + session log updated with Files Changed table; **no git emitted**. → DoD 7.

## Hard contract
No scope change; no invented architecture — the no-asterisk / optional-marker / description convention is fixed by the OWNER UX DECISION + reference above; if any OTHER §6 value can't be expressed with tokens, STOP and ASK. Execute AC literally; self-validate before "complete" (tsc=0 + AC-by-AC table + walk the story at uk 320). Files Changed table mandatory. Executor emits NO `git add`/`commit` — the orchestrator emits commits after diff review.
