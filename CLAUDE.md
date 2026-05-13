# Lero.al — Project Intelligence

## Project Context
Real Estate Marketplace for the Albanian market.
Stack: Next.js (App Router), Supabase, Tailwind CSS, shadcn/ui.

## Documentation Structure

All project rules are split into focused files inside `/docs/`.  
`Claude.md` is the entry point and high-level index. Detailed rules live in the files below.

- `docs/ai-behavior.md` — AI workflow, session behavior, update discipline, commit/deploy behavior, and general working process.
- `docs/analytics-rules.md` — analytics, event tracking, SEO rules, and conversion optimization requirements.
- `docs/architecture.md` — modular monolith architecture, module boundaries, file organization, state management, and system structure.
- `docs/backlog.md` — current progress, last session summary, and next immediate tasks.
- `docs/component-rules.md` — component-level coding rules, hardcode restrictions, design token usage, and reusable component standards.
- `docs/data-access-rules.md` — database access patterns, API rules, query conventions, pagination, and Supabase data access rules.
- `docs/dependencies.md` — dependency policy, package selection rules, and approved package ecosystem.
- `docs/domain-rules.md` — business/domain-specific rules for listings, marketplace behavior, roles, and core platform logic.
- `docs/env.md` — required environment variables, secret handling, and deployment configuration values.
- `docs/integrations.md` — external services setup and integration rules (Supabase, Cloudinary, Resend, Sentry, etc.).
- `docs/qa-rules.md` — QA process, validation, error handling, pre-commit checks, and manual testing checklist.
- `docs/rls-rules.md` — Supabase RLS rules, permission boundaries, auth/session safety, and security constraints.
- `docs/ui-rules.md` — UI Gate (no hardcode + component-first + Combobox-only) + dom.ria.com reference.
- `docs/performance.md` — Core Web Vitals RUM layer: collector, reporter, budgets, logging, and analytics dispatch contract.

## Documentation Update Rule

When changing project rules, always update the relevant file in `/docs/` instead of expanding `Claude.md`.
If a rule could fit multiple files, keep it in the most specific document and avoid duplicating it across `/docs/`. 
Use `Claude.md` only as the project index, context entry point, and navigation file.
