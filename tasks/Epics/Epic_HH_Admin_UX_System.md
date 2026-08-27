# Epic HH — Admin UX System (canonical admin layout, filters, tables, modals, narrow-breakpoint recovery, Verified Agents workflow)

> **Owner:** Opus 4.8 orchestrator (planning); Sonnet 4.6 (per-phase execution after kickoff approval).
> **Status:** FORMED 2026-05-30 (owner directive after Task 296 narrow-breakpoint browser verification + broader admin UX review).
> **Owner gate:** No Sonnet implementation work proceeds past Phase 1 until owner reviews + approves the canonical specs produced in Phase 1.

## Why this Epic exists

During owner browser verification of Task 296 (Tailwind entropy MEDIUM audit + canonical TabButton extraction), the diff itself was byte-identical at the className level (verified at 768/1280/1440/2560), but owner browser inspection at 320/375/390 surfaced pre-existing admin mobile debt: tab labels clipped, header/action buttons overflowing, segmented-tab containers not wrapping. Task 296 was correctly approved on diff and a follow-up filed (Task 301), but the broader pattern owner observed across many admin pages cannot be fixed by one narrow tab-bar tweak.

Owner directive 2026-05-30: form a dedicated **Admin UX System Epic** that handles, as one coordinated architectural workstream:

1. **Layout consistency** — admin tables / card lists have inconsistent widths, wrappers, container constraints, header/action rows, spacing.
2. **Filter consistency** — segmented tabs / button filters / search / combobox/select are mixed without a canonical rule for when to use which. Some pages have too many visible filter buttons; some should become combobox.
3. **Sortable columns** — most admin tables have no column sorting. Each column should either be sortable or be documented as intentionally non-sortable.
4. **Row click / action models** — inline row actions, status switchers, dropdown menus, row-click-to-open-detail are mixed inconsistently across admin tables.
5. **Modal / dialog / popover quality** — inconsistent widths, artifacts, action footers, mobile behaviour, status badges, accessibility.
6. **Narrow breakpoint behaviour (320/375/390)** — admin currently has no canonical mobile model. Some surfaces clip, some scroll without an affordance, some workflow pages would work better as card rows.
7. **Verified Agents workflow** — currently exposed as a one-click action in the users table; owner wants a real workflow (states: not_verified / pending_review / verified / rejected / revoked) anchored on the user profile page's right-side Actions panel, not on the users table.

This Epic is **architecture and migration**, not a single refactor. It is split into safe, reviewable phases with an owner approval gate after the audit phase.

## Out of scope for this Epic

- Public site responsive recovery — separate work (see `Epic_JJ_Public_Site_Responsive_System.md` once formed; not part of HH).
- Global i18n hardening — separate work (see `Epic_II_Global_i18n_Hardening.md`).
- Site-wide modal/dialog audit beyond admin — Phase 5 may extend to public modals only with explicit owner approval.
- DB schema changes for Verified Agents workflow — Phase 6 task; needs explicit owner approval before any DB migration is drafted.
- Replacing existing admin functionality with simplified versions ("cleaner is better") — Notes 19 / 20 / 22 / 23 still apply: every existing admin control either remains, moves to a documented new entry point, or is explicitly authorised for removal in the kickoff.

## Phases

### Phase 0 — Critical runtime stability (Sprint 21, already split out)

Tasks: **300** (Admin Support i18n missing keys hotfix — CRITICAL) + **301** (Admin segmented-tab narrow-breakpoint fix — MEDIUM, Task-296-exposed) + **302** (Footer Admin source-of-truth backfill — HIGH).

These are NOT Phase 1+ Epic work — they are pre-existing critical bugs that must ship before broader Admin UX System work begins. They are sequenced in Sprint 21 with full Sonnet-ready kickoffs.

After Phase 0 ships, the Epic transitions to Phase 1.

### Phase 1 — Admin UX audit + canonical spec (AUDIT-ONLY, no implementation code)

**Task 303 — Admin responsive audit + canonical narrow-breakpoint decision** (audit/spec only)

