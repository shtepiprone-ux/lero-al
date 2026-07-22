# Project Backlog

> ⚠️ **HARD LIMIT: this file holds ACTIVE state only (~80 lines).** Historical ledger → [`docs/backlog-archive.md`](backlog-archive.md); full per-task detail → `docs/sessions/`.
> "Last Session" = 2–4 lines. When a task is reviewed/closed, move it to ONE row at the TOP of the archive ledger. See `docs/ai-behavior.md` → "Backlog & Session Log Rules".
> Reconciled against git history 2026-07-17 (`main` == `origin/main`): everything committed is pushed. The former per-task "pending owner run" narrative was stale (its detail already lives in the archive) and has been removed.

## Last Session (2026-07-22)

- **658 IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW.** `MantineListingCardPattern.tsx` (grid+list) +
  `ListingCard.tsx` container: full internal-chrome de-Tailwind → Mantine `Box`/`Group`/`Stack`/
  `Center`/`Text`, byte-identical rendering (documented className carve-outs retained per kickoff
  §2/§10). **Found+fixed a real cascade-layer regression:** the title's `group-hover:text-primary`
  went inert once migrated to Mantine `Text` (Mantine's own unlayered `color` rule always beats
  Tailwind's layered hover utility) — fixed via `group-hover:[--text-color:var(--primary)]`
  (targets the custom property Mantine's rule reads, no layer conflict), verified before/after via
  real Playwright hover. Also fixed 1 pre-existing stale test assertion (predates this task,
  contradicted already-shipped Task 656 behavior). `module.css` untouched; both canonical Stories
  re-verified with zero divergence (no edit needed). Evidence: `docs/sessions/2026-07-22-task658-listingcard-pattern-fullchrome-mantine-migration.md`
  — `screenshots:assert --mantine-only` 1005/1048 PASS/0 FAIL/43 AMBIGUOUS (zero involving this
  task's stories), regression suite 17/17 (+606/606 broader), `npm run build` exit 0.

- **657 IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW.** Homepage `FeaturedListings`/`LatestListings`: last raw-HTML (empty-state `<p>`, `CardSkeleton`/`RowSkeleton` `<div>` wrappers) → Mantine `Text`/`Box`; skeleton wrappers keep their exact Tailwind className (radius/border/bg have no matching Mantine token — Task 650-class mismatch, resolved by not translating). Both skeleton subcomponents now exported; `FeaturedListings.stories.tsx` gained `Loading`/`Empty`; new `LatestListings.stories.tsx` (`Default`/`LocaleStress`/`Loading`/`Empty`). Evidence: `docs/sessions/2026-07-22-task657-homepage-featuredlatest-emptyskeleton-mantine.md` (120-cell rendered matrix, computed-style parity, `npm run build` exit 0).

## Prior Session (2026-07-21)

- **651–654 ✅ APPROVED + COMMITTED → archived** (651 unlayered-CSS doc-correction; 652 hero §6c `SegmentedControl`+bar; 653 `FavoriteButton` → Mantine; 654 `SaveToCollectionButton` trigger → Mantine — the listing-detail action row now unifies at 44px; **Homepage render tree is now 100% Mantine**).
- **656 ✅ APPROVED WITH NOTES + COMMITTED → archived (`feat(Task656)` `1e1a06756`; supersedes 655).** Canonical Story-first listing-card foundation: new `MantineCopyIdButton` (owns clipboard/copied-state + styling) + truthful real-component `ListingCardPattern`/`ListingCard` stories (the ListingCard story statically imports the real production component) + production migration + `check:story-coverage` 7/7; the truthful Story also surfaced + fixed a latent Task-653 grid-favorite positioning defect. First task under the new clause-16c canonical-Story rule.
- **655 — RETIRED / VOID (incorrectly-created task, no code shipped).** Orchestrator task-design defect (ignored the canonical Story → Homepage-only local CSS hardcode); fully reverted + superseded by 656. Recorded in the archive as history; the `655` number is retired.

## Open — needs action

**Homepage → Mantine chrome migration ✅ COMPLETE** (A/646 · C/647 · B/648–649 · D/650 — all approved + archived); FavoriteButton (653) + SaveToCollectionButton trigger (654) close the last legacy-styled controls on that path.

**Deferred / on hold:**
- **Task 560** — admin suspension-as-date-range (DB/RLS/server action). Deferred.
- **Task 463** (Epic BB) — full admin report management. ON HOLD until the Mantine primitive library (Epic MM) is complete; must be rebuilt on finished primitives. Kickoff `tasks/Epics/Epic_BB_kickoff_prompt_Task_463_AdminReportFullManagement.md`.
- **Epic HH** — 310 (P4 content/settings routes), 311 (P5 modal standardisation, partial), 313 (P6 Verified Agents, blocked on owner DB-schema sign-off); 308/309 re-scope onto canonical primitives.
- **Task 453** (Epic KK.2) — remaining admin-manager freshness. Reserved.
- **SaveToCollection dialog → Mantine** (follow-up from Task 654) — the collections `Dialog`/`Input`/in-dialog `Button`s remain shadcn; a later task migrates them to a Mantine modal/`TextInput`.

## Pending Action Items (owner)

| Item | Notes |
|---|---|
| 🔐 Re-verify HIBP "leaked password protection" availability on Supabase Free tier (Auth → Password Security); enable now if available, else at Pro upgrade. | Security Advisor `auth_leaked_password_protection` WARN. `docs/integrations.md`. |
| 👁️ Eyeball-verify notification localization under `/sq` (data-only fix applied 2026-07-14; creation code already correct). | Re-open the bell under `/sq`. |
| 🐞 `/listings` Grid horizontal overflow <640px (FilterBar segmented `flex-1` + `min-w-35` Combobox push `scrollWidth` past the viewport at 320/375/390). Needs its own task. | Traced via DOM offender scan; out of Task 603 scope. |
| 🖋️ Verified Agents DB schema sign-off (Task 313) + verified-badge public visibility. | Epic HH blocker. |

**Task numbering — last used: 658 (IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW, not yet archived; 657 also IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW, not yet archived). 641 applied + closed; 642 closed (company-field cluster done). 644–654 + 656 all APPROVED + COMMITTED + archived (homepage → Mantine chrome migration COMPLETE; 651 doc-correction; 652 hero §6c; 653 FavoriteButton; 654 SaveToCollectionButton trigger; 656 listing-card canonical Story-first foundation `1e1a06756`). 655 RETIRED/VOID (incorrectly-created task, no code shipped — superseded+reverted by 656). 613/621/625/627/629/630 reviewed + committed + archived (2026-07-21 consolidation). Next free: 659. **Governance: `npm run build` exit 0 now mandatory for non-Q0 (`67340ff49`).**
622/623 not used as plain numbers — `Q0R`/`623R` are lettered task IDs outside the plain numeric sequence;
flagging for orchestrator reconciliation. 628 reserved for the SB10 lint-debt fix (Task 627's follow-up).**

## Reserved / deferred / retired

- Reserved: 310, 311, 313 (Epic HH), 453 (Epic KK.2).
- Deferred (no #): **I.3** listing-status helper API `(status) → (listing)` — see `docs/domain-rules.md` → "Future ListingStateMachine evolution trigger".
- Retired (never reuse): 465 (uk→ua migration, cancelled); 466/467/469–481 (legacy-primitive layout, superseded by the Mantine migration); 534 (superseded+closed by 535); 597/604 (superseded by 598/605); 655 (incorrectly-created task-design defect, no code shipped — superseded+reverted by 656).

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
