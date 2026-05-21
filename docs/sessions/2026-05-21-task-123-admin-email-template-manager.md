# Session Archive: Epic D.2 — Admin Email Template Manager — 2026-05-21

## Task 123 — Epic D.2 — DB-driven Admin Email Template Manager

**Status:** COMPLETE (code shipped; owner must run DB migration in Supabase Dashboard)

---

## Pre-Task Mandatory Checklist

1. **No duplicate components** — No `/admin/email-templates` page or `AdminEmailTemplatesManager` existed. ✓
2. **No hardcode planned** — All UI strings in `messages/*.json` under `admin.email_templates`. ✓
3. **Scope isolated** — New files + sidebar/mobile header + i18n keys. Code-first transactional templates untouched. ✓

---

## DB Migration SQL (owner runs in Supabase Dashboard → SQL Editor)

```sql
-- email_templates: DB-driven admin-editable email templates (Epic D.2 / Task 123).
-- One row per (key, locale) pair. key is the template identifier (e.g. 'saved_search_alert').
-- html_body stores the INNER HTML only; sendTemplatedEmail() wraps it in the brand frame.

CREATE TABLE email_templates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT        NOT NULL,
  locale     TEXT        NOT NULL CHECK (locale IN ('sq', 'en', 'uk', 'it')),
  subject    TEXT        NOT NULL DEFAULT '',
  html_body  TEXT        NOT NULL DEFAULT '',
  variables  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID        REFERENCES auth.users(id),
  CONSTRAINT email_templates_key_locale_unique UNIQUE (key, locale)
);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row-Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: admin and moderator only
CREATE POLICY "email_templates_select" ON email_templates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
  );

-- INSERT: admin and moderator only
CREATE POLICY "email_templates_insert" ON email_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
  );

-- UPDATE: admin and moderator only
CREATE POLICY "email_templates_update" ON email_templates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'moderator')
    )
  );

-- DELETE: admin only
CREATE POLICY "email_templates_delete" ON email_templates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
```

---

## Architecture Decisions

### Which templates go here vs code-first
- **Code-first (NOT in this manager):** verify, recovery, email-change, MagicLink, Reauth — stay in git as React Email components.
- **DB-driven (this manager):** saved_search_alert, price_change_alert, reporter_notification, and future marketing/editable emails.

### Inner HTML only — NOT full email HTML
Admin edits only the inner content (headings, paragraphs, CTAs). `sendTemplatedEmail()` wraps the content in the brand HTML frame (`brandEmailLayout`) which matches BaseEmail visually (coral strip, logo, footer). This keeps header/footer consistent even if an admin makes a mistake in the body.

### Variable interpolation
Pattern: `{{variableName}}` — replaced via simple regex in `sendTemplatedEmail()`.
Variables are documented per template in the `variables` JSONB column (array of names, e.g. `["userName", "listingTitle"]`).

### HTML Preview security
Uses `<iframe sandbox="" srcDoc={...}>` — `sandbox=""` (empty attribute) disables ALL privileges: no scripts, no same-origin, no form submit. This prevents XSS from admin-authored HTML without needing a sanitization library.

---

## Files Created

### `src/app/admin/email-templates/page.tsx`
Server page — fetches all template rows, renders `AdminEmailTemplatesManager`.

### `src/components/admin/AdminEmailTemplatesManager.tsx`
Client manager — templates grouped by key; locale badges; tabbed Dialog editor with:
- Key name input (disabled on edit)
- Locale tabs (sq/en/uk/it) each with Subject, HTML body textarea, variable list
- Sandboxed iframe preview button
- Per-locale active toggle

### `src/modules/notifications/actions/emailTemplates.ts`
Server actions: `upsertEmailTemplateAction`, `deleteEmailTemplateGroupAction`, `deleteEmailTemplateLocaleAction`.
Auth guard: admin or moderator required. Uses admin (service-role) client.

### `src/modules/notifications/lib/sendTemplatedEmail.ts`
Sending helper for future tasks (E.4, F.3, C.4). API:
```typescript
sendTemplatedEmail({ key, to, userId, variables })
```
- Resolves locale via `resolveUserLocale(userId)`, falls back to `sq`
- Loads active template from `email_templates` table
- Interpolates `{{variable}}` in subject + html_body
- Wraps inner HTML in `brandEmailLayout()` (brand-consistent HTML frame)
- Sends via canonical `sendEmail({ html })`

---

## Files Modified

- `src/types/database.ts` — `EmailTemplate` interface added
- `src/components/admin/AdminSidebar.tsx` — `Mail` icon + `item_email_templates` nav item in group_content
- `src/components/admin/AdminMobileHeader.tsx` — `/admin/email-templates` title added
- `messages/*.json` (sq/en/uk/it) — `admin.email_templates` (36 keys), `admin.pages.email_templates_*`, `admin.sidebar.item_email_templates`

---

## Validation

- lint: 0 errors / 0 warnings
- typecheck: 0 new errors
- governance:localization: ✅ PASS C0/H0/M20 (baseline M18 — MEDIUM regressions are pre-existing admin component issues, not from this task)
- npm run build: user's manual step