- Inventory every admin route + its top-level component(s) — see "Admin route inventory" below.
- For each route, classify current narrow-breakpoint (320/375/390) behaviour: usable / controlled scroll / uncontrolled clipping / table-too-wide-no-fallback / filters-too-dense / header-clip / modal-overflow / raw-i18n-key.
- Recommend ONE canonical narrow-breakpoint model. Options to evaluate:
  - A: Mobile card-row fallback for admin tables below `md:`.
  - B: Controlled horizontal table scroll with sticky first column / header, no clipping, visible scroll affordance.
  - C: Hybrid — card-row for workflow surfaces (Tickets / Inquiries / Reports), controlled scroll for data-dense reference tables (Listings / Users / Locations).
  - D: "Admin desktop recommended" banner below `md:` PLUS controlled scroll for all tables (owner-approval required).
- Produce `docs/admin-ux-rules.md` (NEW) capturing the canonical decision + per-page narrow-breakpoint policy.
- Produce `docs/governance-reports/2026-XX-XX-admin-responsive-audit.md` (NEW) with the per-page classification matrix.
- Owner approval gate: Phase 2+ blocked until owner signs off on the chosen narrow-breakpoint model.

**Task 304 — Admin filter / sort / row-action canonical spec** (audit/spec only)

- Inventory every admin filter currently in production — see "Admin filter inventory" below + `docs/governance-reports/2026-05-30-admin-filter-triage-evaluation.md` (Task 299, already done).
- Define canonical rules:
  - When to use segmented tabs (≤3 mutually exclusive scopes).
  - When to use combobox/select (≥4 options OR when the option list is long-tail).
  - When to use search input.
  - When to use date range.
  - When active filter count = badge.
  - How to reset filters (single global reset, see Task 229 precedent).
  - How filters propagate to URL state (admin currently mixes URL-state and local-state — pick one rule per surface).
- Define canonical sort rules: which column types are sortable (date, text, numeric, status badge), which are intentionally non-sortable (action column, badge-only display).
- Define canonical row-click / row-action model: when does a row click open detail vs. expose inline action? What goes in a row-action dropdown vs. a primary row button?
- Produce `docs/admin-ux-rules.md` (extend with new sections) + `docs/governance-reports/2026-XX-XX-admin-filter-and-sort-audit.md`.
- Owner approval gate: Phase 3+ blocked until owner signs off on canonical filter / sort / row-action rules.

**Task 305 — Modal / dialog / popover / sheet canonical spec** (audit/spec only)

- Inventory every modal / dialog / popover / sheet on admin pages (and optionally public pages if owner adds them to scope).
- Classify: width tier, title style, content layout, footer action style, destructive action style, scroll behaviour, mobile fallback, accessibility (focus trap, escape, backdrop click), status badge placement, copy alignment.
- Define canonical modal width tiers (sm / md / lg / xl), action footer pattern, destructive-action confirmation pattern, mobile fallback rule (Sheet vs Dialog vs full-screen page).
- Produce `docs/admin-ux-rules.md` (extend with modal section) + `docs/governance-reports/2026-XX-XX-admin-modal-audit.md`.
- Owner approval gate: Phase 5 blocked until signed off.

### Phase 2 — Canonical admin primitives (component foundation)

**Task 306 — AdminPageShell / AdminHeader / AdminFilterBar primitives**

- Implement (or formalise existing) `AdminPageShell`, `AdminHeader`, `AdminFilterBar` shared components based on Phase 1 specs.
- Migrate ONE pilot page (recommend `/admin/listings` since it already has many primitive patterns) to the new shell.
- Do NOT migrate other pages in this task — that is Phase 3+.
- Locales: sq/en/uk/it. Breakpoints: 320/375/390/768/1280/1440/2560.

**Task 307 — AdminTable / AdminCardList responsive primitive**

- Implement canonical table wrapper + card-row primitive based on Phase 1 (Task 303) decision.
- Sortable column primitive (sort indicator, click-to-sort, URL-state).
- Empty / loading / error state primitive.
- Migrate ONE pilot table (recommend `/admin/listings` to compose with Task 306 pilot).
- Locales / breakpoints: as above.

