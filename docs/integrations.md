## External Service Accounts
The following external service accounts are already registered and available for integration; project-side configuration may still be required.

| Service | URL | Purpose |
|---|---|---|
| Supabase | https://supabase.com | Database + Auth |
| Cloudflare | https://dash.cloudflare.com | Hosting + CDN + DNS |
| Cloudinary | https://cloudinary.com | Photo storage + transformations |
| Resend | https://resend.com | Transactional emails |
| Sentry | https://sentry.io | Error monitoring |
| GitHub | https://github.com | Code repository |

### Exchange Rate Pipeline (Task 175 / Epic M.1; updated Task 214 / M.5)

**Canonical source: iliria98.com** — the only authoritative source for ALL-denominated exchange rates on this platform.

| Role | Service | What it provides |
|---|---|---|
| **Primary / canonical** | `iliria98.com` | ALL/X rates scraped directly for every active catalog currency |
| **Derivation helper** | `open.er-api.com` | EUR/X cross-rates — used ONLY as a denominator when a rate is absent from iliria98 |

**Pipeline (executed in `src/lib/getExchangeRate.ts`):**

1. Read active currency codes from the `currencies` DB table (admin client, excludes `ALL` — the implicit pivot).
2. Single HTTP GET to `https://iliria98.com/` scrapes ALL/X rates for every active currency in one request.
3. EUR/ALL is mandatory — if unavailable, the whole cache entry returns `null` (no rates served).
4. For each active currency **absent** from iliria98:
   - Derivation fallback fires: `X/ALL = EUR/ALL ÷ EUR/X` (cross-rate from open.er-api.com, single request covers all missing codes).
   - The EUR/ALL pivot **always** comes from iliria98 — open.er-api.com never provides the ALL value directly.
   - If derivation also fails (both sources unavailable): that currency is **excluded** from `rates` — it is never faked or hardcoded.
5. The returned `ExchangeRates` map (`Record<string, number>`) covers every active catalog currency for which a real rate was obtained.

**"Not on iliria98" policy (Task 214):** If an admin enables a currency in the catalog that iliria98 does not publish:
- The derivation fallback via open.er-api.com fires automatically (same as the existing USD/GBP fallback).
- If open.er-api.com also doesn't carry it, the currency is silently excluded from `rates` (no error, no faked value).
- The card layer (Task 215) handles `rates[code] === undefined` by falling back to the listing's original currency — no crash.
- No code change is needed when enabling a new currency in admin; the next cache refresh (≤1 h) picks it up automatically.

**Cache:** `unstable_cache` with `revalidate: 3600` (1 h) on the server; client-side singleton in `useExchangeRate` with a matching 1 h TTL.

**API route:** `GET /api/exchange-rate` — ISR `revalidate: 3600`; returns `{ rates, rate, updated_at }`.

**Adding a new currency:** enable it in the admin currency catalog. If iliria98 publishes it, its rate appears in the next cache refresh with no code change. If you need to add tighter sanity bounds for the scraped number, extend `ALL_RATE_BOUNDS` in `getExchangeRate.ts` (optional — the default `[0, 9999]` handles most cases). Do NOT add a new external rate source without orchestrator approval.

### Cloudinary Setup
- Account is registered at https://cloudinary.com.
- Use Cloudinary for ALL property photo uploads AND user avatar uploads — never Supabase Storage.
- Auto-transformations to set up in Cloudinary:
  - Thumbnail: `w_400,h_300,c_fill,f_webp,q_auto`;
  - Card image: `w_800,h_600,c_fill,f_webp,q_auto`;
  - Full size: `w_1920,f_webp,q_auto`.
- Environment variables needed:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — from Cloudinary dashboard;
  - `CLOUDINARY_API_KEY` — from Cloudinary dashboard (server-only);
  - `CLOUDINARY_API_SECRET` — from Cloudinary dashboard (server-only, never expose to client).

### Cloudinary Canonical Folder Tree (Epic H — established Task 141 / H.1)

