### Execution Protocol (to avoid compliance paralysis)
- Do not re-read all /docs on every task. Read only the docs relevant to the current task.
- Always obey: env.md, rls-rules.md, component-rules.md.
- For UI work obey: ui-rules.md. For DB work: data-access-rules.md. For analytics/SEO: analytics-rules.md.
- Do not ask “what should I build?” if a task is specified (backlog or user request). Proceed.
- If blocked by rules, apply the smallest safe fix to unblock, then refactor into the correct component structure.
- If docs were already read in this session, do not re-read them again; proceed with execution.

### Before modifying any shared component or module:
- Verify the component is directly required for the current task.
- Audit all dependent usages BEFORE making changes.
- Do not modify unrelated consumers unless the task explicitly requires it.
- Shared component changes that cause unrelated regressions are considered task failure.

### After Every Change
- After making code changes, run the relevant local verification step (`npm run dev` for interactive verification, `npm run build` before commit/push, and any targeted checks needed for the changed scope).
- **After every feature, fix, or significant change — update the relevant project documentation**:
- Update the appropriate file in `/docs/` if rules, architecture, workflow, or standards changed.
- Update `docs/backlog.md` for progress, session summary, and next tasks when applicable.
- Update `Claude.md` only if the project index, global context, or documentation map changed.

### Deploy Command
- When the user says "deploy", prepare the current branch for deployment: commit the relevant changes, push the branch to GitHub, and merge to `main` only through the project's approved workflow.

### Commit Rules
- One logical change per commit.
- Commit message format: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Always include related file changes in the same commit.
- Never commit broken code — run `npm run build` before pushing.

### Localization (i18n) Rules
- ALWAYS check `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`.
- Every new text string must be added to ALL four language files simultaneously.
- Never hardcode text strings in components — always use `useTranslations()`.
- Keys must be added under correct namespace (nav, listing, auth, common).
- Default language is Albanian (sq) — always write Albanian text first.

### Git Rules
- Do not commit directly to `main` unless the current project workflow explicitly allows it; prefer feature branches and merge through the approved deployment flow.
- Commit often with small logical changes.
- Never commit: `.env` files, `node_modules`, `.next` folder.
- Tag releases: `v0.1.0`, `v0.2.0` etc.

### Scope Isolation Rules
- Modify only files directly required for the task.
- Do not perform unrelated refactors.
- Do not “clean up” architecture outside the task scope.
- Do not replace shared UI primitives globally unless explicitly required.
- Unrequested improvements are forbidden.
- If a bug can be fixed locally within the affected domain, do not expand changes to unrelated modules.
- Changes outside scope are considered task failure even if the original bug is fixed.

### SSR / Hydration Rules
Forbidden:
- suppressHydrationWarning
- typeof window rendering branches
- client-only wrappers used only to hide hydration mismatches
- dynamic(..., { ssr: false }) inside Server Components
- browser-only formatting during render

Hydration mismatches must be fixed at the deterministic rendering/data layer, not masked.

### Shared Component Rules
- Shared UI components are considered high-risk architecture.
- Do not modify shared components without verifying all dependent flows.
- Shared component changes require regression verification for:
  - homepage
  - filters
  - forms
  - modals
  - admin flows
  - mobile layouts

If regression risk is high, create a dedicated architecture task instead of modifying the component during unrelated work.

### Selection Components Policy
Combobox is the canonical selection component for:
- locations
- property types
- filters
- searchable selects
- domain forms

Select components are deprecated for domain flows.

Forbidden:
- replacing Combobox with Select
- introducing new Select-based domain inputs
- maintaining parallel Select/Combobox implementations

### Domain Integrity Rules
- Frontend types, validation schemas, DB enums, API payloads, and queries must use the same canonical domain model.
- Never patch enum/schema mismatches locally.
- Never introduce temporary mappings or fallback values.
- Domain inconsistencies must be fixed at the shared domain layer.

Fixing the visible symptom while introducing architectural regressions is considered task failure.

### Dependency Mutation Rules
- Do not modify shared hooks, providers, utilities, config layers, or global state unless the task explicitly requires it.
- Do not introduce cross-module side effects.
- If fixing a bug requires modifying infrastructure/shared layers, explicitly document why local isolation is impossible.
- Any change affecting routing, auth, providers, caching, localization, or shared state requires regression verification.

### Architecture Stability Rules
- Do not rewrite architectural patterns during bugfix tasks.
- Do not replace existing patterns with alternative abstractions unless explicitly requested.
- Bugfixes must preserve the existing architectural contract.
- Large structural rewrites require a dedicated task.

### No Fake Fixes Policy
Forbidden:
- masking bugs through fallback UI
- hiding errors without fixing root cause
- retry loops used to conceal race conditions
- artificial delays/timeouts
- force refreshes to restore broken state
- silent catch blocks

All fixes must resolve the root architectural issue.

### Regression Responsibility
- If a change breaks an existing feature outside the task scope, the task is considered failed.
- The agent is responsible for verifying affected dependent flows after modifying shared logic.
- “The original bug is fixed” is not sufficient if regressions were introduced.

### Verification Rules
- Before modifying a shared component, identify all known consumers.
- After modification, verify all affected consumers manually or through targeted checks.
- Never assume shared changes are isolated.

### State Management Rules
- Do not introduce duplicate client state for the same domain entity.
- Avoid parallel sources of truth.
- Cache invalidation and optimistic updates must follow existing architecture patterns.
- Never patch stale-state issues with forced remounts or key-based resets unless explicitly required.

### Async / Effects Rules
- Avoid side-effects during render.
- Effects must be idempotent and safely repeatable.
- Do not introduce race conditions through parallel async state updates.
- Cleanup logic must correctly dispose subscriptions, listeners, and async flows.

### Navigation Safety Rules
- Navigation state must remain recoverable through browser Back/Forward actions.
- Do not manipulate browser history manually unless explicitly required.
- Route transitions must not leave stale overlays, modals, or loading states.
- Navigation fixes must preserve SSR/client routing consistency.

### Data Fetching Rules
- Do not introduce duplicate network requests for the same render lifecycle.
- Revalidation must follow existing caching strategy.
- Avoid hidden polling or implicit background refresh logic.
- Data freshness issues must be solved through proper invalidation/re-fetch architecture.

### Auth Lifecycle Rules
- Do not patch auth inconsistencies through forced reloads or global cookie clearing.
- Auth/session recovery must use centralized lifecycle handling.
- Invalid auth sessions must be cleaned deterministically through the shared auth layer.

### Framework Warning Rules
- Do not "fix" framework dev-mode warnings unless they are reproducible in production builds.
- Turbopack dev-only preload warnings must be verified in production before any code changes.
- Never introduce architectural hacks to silence framework/runtime warnings.