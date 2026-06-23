# Task 466 siblings — Bucket‑1 product-layout follow-ups (non‑LDV surfaces)

> **Origin:** Task 467 repaired the Storybook geometry/visual harness and emitted
> `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` → "Bucket 1: Hard defects".
> **Task 466** fixes the `ListingDetailView` surface ONLY (owner decision 2026-06-23). This register tracks the
> remaining **27 Bucket‑1 non-LDV story IDs** (27 sibling story surfaces across 13 grouped tasks), grouped by component into numbered sibling product-layout tasks.
>
> **Status:** REGISTER / RESERVED. Each row is a reserved task number with a concrete scope skeleton. Before any
> sibling is dispatched, the orchestrator expands it into a full Canonical-Template kickoff (Positive/Negative
> flows, mobile <640 gate, rendered matrix, AC-by-AC table, no-harness-weakening clause) — identical contract to
> Task 466. **Task 467 owner-native final rerun confirmed repaired harness; dispatch may proceed after these
> kickoff docs are committed; `screenshots:assert` is expected to exit 1 until product layout tasks are fixed.**

## Shared contract for EVERY sibling (carried into each expanded kickoff)

- **Source of scope:** the named story IDs below, as they appear in the committed‑tree harness run (re‑baseline first).
- **Pre-read:** rule-index "UI / layout / component" + "Storybook / visual snapshot" bundles (same list as Task 466);
  admin surfaces also add the "Admin table / admin control" bundle (`docs/component-governance.md` §11, `docs/domain-rules.md`, `docs/ai-behavior.md` Note 22).
- **Mobile <640 full-width gate** (agent-contract clause 11, design-system §26) — mandatory section.
- **Rendered verification matrix** (clause 12) — breakpoints × sq/en/uk/it, uk@320/375/390 mandatory stress cells.
- **🔴 No harness weakening** — no edit to `scripts/check-stories-rendered.mjs`, `scripts/geometry-integrity.mjs`,
  thresholds, allowlists, or fixtures-to-hide-content. Genuine harness false positives are reported back as Task 467
  follow-ups, never allowlisted in a product task.
- **AC-by-AC validation table** in the session log; gates green (tsc=0, lint=0, check:stories, check:i18n, file-integrity).
- **Per-task acceptance:** the named story IDs report **0 Bucket‑1 hard defects** in a full `screenshots:assert`
  run on the committed tree; no control removed; no desktop (≥1024) regression. Other surfaces remaining red does
  not block the task.
- **Scope isolation:** each sibling touches only its component tree + locale files; no cross-surface drive-by.

## Reconciliation note (for the orchestrator before dispatch)

The inventory enumerates **30 Bucket-1 story surfaces** (3 LDV fixed under Task 466; 27 non-LDV = this register).
Total Bucket-1 product-defect cells: **422** (96 LDV + 326 sibling cells across the register below).

The summary FAIL counter reports **758** — that figure includes **336 planted-fixture cells** (6 planted stories
× 56 cells each: `Planted/ClippedButtonText`, `Planted/OverlappingActions`, `Planted/OffViewportControl`,
`Planted/ContainerClipped`, `Planted/ContainerEscape`, `Planted/UnstyledFrame`) which prove harness liveness and
are **not product defects**. These planted cells are listed in the inventory's "Planted violation stories" section
and must not be tasked or allowlisted. The **422 Bucket-1 cells** are the complete product-fix scope.

The per-story cell counts below are taken directly from the Bucket-1 rows of the owner-native run
(2026-06-23T08-44). Re-run the committed-tree harness and verify these counts before expanding each kickoff.

## Sibling task register (grouped by component/surface)

