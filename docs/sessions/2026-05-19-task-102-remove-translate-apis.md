# Task 102 — Remove Google Translate API and DeepL API integrations

**Date:** 2026-05-19
**Sprint:** Sprint 1 — Bugfix Continuation & Admin Polish
**Status:** ✅ PASS

---

## Investigation

### Scope of Google Translate / DeepL references

| Location | Reference | Action |
|----------|-----------|--------|
| `src/lib/translation/providers.ts` | `GoogleTranslateProvider` class, `DeepLProvider` class, `GOOGLE_TRANSLATE_API_KEY`, `DEEPL_API_KEY` env vars | ✅ Removed |
| `scripts/validate-production-lcp.mjs` | `googleapis.com/pagespeedonline` | ✘ KEPT — this is the Google PageSpeed Insights API, not a translation service |
| `package.json` | No `googleapis`, `@deepl/*`, `deepl-node` packages | Nothing to remove |
| `.env.local` | No `GOOGLE_TRANSLATE_API_KEY` or `DEEPL_API_KEY` vars | Nothing to remove |
| `docs/env.md` | No translation API vars documented | Nothing to update |
| `docs/integrations.md` | No translation provider section | Nothing to update |
| `docs/dependencies.md` | No translation package entries | Nothing to update |

### Implementation in `providers.ts`

The Google Translate and DeepL providers were implemented as plain `fetch()` calls with no npm packages. The factory `getTranslationProvider()` used env vars to select the provider:

```ts
const googleKey = process.env.GOOGLE_TRANSLATE_API_KEY
const deepLKey  = process.env.DEEPL_API_KEY

if (googleKey) return new GoogleTranslateProvider(googleKey)
else if (deepLKey) return new DeepLProvider(deepLKey)
else return new MyMemoryProvider()
```

Neither env var was set in `.env.local`, so `MyMemoryProvider` was already the active provider in production.

---

## Implementation

Simplified `src/lib/translation/providers.ts`:

1. **Removed** `GoogleTranslateProvider` class (29 lines)
2. **Removed** `DeepLProvider` class (36 lines)
3. **Simplified** `getTranslationProvider()`:
   ```ts
   // Before:
   if (googleKey) _provider = new GoogleTranslateProvider(googleKey)
   else if (deepLKey) _provider = new DeepLProvider(deepLKey)
   else _provider = new MyMemoryProvider()
   
   // After:
   if (!_provider) _provider = new MyMemoryProvider()
   ```
4. **Updated** header comment to reflect single-provider architecture.

`MyMemoryProvider` is kept — it's free, requires no API key, and supports `MYMEMORY_API_KEY` (optional) for higher rate limits. `src/app/api/translate/route.ts` is unchanged.

---

## Files changed

- `src/lib/translation/providers.ts`
- `docs/backlog.md`
- `docs/sessions/2026-05-19-task-102-remove-translate-apis.md` (this file)

---

## Validation

| Command | Result |
|---------|--------|
| `grep -rn "GOOGLE_TRANSLATE\|DEEPL" src/ scripts/ package.json` | ✅ 0 matches |
| `npm run lint` | ✅ 0 errors / 5 warnings (pre-existing) |
| `npm run typecheck` | ⚠️ 4 pre-existing test errors, 0 new |
| `npm run build` | Not run (per policy — user runs manually) |
