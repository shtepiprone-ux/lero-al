# i18n Hardcode Audit — Full Inventory

**Generated:** 2026-06-05 (Task 396, Sprint 34)
**Scanner:** `scripts/check-hardcoded-i18n.mjs`
**Total findings:** 47 across 25 files (of 344 scanned)
**Baseline:** `scripts/i18n-hardcode-baseline.json` (47 entries)
**Remediation:** Task 397 (batched — does NOT edit components in this task)

---

## Summary

| Directory | Files | Findings |
|---|---|---|
| `src/app/[locale]/` | 3 | 3 |
| `src/app/api/` | 1 | 1 |
| `src/components/admin/` | 8 | 22 |
| `src/components/layout/` | 1 | 4 |
| `src/components/shared/` | 2 | 2 |
| `src/components/ui/` | 4 | 6 |
| `src/modules/auth/` | 1 | 1 |
| `src/modules/listings/` | 1 | 1 |
| `src/modules/notifications/` | 4 | 11 |
| **TOTAL** | **25** | **47** |

---

## Coverage proof (story-independent)

The render-based `check:locale-leak` gate covers 29 Storybook stories.
This static scanner covers **all 344 `src/**` files** — including the following
components with NO story, which the render gate cannot see:

| File (no story exists) | Findings |
|---|---|
| `src/components/ui/pagination.tsx` | 3 (2 aria-labels + 1 sr-only) |
| `src/components/shared/AvatarCropModal.tsx` | 1 (aria-label) |
| `src/components/admin/AdminSupportManager.tsx` | 1 (aria-label) |
| `src/components/admin/AdminCurrenciesManager.tsx` | 1 (placeholder) |
| `src/components/admin/AdminSettings.tsx` | 7 (labels + placeholder) |
| `src/components/admin/AdminLegalManager.tsx` | 2 (text children) |
| `src/components/admin/AdminPagesManager.tsx` | 2 (text children) |
| `src/components/admin/AdminPropertyTypesManager.tsx` | 3 (text children) |
| `src/app/[locale]/*/page.tsx` (3 pages) | 3 (aria-labels) |
| `src/modules/notifications/lib/emails/` (4 files) | 11 (text children) |

---

## Complete findings inventory

### src/app/[locale]/favorites/page.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 71 | attr | `aria-label` | `"Breadcrumb"` | HIGH — accessibility label on breadcrumb nav; all 4 locales |

### src/app/[locale]/listings/[slug]/page.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 329 | attr | `aria-label` | `"Breadcrumb"` | HIGH — accessibility label on breadcrumb nav; all 4 locales |

### src/app/[locale]/listings/page.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 84 | attr | `aria-label` | `"Breadcrumb"` | HIGH — accessibility label on breadcrumb nav; all 4 locales |

### src/app/api/auth-email-hook/route.ts

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 156 | text-child | — | `"Real estate marketplace for Albania"` | MED — email footer prose; sq-only email per Epic GG — but still hardcoded |

### src/components/admin/AdminCurrenciesManager.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 357 | attr | `placeholder` | `"EUR, ALL…"` | MED — admin-only placeholder; mixed acronym format hint |

### src/components/admin/AdminFooterManager.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 169 | text-child | — | `"Brand"` | MED — admin UI column/section label |

### src/components/admin/AdminLegalManager.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 68 | text-child | — | `"Slug"` | MED — admin UI field label (CMS term) |
| 167 | text-child | — | `"Slug"` | MED — admin UI field label (CMS term) |

### src/components/admin/AdminPagesManager.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 192 | text-child | — | `"Slug"` | MED — admin UI field label (CMS term) |
| 200 | text-child | — | `"Changing the slug will change this page's URL."` | MED — admin UI warning message |

### src/components/admin/AdminPropertyTypesManager.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 314 | text-child | — | `"Slug"` | MED — admin UI field label (CMS term) |
| 316 | text-child | — | `"EN / UK / IT"` | LOW — language-code column header (arguably non-translatable) |
| 319 | text-child | — | `"Created"` | MED — admin table column header |

### src/components/admin/AdminSettings.tsx

| Line | Kind | Attribute | Value | Priority | Notes |
|---|---|---|---|---|---|
| 185 | attr | `label` | `"Facebook"` | LOW — proper noun form label; brand name |
| 188 | attr | `label` | `"Instagram"` | LOW — proper noun form label; brand name |
| 191 | attr | `label` | `"LinkedIn"` | LOW — proper noun form label; brand name |
| 197 | attr | `placeholder` | `"Tregu kryesor i pasurive..."` | FALSE POSITIVE — Albanian placeholder text; scanner cannot distinguish pure-ASCII Albanian from English |
| 209 | attr | `label` | `"Meta title"` | MED — admin SEO field label |
| 212 | attr | `label` | `"Meta description"` | MED — admin SEO field label |
| 215 | attr | `label` | `"OG Image URL"` | MED — admin SEO field label (contains URL acronym but is labelled as prose) |

### src/components/admin/AdminSupportManager.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 136 | attr | `aria-label` | `"Clear selection"` | HIGH — accessibility label on interactive control |

### src/components/admin/AdminUserAvatar.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 162 | attr | `alt` | `"Avatar preview"` | MED — image alt text |

### src/components/layout/Footer.tsx

| Line | Kind | Attribute | Value | Priority | Notes |
|---|---|---|---|---|---|
| 138 | attr | `aria-label` | `"Facebook"` | LOW — brand proper noun on social link |
| 138 | text-child | — | `"Facebook"` | LOW — visible link text; brand proper noun |
| 139 | attr | `aria-label` | `"Instagram"` | LOW — brand proper noun on social link |
| 139 | text-child | — | `"Instagram"` | LOW — visible link text; brand proper noun |

