# Project Backlog

> ⚠️ **HARD LIMIT: this file holds ACTIVE state only (~80 lines).** The historical ledger lives in a SEPARATE file: [`docs/backlog-archive.md`](backlog-archive.md).
> Full per-task detail lives in `docs/sessions/` — do NOT paste multi-line per-task summaries here.
> "Last Session" = 2–4 lines max (what changed, what's next). When a task is reviewed/closed, move its summary to ONE row at the TOP of the archive ledger. Violating this is a rule breach.
> See "Backlog & Session Log Rules" in `docs/ai-behavior.md`.

## Last Session

**2026-07-02 — Task 527 ❌ REJECTED by owner on rendered review; routed back as Task 528.** Task 527 claimed all gates green but captured NO rendered screenshots — three defects shipped uncaught: **D1** Textarea Default story hard-crashes (`theme.ts` `Textarea.styles.input.minHeight` hits Mantine `TextareaAutosize` guard → fix via `input-chrome.css` class, not inline); **D2** Badge `size='sm'`=14px must be 12px `text-theme-xs` status variant (§6b/§6l); **D3** overlay footer gap 20px must be **12px** and Popover radius 16px must be **12px** (orchestrator measured live 2026-07-02 → §6l Addendum). Kickoff: `tasks/Sprints/Sprint_40_kickoff_prompt_Task_528_TailAdminConformanceCorrectionsRound2.md`. Closing condition on 528 = the machine-produced rendered matrix Task 527 skipped (clause 12/13). Task 527 diff stays uncommitted (rejected); details in the archive ledger. **Next: measure done, kickoff written — 528 ready to hand to Sonnet.**

## Pending Action Items

| Item | Owner | Notes |
|------|-------|-------|
| 🔐 Re-verify HIBP "Prevent use of leaked passwords" availability on Free tier (Supabase Auth → Sign In/Providers → Password Security). Owner flagged 2026-05-28 as Pro-only. If a Free-tier toggle is now available → enable; if not → enable at Pro upgrade. | Owner | Supabase Security Advisor `auth_leaked_password_protection` WARN. Documented in `docs/integrations.md` → "Supabase Auth Configuration". |
| 🧾 Run all pending emitted commits in PowerShell (single-writer). ✅-APPROVED-but-uncommitted tasks awaiting the owner's run + native gate: Sprint 39 overlay Batch C (513–517, 522), Sprint 38 form-control commits (494/496/497/498/499/500/505/507/508), Epic II (316–323), Epic BB (243/430/458/459/460/461/462 + Supabase SQL applies), Epic DD (246/432), Epic LV (454/456/457), plus 238/425/426/427/434/437/442/443/444/448. Per-task detail + Files-Changed tables live in the archive ledger + session logs. | Owner | Commit-emission policy below; nothing here needs new orchestrator work. |

## Next Immediate Tasks

**🟢 Sprint 38 (MM Phase-1 Batch B — form controls) — COMPLETE.** All primitives done (Button/Label/TextInput/Textarea/error-border/PasswordInput/disabled-field+label+icon/Checkbox/Radio/Switch); 495 Select closed via 508. Remaining = owner-run commits + the two outstanding 499 Switch render cells (uk@375/390). Batch A (486–491) ✅ done. Tracker: `docs/mantine-tailadmin-migration-tracker.md`. Plan: `tasks/Sprints/Sprint_38_MM_Phase1_FormControls.md`.

**🟢 Sprint 39 (MM overlay Batch C) — COMPLETE, owner commits pending.** 509/510 (canonical Select) · 513 (Popover) · 514 (single-source `ResponsiveBottomSheet`) · 515 (DropdownMenu) · 516 (overlay trigger width) · 517 (drag-handle centering) · 518 (NavigationMenu) · 519/520/521 (Modal thread, committed + pushed) · 522 (§18.8 content-height fix, approved) · 523 (`MantineDrawer`) ✅ committed `04cc304db` · 524+526 (`MantineTooltip`, P1.22, implemented incl. wrap-no-clip fix — see Last Session). Batch C (P1.18–P1.22) fully done → next is Batch D. Kickoffs under `tasks/Sprints/Sprint_39_*`.

**🔴 Sprint 40 (TailAdmin conformance — ALL primitives) — OWNER P0, agent-contract clause 16.** Task 525 audit ✅ DONE. Task 527 (all-in-one correction) ❌ REJECTED on rendered review (D1 Textarea crash · D2 Badge 14→12px · D3 footer 20→12px + Popover 16→12px). **Next: Task 528** (round-2 corrective, kickoff written, orchestrator measured the missing §6l rows) — hand to Sonnet; closes only on the rendered matrix. Sprint: `tasks/Sprints/Sprint_40_TailAdmin_Conformance_AllPrimitives.md`.

**⏸️ Task 463 (Epic BB — full admin report management) — ON HOLD until the Mantine primitive library (Epic MM) is complete.** Do NOT re-execute yet: it must be rebuilt on the finished primitives, not the legacy ones. Capability-gated any→any status override + reopen + close + hard-delete, delegable via Дозволи (`reports.status_override` + `reports.delete`). Prior legacy-primitive implementation sits in the working tree (`docs/sessions/2026-06-19-task-463-admin-report-full-management.md`). Kickoff: `tasks/Epics/Epic_BB_kickoff_prompt_Task_463_AdminReportFullManagement.md`.

**Task numbering — last used: 528 (kickoff written, unexecuted). Next free: 529.**

**🔴 Task 528 (Sprint 40 — TailAdmin conformance corrections ROUND 2) — READY, unexecuted.** Fixes the 3 defects Task 527 shipped (D1 Textarea crash · D2 Badge 12px · D3 footer 12px + Popover radius 12px). Orchestrator measured the missing §6l Addendum rows in-browser (2026-07-02). Closing condition = machine-produced rendered matrix (clause 12/13). Kickoff: `tasks/Sprints/Sprint_40_kickoff_prompt_Task_528_TailAdminConformanceCorrectionsRound2.md`.
**Task 527 — ❌ REJECTED (not committed), superseded by 528. Detail in the archive ledger.**

**Reserved/deferred:** 310 (Epic HH P4), 311 (Epic HH P5 — partially superseded), 313 (Epic HH P6 Verified Agents — blocked on owner DB-schema approval), 453 (Epic KK.2 — remaining admin managers freshness). Deferred (no task #): **I.3** listing-status helper API migration `(status) → (listing)` — see `docs/domain-rules.md` → "Future ListingStateMachine evolution trigger". Retired numbers (never reuse): 465 (uk→ua migration, cancelled), 466/467/469–481 (legacy-primitive layout work superseded by the Mantine migration).

**Owner decisions still needed (Epic HH):** Verified Agents DB schema sign-off (Task 313) + verified-badge public visibility.

> **🟡 Known console NOISE (not bugs — do not re-triage as P0):** `[PRED] … preloaded`, `[LCP] … route`, `[Vercel Speed Insights] debug`, "speculation rule set … will be ignored", and Turbopack-dev-only CSS-chunk/`*.woff2` preload warnings are dev/debug artifacts (vanish in prod build). OpenTelemetry `import-in-the-middle` warnings resolved by Task 450 (`322c5d599`). Cloudinary LCP "preloaded but not used" resolved by Task 437.

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
| **Epic II (316–323)** — i18n hardening | **Implemented; owner commits pending** | Runtime notif/email/toast/dynamic-key fixes shipped + reviewed. |
| **I.3** listing-status helper API migration | **Deferred (valid)** | Trigger-based; DS-unaffected. |

> **🆕 Standing principle (owner 2026-06-05):** every still-open task consumes the global Design System (`docs/design-system.md`, Task 340) wherever UI/responsive/overlay surfaces are touched — and, since the Mantine freeze (Task 482, 2026-06-24), new UI work uses Mantine per `docs/mantine-responsive-design-system.md`. `docs/rule-index.md` mandates the correct first pre-read per task type.

## Active product backlog — open Epics. Closed/implemented epics → [`backlog-archive.md`](backlog-archive.md)

| Epic | Status | Plan |
|---|---|---|
| **HH — Admin UX System** | OPEN — 310 (P4), 311 (P5 partial), 313 (P6, blocked on owner DB sign-off); 308/309 re-scope vs canonical primitives | [`Epic_HH_…`](../tasks/Epics/Epic_HH_Admin_UX_System.md) |
| **BB — Listing Inquiries: Report & Message** | ⏸️ ON HOLD — Task 463 (full admin report management) held until the Mantine primitive library (Epic MM) is complete; must be rebuilt on finished primitives. Earlier BB tasks (242/243/430/435/458–462) done | [`Epic_BB_…`](../tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md) |
| **II — Global i18n Hardening** | Implemented + reviewed (316–323); remaining = owner-run commits | [`Epic_II_…`](../tasks/Epics/Epic_II_Global_i18n_Hardening.md) |
| **KK — Admin Data Freshness** | 452 (KK.1) ✅ committed `1994c67cc`; 453 (KK.2) reserved for remaining managers | [`Epic_KK_…`](../tasks/Epics/Epic_KK_Admin_Data_Freshness.md) |
| **MM — Mantine/TailAdmin Restyle** | IN PROGRESS — Sprint 37 Batch A ✅, Sprint 38 Batch B ✅, Sprint 39 overlay Batch C ✅ (owner commits pending); next primitives resume at 523 | [`Epic_MM_…`](../tasks/Epics/Epic_MM_Mantine_UI_Migration.md) · tracker `docs/mantine-tailadmin-migration-tracker.md` |
| **Y · DD · JJ · LV** | CLOSED / implemented — detail in [`backlog-archive.md`](backlog-archive.md) | — |

> **Standing governance (codified in `/docs`):** Notes 18–23 (`ai-behavior.md`) + `agent-contract.md` (P0, clauses 1–15) + `rule-index.md` (task-type pre-reads) + Positive+Negative flow rule (`orchestrator-role.md`). Non-optional acceptance gates on every task.

## Archive

Completed tasks, sprints, and epics live in **[`docs/backlog-archive.md`](backlog-archive.md)**.
