# Project Backlog

> ⚠️ **HARD LIMIT: this file holds ACTIVE state only (~80 lines).** Historical ledger → [`docs/backlog-archive.md`](backlog-archive.md); full per-task detail → `docs/sessions/`.
> "Last Session" = 2–4 lines. When a task is reviewed/closed, move it to ONE row at the TOP of the archive ledger. See `docs/ai-behavior.md` → "Backlog & Session Log Rules".
> Reconciled against git history 2026-07-17 (`main` == `origin/main`): everything committed is pushed. The former per-task "pending owner run" narrative was stale (its detail already lives in the archive) and has been removed.

## Last Session (2026-07-17)

- **Task 620** — `theme.ts` badge shade-index comments corrected to index 7 (comment-only, zero pixel change; mechanism verified against Mantine `get-primary-shade.mjs`/`get-css-color-variables.mjs`). ✅ APPROVED (orchestrator review) + committed + pushed. Open P3 follow-ups: light-mode qualifier on the new comments, `purple` index-0 comment still imprecise, stale `sale` prose. Session: `docs/sessions/2026-07-17-task620-badge-shade-comment-accuracy.md`.
- **Task 619** — dedicated `sale` `#dd0939` badge color (index 7 per `primaryShade:7`, card + detail surfaces). ✅ APPROVED + committed + pushed.
- **Tasks 614–618** — Sprint 44 listing card/detail Mantine tail (`ListingDetailPattern` rebuild, premium uniform gold border, Badge→Mantine `filled`, CTA flex-direction fix, check-stories Check-9 proof). ✅ all committed + pushed.
- **Governance** — added the STATUS/REPORT MISMATCH reconciliation gate (`CLAUDE.md` + `agent-contract.md` + `orchestrator-role.md` + `orchestrator-procedures.md`).

## Open — needs action

**Not yet executed / re-scope before kicking off:**
- **Task 625** — lands Q0R + 624 as one commit: `governance-pr.yml` `locale-leak` job step now `continue-on-error: true` (migration-window warn-only policy, owner directive 2026-07-19 — script exit code / `check:locale-leak:mantine-only` definition unchanged, `rendered-proof`/`check:story-coverage` stay blocking); `scripts/mantine-migration-scope.json` completed to 6/6 (`FooterView.tsx` added — its story landed in `7bc4550b9` after Q0R was written); Q0R's shared-module/`--mantine-only`/coverage-rewrite work and 624's allowlist/translation/story fixes carried unchanged. R5 (moving `Studio`/`Penthouse`/`Max` from global to per-story allowlist) deferred as a follow-up, not blocking. ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-19-task625-q0r-624-warnonly-landing.md`.
- **Task 613** — removed the DEAD `--z-*` Tailwind z-index token scale from `globals.css` (0 consumers grep-confirmed; `ui-rules.md` §16/§12 needed no edit, already correct). ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-17-task613-dead-zindex-token-scale-cleanup.md`.
- **Task 621** — Homepage Agent-CTA migrated to canonical Mantine `Button` (new island `AgentCtaButton.tsx`). Owner visual QA found + fixed 3 real defects beyond the kickoff's suggestion (off-menu `size="lg"`, asymmetric icon-side padding, a theme-wide `height:'auto'`-breaks-`inner`-centering bug fixed locally — flagged as a possible sitewide Button follow-up). `screenshots:responsive` found to be Storybook-only, not app-route-capable — kickoff defect, ad-hoc Playwright capture used instead. ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-17-task621-homepage-agent-cta-mantine-button-migration.md`.
- **Task 626** — Task 625 R5 follow-up: move `Studio`/`Penthouse`/`Max` out of the global `LEAK_ALLOWLIST` into `PER_STORY_TOKENS` (they have real localized forms — it `Monolocale`/`Attico`, sq `Maks`), scoped like `Gas`, to restore an honest mistranslation signal. Q0 + mandatory planted-violation proof. 📝 KICKOFF READY — not executed. Kickoff: `tasks/kickoff_prompt_Task_626_LocaleLeak_PerStory_StudioPenthouseMax.md`.
- **Task 627** — triage the pre-existing SB10 ESLint debt (47 problems / 17 err + 30 warn, all outside the 625 diff): authoritative regenerated inventory + per-category remediation plan; **no source fixes** (fixes deferred to Task 628). Q0 docs-only. 📝 KICKOFF READY — not executed. Kickoff: `tasks/kickoff_prompt_Task_627_SB10_Lint_Debt_Triage.md`.

**Deferred / on hold:**
- **Task 560** — admin suspension-as-date-range (DB/RLS/server action). Deferred.
- **Task 463** (Epic BB) — full admin report management. ON HOLD until the Mantine primitive library (Epic MM) is complete; must be rebuilt on finished primitives. Kickoff `tasks/Epics/Epic_BB_kickoff_prompt_Task_463_AdminReportFullManagement.md`.
- **Epic HH** — 310 (P4 content/settings routes), 311 (P5 modal standardisation, partial), 313 (P6 Verified Agents, blocked on owner DB-schema sign-off); 308/309 re-scope onto canonical primitives.
- **Task 453** (Epic KK.2) — remaining admin-manager freshness. Reserved.

## Pending Action Items (owner)

