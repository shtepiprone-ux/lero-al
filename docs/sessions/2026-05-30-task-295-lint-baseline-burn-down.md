# Task 295 — Lint Baseline Burn-down (Sprint-17 17-problem baseline → 0/0)

**Date:** 2026-05-30  
**Executor:** Claude Code Sonnet 4.6  
**Task type:** hygiene / governance burn-down

---

## BEFORE block

```
> lero-al@0.1.0 lint
> eslint

src\components\admin\AdminFooterManager.tsx
   13:10  warning  'cn' is defined but never used      @typescript-eslint/no-unused-vars
  141:3   warning  'locale' is defined but never used  @typescript-eslint/no-unused-vars

src\components\admin\AdminInquiriesManager.tsx
  76:9  warning  'tp' is assigned a value but never used         @typescript-eslint/no-unused-vars
  89:9  warning  'mailboxes' is assigned a value but never used  @typescript-eslint/no-unused-vars

src\components\shared\Combobox.tsx
  124:6  warning  React Hook useCallback has a missing dependency: 'dropdownMinWidth'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

src\components\shared\FiltersPanel.tsx
  24:10  warning  'Combobox' is defined but never used  @typescript-eslint/no-unused-vars

src\components\ui\AppImage.tsx
  130:9  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images.  @next/next/no-img-element

src\components\ui\PasswordInput.stories.tsx
  40:31  error  React Hook "useState" is called in function "render" that is neither a React function component nor a custom React Hook function.  react-hooks/rules-of-hooks
  68:31  error  (same)  react-hooks/rules-of-hooks
  96:31  error  (same)  react-hooks/rules-of-hooks

src\modules\contacts\actions\index.ts
  164:7   error  Direct status write in .update() outside the mutation gateway.  no-restricted-syntax
  236:39  error  (same)  no-restricted-syntax

src\modules\listings\components\ListingContact.tsx
  87:9  error  window.location.href assignment is forbidden.  no-restricted-syntax

src\modules\listings\components\ListingMobileCTA.tsx
  40:7  error  window.location.href assignment is forbidden.  no-restricted-syntax

src\modules\listings\components\ListingsFilters.tsx
  19:10  warning  'Combobox' is defined but never used  @typescript-eslint/no-unused-vars

src\modules\listings\hooks\useFavoritesRealtime.ts
  133:6  warning  React Hook useEffect has a missing dependency: 'displayedIdsRef'.  react-hooks/exhaustive-deps

src\modules\notifications\lib\sendTemplatedEmail.ts
  91:3  warning  'userId' is defined but never used  @typescript-eslint/no-unused-vars

✖ 17 problems (7 errors, 10 warnings)
```

Matches kickoff baseline exactly. Proceeding.

---

## AFTER block

```
> lero-al@0.1.0 lint
> eslint

Exit: 0
```

**✅ 0 errors / 0 warnings — exit code 0.**

---

## Per-finding resolution table

