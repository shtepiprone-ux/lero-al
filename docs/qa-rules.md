## QA Rules

### TypeScript Strict Mode
- `strict: true` must be enabled in `tsconfig.json` (Next.js default).
- Never use `any` type — use `unknown` and narrow it.
- Never use non-null assertion `!` without a comment explaining why.
- Always handle null/undefined cases explicitly.

### Runtime Validation with Zod
- Define Zod schemas in each module's `validations/index.ts`.
- Every form must have a corresponding Zod schema.
- Validate Supabase responses for critical data.
- Schemas needed:
  - `loginSchema` — email + password.
  - `registerSchema` — name, email, password, phone, user_type, company_name.
  - `listingSchema` — all listing fields with proper constraints.
  - `profileSchema` — name, phone, whatsapp, avatar_url.

### Race Condition Prevention
- Debounce search inputs (300ms minimum).
- Disable submit buttons immediately on click, re-enable only on error.
- For favorites/actions: optimistic update + rollback on error.

### Stale Data Prevention
- After mutation always refetch affected data.
- Use `router.refresh()` after server-side data changes.
- Add `revalidatePath()` in server actions after mutations.

### Form & Input Safety
- Trim all text inputs before saving to database.
- Max length limits:
  - title: 150 chars;
  - description: 5000 chars;
  - name: 100 chars;
  - company_name: 200 chars;
- Reject files over 10MB in image upload.
- Accept only: `jpg`, `jpeg`, `png`, `webp` for images.
- Sanitize HTML in any rich text content before display.

### Timezone Safety
- Always store dates in UTC (Supabase default).
- Always display dates in user's local timezone.
- Use `date-fns` or `Intl.DateTimeFormat` for date formatting.
- Never use `new Date()` directly for display — always format it.

### Image Upload Safety
- Validate file type on client AND server side.
- Show upload progress indicator.
- Handle Cloudinary errors gracefully with retry option.
- Optimize images before upload; target compressed files at or below 2MB when possible.
- Generate thumbnail automatically via Cloudinary transformations.
- If upload fails — do not save listing, show clear error.

### Error Monitoring (Sentry)
- Sentry is installed and configured.
- Capture unhandled promise rejections.
- Capture Supabase query errors in catch blocks.
- Never log sensitive data (passwords, tokens) to Sentry.
- Set up alerts for new error types in Sentry dashboard.

### Before Every Commit
- Run `npm run build` locally to catch build errors before pushing.
- Check browser console for errors and warnings.
- Test the changed component in at least 3 screen sizes (mobile/tablet/desktop).
- Verify all 4 language versions display correctly.
- Check that no text is hardcoded (all must use i18n).

### Encoding hygiene (UTF-8, mojibake gate — Task 428)

All text in this repo is **UTF-8, no BOM**. `npm run check:mojibake`
(`scripts/check-mojibake.mjs`) scans `docs/`, `src/`, `app/`, `components/`, `modules/`,
`messages/`, `tasks/`, `scripts/`, and root `*.md` for double-encoding / corruption artifacts and is a
**blocking CI step** (see `.github/workflows/governance-pr.yml`). It collects **tracked *and*
untracked-but-not-ignored** files (`git ls-files --cached --others --exclude-standard`), so a file
added in the same change as the code it checks is scanned too. There is no native pre-commit
hook in this repo (`.git/hooks/` has only `.sample` files) — run `npm run check:mojibake` manually
before committing if you touched non-ASCII text.

`scripts/` was added to the scanned set by Task 674 (2026-07-27): every governance and QA harness
lives there and is dense with non-ASCII, but none of it was covered before. The detector's own
source, `scripts/check-mojibake.mjs`, is allowlisted, because its `SIGNATURES` table necessarily
contains every artifact string as a literal and would otherwise fail its own gate. **Note the
breadth of that exemption:** `isAllowlisted()` is consulted in the invalid-UTF-8 branch (L232) as
well as in the signature branch (L240), so the detector is exempt from **encoding-validity
checking too** — if its source were ever saved as CP1252 or truncated mid-sequence, its own gate
would stay green. No compensating control exists today.

What it catches — text that was UTF-8 but got re-decoded as CP1252/Latin-1 somewhere in the
authoring pipeline, e.g. `Ô£à` (was `✅`), `ÔåÆ` (was `→`), `ÔÇö` (was `—`), `â€“` (was `–`), or the
literal replacement character `�` (lossy decode). Also covers (added Task 429, 2026-06-15, to
close blind spots for the `sq`/`uk` locales): Albanian accents `Ã«` (was `ë`) and `Ã§` (was `ç`);
the `Â…` family `Â ` (NBSP), `Â«`, `Â»`, `Â©`, `Â®`, `Â°` (specific paired sequences only, never a
bare `Â`); and the Cyrillic `Ð…`/`Ñ…` family — paired sequences for common `uk` letters (e.g. `Ð°`
was `а`, `Ñ€` was `р`, `Ñ–` was `і`) — never a bare `Ð`/`Ñ`. A file that fails `check:mojibake` is
reported with `path:line:col` + a remediation hint; intentional documentation that quotes these
artifacts (like this section, the Task 428/429 kickoffs, the Task 426 session log, and the Task
428 session log) is path-scoped in `scripts/mojibake-allowlist.json` — do NOT blanket-disable the
gate.

