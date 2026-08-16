# Task 753 — The three homepage components with no Mantine at all

**Sprint:** 60 · **Type:** Mantine migration · **QA profile:** `Q2 Standard UI` · **Status:** KICKOFF FILED

## Objective

Migrate the three components in the `/[locale]` render graph that import **nothing** from `@mantine/*` and
render their own markup with raw Tailwind. **Zero visual delta (D28).**

Unlike 752, these are not residue — they were never migrated.

## Exact current state — read 2026-08-16, verify before editing

### 1. `src/components/auth/CaptchaWidget.tsx` (70 lines)

| Line | Current |
|---|---|
| 31 | `<p className="text-xs text-muted-foreground text-center py-1" role="note">` |
| 65 | `className="w-full"` (on the `<Turnstile>` wrapper) |

Imports `@marsidev/react-turnstile` — **the Turnstile widget itself is third-party and is not migrated.**
Only the surrounding markup is in scope.

### 2. `src/modules/auth/components/AuthRedirect.tsx` (117 lines)

| Line | Current |
|---|---|
| 113 | `<div className="min-h-[60vh] flex items-center justify-center" aria-live="polite">` |
| 114 | `<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label={tc('loading')} />` |

`min-h-[60vh]` is an **arbitrary value**, so `check:design-tokens` sees it — confirm whether it currently
carries a `design-tokens-allow:` marker before touching it, and keep the gate green either way.

### 3. `src/components/ui/PasswordRequirementsHint.tsx` (56 lines)

| Line | Current |
|---|---|
| 21 | `<li className={cn('flex items-start gap-1.5 text-xs', met ? 'text-status-success' : 'text-muted-foreground')}>` |
| 23, 25 | `<Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />` · `<X className="h-3.5 w-3.5 shrink-0 mt-0.5" />` |
| 43 | `<div data-testid="password-requirements-hint" className="flex flex-col gap-1 mt-1">` |
| 45 | `<p className="text-xs text-destructive">{t('password_requirements_error')}</p>` |
| 47 | `<ul className="flex flex-col gap-1">` |

**This file lives under `src/components/ui/`** — the legacy shadcn directory. It is the one primitive
`AuthSheet` still imports from there (`AuthSheet.tsx:16`). Migrating it in place is correct for this task;
**moving the file is out of scope** and would break that import for no benefit here.

## Replacement rules

- Semantic text → Mantine `Text` with the matching `size`/`c`. `text-xs` = 12px; `text-muted-foreground` →
  `c="dimmed"`; `text-destructive` → the error colour already used by the theme — **find the existing
  consumer and match it**, do not pick a colour.
- `text-status-success` is a project semantic token from `globals.css`. Keep the token; do not substitute a
  Mantine palette shade.
- Layout → `Group` / `Stack` with px-equal gaps (`gap-1` = 4px, `gap-1.5` = 6px).
- Icons → `size` prop (`h-3.5 w-3.5` = 14px, `h-8 w-8` = 32px).
- **`<li>` and `<ul>` must remain `<li>` and `<ul>`** — `PasswordRequirementsHint` is a list and screen
  readers depend on it. Use `component="li"` / `component="ul"` if you use Mantine wrappers.
- `animate-spin` on `AuthRedirect:114`: Mantine `Loader` is the canonical spinner. If you swap `Loader2` →
  Mantine `Loader`, **that is a visual change** and needs the rendered comparison to prove equivalence, or an
  explicit note that it differs. If it differs, keep `Loader2` + `animate-spin` and say so.

## Preserve exactly

- `role="note"` (`CaptchaWidget:31`) · `aria-live="polite"` (`AuthRedirect:113`) ·
  `aria-label` (`AuthRedirect:114`) · `aria-hidden="true"` on both icons (`PasswordRequirementsHint:23,25`) ·
  `data-testid="password-requirements-hint"` (`:43`).
- `allPasswordRulesMet` is exported from `PasswordRequirementsHint` and imported by `AuthSheet.tsx:16`.
  **Its signature and behaviour are untouched.**
- Every `t()` key. No new i18n keys — the strings already exist.

## Out of scope

`AuthSheet` itself (Task 757) · the Turnstile third-party widget · moving files out of `components/ui/` ·
any other file.

## Acceptance criteria

- **AC1** — all three files import from `@mantine/*` and render no raw Tailwind layout/typography utilities, or the report names each survivor with its reason.
- **AC2** — rendered evidence, zero visual delta, at 320 / 390 / 768 / 1024 / 1440, `uk@320` mandatory, for: the captcha note, the auth redirect spinner state, and the password-requirements list in both met and unmet states.
- **AC3** — every ARIA attribute and the `data-testid` listed above survives, verified in the rendered DOM, not by reading the source.
- **AC4** — `allPasswordRulesMet`'s export signature is unchanged and `AuthSheet` still compiles against it.
- **AC5** — `npm run typecheck`, `check:design-tokens`, `check:i18n`, `npm run build` all exit 0.
- **AC6** — `check:design-tokens` stays green on `min-h-[60vh]`, whether by keeping its existing marker or by removing the arbitrary value entirely. State which.

## Report contract

Changed files with line numbers; every utility migrated or kept with the reason; whether `Loader2` was
replaced and the evidence either way; commands with actual output; rendered evidence locations.

Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED`. Never self-approve.