### src/components/shared/AvatarCropModal.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 104 | attr | `aria-label` | `"Avatar crop area; drag to position"` | HIGH — accessibility label on interactive cropper control |

### src/components/shared/LocationCombobox.tsx

| Line | Kind | Attribute | Value | Priority | Notes |
|---|---|---|---|---|---|
| 127 | attr | `placeholder` | `"Nazva (alb.)"` | FALSE POSITIVE — appears to be a Ukrainian admin label ("Назва" = name) in Latin transliteration |

### src/components/ui/command.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 37 | attr | `title` | `"Command Palette"` | MED — default title parameter for CommandDialog |

### src/components/ui/dialog.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 81 | text-child | — | `"Close"` | HIGH — sr-only accessible button label; already in check-locale-leak per-story allowlist (primitives-dialog) |

### src/components/ui/pagination.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 75 | attr | `aria-label` | `"Go to previous page"` | HIGH — screen reader label for pagination control |
| 94 | attr | `aria-label` | `"Go to next page"` | HIGH — screen reader label for pagination control |
| 121 | text-child | — | `"More pages"` | HIGH — sr-only text for pagination ellipsis |

### src/components/ui/sheet.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 74 | text-child | — | `"Close"` | HIGH — sr-only accessible close button label |

### src/modules/auth/components/AuthRedirect.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 53 | attr | `aria-label` | `"Loading…"` | HIGH — screen reader label on loading spinner |

### src/modules/listings/components/ListingsPagination.tsx

| Line | Kind | Attribute | Value | Priority |
|---|---|---|---|---|
| 44 | attr | `aria-label` | `"Pagination"` | HIGH — nav landmark label for screen readers |

### src/modules/notifications/lib/emails/BaseEmail.tsx

| Line | Kind | Attribute | Value | Priority | Notes |
|---|---|---|---|---|---|
| 69 | text-child | — | `"Real estate marketplace for Albania"` | MED — email footer tagline; sq-only email policy (Epic GG) |
| 71 | text-child | — | `"Help center"` | MED — email footer link text |
| 73 | text-child | — | `"Privacy"` | MED — email footer link text |

### src/modules/notifications/lib/emails/PasswordChangedEmail.tsx

| Line | Kind | Attribute | Value | Priority | Notes |
|---|---|---|---|---|---|
| 66 | text-child | — | `"Ekipi i Lero.al"` | FALSE POSITIVE — Albanian text ("The Lero.al Team") in sq-only email; `isEnglishish` cannot distinguish pure-ASCII Albanian |

### src/modules/notifications/lib/emails/emailChange.ts

| Line | Kind | Attribute | Value | Priority | Notes |
|---|---|---|---|---|---|
| 134 | text-child | — | `"Current email:"` | MED — email template label text |
| 135 | text-child | — | `"New email:"` | MED — email template label text |
| 136 | text-child | — | `"Time:"` | MED — email template label text |
| 137 | text-child | — | `"Device:"` | MED — email template label text |

### src/modules/notifications/lib/sendTemplatedEmail.ts

| Line | Kind | Attribute | Value | Priority | Notes |
|---|---|---|---|---|---|
| 61 | text-child | — | `"Real estate marketplace for Albania"` | MED — HTML email string in template sender |
| 63 | text-child | — | `"Help center"` | MED — HTML email string in template sender |
| 65 | text-child | — | `"Privacy"` | MED — HTML email string in template sender |

---

## False positives (3 entries, in baseline, no remediation needed)

These entries are in the committed baseline but should NOT be remediated by Task 397.
They are pure-ASCII text in non-English languages that `isEnglishish()` cannot distinguish.

| File | Line | Value | Reason |
|---|---|---|---|
| `AdminSettings.tsx` | 197 | `"Tregu kryesor i pasurive..."` | Albanian placeholder (no accented chars); sq-only admin field |
| `LocationCombobox.tsx` | 127 | `"Nazva (alb.)"` | Appears to be Ukrainian/admin internal label in Latin script |
| `PasswordChangedEmail.tsx` | 66 | `"Ekipi i Lero.al"` | Albanian text ("Lero.al Team") in sq-only email; Epic GG policy |

---

## Priority summary for Task 397

| Priority | Count | Description |
|---|---|---|
| HIGH (must fix) | 14 | Accessibility labels (aria-label, sr-only) — directly affect screen readers across all locales |
| MED (should fix) | 27 | Visible UI labels, placeholder text, email content |
| LOW (optional) | 3 | Proper noun brand labels (Facebook, Instagram, LinkedIn) — language-neutral but could use locale keys |
| FALSE POSITIVE | 3 | Do not remediate — Albanian/Ukrainian text in allowlist candidates |

**HIGH priority items to address in Task 397:**
- `dialog.tsx:81`, `sheet.tsx:74` — sr-only "Close"
- `pagination.tsx:75,94,121` — "Go to previous page", "Go to next page", "More pages"
- `page.tsx` breadcrumbs (3 files) — aria-label="Breadcrumb"
- `AdminSupportManager.tsx:136` — aria-label="Clear selection"
- `AvatarCropModal.tsx:104` — aria-label="Avatar crop area; drag to position"
- `AuthRedirect.tsx:53` — aria-label="Loading…"
- `ListingsPagination.tsx:44` — aria-label="Pagination"