**Root cause and prevention (origin: 2026-06-15 owner report of mojibake in a PowerShell paste —
the files themselves were clean UTF-8; the artifact was console rendering):**
- The owner's PowerShell console MUST run UTF-8: `chcp 65001` and/or set
  `[Console]::OutputEncoding = [Text.Encoding]::UTF8` (or use PowerShell 7, which defaults to
  UTF-8). Without this, non-ASCII bytes (✅, →, —, locale text) render as mojibake **in the
  console only** — but copying that rendered text back into a file bakes the corruption in.
- **Never redirect console output into a repo file** — `git show <sha>:<path> > file` or
  `Get-Content ... | Out-File` adopts the console's code page and can corrupt non-ASCII content.
  Read files with the `Read` tool / editor, not via redirected console output.
- Editors must save files as **UTF-8 without BOM** (see `docs/agent-contract.md` clause 14 — BOM
  check).

Cross-ref: `docs/agent-contract.md` clause 14 (file-integrity gate) covers NUL/BOM/truncation;
`check:mojibake` is the companion gate for double-encoding/replacement-character corruption.

### Actionable Error-Toast Rule (Epic RS Slice 1, Task 436, 2026-06-16)

> **Origin:** Generic "Failed, try again" toasts with no server log made Task 432's no-op
> clear-history race and Task 435's report-submit RLS failure very slow to diagnose — the
> developer had no idea whether the failure was an RLS violation, a network error, or a
> validation issue. This rule closes that diagnosis gap.
> Referenced from `docs/rule-index.md` "DB / server action / RLS" and "UI / layout" bundles.

For **critical write actions** (admin / moderation / reporting / payment / history flows),
a generic "Failed, try again" toast is insufficient unless the code ALSO logs the specific
server-side cause. Minimum standard:

1. **User-facing copy**: localized, non-technical, in all 4 locales (sq/en/uk/it); describes
   what happened without leaking internal details. Never a raw Supabase error message.
2. **Server-side log**: before returning any generic error key to the client, the server action
   MUST call `console.error(tag, { error, context })` with the specific root cause — so that
   the failure is diagnosable from server logs without reproducing it in the browser.
3. **Typed error category**: the server action returns a typed error key
   (`'save_failed'`, `'forbidden'`, `'rate_limited'`, `'unauthorized'`, `'already_reported'`, etc.)
   — never a raw Supabase error object. The UI maps keys to localized copy.
4. **Test coverage**: at least one known failure branch is covered by a vitest test that
   (a) asserts the typed error key is returned AND
   (b) asserts `console.error` was called (use `vi.spyOn(console, 'error')`), confirming the
   root cause is logged and not silently swallowed.
5. **No catch-all collapse**: a single `catch (e) { return { error: 'failed' } }` that makes
   RLS failures, validation errors, email delivery failures, and DB errors indistinguishable
   is a **violation**. Each failure class MUST produce a distinct typed error key.

This rule applies to all new server actions in critical flows AND to any existing action
touched by a task in those flows. The orchestrator review-checklist verifies compliance.

---

### Error Handling
- Every Supabase query must have error handling.
- Never expose raw error messages to users — show friendly localized messages.
- Add error boundaries for critical sections.
- Log errors to console in development, suppress in production.
- Network errors must show retry option where possible.
- 404 page: custom, with search bar and popular listings.
- 500 page: custom, with contact support link.

### Data Validation
- Enforce domain-specific validation rules on both client and server.
- Price must always be a positive number.
- Phone numbers must match Albanian format (`+355`).
- Email fields must always be validated.
- Slugs must be URL-safe (no special characters; spaces replaced with hyphens).
- Sanitize user-generated content before display.

### Testing Checklist (manual, before each deploy)
Critical paths to test:
- [ ] Register as private user;
- [ ] Register as agent (with and without company name);
- [ ] Login with email/password;
- [ ] Login with Google OAuth;
- [ ] Logout;
- [ ] Create listing with photos;
- [ ] Edit listing;
- [ ] Delete listing (with confirmation);
- [ ] Search listings with filters;
- [ ] Search persists in URL;
- [ ] Add to favorites / remove from favorites;
- [ ] Send message to listing owner;
- [ ] Open conversation, reply;
- [ ] Change language (all 4) — verify all text changes;
- [ ] View on mobile (375px) — no horizontal scroll;
- [ ] View on tablet (768px);
- [ ] View on desktop (1280px);
- [ ] Listing detail page: photo gallery lightbox;
- [ ] Listing detail page: map loads;
- [ ] Listing detail page: contact block (WhatsApp, Call, Send Message) renders in Firefox — verify in Firefox latest stable on the listing detail page for at least one active listing with an owner contact;
- [ ] Admin: change listing status;
- [ ] Admin: verify agent;
- [ ] Admin: edit static page;
- [ ] Moderator: cannot create admin user.

