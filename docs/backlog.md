# Project Backlog

> ⚠️ **HARD LIMIT: this file holds ACTIVE state only (~80 lines).** Historical ledger → [`docs/backlog-archive.md`](backlog-archive.md); full per-task detail → `docs/sessions/`.
> "Last Session" = 2–4 lines. When a task is reviewed/closed, move it to ONE row at the TOP of the archive ledger. See `docs/ai-behavior.md` → "Backlog & Session Log Rules".
> Reconciled against git history 2026-07-17 (`main` == `origin/main`): everything committed is pushed. The former per-task "pending owner run" narrative was stale (its detail already lives in the archive) and has been removed.

## Last Session (2026-07-23)

- **663 — IMPLEMENTED, AWAITING ORCHESTRATOR REVIEW.** `geometry-integrity.mjs` Check 4 cross-overlay-boundary branch now downgrades to a silent PASS only when a real, verified `.mantine-Overlay-root` backdrop covers the background element (new `isBackgroundCoveredByOverlayBackdrop`); otherwise unchanged `ambiguous-overlap`. Two new planted fixtures (`OverlayBackdropCovered`/`OverlayNoBackdrop`) + `ASSERT_STORIES` registration; OLD/NEW proof shows `OverlappingActions`/`ScrollVisibleOverlap`/`OverlayNoBackdrop` byte-identical (non-weakening), `OverlayBackdropCovered` flips ambiguous→pass. Full `--mantine-only`: backdrop-reason ambiguous rows 25→4 (Combobox/RangeDatePicker/NotificationBellView), `0 FAIL` both before/after, +21 passes = −21 ambiguous exactly. **Finding (out of scope, flagged for follow-up):** `AmbiguousOverlap` fixture's verdict is unaffected by this diff but was already silently broken pre-existing (Task-611 containment-guard interaction) — see session log §5.3. `tsc`/build/`check:stories`/file-integrity/mojibake all pass. Session log: `docs/sessions/2026-07-23-task663-harness-backdrop-overlap-downgrade.md`.
- **662 — IMPLEMENTED, AWAITING ORCHESTRATOR REVIEW.** New canonical `MantineHomeSection` (CSS-module tokenized vertical rhythm 48/64/80px + `muted`/`brandFade` background) replaces the 4 homepage Tailwind band wrappers (`py-12 md:py-16 2xl:py-20`, `bg-muted/30`, `bg-gradient-to-br from-primary/10 to-primary/5`); live before/after computed-style capture on the real app route found **0/700 diffs** at 375/768/1440/1536/1920 × sq/en/uk/it. `Patterns/Mantine/HomeSection` story + `mantine-migration-scope.json` registration; `check:story-coverage` 8/8; `tsc`/build/`screenshots:assert --mantine-only` (full) all pass. Session log: `docs/sessions/2026-07-23-task662-mantine-home-section-tokenized-band.md`.
- **661 — IMPLEMENTED, AWAITING ORCHESTRATOR REVIEW.** Single-source brand color: new `src/design-system/brand.ts` (canonical tuple, `theme.ts` imports it); `globals.css` `--brand-*` now alias `var(--mantine-color-brand-*)` (light+dark), so `--primary`/CSS-var brand surfaces render true `#EC5447` (was `#D25656` drift, closes 660's open decision); `--brand-850` deleted (zero consumers), `--brand-950` kept hand-authored (non-tuple, documented); emails (`BaseEmail.tsx`, `auth-email-hook/route.ts`, `contactInquiry.ts`, + 3 files found beyond task scope: `listingInquiry.ts`/`emailChange.ts`/`sendTemplatedEmail.ts`) now import the constant instead of hardcoding hex. `tsc`/build/screenshots:assert/i18n/mojibake/stories all pass. Session log: `docs/sessions/2026-07-23-task661-single-source-brand-color.md`.

## Prior Session (2026-07-22)

- **657 / 658 / 659 / 660 ✅ APPROVED + COMMITTED → archived** (orchestrator reviews 2026-07-22): 657 homepage `FeaturedListings`/`LatestListings` empty-state + skeleton wrappers → Mantine `Text`/`Box`; 658 `MantineListingCardPattern`+`ListingCard` internal-chrome de-Tailwind (+ found/fixed a real `group-hover` cascade-layer regression); 659 homepage route shell de-Tailwind + hero gradient → **solid `--primary` coral** (subtitle bumped to clear AA-large); 660 (Q0) brand-color **drift audit** — CSS `--brand-*` render `#D25656`-family, NOT the declared `#EC5447` that Mantine `brand[7]` still renders. Detail → archive ledger.

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

**Task numbering — last used: 661 (implemented, awaiting review — see Last Session).** 641 applied + closed; 642 closed (company-field cluster done). 644–654 + 656 all APPROVED + COMMITTED + archived (homepage → Mantine chrome migration COMPLETE; 651 doc-correction; 652 hero §6c; 653 FavoriteButton; 654 SaveToCollectionButton trigger; 656 listing-card canonical Story-first foundation `1e1a06756`). **657/658/659/660 APPROVED + COMMITTED + archived (2026-07-22 consolidation): 657 homepage empty/skeleton→Mantine (`25447868f`); 658 listing-card internal chrome (`c7329139d`); 659 homepage shell + solid-coral hero (`6efce9069`); 660 brand-color drift audit (`e9f2af416`) → pending oklch-correction owner decision.** 655 RETIRED/VOID (incorrectly-created task, no code shipped — superseded+reverted by 656). 613/621/625/627/629/630 reviewed + committed + archived (2026-07-21 consolidation). Next free: 661. **Governance: `npm run build` exit 0 now mandatory for non-Q0 (`67340ff49`).**
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
