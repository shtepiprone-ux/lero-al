> # 🔴 REVIEW #2 VERDICT 2026-06-05: REJECTED — file-integrity corruption (read this FIRST)
> The email-hygiene INTENT is now correct: the 4 `{'...'}` brace-wraps are reverted to plain text, the footer is plain
> Albanian, `src/modules/notifications/**` stays in scanner scope, locale parity is intact (1768×4). **But the write
> introduced corruption that makes the redo un-committable — same truncation/encoding gremlin as the 395 reject:**
>
> 1. **🔴 `scripts/i18n-hardcode-baseline.json` is truncated to a lone `{`** → invalid JSON → `check:i18n-hardcode`
>    EXITS 1 (`⚠️ Baseline file is not valid JSON`). The intended accepted entry for `Ekipi i Lero.al` never landed.
> 2. **🔴 `BaseEmail.tsx` contains 12 embedded NUL bytes**; **🔴 `PasswordChangedEmail.tsx` contains 4 NUL bytes**
>    (`tr -cd '\000' | wc -c`). `git`/`grep` see them as **binary files**. NUL bytes in `.tsx` break the TS compiler —
>    so any `tsc=0` claim in the session log is impossible; re-verify.
>
> **Re-do bar (round 2):**
> - Rewrite `BaseEmail.tsx` and `PasswordChangedEmail.tsx` as clean UTF-8, NO NUL bytes (`tr -cd '\000' < f | wc -c` = 0
>   for every touched file), `node`/`tsc` clean. Verify the intended plain-text Albanian content is intact.
> - Regenerate a VALID `i18n-hardcode-baseline.json` via `npm run check:i18n-hardcode:update-baseline`, then OPEN the file
>   and confirm it is valid JSON (`python -c "import json,sys;json.load(open(...))"` / `node -e "JSON.parse(...)"`) and
>   ends properly (Task 395 truncation lesson — re-read the file end). It must contain the accepted sq-only email entry
>   with its justification mirrored in `docs/i18n-hardcode-audit.md`.
> - `check:i18n-hardcode` GREEN; **negative-flow proof:** plant an English string in an email file → gate FAILS (proves
>   notifications still scanned, no blind spot) → revert.
> - `tsc=0`, `lint=0`; Files Changed table matches the real diff. **Self-audit MUST include a `tr -cd '\000'` zero-NUL
>   check on every touched file and a `JSON.parse` check on the baseline** — these are the two things that just failed.
>
> ---
>
> # 🟠 REVIEW #1 VERDICT 2026-06-05: MOSTLY CORRECT — small email-hygiene RE-DO before commit (superseded by REVIEW #2)
> The UI/component remediation is **approved in substance**: `dialog`/`sheet` → `t('common.close')`, `pagination`
> → `t('ui.pagination.aria_*'/'aria_ellipsis')` (4-locale parity confirmed), `command`, breadcrumbs, admin files,
> `LocationCombobox`, auth/modules — all genuine `t()` calls, locale parity 1768×4, `primitives-dialog:['Close']`
> crutch removed, baseline emptied. **Do NOT touch the UI part.** Email content being Albanian is CORRECT per the
> Albanian-only outbound-email policy (Epic GG / Task 251 / `docs/integrations.md` "Outbound email language policy").
>
> **The ONLY rejection is the METHOD used to clear the email-layer findings from the scanner — fix this, then it ships:**
>
> **🔴 Remove the scanner-evasion, keep the email layer IN scanner scope (no blind spot).** Findings were cleared by
> (a) wrapping literals in `{'...'}` expression containers and (b) relying on non-ASCII Albanian dodging `isEnglishish`.
> Both hide strings instead of declaring them. Owner-confirmed requirement (no email blind spot):
> 1. **Revert all 4 `{'...'}` brace-wraps to plain text** — `BaseEmail.tsx` (`Tregu kryesor i pasurive të paluajtshme
>    në Shqipëri`, `Qendra e ndihmës`, `Privatësia`) and `PasswordChangedEmail.tsx` (`Ekipi i Lero.al`). The non-ASCII
>    ones pass `isEnglishish` naturally; the wrap was pointless.
> 2. **Do NOT path-SKIP `src/modules/notifications/**`** — keep it scanned, so future *English* hardcode in a sq-only
>    email (a real bug) is still caught.
> 3. **For the few ASCII-Albanian email strings that `isEnglishish` false-flags** (e.g. `Ekipi i Lero.al`): add them to
>    the scanner **baseline as documented accepted entries** with reason `"sq-only email per Epic GG — correct Albanian
>    content"`. Baseline is the honest, visible accept-mechanism — not brace-wrapping. (Result: baseline is not strictly
>    empty, but every entry is an explicit, justified accept; `check:i18n-hardcode` stays green; NEW English in emails
>    still fails the gate.)
>
> **Re-submission bar:** no `{'...'}` literal-evasion remains in the diff (`git grep "{'"` on the touched email files is
> clean); `src/modules/notifications/**` still in scanner scope; the accepted email entries are in `i18n-hardcode-baseline.json`
> with justifications (and mirrored in `docs/i18n-hardcode-audit.md`); `check:i18n-hardcode` green; a negative-flow plant
> of an *English* string in an email file still FAILS the gate (proves no blind spot); `tsc=0`, `lint=0`; Files Changed
> table matches the diff. UI/component remediation untouched. Scanner-hardening against `{'...'}` evasion = separate Task 399.