### Phase 3 — Apply canonical model to core admin pages

**Task 308 — Admin Users + Admin Listings narrow-breakpoint recovery (direct Task 296 follow-up beyond Task 301)**

- Migrate Users + Listings tables to AdminPageShell + AdminTable per canonical spec.
- Verifies the Phase 2 primitives end-to-end on two high-traffic surfaces.

**Task 309 — Internal Tickets + Support Inbox + Sales Inbox + Reports**

- Migrate workflow surfaces to canonical model.
- AdminFilterBar simplification (reduce visible filter buttons; promote combobox where Phase 1 spec dictates).

### Phase 4 — Apply canonical model to content / settings admin pages

**Task 310 — Locations / Popular Locations / Companies / Legal / Property Types / Currency / Email Templates / Footer / Settings / Permissions**

- Migrate to canonical AdminPageShell + AdminTable / AdminCardList.
- Each sub-page may need its own kickoff inside this task or a per-page split — orchestrator decides at the time based on per-page complexity.

### Phase 5 — Modal / dialog standardisation

**Task 311 — Admin modal / dialog / popover migration to canonical pattern**

- Apply Phase 1 Task 305 canonical modal spec to every admin modal.
- Fix visual artefacts.
- Standardise destructive-action confirmation, action footer, mobile fallback.

(Optional Task 312 — extend to public-site modals only if owner explicitly scopes it in.)

### Phase 6 — Product workflows

**Task 313 — Verified Agents workflow**

- Owner directive: verification action MOVES from Users table to user profile right-side Actions panel.
- States: `not_verified` → `pending_review` → `verified` / `rejected` → `revoked` (with reopen-review from rejected / revoked).
- Each action: admin confirmation modal + reason/note (required for reject / revoke) + audit trail (who, when, prior state, new state, note).
- Users table: badge + filter by verification status + row click opens profile (NO primary verify action in table).
- Verified Agents tab: read filtered list with badge + filter; click row → profile page (action happens there).
- DB schema change required — needs explicit owner approval BEFORE implementation kickoff. Recommended schema: `user_verification_events` table (id, user_id, prior_state, new_state, reason, actor_id, created_at) + `users.verification_state` enum column. Public site shows "Verified" badge only if `verification_state = 'verified'`.
- Phase 6 is product/workflow; Notes 21 (Control Relocation Rule) applies — moving the action is allowed but the new editable location must ship in the same task.

(Optional future task — Internal Tickets workflow refinements based on canonical action model, number TBD after Task 325.)
(Optional future task — Reports moderation workflow, number TBD after Task 325.)

## Owner evidence — 2026-05-30 browser QA (primary input for Task 303)

Owner performed browser QA after Task 301's tab-container narrow-patch and captured screenshots showing admin mobile UX is unacceptable across the following surfaces at 320/375/390:

| Surface | Observed failure |
|---------|-----------------|
| Admin Dashboard | Visually broken: narrow columns, broken labels, poor grid, unreadable KPI cards |
| Admin Users | Squeezed table, records don't read as separate items |
| Admin Support (Internal Tickets) | Poor row separation; rows need divider/spacing/card blocks |
| Admin Support Inbox / Sales Inbox | Same row-separation issue; overflow clipping |
| Admin Locations / Legal / Property Types | Inconsistent mobile patterns (some cards, some clipped tables) |
| Admin Email Templates | Mixed/incorrect localization visible at narrow width; parity checks did not catch semantic locale errors |
| Admin Footer / Settings | Squeezed controls |
| All header/action rows | Button groups clip at 320px across all admin pages |

**Task 303 must use these screenshots as owner evidence.** The audit must not be abstract — it must:
1. Produce a per-route mobile failure matrix (routes as rows, failure modes as columns)
2. Classify EACH route's current 320/375/390 state: usable / controlled-scroll / uncontrolled-clip / broken-layout / table-too-wide / header-clip / raw-i18n / etc.
3. Propose a concrete canonical narrow-breakpoint model with before/after mockups or narrative
4. The per-route matrix is the primary owner sign-off artifact — owner will not approve an abstract rule without seeing the route-by-route assessment

