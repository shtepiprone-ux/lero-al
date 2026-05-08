## Stack
- **Framework**: Next.js 16 + TypeScript + Tailwind CSS.
- **Database**: Supabase ✅ (Postgres + Auth + RLS + Realtime).
- **Images**: Cloudinary ✅ account registered (25GB free, auto-resize, WebP).
- **Hosting**: Cloudflare Pages (free, no commercial restrictions).
- **i18n**: next-intl (sq, en, uk, it).
- **Components**: shadcn/ui (component set / generator), built on @base-ui/react primitives (not Radix UI).
- **Forms**: react-hook-form + Zod + @hookform/resolvers.
- **Dates**: date-fns.
- **Monitoring**: Sentry ✅ configured.
- **Maps**: Leaflet.js + OpenStreetMap (free, no API key).
- **Rich text**: Tiptap (for admin page editor).
- **Email**: Resend ✅ account registered (3,000/month free).
- **Next to install**: `npm install next-cloudinary resend`.

## Architecture
```
src/
  app/[locale]/          — all public pages (Next.js App Router).
  app/[locale]/auth/     — login, register pages.
  app/admin/             — admin panel (no locale prefix).
  components/ui/         — shadcn/ui components.
  components/layout/     — Header, Footer (shared layout).
  components/shared/     — shared components (Map, Logo, etc.).
  modules/               — feature modules (see Module Structure below).
  lib/supabase/          — client.ts, server.ts.
  lib/utils/             — shared utilities.
  types/                 — database.ts (all TypeScript types).
  i18n/                  — routing.ts, request.ts.
  constants/             — app-wide constants.
  proxy.ts               — next-intl middleware.
messages/                — sq.json, en.json, uk.json, it.json.
```

## Architecture Rules (Modular Monolith)

### File Organization
- Business logic in hooks, not in components.
- API calls only in module `lib/queries.ts` and `lib/mutations.ts`.
- Never call Supabase directly from UI components — use hooks.
- Reusable utilities in `src/lib/utils/`.
- Page-specific components stay in the module folder.
- Shared components go to `src/components/shared/`.

### State Management
- Local state: `useState` for component-level state.
- Server state: Supabase realtime or refetch pattern.
- No external state management library needed at this scale.
- URL state for filters (`useSearchParams`) — allows sharing filtered searches.
- Form state: `react-hook-form` always, never manual state for forms.

### Architecture Pattern
Current: **Modular Monolith** (intentional for current scale).
Evolution path: Monolith → Modular Monolith → Microservices (only if 500k+ users).
Do NOT prematurely optimize for microservices.

### Module Structure
```
src/
  modules/
    listings/
      components/    — UI components (ListingCard, ListingGallery, ListingFilters)
      hooks/         — data fetching hooks (useListings, useListing, useCreateListing)
      lib/
        queries.ts   — all SELECT queries
        mutations.ts — all INSERT/UPDATE/DELETE
        transforms.ts — data transformation, badge logic
      types/         — module-specific types
      constants/     — property types, conditions, heating types
      validations/   — Zod schemas (listingSchema)
    auth/
      components/    — LoginForm, RegisterForm
      hooks/         — useUser
      lib/
        queries.ts
        mutations.ts
      types/
      validations/   — loginSchema, registerSchema
    messaging/
      components/    — ConversationList, MessageThread, MessageInput
      hooks/         — useConversations, useMessages
      lib/
        queries.ts
        mutations.ts
      types/
    support/
      components/    — SupportTicketsTable, SupportThread
      hooks/         — useSupportTickets, useSupportThread
      lib/
        queries.ts
        mutations.ts
      types/
    admin/
      components/    — AdminSidebar, ListingsTable, UsersTable, TicketsTable
      hooks/         — useAdminStats, useAdminListings
      lib/
        queries.ts   — aggregation queries across all modules
      types/
    notifications/
      hooks/         — useNotifications, useNotificationSettings
      lib/
        queries.ts
        mutations.ts
      types/
    content/
      components/    — PageEditor (Tiptap), PageView
      hooks/         — usePages
      lib/
        queries.ts
        mutations.ts
      types/
    locations/
      hooks/         — useLocations, useRegions
      lib/
        queries.ts
        import.ts    — JSON import logic
      types/
    currency/
      hooks/         — useCurrencyRate, useConvertPrice
      lib/
        queries.ts
        fetcher.ts   — fetch from iliria98.com
      types/
```

### Dependency Rules
- Modules can ONLY communicate via:
  1. Props passed from parent components;
  2. Shared hooks from `src/hooks/` (if truly shared);
  3. Shared types from `src/types/`;
  4. Supabase queries (each module queries its own tables).
- NEVER import a hook from another module directly.
- NEVER import a component from another module directly.
- Shared components go to `src/components/shared/`.

