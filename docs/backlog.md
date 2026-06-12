# Project Backlog

> ⚠️ **HARD LIMIT: this file holds ACTIVE state only (~80 lines).** The historical ledger lives in a SEPARATE file: [`docs/backlog-archive.md`](backlog-archive.md).
> Full per-task detail lives in `docs/sessions/` — do NOT paste multi-line per-task summaries here.
> "Last Session" = 2–4 lines max (what changed, what's next). When a task is reviewed/closed, move its summary to ONE row at the TOP of the archive ledger. Violating this is a rule breach.
> See "Backlog & Session Log Rules" in `docs/ai-behavior.md`.

## Last Session

**2026-06-12 — Task 419 (Slice 4b: admin shell action buttons full-width §26.1) — APPROVED + COMMITTED.** Orchestrator diff review + owner-native clause-14 gates: focused QA `scripts/task419-qa-shell-fullwidth.mjs` 144/144 PASS, `screenshots:assert` 2520/2520, 0 FAIL (flaky-recovered 1, `AdminUserAvatar/EditMode×en×tablet-768` retry-recovered — tolerated, cf. 418). Static concern that the `AdminSettings` Save `<Button>` (`inline-flex`) might stay content-width inside its `w-full` block wrapper was disproven by the rendered button-level measurement (full-width at every uk@320/375/390 cell). 2 container-only `max-sm:` fixes (`AdminSettings.tsx`, `AdminUserAvatar.tsx`). Session: `docs/sessions/2026-06-12-task419-slice4b-admin-shell-fullwidth.md`. **Next: Slice 5 (public/listing/system).**

## Pending Action Items

| Item | Owner | Notes |
|------|-------|-------|
| 🔐 Re-verify HIBP "Prevent use of leaked passwords" availability on Free tier (Supabase Auth → Sign In/Providers → Password Security). Owner flagged 2026-05-28 as Pro-only. If a Free-tier toggle is now available → enable; if not → enable at Pro upgrade. | Owner | Supabase Security Advisor `auth_leaked_password_protection` WARN. Documented in `docs/integrations.md` → "Supabase Auth Configuration". |

## Next Immediate Tasks

**Active queue = Sprint 35 (Epic JJ tokens + global responsive rework).** Per-task detail in `docs/sessions/`; closed-task ledger in [`backlog-archive.md`](backlog-archive.md).

**Live commit/review state:**

- **Bundle 410 + 411 + 412 + 413 + 416 + 417** — APPROVED + COMMITTED (`50c93fa8e` Task411 incl. 410 ASSERT_STORIES + 412 §MQ; `b44b996d4`/`b9441c60b` Task416; `8d952a547`/`bca52538e` Task417). Matrix green (2520/2520).
- **Slice 2 (414/415) — APPROVED + COMMITTED** (`bd2adc106` / `def476ea2`). DONE.
- **Task 418 + 418 REWORK — APPROVED + COMMITTED** — owner-native 3× `screenshots:assert` = 2520/2520, 0 FAIL (flaky-recovered 1/0/0); deterministic gate satisfied.
- **Task 419 (Slice 4b) — APPROVED + COMMITTED** — orchestrator diff review (AdminSettings/AdminUserAvatar full-width verified) + owner-native clause-14 gate: focused QA 144/144, `screenshots:assert` 2520/2520, 0 FAIL (flaky-recovered 1, tolerated).

**Ordering:** **Slice 4b** (Task 419, DONE) → **Slice 5** (public/listing/system). With the now-deterministic gate, 4b+ get a clean 2520/2520 close. **Slice 6 proper** (NEW DOM assertions for button full-width + popup bottom-sheet) remains separate/open. Then resume **Epic JJ 408 → 407**.

**Task numbering — last used: 420.** **Next free: 421.**

> **Task 420 (Slice 5 — public/listing grid §8.3 step + container audit) KICKED OFF** — `tasks/Sprints/Sprint_35_kickoff_prompt_Task_420_Slice5_PublicListingGridStep.md`. Bounded §8.3 sweep (owner 2026-06-12): FIX `FeaturedListings` (`lg`→`xl`) + `SimilarListings` (+`xl:3`, 4-col `lg`→`2xl`); canonical surfaces verify-only; RecentlyViewed carousel = STOP&ASK exemption; new minimal stories + `scripts/task420-qa-grid-step.mjs` (harness untouched — Slice 6 gated). Awaiting Sonnet.

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
| **JJ — Design Variables (single-source tokens)** | 401/402/403 ✅ committed, 404–406 done, 408 (planned), 407 (final strict flip) | Project-wide `@theme` token layer + strict no-raw-value gate (report-mode → blocking) | [`Epic_JJ_…`](../tasks/Epics/Epic_JJ_Design_Variables_Single_Source.md) |

> **Standing governance (codified in `/docs`):** Notes 18–23 (`ai-behavior.md`) + `agent-contract.md` (P0, clauses 1–14) + `rule-index.md` (task-type pre-reads) + Positive+Negative flow rule (`orchestrator-role.md`). Non-optional acceptance gates on every task.

## Archive

Completed tasks, sprints, and epics live in **[`docs/backlog-archive.md`](backlog-archive.md)**.
