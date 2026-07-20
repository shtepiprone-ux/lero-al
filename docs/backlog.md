# Project Backlog

> ⚠️ **HARD LIMIT: this file holds ACTIVE state only (~80 lines).** Historical ledger → [`docs/backlog-archive.md`](backlog-archive.md); full per-task detail → `docs/sessions/`.
> "Last Session" = 2–4 lines. When a task is reviewed/closed, move it to ONE row at the TOP of the archive ledger. See `docs/ai-behavior.md` → "Backlog & Session Log Rules".
> Reconciled against git history 2026-07-17 (`main` == `origin/main`): everything committed is pushed. The former per-task "pending owner run" narrative was stale (its detail already lives in the archive) and has been removed.

## Last Session (2026-07-20)

- **AuthSheet Mantine migration COMPLETE (Slices 1–2e: Tasks 633–638)** — shell→`MantineDrawer`, Button/Input/Label→TextInput, PasswordInput, Alert, Combobox→`MantineCombobox`, Labels→`InputLabel`; `AuthSheet.tsx` now imports zero base `@/components/ui/*` primitives (only domain `PasswordRequirementsHint`). ✅ all reviewed + committed → archive (2026-07-20).
- **Tasks 639, 640, 643** — company-field trio: `useCompanies` refetch-after-create (no reload); duplicate-name detection + Select-existing UX in AuthSheet; `AdminCompaniesManager` reacts to the duplicate result (no logo overwrite). ✅ all APPROVED WITH NOTES + committed (`ca44cfc96`/`7e701a522`/`9dc7ccb38`) → archive.
- **Tasks 631–632, 626** — ViewAllLink story proof-path + wrapped-label right-align; locale-leak R5 per-story allowlist. ✅ all APPROVED + committed → archive.
- **Remaining AuthSheet follow-ups:** 641 (DB UNIQUE index + dedup migration — riskiest, DRY-RUN gated), 642 (drop `📷` from company dropdown; logo thumbnails deferred).

## Open — needs action

**Implemented — awaiting orchestrator review (several already committed; review before further work):**
- **Task 625** — lands Q0R + 624 as one commit (`704a1912e`): `governance-pr.yml` `locale-leak` job step now `continue-on-error: true` (migration-window warn-only; script exit code / `check:locale-leak:mantine-only` unchanged, `rendered-proof`/`check:story-coverage` stay blocking); `scripts/mantine-migration-scope.json` completed to 6/6 (`FooterView.tsx` added). ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-19-task625-q0r-624-warnonly-landing.md`.
- **Task 613** — removed the DEAD `--z-*` Tailwind z-index token scale from `globals.css` (0 consumers grep-confirmed). ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-17-task613-dead-zindex-token-scale-cleanup.md`.
- **Task 621** — Homepage Agent-CTA → canonical Mantine `Button` (new island `AgentCtaButton.tsx`); owner visual QA found+fixed 3 defects (off-menu `size="lg"`, asymmetric icon padding, theme-wide `height:'auto'`-breaks-`inner`-centering fixed locally — possible sitewide Button follow-up). ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-17-task621-homepage-agent-cta-mantine-button-migration.md`.
- **Task 627** — authoritative `npm run lint` inventory (47 problems: 17 err/30 warn) + per-category remediation plan in `docs/sb10-lint-debt-inventory.md` (committed `967234ece`); no source touched. Task 628 reserved for the fix. ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-19-task627-sb10-lint-debt-triage.md`.
- **Task 629** — migrated `HeaderView.tsx` chrome to Mantine `Box/Group/Anchor/Text` (all `unstyled`, committed `9cc5ec5c8`). **Mid-task defect:** `@mantine/core/styles.css` is unlayered so its CSS silently beat the Tailwind classNames (contradicts `mantine-responsive-design-system.md §4` — recommend a Q0 doc-correction); fixed via `unstyled`, re-verified pixel-identical at 320–1440 × sq/uk, hydration id-parity 3/3, `screenshots:assert --mantine-only` 16/16 HeaderView pass. ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-19-task629-headerview-chrome-mantine-migration.md`.
- **Task 630** — migrated both homepage "view all" links (`page.tsx`, `FeaturedListings.tsx`) to Mantine `Button variant="transparent"` (§6a-link) via the shared `ViewAllLink.tsx` island (committed `68870a807`); `buttonVariants`/`cn` removed from both. Q3: 56/56 matrix + hover-no-fill + 48 screenshots + hydration 4/4. Kickoff evidence-path gap (`System/FeaturedListings` story never rendered `view_all`) → substituted a real `/{locale}` app-route capture. ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-19-task630-homepage-viewall-mantine-transparent-button.md`.

**Designed — not yet executed (AuthSheet company-field follow-ups, ordered):**
- **Task 641** — DRY-RUN-gated SQL migration (`scripts/task-641-*.sql`, owner-run in Supabase SQL editor): Section A read-only duplicate + FK-discovery report → Section B transaction-wrapped merge (re-point every FK incl. `users.company_id` to the earliest-`created_at` keeper, delete losers, verify 0 duplicates) → Section C normalized `UNIQUE INDEX companies (lower(btrim(name)))` (matches Task 640's check; activates its dormant `23505` fallback). Open owner decision: case/whitespace-only (default) vs `unaccent` (needs app follow-up). Executor authors the script only — no SQL run, no app-code change. Q4 (data-loss). Kickoff `tasks/kickoff_prompt_Task_641_Companies_Dedup_And_Unique_Index.md`. **Execute next.**
- **Task 642** — drop the `📷` emoji indicator from the company dropdown (`options` mapping). Real logo thumbnails deferred to a later canonical-`MantineCombobox` extension task. Not yet designed.

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

**Task numbering — last used: 643 (committed). 641 designed (kickoff saved, execute next); 642 planned.
622/623 not used as plain numbers — `Q0R`/`623R` are lettered task IDs outside the plain numeric sequence;
flagging for orchestrator reconciliation. 628 reserved for the SB10 lint-debt fix (Task 627's follow-up).
Next free: 644.**

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
