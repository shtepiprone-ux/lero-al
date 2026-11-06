# Sprint 25 — Task 315 kickoff (HIGH HOTFIX: Admin Email Templates `variables_hint` ICU literal-braces fix)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10. Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **runtime i18n hotfix — 4 locale strings + 2 call-site calls** in `AdminEmailTemplatesManager.tsx`. Pre-read `docs/qa-rules.md`, `docs/component-rules.md` (Localization governance), `docs/sessions/2026-05-28-task-201-email-template-modal-width.md` (closest prior Email Templates context). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 315 occupies the gap between Sprint 22 (Task 314) and Sprint 24 (Task 316). Owner-assigned in `issues2.md` 2026-05-30. Also designated as "Epic II Phase 0 second slice" alongside Task 300.

---

```
Type:        bugfix (i18n runtime; HIGH — admin page crashes)
Priority:    HIGH — opening any Email Templates editor dialog throws INVALID_MESSAGE: MALFORMED_ARGUMENT in 4 locales
Area:        admin/email-templates — AdminEmailTemplatesManager.tsx — messages/{sq,en,uk,it}.json (admin.emailTemplates.variables_hint)
```

## Why this task exists (2026-05-30 owner runtime QA)

Opening `/admin/email-templates` → clicking edit on any template OR clicking "Create template" throws:

```
INVALID_MESSAGE: MALFORMED_ARGUMENT
(Використовуйте {{назваЗмінної}} у темі та тілі)
```

Stack:
- `src/components/admin/AdminEmailTemplatesManager.tsx:169` — `<DialogDescription>{t('variables_hint')}</DialogDescription>`
- `src/components/admin/AdminEmailTemplatesManager.tsx:247` — `<p className="text-xs text-muted-foreground">{t('variables_hint')}</p>`

Root cause: `admin.emailTemplates.variables_hint` in every locale file contains literal double-brace examples (e.g. `"Використовуйте {{назваЗмінної}} у темі та тілі"`). `next-intl` / ICU MessageFormat parses single `{...}` as formatting syntax (placeholder or variable interpolation); `{{...}}` therefore parses as an unrecognized argument and throws `MALFORMED_ARGUMENT`.

Orchestrator-confirmed current strings (verified 2026-05-30 via `grep -n '"variables_hint"' messages/*.json`):

| Locale | Current (BROKEN) |
|---|---|
| sq | `"Perdorni {{emriVariables}} ne subjekt dhe trup"` |
| en | `"Use {{variableName}} in subject and body"` |
| uk | `"Використовуйте {{назваЗмінної}} у темі та тілі"` |
| it | `"Usa {{nomeVariabile}} in oggetto e corpo"` |

Both call sites pass NO interpolation values — the literal `{{...}}` is therefore parsed as a missing argument with malformed name. Result: dialog body crashes; admin cannot edit/create email templates.

## Goal

Fix the ICU parse failure WITHOUT removing the literal `{{variableName}}` example from the visible UI (the example is the whole point of the hint — admins need to see how to write template variables).

**Recommended approach:** replace the literal `{{...}}` in each locale with an ICU placeholder `{variableSyntax}`, then pass the literal example as the interpolation value at the call site.

- Locale strings become:
  - sq: `"Perdorni {variableSyntax} ne subjekt dhe trup"`
  - en: `"Use {variableSyntax} in subject and body"`
  - uk: `"Використовуйте {variableSyntax} у темі та тілі"`
  - it: `"Usa {variableSyntax} in oggetto e corpo"`
- Call sites become:
  - `t('variables_hint', { variableSyntax: '{{variableName}}' })`
- Rendered UI shows: `Use {{variableName}} in subject and body` (locale-equivalent).

This is the canonical lero-al pattern (matches existing `t('foo', { x: ... })` interpolations elsewhere in the codebase). It satisfies ICU strictness while keeping the visible `{{variableName}}` example intact.

**Alternative (REJECTED for this task unless STOP & ASK approval):** escape ICU braces inside the locale string with `'{{' '}}'` ICU escape syntax. PROS: zero call-site change. CONS: `next-intl` ICU escape syntax is non-obvious and rarely used in this codebase — sets a fragile precedent. Stick with the interpolation approach.

## Current behavior to preserve (Notes 19 + 20)

- Email Templates list page renders unchanged (currently works — bug is in the EDITOR dialog only).
- Create dialog + Edit dialog all other fields render unchanged (subject, body, variables CSV input).
- Subject + body editing, variables CSV editing — unchanged.
- Save / Cancel button behaviour — unchanged.
- Existing email template DB rows untouched.
- All other `admin.emailTemplates.*` locale keys (modal title, field labels, button labels, validation messages, etc.) untouched.
- The literal `{{variableName}}` example must REMAIN visible to admins in the rendered hint (the whole point of the hint).

## Positive flow (happy path)

As an admin at `uk` locale, viewport 1280px:
1. Navigate to `/uk/admin/email-templates`.
2. Click "Create template" (or edit an existing template).
3. Dialog opens. NO console errors. NO `INVALID_MESSAGE: MALFORMED_ARGUMENT` toast.
4. `DialogDescription` shows: `Використовуйте {{назваЗмінної}} у темі та тілі` (visible literal double braces preserved).
5. Inline hint under variables field shows the same localized string.
6. Subject + body + variables fields are editable.
7. Save / Cancel work as before.
8. Switch locale to `sq` / `en` / `it` → repeat steps 2-7 — no crash in any locale.

## Negative flow (every off-happy-path branch)

