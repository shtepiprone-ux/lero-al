# Task 320 — i18n dynamic-key remediation (Epic II Phase 2)

**Date:** 2026-06-13
**Source:** `tasks/Epics/Epic_II_kickoff_prompt_Task_320.md`
**Executor:** Sonnet 4.6

## Summary

Two narrow, owner-locked fixes from the Task 316 audit (`docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md`):

- **Bucket 1 (Strategy A — namespace fix, live raw-key leak):** `AdminSupportManager.tsx`'s
  `UserCard` status badge called `useTranslations('admin.support')` and resolved
  `user_status_active/blocked/inactive`, which do **not exist** in `admin.support` — rendering
  the literal string `admin.support.user_status_active` etc. Fixed by adding a second
  `useTranslations('admin.users')` scope (`tu`) and resolving the status badge via
  `tu(\`user_status_${user.status}\`)`, reusing the existing, fully-translated
  `admin.users.user_status_*` keys (same set already used by `AdminUsersTable.tsx`). No new
  `admin.support.user_status_*` keys added — Strategy B explicitly rejected.
- **Bucket 3 (narrow, adjacent):** `NumInputField.tsx`'s `LABEL_KEYS` map omitted `floors_total`,
  so that field rendered the raw key `"floors_total"` (no `t()` call at all). Added
  `floors_total: { ns: 'listing', key: 'floors_total' }` to `LABEL_KEYS` and added
  `listing.floors_total` to all 4 `messages/*.json` (sq/en/uk/it), reusing the existing
  `listing.total_floors` wording (same field concept, different label slot): sq "Katshmëria",
  en "Total floors", uk "Поверховість", it "Piani totali".

## Bucket 1 — UserCard namespace fix

`src/components/admin/AdminSupportManager.tsx` `UserCard`:

```tsx
// before
const t = useTranslations('admin.support')
...
{user.status && (
  <Badge variant={statusVariant} className="text-2xs h-4 px-1">{t(`user_status_${user.status}` as `user_status_active`)}</Badge>
)}

// after
const t = useTranslations('admin.support')
const tu = useTranslations('admin.users')
...
{user.status && (
  <Badge variant={statusVariant} className="text-2xs h-4 px-1">{tu(`user_status_${user.status}` as `user_status_active`)}</Badge>
)}
```

Everything else in `UserCard` (role badge via `t`, phone, company name, id snippet, clear
button `aria-label` via `t('aria_clear_selection')`) **unchanged**.

Additionally, `UserCard` and the `PickerUser` interface were marked `export` (additive,
non-breaking — purely adds visibility) so a QA-only Storybook story could render `UserCard`
directly without going through the live user-search dialog (`searchUsersForPicker` is a
server action requiring Supabase admin access, unusable in Storybook).

### Grep-zero-references proof (Bucket 1 AC)

```
$ grep -rn "admin\.support\.user_status" src/
(no matches)

$ grep -n "user_status" src/components/admin/AdminSupportManager.tsx
124:            <Badge variant={statusVariant} className="text-2xs h-4 px-1">{tu(`user_status_${user.status}` as `user_status_active`)}</Badge>
```

Zero `admin.support.user_status` references remain; the single `user_status_*` site now
resolves via `admin.users` (`tu`).

## Bucket 3 — NumInputField floors_total label

`src/modules/listings/components/form/NumInputField.tsx` `LABEL_KEYS`:

```ts
// before
const LABEL_KEYS: Partial<Record<ListingField, { ns: 'listing' | 'common'; key: string }>> = {
  bedrooms:  { ns: 'listing', key: 'bedrooms' },
  bathrooms: { ns: 'listing', key: 'bathrooms' },
  toilets:   { ns: 'listing', key: 'toilets' },
}

// after
const LABEL_KEYS: Partial<Record<ListingField, { ns: 'listing' | 'common'; key: string }>> = {
  bedrooms:    { ns: 'listing', key: 'bedrooms' },
  bathrooms:   { ns: 'listing', key: 'bathrooms' },
  toilets:     { ns: 'listing', key: 'toilets' },
  floors_total: { ns: 'listing', key: 'floors_total' },
}
```

`messages/{sq,en,uk,it}.json` — added `"floors_total"` to the `listing` namespace, immediately
after `"toilets"`:

| Locale | Value |
|---|---|
| sq | Katshmëria |
| en | Total floors |
| uk | Поверховість |
| it | Piani totali |