| Task | Surface / component | Story IDs (Bucket‑1) | Cells | Dominant defect reason(s) | Notes |
|---|---|---|---|---|---|
| **469** | `AdminReportsManager` (admin) | `--full-management` (28), `--delete-confirm` (20), `--terminal-reopen` (9), `--dialog-owner-row` (9) | 66 | text-clipped / element-overlap / bottomsheet-overflow (spans mobile→desktop-1024 + canonical-560/680) | Largest sibling. Touches the Task 463 surface — coordinate with 463 status before dispatch. |
| **470** | Notifications (`NotificationCenter`, `NotificationItem`) | `notificationcenter--default` (20), `notificationcenter--mobile-bottom-sheet` (20), `notificationitem--all-cases` (12) | 52 | text-clipped + offscreen-control ("Mark all as read") at mobile/canonical-560 | "Позначити всі як прочитані" / long-locale CTA clipped + offscreen; ties to Task 424 bottom-sheet work. |
| **471** | `AdminSidebar` (admin) | `--mobile-drawer-open` (20), `--locale-stress` (12) | 32 | bottomsheet-overflow (Footer / Налаштування сайту / Дозволи items overflow drawer) | Mobile drawer item list overflows the sheet at 320–560. |
| **472** | `AdminListingsTable` (admin) | `--default` (20) | 20 | text-clipped on listing-title buttons | Occurs at **desktop-1024→huge-2560** (NOT mobile) — table cell title truncation; verify it is a real clip vs intended ellipsis before fixing. |
| **473** | `AdminLayout` (system) | `--admin-table-wrapper` (12), `--admin-loading-state` (12) | 24 | mobile 320/375/390 layout overflow | Wrapper + loading state at mobile only. |
| **474** | `Skeleton` (primitives) | `skeleton--listing-grid-skeleton` (12), `skeleton--admin-card-skeleton` (12) | 24 | mobile 320/375/390 overflow | Loading skeletons overflow at narrow viewports. |
| **475** | `AdminSupportManager` (admin) | `--default` (12), `--locale-stress` (12) | 24 | text-clipped on `[role="button"]` ticket rows at mobile 320/375/390 | Long ticket-subject buttons clip. |
| **476** | Admin form-dialog bottom sheets | `adminexchangeprovidersmanager--form-dialog-mobile-bottom-sheet` (12), `admincurrenciesmanager--form-dialog-mobile-bottom-sheet` (12) | 24 | mobile bottom-sheet form overflow 320/375/390 | Shared form-dialog pattern — likely one root fix applies to both. |
| **477** | `AdminCardList` (admin) | `--loading` (12) | 12 | mobile 320/375/390 loading overflow | |
| **478** | `Select` + `Combobox` (overlay primitives) | `select--long-label-locale-stress` (12), `combobox--long-label-locale-stress` (7) | 19 | long-label overflow / trigger+popup at mobile 320/375/390 | Canonical overlay primitives — fix must not diverge the single source. |
| **479** | `Input` + `PasswordInput` (form primitives) | `input--phone-numeric-validation` (4), `input--locale-placeholders` (4), `passwordinput--with-hint-idle` (4), `passwordinput--with-hint-all-rules-met` (4) | 16 | mobile-320 overflow / hint + placeholder layout | All at 320 only. |
| **480** | `Button` (primitive) | `button--with-icon` (12) | 12 | mobile 320/375/390 icon+label layout | Touches the canonical `Button` — high blast radius; verify no consumer regression. |
| **481** | `ListingFormShellView` (listing form) | `listings-listingformshellview--staff` (1) | 1 | blank-canvas at mobile-390 × sq | Single failing cell; blank-canvas defect — confirm whether content is locale-conditional or form-state-dependent before fixing. |

**13 sibling tasks reserved: 469–481.** (LDV = Task 466, separate.)

## Sequencing guidance (orchestrator)

1. Task 467 committed and owner-native final rerun (2026-06-23T08-44) confirmed the repaired harness; dispatch proceeds after kickoff docs are committed.
2. Task 466 (LDV) first — it is the named P0 blocker surface.
3. Then siblings, suggested order by blast radius / leverage: primitives that many surfaces inherit first
   (**480 Button**, **478 Select/Combobox**, **474 Skeleton**, **479 Input/PasswordInput**), since fixing a
   primitive may auto-resolve downstream admin cells; then admin composites (**469, 471, 475, 476, 477, 473, 472**)
   and **470 Notifications**; then **481 ListingFormShellView** (single isolated cell). Re-run the harness after
   each primitive fix to drop any cells it incidentally clears before expanding the next admin kickoff.
4. The Task 464 / Task 467 "green baseline restored" milestone is reached only when LDV (466) AND all siblings
   (469–481) report 0 Bucket‑1 hard defects on the committed tree.
