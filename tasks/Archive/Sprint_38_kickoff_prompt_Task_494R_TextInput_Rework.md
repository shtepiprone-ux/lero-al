# Task 494-R — TextInput story REWORK (owner rejection, 2026-06-27)

> **Type:** Storybook / UI (Mantine proof path). **Executor:** Sonnet 4.6. **Orchestrator:** Opus (this file + diff review).
> **Re-execution of Task 494** (no new top-level number — stays 494). The §6 theme chrome in
> `src/design-system/mantine/theme.ts` from the first pass is **ACCEPTED and stays as-is** — do NOT touch `theme.ts`.
> This rework is limited to the **story file + the 4 locale files**.

## Why this is reopened (owner verbatim, translated)
The owner rejected the first 494 pass for two reasons:

1. **Email placeholder must NEVER be translated.** An email address is always written in Latin/English script, so the
   email placeholder must NOT be localized into Ukrainian (Cyrillic). The first pass shipped `uk.json`
   `ti_placeholder = "ви@приклад.com"` (Cyrillic) — that is the defect. **All OTHER placeholders DO translate per
   language rules** (the job-title placeholder is correctly localized — keep that pattern).
2. **The phone example does not belong in TextInput.** In this product a phone number is the canonical **two-field
   composite** `PhoneField` (`src/components/shared/PhoneField.tsx` — dial-code Combobox + national Input), NOT a single
   `TextInput` with a phone icon. Misrepresenting it confuses the catalog. **Owner decision: remove the icons from the
   TextInput story entirely** (no `leftSection`/`rightSection` icon examples). The Mantine phone primitive is a
   **separate task (504)** and is out of scope here.

## Owner decisions captured for this rework (2026-06-27)
- **Email placeholder string = `example@gmail.com`, IDENTICAL across all 4 locales** (en/sq/uk/it). Not transliterated,
  not localized. This is the single source for every email field in the story.
- **Remove ALL icons from the TextInput story** — delete the `Phone` import and the entire "input-group" section. The
  TextInput primitive story shows plain text inputs only. (The input-group / `leftSection` affordance will be
  demonstrated by the dedicated PhoneField task 504 and/or a later input-group example, not here.)

## Pre-read (required)
- `docs/agent-contract.md` (clauses 1–15), `docs/backlog.md`, `docs/critical-flow-registry.md` (scan — this task
  touches no registered runtime flow; it is Storybook-only).
- `docs/mantine-responsive-design-system.md` §7 (mobile gate), §8 (Mantine Storybook proof path), §13 (story rebuild).
- `docs/i18n-rules.md` — **read the new "Email / machine-format placeholders are never translated" rule** (added with
  this rework). `docs/storybook-governance.md`, `docs/component-rules.md`, `docs/qa-rules.md`.
- `tasks/Sprints/Sprint_38_MM_Phase1_FormControls.md` (shared DoD + Task 494 block).

## Scope — EXACTLY these files (nothing else)
1. `src/stories/mantine/primitives/TextInput.stories.tsx` — remove icons + phone section; re-point placeholders.
2. `messages/en.json` · `messages/sq.json` · `messages/uk.json` · `messages/it.json` — under the
   `storybook.mantine` namespace: change `ti_placeholder`, remove `ti_icon_label`, add `ti_name_placeholder`.

**Do NOT touch `theme.ts`, any `src/` product code, or any other story.** If anything beyond these 6 files seems
necessary, STOP and ASK the orchestrator.

## Locale key changes (storybook.mantine namespace, all 4 files — keep key sets identical)
| Key | Action | en | sq | uk | it |
|---|---|---|---|---|---|
| `ti_placeholder` | **CHANGE** (email — untranslated) | `example@gmail.com` | `example@gmail.com` | `example@gmail.com` | `example@gmail.com` |
| `ti_icon_label` | **REMOVE** (was "Phone number" — icons gone) | — | — | — | — |
| `ti_name_placeholder` | **ADD** (localized full-name placeholder for the long-label section) | `e.g. Jane Smith` | `p.sh. Lulëzim Hoxha` | `напр., Іван Петренко` | `es. Mario Rossi` |
| `label_email` `label_job_title` `label_job_placeholder` `label_job_hint` `label_long` `label_optional` `ti_error` | **KEEP unchanged** (already correct; `ti_error` stays localized — error messages DO translate) | — | — | — | — |

> If `ti_name_placeholder` text needs adjusting for natural phrasing in any locale, that is fine — it just must be a
> properly-localized *name* hint (NOT an email, NOT Cyrillic-for-email). Parity: the same key set in all 4 files.

## Story changes (`TextInput.stories.tsx`)
- **Remove** `import { Phone } from 'lucide-react'`.
- **Delete the entire "input-group" section** (the `<Stack>` with the `Phone` `leftSection` and its caption). No
  `leftSection`/`rightSection` anywhere in this story.
