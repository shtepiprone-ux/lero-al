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
