# Project Backlog

> ⚠️ **HARD LIMIT: this file holds ACTIVE state only (~80 lines).** Historical ledger → [`docs/backlog-archive.md`](backlog-archive.md); full per-task detail → `docs/sessions/`.
> "Last Session" = 2–4 lines. When a task is reviewed/closed, move it to ONE row at the TOP of the archive ledger. See `docs/ai-behavior.md` → "Backlog & Session Log Rules".
> Reconciled against git history 2026-07-17 (`main` == `origin/main`): everything committed is pushed. The former per-task "pending owner run" narrative was stale (its detail already lives in the archive) and has been removed.

## Last Session (2026-07-20)

- **AuthSheet Mantine migration COMPLETE (633–638)** + **company-field cluster COMPLETE (639–643:** refetch-after-create, dup-detect+Select, admin dup-guard, DB UNIQUE index, emoji removal**)** + **ViewAllLink/locale-leak (631–632, 626)** — all ✅ APPROVED/APPROVED WITH NOTES + committed → archive.

## Open — needs action

**Implemented — awaiting orchestrator review (several already committed; review before further work):**
- **Task 625** — lands Q0R + 624 as one commit (`704a1912e`): `governance-pr.yml` `locale-leak` job step now `continue-on-error: true` (migration-window warn-only; script exit code / `check:locale-leak:mantine-only` unchanged, `rendered-proof`/`check:story-coverage` stay blocking); `scripts/mantine-migration-scope.json` completed to 6/6 (`FooterView.tsx` added). ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-19-task625-q0r-624-warnonly-landing.md`.
- **Task 613** — removed the DEAD `--z-*` Tailwind z-index token scale from `globals.css` (0 consumers grep-confirmed). ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-17-task613-dead-zindex-token-scale-cleanup.md`.
- **Task 621** — Homepage Agent-CTA → canonical Mantine `Button` (new island `AgentCtaButton.tsx`); owner visual QA found+fixed 3 defects (off-menu `size="lg"`, asymmetric icon padding, theme-wide `height:'auto'`-breaks-`inner`-centering fixed locally — possible sitewide Button follow-up). ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-17-task621-homepage-agent-cta-mantine-button-migration.md`.
- **Task 627** — authoritative `npm run lint` inventory (47 problems: 17 err/30 warn) + per-category remediation plan in `docs/sb10-lint-debt-inventory.md` (committed `967234ece`); no source touched. Task 628 reserved for the fix. ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-19-task627-sb10-lint-debt-triage.md`.
- **Task 629** — migrated `HeaderView.tsx` chrome to Mantine `Box/Group/Anchor/Text` (all `unstyled`, committed `9cc5ec5c8`). **Mid-task defect:** `@mantine/core/styles.css` is unlayered so its CSS silently beat the Tailwind classNames (contradicts `mantine-responsive-design-system.md §4` — recommend a Q0 doc-correction); fixed via `unstyled`, re-verified pixel-identical at 320–1440 × sq/uk, hydration id-parity 3/3, `screenshots:assert --mantine-only` 16/16 HeaderView pass. ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-19-task629-headerview-chrome-mantine-migration.md`.
- **Task 630** — migrated both homepage "view all" links (`page.tsx`, `FeaturedListings.tsx`) to Mantine `Button variant="transparent"` (§6a-link) via the shared `ViewAllLink.tsx` island (committed `68870a807`); `buttonVariants`/`cn` removed from both. Q3: 56/56 matrix + hover-no-fill + 48 screenshots + hydration 4/4. Kickoff evidence-path gap (`System/FeaturedListings` story never rendered `view_all`) → substituted a real `/{locale}` app-route capture. ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-19-task630-homepage-viewall-mantine-transparent-button.md`.
- **Task 652** — hero §6c unification: Продаж/Оренда tabs → canonical §6c `SegmentedControl` (fullWidth in a `w={{base:'100%',sm:'fit-content'}}` wrapper, 50/50 mobile / content-width desktop), flush (0px, `styles.root` bottom-radius/border-width 0) on the gray search bar (`bg="gray.1"` + `bd` gray-2 border, `shadow-xl` removed) — Mantine props/`styles`, not Tailwind, per the unlayered-CSS rule (Tasks 650/651). Mobile Search now full-width own row (`basis-full` base). Computed-style + 24-cell (4 locale × 6 width) rendered proof: gray-1/gray-2/flush confirmed, 0px gap all cells; interaction-tested (segment switch + Search → `/en/listings?type=sale`). **Revision 1 (R8, 2026-07-21):** bar radius `2xl`→canonical `lg` (8px, matches SegmentedControl); literal `rounded-b-lg` instruction verified via computed style to render **12px** (this project's `globals.css` `@theme` overrides Tailwind's `lg` to the legacy shadcn `--radius` = 0.75rem, a different token than Mantine's `theme.radius.lg`=8px) — corrected to `rounded-b-[var(--mantine-radius-lg)]` (stays a Tailwind class per R8's own constraint), verified `8px` exactly, asymmetric pattern preserved. All 5 gates re-run green, `npm run build` exit 0, re-captured uk@320 + desktop. ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-20-task652-herosearch-unified-6c-segmentedcontrol-bar.md`.
- **Task 653** — `FavoriteButton` legacy shadcn `Button` → Mantine `ActionIcon` (icon shape)/`Button` (pill shape), last legacy control on the Homepage render tree. State machine/a11y byte-identical; 3-state colors + 2 `:hover` transitions moved to a new `FavoriteButton.module.css` (real-browser verified, all values match traced tokens incl. favorited=`brand.9`/`#8E322B`). **Real bug found+fixed:** an inline `style` reliably beat Mantine's own unlayered CSS at rest but ALSO permanently blocked `:hover` (inline always wins over any external stylesheet rule) — fixed by moving resting colors into the CSS module too, keyed off `data-favorited`/`data-fav-disabled`/`data-pending`. **Two flagged deviations:** (1) pill height renders 44px not the legacy sibling's 36px — `theme.ts`'s Button `styles.root` sets `minHeight:2.75rem` unconditionally (P0 touch-target, not mobile-scoped), not overridden; radius/border DO match exactly. (2) kickoff's premise that the `ListingCardPattern` story renders "the real FavoriteButton" is wrong (renders a `DemoFavoriteButton` stand-in) — real evidence substituted via a temporary, deleted dev route + `ListingCard.smoke.test.tsx` (13/13 + planted-violation). Both vitest suites 27/27, all gates + `npm run build` exit 0. ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-21-task653-favoritebutton-mantine-migration.md`.
- **Task 654** — `SaveToCollectionButton` trigger: legacy shadcn `Button` → Mantine `ActionIcon` (icon shape, `FavoritesShell.tsx` card overlay)/`Button` (default pill, `ListingContact.tsx` row), mirroring Task 653's exact pill props (`radius="1.125rem"` `bd="1px solid var(--border)"`) so the action row's favorite+save pills unify at 44px/18px-radius/matching-border — real-browser confirmed identical on both. Dialog/Input/in-dialog Buttons untouched. **New:** `SaveToCollectionButton.module.css` reproduces the icon shape's `bg-card/80`→white-hover/`rounded-lg`(8px) chrome that `FavoritesShell.tsx`'s passed Tailwind className would otherwise lose (Mantine's own unlayered CSS beats it) — same technique as `FavoriteButton.module.css`. **Flagged (non-blocking) deviation:** the two pills' *background* differs at the CSS level (favorite pill: `rgba(255,255,255,.8)` via its own CSS module; save pill: solid `rgb(255,255,255)` via Mantine's plain `variant="default"`, no CSS module needed) — visually indistinguishable on the page's white background; R1/R2's named dimensions (height/radius/border) match exactly. All gates + `npm run build` exit 0 (verified twice, before and after temp-evidence cleanup). **Revision 1 (2026-07-21, orchestrator-flagged):** icon `radius="lg"` (Mantine theme token, 8px) ≠ legacy `rounded-lg` (this project's `globals.css` `--radius-lg`=`--radius`=0.75rem=12px, same Task-652/R8 trap) — corrected to `radius="0.75rem"`, comment fixed, real-browser re-verified `border-radius:12px`, all gates + build re-run exit 0. ✅ IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW. Session: `docs/sessions/2026-07-21-task654-savetocollection-trigger-mantine.md`.

**Homepage → Mantine chrome migration ✅ COMPLETE** (A/646 · C/647 · B/648–649 · D/650 — all approved + archived); FavoriteButton (653) closes the last legacy-styled control.

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

**Task numbering — last used: 654. 641 applied + closed; 642 closed (company-field cluster done). 644–650 approved (homepage → Mantine chrome migration COMPLETE). 651 doc-correction IMPLEMENTED - AWAITING REVIEW, **still uncommitted** (verified via `git log -- docs/mantine-responsive-design-system.md`: no commit past the pre-existing governance-docs commit touches the file). 652 (hero §6c unification + R8 radius revision) + 653 (FavoriteButton Mantine migration) + 654 (SaveToCollectionButton trigger Mantine migration) IMPLEMENTED - AWAITING REVIEW. Next free: 655. **Governance: `npm run build` exit 0 now mandatory for non-Q0 (`67340ff49`).**
622/623 not used as plain numbers — `Q0R`/`623R` are lettered task IDs outside the plain numeric sequence;
flagging for orchestrator reconciliation. 628 reserved for the SB10 lint-debt fix (Task 627's follow-up).**

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