- The remaining sections (and their placeholder source) must be:
  1. **basic** — `label={t('label_email')}`, `placeholder={t('ti_placeholder')}` (= example@gmail.com), `required`.
  2. **label + description** — `label_job_title` + `label_job_placeholder` (localized) + `label_job_hint`.
  3. **optional** — `label_job_title` + `(optional)` suffix + `label_job_placeholder` (localized) + hint.
  4. **error** — `label_email` + `ti_placeholder` + `error={t('ti_error')}` (red border/text, aria-invalid).
  5. **disabled** — `label_email` + `ti_placeholder`, `disabled`.
  6. **long label** — `label_long` + `placeholder={t('ti_name_placeholder')}` (localized name hint, NOT email), wrap test.
- Update the grey caption `<Text>` of the basic section so it no longer mentions an icon/input-group.
- Keep the Mantine proof-path scaffolding intact: `parameters.skipCanvas:true` + `layout:'fullscreen'`, single
  `Default` export, toolbar-driven locale, `storyT('storybook.mantine.*')`, `Box px={{base:'md',sm:'xl'}} py="md"`.

## Positive flow (happy path)
1. Open the story → toolbar locale `uk`, viewport 320. Each of the 6 sections renders a 44px-tall, 14px-text input with
   gray-2 border + brand focus ring (theme chrome from the accepted first pass).
2. The **email** sections (basic/error/disabled) show placeholder `example@gmail.com` — **Latin, identical in all 4
   locales** (switch toolbar en→sq→uk→it and confirm the email placeholder text does NOT change and is never Cyrillic).
3. The **job** sections show the localized job placeholder (changes per locale — uk shows "Введіть вашу посаду").
4. The **long-label** section shows the localized name placeholder (uk shows "напр., Іван Петренко") and the long label
   wraps to ≥2 lines at 320 with no clip and no horizontal scroll.
5. No icons appear anywhere in the story.

## Negative flow (off-happy-path branches to keep verifiable)
- **error** section: red border + red message (`ti_error`, localized) + `aria-invalid` present.
- **disabled** section: dimmed input + dimmed label, no focus ring, no pointer.
- **locale switch (uk):** every visible string except the email placeholder updates to Ukrainian; the email placeholder
  stays `example@gmail.com` (this is the exact regression being fixed — verify in the uk@320/375/390 cells).
- **long uk label/placeholder:** wraps, never clips, no h-scroll at 320.
- **parity guard:** `check:i18n` stays green — `ti_icon_label` removed from ALL 4 files (no orphan key in any locale),
  `ti_name_placeholder` added to ALL 4.

## Mobile <640 full-width gate (OWNER P0)
Inputs are full-width within the `Box` at `<640`; labels wrap (`sq/en/uk/it`); ≥44px control height; no h-scroll at 320.
No pop/overlay surfaces in this story. No icon-only controls (icons removed). Confirm in the rendered matrix.

## Definition of Done (from Sprint 38 shared DoD)
- Gates green: `tsc=0`, `check:stories`, `check:i18n`, `check:design-tokens`. (Green ≠ visual proof.)
- **Rendered proof matrix attached:** 320/375/480 × en/uk + sq/it@320, **uk@320/375/390 mandatory** — per cell confirm:
  email placeholder = `example@gmail.com` (Latin) and unchanged across locales; job/name placeholders localized; long
  label wraps; no clip/overflow; no h-scroll@320; inputs full-width <640; no icons present.
- File-integrity (clause 14): each touched file NUL=0, JSON parses, story compiles, not truncated — paste the transcript.
- Locale parity sq/en/uk/it (identical key sets after the add+remove).
- "Files Changed" table in the session log (one row per touched path + 1-line rationale). **Executor emits NO git.**
- No `theme.ts` / product-surface edits. No icons. No new top-level task number.

## STOP-and-ASK triggers
- If removing `ti_icon_label` breaks any OTHER consumer (grep it project-wide first — it should be story-only).
- If the long-label section's placeholder semantics are unclear, ask rather than reuse the email placeholder.

## Acceptance criteria (map each to a flow)
- **AC1** (Positive 2): `ti_placeholder = "example@gmail.com"` in all 4 locale files; rendered identical & Latin across
  en/sq/uk/it — verifiable in the diff + the uk cell of the matrix.
- **AC2** (rework reason 2 / Positive 5): no `Phone` import, no `leftSection`/`rightSection`, input-group section
  deleted — verifiable in the diff.
- **AC3** (Positive 3 + Negative parity): job placeholder stays localized; `ti_name_placeholder` added (localized) and
  used by the long-label section; `ti_icon_label` removed from all 4 — `check:i18n` green.
- **AC4** (Negative flow): error + disabled sections intact; long uk label wraps, no h-scroll@320.
- **AC5** (DoD): all gates green + rendered matrix with the uk@320/375/390 stress cells proving the email placeholder is
  no longer Cyrillic.