| # | File:line | Rule | Strategy | Why behavior preserved | Approval needed |
|---|-----------|------|----------|------------------------|-----------------|
| 1 | `PasswordInput.stories.tsx:40` | `react-hooks/rules-of-hooks` | Extracted inline render body into `WithHintIdleRender()` (PascalCase); story now `render: () => <WithHintIdleRender />` | Story renders identical DOM; `useState` is now in a proper component | none |
| 2 | `PasswordInput.stories.tsx:68` | `react-hooks/rules-of-hooks` | Extracted into `WithHintAllRulesMetRender()` | Same as #1 | none |
| 3 | `PasswordInput.stories.tsx:96` | `react-hooks/rules-of-hooks` | Extracted into `Mobile320UkrainianRender()` | Same as #1; viewport/locale parameters preserved exactly | none |
| 4 | `AdminFooterManager.tsx:13` | `no-unused-vars` | Deleted `cn` import | `cn` not called anywhere in file | none |
| 5 | `AdminFooterManager.tsx:141` | `no-unused-vars` | Removed `locale` from `LocaleTab` destructuring pattern; kept `locale: Locale` in the prop type annotation so callers are unaffected | `locale` is passed by caller (`locale={loc}`) and accepted by type; function simply doesn't use it. TS structural typing allows partial destructuring | none |
| 6 | `AdminInquiriesManager.tsx:76` | `no-unused-vars` | Deleted `const tp = useTranslations('admin.pages')` line; `t` (admin.inquiries) and `tc` (contact.topics) preserved | Verified: no reference to `tp` anywhere in the component body | none |
| 7 | `AdminInquiriesManager.tsx:89` | `no-unused-vars` | Deleted `const mailboxes = ...` declaration and comment; `mailboxFilter` client-side filtering logic preserved | `mailboxes` was dead since Task 252 introduced server-side `mailboxScope` prop filtering; no JSX references it | none |
| 8 | `Combobox.tsx:124` | `exhaustive-deps` | Added `dropdownMinWidth` to `useCallback` dep array: `}, [portal, dropdownMinWidth])` | `dropdownMinWidth` is read inside the callback at `Math.max(rect.width, dropdownMinWidth ?? 0)` — it was genuinely missing. Adding it is safe; the dropdown will recalculate if the prop changes (which callers pass as a constant so no spurious re-renders) | none |
| 9 | `FiltersPanel.tsx:24` | `no-unused-vars` | Deleted `import { Combobox }` line | Task 294 introduced `FilterMultiToggle` — `Combobox` import was a leftover | none |
| 10 | `AppImage.tsx:130` | `@next/next/no-img-element` | Added `// eslint-disable-next-line @next/next/no-img-element` with an explanatory two-line comment above. Rule-specific, line-scoped disable | AppImage IS the canonical raw `<img>` site; `next/image` is project-wide banned (`IMAGE_RENDER_EXCEPTIONS`). Rendering logic untouched | **Orchestrator-approved 2026-05-30** |
| 11 | `ListingContact.tsx:87` | `no-restricted-syntax` (C) | Replaced `window.location.href = \`tel:${digits}\`` with `document.createElement('a'); a.href = ...; a.rel = 'noopener noreferrer'; a.click()` | Auth-gated fetch preserved; `setContactLoading(false)` in `finally` preserved; toast-on-no-digits preserved; WhatsApp branch untouched | none |
| 12 | `ListingMobileCTA.tsx:40` | `no-restricted-syntax` (C) | Same `document.createElement('a').click()` fix | Same as #11; WhatsApp `window.open` branch untouched | none |
| 13 | `ListingsFilters.tsx:19` | `no-unused-vars` | Deleted `import { Combobox }` line | Same reason as #9 (Task 294 introduced FilterMultiToggle) | none |
| 14 | `contacts/actions/index.ts:164` | `no-restricted-syntax` (B3) | Added `"src/modules/contacts/**"` to `LISTING_STATUS_IGNORES` in `eslint.config.mjs` | `contact_inquiries.status` is `ContactStatus`, not `ListingStatus`. The B3 rule omitted `contacts/**` by oversight (all other non-listing-status domains already exempted). Business logic untouched | **Orchestrator-approved 2026-05-30** |
| 15 | `contacts/actions/index.ts:236` | `no-restricted-syntax` (B3) | Same LISTING_STATUS_IGNORES fix as #14 | Same reasoning | **Orchestrator-approved 2026-05-30** |
| 16 | `useFavoritesRealtime.ts:133` | `exhaustive-deps` | Added `displayedIdsRef` to `useEffect` dep array: `[userId, displayedIdsRef]` | `displayedIdsRef` is a stable ref-like prop (created via `useRef` at call site); adding it to deps doesn't cause re-subscriptions. Updated comment to reflect both deps | none |
| 17 | `sendTemplatedEmail.ts:91` | `no-unused-vars` | Removed `userId` from the function destructuring pattern; kept `userId: string` in `SendTemplatedEmailOptions` interface and callers intact | `userId` was reserved for future audit logging but is not read in the body. Callers still pass it (type enforces it); function simply doesn't bind it to a local variable. The `_userId` alias approach was attempted first but TypeScript ESLint's `varsIgnorePattern` does not apply to destructured aliases in this config | none |

---

## Files Changed table (Task 264)