**Note on Email Templates localization:** The mixed/incorrect localization observed at narrow widths suggests the Email Templates surface may have semantic locale errors that passed `check:i18n` parity (same keys, wrong values). This is an Epic II (Global i18n Hardening) cross-concern. Task 303 should flag this route for Epic II Task 316+ triage.

## Admin route inventory (for Phase 1 Task 303 audit)

- `/admin` — dashboard (KPI cards + recent listings)
- `/admin/listings` — listings table (sort, filter, status switcher)
- `/admin/users` — users table (role filter, status filter, verified-agents tab)
- `/admin/users/[id]` — user profile edit
- `/admin/support` — internal tickets table (status filter, type filter — needs Task 300 i18n fix first)
- `/admin/inquiries/support` — support inbox (mailbox scope)
- `/admin/inquiries/sales` — sales inbox
- `/admin/reports` — listing reports moderation
- `/admin/locations` — locations CRUD
- `/admin/popular-locations` — popular locations promotion
- `/admin/companies` — companies (agencies)
- `/admin/legal` — legal pages CRUD
- `/admin/property-types` — property types CRUD
- `/admin/currency` — exchange-rate providers + currency catalog
- `/admin/email-templates` — email templates CRUD
- `/admin/footer` — footer admin (Task 247 / 302)
- `/admin/settings` — site settings
- `/admin/permissions` — role permissions matrix (Task 250)
- `/admin/pages-admin` — if active (verify in Phase 1 inventory)

## Admin filter inventory baseline

See `docs/governance-reports/2026-05-30-admin-filter-triage-evaluation.md` (Task 299, complete 2026-05-30). The 8-filter evaluation across AdminInquiriesManager / AdminReportsManager / AdminSupportManager / AdminListingsTable / AdminUsersTable is the starting point for Task 304's broader audit.

## Dependencies / sequencing rules

- **Phase 0 MUST ship before Phase 1+** (no architecture work on top of CRITICAL runtime bugs).
- **Phase 1 owner approval gate is binding** — no Phase 2 implementation begins until owner signs off on the chosen narrow-breakpoint model + filter/sort/row-action canonical rules + modal canonical rules.
- **Phase 2 primitives MUST ship before Phase 3+ migrations** (no page migration on top of unstable primitives).
- **Phase 3 migrates core/high-traffic pages first** (Users / Listings) — discovery of primitive gaps loops back to Phase 2.
- **Phase 4 migrates content/settings pages** in batches; each batch is its own kickoff with explicit scope.
- **Phase 5 modal standardisation can run in parallel with Phase 3/4** once Phase 1 Task 305 ships.
- **Phase 6 (Verified Agents workflow) is INDEPENDENT** of Phase 2-5 mechanics — it is a product feature on top of the user-profile surface. It can ship anytime after Phase 0 + an owner-approved DB schema design.

## Universal task rules (every Sonnet kickoff under this Epic)

- Pre-read: `docs/agent-contract.md`, `docs/backlog.md`, `docs/orchestrator-role.md` excerpt, `docs/admin-ux-rules.md` (once Phase 1 produces it), task-type-specific docs per `docs/rule-index.md`.
- Locale coverage: sq / en / uk / it — all 4 verified at runtime, never just `uk` as proxy.
- Breakpoint coverage: 320 / 375 / 390 / 768 / 1280 / 1440 / 2560 — all 7, narrow-3 cannot be skipped as "admin is desktop-first" until Phase 1 explicitly defines that as the canonical policy.
- Self-validation block (Note 18), UX flow trace (Note 19), control inventory (Note 20), admin table preservation (Note 22), edit-flow preservation (Note 23).
- Files Changed table per Task 264 — orchestrator emits commits.
- No git commands from executor. Single-writer git rule.
- No DB migration in any task unless explicitly scoped + owner-approved.
- No public-site changes — Epic HH is admin-only unless an item explicitly extends (and owner approves).
- No "fix all admin UX in one task" — that is the explicit anti-pattern this Epic exists to avoid.