(Reuses the exact wording already established for `listing.total_floors`, the closest sibling
field for the same concept.)

## Manifest + baseline updates

`scripts/i18n-dynamic-manifest.json`:

- Entry `admin-support-user-status` (site `AdminSupportManager.tsx:123`): `namespace` changed
  from `"admin.support"` → `"admin.users"` (keys unchanged: `user_status_active`,
  `user_status_blocked`, `user_status_inactive`); `note` updated to record the Task 320
  namespace fix (Strategy A) and that it now matches `admin-users-user-status` (#38/#41).
- Entry `listing-presentation-engine-labels` (site `page.tsx:438`, covers the LABEL_KEYS
  bedrooms/bathrooms/toilets set #63): `keys` array gained `floors_total`; `note` updated to
  record the `NumInputField.tsx` LABEL_KEYS addition.

`scripts/i18n-dynamic-baseline.json`: all 3 `admin.support.user_status_*` entries removed.
File is now a valid empty JSON object `{}` (1 line + trailing newline). Confirmed
`check-i18n-dynamic.mjs` handles an empty baseline correctly (`Object.entries({})` iterates
zero times).

## Scanner gate-is-real proof (mandatory, 3 transcripts)

**1. Positive (before any plant) — PASSED, 0 baselined-warn, 0 error:**

```
check:i18n-dynamic — 34 manifest entries, 195 distinct namespace.key pairs, 4 locales
  Source: docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md §2 (Task 316)

  All manifest-resolved keys present in all 4 locale files.

Summary: 195 keys checked · 4 locales · 0 baselined-warn(s) · 0 error(s)

check:i18n-dynamic PASSED.
```

**2. Negative (planted: deleted `admin.users.user_status_active` from `messages/en.json`) —
FAILED, non-zero exit:**

```
ERROR  admin.users.user_status_active  [en]

Summary: 195 keys checked · 4 locales · 0 baselined-warn(s) · 1 error(s)

check:i18n-dynamic FAILED — 1 non-baselined missing key(s) (see ERROR lines above).
```

**3. Restore (re-added `"user_status_active": "Active"` to `admin.users` in `messages/en.json`,
in the same position as sq/uk/it — immediately before `user_status_blocked`) — back to
PASSED:**

```
check:i18n-dynamic — 34 manifest entries, 195 distinct namespace.key pairs, 4 locales
  Source: docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md §2 (Task 316)

  All manifest-resolved keys present in all 4 locale files.

Summary: 195 keys checked · 4 locales · 0 baselined-warn(s) · 0 error(s)

check:i18n-dynamic PASSED.
```

Confirmed all 4 locales' `admin.users.user_status_*` keys are present and in the same order
(`active, blocked, inactive`):

```
sq user_status_active=Aktiv, user_status_blocked=Bllokuar, user_status_inactive=Joaktiv
en user_status_active=Active, user_status_blocked=Blocked, user_status_inactive=Inactive
uk user_status_active=Активний, user_status_blocked=Заблокований, user_status_inactive=Неактивний
it user_status_active=Attivo, user_status_blocked=Bloccato, user_status_inactive=Non attivo
```

## Other gates

```
$ npm run check:i18n
✅ Parity PASSED — all 4 locale files have identical key sets (1781 keys).
⚠️  Raw-enum scan found potential issues — see above for manual review. (Non-blocking)
```

The raw-enum scan flags `AdminSupportManager.tsx:124` (`{user.status}` inside the
template-literal `user_status_${user.status}`). This is a **pre-existing false positive**,
confirmed identical for both the old `t(...)` line and the new `tu(...)` line via a direct
regex test — not newly introduced by this change, and the scan is non-blocking (does not fail
build).

```
$ npx tsc --noEmit
(0 errors)

$ npx eslint <touched files>
(clean)

$ npm run build
(succeeds — full route manifest printed, no errors)
```

## Clause 11/12 rendered-evidence proof

No layout/full-width changes were introduced — both fixes are label-text-only (namespace swap
for an existing badge; adding a translated label where a raw key previously rendered). No new
containers, buttons, popups, or breakpoints. **The mobile <640 full-width-control rule has
nothing new to apply** — existing admin/form layout unchanged.

To produce rendered proof without the live user-search dialog (`searchUsersForPicker` is a
Supabase-backed server action, unusable in Storybook), `UserCard` and `PickerUser` were marked
`export` (additive only) and two new Storybook stories were added:

- `Admin/AdminSupportManager` → `UserCardStatusBadges` (+ `Mobile320`/`Mobile375`/`Mobile390`
  variants, uk locale): renders `UserCard` directly for three fixture users with
  `status: active/blocked/inactive`.
- `Listings/Form/NumInputField` → `FloorsTotal` (+ `Mobile320`/`Mobile375`/`Mobile390`
  variants, uk locale): renders the `floors_total` field in isolation.

QA script `scripts/task320-qa-i18n-fixes.mjs` ran both stories × sq/en/uk/it × {320, 375, 390,
1280}px against `storybook-static/` (Playwright/chromium), asserting:
- UserCard: no card's text contains the raw-key substring `admin.support.user_status`, and no
  card overflows its container (`scrollWidth <= clientWidth + 2`).
- NumInputField: the field's `<label>` text is non-empty, is not the raw key `"floors_total"`,
  and does not overflow.

**Result: 32/32 PASS** (2 stories × 4 locales × 4 viewports). uk@320/375/390 screenshots
captured to `.screenshots/task320-qa/2026-06-13_21-45/`.

Rendered label text (desktop-1280, representative of all viewports — no wrapping/overflow at
any tested width):

| Story | sq | en | uk | it |
|---|---|---|---|---|
| UserCard status badge (active/blocked/inactive) | Aktiv / Bllokuar / Joaktiv | Active / Blocked / Inactive | Активний / Заблокований / Неактивний | Attivo / Bloccato / Non attivo |
| NumInputField `floors_total` label | Katshmëria | Total floors | Поверховість | Piani totali |

None of the 32 cells contain the raw-key leak `admin.support.user_status_*` or the literal
string `"floors_total"`; all labels render translated text, wrap normally (`flex-wrap` /
default label wrap), no clip, no horizontal overflow at 320px in any locale (uk, the longest
strings, included).

## Clause 14 — file-integrity transcripts

All touched files: 0 NUL bytes, no BOM (first bytes are ASCII `{`/`i`/`e`), valid JSON
(`JSON.parse` succeeds for all 6 edited `.json` files including the now-empty
`i18n-dynamic-baseline.json` → `{}`), `npx tsc --noEmit` 0 errors across the whole project,
`npx eslint` clean on all 4 touched/added source files.

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `src/components/admin/AdminSupportManager.tsx` | Added `const tu = useTranslations('admin.users')`; changed status-badge `t(...)` → `tu(...)`; marked `UserCard` and `PickerUser` `export` | Bucket 1 Strategy A namespace fix + QA-only visibility for Storybook story |
| `src/components/admin/AdminSupportManager.stories.tsx` | Added `UserCardStatusBadges` story + 3 mobile (320/375/390, uk) variants | Clause 11/12 rendered proof for Bucket 1 |
| `src/modules/listings/components/form/NumInputField.tsx` | Added `floors_total: { ns: 'listing', key: 'floors_total' }` to `LABEL_KEYS` | Bucket 3 raw-key-leak fix |
| `src/modules/listings/components/form/NumInputField.stories.tsx` | New file: `FloorsTotal` story + 3 mobile (320/375/390, uk) variants | Clause 11/12 rendered proof for Bucket 3 |
| `messages/sq.json` | Added `listing.floors_total: "Katshmëria"` | Bucket 3 locale parity |
| `messages/en.json` | Added `listing.floors_total: "Total floors"` | Bucket 3 locale parity |
| `messages/uk.json` | Added `listing.floors_total: "Поверховість"` | Bucket 3 locale parity |
| `messages/it.json` | Added `listing.floors_total: "Piani totali"` | Bucket 3 locale parity |
| `scripts/i18n-dynamic-manifest.json` | `admin-support-user-status` entry namespace → `admin.users` (note updated); `listing-presentation-engine-labels` entry `keys` gained `floors_total` (note updated) | Manifest sync for both buckets |
| `scripts/i18n-dynamic-baseline.json` | Removed all 3 `admin.support.user_status_*` entries → `{}` | Decision 3 — Strategy A means no baselined gap remains |
| `scripts/task320-qa-i18n-fixes.mjs` | New QA script (Playwright/Storybook screenshot + assertion matrix) | Clause 11/12 rendered-evidence proof |

No git commands run by executor — orchestrator emits explicit-path `git add`/`git commit` at
review.

## Addendum — QA hardening (`tasks/Epics/Epic_II_kickoff_prompt_Task_320_ADDENDUM_qa_hardening.md`)

The Task 320 product fix (UserCard `tu('admin.users')` namespace swap + `NumInputField`
`floors_total` label) was reviewed and **APPROVED, unchanged**. The reviewer flagged that
`scripts/task320-qa-i18n-fixes.mjs` only asserted "not a raw key", not the exact expected
localized text — so a silently-wrong translation could pass the gate. Hardened
`scripts/task320-qa-i18n-fixes.mjs` (the ONLY file touched in this addendum):

- Added `EXPECTED_USER_STATUS` (sq/en/uk/it × [active, blocked, inactive]) and
  `EXPECTED_FLOORS_TOTAL` (sq/en/uk/it) tables, verified against
  `messages/{sq,en,uk,it}.json` → `admin.users.user_status_*` and `listing.floors_total`
  (same values already confirmed in the main session-log table above — not invented).
- `UserCardStatusBadges.validate` now additionally asserts each of the 3 cards (in fixture
  order: active, blocked, inactive) contains its expected localized label for the active
  locale.
- `NumInputField.FloorsTotal.validate` now additionally asserts the `<label>` text **exactly
  equals** the expected `listing.floors_total` translation for the active locale.
- `validate(rows, locale)` — `locale` threaded through from the existing per-cell loop.
- No new stories, viewports, or screenshots; product code/locale files/manifest/baseline
  untouched.

### Positive flow (re-run, hardened assertions)

```
Results: 32/32 PASS, 0 FAIL
```

(`.screenshots/task320-qa/2026-06-13_21-58/manifest.json`; uk@320/375/390 screenshots
re-captured.)

### Negative flow — gate-is-real (mandatory)

Planted `EXPECTED_USER_STATUS.en[0]` = `'WRONG'` (was `'Active'`):

```
Results: 28/32 PASS, 4 FAIL
exit=1
```

(`.screenshots/task320-qa/2026-06-13_22-00/manifest.json`) — the 4 failing cells are the `en`
locale UserCardStatusBadges cells (320/375/390/1280), confirming the new exact-label assertion
actually bites (the prior "≠ raw key" check could not have caught this).

Restored `EXPECTED_USER_STATUS.en[0]` = `'Active'`:

```
Results: 32/32 PASS, 0 FAIL
exit=0
```

(`.screenshots/task320-qa/2026-06-13_22-01/manifest.json`)

### Clause 14 — file integrity (`scripts/task320-qa-i18n-fixes.mjs`)

```
$ node --check scripts/task320-qa-i18n-fixes.mjs
OK

$ tr -cd '\000' < scripts/task320-qa-i18n-fixes.mjs | wc -c
0

$ head -c3 scripts/task320-qa-i18n-fixes.mjs | xxd -p
23212f   (i.e. "#!/" — shebang, no BOM)

$ tail -5 scripts/task320-qa-i18n-fixes.mjs
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Addendum — Files Changed

| File | Change | Rationale |
|---|---|---|
| `scripts/task320-qa-i18n-fixes.mjs` | Added `EXPECTED_USER_STATUS`/`EXPECTED_FLOORS_TOTAL` tables; hardened both stories' `validate(rows, locale)` to assert exact expected localized text, not just "≠ raw key" | Addendum — clause 12/13 proof-of-result hardening |

No git commands run by executor — orchestrator emits explicit-path `git add`/`git commit` at
review for both the Task 320 product fix and this addendum together.

## AC self-audit

- [x] Bucket 1 Strategy A — `tu('admin.users')` resolves status badge; grep-zero confirms no
  `admin.support.user_status` references remain.
- [x] Baseline — 3 entries removed → `{}`; `check:i18n-dynamic` exits 0 without user_status WARN.
- [x] Manifest — namespace + floors_total sync done.
- [x] Bucket 3 — `LABEL_KEYS` + 4-locale `listing.floors_total` parity.
- [x] Gates — `check:i18n` / `check:i18n-dynamic` / `tsc` / `build` / lint all green.
- [x] Gate-is-real — positive → negative (ERROR, non-zero) → restore → green, all 3 transcripts
  captured.
- [x] Clause 11/12 — rendered evidence, sq/en/uk/it, uk@320/375/390, no wrap/clip/h-scroll
  issues, explicit no-layout-change note.
- [x] Clause 14 — file-integrity transcripts for every touched file.
- [x] Clause 10 — backlog updated, Files Changed table present, no git from executor.
