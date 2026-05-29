# Sprint 19 — Admin Surfaces Unification + Profile Identity

> **Theme:** consistency on the admin side + finishing the user identity card. Depends on
> Sprint 18 (the canonical primitives from Task 282 and the multi-select filter model from
> Task 294 are the foundation the admin-table unification builds on). Run **after Sprint 18**.

> **Mandatory rules (every task):** `docs/agent-contract.md` clause 6a (Positive + Negative flow)
> + clause 10 (Task 264 — Sonnet writes a "Files Changed" table, NEVER emits/runs git; orchestrator
> emits explicit-path commits; owner runs them in PowerShell).

## Tasks

| Task | Title | Priority | Kickoff |
|------|-------|----------|---------|
| **284** | Admin surfaces unification + Support/Inquiries ambiguity resolution | HIGH | [`Sprint_19_kickoff_prompt_Task_284.md`](Sprint_19_kickoff_prompt_Task_284.md) |
| **287** | Promote user email into the profile identity card | MEDIUM | [`Sprint_19_kickoff_prompt_Task_287.md`](Sprint_19_kickoff_prompt_Task_287.md) |

## Measured surfaces (2026-05-29)
- Admin route groups: `companies, currency, email-templates, footer, inquiries, legal, listings,
  locations, pages-admin, permissions, popular-locations, property-types, reports, settings,
  support, users`. Shell = `AdminShell.tsx` + `AdminSidebar.tsx`.
- Support vs Inquiries overlap: `AdminInquiriesManager.tsx` + `AdminSupportManager.tsx` both exist —
  284 must resolve what each is for and unify or clearly separate them.
- Profile card: `src/modules/cabinet/components/ProfileTab.tsx` (287 target).

## Sequencing
284 first (broad admin pass), then 287 (small, isolated). 287 can also run independently of 284.
Each gets its own diff review + commit hand-off.