| Item | Notes |
|---|---|
| 🔐 Re-verify HIBP "leaked password protection" availability on Supabase Free tier (Auth → Password Security); enable now if available, else at Pro upgrade. | Security Advisor `auth_leaked_password_protection` WARN. `docs/integrations.md`. |
| 👁️ Eyeball-verify notification localization under `/sq` (data-only fix applied 2026-07-14; creation code already correct). | Re-open the bell under `/sq`. |
| 🐞 `/listings` Grid horizontal overflow <640px (FilterBar segmented `flex-1` + `min-w-35` Combobox push `scrollWidth` past the viewport at 320/375/390). Needs its own task. | Traced via DOM offender scan; out of Task 603 scope. |
| 🖋️ Verified Agents DB schema sign-off (Task 313) + verified-badge public visibility. | Epic HH blocker. |

**Task numbering — last used: 627 (622/623 not used as plain numbers — `Q0R`/`623R` are lettered
task IDs outside the plain numeric sequence; flagging for orchestrator reconciliation). 628 reserved for the
SB10 lint-debt fix (Task 627's follow-up). Next free: 629.**

## Reserved / deferred / retired

- Reserved: 310, 311, 313 (Epic HH), 453 (Epic KK.2).
- Deferred (no #): **I.3** listing-status helper API `(status) → (listing)` — see `docs/domain-rules.md` → "Future ListingStateMachine evolution trigger".
- Retired (never reuse): 465 (uk→ua migration, cancelled); 466/467/469–481 (legacy-primitive layout, superseded by the Mantine migration); 534 (superseded+closed by 535); 597/604 (superseded by 598/605).

## Active Epics — open (closed epics → archive)

| Epic | Status | Plan |
|---|---|---|
| **HH — Admin UX System** | OPEN — 310 (P4), 311 (P5 partial), 313 (P6, blocked on owner DB sign-off); 308/309 re-scope onto canonical primitives | [`Epic_HH_…`](../tasks/Epics/Epic_HH_Admin_UX_System.md) |
| **BB — Listing Inquiries: Report & Message** | ⏸️ ON HOLD — Task 463 held until Epic MM primitives complete; earlier BB tasks (242/243/430/435/458–462) done | [`Epic_BB_…`](../tasks/Epics/Epic_BB_Listing_Inquiries_Report_and_Message.md) |
| **II — Global i18n Hardening** | Implemented + reviewed (316–323); committed + pushed | [`Epic_II_…`](../tasks/Epics/Epic_II_Global_i18n_Hardening.md) |
| **KK — Admin Data Freshness** | 452 (KK.1) done; 453 (KK.2) reserved for remaining managers | [`Epic_KK_…`](../tasks/Epics/Epic_KK_Admin_Data_Freshness.md) |
| **MM — Mantine/TailAdmin Restyle** | IN PROGRESS — Sprints 37–44 landed + pushed (form controls, overlays, TailAdmin conformance, Combobox/DatePicker family, Header/app-shell decomposition, listing card/detail). Next primitives per tracker | [`Epic_MM_…`](../tasks/Epics/Epic_MM_Mantine_UI_Migration.md) · tracker `docs/mantine-tailadmin-migration-tracker.md` |

## Standing notes

> **Frozen/deferred (reviewed 2026-06-05):** Sprint 28 admin-mobile 308/309 must be re-scoped onto the DS + canonical primitives before resuming; Epic HH P4/P5/P6 per the table above; I.3 deferred (valid). Every open task consumes the global Design System (`docs/design-system.md`, Task 340) wherever UI/responsive/overlay is touched, and since the Mantine freeze (Task 482) new UI uses Mantine (`docs/mantine-responsive-design-system.md`); `docs/rule-index.md` sets the per-task pre-read.

> **🟡 Console NOISE (not bugs — do not re-triage as P0):** `[PRED] … preloaded`, `[LCP] … route`, `[Vercel Speed Insights] debug`, "speculation rule set … will be ignored", Turbopack dev-only CSS-chunk/`*.woff2` preload warnings — all dev/debug artifacts, gone in prod. OpenTelemetry `import-in-the-middle` resolved by Task 450 (`322c5d599`); Cloudinary LCP "preloaded but not used" by Task 437. A stale Turbopack `next dev` HMR cache can emit a one-off React `useId` `mantine-_R_…-target` hydration error that does NOT survive a clean `next build` + fresh dev restart and does NOT reproduce in prod — re-verify with `check:hydration` against a freshly restarted server before triaging any `_R_` id mismatch as a code bug (Task 582).

> **Commit emission policy:** the orchestrator emits explicit-path `git add`/`git commit` per task at review time (never `-A`/`-u`/wildcards, never pre-staged batches); the owner runs them in PowerShell. Before emitting, reconcile `git status --short` + the real diff + the session `Files Changed` table (STATUS/REPORT MISMATCH gate). Each commit is reconstructable from the session log.

> **Acknowledged advisor exceptions** (intentional, no task): `pg_net in public` (deferred); `email_change_tokens` RLS-enabled-no-policy — see `docs/rls-rules.md` → "Acknowledged Advisor Exceptions".

> **Standing governance:** `ai-behavior.md` Notes 18–23 + `agent-contract.md` (P0, clauses 1–15) + `rule-index.md` (task-type pre-reads) + the Positive/Negative flow rule (`orchestrator-role.md`). Non-optional acceptance gates on every task.

## Archive

Completed tasks, sprints, and epics live in **[`docs/backlog-archive.md`](backlog-archive.md)**.