- **Stale build cache** — if Sonnet runs an old build, the locale change may not surface. Always run `npm run build` after the edit; do not rely on dev hot-reload alone.
- **Other `{{...}}` literal-brace strings hiding elsewhere** — required investigation must `grep -rn '{{.*}}' messages/` to surface all other ICU landmines. Fix in this task ONLY the `variables_hint` strings; document additional finds as out-of-scope follow-up (do not patch them silently).
- **Browser cache** — if owner sees a still-crashing UI after deploy, hard-refresh; do not roll back the fix without checking.
- **Locale `sq` string lacks the `ë` accent** (current value has `Perdorni` not `Përdorni` — pre-existing; do NOT "fix" the accent in this task, that is scope creep). Just replace `{{emriVariables}}` with `{variableSyntax}`.
- **ICU escape syntax** — if Sonnet experiments with `'{{' variableName '}}'` escape: STOP & ASK; default is the interpolation approach above.

## Required investigation (PASTE in session log)

```
# 1. Confirm current broken strings
grep -n '"variables_hint"' messages/sq.json messages/en.json messages/uk.json messages/it.json

# 2. Confirm call sites
grep -n 'variables_hint' src/components/admin/AdminEmailTemplatesManager.tsx

# 3. Find other literal-brace landmines in locale files
grep -rn '{{[^}]*}}' messages/sq.json messages/en.json messages/uk.json messages/it.json

# 4. Find canonical interpolation pattern reference in repo
grep -rn "t('[^']*', { " src/ | head -20

# 5. Confirm next-intl version + ICU behaviour
cat package.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('next-intl:', d.get('dependencies',{}).get('next-intl'))"
```

After investigation, paste:
- All current `variables_hint` strings (4 locales) verbatim.
- The two call sites (file:line) verbatim.
- Any other `{{...}}` literal-brace finds in `messages/` (these are OUT OF SCOPE — just list them).
- The canonical interpolation pattern reference (existing example call somewhere in `src/`).

## Scope (files Sonnet may touch)

- `messages/sq.json` — change `admin.emailTemplates.variables_hint` value only
- `messages/en.json` — same
- `messages/uk.json` — same
- `messages/it.json` — same
- `src/components/admin/AdminEmailTemplatesManager.tsx` — change the 2 call sites (line 169 + line 247) to pass `{ variableSyntax: '{{variableName}}' }`
- `docs/sessions/2026-05-30-task-315-email-template-variables-hint-icu.md` (NEW; adjust date)
- `docs/backlog.md` (closure entry)

**MUST NOT touch:**
- Any other locale key (only `admin.emailTemplates.variables_hint`)
- Any other admin file
- Any other component
- Footer / AdminFooterManager / Task 302 SQL / Task 324 work
- Email template business logic (server actions, DB, sending)
- Email template editor UI redesign
- Template variable semantics
- Other `{{...}}` landmines (list only; fix in separate follow-up if owner approves)
- Locale accent fixes (`Perdorni` → `Përdorni` etc.)
- DB / RLS / migrations
- `next-intl` version bump

Maximum SOURCE-FILE delta: **1** (`AdminEmailTemplatesManager.tsx`). If you touch more, STOP & ASK.

## Acceptance criteria (literal)

- `admin.emailTemplates.variables_hint` value in all 4 locale files contains `{variableSyntax}` (single-brace ICU placeholder) instead of `{{...}}`.
- All 4 strings preserve their existing meaning + locale (sq Albanian, en English, uk Ukrainian, it Italian).
- Both call sites (line 169 + 247) pass `{ variableSyntax: '{{variableName}}' }` as interpolation args.
- Rendered hint visibly shows literal `{{variableName}}` in the UI for each locale (manually verified).
- No `INVALID_MESSAGE: MALFORMED_ARGUMENT` console error when opening Create dialog or Edit dialog in any locale.
- `/admin/email-templates` page loads without console errors in sq / en / uk / it.
- Subject + body + variables fields render and remain editable.
- Save / Cancel work as before.
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → passes.
- `npm run lint` → 0/0 (Task 295 baseline preserved).
- `npm run check:i18n` (if exists) → passes (key parity unchanged).
- Note 18 self-validation block + AC self-audit table + "Files Changed" table.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · check:i18n=passes · /admin/email-templates runtime PASS sq/en/uk/it · literal {{variableName}} hint visible · scope=clean · PASS`.

## Out of scope (do NOT touch in this task)

- Other `{{...}}` literal-brace landmines surfaced by the grep — list in session log as follow-up candidates, do not fix here.
- Footer / Task 302 / Task 324.
- Email Templates editor UI redesign.
- Template variable semantics / DB schema / send pipeline.
- `next-intl` version bump or ICU configuration change.
- Other admin pages.
- New locale keys.
- Locale accent fixes (separate copy QA task).
- Admin UX System Epic HH work.
- Dependency hygiene (Task 325 separate).

## Final report required

1. Files Changed table (5 files: 4 locale JSONs + 1 source + session log + backlog).
2. Before/after `variables_hint` strings per locale (verbatim).
3. Exact call-site diff for line 169 + 247.
4. List of OTHER `{{...}}` landmines found in `messages/` (out-of-scope follow-up candidates).
5. Runtime narrative: 4 locales × Create + Edit dialogs opened without crash.
6. AC-by-AC self-audit table.
7. Confirmation no Footer/Task 302/Task 324 file touched.
8. Confirmation no other locale key touched.

Do NOT emit git commands. Do NOT run git. Do NOT broaden scope. STOP & ASK if ICU escape syntax is preferred over interpolation.
