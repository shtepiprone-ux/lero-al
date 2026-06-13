# Project Backlog

> ⚠️ **HARD LIMIT: this file holds ACTIVE state only (~80 lines).** The historical ledger lives in a SEPARATE file: [`docs/backlog-archive.md`](backlog-archive.md).
> Full per-task detail lives in `docs/sessions/` — do NOT paste multi-line per-task summaries here.
> "Last Session" = 2–4 lines max (what changed, what's next). When a task is reviewed/closed, move its summary to ONE row at the TOP of the archive ledger. Violating this is a rule breach.
> See "Backlog & Session Log Rules" in `docs/ai-behavior.md`.

## Last Session

**2026-06-13 — Task 319 kickoff WRITTEN (Epic II Phase 2 — notification locale-binding fix), UNBLOCKED.** Owner picked **Model C** (template-ID + small typed params, render-time localisation in viewer `useLocale()`); **legacy rows = graceful verbatim fallback, NO backfill in 319**; **price_change** stores numeric params `{oldPrice,newPrice,currency,listingName|listingId}` formatted at render. Kickoff: `tasks/Epics/Epic_II_kickoff_prompt_Task_319.md` (migration + `createNotification` sig + `NotificationItem` render precedence + 5 producers migrated, #6 unchanged + `notifications.*` 4-locale keys + manifest entry; full Positive/Negative flows + mobile <640 gate + clause 1–14 AC). Prior: Task 318 audit committed (`docs/governance-reports/2026-06-13-notification-locale-audit.md`, root cause `admin/actions/index.ts:728`). **Next: Sonnet executes Task 319** → **320** (fills the 3 baselined `admin.support.user_status_*` keys) → **323** (CI wiring).

## Pending Action Items

| Item | Owner | Notes |
|------|-------|-------|
| 🔐 Re-verify HIBP "Prevent use of leaked passwords" availability on Free tier (Supabase Auth → Sign In/Providers → Password Security). Owner flagged 2026-05-28 as Pro-only. If a Free-tier toggle is now available → enable; if not → enable at Pro upgrade. | Owner | Supabase Security Advisor `auth_leaked_password_protection` WARN. Documented in `docs/integrations.md` → "Supabase Auth Configuration". |

## Next Immediate Tasks

**Sprint 35 (Epic JJ tokens + global responsive rework) — FULLY COMMITTED, nothing pending.** All slices + Epic JJ landed on `main` (408 `6a0b9e623`, 419 committed, 420 `19c39740d`, 421 `44227e995`, 422 `4561a6e82`, 407 `84037666f`). Per-task detail + commit SHAs in [`backlog-archive.md`](backlog-archive.md); session logs in `docs/sessions/`.

**Epic II — Global i18n Hardening: Task 316 COMMITTED (`65a97a8cc`); Task 317 ✅ APPROVED (commit emitted, pending owner run); Task 423 ✅ APPROVED (commit emitted); Task 318 DONE (audit, awaiting review — `docs/sessions/2026-06-13-task318-notification-locale-audit.md`).** Task 317 output: `scripts/check-i18n-dynamic.mjs` + manifest + baseline + `docs/i18n-rules.md`. Task 423 hardened the same scanner's manifest/baseline validation — zero data edits. Task 318: `docs/governance-reports/2026-06-13-notification-locale-audit.md` (root cause named, 3 fix options for 319). Next queue: **319** (notification locale-binding fix — kickoff WRITTEN & unblocked, owner picked Model C: `tasks/Epics/Epic_II_kickoff_prompt_Task_319.md`) → **320** (remediation, fills the 3 baselined `admin.support.user_status_*` keys) → **323** (CI wiring, proposal in Task 317 session log).

**Task numbering — last used: 423. Epic II uses reserved 316–323.** **Next free (new): 424.**

**Reserved/deferred:** 310 (Epic HH P4), 311 (Epic HH P5 — partially superseded), 313 (Epic HH P6 Verified Agents — blocked on owner DB-schema approval), 316–323 (Epic II P1–3), 237/238 (Epic Y), 243 (Epic BB), 246 (Epic DD). **CLOSED:** 351/352/353 (superseded by global DS). Deferred (no task #): **I.3** listing-status helper API migration `(status) → (listing)` — see `docs/domain-rules.md` → "Future ListingStateMachine evolution trigger".

**Owner decisions still needed (Epic HH):** Verified Agents DB schema sign-off (Task 313) + verified-badge public visibility.

> **Commit emission policy:** the orchestrator emits explicit-path `git add` / `git commit` per task at review time (never pre-staged batches, never `-A`/`-u`/wildcards); the owner runs them in PowerShell. Each commit is reconstructable from the session log's "Files Changed" table.

> **Acknowledged advisor exceptions** (intentional, no task): `pg_net in public` (deferred); `email_change_tokens` RLS-enabled-no-policy — see `docs/rls-rules.md` → "Acknowledged Advisor Exceptions".

## Frozen / deferred tasks — relevance after Design System (reviewed 2026-06-05)

The global DS work (Task 340 contract + Sprint 32/33, Tasks 372–392) is the canonical mobile/responsive + Storybook layer. Re-assessment of items frozen behind it:

| Item | Verdict | Notes |
|------|---------|-------|
| **Sprint 28** — admin mobile (306/307/306-Fix ✅; 308/309 BLOCKED) | **RE-SCOPE under DS (owner 2026-06-05)** | 308/309 must be re-written to consume `docs/design-system.md` + canonical primitives before any admin migration resumes. |
| **Epic HH Phase 4 (310)** — 12 content/settings admin routes | **Still relevant** | Never migrated; must consume the DS contract. |
| **Epic HH Phase 5 (311)** — admin modal standardisation | **Partially superseded** | Residual = width tiers + destructive-action footer only. |
| **Epic HH Phase 6 (313)** — Verified Agents workflow | **Still relevant** | Blocked on owner DB-schema approval; DS-unaffected. |
| **Epic II (316–323)** — i18n hardening | **Still relevant** | DS only hardened *Storybook* i18n; runtime notif/email/toast/dynamic-key untouched. |
| **Epic Y (237, 238)** · **BB (243)** · **DD (246)** | **Still relevant** | Independent product features; DS-unaffected. |
| **I.3** listing-status helper API migration | **Deferred (valid)** | Trigger-based; DS-unaffected. |

> **🆕 Standing principle (owner 2026-06-05):** every still-open task consumes the global Design System (`docs/design-system.md`, Task 340) wherever UI/responsive/overlay surfaces are touched. `docs/rule-index.md` already mandates `design-system.md` as the first pre-read for UI/layout/admin task types — re-scope any pre-DS plan to it before execution.

## Active product backlog — open Epics (Y/BB/DD/HH/II/JJ; verified 2026-06-05). Closed epics → [`backlog-archive.md`](backlog-archive.md)

| Epic | Tasks | Source notes | Plan |
|---|---|---|---|
| **Y — Listing Form & Lifecycle UX** | **237, 238** open (236, 239 ✅) | Y.2 admin moderation preview · Y.3 edit side-panel + status control + dirty-state save | [`Epic_Y_…`](../tasks/Epics/Epic_Y_Listing_Form_and_Lifecycle_UX.md) |
| **BB — Listing Inquiries: Report & Message** | **243** open (242 ✅) | BB.2 inquiry/message flow; BB.3 chat = Task 342 | [`Epic_BB_…`](../tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md) |
| **DD — Admin Audit & History Hygiene** | 246 open | DD.1 admin can clear change history (gated + audited) | [`Epic_DD_…`](../tasks/Epics/Epic_DD_Admin_Audit_and_History_Hygiene.md) |
| **HH — Admin UX System** | 310 (P4), 311 (P5, partial), 313 (P6) | 308/309 page-migration need remains — re-scope vs canonical primitives | [`Epic_HH_…`](../tasks/Epics/Epic_HH_Admin_UX_System.md) |
| **II — Global i18n Hardening** | 316–323 (planned) | P1 audit + scanner → P2 remediation → P3 CI gate | [`Epic_II_…`](../tasks/Epics/Epic_II_Global_i18n_Hardening.md) |
| **JJ — Design Variables (single-source tokens)** | 401–408 ✅, 407 strict flip landed — **Epic JJ CLOSED** | Project-wide `@theme` token layer + strict no-raw-value gate (report-mode → blocking, now blocking) | [`Epic_JJ_…`](../tasks/Epics/Epic_JJ_Design_Variables_Single_Source.md) |

> **Standing governance (codified in `/docs`):** Notes 18–23 (`ai-behavior.md`) + `agent-contract.md` (P0, clauses 1–14) + `rule-index.md` (task-type pre-reads) + Positive+Negative flow rule (`orchestrator-role.md`). Non-optional acceptance gates on every task.

## Archive

Completed tasks, sprints, and epics live in **[`docs/backlog-archive.md`](backlog-archive.md)**.
