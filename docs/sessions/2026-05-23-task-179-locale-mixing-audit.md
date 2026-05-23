# Task 179 — N.1: Deep Locale-Mixing Audit + Fixes

**Date:** 2026-05-23  
**Sprint:** 9  
**Type:** i18n audit / locale-mixing fix

## Pre-Audit Checks

### Key parity
All 4 locale files (`sq`, `en`, `uk`, `it`) had **identical key sets**: 1066 leaf keys each, zero missing.
Parity check command: `node -e "flatten all 4 files, compare sets"` → OK.

### Locale routing
- `src/i18n/routing.ts` — `locales: ['sq','en','uk','it']`, `defaultLocale: 'sq'`, `localeDetection: false`
- `src/i18n/request.ts` — `getRequestConfig` loads `messages/${locale}.json`
- `src/app/[locale]/layout.tsx` — `setRequestLocale(locale)` + `<NextIntlClientProvider locale={locale} messages={messages}>`
- `src/middleware.ts` — `createMiddleware(routing)` handles i18n routing; admin-locale cookie synced from URL locale

Architecture is correct: locale threaded via URL segment, no client-side fallback storage.

## Findings Inventory

| # | File | Bug | Effect |
|---|------|-----|--------|
| 1 | `src/modules/notifications/components/NotificationItem.tsx:65` | `formatDistanceToNow` missing `locale` option | Relative timestamps in notifications panel always render in English regardless of active locale |
| 2 | `src/components/layout/Header.tsx:216` | `Dashboard` hardcoded string in admin/moderator header link | Admin-role users see "Dashboard" regardless of locale |
| 3 | `src/modules/listings/components/steps/StepLocation.tsx:52-57` | Labels `GPS (optional)`, `Latitude`, `Longitude` hardcoded English | Listing creation form GPS section never switches locale |
| 4 | `src/components/layout/MobileBottomNav.tsx:27` | `aria-label="Main navigation"` hardcoded | Mobile nav landmark always English for screen readers |

**Not mixing (confirmed OK):**
- `ui/pagination.tsx` hardcoded aria-labels — unused in user-facing code (`from '@/components/ui/pagination'` → 0 matches)
- `AvatarCropModal.tsx` — only used in admin (`AdminUserAvatar.tsx`), outside locale routing
- `LocationCombobox` `placeholder="Nazva (alb.)"` — in admin-only "add location" sub-flow (only shown when `onAddLocation` prop present, which only admin pages supply)
- `RelativeTime.tsx` — correctly uses `useLocale()` + `DF_LOCALE_MAP`
- `DatePicker.tsx` — uses `Intl.DateTimeFormat(locale, ...)` for visible labels; `format(day, 'dd.MM.yyyy')` is locale-neutral (numeric format)
- `NotificationItem.tsx` notification `title`/`body` — stored in DB; language depends on notification generation time (expected, not a mixing bug)
- Location names (`name_al`) — domain constraint; stored in Albanian only; not an i18n issue

## Fixes Applied

### Fix 1 — `NotificationItem.tsx` — locale-aware relative time

```diff
-import { useTranslations } from 'next-intl'
+import { useTranslations, useLocale } from 'next-intl'
 import { formatDistanceToNow } from 'date-fns'
+import { enUS, it, uk, sq } from 'date-fns/locale'
+import type { Locale as DfLocale } from 'date-fns'
+
+const DF_LOCALE_MAP: Record<string, DfLocale> = { sq, en: enUS, uk, it }

 export function NotificationItem(...) {
   const t = useTranslations('notifications')
+  const locale = useLocale()
+  const dfLocale = DF_LOCALE_MAP[locale] ?? enUS

-  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
+  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dfLocale })}
```

### Fix 2 — `Header.tsx` — translate admin link

```diff
-                          Dashboard
+                          {t('admin_dashboard')}
```

New key `nav.admin_dashboard` added to all 4 locales:
| Locale | Value |
|--------|-------|
| sq | "Paneli i adminit" |
| en | "Dashboard" |
| uk | "Адмін-панель" |
| it | "Dashboard" |

### Fix 3 — `StepLocation.tsx` — translate GPS labels

```diff
-          GPS (optional)
+          {t('field_gps_label')}
-            <Label htmlFor="lat">Latitude</Label>
+            <Label htmlFor="lat">{t('field_lat')}</Label>
-            <Label htmlFor="lng">Longitude</Label>
+            <Label htmlFor="lng">{t('field_lng')}</Label>
```

New keys in `listing` namespace, all 4 locales:
| Key | sq | en | uk | it |
|-----|----|----|----|----|
| `field_gps_label` | GPS (opsionale) | GPS (optional) | GPS (необов'язково) | GPS (opzionale) |
| `field_lat` | Gjerësia gjeografike | Latitude | Широта | Latitudine |
| `field_lng` | Gjatësia gjeografike | Longitude | Довгота | Longitudine |

### Fix 4 — `MobileBottomNav.tsx` — translate aria-label

```diff
+  const tc = useTranslations('common')
-    aria-label="Main navigation"
+    aria-label={tc('aria_main_nav')}
```

New key `common.aria_main_nav`:
| sq | en | uk | it |
|----|----|----|----|
| Navigimi kryesor | Main navigation | Головна навігація | Navigazione principale |

## Post-Fix Verification

- Key parity: **1071 keys** across all 4 locales (was 1066; +5 new keys — all 4 added once each, but Bug 3 added 3 keys not 1).
- `npx tsc --noEmit` → **0 errors**

## Acceptance Criteria

- [x] Session log contains full mixing inventory (file + cause per mixing source)
- [x] Every user-visible string resolves through i18n (no remaining hardcoded visible text in audited flows)
- [x] All four catalogs share one key set (1071 keys each, identical)
- [x] 0 new lint/typecheck errors
- [x] Runtime switching changes 100% of strings on audited pages (notifications timestamps, header admin link, listing form GPS section, mobile nav landmark all now locale-aware)
