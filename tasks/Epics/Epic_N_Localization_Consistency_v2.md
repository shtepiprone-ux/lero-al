# Epic N — Localization Consistency v2

**Status:** OPEN — opened 2026-05-22 by the Opus 4.7 orchestrator. Follow-up to the (closed) Epic A.
**Source notes:** issues.txt #15 (locale mixing across pages), #31 (admin locale resets to default on filter toggle), #4 (browser keeps offering to translate the page).
**Kickoffs:** N.1 (Task 179) and N.3 (Task 180) are in **Sprint 9** (individual kickoffs); N.2 (Task 184) is in `Epic_N_kickoff_prompts.md`.

> Epic A delivered the locale audit + API error contract (Tasks 91, 103–106) and middleware cookie
> sync (Task 105). Despite that, real-world locale mixing persists. This epic does a deeper audit and
> fixes the two structural causes the owner reports: per-page string mixing and the `<html lang>`
> defect that makes the browser offer to translate.

## Goal

When the user picks a language, the WHOLE app stays in that language — every page, public and admin,
across navigations and filter changes — and the browser stops offering to auto-translate.

## Dependencies

- next-intl + `messages/{sq,en,uk,it}.json`; middleware locale cookie (Task 105).
- Root layout `src/app/layout.tsx` and locale layout `src/app/[locale]/layout.tsx`.

## Tasks

### Task 179 — N.1 — Deep locale-mixing audit + fixes (Note 15)

**Type:** bug / audit
**Priority:** critical
**Area:** site-wide i18n (components + messages)

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md (i18n rules; Global Change Verification Rule)
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/analytics-rules.md (only if SEO strings involved), prior Epic A session logs
4. `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`; next-intl config;
   `src/app/[locale]/layout.tsx`

**Localization coverage:** sq, en, uk, it — runtime locale switching MUST be visually confirmed page
by page (matching key counts is NOT sufficient).
**Responsive coverage:** N/A for the audit; if any layout shifts when strings change, cover all 7.

**Goal:** Find and fix WHY pages mix languages — i.e. some strings stay in one language while the rest
follow the active locale. Likely causes to investigate: hardcoded literals bypassing `useTranslations`,
keys missing in one catalog (silent fallback to default/sq), server vs client locale mismatch, stale
locale cookie, or a layout that doesn't thread the active locale. Produce a findings list, then fix.

**Acceptance criteria:**
- A documented inventory of every mixing source found (file + cause), in the session log.
- Every user-visible string resolves through i18n in all four catalogs (same key set across all four).
- Switching locale changes 100% of visible strings on each audited page at runtime — no leftovers.
- 0 new lint/typecheck errors; `npm run build` passes.

**Out of scope:** the `<html lang>` browser-translate fix (N.2); admin persistence (N.3) — unless the
audit proves they share a root cause, in which case note it and STOP to confirm with the orchestrator.

### Task 180 — N.3 — Admin↔site two-way locale persistence (Note 31)

**Type:** bug
**Priority:** high
**Area:** admin pages locale handling + middleware cookie sync

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. docs/state-authority.md, Task 105 session log (locale persistence site↔admin)
4. admin pages with filters; middleware (locale cookie); `LocaleSwitcher`

**Localization coverage:** sq, en, uk, it.
**Responsive coverage:** 320, 375, 390, 768, 1280, 1440, 2560 (admin shell).

**Goal:** Fix: an admin/moderator who chose a non-default locale sees it correctly until they toggle a
filter on an admin page — then the locale snaps back to default. The chosen locale must persist across
filter toggles and navigations, and stay synced both ways between site and admin (the user's chosen
locale is the single authority, regardless of where it was set).

**Acceptance criteria:**
- Toggling any admin filter does NOT change the active locale.
- The chosen locale persists across admin navigations and is identical between site and admin.
- Root cause fixed deterministically (no forced reload / no cookie clearing hack — see Auth/Nav rules).
- 0 new lint/typecheck errors; `npm run build` passes; all four locales; all 7 breakpoints.

**Out of scope:** the broader string-mixing audit (N.1); `<html lang>` (N.2).

### Task 184 — N.2 — Fix `<html lang>` so the browser stops offering to translate (Note 4)

**Type:** bug
**Priority:** medium
**Area:** root + locale layout document language

**Pre-read:**
1. docs/backlog.md, docs/ai-behavior.md (SSR/Hydration rules)
2. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md
3. `src/app/layout.tsx` (root `<html>` — currently NO `lang`), `src/app/[locale]/layout.tsx`
   (locale is set on a `<div lang={locale}>`, NOT on `<html>`)

**Localization coverage:** sq, en, uk, it (the `lang` value, not visible text).
**Responsive coverage:** N/A.

**Goal:** The browser decides whether to offer translation from the `<html lang>` attribute. Today the
root `<html>` has no `lang` and the active locale is only on an inner `<div>`, so the browser keeps
offering to translate (e.g. to Ukrainian) regardless of active locale. Set `lang` on the `<html>`
element to the active locale. Resolve the App-Router constraint that the root layout sits above the
`[locale]` segment WITHOUT introducing `suppressHydrationWarning` abuse or `typeof window` branches
(SSR/Hydration rules). If the chosen approach is ambiguous, STOP and ask the orchestrator.

**Acceptance criteria:**
- `<html lang>` reflects the active locale (sq/en/uk/it) on every route.
- Browser no longer auto-prompts to translate when the active locale matches the content.
- No `suppressHydrationWarning` added to mask a mismatch; no viewport/`typeof window` hacks.
- 0 new lint/typecheck errors; `npm run build` passes.

**Out of scope:** string-level mixing (N.1); admin persistence (N.3).

## Epic-level acceptance

No page mixes languages at runtime; locale persists across site/admin and filter toggles; `<html lang>`
matches the active locale and the browser stops offering to translate.