All assets MUST live under a canonical folder path. Use `uploadToCloudinary` from
`src/lib/cloudinaryUpload.ts` exclusively — never inline a custom upload.

```
Cloudinary root
├── <user_id>/                        # all user-owned assets (H.1 root)
│   ├── avatars/                      # user profile pictures (H.2)
│   │   └── <file_id>                 # e.g. u-abc123/avatars/portrait
│   └── listings/                     # listing photos (H.4)
│       └── <listing_id>/
│           └── <file_id>             # e.g. u-abc123/listings/l-xyz789/img01
├── companies/                        # company logos — not user-owned (H.7)
│   └── <company_id>/
│       └── logo                      # e.g. companies/c-def456/logo
├── marketing/                        # marketing / CMS media (H.7)
│   └── <slug>/
│       └── <file_id>
└── popular_locations/                # location hero photos (H.7 / Epic J)
    └── <location_id>/
        └── <file_id>
```

**Implementation status:**
- Avatars: `<user_id>/avatars/<file_id>` ✅ (H.2 / Task 142)
- Listing images: create=`<user_id>/listings/<file_id>`, edit=`<user_id>/listings/<listing_id>/<file_id>` ✅ (H.4 / Task 143)
- Company logos: `companies/<company_id>/<file_id>` ✅ (H.7 / Task 147)
- Marketing assets: `marketing/<slug>/...` — placeholder (no uploader yet)
- Popular locations: `popular_locations/<id>/...` — placeholder (Epic J / Task 151)

**DB reference policy:**

| DB column | Format stored | How to get public_id |
|---|---|---|
| `users.avatar_url` | Full Cloudinary URL | `publicIdFromUrl(url)` from `src/lib/cloudinaryUpload.ts` |
| `listing_images.url` | Full Cloudinary URL | use `listing_images.public_id` (already stored) |
| `listing_images.public_id` | Cloudinary public_id | direct — used by H.5 cleanup |
| `companies.logo_url` | Full Cloudinary URL | `publicIdFromUrl(url)` from `src/lib/cloudinaryUpload.ts` |

Cleanup tasks (H.3, H.5) call `deleteAsset(publicId)` from the H.6 framework. For avatars (no
separate public_id column), derive via `publicIdFromUrl(users.avatar_url)`.

**Migration plan for existing assets (execution deferred to post-H.6):**

Step 1 — Inventory (dry-run, no changes):
```typescript
// Pseudo-code — actual script in the H.6 migration tooling
const avatars = await db.from('users').select('id, avatar_url').not('avatar_url', 'is', null)
for (const u of avatars) {
  const oldId = publicIdFromUrl(u.avatar_url)  // e.g. 'avatars/abc123'
  const newId = `${u.id}/avatars/${oldId?.split('/').pop()}` // e.g. 'u-xxx/avatars/abc123'
  console.log({ userId: u.id, oldId, newId })
}
```

Step 2 — Rename via Cloudinary Admin API (after H.6 dry-run passes):
- Call `POST /v1_1/<cloud>/image/rename` with `from_public_id` → `to_public_id`.
- Update DB column atomically in same transaction (where possible).
- Cloudinary rename preserves the asset; the old URL 301-redirects for 60 days.

Step 3 — Verify:
- DB references updated; old paths return 301→new path.
- Run H.6 reference-check: no DB row points to a non-existent asset.

**Blocked on:** H.6 safety audit + dry-run framework must land first.

### Cloudinary Deletion Rules (Epic H.6 / Task 144)

**deleteAsset is the ONLY allowed way to delete Cloudinary assets.**
Direct calls to the Cloudinary `/destroy` API are forbidden outside `src/lib/cloudinaryDelete.ts`.
Enforce via grep: `git grep "image/destroy" src/` must return only `cloudinaryDelete.ts`.

```typescript
import { deleteAsset } from '@/lib/cloudinaryDelete'

// H.3 avatar replacement cleanup:
await deleteAsset(oldPublicId, { reason: 'avatar_replaced' })

// H.5 listing image removal:
await deleteAsset(publicId, { reason: 'listing_image_removed' })
```