| Path | Change | Rationale |
|------|--------|-----------|
| `src/components/ui/PasswordInput.stories.tsx` | Extracted 3 inline render closures into `WithHintIdleRender`, `WithHintAllRulesMetRender`, `Mobile320UkrainianRender` | Fix findings #1–3: `react-hooks/rules-of-hooks` (useState in lowercase `render` arrow) |
| `src/components/admin/AdminFooterManager.tsx` | Removed `cn` import; removed `locale` from `LocaleTab` destructuring | Fix findings #4–5: unused `cn` import + unused `locale` destructured var |
| `src/components/admin/AdminInquiriesManager.tsx` | Removed `tp` useTranslations call; removed dead `mailboxes` declaration | Fix findings #6–7: both unused vars |
| `src/components/shared/Combobox.tsx` | Added `dropdownMinWidth` to `updateDropdownPosition` useCallback dep array | Fix finding #8: genuinely missing dep |
| `src/components/shared/FiltersPanel.tsx` | Removed unused `Combobox` import | Fix finding #9 |
| `src/components/ui/AppImage.tsx` | Added `eslint-disable-next-line @next/next/no-img-element` (approved) | Fix finding #10: `<img>` in canonical render site |
| `src/modules/listings/components/ListingContact.tsx` | Replaced `window.location.href = \`tel:…\`` with `document.createElement('a').click()` | Fix finding #11: `no-restricted-syntax` C (tel: dialer) |
| `src/modules/listings/components/ListingMobileCTA.tsx` | Same tel: dialer fix | Fix finding #12 |
| `src/modules/listings/components/ListingsFilters.tsx` | Removed unused `Combobox` import | Fix finding #13 |
| `src/modules/listings/hooks/useFavoritesRealtime.ts` | Added `displayedIdsRef` to useEffect dep array | Fix finding #16: missing dep (stable ref) |
| `src/modules/notifications/lib/sendTemplatedEmail.ts` | Removed `userId` from destructuring (kept in interface + callers) | Fix finding #17: reserved-but-dead param |
| `eslint.config.mjs` | Added `"src/modules/contacts/**"` to `LISTING_STATUS_IGNORES` (approved) | Fix findings #14–15: ContactStatus ≠ ListingStatus |
| `docs/eslint-debt-taxonomy.md` | Updated "Current Lint Status" from 0/6 to 0/0; added Task 295 history entry | Required by kickoff scope |
| `docs/sessions/2026-05-30-task-295-lint-baseline-burn-down.md` | This file | Session log |
| `docs/backlog.md` | New Session Archive row for Task 295 | Required by clause 10 |

---

## Note 18 self-validation table

| AC | Status | Evidence |
|----|--------|---------|
| `npm run lint` → 0/0, exit code 0 | ✅ | Verified above |
| `npx tsc --noEmit` → 0 errors | ✅ | Empty output (0 errors) |
| `npm run build` → passes | ✅ | Build completed successfully |
| `governance:primitives` → C0/H0/M0 (no regression) | ✅ | Improved from C0/H2/M0 (window.location HIGHs gone) |
| `governance` (full report) → no NEW violations | ✅ | All checks OK, no regressions |
| `npx vitest run` → 390/390 pass | ✅ | 13 test files, 390 tests |
| No new `eslint-disable` without orchestrator approval | ✅ | AppImage disable approved before adding |
| No new LISTING_STATUS_IGNORES without approval | ✅ | `contacts/**` addition approved before editing |
| No ESLint rule severity change | ✅ | Rule severities untouched |
| No `eslint.config.mjs` change beyond approved LISTING_STATUS_IGNORES | ✅ | Only one entry added |
| No new locale key | ✅ | 0 locale file changes |
| No copy/visual change | ✅ | Only code logic changes (Storybook extract is transparent DOM-equiv) |
| Every existing control preserved (Note 20) | ✅ | Auth-gated dial, toast, WhatsApp, admin managers, Storybook stories all preserved |
| Every UX branch preserved (Note 19) | ✅ | loading/error/success/cancel flows intact; realtime re-subscribe on userId only |
| Task 283 / Task 294 files NOT touched outside lint-fix scope | ✅ | FiltersPanel and ListingsFilters only had import removed, no filter logic touched |
| Files Changed table present | ✅ | Above |

---

## Governance verification

### governance:primitives BEFORE (post-Task-282)
`C0/H2/M0` (2 HIGH: `window.location.href` in ListingContact + ListingMobileCTA)

### governance:primitives AFTER (Task 295)
`C0/H0/M0` — window.location.href violations eliminated by finding A fix

### governance full report AFTER
```
CRITICAL: 0 / HIGH: 0 / MEDIUM: 45 / LOW: 7
primitives   ✅ OK | current: C0/H0/M0 | baseline: C0/H57/M8
ssr          ✅ OK | current: C0/H0/M0 | baseline: C0/H0/M0
responsive   ✅ OK | current: C0/H0/M21 | baseline: C0/H0/M15
tailwind     ✅ OK | current: C0/H0/M0 | baseline: C0/H0/M0
localization ✅ OK | current: C0/H0/M24 | baseline: C0/H0/M18
✅ Governance check PASSED — no regressions above baseline.
```

---

## Test verification

- `npx tsc --noEmit` → 0 errors (empty output)
- `npm run build` → passes
- `npx vitest run` → 13 passed (13), 390 passed (390)

---

## Confirmation lists

- Task 282 / Task 283 / Task 294 files not touched outside lint-fix scope: **confirmed** (FiltersPanel import removal only; no filter selection, counter, chip, or URL-sync logic touched)
- No new locale keys added: **confirmed** (0 changes to `messages/` files)
- No copy or visual change: **confirmed** (Storybook story render output is DOM-equivalent; `document.createElement('a').click()` fires same OS phone dialer)

---

## Self-validation verdict

`Self-validation: lint=0/0 · tsc=0 · build=passes · governance=no-regression · vitest=390/390 · scope=clean · PASS`
