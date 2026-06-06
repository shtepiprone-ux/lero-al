# Project Backlog

> ⚠️ **HARD LIMIT: this file holds ACTIVE state only (~80 lines).** The historical ledger lives in a SEPARATE file: [`docs/backlog-archive.md`](backlog-archive.md).
> Full per-task detail lives in `docs/sessions/` — do NOT paste multi-line per-task summaries here.
> "Last Session" = 2–4 lines max (what changed, what's next). When a task is reviewed/closed, move its summary to ONE row at the TOP of the archive ledger. Violating this is a rule breach.
> See "Backlog & Session Log Rules" in `docs/ai-behavior.md`.

## Last Session

**2026-06-06 — Task 398 COMPLETE (story-coverage gate + scaffold).** `check:story-coverage` gate built (fail-on-new; `scripts/story-coverage-exempt.json` with 72 justified entries seeded from current state). Scaffold generator (`npm run new:story`) produces stories that pass `check:stories` unmodified. CI wired. All negative flows proven. `node --check` PASS, 0 NUL bytes, `tsc=0`. Pending orchestrator review + commit.

**2026-06-06 — Task 399 COMPLETE (scanner hardening: brace-literal evasion).** Extended `scripts/check-hardcoded-i18n.mjs` with `JSX_EXPR_CHILD_PATTERNS` to detect `{'VALUE'}` / `{"VALUE"}` / `` {`VALUE`} `` in JSX children. Negative flow proven: planted `{'Evasion Probe'}` and `` {`Static Template Literal`} `` → exit 1 named as `[expr-child]`. Dynamic forms `{t('x')}`, `{name}`, `` {`Page ${n}`} `` → 0 false positives. Gate green on clean tree (1 baseline entry). `docs/i18n-governance.md` §2 updated. `node --check` PASS, 0 NUL bytes, `tsc=0`. Pending orchestrator review + commit.

**2026-06-06 — Task 400 COMPLETE (file-integrity gate).** `scripts/check-file-integrity.mjs` built + verified. Pending orchestrator review + commit.

**2026-06-05 — Task 397 APPROVED + commit emitted.** Native verification: NUL=0, `check:i18n-hardcode` exit 0, `tsc --noEmit`=0. Commit: `fix(Task397): remediate 47 i18n hardcodes …`.

## Pending Action Items

| Item | Owner | Notes |
|------|-------|-------|
| 🔐 Re-verify HIBP "Prevent use of leaked passwords" availability on Free tier (Supabase Auth → Sign In/Providers → Password Security). Owner flagged 2026-05-28 as Pro-only. If a Free-tier toggle is now available → enable; if not → enable at Pro upgrade. | Owner | Supabase Security Advisor `auth_leaked_password_protection` WARN. Documented in `docs/integrations.md` → "Supabase Auth Configuration". |

## Next Immediate Tasks

Design System baseline **CLOSED-AND-COMMITTED** (372–393 committed `923827b2d`/`47679ae52` + earlier DS commits).

**Active queue = Sprint 34** (`tasks/Sprints/Sprint_34_—_Remaining_Backlog_DS_Aligned.md`) — fresh per-task kickoffs for every remaining open task, all on the current contract (clauses 1–13).

1. **✅ Task 394 + 395 — COMPLETE (uncommitted)** → SB10 migration sound + locale-leak gate corrected. Pending orchestrator diff review + commit emission.
2. Then: **308 → 309** (admin mobile) → **237 → 238** (listing form) → **316/317/318** (i18n) → **243 / 246** → **310 → 311** → **313** (after DB-schema sign-off). Kickoffs filed in `/tasks` per the Sprint 34 index.

## Frozen / deferred tasks — relevance after Design System (reviewed 2026-06-05)

The global DS work (Task 340 contract + Sprint 32/33, Tasks 372–392) is the canonical mobile/responsive + Storybook layer. Re-assessment of items that were frozen behind it:

| Item | Verdict | Notes |
|------|---------|-------|
| **Sprint 28** — admin mobile (306/307/306-Fix ✅ in code; 308/309 BLOCKED) | **RE-SCOPE under DS (owner 2026-06-05)** | Primitives built; global DS made Button/Tabs/Dialog/Sheet/all-popups + AdminToolbar canonical. 308/309 must be re-written to consume `docs/design-system.md` + the canonical primitives before any admin migration resumes. |
| **Epic HH Phase 4 (310)** — 12 content/settings admin routes | **Still relevant** | Never migrated; must consume the DS contract. |
| **Epic HH Phase 5 (311)** — admin modal standardisation | **Partially superseded** | Global bottom-sheet/Dialog/Sheet/popup work covers most; residual = width tiers + destructive-action footer only. |
| **Epic HH Phase 6 (313)** — Verified Agents workflow | **Still relevant** | Independent product feature; blocked on owner DB-schema approval; DS-unaffected. |
| **Epic II (316–323)** — i18n hardening | **Still relevant** | DS only hardened *Storybook* i18n; runtime notif/email/toast/dynamic-key untouched. (Task 300 Phase-0 already shipped.) |
| **Epic Y (237, 238)** · **BB (243)** · **DD (246)** | **Still relevant** | Independent product features; DS-unaffected. |
| **351 / 352 / 353** (DS-6/7/8 route pilots) | **CLOSED 2026-06-05** | Never ran; superseded by global DS contract (Task 340 + Sprint 32/33). Kickoff files banner-marked CLOSED; archived. |
| **I.3** listing-status helper API migration | **Deferred (valid)** | Trigger-based (publishing/moderation/lifecycle automation); DS-unaffected. |

> **Sprint 28 status:** FROZEN since 2026-05-31; blocker now gone (primitives + global DS shipped). **308/309 to be re-written under DS** (owner 2026-06-05) — re-scoped against `docs/design-system.md` + canonical primitives, NOT run as originally written.
>
> **🆕 Standing principle (owner 2026-06-05):** every still-open task consumes the global Design System (`docs/design-system.md`, Task 340) wherever UI/responsive/overlay surfaces are touched. `docs/rule-index.md` already mandates `design-system.md` as the first pre-read for UI/layout/admin task types — re-scope any pre-DS plan to it before execution.

**Task numbering.** Last used: **400** (file-integrity gate — COMPLETE, pending commit). 399 = harden i18n scanner vs `{'...'}` evasion — COMPLETE, pending commit. 398 = story-coverage gate + scaffold — COMPLETE, pending commit. 397 = COMMITTED. 396 = COMMITTED. 394+395 = COMMITTED. **Active focus: orchestrator review + commit 400 + 399; then 398 (when unparked).** Next free: **401**. Reserved/deferred: 310 (Epic HH P4), 311 (Epic HH P5 — partially superseded), 313 (Epic HH P6 Verified Agents — blocked on owner DB-schema approval), 316–323 (Epic II P1–3). CLOSED: 351/352/353 (DS-6/7/8 — superseded by global DS). Deferred (no task #): **I.3** listing-status helper API migration `(status) → (listing)` — see `docs/domain-rules.md` → "Future ListingStateMachine evolution trigger".

**Owner decisions still needed (Epic HH — see `Epic_HH` "Open product decisions"):** Verified Agents DB schema sign-off (Task 313) + verified-badge public visibility. (351/352/353 close + 308/309 DS re-scope — DECIDED 2026-06-05.)

> **Commit emission policy:** the orchestrator emits explicit-path `git add` / `git commit` per task at review time (never pre-staged batches); the owner runs them in PowerShell. Each commit is reconstructable from the session log's "Files Changed" table.

> **Acknowledged advisor exceptions** (intentional, no task): `pg_net in public` (deferred); `email_change_tokens` RLS-enabled-no-policy — see `docs/rls-rules.md` → "Acknowledged Advisor Exceptions".

## Active product backlog — open Epics (Y/BB/DD/HH/II; verified 2026-06-05). Closed epics → [`backlog-archive.md`](backlog-archive.md)

| Epic | Tasks | Source notes | Plan | Kickoffs |
|---|---|---|---|---|
| **Y — Listing Form & Lifecycle UX** | **237, 238** open (236, 239 ✅) | Y.2 admin moderation preview (overlaps Task 341) · Y.3 edit side-panel + status control + dirty-state save | [`Epic_Y_…`](../tasks/Epics/Epic_Y_Listing_Form_and_Lifecycle_UX.md) | Sprint 12 (236, 239) · later (237, 238) |
| **BB — Listing Inquiries: Report & Message** | **243** open (242 ✅) | BB.2 inquiry/message flow; BB.3 chat = Task 342 (Sprint 30, planned) | [`Epic_BB_…`](../tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md) | Sprint 12 (242) · later (243) |
| **DD — Admin Audit & History Hygiene** | 246 open | DD.1 admin can clear change history (gated + audited); Task 250 dep done | [`Epic_DD_…`](../tasks/Epics/Epic_DD_Admin_Audit_and_History_Hygiene.md) | later sprint (depends on 250) |
| **HH — Admin UX System** | 310 (P4), 311 (P5, partial), 313 (P6) | 308/309 (Sprint 28) page-migration need remains — re-scope vs canonical primitives | [`Epic_HH_…`](../tasks/Epics/Epic_HH_Admin_UX_System.md) | P4+ kickoffs after re-scope/owner sign-off |
| **II — Global i18n Hardening** | 316–323 (planned) | P1 audit + missing-key scanner → P2 remediation (notif locale-binding, dynamic-key, email, toast) → P3 CI gate | [`Epic_II_…`](../tasks/Epics/Epic_II_Global_i18n_Hardening.md) | P1 kickoffs (316/317/318) to draft when scheduled |

> **Standing governance (codified in `/docs`):** Notes 18–23 (`ai-behavior.md`) + `agent-contract.md` (P0, clauses incl. 11–13 mobile-full-width + rendered-evidence) + `rule-index.md` (task-type pre-reads) + Positive+Negative flow rule (`orchestrator-role.md`). Non-optional acceptance gates on every task.

## Archive

Completed tasks, sprints, and epics live in **[`docs/backlog-archive.md`](backlog-archive.md)**.