**Safety guarantees:**
1. **Reference check** — queries all DB tables (`listing_images.public_id`, `listing_images.url`,
   `users.avatar_url`, `companies.logo_url`; `popular_locations.photo` added in Epic J).
   If the asset is referenced anywhere, the delete is skipped and logged.
2. **Dry-run mode** — default everywhere. Real deletes require `CLOUDINARY_DELETE_MODE=enabled` in env.
3. **Structured log** — every call produces a `console.info('[deleteAsset]', {...})` entry with
   fields: `{ publicId, reason, dryRun, outcome, referencedIn?, error? }`.
   Outcomes: `SKIP_REFERENCED` | `DRY_RUN` | `DELETED` | `ERROR`.

**DB reference check tables:**

| Table | Column | Check type |
|---|---|---|
| `listing_images` | `public_id` | exact match (`.eq`) |
| `listing_images` | `url` | ILIKE `%publicId%` |
| `users` | `avatar_url` | ILIKE `%publicId%` |
| `companies` | `logo_url` | ILIKE `%publicId%` |
| `popular_locations` | `photo` | ILIKE — added in Epic J |

### Cloudinary Avatar Pipeline
- Avatars uploaded via `uploadUserAvatar` (admin) or `uploadCabinetAvatar` (cabinet) Server Actions.
- Server-side signed upload: `POST https://api.cloudinary.com/v1_1/{cloud}/image/upload` with SHA-1 signature.
- Upload folder: `<user_id>/avatars/` (H.2 / Task 142). Path is user-scoped for isolation.
- Avatar input accepts any dimensions ≥ 256×256 and ≤ 10 MB across JPG/PNG/WEBP. The client crops to 256×256 via canvas; the server validates the cropped result (MIME, size ≤ 2 MB, dimensions = 256×256).
- Client-side validation before crop modal: MIME ∈ {image/jpeg, image/png, image/webp}, source size ≤ 10 MB, source dimensions ≥ 256×256.
- Client crop: user pans/zooms inside a square crop frame; `AvatarCropModal` (react-easy-crop, lazy `next/dynamic`) renders 256×256 JPEG at q=0.92 via canvas.
- Admin create-user flow: avatar is optional. If selected, the cropped blob is held in memory and uploaded after `createAdminUser` succeeds with a userId. Upload failure is non-fatal.
- Server-side validation: MIME + size ≤ 2 MB + dimensions = 256×256 via Cloudinary response.
- Stored URL is the raw Cloudinary URL. Display via `<AppImage variant="avatar">` applies `w_192,h_192,c_fill` transform at render time.
  
### Resend Setup
- Account is registered at https://resend.com .
- Check the current Resend plan limits in the Resend dashboard before relying on quota assumptions.
- Packages installed: `resend@^6.12.3` (prod), `@react-email/components@^1.0.12` (prod), `react-email@^6.1.5` (dev).
- Environment variable needed: `RESEND_API_KEY` — from Resend dashboard (server-only).
- Use Resend for:
  - Email confirmation on registration;
  - Password reset emails;
  - New message notifications;
  - Saved search match notifications;
  - Support ticket replies;
  - Listing expiry warnings;
  - Email-change verification email (new address);
  - Email-change security notification (old address).
- All templates live in `src/modules/notifications/lib/emails/`.
- NEVER call Resend from client-side code — only from server actions or API routes.
- NEVER instantiate `new Resend(...)` outside `src/modules/notifications/lib/emails/send.ts`.

**Canonical send helper (Task 119)**: `src/modules/notifications/lib/emails/send.ts` — the only place that instantiates `new Resend(...)`. Call `sendEmail({ to, subject, react | html })` from any server action. Accepts a React Email component (rendered via `@react-email/render`) or a pre-built HTML string. Graceful no-key fallback: logs and returns silently if `RESEND_API_KEY` is absent.