## APPROVED owner decisions (2026-05-30) — kickoffs 303/304/305 MUST encode these literally

These decisions are now **fixed inputs** to Phase 1 kickoffs. Phase 1 (audit/spec) confirms or refines the per-route policy — Phase 1 may NOT re-litigate the high-level decision.

### Decision 1 — Narrow-breakpoint model: **C (Hybrid)**

Per-route policy split based on surface type. Workflow-heavy surfaces below `md:` get **mobile card-row fallback** because card layout improves usability when each row's primary value is "open / triage / act on this item":
- `/admin/support` (Internal Tickets)
- `/admin/inquiries/support` (Support Inbox)
- `/admin/inquiries/sales` (Sales Inbox)
- `/admin/reports`
- Possibly Footer / Settings forms where the layout is form-driven, not table-driven (Task 303 confirms during inventory)

Data-dense reference / admin tables below `md:` get **controlled horizontal scroll** with sticky first meaningful column + sticky header + visible scroll affordance:
- `/admin/listings`
- `/admin/users`
- `/admin/locations`
- `/admin/popular-locations`
- `/admin/companies`
- `/admin/property-types`
- `/admin/currency`
- `/admin/permissions`
- `/admin/email-templates`
- `/admin/legal` (pages)

Task 303 is **audit/spec only** — confirms or corrects the per-route classification after actual inventory. **NO implementation code** in Task 303.

### Decision 2 — Filter taxonomy

- **≥4 options OR long-tail option list** → canonical `Combobox` / `Select` (Combobox preferred per `docs/ui-rules.md §0` Combobox-only rule).
- **≤3 mutually exclusive high-level scopes** → segmented tabs allowed.
- **Free-text** → separate `Search` input.
- **Active filter count** = total active VALUES (e.g. multi-select Combobox with 2 picked values counts as 2 active, NOT 1). Aligns with Task 294 multi-select counter rule already in `filterEngine.ts`.
- **Single global reset** button required whenever at least one filter is active. One reset only — no per-filter reset chips beyond the standard ActiveFilterChips pattern.

### Decision 3 — Sort URL-state policy

- Sort state **always lives in URL** for shareable / reload-safe admin views.
- Canonical query shape (stable + identical across admin tables): `?sort=<column>&dir=asc|desc`
- Task 304 describes canonical column-sort rules per surface — **no DB migrations** in Task 304.

### Decision 4 — Modal width tiers (CONFIRMED)

| Tier | Width | Typical use |
|---|---|---|
| `sm` | 400px | Confirmation dialogs, single-field prompts |
| `md` | 560px | Standard create / edit forms (most admin modals) |
| `lg` | 720px | Multi-section forms, detail panels with sidebar |
| `xl` | 960px | Wide editors, content management modals |

Task 305 audits every admin Dialog/Sheet/Popover and assigns each to a tier. **No implementation** in Task 305 — spec only.

### Decision 5 — Mobile modal fallback

- **Action-heavy** create / edit / destructive workflows on narrow breakpoints (< `md:`) → **Sheet (bottom drawer) OR full-height Sheet**. Mandatory when the modal contains form fields, pickers, or multi-step actions.
- **Read-only detail surfaces** → may remain `Dialog` if usable at 320/375/390 (no overflow, no clipping).
- If a Dialog reproduces overflow / clipping at 320, Task 305 recommends Sheet / full-screen fallback in the spec. **No implementation** in Task 305.

### Decision 6 — Verified Agents DB schema (APPROVED DIRECTION, implementation later)

Approved direction:
- `users.verification_state` enum: `not_verified` / `pending_review` / `verified` / `rejected` / `revoked`
- `user_verification_events` audit table: `id, user_id, prior_state, new_state, reason, actor_id, created_at`

### Task 313 — owner schema contract (recorded 2026-08-27)

