# Kickoff prompt — Task 179 (Sprint 9 — N.1: deep locale-mixing audit + fixes)

> Note 15: when the user changes language, some pages/parts stay in one language while others follow the
> active locale. Epic A already did a locale audit (Tasks 91, 103-106) and middleware cookie sync
> (Task 105), yet mixing persists — so this is an AUDIT-FIRST task: find the real sources, document them,
> then fix. Locale parity is "matching key counts" PLUS "every visible string actually changes at runtime".

```
You are Claude Code Sonnet 4.6 working in `lero-al`.

Hard contract:
- Do NOT change scope: this is the string-level locale-MIXING problem. The `<html lang>` browser-translate
  fix is Task 184; admin-filter locale reset is Task 180. If your audit proves they share ONE root cause,
  STOP and tell the orchestrator before merging the work.
- Do NOT invent architecture. Use next-intl + messages/*.json as they exist. No new i18n library/config.
- Deliver a findings inventory FIRST (file + cause per mixing source) in the session log, then fix.
- i18n rule: all four catalogs (sq/en/uk/it) must hold the same key set; runtime switching must change
  100% of visible strings on each audited page (not just key-count parity).
- Update docs/backlog.md + add docs/sessions/2026-05-22-task-179-locale-mixing-audit.md.
- 0 new lint/typecheck errors; governance PASS.
- Commit + push: SINGLE `git add -A`, then `git log -1` (paste real output). Owner runs git/SQL.

Pre-read:
- messages/sq.json, messages/en.json, messages/uk.json, messages/it.json
- next-intl config (i18n request config / middleware), src/app/[locale]/layout.tsx
- Epic A session logs (2026-05-19 tasks 91, 103-106) for what was already audited
- docs/ai-behavior.md (Localization Rules), docs/analytics-rules.md (only if SEO strings are in scope)

Required investigation (audit, then fix):
1. Grep for hardcoded user-visible literals that bypass useTranslations() (the classic mixing cause).
2. Find keys present in some catalogs but missing/empty in others → silent fallback to sq/default
   (looks like "mixing"). Reconcile the key sets.
3. Check server vs client locale resolution mismatches and any place the active locale isn't threaded.
4. Walk the main flows in each locale (home, listings, listing detail, cabinet, auth) and record every
   string that does NOT switch. Fix each at the i18n layer (no hardcode, no per-page patch that hides it).

Acceptance criteria:
- Session log contains the full mixing inventory (file + cause) and the fix applied to each.
- Every user-visible string resolves through i18n; all four catalogs share one key set.
- Switching locale changes 100% of visible strings on each audited page at runtime (verified, documented).
- 0 new lint/typecheck errors; npm run build passes.

Out of scope:
- `<html lang>` / browser auto-translate (Task 184); admin-filter locale reset (Task 180).
```
