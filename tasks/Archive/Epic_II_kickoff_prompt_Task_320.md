# Epic II — Task 320 kickoff — Dynamic-key remediation (admin.support user_status namespace fix + floors_total label)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–14) FIRST.** Conforms to the
> current P0 contract. This is a small, surgical i18n remediation (admin component + one listing form-field + the
> scanner's manifest/baseline data). **The orchestrator (Opus) emits all `git add`/`git commit` commands at review; you
> NEVER run git.** **Depends on Task 316 audit** (`docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md`) and the
> Task 317/423 scanner (`scripts/check-i18n-dynamic.mjs` + `scripts/i18n-dynamic-manifest.json` +
> `scripts/i18n-dynamic-baseline.json`). **Owner decisions are LOCKED below — do NOT re-open; if anything else is
> ambiguous, STOP & ASK.**

```
Type:        bug (i18n dynamic-key remediation) — Epic II Phase 2
Priority:    high (live raw-key leak: admin sees "admin.support.user_status_active" text in the Support user card)
Area:        src/components/admin/AdminSupportManager.tsx (UserCard — Bucket 1)
             src/modules/listings/.../NumInputField.tsx (LABEL_KEYS — Bucket 3)
             messages/{sq,en,uk,it}.json (Bucket 3 only: +1 listing.floors_total key)
             scripts/i18n-dynamic-baseline.json (remove the 3 user_status entries)
             scripts/i18n-dynamic-manifest.json (site #17 namespace → admin.users; NumInputField site += floors_total)
Output:      The two known live i18n leaks from the Task 316 audit are fixed; check:i18n + check:i18n-dynamic exit 0
             with NO baselined user_status WARN remaining; no duplicated message keys added.
```

---

## Goal (concrete)

Fix the only two live i18n leaks the Task 316 audit found (everything else was 100% covered):

1. **Bucket 1 (highest priority — live raw-key leak).** `AdminSupportManager.tsx`'s `UserCard` calls
   `useTranslations('admin.support')` and, at line 123, `t(\`user_status_${user.status}\`)` — but `admin.support` has
   **no** `user_status_*` keys, so next-intl renders the **literal key string** (`admin.support.user_status_active` /
   `_blocked` / `_inactive`) into the status `<Badge>` and logs `MISSING_MESSAGE`. The **identical, correctly-translated**
   keys already exist under **`admin.users.user_status_*`** (all 4 locales). This is a **namespace mismatch, not a
   translation gap** (audit §5 Bucket 1).
2. **Bucket 3 (narrow, adjacent).** `NumInputField.tsx`'s `LABEL_KEYS` map omits `floors_total`, so for that field the
   component falls through to rendering the **raw field key `"floors_total"`** as the UI label (no `t()` call at all —
   audit §1b). Add the missing label key so the field shows a translated label.

---

## Owner decisions (LOCKED — from the AskUserQuestion gate on this kickoff, 2026-06-13)

1. **Bucket 1 = Strategy A (namespace fix), NOT key-fill.** Treat it as a namespace mismatch: in `UserCard`, resolve the
   user-status badge against the existing **`admin.users.user_status_*`** keys (a second `useTranslations('admin.users')`
   scope, or a small shared user-status-label helper). **Replace** the `admin.support.user_status_*` reference with
   `admin.users.user_status_*`. **Do NOT add new `admin.support.user_status_*` message keys** (no duplicated strings).
   Remove the leak from the scanner baseline so `check:i18n-dynamic` is green **without** the baselined WARN.
2. **Bucket 3 = fold `floors_total` into Task 320, narrowly.** Fix ONLY the known untranslated-label leak (1 `LABEL_KEYS`
   entry + 1 `listing.floors_total` key × 4 locales). **Do NOT expand into a broader listing-fields / i18n audit or sweep.**
   Adjust the scanner manifest/baseline for this one key if applicable; validate with `check:i18n` / `check:i18n-dynamic`
   / `tsc` + targeted rendered proof since the label appears in UI.

## Architecture decisions (DECIDED by the orchestrator — do NOT re-invent; STOP & ASK if blocking)

1. **UserCard change (Bucket 1):** keep the existing `const t = useTranslations('admin.support')` for `role_*` + aria
   strings; add `const tu = useTranslations('admin.users')` and change **only** line 123 from
   `t(\`user_status_${user.status}\` as \`user_status_active\`)` to `tu(\`user_status_${user.status}\` as
   \`user_status_active\`)`. The status-variant logic (`USER_STATUS_VARIANT`, line 114-115) and the `{user.status && …}`
   guard (line 122) are **unchanged**. No other call site changes — the audit confirms line 123 is the ONLY
   `admin.support.user_status_*` site (sites #38/#41 are already `admin.users`, #35/#36 are `admin.user_profile.statuses`).
   (A small `getUserStatusLabel(status, t)` helper in `src/lib/i18n/` mirroring `getListingStatusLabel` is an acceptable
   alternative IF you find a second consumer; for a single call site the second-`useTranslations` is simpler and
   preferred — do not over-engineer.)
2. **Scanner manifest (`scripts/i18n-dynamic-manifest.json`):** update the entry whose `site` is
   `src/components/admin/AdminSupportManager.tsx:123` (id `admin-support-user-status`): change `"namespace"` from
   `"admin.support"` to `"admin.users"` (keys unchanged: `user_status_active/blocked/inactive`), and update its `"note"`
   to record the Task 320 namespace fix. The scanner then checks `admin.users.user_status_*` (present) → green.
3. **Scanner baseline (`scripts/i18n-dynamic-baseline.json`):** remove all **3** entries
   (`admin.support.user_status_{active,blocked,inactive}`). After Strategy A the keys are no longer referenced under
   `admin.support`, so there is nothing to baseline; the file becomes `{}` (an empty object — keep it valid JSON, do not
   delete the file unless the scanner treats a missing file as an error; verify the scanner's empty-baseline behavior
   first).
4. **Bucket 3 key + map:** add `floors_total` to `NumInputField.tsx`'s `LABEL_KEYS` mapping (→ key `floors_total` in the
   `listing` namespace, consistent with the sibling `bedrooms`/`bathrooms`/`toilets` entries), and add **`listing.floors_total`**
   to all 4 `messages/*.json` with proper sq/en/uk/it translations (e.g. sq "Numri i kateve", en "Total floors",
   uk "Кількість поверхів", it "Numero di piani" — confirm final wording against sibling field labels for consistency).
   Then update the scanner manifest entry for the `NumInputField.tsx` site (audit §2 site #63 — `LABEL_KEYS`
   bedrooms/bathrooms/toilets) to ALSO include `floors_total` in its `keys` array, so the scanner stays exhaustive and
   green. No baseline entry is needed for `floors_total` (it was never baselined — it was a non-`t()` raw label, not a
   dynamic-`t()` miss).
5. **No new duplicated keys, no other buckets.** Audit Bucket 2 (dead `PhoneErrorKey` union member) needs no action.
   Bucket 4 (Storybook component) has no gap. The §7.2 suspected orphan `listing.sort_by` is **NOT** in scope (removal is
   deferred to a future cleanup task gated on Task 317's repo-wide scan).

## Pre-read (mandatory — do NOT "read all docs")

1. **Always:** `docs/agent-contract.md` (clauses 1–14) · `docs/backlog.md`.
2. **The authoritative source:** `docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md` — §1 site #17 + #63,
   §2 (resolved key sets), §3/§3a (the user_status 0/3 gap, grep-verified), §5 Bucket 1 + Bucket 3, §7.2 (the orphan you
   must NOT touch).
3. **i18n:** `docs/i18n-rules.md` (the dynamic-key manifest rule from Task 317/423) + `docs/ai-behavior.md` →
   "Localization (i18n) Rules".
4. **UI/component:** `docs/ui-rules.md` · `docs/component-rules.md` · `docs/qa-rules.md`.
5. **Scanner conventions:** read `scripts/check-i18n-dynamic.mjs` (how it loads manifest + baseline, what an empty
   baseline does, exit codes, `--report`), `scripts/i18n-dynamic-manifest.json` (entry shape), and
   `scripts/i18n-dynamic-baseline.json` (current 3 entries) BEFORE editing them.
6. **Source to change:** `src/components/admin/AdminSupportManager.tsx` `UserCard` (lines 111-131) and the
   `NumInputField.tsx` `LABEL_KEYS` block (audit §1b / site #63). Confirm `admin.users.user_status_*` exists in all 4
   locales before relying on it (audit §3 says ✅✅✅✅).
7. Inspect `package.json` for `check:i18n`, `check:i18n-dynamic`, `tsc`, `lint` script names.

## Current behavior to preserve (Note 20 / clause 3 — this task removes NO controls)

- **UserCard** (`AdminSupportManager.tsx`): the role `<Badge>` (line 121, `admin.support.role_*` — unchanged), the
  status `<Badge>` with its `USER_STATUS_VARIANT` colour mapping and `{user.status && …}` guard, the phone span, company
  name, id snippet, and the clear `<Button>` (aria via `admin.support`). ALL remain; only the status badge's **label
  source namespace** changes (raw key → translated `admin.users` label).
- **NumInputField**: the existing `bedrooms`/`bathrooms`/`toilets` labels and all numeric-input behavior — unchanged;
  only the previously-raw `floors_total` field gains a translated label.
- **Scanner**: `check:i18n-dynamic` must keep passing; after the baseline removal it must pass **without** the
  user_status WARN (stricter, not weaker).

## Positive flow (happy path)

- **Bucket 1:** an admin opens `/admin/support`, creates/opens a `user_complaint` ticket, and the reported user is shown
  in `UserCard`. The status `<Badge>` renders the **translated** label in the admin's current locale —
  sq "Aktiv", en "Active", uk "Активний", it "Attivo" (from `admin.users.user_status_*`) — **not** the raw string
  `admin.support.user_status_active`. Switching the site locale re-renders the correct translation.
- **Bucket 3:** on the listing form, for a property type whose schema includes `floors_total`, the `NumInputField` renders
  a **translated label** (e.g. uk "Кількість поверхів") instead of the raw `"floors_total"`.

## Negative flow (every off-happy-path branch — implement/verify ALL)

- **`user.status` null/undefined:** the existing `{user.status && …}` guard suppresses the badge (no empty/raw badge).
  Preserve — verifiable at line 122.
- **`user.status` outside the enum:** `USER_STATUS_VARIANT[...] ?? 'neutral'` variant fallback preserved; the label cast
  `as 'user_status_active'` only ever receives valid `UserStatus` values (`active|blocked|inactive`). No raw-key leak
  because all three resolve under `admin.users`.
- **Missing-key safety:** confirm `admin.users.user_status_{active,blocked,inactive}` exist in **all 4** locales (audit
  §3 ✅) so the namespace switch cannot itself introduce a leak; confirm `listing.floors_total` has **4-locale parity**
  for the same reason (Bucket 3). A missing locale here would re-introduce a raw-key leak — `check:i18n` must catch it.
- **Scanner gate-is-real proof (MANDATORY):** after removing the 3 baseline entries, run `check:i18n-dynamic` → exit 0
  with no user_status WARN. Then temporarily revert line 123 to `admin.support` (or delete `admin.users.user_status_active`
  from `en.json`) → scanner ERRORs and exits non-zero → restore → green. Paste both transcripts in the session log.
- **`floors_total` manifest sync:** if `floors_total` is added to `LABEL_KEYS` but NOT to the NumInputField manifest
  entry, the scanner would miss it; if added to the manifest but the `listing.floors_total` key is missing in a locale,
  the scanner ERRORs. Both must be consistent → green.

## Acceptance criteria (each maps to a flow / decision)

- **Bucket 1:** `UserCard` resolves `user_status_*` via `admin.users` (second `useTranslations` or helper); line 123 no
  longer references `admin.support.user_status_*`; **grep confirms zero `admin.support.user_status` references remain in
  `src/`**; **no new `admin.support.user_status_*` keys added** to any `messages/*.json` (Strategy A — decision 1).
- **Baseline:** all 3 `admin.support.user_status_*` entries removed from `scripts/i18n-dynamic-baseline.json`;
  `check:i18n-dynamic` exits 0 **without** a baselined user_status WARN (decision 3 + gate-is-real transcript).
- **Manifest:** the `AdminSupportManager.tsx:123` entry namespace updated to `admin.users` (keys unchanged, note updated);
  the `NumInputField.tsx` entry `keys` includes `floors_total` (decisions 2 + 4).
- **Bucket 3:** `NumInputField.tsx` `LABEL_KEYS` gains `floors_total`; `listing.floors_total` added to all 4
  `messages/*.json` with sq/en/uk/it parity; the field renders a translated label, not the raw key (decision 4).
- **Gates:** `npm run check:i18n` exit 0 (parity) · `npm run check:i18n-dynamic` exit 0 (no user_status WARN) ·
  `npx tsc --noEmit` 0 errors · `npm run build` passes · lint clean for touched files.
- **Clause 11/12 rendered proof (targeted):** session log includes rendered evidence that (a) the `UserCard` status badge
  shows the translated label (NOT a raw `admin.support.user_status_*` key) in **sq/en/uk/it**, and (b) the `floors_total`
  field shows a translated label in **sq/en/uk/it**; **uk@320/375/390 mandatory**; labels wrap (`whitespace-normal
  break-words` where applicable), no clip, no horizontal scroll at 320. No layout/full-width changes are introduced —
  state this explicitly (no new containers/buttons → the mobile <640 full-width-control rule has nothing new to apply;
  existing admin/form layout unchanged).
- **Clause 14 (file-integrity):** after writing each file, read it back; before claiming complete paste the GREEN
  integrity transcript for every touched file (`tr -cd '\000' < f | wc -c`=0, no BOM, `node --check`/`tsc`, `JSON.parse`
  on every edited `.json` incl. the baseline + manifest).
- **Clause 10:** `docs/backlog.md` updated; session log under `docs/sessions/` with a **"Files Changed" table**; executor
  emits **NO** git.
- Existing controls/flows preserved (Note 20 before/after note for UserCard).

## Out of scope

- **Strategy B (duplicating `user_status_*` keys under `admin.support`)** — explicitly rejected (decision 1).
- **Any broader listing-fields / i18n audit or sweep** beyond the single `floors_total` label (decision 2).
- **§7.2 orphan `listing.sort_by`** — do NOT remove/touch; deferred to a future cleanup task after Task 317's repo-wide
  scan confirms no other reference.
- **Audit Bucket 2** (dead `PhoneErrorKey` union member) — no action.
- **The scanner script `scripts/check-i18n-dynamic.mjs` itself** — only edit its manifest + baseline **data** files; do
  not change scanner logic (that is Task 323).
- **Notification work** (Tasks 318/319/424) and **CI wiring** (Task 323).
- **Any other `t(\`...${var}\`)` site** from the audit's 83 — all others are at 100% parity; do not modify them.
- **Any `git add`/`git commit`** — orchestrator emits commits at review (clause 10).
```