**BaseEmail layout (Task 119)**: `src/modules/notifications/lib/emails/BaseEmail.tsx` — shared React Email layout component matching the approved design reference (`Epic_D_email_design_reference.html`). Top 3px coral strip, logo tile + wordmark, content slot, faint-grey footer. Brand accent `BRAND_ACCENT = '#EC5447'` is exported as a constant — never hardcode it per-template.

**Local email preview server**: `npm run email` — launches the React Email preview server at `http://localhost:3000` showing all templates in `src/modules/notifications/lib/emails/`. Templates added in future tasks (D.3, D.4, etc.) appear there automatically.

**Email-change flow**: `initiateEmailChange` and `resendEmailVerification` call `sendEmailChangeEmails()` from `src/modules/notifications/lib/emails/emailChange.ts`. Routes through the canonical send helper. Inline STRINGS (sq/en/uk/it) are preserved. If `RESEND_API_KEY` is absent, `sendEmail` logs and returns silently (graceful no-key fallback).

### Email Template Architecture (decided 2026-05-20)

**Chosen model: HYBRID — code-first React Email for critical transactional emails + DB-driven admin template manager (Epic D.2) for editable/marketing emails.**

Rationale: Resend is code-first (same team as React Email). Managing multilingual (sq/en/uk/it) transactional templates with dynamic data in the Resend dashboard is impractical (publish flow, 4 locales × N templates). Code-first templates version in git, are type-safe, and handle dynamic data + locale via props. The Resend dashboard is NOT the source of truth.

**Two layers:**

1. **Code-first React Email** (`@react-email/components`) — for critical transactional emails where correctness and version control matter. Source of truth = git.
   - A single shared `BaseEmail` layout (header/footer/branding) wraps every template.
   - Localization uses INLINE per-template strings (sq/en/uk/it), selected by a `locale` prop — emails render server-side outside the next-intl context. (Same pattern as the existing `emailChange.ts`.)
   - Templates live in `src/modules/notifications/lib/emails/`.
   - Sent through the single canonical send helper (Epic D.1) — only ONE place instantiates `new Resend(...)`.

2. **DB-driven admin template manager** (Epic D.2) — for editable / marketing / non-critical emails an admin should change without a deploy. Source of truth = DB table, edited in `/admin`.

**Template inventory (target ~9):**

| Template | Layer | Epic / Task |
|---|---|---|
| Email-change verify + security (exists) | code-first | done (`emailChange.ts`) |
| Email verification (registration) | code-first | D.3 |
| Password / login recovery | code-first | D.4 |
| Welcome email (post-registration) | code-first or admin | D.3 area |
| Inactivity warning — 3 months | code-first | D.5 |
| Inactivity final — 12 months | code-first | D.5 |
| Reporter notification (complaint outcome) | code-first | C.4 (after D.1+D.4) |
| Saved-search new-listing alert | admin-editable | E.4 |
| Price-change alert (favorites) | admin-editable | F.3 |

**Approved visual design reference:** `tasks/Epics/Epic_D_email_design_reference.html` — the approved look for all transactional emails (monochrome graphite + coral `#EC5447` accent, single CTA, 600px card, Vercel/ChatGPT/Appwrite style). The `BaseEmail` React Email layout (Task 119) re-implements this; every template wraps it.

**`email_templates` RLS matrix (Task 123 + Task 161):**

| Operation | Admin | Moderator | Note |
|---|---|---|---|
| SELECT | ✅ | ✅ | Read for review |
| INSERT | ✅ | ✅ | Create new templates |
| UPDATE | ✅ | ✅ | Edit content/status |
| DELETE | ✅ | ❌ | **Admin-only** (enforced in-code + RLS) |

In-code gate: `assertAdmin()` in `deleteEmailTemplateGroupAction` + `deleteEmailTemplateLocaleAction` (`src/modules/notifications/actions/emailTemplates.ts`).
Actions use `createAdminClient()` (service-role, bypasses RLS) → the in-code check is the primary gate. RLS provides defense-in-depth if a future code path uses a user-scoped client.