> **Owner decision 2026-08-27: Task 313 is approved to START, but ONLY under this schema contract.** The contract is
> recorded here verbatim so a kickoff can be written against it. **It is not yet signed** — until the owner signs it,
> no kickoff and no implementation. The backlog carries the signature as a Pending Action Item.

| # | Contract clause | Non-negotiable meaning |
|---|---|---|
| C1 | `verification_state` | The single state field. No parallel boolean, no derived duplicate column. |
| C2 | Immutable `user_verification_events` | Append-only audit table. No update path, no delete path — a correction is a new event. |
| C3 | DB transaction validates transitions **and** writes the audit event | One transaction does both. A state change that did not write its event must not commit; validation lives in the database, not only in application code. |
| C4 | Public output exposes **only** `is_verified` | No state value, no reason, no actor, no timestamps reach a public consumer. The public surface is one boolean. |
| C5 | Admin-only by default; moderator **explicitly denied** | Moderator access is denied until separately granted by the owner. Default-deny, not default-allow. |

**Kickoff preconditions, once signed:** the kickoff must name the RLS policies that enforce C4 and C5, require a
planted illegal-transition proof for C3 (the transaction rejects it and no event row is written), and treat this as a
`Q4` write-path/RLS task under `docs/qa-profiles.md`.

**Task 313 implementation kickoff is NOT yet written.** Reason: the schema contract above must be signed by the owner first (recorded 2026-08-27, unsigned as of that date). This file records the approved DIRECTION only — the schema migration, RLS policies, and action-flow specifics are designed in a future Phase 6 spec task, then implemented in Task 313+.

### Decision 7 — Verified Agents public badge

- Verified badge **shows publicly** on listings cards / listing details / agent profile pages — **only if `users.verification_state = 'verified'`**.
- Badge **hidden** for `pending_review` / `rejected` / `revoked` / `not_verified`.
- This is part of Task 313 (or a Task 313 follow-up if owner splits public vs. admin work). **Not part of Phase 1.**

## Cross-Epic references

- Sprint 21 ships Phase 0 (Tasks 300/301/302) → `tasks/Sprints/Sprint_21_—_Admin_Critical_Hotfixes_and_Footer_Fix.md`.
- Epic II — Global i18n Hardening → `tasks/Epics/Epic_II_Global_i18n_Hardening.md` (covers admin/public/notifications/emails/toasts i18n hardening; Task 300 is the first slice of that Epic; broader audit is a separate Epic-II task).
- Task 296 (closed-approved) → see `docs/sessions/2026-05-30-task-296-tailwind-entropy-audit.md`.
- Task 299 (admin filter triage evaluation, Phase 1 complete) → `docs/governance-reports/2026-05-30-admin-filter-triage-evaluation.md`.

## Status / progress tracking

| Phase | Tasks | Status |
|---|---|---|
| Phase 0 — Sprint 21 critical hotfixes | 300, 301, 302 | ✅ SHIPPED 2026-05-30 (300 + 302 in code; 301 narrow patch in code but owner broader QA FAIL → escalated to Sprint 28 Phase 2-3 emergency activation) |
| Phase 1 — Audit + spec | 303, 304, 305 | ✅ SHIPPED 2026-05-30. **Task 303 severity SUPERSEDED 2026-05-30 by Sprint 28 Task 327** evidence-driven matrix scoped to owner-flagged 6 surfaces (`docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md`). Task 303 inventory remains historical reference. |
| Phase 2 — Primitives | 306, 307 | ACTIVATED 2026-05-30 under Sprint 28 (scope reduced to owner-flagged surfaces only). Kickoffs: `tasks/Sprints/Sprint_28_kickoff_prompt_Task_306.md` + `..._Task_307.md`. |
| Phase 3 — Core pages migration | 308, 309 | 🟠 RE-SCOPE under DS (owner 2026-06-05). Original Sprint 28 kickoffs (`/admin/listings` + `/admin/users` + `/admin/support` + `/admin/inquiries/{support,sales}`) are HISTORICAL — must be re-written to consume `docs/design-system.md` + canonical primitives before resuming. DS-8 (Task 353) admin-migration-plan audit is CLOSED-superseded; this re-scope replaces it. |
| Phase 4 — Content/settings migration | 310 | DEFERRED — blocked until Sprint 28 ships. Covers remaining 12 admin routes (Locations / Popular Locations / Companies / Property Types / Currency / Email Templates / Footer / Settings / Permissions / Dashboard / Pages / Legal-redirect-or-final). May split into 310a/b/c at planning time. |
| Phase 5 — Modal standardisation | 311 | DEFERRED — Sprint 28 Task 309 ships Sheet-bottom-drawer pattern for support + inquiries detail modals (canonical pattern proven on owner-flagged surfaces); Phase 5 generalizes to remaining admin modals after Sprint 28 ships. |
| Phase 6 — Verified Agents workflow | 313 | PLANNED (blocked on owner schema approval; independent of Sprint 28). |