### Module Table Ownership
Each module owns its tables — only that module queries them directly:
- listings module: `listings`, `listing_images`, `listing_amenities`, `listing_views`, `listing_reports`, `favorites`, `saved_searches`, `amenities`, `listing_translations`, `amenity_translations`.
- auth module: `users`, `verification_requests`, `agent_reviews`.
- messaging module: `conversations`, `messages`.
- support module: `support_tickets`, `support_messages`.
- notifications module: `notifications`, `notification_settings`.
- admin module: reads all tables for admin workflows and aggregation.
- content module: `pages`, `page_translations`, `languages`.
- locations module: `locations`, `location_translations`.
- currency module: `currency_rates`.

### Architecture Decay Red Flags
- Component in `listings` imports from `auth` module internals.
- A hook directly queries another module's tables.
- Admin component contains business logic (should only display).
- More than 3 levels of prop drilling (use a hook instead).
- A single file over 300 lines.
- A component doing both data fetching AND complex rendering.

### Listing Detail Page — Above-Fold RSC Rule

Above-the-fold UI on `/[locale]/listings/[slug]` must remain Server-Component-renderable.
New `'use client'` directives added to a component that renders above the fold on this page
require a written inventory entry (in `docs/performance.md` — Listing Detail Hydration
Budget table) and an explicit justification.

**Islands pattern:** above-fold interactive widgets must be split into a static RSC frame
(renders HTML, zero JS) + a thin client island (handles interactivity, lazy-loaded).
The `GalleryStaticFrame` / `GalleryIsland` / `ListingGallery` split is the canonical example.

**Below-fold dynamic sections** must be wrapped in `<Suspense fallback={<Skeleton />}>` so
React can stream above-fold content first and defer below-fold data fetches and hydration.

## Database (Supabase)
**25 tables:**
users, locations, listings, listing_images, listing_amenities, amenities;
listing_views, listing_reports, favorites, saved_searches, conversations;
messages, support_tickets, support_messages, notifications;
notification_settings, currency_rates, pages, page_translations;
listing_translations, amenity_translations, location_translations;
languages, verification_requests, agent_reviews.

## Important Decisions & Reasons


### Why next-intl
Official Next.js i18n solution. All pages are under `[locale]` route group.
Default locale is `sq` (Albanian). Browser language detection is enabled.

### Currency rates
Fetch EUR/ALL rate from https://iliria98.com/ via Supabase Edge Function once per day.
Store in `currency_rates` table. Display both ALL and EUR on listing cards.

### Listing badges logic
- "New" badge: `created_at > now() - interval '7 days'` (computed, not stored).
- "Price reduced" badge: `price_old IS NOT NULL AND price < price_old` (computed).
- "Premium" badge: `is_premium = true` (manual, set by admin/moderator).
- "Archived" badge: `status IN ('sold', 'rented', 'archived')`

### Listing expiry
`expires_at = created_at + 60 days` (default). Moderator/admin can extend manually.

### User profile trigger
When user registers via Supabase Auth → trigger `on_auth_user_created`.
automatically creates row in `users` table with name from metadata.
Also trigger `on_user_created_notifications` creates default `notification_settings`.

### Locations structure
Self-referential table. `region_id` is a direct shortcut to the top-level region.
Hierarchy: region → city/district → village.
Will be imported from JSON file provided by the user.

### Search
Postgres Full Text Search via `tsvector` field on listings table.
Language: `'simple'` (works for Albanian without special dictionary).
Indexed with GIN index.

### Static pages
Content stored as `jsonb` (Tiptap editor format).
Pages: privacy-policy, terms-of-service, about (in Albanian).
Editable via admin panel with Tiptap rich text editor.
Translations stored in `page_translations` table.

### Moderator restrictions
Moderator CANNOT: create admin users, delete admin users.
Moderator CAN: manage listings, users (agent/user roles), support tickets, conversations.

### Proxy (middleware)
File is named `src/proxy.ts` (not `middleware.ts`) because Next.js 16 renamed the convention.

## Key Files
- `src/lib/supabase/client.ts` — browser Supabase client.
- `src/lib/supabase/server.ts` — server Supabase client (uses cookies).
- `src/modules/auth/hooks/useUser.ts` — auth hook, returns current user from users table.
- `src/modules/auth/components/LoginForm.tsx` — login form component.
- `src/modules/auth/components/RegisterForm.tsx` — register form component.
- `src/types/database.ts` — TypeScript interfaces for all 25 tables.
- `src/i18n/routing.ts` — locale config (locales: sq, en, uk, it; default: sq).
- `src/i18n/request.ts` — next-intl server config.
- `src/proxy.ts` — next-intl middleware (renamed from middleware.ts for Next.js 16).
- `messages/sq.json` — Albanian translations (primary language).
- `messages/en.json` — English translations.
- `messages/uk.json` — Ukrainian translations.
- `messages/it.json` — Italian translations.