RLS SQL for `email_templates` table (from Task 123 session log; DELETE policy is admin-only):
```sql
-- SELECT/INSERT/UPDATE: admin + moderator
CREATE POLICY "email_templates_select" ON email_templates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin','moderator')));
CREATE POLICY "email_templates_insert" ON email_templates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin','moderator')));
CREATE POLICY "email_templates_update" ON email_templates FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin','moderator')));
-- DELETE: admin only
CREATE POLICY "email_templates_delete" ON email_templates FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
```

**Rules:**
- NEVER call Resend from client-side code — server actions / API routes only.
- ALL email-trigger failures surfaced to the client follow the Epic A error-code contract (server returns code, client resolves via `t()`).
- The Resend dashboard is for sender/domain verification and broadcasts only — NOT the transactional template store.
- Brand accent colour lives in ONE `BaseEmail` constant (`#EC5447` = `--brand-700`; darker `#BD4339` = `--brand-800` for AA-critical text). Never hardcode it per-template.

### Locale-aware sending (decided 2026-05-20)

**Every email is sent in the recipient's chosen language** (the locale they selected on the site / admin). A user who picked Ukrainian on the site receives Ukrainian emails — they are far more likely to understand them. Fallback chain: recipient locale → `sq` (default).

**Source of truth: `preferred_locale` column on the user profile.** Added in Task 119.

**Migration location confirmed (Task 119):** There is NO `supabase/` migrations folder in the repo. DB migrations are applied manually via the Supabase dashboard SQL editor. The `preferred_locale` migration SQL is in the Task 119 session log (`docs/sessions/2026-05-20-task-119-email-provider-setup.md`) and must be run by the owner in Supabase Dashboard → SQL Editor before deploying.

- `preferred_locale` is written whenever the user changes locale: `setAdminLocale` server action (`src/modules/admin/actions/locale.ts`) now also updates the user's profile row — covers both the public site LocaleSwitcher (via Header.tsx) and the admin panel LocaleSwitcher.
- On registration, `preferred_locale: locale` is passed in the `signUp` metadata by `AuthSheet.tsx` and `RegisterForm.tsx`, then written in `auth/callback/route.ts` `ensureUserProfile()`.
- `resolveUserLocale(userId, requestLocale?)` helper: `src/modules/notifications/lib/emails/resolveUserLocale.ts`. Fallback chain: profile `preferred_locale` → requestLocale → `sq`. Uses service-role client (no session available in email dispatch context).
- Background jobs (inactivity warnings D.5, saved-search E.4, price-change F.3) have NO request context → they MUST call `resolveUserLocale(userId)` to get the correct locale.
- `preferred_locale` type in `src/types/database.ts`: `string` (non-null, DB default `'sq'`).

### Supabase Auth emails — delegation (implemented Task 122 / Epic D.6)

**Status: IMPLEMENTED.** All Supabase auth emails are delegated to our system via the Supabase Send Email Hook. Regular users only receive our branded Resend + React Email templates.

**Architecture: Option B — Next.js API route** (not a Supabase Edge Function).
Rationale: app deploys to Vercel; project has no supabase/functions infrastructure; 9 existing API routes make this the natural fit; simpler deploy model.

**Hook endpoint:** `POST /api/auth-email-hook` (`src/app/api/auth-email-hook/route.ts`)

