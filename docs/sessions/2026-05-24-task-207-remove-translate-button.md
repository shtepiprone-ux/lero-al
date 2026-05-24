# Task 207 — T.3: Remove dead "Translate" button

**Date:** 2026-05-24  
**Epic:** T — Global UX Polish & Forms  
**Status:** ✅ Complete

## Background

Task 102 removed the Google Translate + DeepL APIs, but left the "Translate" button UI in place. The button called `/api/translate` which called the (now-dead) providers — resulting in a broken UX. This task removes all the dead code.

## Files deleted

| File | Reason |
|------|--------|
| `src/modules/listings/components/ListingDescriptionTranslator.tsx` | Dead component — translate button, loading/error states, client cache |
| `src/app/api/translate/route.ts` | Dead API route — rate-limiting, server cache, provider call |
| `src/lib/translation/providers.ts` | Dead translation provider abstraction (MyMemory) |
| `src/lib/translation/` directory | Now empty; removed |

## Files edited

### `src/app/[locale]/listings/[slug]/page.tsx`
- Removed import: `import { ListingDescriptionTranslator } from '@/modules/listings/components/ListingDescriptionTranslator'`
- Replaced `<ListingDescriptionTranslator description={...} label={...} />` with a plain description card:
  ```tsx
  <div className="rounded-2xl border bg-card shadow-sm p-5">
    <h2 className="font-bold text-lg mb-3">{t('description_label')}</h2>
    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{listing.description}</p>
  </div>
  ```

### `messages/en.json`, `messages/sq.json`, `messages/uk.json`, `messages/it.json`
Removed 5 keys × 4 locales from `listing` namespace:
- `translate_btn`
- `translating`
- `show_original`
- `translated_automatically`
- `translation_error`

## Verification

- `grep` across `src/` → 0 references to `ListingDescriptionTranslator`, `api/translate`, `lib/translation`
- `grep` across `messages/` → 0 occurrences of any of the 5 removed keys
- Deleted stale `.next/types` cache entries left over from prior build
- `tsc --noEmit` → 0 errors
