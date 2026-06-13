# i18n Dynamic-Key Audit — Task 316 (Epic II, Phase 1)

**Date:** 2026-06-13
**Type:** Audit / spec only — zero product-code, zero locale-file, zero script changes.
**Scope:** Every dynamic `t()` call site (`t(\`...${var}\`)` and bare `t(variableExpr)`) across
`src/app`, `src/components`, `src/modules`, `src/lib`, `src/stories`.
**Supersedes:** `tasks/Sprints/Sprint_24_kickoff_prompt_Task_316.md` (per
`tasks/Epics/Epic_II_kickoff_prompt_Task_316.md`).

This report supplies the evidence base for Task 317 (scanner), Task 318 (notification
locale-binding audit), Task 319 (notification render fix), Task 320 (remediation), Task 321
(email-template audit), Task 322 (toast/modal audit), Task 323 (CI gate). **This task identifies
gaps only — it fixes nothing.**

---

## 0. Headline finding — key-set parity is now EXACT across all 4 locales

Before enumerating call sites, a structural fact changes the shape of every later section:

```js
sq 1768   en 1768   uk 1768   it 1768
en: extra=0 missing=0
uk: extra=0 missing=0
it: extra=0 missing=0
```

`messages/{sq,en,uk,it}.json` are **all 1938 lines** and **all 1768 flattened keys**, with **zero**
key-set diff in any direction. The kickoff's premise — *"`uk.json` is ~30% larger than the
others"* — is **STALE**. That size skew predates the `check:i18n` parity gate (Task 392/396 era)
which now enforces exact 4-way key parity with `sq` as the primary/reference locale. Verified via
`scripts/check-i18n-parity.mjs`'s own approach (flatten + diff), reproduced ad-hoc above.

**Consequence for Section 3:** because static key-set parity is exact, a key that exists in `sq`
exists in `en`/`uk`/`it` too, and a key missing from `sq` is missing from all four. There is **no
partial-parity case** among the 83 sites audited below — every missing key found is missing
**uniformly across all 4 locales** (✅✅✅✅ or ❌❌❌❌, never mixed). This is reported explicitly per
key in Section 3 (no row is collapsed without first confirming this).

---

## 1. Per-call-site inventory (83 sites)

**Grep commands (reproduced):**
```sh
# Pattern A — template literal with interpolation
grep -rnP "(?<![a-zA-Z0-9_])t\(\`[^\`]*\$\{" src/ --include='*.tsx' --include='*.ts' | grep -v __tests__
# → 51 matches

# Pattern B — bare-variable t() call
grep -rnP "(?<![a-zA-Z0-9_])t\([a-zA-Z_][a-zA-Z0-9_.]*\)" src/ --include='*.tsx' --include='*.ts' \
  | grep -v __tests__ | grep -vE "useTranslations|getTranslations"
# → 39 raw matches; 7 are false positives (see below) → 32 real sites
```

**Pattern-B false positives excluded (7):**
- `src/components/admin/StatusChangeControl.stories.tsx` (5 lines) — prose/comments referencing
  `t(labelKey)` in Storybook docs blocks, not executable calls.
- `src/modules/listings/domain/listingFields.ts:96`, `presentationEngine.ts:52/59/61` — JSDoc
  comments describing the contract (`// caller calls t(labelKey)`), not calls.
- `src/stories/fixtures/listing.fixture.ts:66,73,80` — `t` here is a **local** function
  `const t = (key) => storyT(locale, key)` (Storybook-only message catalogue), NOT next-intl's
  `useTranslations`. Different namespace system entirely — out of scope.

**51 + 32 = 83 = inventory row count below.** ✅ count == grep.

