### Task 375 — CORRECTIVE D: PhoneField Albanian 9-digit validation hardening (input + paste + schema + tests + placeholder)

> **Execution order (Sprint 32 correctives) — A → B → C → D → E → F, strictly sequential.** Sent to Sonnet one at a time; each starts only after the previous is implemented AND orchestrator diff-reviewed/approved. F is the FINAL certification sweep (run after A–E all land), never a parallel task. **D follows C.**

Type:      corrective bugfix — phone validation (owner-rejected 363)
Priority:  CRITICAL
Area:      src/components/shared/PhoneField.tsx · src/lib/phone/index.ts · src/lib/phone/__tests__/phone.test.ts ·
           messages/{en,sq,uk,it}.json · src/components/ui/input.stories.tsx

## Owner rejection context
Owner: Albanian national number = **exactly 9 digits** (e.g. `68 123 45 67` → operator `68` + `123 45 67`). Field must
reject <9 and >9, reject letters, reject symbols (unless purely visual + stripped). Placeholder must be national-only,
not repeat `+355`. Task 363 only stripped some chars and validated on submit — rejected.

## Required pre-read
`docs/agent-contract.md` · `docs/backlog.md` · `docs/domain-rules.md` · `docs/data-access-rules.md` · `docs/qa-rules.md`
· `docs/ui-rules.md` · session log `docs/sessions/2026-06-02-task-363-*`.

## Current broken behavior (file evidence)
- `shared/PhoneField.tsx:75-82` `handleNationalChange`: `replace(/[^\d\s\-().]/g,'')` — allows spaces/dashes AND unlimited
  length; no 9-digit cap; no live max enforcement.
- `lib/phone/index.ts`: `E164_GUARD=/^\+[1-9]\d{7,14}$/` (8–15 digits, NOT AL-specific 9); `validateNationalPhone` relies
  on libphonenumber `isValid()` only — no explicit AL national length = 9 enforcement; runs on submit, not on input.
- `messages/*.json` `phone_placeholder="+355 XX XXX XXXX"` repeats the dial code.

## Required after behavior
- **Input-level filtering:** for AL (and per-country digit length where libphonenumber provides it), the national input
  accepts digits only; letters and symbols are blocked at keystroke; max length capped at the country's national digit
  count (AL = 9) so a 10th digit cannot be typed. Visual separators may be shown/formatted but the stored/validated value
  is the raw digit string.
- **Paste handling:** pasting a mixed string (letters/symbols/`+355`/spaces) is sanitized to the canonical national digits
  and truncated/validated to the country length; if it cannot yield a valid national number, reject with a localized error.
- **Validation:** <9 AL digits → localized error (too short); >9 blocked at input (cannot occur); non-digit → blocked;
  Cyrillic/letters → blocked; result is a valid E.164 only when the national part matches the country length + libphonenumber.
- **Schema/server guard:** the server/action validation enforces the same (no client-only trust) — locate and align it.
- **Placeholder:** national-only AL mask (e.g. `68 123 45 67` or `XX XXX XX XX`) in ALL 4 locales; never includes `+355`.
- **Tests:** cover valid 9-digit, too short (8), too long (10 — must be impossible at input), letters, symbols, Cyrillic,
  paste-mixed, paste-with-+355. Locale parity for new/changed error keys (`check:i18n` PASS).

## Exact files to inspect
`shared/PhoneField.tsx`, `lib/phone/index.ts`, `lib/phone/__tests__/phone.test.ts`, `messages/*.json`,
`ui/input.stories.tsx`, server/action phone validation (grep `validateNationalPhone`/`phone` in `modules/auth`,
`modules/admin`, `modules/cabinet`).
## Exact files allowed to edit
The files above + `docs/backlog.md` + new session log. **Explicitly ALLOWED (amendment 5): the server/action files that
call `validateNationalPhone` OR that persist/validate the phone value server-side** — i.e. the auth / register /
admin-user-create / admin-user-profile / cabinet server actions and any Zod/schema guard surfaced by
`rg "validateNationalPhone"` and the phone-persistence grep across `modules/auth`, `modules/admin`, `modules/cabinet`.
Edit them to enforce the SAME exactly-9-digit AL rule on the server (no client-only trust; AC4 maps here). Do NOT
broaden beyond phone validation/persistence in those files. STOP&ASK before changing the country-length policy for
non-AL.

## Current behavior to preserve
Dial-code Combobox (separate), multi-country support, E.164 output contract, existing call sites (AuthSheet, RegisterForm,
AdminUserCreate, AdminUserProfile, cabinet).

## Positive flow
1. User types `681234567` → accepted; formatted display optional; stored national = `681234567`; E.164 `+355681234567`.
2. Typing a 10th digit → ignored (max reached). 3. Pasting `+355 68 123 45 67` → sanitized to `681234567`. 4. Submit with
9 valid digits → passes; <9 → localized error.

## Negative flow
- 8 digits → localized "too short" error, no submit. - Letters/symbols typed → blocked at keystroke (cannot enter).
- Cyrillic → blocked. - Paste mixed garbage → sanitized or localized reject. - Empty → localized required error.
- Locale switch → error/placeholder localized in sq/en/uk/it (no English leak).

## Acceptance criteria (visible + file-verifiable, negative branch each)
- AC1 AL national input accepts ONLY digits and caps at 9 — verifiable at `PhoneField.tsx`:line (onChange/onKeyDown/maxLength
  + sanitize) + `input.stories.tsx` Phone story (interactive). Negative: 10th digit cannot be entered; letters blocked.
- AC2 <9 digits → localized error key in all 4 locales — verifiable at `lib/phone/index.ts`:line + `messages/*`.
- AC3 Paste sanitization to canonical national digits — verifiable in tests + handler.
- AC4 Server/action validation enforces the same rule (no client-only) — file:line.
- AC5 `phone_placeholder` national-only in all 4 locales (no `+355`) — `messages/*`.
- AC6 Tests cover valid/short/long/letters/symbols/Cyrillic/paste — `phone.test.ts`; all pass.
- Grep gate: `rg "[^\\\\d]" enforcement present; no path allows letters into stored value.

## Out of scope
Tabs/Button/Dialog/FilterBar/stories-sweep; changing dial-code list; non-AL length policy (STOP&ASK); multilingual
settlements (Task 368).

## Required validation
`npx tsc --noEmit` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook` · `npm test` (phone tests) ·
AC self-audit · Manual QA.

## Manual QA checklist (OWNER QA REQUIRED for rendered)
Locales sq/en/uk/it. Breakpoints 320·375·390·480·560·680·768·810·960·1024·1200·1440·1920·2560 (uk@320/375/390 mandatory).
Try: type letters (blocked), 10 digits (capped at 9), 8 digits (error), paste `+355…` (sanitized), each locale error text.

## Final report requirements
Before/after behavior table; AC table with file:line; test list + results; locale parity proof; server-guard file:line;
Files Changed table. NO `git add`/`commit`.
