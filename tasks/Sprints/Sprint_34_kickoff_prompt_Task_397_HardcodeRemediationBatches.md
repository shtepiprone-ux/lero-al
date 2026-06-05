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