---

# Sprint 34 — Task 397 — Burn down the i18n-hardcode baseline (batched remediation of ALL findings from Task 396)

> **Follow-up to Task 396** (static scanner + full inventory + 'fail-on-new' CI gate). This task **fixes** every
> hardcode in the committed `docs/i18n-hardcode-audit.md` / `scripts/i18n-hardcode-baseline.json`, batch by batch,
> until the baseline is empty and the gate runs in strict (zero-tolerance) mode. **Read `docs/agent-contract.md`
> (1–13) FIRST.** STOP & ASK if a translation or namespace is ambiguous — never guess a translation.
>
> **🔴 DEPENDS ON Task 396 approved first** (it produces the authoritative inventory + baseline this task burns down)
> and on **Task 395** (the working render gate that re-proves the story-covered fixes).

```
Type:        fix (i18n remediation, batched) — product code (src/**) + locale keys (all 4)
Priority:    HIGH
Area:        src/** components flagged by 396; messages/{en,sq,uk,it}.json; scripts/i18n-hardcode-baseline.json
             (shrinks each batch); scripts/check-locale-leak.mjs (remove the temporary primitives-dialog:['Close'] crutch)
```

## Why batched
The 396 audit will list dozens of findings across primitives, layout, admin, pages, and modules. Remediating all at
once produces an unreviewable diff. Fix in **labelled batches by area** (each batch = one reviewable commit), removing
the corresponding entries from the baseline as they are fixed, so the gate tightens monotonically.

## Known starting set (from the 396 grep; the audit is authoritative)
- `sr-only`: `dialog.tsx` "Close", `sheet.tsx` "Close" → existing `common.close` (en "Close" · sq "Mbyll" · uk "Закрити"
  · it "Chiudi"). `pagination.tsx` "More pages" → NEW `common.more_pages` (4 locales).
- `aria-label`: breadcrumb "Breadcrumb" (favorites/listings/[slug]); `pagination` "Go to previous/next page";
  `AdminSupportManager` "Clear selection"; `Footer` "Facebook"/"Instagram" (proper nouns — likely allowlist, confirm);
  `AvatarCropModal` "Avatar crop area; drag to position"; `AuthRedirect` "Loading…"; `ListingsPagination` "Pagination".
- Plus everything else the 396 scanner surfaces.

## Pre-read (mandatory)
- `docs/agent-contract.md` (1–13) · `docs/backlog.md` · `docs/i18n-hardcode-audit.md` (the inventory)
- `docs/rule-index.md` → "UI / layout / component task" bundle + `docs/ai-behavior.md` "Localization (i18n) Rules"
  + Note 14 "global-change rule" (fix EVERY sibling/consumer of a shared string, not one call site).
- The relevant `messages/*.json` namespaces (`common`, layout/admin namespaces as needed).

## Positive flow (per batch)
- Pick one area batch (e.g. "ui primitives", "layout breadcrumbs", "admin", "auth/modules", "pages").
- Replace each hardcoded literal with an i18n key (reuse existing keys where present — `common.close`, etc.; add new
  keys with **4-locale parity** otherwise). Client components use `useTranslations`; server components use the project's
  server-side translator per existing patterns.
- Remove the fixed entries from `scripts/i18n-hardcode-baseline.json`.
- Where a flagged token is a genuine proper noun/brand (e.g. Footer "Facebook"/"Instagram"), move it to the scanner's
  language-neutral allowlist instead of a key — and justify it in the session log.
- Remove the temporary `primitives-dialog: ['Close']` entry from `check-locale-leak.mjs` once dialog is fixed.

## Negative flow
- **Parity miss:** any new key added to en only → `check:stories`/`check:i18n-hardcode`/parity gate FAILS → add all 4.
- **Provider-less render:** a primitive using `useTranslations` rendered outside `NextIntlClientProvider` throws →
  confirm provider coverage; do NOT add a silent English fallback (recreates the leak) — STOP & ASK.
- **Behavior regression:** controls (close buttons, pagination prev/next, clear-selection) keep working — click/Esc/
  backdrop/focus-return unchanged; ≥44px touch targets; icon-only controls stay exempt under clause 11.
- **Baseline drift:** the baseline must SHRINK, never grow; the 'fail-on-new' gate stays green throughout.

## Acceptance criteria (machine-proven)
- After the final batch: `scripts/i18n-hardcode-baseline.json` is EMPTY and `check:i18n-hardcode` passes in STRICT mode
  (zero findings, not just zero-new); flip the gate from 'fail-on-new' to strict in the same final change.
- `check:locale-leak` green with the `primitives-dialog:['Close']` crutch REMOVED (story-covered fixes re-proven on the
  395 gate); `check:stories`=0; `screenshots:assert` unaffected; `tsc=0`; `lint=0`.
- Runtime locale check in sq/uk/it for a sample of fixed surfaces (close button accessible name, breadcrumb, pagination)
  shows translated values, not English.
- Each batch = one reviewable commit with its own Files Changed table; final session log lists every key added (×4) and
  every file touched, matching the real diff.
- **No `git add`/`commit` from the executor** — orchestrator emits per-batch commits on review.

## Out of scope
- The scanner/gate implementation (Task 396). Notification/email/toast dynamic-key i18n (Epic II P2).
- Restyling any component; changing control types; adding stories (coverage is the scanner's job, not stories).