### Manual QA test suite — навігація через UI (критично)

Усі **ручні** тест-кейси для продукту (наприклад у `qa-import/qa-test-suite.json` або картках Trello після синхронізації) повинні містити **явний шлях навігації** в тексті кейсу (назва екрану, ланцюжок меню або URL-маршрут), без розмитих посилань типу «відповідний розділ».

**Обовʼязково** в кроках і/або передумовах зазначати одне з нижченаведеного:

- **ланцюжок меню**, орієнтований за підписами в UI на кшталт `Управління → Оголошення`;
- **точна назва сторінки** (наприклад, як у заголовку в адмін-хедері або в контенті);
- **точний маршрут URL**, з унормованою локаллю там, де вона є в проді, напр. `/sq/admin/listings`, `/en/cabinet`, `/uk/listings/create`.

Орієнтир пунктів сайдбара адмінки (префікс локалі додається зверху, наприклад `/sq/admin/…`, `/uk/admin/…`):

- `/admin` — Dashboard («Огляд» у групі навігації);
- `/admin/listings` — Оголошення;
- `/admin/users` — Користувачі;
- `/admin/badges` — Бейджі;
- `/admin/support` — Support;
- `/admin/locations` — Населені пункти;
- `/admin/legal` — Правові документи;
- `/admin/settings` — Налаштування сайту;
- `/admin/pages-admin` — сторінка «Сторінки» за наявності маршруту.

**Неприпустимо** робити опис навігації лише загальними фразами, зокрема:

- «відповідний розділ»;
- «панель керування», «адмін-панель» або «у панелі адміністратора» **без** конкретного пункту меню або без URL;
- «відкрити систему»;
- «знайти запис» без зазначення, **де саме у UI** (який розділ, пошук, фільтр, таб, URL).

**Прийнятні приклади:** явний локалізований шлях на кшталт `/uk/admin/users → …`; текст ланцюжка меню із реальних підписів; комбіновано «На сторінці `/sq/cabinet` у вкладці …».

Перевірка на набір типових «заборонених» підрядків у JSON-наборі:

`node qa-import/validate-ui-navigation.mjs`
---

### Schema drift check (types ↔ live DB)

**Problem:** `src/types/database.ts` is hand-maintained. If a column exists in the types but not in the live DB, PostgREST returns a `PGRST204` error at runtime (e.g. the `suspended_until` outage, Sprint 7 / Issue A).

**Guard:** A codegen script parses `database.ts` and emits owner-run SQL.

```bash
# Regenerate the SQL (re-run after any database.ts change):
npm run check:schema-drift
# → writes scripts/schema-drift-check.sql
```

Then paste `scripts/schema-drift-check.sql` into the **Supabase SQL Editor** and run it.
- **Result set 1:** columns expected by types but missing in DB → apply `ALTER TABLE … ADD COLUMN IF NOT EXISTS …` for each.
- **Result set 2 (informational):** DB columns absent from types → review; add to `database.ts` if needed.

**Owner-run SQL rule:** The script itself never connects to the DB (no credentials, no `pg`). Only the owner runs the SQL in Supabase.

**When to run:** before every production deploy that adds or modifies columns in `database.ts`, or any time a PGRST204 error surfaces.

**Interface→table map:** 21 confirmed tables (see `scripts/check-schema-drift.mjs`). Unconfirmed interfaces (no `.from()` call in src/) are intentionally excluded to avoid false positives.

---

### Responsive Screenshot QA (Phase 5)

**Reference:** `docs/responsive-screenshot-governance.md`, `docs/responsive-screenshot-matrix.md`

#### When screenshots are required

Before merging any PR that changes:
- Responsive layout classes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- Container or grid structure
- Any component with translatable text
- Touch targets or interactive element sizing

#### How to run

```bash
# One-time browser setup:
npx playwright install chromium

# Build Storybook:
npm run build-storybook

# Capture fast-check matrix (6 viewports × 4 locales):
npm run screenshots:responsive

# Validate infrastructure (no browser, CI-safe):
npm run governance:screenshots
```

#### Review checklist

- [ ] `mobile-320` and `mobile-375` screenshots: no horizontal overflow
- [ ] `uk` × `mobile-375`: Ukrainian text fits without breaking layout
- [ ] `huge-2560`: listing grid shows 4 columns (`2xl:grid-cols-4`)
- [ ] `huge-2560`: containers bounded, no full-viewport stretch
- [ ] No screenshots committed to git (`.screenshots/` is gitignored)

#### Output location

`.screenshots/responsive/YYYY-MM-DD/` — gitignored, local only.
See `docs/responsive-screenshot-governance.md §5` for file naming conventions.