## Sprint 28 emergency activation (2026-05-30)

Owner manual QA at 375px on 2026-05-30 (post-Task-303 closure) observed CRITICAL admin mobile defects on 6 surfaces where Task 303 classified findings as HIGH/MEDIUM. Owner also flagged that admin status-change UX is inconsistent across 4 different components (workflow block / Combobox / inline action buttons / transition button cluster).

Sprint 28 (`tasks/Sprints/Sprint_28_—_Admin_Mobile_Responsive_and_Status_Workflow_Foundation.md`) activates Epic HH Phase 2 (Tasks 306+307) + Phase 3 (Tasks 308+309) scoped to the 6 owner-flagged surfaces ONLY:

1. `/admin/support` (complaints filter)
2. `/admin/support` (tickets filter)
3. `/admin/listings`
4. `/admin/users`
5. `/admin/inquiries/support`
6. `/admin/inquiries/sales`

Sprint 28 also introduces a canonical `StatusChangeControl` primitive (Decision 1 added to APPROVED owner decisions below) and supersedes Task 303 severity classification with a fresh evidence-driven matrix (Task 327). Remaining 12 admin routes stay on the current pattern until Epic HH Phase 4 (Task 310 or split) — those are NOT Sprint 28 scope.

**Task 326B (Sprint 27) is BLOCKED until Sprint 28 ships** — building the Footer↔CMS integration on top of an unstable admin responsive foundation is the failure mode Sprint 28 exists to prevent.

### Sprint 28 owner decisions (added to APPROVED list 2026-05-30)

**Decision 1 (Sprint 28) — Canonical `StatusChangeControl` tier model:**
- `variant="select"` — low-stakes admin status changes (e.g. `/admin/inquiries/{support,sales}`). Combobox-styled dropdown; immediate save; optional note (`enableNote` prop, default off); optional timeline (`historyEvents` prop, default empty).
- `variant="workflow"` — moderation / destructive status changes (e.g. `/admin/support`, `/admin/listings` transition row-actions). Pill button group of allowed transitions; optional note `Textarea`; "Update status" submit button; required timeline below fed by `historyEvents` prop.
- One shared component; surfaces declare `variant` + `transitions` whitelist; full prop spec in `docs/admin-ux-rules.md §13` (produced by Task 328).
- `/admin/reports` (`AdminReportsManager`) NOT in Sprint 28 — its pattern (inline action buttons + notes) is documented in Task 328 spec as "deferred to Epic HH Phase 3 follow-up".

**Decision 2 (Sprint 28) — Sprint 28 scope:** owner-flagged 6 surfaces only. Remaining 12 admin routes deferred to Epic HH Phase 4.

**Decision 3 (Sprint 28) — Task 303 severity supersession:** Task 303 audit body remains valid as historical inventory; severity classification is SUPERSEDED for the 6 owner-flagged surfaces by `docs/governance-reports/2026-05-30-sprint-28-admin-mobile-evidence-matrix.md` (Task 327). Owner evidence baseline: CRITICAL = blocks reading / editing / status changes / modal use OR causes horizontal overflow / clipped content at 320/375/390.
