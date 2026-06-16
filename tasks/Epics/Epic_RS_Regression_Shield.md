# Epic RS — Regression Shield (project-wide regression-protection initiative)

> **Type:** governance initiative + QA/tooling Epic. **Owner-directed, 2026-06-16.**
> **Why:** critical flows have silently regressed more than once (auth recovery + self-delete, 2026-06-16;
> report-listing after an RLS change, Task 270→435; admin date-format hydration, Task 434). `build`/`tsc`/
> `lint` passed in every case. This Epic builds a **system that prevents old functionality from breaking
> silently**, not another point fix.
>
> **🔴 Hard boundary:** Regression Shield is PREVENTION. It must NOT fix or get mixed with the live local
> bugs (Task 433/434/435/437/439) and must NOT "fix random bugs along the way". Each live bug stays its own
> task; the Shield's job is to make that *class* of regression impossible to miss next time.

## The two pillars

1. **A rule that acts immediately (governance).** From now on, any task that touches a critical flow MUST
   add a regression test or explicitly update an existing one, and CANNOT be closed without proof that the
   old critical functionality still works. "I manually checked one case" is NOT sufficient. This rule is
   live the moment Task 440 lands — it applies to Task 439 and every future task, even before the full E2E
   suite exists.
2. **A suite that grows over time (coverage).** A `Critical Flow Registry` enumerates every P0/P1 flow and
   its required regression test; machine gates + smoke tests are added incrementally, slice by slice. Every
   bug fixed from now on earns a regression test so it cannot return.

We deliberately do NOT attempt "cover the whole site with E2E in one task" — that produces a flaky monster.
Order: **governance rule + registry → P0 smoke gates for the most critical flows → every new flow-touching
task adds/updates its test → every fixed bug gets a regression test.**

## Source-of-truth artifacts

- **`docs/critical-flow-registry.md`** — the registry (flow · route/component/action · owner task ·
  happy path · failure path · required regression test · required command · coverage status).
- **Governance rule** (lands in Task 440): `docs/agent-contract.md` clause 15 + `docs/orchestrator-role.md`
  (standing rule + review-checklist item) + `docs/rule-index.md` (registry pre-read + critical-flow task
  type) + `docs/ai-behavior.md` (Canonical Task Template "Regression coverage" block).
- **Existing infra to build ON (do not reinvent):** vitest (`npm test`), Playwright `^1.60.0` (installed,
  no e2e config yet), `scripts/check-*.mjs` gates, `scripts/responsive-screenshots.mjs` +
  `scripts/check-stories-rendered.mjs`, CI `.github/workflows/governance-pr.yml`.

## Slices (incremental — each is its own task; the RULE is live after Slice 0)

| Slice | Task | Scope | Status |
|---|---|---|---|
| **0 — Foundation** | **440** | P0 governance rule (4 docs) + Critical Flow Registry + this Epic. Orchestrator-executed (docs/governance domain). **Makes the rule live immediately.** | ✅ this session |
| **1 — Foundational guards** | **436** (reframed) | Hydration/console-error gate + admin-users & report-listing smoke + RLS-change governance rule + actionable-error-toast rule. (Was "protection for Task 432 bugs" — now reframed as RS Slice 1.) | kickoff ready |
| **2 — Auth lifecycle** | **441** | Smoke + gates: login, signup, recovery request, recovery link→reset (incl. prefetch-safe + ≥15min), logout, OAuth/magic-link if present, self-delete, **email reuse after delete**. Coordinates with Task 439 (do not implement 439's product fix here). | kickoff ready |
| **3 — Listings lifecycle** | **442** | Smoke: create/edit listing, status change, report listing, inquiry/send-message. | defined here |
| **4 — Admin lifecycle** | **443** | Smoke: user status/role/account-type change, user-history creation, clear-history success + no-op race, hard-delete. | defined here |
| **5 — Server-action / RLS write paths** | **444** | Harness: every write action has positive + negative permission coverage (anon/user/owner/admin/service_role actor matrix). Closes the Task 270→435 class. | defined here |
| **6 — i18n / hydration / mobile** | **445** | Expand the hydration/console-error + i18n-parity + date-format gate across key sq/en/uk/it routes; assert no horizontal overflow at 320/375/390 on critical admin/user/listing routes. | defined here |

Slices 3–6 get full kickoff files when scheduled; their contracts are fixed here so scope can't drift.

> **🔴 Sequencing (owner P0, 2026-06-16):** **Task 439 (P0 auth incident) runs and CLOSES before any RS
> slice.** Until 439 lands, Slice 2 (441) leaves the recovery-prefetch and self-delete-email-reuse cells as
> `pending-439`. Order: 439 (fix + prod/staging validation + Supabase checklist) → 436 (Slice 1 foundation
> gates) / 441 (Slice 2 auth smoke). The governance RULE (clause 15) is already live and binds 439 itself.

## Definition of done for a slice

- The flows in scope appear in `docs/critical-flow-registry.md` with coverage status flipped to ✅ + the
  exact command.
- Each new machine gate has a **planted-violation FAIL transcript** (break it → gate fails → revert → green).
  A gate that can't be made to fail is a no-op = task failure.
- Smoke = smallest reliable happy path + one known failure/no-op path per flow. NOT every UI state, NOT flaky.
- Wired into CI (`governance-pr.yml`) as a blocking step, with the exact local command documented.
- No product redesign; no fix to 433/434/435/437/439; no incidental "while I'm here" bug fixes.

## Epic-level acceptance

- Governance rule live and referenced from agent-contract + orchestrator-role + rule-index + task template.
- Registry exists and is the single source of truth for critical-flow coverage.
- At least Slices 0–2 landed; Slices 3–6 scheduled with fixed contracts.
- From now on: no flow-touching task closes without regression proof; every fixed bug adds a regression test.
