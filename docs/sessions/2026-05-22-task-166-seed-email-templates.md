# Session Archive: Task 166 — Seed DB-driven Email Templates — 2026-05-22

## Task

**Task 166 — Epic D follow-up — Seed `email_templates` table**
Type: Ops / DB seed | No code changes.

---

## Call-site audit

All `sendTemplatedEmail({ key: ... })` calls in the repo:

| File | Key | Variables passed |
|---|---|---|
| `src/app/api/cron/saved-searches/route.ts:146` | `saved_search_alert` | `searchName`, `newCount` (string), `searchUrl` |
| `src/app/api/cron/price-alerts/route.ts:165` | `price_change_alert` | `listingTitle`, `oldPrice`, `newPrice`, `currency`, `listingUrl` |

### reporter_notification — CODE-FIRST (do NOT seed)

Task 123 listed `reporter_notification` as DB-driven, but no `sendTemplatedEmail` call exists
for this key. The reporter notification email is sent via `ReporterNotificationEmail` (React
Email component) in `src/modules/listings/actions/reportListing.ts` using
`sendEmail({ react: React.createElement(ReporterNotificationEmail, ...) })` — code-first,
not DB-driven. **This key is not seeded.** Future task to migrate it to DB-driven if needed.

---

## Variable mapping (exact match to call-site)

### `saved_search_alert`
```
searchName  — the saved search label
newCount    — count of new matching listings (passed as String(newCount))
searchUrl   — deep link to the search results page
```
Placeholders used in templates: `{{searchName}}`, `{{newCount}}`, `{{searchUrl}}`

### `price_change_alert`
```
listingTitle — listing.title
oldPrice     — formatted old price string (e.g. "85 000 EUR")
newPrice     — formatted new price string (e.g. "79 000 EUR")
currency     — listing.currency (e.g. "EUR" or "ALL")
listingUrl   — deep link to the listing detail page
```
Placeholders used in templates: `{{listingTitle}}`, `{{oldPrice}}`, `{{newPrice}}`, `{{currency}}`, `{{listingUrl}}`

---

## Seed SQL (owner runs in Supabase Dashboard → SQL Editor)

**Idempotent** — safe to re-run; ON CONFLICT updates existing rows.

