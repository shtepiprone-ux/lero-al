# Database & API Rules

## Core Principles

- Prefer server components for initial data fetch when SEO, performance, or SSR benefits apply.
- Use client components and client-side fetching when interactivity, browser-only APIs, or live client state require it.
- Paginate all lists — default 20 items per page.
- Always select only needed columns, never use `select('*')` in production.
- Use Supabase realtime only for chat/messages (not for listings).

---

## Supabase Views (Recommended)

Create Supabase views for complex joins:

- `listings_with_details` — listing + location + user + cover image
- `conversations_with_preview` — conversation + last message + listing
- `users_with_stats` — user + listing count + average rating

All new views in `public` schema MUST be created with `security_invoker = on` and an
explicit column list (never `select *`). `SECURITY DEFINER` is forbidden by default —
see `rls-rules.md` → "Security Definer Views (FORBIDDEN by default)" for the full rule,
the public-facade exception, and the migration template.

Every new table in `public` schema MUST include explicit Data API GRANTs in the same
migration that creates it — see `rls-rules.md` → "Public Schema GRANT Discipline (Supabase
Data API)" for the template and per-role rules.

---

## Naming Conventions in Database Queries

- Filter publicly visible active listings: always add `.eq('status', 'active')`
- Filter non-expired listings: always add `.gte('expires_at', new Date().toISOString())`
- Filter expired listings: always add `.lt('expires_at', new Date().toISOString())`
- Order listings: default by `is_premium desc, created_at desc`

---

# SUPABASE SCHEMA DRIFT PREVENTION

## Objective

Ensure ZERO mismatch between:

- TypeScript database types
- Supabase Postgres schema
- Application payloads
- API insert/update operations

Any field used in code MUST exist in Supabase database schema BEFORE it is used in:

- UI forms
- domain engines
- API requests
- Supabase inserts/updates

---

## REQUIRED ORDER OF OPERATIONS (STRICT)

When adding or modifying any database field:

### 1. DATABASE FIRST (MANDATORY)
- Create or update column via Supabase migration (SQL file)
- Ensure migration is applied to remote DB

### 2. VERIFY SCHEMA EXISTS
- Confirm column exists in Supabase (information_schema check)
- No assumptions allowed

### 3. UPDATE TYPESCRIPT TYPES
- Update `src/types/database.ts` or generated Supabase types

### 4. UPDATE DOMAIN ENGINE (if applicable)
- Update propertyTypeSchema or constants

### 5. UPDATE UI FORMS
- Only after DB + types are confirmed

---

## HARD GATE CHECK (MANDATORY BEFORE ANY IMPLEMENTATION)

Before writing or modifying any code involving data fields:

- [ ] Column exists in Supabase DB
- [ ] Migration exists and is applied
- [ ] TypeScript types updated
- [ ] No missing or assumed fields

If ANY check fails → STOP execution immediately.

---

## ERROR HANDLING RULE

If error is:

- PGRST204 (column not found)

→ ALWAYS treat as missing DB migration, NOT frontend bug.

---

## FORBIDDEN BEHAVIOR

The following is strictly forbidden:

- Using a field in frontend before DB migration exists
- Adding form fields without database column confirmation
- Assuming Supabase schema updates automatically
- Fixing PGRST204 via frontend workaround instead of DB fix
- Deploying UI logic dependent on non-existent DB fields

---

## PRIORITY ORDER (IMMUTABLE)

1. Database schema correctness (highest priority)
2. Migration state
3. TypeScript schema alignment
4. Domain engine logic
5. UI rendering (lowest priority)

UI is NEVER allowed to define data shape.

---

## VALIDATION CHECK (BEFORE TASK COMPLETION)

Before marking any task complete involving data fields:

- [ ] Column exists in Supabase DB
- [ ] Migration applied successfully
- [ ] TypeScript types updated
- [ ] No references to non-existent DB fields
- [ ] No schema assumptions remain

---

## GOLDEN RULE

Database schema is the single source of truth.
Frontend must never define, guess, or assume schema.

---

# SYSTEM ENFORCEMENT CONTRACT (HIGHEST PRIORITY)

This section overrides all previous rules.

## Execution Policy

Claude Code MUST treat database schema as a hard dependency gate.

No UI, domain, or API implementation is allowed
if database schema state is not explicitly confirmed.

---

## HARD GATE CHECK (REQUIRED BEFORE ANY IMPLEMENTATION)

1. Verify column exists in Supabase DB
2. Verify migration exists and is applied
3. Verify TypeScript types include the field
4. If ANY check fails → STOP execution immediately

---

## FAILURE MODE BEHAVIOR

If schema is not confirmed:

- DO NOT proceed with implementation
- DO NOT suggest UI workarounds
- DO NOT assume missing fields
- MUST request schema clarification

---

## PRIORITY ORDER (IMMUTABLE)

1. Database schema correctness
2. Migration state
3. TypeScript schema alignment
4. Domain logic
5. UI rendering

UI is strictly dependent on all upper layers.

---

## FINAL RULE

If schema is uncertain → task is BLOCKED, not partially executed.

---

## Fragment-Level Cache Invalidation Rule

Any cached read used on the homepage **above-the-fold** must be tagged. Mutations affecting
that read must call `revalidateTag('<tag>', 'default')` immediately after a **successful
write**. Never use `revalidatePath('/')` for fragment-level cache invalidation — it
invalidates the entire homepage cache segment instead of just the affected fragment.

**Current tagged caches:**

| Cache key | Tag | Invalidation events |
|-----------|-----|---------------------|
| `getSiteStats` | `site-stats` | Listing status transition (approve/deactivate/archive/delete) |

**Implementation pattern:**
```typescript
// In a Server Action or API route — AFTER a successful write:
import { revalidateTag } from 'next/cache'
revalidateTag('site-stats', 'default')

// The unstable_cache wrapper must include the tag in options:
unstable_cache(fn, ['site-stats'], { revalidate: 3600, tags: ['site-stats'] })
```

**Never call `revalidateTag` before the write succeeds.** Check for errors first, return
early on failure, call `revalidateTag` only in the success path.

**Never call `revalidateTag` for pure reads** (view count increment, favorites,
contact form submissions). Only mutations that change the cached read's result trigger
revalidation.