**Security:** Standard Webhooks signature verification (https://www.standardwebhooks.com) via the official `standardwebhooks` library. Supabase signs each request over `{webhook-id}.{webhook-timestamp}.{body}` with HMAC-SHA256 and sends the `webhook-id`, `webhook-timestamp`, and `webhook-signature` (`v1,<base64>`) headers. The hook secret (`SUPABASE_EMAIL_HOOK_SECRET`) is the dashboard-issued value in `v1,whsec_<base64>` format; the handler strips the `v1,` prefix and calls `Webhook.verify()`, which also enforces a timestamp tolerance (replay protection). It is NOT a JWT in `Authorization`, and NOT the `x-supabase-signature` header (that belongs to Postgres webhooks, not the HTTP Send Email Hook).

**Action-type → template map:**

| `email_action_type` | Template | Recipient |
|---|---|---|
| `signup` | `VerifyEmail` | `user.email` |
| `invite` | `VerifyEmail` | `user.email` |
| `recovery` | `RecoveryEmail` | `user.email` |
| `magiclink` | `MagicLinkEmail` | `user.email` |
| `email_change` | inline HTML (emailChange.ts pattern) | `user.new_email` |
| `reauthentication` | `ReauthEmail` (OTP display) | `user.email` |

**Action URL format (for link-based emails):**
`{SUPABASE_URL}/auth/v1/verify?token={token_hash}&type={email_action_type}&redirect_to={redirect_to}`

**Locale:** every email is sent in the recipient's language via `resolveUserLocale(user.id)` → `preferred_locale` → `sq` fallback.

**Owner registration steps (manual — cannot be done by code):**
1. Supabase Dashboard → Authentication → Hooks → "Send Email Hook"
2. Set **Hook URL**: `https://lero.al/api/auth-email-hook`
3. Set **Hook Secret**: use the secret Supabase generates in this dialog (format `v1,whsec_<base64>`) and store that exact value as `SUPABASE_EMAIL_HOOK_SECRET`. Do NOT invent your own random string — verification only passes against the dashboard-issued `v1,whsec_` secret.
4. Save. The hook is now active — Supabase will call our endpoint for every auth email instead of sending its own.
5. **Do NOT disable "Confirm email"** — Supabase still owns token validation and `email_confirmed_at`. The hook only replaces delivery.

**Verification after going live:**
- Sign up a test user → only one email arrives (our VerifyEmail template, not Supabase's default).
- Request password reset → only one email arrives (our RecoveryEmail template).
- No duplicate / double emails means the hook is working correctly.

**Note on email_change and our cabinet flow:**
Our `sendEmailChangeEmails()` (called from the cabinet) operates independently via its own token system — it is not affected by the Supabase hook. The hook handles Supabase-initiated `email_change` events (e.g. from `auth.updateUser({ email })`). Both flows can coexist without duplication.

- Implemented in **Epic D.6** (Task 122) — depends on D.1 (send helper) + D.3 (verification template) + D.4 (recovery template).
- ⚠️ Do NOT simply disable "Confirm email" in the dashboard — confirmation must stay required; the hook replaces delivery only.
- Hook registration (Dashboard → Authentication → Hooks) is a manual owner action — the agent cannot toggle it.

**Two distinct email levels (do not conflate):**

1. **User-facing auth emails** (confirm signup, magic link, password reset, email change, reauthentication) — sent to app end-users. PROJECT level (Auth config). These are the ones we delegate to our Resend system in D.6 / make disappear from Supabase's defaults.
2. **Supabase service / security / project emails** (project changes, security alerts, billing) — sent to the Supabase ACCOUNT / organization OWNER only. ACCOUNT level — never sent to app users, not controlled by app code. These are already "super-admin only" by design; D.6 does NOT touch them.

Owner clarification (2026-05-20): "emails only for super admin" = keep the account-level service/security emails going to the owner (level 2, already the case), and make the user-facing ones (level 1) disappear from Supabase and be served by our system. → No extra code needed for level 2; owner should just confirm the notification email + security alerts are enabled in Supabase Dashboard → Account/Organization settings.

---

### Schema drift guard (Sprint 8 / Task 172)

`src/types/database.ts` is hand-maintained; DB migrations are applied manually in Supabase. A column missing in the live DB (but present in the types) causes a `PGRST204` runtime error on write.

**Guard:** `scripts/check-schema-drift.mjs` parses `database.ts` and emits `scripts/schema-drift-check.sql`. Owner runs the SQL in Supabase before deploys.

Full process and when to run: see **`docs/qa-rules.md §Schema drift check`**.