```sql
-- Task 166: seed DB-driven email templates.
-- Run in Supabase Dashboard > SQL Editor.
-- Re-running is safe (ON CONFLICT DO UPDATE).

INSERT INTO email_templates (key, locale, subject, html_body, variables, is_active)
VALUES

  -- ── saved_search_alert ─────────────────────────────────────────────────────

  ('saved_search_alert', 'sq',
   '{{newCount}} njoftime të reja për "{{searchName}}"',
   '<h2 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px;">Kërkimi juaj ka rezultate të reja!</h2>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 20px;">Janë gjetur <strong>{{newCount}} njoftime të reja</strong> që përputhen me kërkimin tuaj <strong>"{{searchName}}"</strong>.</p>
<p style="margin:0;">
  <a href="{{searchUrl}}" style="display:inline-block;padding:12px 24px;background:#EC5447;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">Shiko njoftimet</a>
</p>',
   '["searchName","newCount","searchUrl"]'::jsonb,
   true),

  ('saved_search_alert', 'en',
   '{{newCount}} new listings for "{{searchName}}"',
   '<h2 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px;">Your saved search has new results!</h2>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 20px;">We found <strong>{{newCount}} new listings</strong> matching your saved search <strong>"{{searchName}}"</strong>.</p>
<p style="margin:0;">
  <a href="{{searchUrl}}" style="display:inline-block;padding:12px 24px;background:#EC5447;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">View listings</a>
</p>',
   '["searchName","newCount","searchUrl"]'::jsonb,
   true),

  ('saved_search_alert', 'uk',
   '{{newCount}} нових оголошень для "{{searchName}}"',
   '<h2 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px;">Ваш збережений пошук має нові результати!</h2>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 20px;">Знайдено <strong>{{newCount}} нових оголошень</strong>, що відповідають вашому пошуку <strong>"{{searchName}}"</strong>.</p>
<p style="margin:0;">
  <a href="{{searchUrl}}" style="display:inline-block;padding:12px 24px;background:#EC5447;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">Переглянути оголошення</a>
</p>',
   '["searchName","newCount","searchUrl"]'::jsonb,
   true),

  ('saved_search_alert', 'it',
   '{{newCount}} nuovi annunci per "{{searchName}}"',
   '<h2 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px;">La tua ricerca salvata ha nuovi risultati!</h2>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 20px;">Abbiamo trovato <strong>{{newCount}} nuovi annunci</strong> corrispondenti alla tua ricerca <strong>"{{searchName}}"</strong>.</p>
<p style="margin:0;">
  <a href="{{searchUrl}}" style="display:inline-block;padding:12px 24px;background:#EC5447;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">Vedi annunci</a>
</p>',
   '["searchName","newCount","searchUrl"]'::jsonb,
   true),

  -- ── price_change_alert ─────────────────────────────────────────────────────

  ('price_change_alert', 'sq',
   'Ndryshim çmimi: {{listingTitle}}',
   '<h2 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px;">Ulje çmimi për njoftimin tuaj!</h2>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 16px;">Njoftimi <strong>{{listingTitle}}</strong> që keni ruajtur si të preferuar ka ndryshuar çmim:</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
  <tr>
    <td style="padding:12px 20px;background:#f4f4f5;border-radius:8px 0 0 8px;font-size:15px;color:#71717a;text-decoration:line-through;">{{oldPrice}} {{currency}}</td>
    <td style="padding:12px 14px;font-size:18px;color:#a1a1aa;">→</td>
    <td style="padding:12px 20px;background:#EC5447;border-radius:0 8px 8px 0;font-size:16px;font-weight:700;color:#ffffff;">{{newPrice}} {{currency}}</td>
  </tr>
</table>
<p style="margin:0;">
  <a href="{{listingUrl}}" style="display:inline-block;padding:12px 24px;background:#EC5447;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">Shiko njoftimin</a>
</p>',
   '["listingTitle","oldPrice","newPrice","currency","listingUrl"]'::jsonb,
   true),

  ('price_change_alert', 'en',
   'Price drop: {{listingTitle}}',
   '<h2 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px;">Price has dropped on your favorite!</h2>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 16px;">A listing in your favorites has a new price: <strong>{{listingTitle}}</strong></p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
  <tr>
    <td style="padding:12px 20px;background:#f4f4f5;border-radius:8px 0 0 8px;font-size:15px;color:#71717a;text-decoration:line-through;">{{oldPrice}} {{currency}}</td>
    <td style="padding:12px 14px;font-size:18px;color:#a1a1aa;">→</td>
    <td style="padding:12px 20px;background:#EC5447;border-radius:0 8px 8px 0;font-size:16px;font-weight:700;color:#ffffff;">{{newPrice}} {{currency}}</td>
  </tr>
</table>
<p style="margin:0;">
  <a href="{{listingUrl}}" style="display:inline-block;padding:12px 24px;background:#EC5447;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">View listing</a>
</p>',
   '["listingTitle","oldPrice","newPrice","currency","listingUrl"]'::jsonb,
   true),

  ('price_change_alert', 'uk',
   'Зміна ціни: {{listingTitle}}',
   '<h2 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px;">Ціна знизилась на ваш улюблений!</h2>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 16px;">Оголошення з вашого списку вибраного змінило ціну: <strong>{{listingTitle}}</strong></p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
  <tr>
    <td style="padding:12px 20px;background:#f4f4f5;border-radius:8px 0 0 8px;font-size:15px;color:#71717a;text-decoration:line-through;">{{oldPrice}} {{currency}}</td>
    <td style="padding:12px 14px;font-size:18px;color:#a1a1aa;">→</td>
    <td style="padding:12px 20px;background:#EC5447;border-radius:0 8px 8px 0;font-size:16px;font-weight:700;color:#ffffff;">{{newPrice}} {{currency}}</td>
  </tr>
</table>
<p style="margin:0;">
  <a href="{{listingUrl}}" style="display:inline-block;padding:12px 24px;background:#EC5447;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">Переглянути оголошення</a>
</p>',
   '["listingTitle","oldPrice","newPrice","currency","listingUrl"]'::jsonb,
   true),

  ('price_change_alert', 'it',
   'Calo di prezzo: {{listingTitle}}',
   '<h2 style="font-size:20px;font-weight:600;color:#18181b;margin:0 0 12px;">Il prezzo è sceso sul tuo preferito!</h2>
<p style="font-size:15px;color:#3f3f46;line-height:1.6;margin:0 0 16px;">Un annuncio nei tuoi preferiti ha cambiato prezzo: <strong>{{listingTitle}}</strong></p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
  <tr>
    <td style="padding:12px 20px;background:#f4f4f5;border-radius:8px 0 0 8px;font-size:15px;color:#71717a;text-decoration:line-through;">{{oldPrice}} {{currency}}</td>
    <td style="padding:12px 14px;font-size:18px;color:#a1a1aa;">→</td>
    <td style="padding:12px 20px;background:#EC5447;border-radius:0 8px 8px 0;font-size:16px;font-weight:700;color:#ffffff;">{{newPrice}} {{currency}}</td>
  </tr>
</table>
<p style="margin:0;">
  <a href="{{listingUrl}}" style="display:inline-block;padding:12px 24px;background:#EC5447;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;">Vedi annuncio</a>
</p>',
   '["listingTitle","oldPrice","newPrice","currency","listingUrl"]'::jsonb,
   true)

ON CONFLICT (key, locale) DO UPDATE
  SET subject    = EXCLUDED.subject,
      html_body  = EXCLUDED.html_body,
      variables  = EXCLUDED.variables,
      is_active  = EXCLUDED.is_active,
      updated_at = now();
```

---

## Expected admin manager view after seeding

`/admin/email-templates` will list **2 template groups**:

| Group key | Locales | Status |
|---|---|---|
| `saved_search_alert` | sq ✓ en ✓ uk ✓ it ✓ | active |
| `price_change_alert` | sq ✓ en ✓ uk ✓ it ✓ | active |

`reporter_notification` does NOT appear (code-first; not seeded — see audit above).

---

## Acceptance criteria

- [x] `saved_search_alert` × 4 locales seeded — variables match call-site exactly.
- [x] `price_change_alert` × 4 locales seeded — variables match call-site exactly.
- [x] `reporter_notification` NOT seeded — code-first (React Email), discrepancy noted.
- [x] No `{{...}}` tokens left unresolved — every placeholder has a matching caller variable.
- [x] No code changes → typecheck / lint / governance unaffected.
- [x] SQL applied in Supabase — ✅ confirmed (2026-05-22).
- [x] `/admin/email-templates` shows 2 groups × 4 locales.

---

## No code changes

This task produces only SQL documented above. No source files changed.
`npm run typecheck / lint / governance` results are unchanged from Task 165 baseline.