| # | File:Line | Namespace (`useTranslations` scope) | Expression | Source enum/union/array |
|---|---|---|---|---|
| 1 | `src/app/[locale]/listings/[slug]/page.tsx:349` | `listing` | `` t(`status_banner_${listing.status}`) `` | `ListingStatus` — but query (`page.tsx:207`, `.in('status',['active','sold','rented','archived'])`) + `!isListingVisible` exclude `active` ⇒ reachable = `sold\|rented\|archived` |
| 2 | `page.tsx:397` | `listing` | `` t(`property_type_${listing.property_type}`) `` | `PropertyType` (10 values) |
| 3 | `AdminExchangeProvidersManager.tsx:132` | `admin.currency.providers` | `` t(`mode_${m}`) `` | `(['auto','manual','hybrid'] as const).map(m=>...)` |
| 4 | `AdminExchangeProvidersManager.tsx:230` | `admin.currency.providers` | `` t(`mode_${p.mode}`) `` | `p.mode: 'auto'\|'manual'\|'hybrid'` |
| 5 | `AdminExchangeProvidersManager.tsx:332` | `admin.currency.providers` | `` t(`mode_${p.mode}`) `` | same |
| 6 | `AdminInquiriesManager.tsx:201` | `admin.inquiries` | `` t(`filter_${s}` as 'filter_new'\|'filter_in_progress'\|'filter_closed') `` | `(['all','new','in_progress','closed'] as const).map(s=>...)` (`'all'` branch uses static `filter_all`) |
| 7 | `AdminInquiriesManager.tsx:214` | `admin.inquiries` | `` t(`filter_mailbox_${m}` as ...) `` | `(['all','support','sales'] as const).map(m=>...)` (`'all'` → static `filter_mailbox_all`) |
| 8 | `AdminInquiriesManager.tsx:238` | `admin.inquiries` | `` t(`status_${inq.status}` as ...) `` | `ContactStatus = 'new'\|'in_progress'\|'closed'` |
| 9 | `AdminPermissionsManager.tsx:104` | `admin.permissions` | `` t(`keys.${keySlug}`) `` | `PERMISSION_KEYS` (10, `key.replace('.','_')`) |
| 10 | `AdminPermissionsManager.tsx:107` | `admin.permissions` | `` t(`descriptions.${keySlug}`) `` | same |
| 11 | `AdminPermissionsManager.tsx:133` | `admin.permissions` | `` t(`keys.${keySlug}`) `` (aria-label) | same |
| 12 | `AdminPermissionsManager.tsx:171` | `admin.permissions` | `` t(`keys.${keySlug}`) `` (audit row, `ev.permission_key`) | `PERMISSION_KEYS` (audit events only ever record a valid `PermissionKey`) |
| 13 | `AdminReportsManager.tsx:96` | `admin.reports` | `` t(`status_${report.status}` as Parameters<typeof t>[0]) `` | `ReportStatus = 'pending'\|'reviewed'\|'resolved'\|'dismissed'` |
| 14 | `AdminReportsManager.tsx:253` | `admin.reports` | `` t(`filter_${f}` as ...) `` | `FILTERS = ['all','pending','reviewed','resolved','dismissed']` (`'all'` → static path) |
| 15 | `AdminReportsManager.tsx:299` | `admin.reports` | `` t(`status_${report.status}` as ...) `` | `ReportStatus` |
| 16 | `AdminSupportManager.tsx:121` | `admin.support` | `` t(`role_${user.role}` as `role_admin`) `` | `UserRole = 'admin'\|'moderator'\|'agent'\|'user'` |
| 17 | `AdminSupportManager.tsx:123` | `admin.support` | `` t(`user_status_${user.status}` as `user_status_active`) `` | `UserStatus = 'active'\|'blocked'\|'inactive'` — **🔴 GAP #1** (Section 4/5) |
| 18 | `AdminSupportManager.tsx:233` | `admin.support` | `` t(`role_${u.role}` as `role_admin`) `` | `UserRole` |
| 19 | `AdminSupportManager.tsx:325` | `admin.support` | `` t(`complaint_type_${ticket.complaint_type}` as 'complaint_type_other') `` | `ComplaintType` (8 values) |
| 20 | `AdminSupportManager.tsx:333` | `admin.support` | `` t(`support_status_${ticket.status}` as `support_status_open`) `` | `TicketStatus = 'open'\|'in_progress'\|'resolved'\|'closed'` |
| 21 | `AdminSupportManager.tsx:367` | `admin.support` | `` t(`support_status_${s}` as `support_status_open`) `` | `TicketStatus` (filter loop) |
| 22 | `AdminSupportManager.tsx:452` | `admin.support` | `` t(`complaint_type_${ct}` as 'complaint_type_other') `` | `ComplaintType` |
| 23 | `AdminSupportManager.tsx:714` | `admin.support` | `` t(`complaint_type_${tk.complaint_type}` as 'complaint_type_other') `` | `ComplaintType` |
| 24 | `AdminSupportManager.tsx:751` | `admin.support` | `` t(`support_status_${tk.status}` as `support_status_open`) `` | `TicketStatus` |
| 25 | `AdminSupportManager.tsx:813` | `admin.support` | `` s ? t(`support_status_${s}` as 'support_status_open') : t('filter_all_status') `` | `TicketStatus` (`s` falsy → static `filter_all_status`) |
| 26 | `AdminSupportManager.tsx:840` | `admin.support` | `` t(`complaint_type_${tk.complaint_type}` as 'complaint_type_other') `` | `ComplaintType` |
| 27 | `AdminSupportManager.tsx:849` | `admin.support` | `` t(`support_status_${tk.status}` as `support_status_open`) `` | `TicketStatus` |
| 28 | `AdminUserCreate.tsx:111` | `admin.user_profile` | `` t(`profile_types.${pt}` as `profile_types.${typeof PROFILE_TYPES[number]}`) `` | `PROFILE_TYPES = ['admin','moderator','private','agent','developer']` |
| 29 | `AdminUserCreate.tsx:146` | `admin.user_profile` | `` t(`validation.${phoneResult.errorKey}` as Parameters<typeof t>[0]) `` | `validatePhone()` errorKey subset = `'error_phone_invalid'\|'error_phone_no_country_code'\|'error_phone_digits_only'` (see Non-enumerable note §1a) |
| 30 | `AdminUserCreate.tsx:152` | `admin.user_profile` | `` t(`validation.${waResult.errorKey}` as ...) `` | same |
| 31 | `AdminUserProfile.tsx:484` | `admin.user_profile` | `` t(`validation.${pr.errorKey}` as ...) `` | same |
| 32 | `AdminUserProfile.tsx:489` | `admin.user_profile` | `` t(`validation.${wr.errorKey}` as ...) `` | same |
| 33 | `AdminUserProfile.tsx:538` | `admin.user_profile` | `` t(`validation.${pr.errorKey}` as ...) `` | same |
| 34 | `AdminUserProfile.tsx:543` | `admin.user_profile` | `` t(`validation.${wr.errorKey}` as ...) `` | same |
| 35 | `AdminUserProfile.tsx:1049` | `admin.user_profile` | `` t(`statuses.${entry.old_status}` as ...) `` | `UserStatus` |
| 36 | `AdminUserProfile.tsx:1050` | `admin.user_profile` | `` t(`statuses.${entry.new_status}` as ...) `` | `UserStatus` |
| 37 | `AdminUsersTable.tsx:155` | `admin.users` | `` t(`role_${u.role}` as `role_admin`) `` | `UserRole` |
| 38 | `AdminUsersTable.tsx:165` | `admin.users` | `` t(`user_status_${u.status ?? 'active'}` as `user_status_active`) `` | `UserStatus` |
| 39 | `AdminUsersTable.tsx:332` | `admin.users` | `` s ? t(`filter_status_${s}` as ...) : t('filter_status_all') `` | `STATUS_FILTERS = ['','active','inactive','blocked']` (`''` → static `filter_status_all`) |
| 40 | `AdminUsersTable.tsx:372` | `admin.users` | `` t(`role_${u.role}` as `role_admin`) `` | `UserRole` |
| 41 | `AdminUsersTable.tsx:375` | `admin.users` | `` t(`user_status_${u.status ?? 'active'}` as ...) `` | `UserStatus` |
| 42 | `src/lib/i18n/listingStatusLabel.ts:39` | `listing` **or** `cabinet` (caller-supplied `t`) | `` t(`status_${status}`) `` | `LISTING_STATUS_CODES = ['pending','active','inactive','sold','rented','archived']` |
| 43 | `ListingsTab.tsx:184` | `cabinet` | `` t(`filter_${key}`) `` | `VALID_VISIBILITY_GROUPS = ['ALL','VISIBLE','HIDDEN','ARCHIVED','CLOSED']` |
| 44 | `ListingsTab.tsx:309` | `cabinet` | `` t(`status_${status}`) `` | `ListingStatus` (`status = listing.status as ListingStatus`) |
| 45 | `ListingCard.tsx:135` | `listing` | `` t(`action_disabled_${listing.status}` as 'action_disabled_sold'\|'action_disabled_rented') `` | `ListingStatus`, but only reachable when `isListingClosed()` is true ⇒ `sold\|rented` |
| 46 | `ListingCard.tsx:205` | `listing` | `` t(`property_type_${listing.property_type}`) `` | `PropertyType` |
| 47 | `ListingCard.tsx:306` | `listing` | `` t(`status_${listing.status}`).toUpperCase() `` | `ListingStatus`, only reached inside `isListingClosed()` branch ⇒ `sold\|rented` |
| 48 | `ListingCard.tsx:343` | `listing` | `` t(`property_type_${listing.property_type}`) `` | `PropertyType` |
| 49 | `ListingContact.tsx:68` | `listing` | `` t(`action_disabled_${listingStatus}` as 'action_disabled_sold'\|'action_disabled_rented') `` | `ListingStatus`, only when `isListingClosed()` ⇒ `sold\|rented` |
| 50 | `StepPreview.tsx:50` | `listing` | `` t(`property_type_${data.property_type}`) `` | `PropertyType` |
| 51 | `src/stories/StoryListingCard.tsx:111` | `listing` | `` t(`status_${data.status}` as 'status_sold'\|'status_rented').toUpperCase() `` | story fixture `data.status: 'sold'\|'rented'` (Storybook-only component, not `.stories.tsx`, see §5 bucket note) |
| 52 | `page.tsx:396` | `listing` | `` t(listing.listing_type) `` | `ListingType = 'sale'\|'rent'` |
| 53 | `page.tsx:438` | `listing` | `` t(f.labelKey) `` | `presentationEngine.getCardFeatures()` → `FIELD_DEFAULTS` labelKeys (rooms/bedrooms/bathrooms/toilets/area_*/floor/year_built) |
| 54 | `page.tsx:462` | `listing` | `` t(a.labelKey) `` | `presentationEngine.getDetailAttributes()` labelKeys (same set) |
| 55 | `page.tsx:463` | `listing` | `` t(a.valueKey) `` | `presentationEngine.getDetailAttributes()` valueKeys → `condition_*\|heating_*\|wall_*` prefixes |
| 56 | `ListingsTab.tsx:250` | `cabinet` | `` t(emptyKey) `` | `` `no_listings_${activeVisibility}` `` for `'VISIBLE'\|'HIDDEN'\|'ARCHIVED'\|'CLOSED'`, or literal `'no_listings_PREMIUM'` |
| 57 | `ButtonGroupField.tsx:35` | `listing` | `t(labelKey)` | `LABEL_KEYS = {heating:'heating_label', wall_type:'wall_type_label', offer_type:'offer_type'}` |
| 58 | `ButtonGroupField.tsx:46` | `listing` | `t(o.labelKey)` | `HEATING_TYPES\|WALL_TYPES\|OFFER_TYPES` labelKeys (`heating_*`, `wall_*`, `offer_*`) |
| 59 | `EnumSelectorField.tsx:41` | `listing` | `t(labelKey)` | `LABEL_KEYS = {condition:'condition_label', land_legal_status, land_zoning, land_development_potential}` |
| 60 | `EnumSelectorField.tsx:56` | `listing` | `t(o.labelKey)` | `CONDITIONS\|LAND_LEGAL_STATUS\|LAND_ZONING\|LAND_DEVELOPMENT_POTENTIAL` labelKeys |
| 61 | `MultiToggleField.tsx:38` | `listing` | `t(labelKey)` | `LABEL_KEYS = {purchase_conditions:'purchase_conditions'}` |
| 62 | `MultiToggleField.tsx:49` | `listing` | `t(o.labelKey)` | `PURCHASE_CONDITIONS` labelKeys (`purchase_*`) |
| 63 | `NumInputField.tsx:26` | `listing` | `meta ? t(meta.key) : fieldDef.key` | `LABEL_KEYS = {bedrooms,bathrooms,toilets}`; else **not a `t()` call** (raw `fieldDef.key` rendered — see §1b) |
| 64 | `ListingCard.tsx:194` | `listing` | `t(b.label)` | `getBadges()` → `'status_sold'\|'status_rented'\|'status_archived'\|'new'\|'price_reduced'` |
| 65 | `ListingCard.tsx:205` | `listing` | `t(listing.listing_type)` | `ListingType` (2nd call on this line, distinct from #46) |
| 66 | `ListingCard.tsx:315` | `listing` | `t(b.label)` | same as #64 |
| 67 | `ListingCard.tsx:343` | `listing` | `t(listing.listing_type)` | `ListingType` (2nd call on this line, distinct from #48) |
| 68 | `ListingFormShell.tsx:352` | `listing` | `t(type)` | `(['sale','rent'] as ListingType[]).map(type=>...)` |
| 69 | `ListingsFilterBar.tsx:60` | `listing` | `` type === '' ? tc('all') : t(type) `` | `(['','sale','rent'] as const)` (`''` → static `common.all`) |
| 70 | `ListingsFilters.tsx:95` | `listing` | `` type === '' ? tc('all') : t(type) `` | same |
| 71 | `ListingsFilters.tsx:154` | `listing` | `t(mt.labelKey)` | `MARKET_TYPES` labelKeys (`market_type_secondary\|market_type_new_building`) |
| 72 | `ListingsFilters.tsx:241` | `listing` | `getLabel={k=>t(k)}` over `CONDITIONS` | `condition_*` labelKeys |
| 73 | `ListingsFilters.tsx:254` | `listing` | `getLabel={k=>t(k)}` over `LAYOUT_FEATURES` | `layout_studio\|layout_free\|layout_duplex\|layout_penthouse\|layout_small_family` |
| 74 | `ListingsFilters.tsx:286` | `listing` | `getLabel={k=>t(k)}` over `HEATING_TYPES` | `heating_*` labelKeys |
| 75 | `ListingsFilters.tsx:298` | `listing` | `getLabel={k=>t(k)}` over `WALL_TYPES` | `wall_*` labelKeys |
| 76 | `ListingsFilters.tsx:310` | `listing` | `getLabel={k=>t(k)}` over `OFFER_TYPES` | `offer_*` labelKeys |
| 77 | `ListingsFilters.tsx:323` | `listing` | `getLabel={k=>t(k)}` over `PURCHASE_CONDITIONS` | `purchase_*` labelKeys |
| 78 | `ListingsSortBar.tsx:79` | `listing` | `t(o.labelKey)` over `SORT_OPTIONS` | `sort_newest\|sort_price_asc\|sort_price_desc\|sort_area_desc\|sort_area_asc` |
| 79 | `StepBasicInfo.tsx:42` | `listing` | `t(type)` | `(['sale','rent'] as ListingType[])` |
| 80 | `StepDetails.tsx:153` | `listing` | `t(c.labelKey)` over `CONDITIONS` | `condition_*` labelKeys |
| 81 | `StepDetails.tsx:174` | `listing` | `t(h.labelKey)` over `HEATING_TYPES` | `heating_*` labelKeys |
| 82 | `StepDetails.tsx:195` | `listing` | `t(w.labelKey)` over `WALL_TYPES` | `wall_*` labelKeys |
| 83 | `StepPreview.tsx:46` | `listing` | `t(data.listing_type)` | `ListingType` |

---

## 1a. Non-enumerable / runtime-only subsection

**One site has a partially non-enumerable variable, but it does NOT produce an unresolved
enumeration** because the unreachable branch never feeds a `t()` call (resolved, not a STOP&ASK):

- **Sites #29–34 (`validation.${errorKey}`)** — `phoneResult`/`waResult` are the return value of
  `validatePhone()` (`src/lib/phone/index.ts`), whose `PhoneErrorKey` outputs are statically
  limited to `'error_phone_invalid' | 'error_phone_no_country_code' | 'error_phone_digits_only'`
  (verified by reading every `return { ok:false, errorKey: ... }` branch in `validatePhone`).
  `PhoneErrorKey` as a *type* also includes `'error_phone_country_mismatch'`, produced only by the
  **separate** function `normalizePastedNational()` (paste-handler, `PasteResult`). That function's
  result is delivered via `PhoneField`'s `onPasteError?: (errorKey: string) => void` callback —
  **grepped and confirmed neither `AdminUserCreate.tsx` nor `AdminUserProfile.tsx` passes
  `onPasteError` to `<PhoneField>`** (both omit the prop). Therefore
  `'error_phone_country_mismatch'` can **never** reach `t(\`validation.${...}\`)` today — it is a
  **dead union member**, not a missing-key gap for sites #29–34. Recorded as an **informational
  orphan-type finding** in Section 5 (not a Task 320 fill target; relevant to Task 317's type-vs-
  runtime-reachability design).

**No site required a STOP&ASK** — every variable's source enum/union/array was statically locatable.

## 1b. Non-`t()` raw-label fallback (informational, NOT a dynamic-`t()` site)

- **`NumInputField.tsx:26`** (site #63): `LABEL_KEYS` covers `bedrooms`/`bathrooms`/`toilets`. The
  `'num-input'` component type is ALSO used for `floors_total`
  (`propertyTypeSchema.ts:98-99`), which is **absent** from `LABEL_KEYS`. For `floors_total`,
  `meta` is `undefined` ⇒ `label = fieldDef.key = 'floors_total'` — the **raw field key is rendered
  verbatim as the UI label**, with **no `t()` call at all**. This is a real localization bug
  (untranslated `"floors_total"` string visible to users) but falls **outside this audit's
  "dynamic `t()` call" scope** by definition (`t()` is never invoked). Flagged for Task 320
  awareness as a non-t() hardcode (closer to Task 288's domain) — see Section 5 bucket "Other".

---

## 2. Per-call-site enumeration (resolved key sets, namespace-qualified)

Grouped by **(namespace, source enum)** to avoid repetition — each group lists every
namespace-qualified key the sites in Section 1 can resolve to.

| Group | Sites | Namespace-qualified resolved keys |
|---|---|---|
| `ListingStatus` (full 6) | #42 (param `listing`/`cabinet`) | `listing.status_pending`, `listing.status_active`, `listing.status_inactive`, `listing.status_sold`, `listing.status_rented`, `listing.status_archived` — **and** identical `cabinet.status_*` set (×6) |
| `ListingStatus` (reachable `sold\|rented\|archived`) | #1 | `listing.status_banner_sold`, `listing.status_banner_rented`, `listing.status_banner_archived` |
| `ListingStatus` (reachable `sold\|rented`, `isListingClosed`) | #45, 49 | `listing.action_disabled_sold`, `listing.action_disabled_rented` |
| `ListingStatus` (reachable `sold\|rented`, `isListingClosed`) | #47 | `listing.status_sold`, `listing.status_rented` (already in full-6 set above) |
| `ListingStatus` (`sold\|rented`, story) | #51 | `listing.status_sold`, `listing.status_rented` |
| `PropertyType` (10) | #2, 46, 48, 50 | `listing.property_type_apartment`, `_house`, `_room`, `_land`, `_commercial`, `_office`, `_garage`, `_parking`, `_warehouse`, `_other` (10 keys) |
| `'auto'\|'manual'\|'hybrid'` | #3–5 | `admin.currency.providers.mode_auto`, `mode_manual`, `mode_hybrid` |
| `['all','new','in_progress','closed']` (`'all'`→static) | #6 | `admin.inquiries.filter_new`, `filter_in_progress`, `filter_closed` (+ static `filter_all`) |
| `['all','support','sales']` (`'all'`→static) | #7 | `admin.inquiries.filter_mailbox_support`, `filter_mailbox_sales` (+ static `filter_mailbox_all`) |
| `ContactStatus` | #8 | `admin.inquiries.status_new`, `status_in_progress`, `status_closed` |
| `PERMISSION_KEYS` (10) | #9–12 | `admin.permissions.keys.listings_delete`, `.listings_set_premium`, `.users_create`, `.users_change_role`, `.users_soft_delete`, `.users_hard_delete`, `.locations_manage`, `.settings_manage`, `.legal_manage`, `.reports_manage` — **and** identical `admin.permissions.descriptions.*` set (×10) |
| `ReportStatus` | #13, 15 | `admin.reports.status_pending`, `status_reviewed`, `status_resolved`, `status_dismissed` |
| `FILTERS` (`'all'`→static) | #14 | `admin.reports.filter_pending`, `filter_reviewed`, `filter_resolved`, `filter_dismissed` (+ static `filter_all`) |
| `UserRole` (4) | #16, 18, 37, 40 | `admin.support.role_admin/moderator/agent/user` (×4) — **and** identical `admin.users.role_*` set (×4) |
| `UserStatus` (3) | #17 | `admin.support.user_status_active`, `user_status_blocked`, `user_status_inactive` — **🔴 GAP #1** |
| `UserStatus` (3) | #38, 41 | `admin.users.user_status_active`, `user_status_blocked`, `user_status_inactive` |
| `UserStatus` (3, `statuses.*`) | #35, 36 | `admin.user_profile.statuses.active`, `.blocked`, `.inactive` |
| `ComplaintType` (8) | #19, 22, 23, 26 | `admin.support.complaint_type_fraud_or_scam`, `_fake_listing_or_profile`, `_harassment_or_abuse`, `_inappropriate_content`, `_spam`, `_payment_or_deposit_issue`, `_duplicate_or_impersonation`, `_other` (8 keys) |
| `TicketStatus` (4) | #20, 21, 24, 25, 27 | `admin.support.support_status_open`, `_in_progress`, `_resolved`, `_closed` (+ static `filter_all_status` for #25's falsy branch) |
| `PROFILE_TYPES` (5) | #28 | `admin.user_profile.profile_types.admin`, `.moderator`, `.private`, `.agent`, `.developer` |
| `PhoneErrorKey` (3 reachable) | #29–34 | `admin.user_profile.validation.error_phone_invalid`, `.error_phone_no_country_code`, `.error_phone_digits_only` |
| `STATUS_FILTERS` (`''`→static) | #39 | `admin.users.filter_status_active`, `filter_status_inactive`, `filter_status_blocked` (+ static `filter_status_all`) |
| `VALID_VISIBILITY_GROUPS` (5) | #43 | `cabinet.filter_ALL`, `filter_VISIBLE`, `filter_HIDDEN`, `filter_ARCHIVED`, `filter_CLOSED` |
| `ListingType` (2) | #52, 65, 67, 68, 69, 70, 79, 83 | `listing.sale`, `listing.rent` |
| presentationEngine card-feature labelKeys | #53 | `listing.rooms`, `bedrooms`, `bathrooms`, `toilets`, `area_gross_label`, `area_net`, `floor`, `year_built` (per `FIELD_DEFAULTS`/`featureGroup:'primary'`) |
| presentationEngine detail-attr labelKeys | #54 | same set as above (detail view superset) |
| presentationEngine detail-attr valueKey prefixes | #55 | `listing.condition_*` (5), `listing.heating_*` (5), `listing.wall_*` (5) |
| `no_listings_*` (4 + literal) | #56 | `cabinet.no_listings_VISIBLE`, `_HIDDEN`, `_ARCHIVED`, `_CLOSED`, `_PREMIUM` |
| `LABEL_KEYS` heating/wall/offer | #57, 58 | `listing.heating_label`, `listing.wall_type_label`, `listing.offer_type`, + `listing.heating_electric/gas/central/wood/none` (5), `listing.wall_brick/concrete/panel/wood/other` (5), `listing.offer_owner/agency/developer` (3) |
| `LABEL_KEYS` condition/land_* | #59, 60 | `listing.condition_label`, `listing.land_legal_status`, `listing.land_zoning`, `listing.land_development_potential`, + `listing.condition_new_build/good/needs_repair/needs_renovation/under_construction` (5), `listing.land_legal_agricultural/urban/forest/pasture` (4), `listing.land_zoning_residential/commercial/tourism/industrial/mixed_use` (5), `listing.land_dev_buildable/change_of_use_required/non_buildable` (3) |
| `LABEL_KEYS` purchase_conditions | #61, 62 | `listing.purchase_conditions`, + `listing.purchase_installment/mortgage/assignment/negotiable/no_commission` (5) |
| `LABEL_KEYS` bedrooms/bathrooms/toilets | #63 | `listing.bedrooms`, `listing.bathrooms`, `listing.toilets` |
| `getBadges()` labels | #64, 66 | `listing.status_sold`, `status_rented`, `status_archived`, `new`, `price_reduced` |
| `MARKET_TYPES` (2) | #71 | `listing.market_type_secondary`, `market_type_new_building` |
| `LAYOUT_FEATURES` (5) | #73 | `listing.layout_studio`, `layout_free`, `layout_duplex`, `layout_penthouse`, `layout_small_family` |
| `SORT_OPTIONS` (5) | #78 | `listing.sort_newest`, `sort_price_asc`, `sort_price_desc`, `sort_area_desc`, `sort_area_asc` |
| `LISTING_STATUS_CODES` (via #42, `cabinet` namespace) | #44 | `cabinet.status_pending/active/inactive/sold/rented/archived` (subset of full-6, dup) |

No "unknown source" rows. All enumerations cite a concrete TS union/array/object literal read
directly from source.

---

## 3. Per-locale missing-key matrix

Per §0, parity is exact — every cell below is **identical across sq/en/uk/it**. The matrix lists
only the namespaces touched by the 83 sites; ✅ = present in all 4 locales, ❌ = absent from all 4
locales (each independently re-confirmed, not inferred from a single locale).

| Namespace.key (representative) | sq | en | uk | it | Notes |
|---|---|---|---|---|---|
| `listing.property_type_*` (10/10) | ✅ | ✅ | ✅ | ✅ | full set present |
| `listing.status_*` (6/6, incl. `status_banner_sold/rented/archived`) | ✅ | ✅ | ✅ | ✅ | |
| `listing.action_disabled_sold/rented` | ✅ | ✅ | ✅ | ✅ | |
| `listing.condition_*` / `heating_*` / `wall_*` (5+5+5) | ✅ | ✅ | ✅ | ✅ | |
| `listing.market_type_*` / `layout_*` / `offer_*` / `purchase_*` | ✅ | ✅ | ✅ | ✅ | |
| `listing.land_legal_*` / `land_zoning_*` / `land_dev_*` | ✅ | ✅ | ✅ | ✅ | |
| `listing.sort_*` (5/5) | ✅ | ✅ | ✅ | ✅ | |
| `listing.sale` / `listing.rent` | ✅ | ✅ | ✅ | ✅ | |
| `listing.new` / `listing.price_reduced` | ✅ | ✅ | ✅ | ✅ | |
| `listing.bedrooms` / `bathrooms` / `toilets` (NumInputField) | ✅ | ✅ | ✅ | ✅ | |
| `cabinet.filter_*` (ALL/VISIBLE/HIDDEN/ARCHIVED/CLOSED/PREMIUM) | ✅ | ✅ | ✅ | ✅ | |
| `cabinet.no_listings_*` (5/5) | ✅ | ✅ | ✅ | ✅ | |
| `cabinet.status_*` (6/6) | ✅ | ✅ | ✅ | ✅ | |
| `admin.currency.providers.mode_{auto,manual,hybrid}` | ✅ | ✅ | ✅ | ✅ | |
| `admin.inquiries.filter_*` / `filter_mailbox_*` / `status_*` | ✅ | ✅ | ✅ | ✅ | |
| `admin.permissions.keys.*` (10/10) | ✅ | ✅ | ✅ | ✅ | |
| `admin.permissions.descriptions.*` (10/10) | ✅ | ✅ | ✅ | ✅ | |
| `admin.reports.status_*` / `filter_*` | ✅ | ✅ | ✅ | ✅ | |
| `admin.support.role_*` (4/4) | ✅ | ✅ | ✅ | ✅ | grep-verified (see §3a) |
| **`admin.support.user_status_*` (0/3)** | **❌** | **❌** | **❌** | **❌** | **🔴 GAP #1 — grep-verified (see §3a)** |
| `admin.support.complaint_type_*` (8/8) | ✅ | ✅ | ✅ | ✅ | |
| `admin.support.support_status_*` (4/4) + `filter_all_status` | ✅ | ✅ | ✅ | ✅ | |
| `admin.user_profile.profile_types.*` (5/5) | ✅ | ✅ | ✅ | ✅ | |
| `admin.user_profile.validation.error_phone_{invalid,no_country_code,digits_only}` (3/3 reachable) | ✅ | ✅ | ✅ | ✅ | `error_phone_country_mismatch` absent in all 4 too, but **unreachable** (§1a) — not counted as a gap |
| `admin.user_profile.statuses.{active,blocked,inactive}` (3/3) | ✅ | ✅ | ✅ | ✅ | |
| `admin.users.role_*` (4/4) | ✅ | ✅ | ✅ | ✅ | |
| `admin.users.user_status_*` (3/3) | ✅ | ✅ | ✅ | ✅ | |
| `admin.users.filter_status_*` (3/3) + `filter_status_all` | ✅ | ✅ | ✅ | ✅ | |

### 3a. Grep-verified cells (≥8, raw evidence)

```
sq admin.support.user_status_active → 0
en admin.support.user_status_active → 0
uk admin.support.user_status_active → 0
it admin.support.user_status_active → 0
sq admin.support.role_admin → 1
en admin.support.role_admin → 1
uk admin.support.role_admin → 1
it admin.support.role_admin → 1
```
(8 cells; same `awk`-scoped-to-`admin.support`-block + `grep -c` method also run for
`user_status_blocked`/`user_status_inactive` — both 0/0/0/0 in all 4 locales, consistent with the
parity proof in §0.)

**Out of 83 sites and ~100+ enumerated keys, exactly ONE namespace.key triple (3 keys ×
4 locales = 12 message entries) is missing: `admin.support.user_status_{active,blocked,inactive}`.**

---

## 4. Raw-key-leakage risk list

**next-intl v4 default behavior (no custom `onError`/`getMessageFallback` configured —
grep-confirmed: `src/i18n/request.ts`/`routing.ts` define no such overrides):**
- On a missing message key, next-intl's default `onError` calls `console.error` with an
  `IntlError` of code `MISSING_MESSAGE` (server-side log / browser console in dev).
- **Simultaneously**, the default `getMessageFallback` returns the **full dot-path key string**
  (e.g. `"admin.support.user_status_active"`), which is what gets **rendered into the UI**.
- So next-intl v4's default is **both (a) and (b) at once** — not an either/or: an error is
  logged AND the raw namespaced key is shown to the end user. There is no silent-fallback-to-
  empty-string (c) behavior in this codebase (that would require a custom
  `getMessageFallback` returning `''`, which is not configured).

| Site(s) | Failure mode if key missing | Currently missing? |
|---|---|---|
| #17 `admin.support.user_status_${user.status}` | **(a)+(b)**: `console.error MISSING_MESSAGE admin.support.user_status_active` AND the `<Badge>` renders the literal text `admin.support.user_status_active` (or `_blocked`/`_inactive`) to the admin viewing the Support ticket's reported-user card. | **YES — live today**, every time `AdminSupportManager`'s `UserCard` renders a `user.status` badge (lines 121-128). |
| All other 82 sites | (a)+(b) would apply identically **if** their enumerated keys were missing — but §3 shows 100% coverage, so this is currently dormant risk only (re-triggers the moment a new enum value ships without all 4 locale files updated — this is the systemic risk Task 317's scanner exists to catch on every PR). | No — currently 0 leaks. |
| #29-34 `validation.error_phone_country_mismatch` (hypothetical) | Would be (a)+(b) if `onPasteError` were ever wired up without first adding the key — but currently **unreachable** (§1a), so 0 risk today. | N/A (unreachable) |

---

## 5. Remediation buckets for Task 320

### Bucket 1 — `admin.support.user_status_*` (HIGHEST PRIORITY — live leak, 3 keys × 4 locales = 12 entries)
**Root cause is a namespace mismatch, not a missing-translation gap** (§1, site #17): the
`UserCard` component in `AdminSupportManager.tsx` (lines 108-128) calls
`useTranslations('admin.support')` but needs `user_status_*` keys that **already exist** —
verbatim — under `admin.users` (`admin.users.user_status_active/blocked/inactive`, all present
and presumably already correctly translated in all 4 locales).

Two equally-valid Task 320 fix strategies (decision deferred to 320, not 316):
- **(a) Namespace fix (cheapest, 0 new translations):** in `UserCard`, resolve `user_status_*`
  via a second `useTranslations('admin.users')` instance (or pass the already-translated label
  down as a prop) instead of `admin.support`. Zero new message-file edits.
- **(b) Key-fill (duplicate strings):** add `user_status_active`/`_blocked`/`_inactive` to
  `admin.support` in all 4 `messages/*.json`, duplicating `admin.users`' existing translations.

Key list (if (b) chosen): `admin.support.user_status_active`, `admin.support.user_status_blocked`,
`admin.support.user_status_inactive` — sq/en/uk/it (12 entries). **Reference translations already
exist verbatim at `admin.users.user_status_*`** — copy, don't re-translate.

### Bucket 2 — Informational: dead `PhoneErrorKey` union member (no fill needed)
`'error_phone_country_mismatch'` (in `src/lib/phone/index.ts` `PhoneErrorKey` type) is produced
only by `normalizePastedNational()`, whose result never reaches a `t()` call in
`AdminUserCreate`/`AdminUserProfile` (neither wires `onPasteError`). **No message-file action for
320.** Feeds Task 317's scanner design: a type-level union member is not proof of an active
`t()`-reachable key — the scanner should trace to actual call sites, not just type declarations.

### Bucket 3 — Informational: non-`t()` raw label (`floors_total`)
`NumInputField.tsx:26` renders the literal string `"floors_total"` when that field type is used,
because `LABEL_KEYS` omits it (§1b). **Not a missing `messages/*.json` key** (no `t()` call exists
to add a key for) — the fix is adding a `LABEL_KEYS` entry + a `listing.floors_total` (or similar)
key, which is a **code change** (adding a map entry) bundled with a **content change** (4 new
locale strings). Recommend Task 320 treat this as its own micro-bucket: **1 key × 4 locales = 4
entries** + 1-line `LABEL_KEYS` addition in `NumInputField.tsx`.

### Bucket 4 — Storybook-only component (`StoryListingCard.tsx`, site #51)
`src/stories/StoryListingCard.tsx` is a regular `.tsx` component (not `.stories.tsx`) living under
`src/stories/`, used only by Storybook stories. Its `t(\`status_${data.status}\`)` resolves to
`listing.status_sold`/`status_rented` — both present (§3), so **no gap**. No Task 320 action;
listed here only so the inventory-count reconciliation (§1) is traceable.

**Summary: Task 320's only REQUIRED message-file work from this audit is Bucket 1 (12 entries,
or 0 if namespace-fix (a) is chosen) + optionally Bucket 3 (4 entries) if `floors_total` is judged
in-scope.**

---

## 6. Cross-reference — notification wrong-locale class → Task 318

**This is a binding/locale-resolution bug, NOT a missing-key gap** — included per kickoff
requirement to disambiguate the two failure classes for Task 318/319's planning.

- `src/modules/admin/actions/index.ts` defines `SUPPORT_NOTIFY_STRINGS: Record<string, {...}>`
  with **hardcoded, fully-translated** `created_title`/`created_body`/`resolved_*`/`closed_*`
  strings per locale (`sq`/`en`/`uk`/`it`) — e.g. `uk.created_title = 'Скарга на ваш акаунт'`
  (line 728). This is a **raw string lookup table**, entirely separate from next-intl /
  `messages/*.json` / `t()` — **no `t()` call exists here**, so it is correctly **out of this
  audit's inventory** (§1).
- The lookup key is `locale = await resolveUserLocale(reportedUserId)` (lines 835, 897), where
  `resolveUserLocale()` (`src/modules/notifications/lib/emails/resolveUserLocale.ts`) returns
  `users.preferred_locale` (DB column) if it is one of `sq|en|uk|it`, else falls back to `'sq'`.
- **The "Скарга на ваш аккаунт" (Ukrainian) text appearing for an `sq`-UI user is therefore
  explained by `resolveUserLocale(reportedUserId)` returning `'uk'`** — i.e. that user's
  `users.preferred_locale` DB value is `'uk'` (possibly stale/incorrect/never-synced with their
  actual UI locale), NOT by any missing or mistranslated message key. `SUPPORT_NOTIFY_STRINGS.uk`
  is itself **correctly translated** Ukrainian — it's just being selected for the wrong user.
- **Task 318's investigation should focus on**: (1) how/when `users.preferred_locale` is written
  (signup? locale-switcher? never?), (2) whether it can drift from the locale the user actually
  browses in, (3) whether `resolveUserLocale` should instead derive from the *request* locale at
  notification-creation time (not available in this server-action context) or from a more
  recently-touched locale signal. This is a **data-binding / write-path** investigation, distinct
  from — and unblocked by — the missing-key Bucket 1 above.
- Note also `src/modules/notifications/lib/emails/resolveUserLocale.ts` is itself marked
  `@deprecated` for **email** sending (Task 251, Albanian-only email policy) but explicitly
  **"Two consumers remain in admin/actions/index.ts for IN-APP notification locale (not email) —
  those are intentionally preserved."** — i.e. this function's continued use for in-app
  notifications (the call sites at lines 835/897) is **intentional**, not legacy debris; Task 318
  should treat it as the (possibly buggy) binding mechanism to fix, not dead code to delete.
- Separately, `NotificationItem.tsx`'s `resolveStatusBody()` (for `listing_status_change`
  notifications) DOES use `t(\`status_${status}\`)` via `getListingStatusLabel()` — this is
  site-class #42 in this audit (`listing`/`cabinet` namespace `status_*`, full parity, no gap).
  That code path is unrelated to the `SUPPORT_NOTIFY_STRINGS` wrong-locale class above.

---

## 7. Orphan keys / informational (Task 316-scoped)

**Scope statement:** Task 316's Negative flow requires orphan keys (present in `messages/*.json`
but resolved by no call site) to be listed as a dedicated informational subsection. **4-way
locale parity (§0) is NOT used as evidence here** — parity only proves the 4 locale files agree
with *each other*; it says nothing about whether a key is *used*. This section instead checks,
**for each of the 34 namespace-prefix families enumerated in §2**, whether `messages/sq.json`
contains keys under that prefix that are **not** part of the §2 enumeration — i.e. a **family-
scoped** orphan check, not a repo-wide one.

**Method:** for each family's namespace prefix (e.g. `listing.property_type_`,
`admin.support.complaint_type_`), grep `messages/sq.json`'s flattened 1768-key list for that
prefix, then diff the actual key set against the §2 enumeration for that family. (sq used as
representative — §0 parity means the same diff applies to en/uk/it.)

A **repo-wide** sweep of all 1768 keys against all call sites (static + dynamic) is **not
attempted manually** — that is Task 317's scanner, as the kickoff anticipates. This section is
bounded to the 34 families that sites #1–83 (§2) actually touch.

### 7.1 — Per-family result table

| # | Family (namespace prefix) | §2-enumerated keys | Actual keys under prefix (`sq.json`) | Extra key(s) | Status |
|---|---|---|---|---|---|
| 1 | `listing.property_type_*` | 10 | 11 | `property_type_placeholder` | **Found, NOT orphan** — static `t('property_type_placeholder')` at `ListingFormShell.tsx:366` (out of dynamic-family scope, but in active use) |
| 2 | `listing.status_*` + `status_banner_*` | 9 | 9 | — | No orphan |
| 3 | `listing.action_disabled_*` | 2 | 2 | — | No orphan |
| 4 | `listing.condition_*` (incl. `condition_label`) | 6 | 6 | — | No orphan |
| 5 | `listing.heating_*` (incl. `heating_label`) | 6 | 6 | — | No orphan |
| 6 | `listing.wall_*` (incl. `wall_type_label`) | 6 | 6 | — | No orphan |
| 7 | `listing.market_type_*` | 2 | 2 | — | No orphan |
| 8 | `listing.layout_*` | 5 | 5 | — | No orphan |
| 9 | `listing.offer_*` (incl. `offer_type`) | 4 | 4 | — | No orphan |
| 10 | `listing.purchase_*` (incl. `purchase_conditions`) | 6 | 6 | — | No orphan |
| 11 | `listing.land_legal_*` (incl. `land_legal_status`) | 5 | 5 | — | No orphan |
| 12 | `listing.land_zoning*` (incl. bare `land_zoning` label) | 6 | 6 | — | No orphan |
| 13 | `listing.land_dev*` (incl. `land_development_potential`) | 4 | 4 | — | No orphan |
| 14 | `listing.sort_*` | 5 | 6 | `sort_by` | **🟡 SUSPECTED ORPHAN** — see §7.2 |
| 15 | `listing.{sale,rent}` | 2 | 2 | — | No orphan |
| 16 | `listing.{new,price_reduced}` | 2 | 2 | — | No orphan |
| 17 | `listing.{bedrooms,bathrooms,toilets}` | 3 | 3 | — | No orphan |
| 18 | `cabinet.filter_*` | 5 | 6 | `filter_PREMIUM` | **Found, NOT orphan** — static `t('filter_PREMIUM')` at `ListingsTab.tsx:203,313` |
| 19 | `cabinet.no_listings_*` | 5 | 5 | — | No orphan |
| 20 | `cabinet.status_*` | 6 | 6 | — | No orphan |
| 21 | `admin.currency.providers.mode_*` | 3 | 3 | — | No orphan |
| 22 | `admin.inquiries.{filter_*,filter_mailbox_*,status_*}` | 9 | 9 (within this sub-slice) | — (29 other `admin.inquiries.*` keys exist but are static UI strings outside this dynamic family) | No orphan in the audited slice; **wider `admin.inquiries.*` namespace NOT ASSESSED** (out of §2 scope — Task 317) |
| 23 | `admin.permissions.keys.*` / `descriptions.*` | 10 + 10 | 10 + 10 | — | No orphan |
| 24 | `admin.reports.{filter_*,status_*}` | 9 | 9 | — | No orphan |
| 25 | `admin.support.role_*` | 4 | 4 | — | No orphan |
| 26 | `admin.support.user_status_*` | 3 (expected) | 0 | — | **N/A — this is GAP #1 (missing, not orphan)**, already covered §3/§5 Bucket 1 |
| 27 | `admin.support.complaint_type_*` | 8 | 12 | `complaint_type_label`, `_placeholder`, `_required`, `_invalid` | **Found, NOT ASSESSED individually** — 4 extra keys are static form-field strings (label/placeholder/validation for the complaint-type `<select>`), plausibly in active use; outside the dynamic-`t()` family (§2 only enumerates the 8 `ComplaintType` value-keys). Not flagged as orphan without a static-usage grep, which is out of this audit's `t(\`...${var}\`)`/`t(var)` scope |
| 28 | `admin.support.support_status_*` + `filter_all_status` | 5 | 5 | — | No orphan |
| 29 | `admin.user_profile.profile_types.*` | 5 | 5 | — | No orphan |
| 30 | `admin.user_profile.validation.error_phone_*` | 3 (reachable) | 3 | — (4th union member `error_phone_country_mismatch` is *missing*, not extra — consistent with §1a dead-union finding, not an orphan) | No orphan; (10 other `admin.user_profile.validation.*` keys exist for static form validation, NOT ASSESSED — outside this family) |
| 31 | `admin.user_profile.statuses.*` | 3 | 3 | — | No orphan |
| 32 | `admin.users.role_*` | 4 | 4 | — | No orphan |
| 33 | `admin.users.user_status_*` | 3 | 3 | — | No orphan |
| 34 | `admin.users.filter_status_*` + `filter_status_all` | 4 | 4 | — | No orphan |

### 7.2 — Suspected orphan: `listing.sort_by`

- **Found in all 4 locale files** (under `listing.sort_by`, e.g. `sq.json` "Rendit sipas" /
  similar — present per §0 parity, so identical key exists in en/uk/it too).
- **Not part of the §2 `SORT_OPTIONS` enumeration** (site #78, `ListingsSortBar.tsx:79`), which
  only resolves `sort_newest`/`sort_price_asc`/`sort_price_desc`/`sort_area_desc`/`sort_area_asc`.
- **Grep for any static or dynamic reference to `sort_by` under the `listing` namespace returns
  zero hits** in `src/` (excluding `__tests__`). The only repo-wide match for the literal string
  `sort_by` is an unrelated Storybook test-id constant
  (`src/components/admin/AdminTable.stories.tsx:27`, `sortBy: 'sort_by'`) — a different
  namespace/purpose (admin table sort test-id), not a `listing.sort_by` translation lookup.
- **Verdict: SUSPECTED ORPHAN.** Likely a leftover label key from a "Sort by:" UI element that was
  either removed or never wired to `t()`. **Not a Task 320 fill target** (nothing to fill — key
  already exists and is fully translated in all 4 locales). Candidate for a future cleanup task
  (removal) once Task 317's repo-wide scanner confirms no other reference exists outside the
  `src/app|components|modules|lib|stories` tree audited here (e.g. emails, server actions).

### 7.3 — Summary

Of the 34 §2-derived families: **31 have no orphan**, **1 has a found-but-statically-used extra
key** (`property_type_placeholder`), **1 has a found-but-statically-used extra key**
(`filter_PREMIUM`), **1 has 4 extra static form-strings not individually assessed**
(`admin.support.complaint_type_{label,placeholder,required,invalid}`), and **1 is a suspected
orphan** (`listing.sort_by`, §7.2). The `admin.support.user_status_*` family is GAP #1 (missing
key, already tracked — not an orphan). A full repo-wide orphan sweep across all 1768 keys ×
all namespaces (beyond these 34 dynamic-key families) remains **Task 317**.

---

## Self-validation

- `git diff --stat src messages scripts` → **empty** (verified before writing this report and
  re-confirmed after — only `docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md`,
  `docs/sessions/2026-06-13-task316-i18n-dynamic-key-audit.md`, `docs/backlog.md` touched).
- Inventory: **83 sites = 51 (Pattern A) + 32 (Pattern B real)**, reconciled against 39 raw
  Pattern-B grep matches minus 7 documented false positives = 32. **count == grep.** ✅
- Per-locale missing-key matrix: parity-proof (§0) + 27-row table (§3) + 8 grep-verified cells
  (§3a, exceeds the ≥8 requirement). ✅
- Non-enumerable sites: 0 (all sources statically resolved); 1 dead-union-member informational
  finding (§1a) explicitly handled, not invented. ✅
- Raw-key-leakage: classified per next-intl v4 default `onError`+`getMessageFallback` behavior
  (§4), with the one live leak (#17 / Bucket 1) identified. ✅
- Task 320 buckets: 4 concrete buckets (§5), Bucket 1 = the only required message-file work,
  with both fix strategies and exact key lists. ✅
- Notification wrong-locale class cross-referenced to Task 318 (§6), distinguished from the
  missing-key class (Bucket 1). ✅
- Orphan keys: dedicated §7, family-scoped (34 §2-derived families), NOT based on 4-way parity —
  1 suspected orphan (`listing.sort_by`, §7.2), 3 found-but-out-of-family-scope keys documented,
  repo-wide sweep beyond these 34 families deferred to Task 317 per kickoff. ✅

**Self-validation: src/messages/scripts diff=empty · dynamic-t inventory complete (83 sites,
count==grep) · per-locale missing-key matrix shipped (8 cells grep-verified) · non-enumerable
sites flagged (0 unresolved, 1 informational dead-union finding) · orphan-keys §7 shipped
(family-scoped, 1 suspected: listing.sort_by) · Task 320 buckets ready · clauses 11/12/13 N/A
documented · clause 14 green · PASS**
