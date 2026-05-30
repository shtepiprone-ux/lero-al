# Sprint 23 — Task 303 kickoff (Epic HH Phase 1 — Admin responsive + UX system audit across ALL 7 breakpoints + per-route severity classification)

> **⚠️ STRENGTHENED 2026-05-30 (owner directive, `issues2.md`):** Task 303 is NOT a narrow-bp-only audit. Owner runtime QA confirms admin UI/UX problems exist across ALL 7 breakpoints (320/375/390/768/1280/1440/2560). Task 303 must therefore audit EVERY admin route at ALL 7 breakpoints in ALL 4 locales, with a per-route per-breakpoint evidence matrix + severity classification (CRITICAL / HIGH / MEDIUM / LOW). Tasks 304 + 305 consume this evidence; they MUST NOT be abstract — they must produce concrete canonical rules anchored to specific Task 303 findings.

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10 (Task 264 commit hand-off). Sonnet writes "Files Changed" table; orchestrator emits commits.

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **PURE AUDIT/SPEC TASK — no production code changes**. Pre-read `docs/orchestrator-role.md`, `docs/ai-behavior.md` (Notes 18/19/20/21/22/23), `docs/ui-rules.md`, `docs/component-rules.md`, `docs/tailwind-canonical-fragments.md`, `docs/tailwind-governance.md`, `docs/qa-rules.md`, `tasks/Epics/Epic_HH_Admin_UX_System.md` (this Epic + the 7 approved owner decisions), `docs/sessions/2026-05-30-task-296-tailwind-entropy-audit.md` (the failed-narrow-bp browser verification that started this Epic), `docs/governance-reports/2026-05-30-admin-filter-triage-evaluation.md` (Task 299 — input). No scope change; STOP & ASK if ambiguous.

> **Numbering:** Task 303 is Epic HH Phase 1 task #1. Reserved in the Epic plan since 2026-05-30. This kickoff is now active because owner approved the 7 product decisions in `Epic_HH_Admin_UX_System.md` → "APPROVED owner decisions (2026-05-30)".

---

```
Type:        audit + canonical spec (DOCUMENTATION ONLY — no production code, no component changes, no DB migration)
Priority:    HIGH (blocks Epic HH Phase 2+ — primitive component foundation cannot start until per-route policy is confirmed)
Area:        all admin routes — narrow-breakpoint (320/375/390) behavior classification
```

## Why this task exists

Owner approved **Decision 1 — Narrow-breakpoint model: C (Hybrid)** in `Epic_HH_Admin_UX_System.md` on 2026-05-30:

- Workflow-heavy admin surfaces below `md:` → **mobile card-row fallback**
- Data-dense reference / admin tables below `md:` → **controlled horizontal scroll** with sticky first meaningful column + sticky header + visible scroll affordance

Owner's preliminary per-route classification:

| Surface | Approved policy |
|---|---|
| `/admin/support` (Internal Tickets) | card-row fallback |
| `/admin/inquiries/support` (Support Inbox) | card-row fallback |
| `/admin/inquiries/sales` (Sales Inbox) | card-row fallback |
| `/admin/reports` | card-row fallback |
| Footer / Settings forms | card-row fallback (form-driven, confirm via inventory) |
| `/admin/listings` | controlled horizontal scroll |
| `/admin/users` | controlled horizontal scroll |
| `/admin/locations` | controlled horizontal scroll |
| `/admin/popular-locations` | controlled horizontal scroll |
| `/admin/companies` | controlled horizontal scroll |
| `/admin/property-types` | controlled horizontal scroll |
| `/admin/currency` | controlled horizontal scroll |
| `/admin/permissions` | controlled horizontal scroll |
| `/admin/email-templates` | controlled horizontal scroll |
| `/admin/legal` (pages) | controlled horizontal scroll |

**This task is the audit step that CONFIRMS or CORRECTS the per-route policy after actual code-level inventory.** Sonnet may NOT re-litigate Decision 1 (the hybrid model is fixed). Sonnet MAY recommend moving a specific route from one bucket to the other based on inventory evidence — that recommendation goes to the orchestrator as a STOP & ASK before the spec doc is finalised.

## Severity classification (mandatory — owner directive 2026-05-30)

Every per-route × per-breakpoint × per-locale finding MUST be classified by severity:

| Severity | Definition | Examples |
|---|---|---|
| **CRITICAL** | Clipped / unusable controls — user cannot complete the workflow | Primary action button cut off; row click dead; modal cannot close |
| **HIGH** | Unreadable data / cards / tables — user cannot extract meaning | Table columns merged with no separator; cards overlap; long text truncated to ellipsis |
| **MEDIUM** | Inconsistent spacing / dividers / patterns — UX degraded but functional | Two pages use different filter UIs for the same data shape; uneven padding; missing row dividers |
| **LOW** | Cosmetic polish — minor visual irregularity | Hover state color drift; alignment 1-2px off |

Severity-tagged findings feed:
- Phase 2/3 implementation prioritisation (CRITICAL first, LOW last)
- Owner's review of audit completeness (no CRITICAL hidden under MEDIUM)
- Cross-task budget allocation (CRITICAL might warrant a hotfix sprint between Phase 2 and Phase 3)

## Mandatory audit coverage (owner directive 2026-05-30)

Task 303 MUST include all of the following sub-audits inside the main report:

1. **Every admin route** — per the inventory below (no surface omitted).
2. **All 7 breakpoints**: 320 / 375 / 390 / 768 / 1280 / 1440 / 2560 (narrow-3 is NOT the only focus; tablet + desktop + huge-desktop all get evidence).
3. **Per-route × per-breakpoint × per-locale evidence matrix** — screenshot OR narrative observation per cell, with severity tag.
4. **Dashboard-specific UX audit** — `/admin` page: KPI cards (readable at every breakpoint?), recent listings grid (layout intact?), card spacing, mobile dashboard usability.
5. **Table-to-card / controlled-scroll decision per route** — apply Decision 1 (Hybrid) hypothesis from Epic HH; document confirmation or correction per route based on actual inventory.
6. **Header / action row audit** — every admin page's top header + primary action button(s) + breadcrumb at every breakpoint. CONFIRMED-not-theoretical owner finding: header buttons clip in production.
7. **Filter / tab / button consistency audit** — surface where the same data shape uses different filter UIs (input for Task 304 spec).
8. **Record-separation / card-divider audit** — surfaces where rows / records visually merge without dividers / spacing / card blocks (owner-confirmed CRITICAL issue 4 in QA list below).
9. **Localization visual QA notes** — for each route, observe behavior at the longest-string locale (`uk` typically, `sq` for some Albanian-specific patterns) — does text wrap, truncate, overflow, push other controls off-screen?

## Owner QA — confirmed observations to validate per route (NOT to fix in Task 303)

Owner observations 2026-05-30 (`issues2.md`) — Task 303 must independently verify each per route:

- Header / action buttons clipped or visually broken — REPRODUCE per route, classify severity per breakpoint.
- Dashboard cards poorly adapted, unreadable — REPRODUCE on `/admin`, classify.
- Tables not adapted to modern responsive patterns — REPRODUCE per table route, classify.
- Records merge visually without separators — REPRODUCE per surface, classify.
- Admin pages use inconsistent responsive models (squeezed tables, uncontrolled horizontal clipping, weak card separation, inconsistent filter/button/tab patterns, broken dashboard grid) — REPRODUCE per surface, classify.
- Issue spans the entire admin panel, not only AdminListingsTable / AdminUsersTable — confirm by completeness of the per-route inventory.
- Email Templates wrong localization — already addressed by Task 315 (separate); Task 303 references but does not re-investigate.

## Goal

Produce two artefacts that unblock Epic HH Phase 2:

1. **`docs/admin-ux-rules.md`** (NEW) — canonical admin UX rules document. Sections to populate in this task:
   - "Narrow-breakpoint model" — encode Decision 1 verbatim with per-route policy table.
   - "Card-row fallback pattern" — what it looks like (no implementation, just spec: which fields surface, action placement, density, tap targets).
   - "Controlled horizontal scroll pattern" — sticky first column rule, sticky header rule, scroll affordance requirement (visible scrollbar or shadow on overflow), no-clipping rule.
   - "Per-route policy table" — every admin route + chosen pattern + 1-line rationale.
   - "Owner approval gate" — explicit note that Phase 2 (Tasks 306/307) cannot start until this doc is owner-approved.

2. **`docs/governance-reports/2026-05-30-admin-responsive-audit.md`** (NEW; adjust date to actual run date) — the audit data behind the spec. Per-route × per-breakpoint behavior classification + evidence.

**NO production code changes.** **NO source files in `src/` touched.** **NO new components.** **NO DB migration.** **NO new locale keys.**

## Current behavior to preserve (Notes 19 + 20 + 22)

Audit-only tasks still have a preservation rule: this task must not silently establish a spec that quietly removes an existing admin capability. If Sonnet's per-route inventory finds a control / action / behaviour that the proposed canonical pattern cannot accommodate, the conflict MUST be documented in the audit report and routed back as a STOP & ASK — not silently dropped from the spec.

Specifically, for every admin route inventoried, capture:
- columns (and column order)
- row click behaviour
- row actions (every button / icon / dropdown item per row)
- inline controls (status switchers, role selectors, currency selectors, etc.)
- filters
- search
- pagination
- sort (sortable columns + default sort)
- empty / loading / error states
- mobile layout today (320/375/390 — what currently happens: clipping / scroll / wrap / partial render)
- header / action row controls
- primary action button

This is the SAME inventory required by Note 22 (Admin Table Preservation Rule). The spec doc must demonstrate that the chosen canonical pattern for each route accommodates every inventoried control.

## Required investigation (PASTE summary in session log)

```
# 1. Inventory every admin route + its top-level component
find src/app/admin -name 'page.tsx' -print
grep -rn 'export default async function\|export default function' src/app/admin/**/page.tsx | head -40

# 2. For each route, identify the main manager component
grep -rn 'AdminListingsTable\|AdminUsersTable\|AdminSupportManager\|AdminInquiriesManager\|AdminReportsManager\|AdminLocationsManager\|AdminCompaniesManager\|AdminPropertyTypesManager\|AdminCurrencyManager\|AdminEmailTemplatesManager\|AdminFooterManager\|AdminSettings\|AdminPermissionsManager\|AdminLegalManager' src/app/admin

# 3. For each manager, capture the toolbar + table/list/card structure
sed -n '<lines>' src/components/admin/<each>.tsx

# 4. Render each route in dev at 320/375/390 in `uk` (longest labels) and capture: clipping / scroll / wrap / partial / overflow behaviour. Paste a per-route × per-breakpoint × per-locale narrative.
#    Locales: sq / en / uk / it.
#    Breakpoints: 320 / 375 / 390 / 768 / 1280 / 1440 / 2560.

# 5. Cross-reference Task 296 + Task 299 findings (already on disk)
cat docs/sessions/2026-05-30-task-296-tailwind-entropy-audit.md
cat docs/governance-reports/2026-05-30-admin-filter-triage-evaluation.md
```

After investigation, paste:
- The route → manager-component → main-pattern mapping.
- The per-route × per-breakpoint × per-locale narrative (audit matrix).
- The before-state inventory per route (Note 22 fields).
- Any conflict between Decision 1's preliminary classification and what the actual surface needs.

## STOP & ASK before finalising the spec

Before writing `docs/admin-ux-rules.md`:
1. **Per-route policy disagreement?** If any route's actual surface is incompatible with the owner's preliminary classification (e.g. `/admin/legal` is form-heavy, not table-heavy → may need card-row instead of controlled scroll), STOP & ASK the orchestrator.
2. **Footer / Settings classification** — owner marked these as "possibly card-row, confirm via inventory". Confirm with orchestrator after inventory.
3. **Sticky-column candidate** — for the data-dense controlled-scroll routes, propose which column is the "first meaningful column" to make sticky (typically: title for listings, name for users, label for locations). STOP & ASK if ambiguous.
4. **Scroll affordance** — propose ONE canonical affordance (visible scrollbar always-on at `md:` and below OR fade-shadow on overflow edge OR explicit chevron buttons). STOP & ASK.

Do NOT pick any of the above defaults silently — the spec is meaningless if it papers over an unresolved design decision.

## Scope (files Sonnet may touch)

- `docs/admin-ux-rules.md` (NEW)
- `docs/governance-reports/2026-05-30-admin-responsive-audit.md` (NEW; adjust date if run later — task number stays 303)
- `docs/sessions/2026-05-30-task-303-admin-responsive-audit.md` (NEW; adjust date)
- `docs/backlog.md` (closure entry — Phase 1 first audit shipped)

**MUST NOT touch:**
- Any file under `src/`
- Any file under `messages/`
- Any file under `scripts/` (except adding to schema-drift if a column changes — N/A here)
- Any other doc beyond the four listed above
- Any task file beyond updating the backlog entry
- Sprint 21 (300/301/302) files
- Sprint 22 (314) files
- Sprint 24 (Epic II Phase 1 — 316/317/318) files
- Tailwind allowlist
- `Button` / `Combobox` / `Dialog` / `Sheet` / `Tabs` canonical primitives
- DB migrations
- RLS policies

**Maximum SOURCE-FILE delta: 0.** If you touch `src/`, STOP & ASK.

## Locale coverage (audit scope, not implementation)

The audit reviews UI at all four locales (sq / en / uk / it) — observe behavior at the LONGEST-string locale (`uk` typically; spot-check `sq` for Albanian-specific patterns). NO new locale keys, NO copy edits — audit only observes existing strings. Every per-route × per-breakpoint cell in the evidence matrix must note locale behavior (does long Ukrainian text overflow? Does Albanian truncate?).

## Responsive coverage (audit scope — ALL 7 breakpoints mandatory)

All seven breakpoints audited per admin route: **320 / 375 / 390 / 768 / 1280 / 1440 / 2560**. Owner directive 2026-05-30: narrow-3 (320/375/390) is NOT the only focus — tablet (768), desktop (1280/1440), and huge-desktop (2560) all get evidence. Admin UX problems span all breakpoints.

## Acceptance criteria (literal)

- `docs/admin-ux-rules.md` exists with the sections listed in Goal #1; "APPROVED owner decisions" reference to Epic HH; Decision 1 encoded verbatim.
- `docs/governance-reports/2026-05-30-admin-responsive-audit.md` exists with a per-route × per-breakpoint × per-locale matrix (or per-route narrative with breakpoint coverage).
- Per-route policy table in `admin-ux-rules.md` covers EVERY admin route from the inventory. Each route has: pattern (card-row / controlled-scroll / both / N-A), 1-line rationale, link to its inventory row in the audit report.
- Every Note 22 inventory field captured for every admin table route.
- All conflicts between owner's preliminary classification and actual inventory are documented + routed to orchestrator (STOP & ASK answered BEFORE the spec is finalised).
- Sticky-column choice + scroll-affordance choice documented per route.
- "Owner approval gate" section in `admin-ux-rules.md` explicitly states Phase 2 (Tasks 306/307) blocked until owner sign-off.
- Zero source files changed (`git diff -- src` empty).
- Zero locale file changes (`git diff -- messages/` empty).
- Zero migration script changes.
- `npx tsc --noEmit` → 0 errors (no code changed, baseline preserved).
- `npm run build` → passes.
- `npm run lint` → 0/0 (Task 295 baseline preserved).
- `npm run governance:tailwind` → still C0/H0/M0 (no regression).
- Note 18 self-validation block + AC self-audit table + "Files Changed" table in session log.
- Verdict line: `Self-validation: tsc=0 · build=passes · lint=0/0 · governance:tailwind=C0/H0/M0 · per-route × per-breakpoint × per-locale evidence matrix complete (N routes × 7 bp × 4 loc cells) · severity classification applied (CRITICAL/HIGH/MEDIUM/LOW counts per route) · dashboard + header + filter + record-separation sub-audits complete · spec doc shipped · src diff=empty · owner approval gate set for Phase 2 · PASS`.

## Out of scope

- **Implementation of either narrow-bp pattern** — Phase 2 (Task 306 AdminPageShell / Task 307 AdminTable+AdminCardList primitive).
- **Filter / sort / row-action canonical spec** — Task 304.
- **Modal / dialog canonical spec** — Task 305.
- **Verified Agents workflow** — Phase 6 (Task 313).
- **Migration of any specific admin page** — Phase 3+.
- **Any visual redesign** — colors, typography, spacing, icons.
- **DB migrations.**
- **New locale keys / copy changes.**
- **Modifying canonical primitives.**
- **Re-litigating Decision 1** — the hybrid model is fixed. Per-route boundary refinement is fine; high-level model change is not.

## Final report required

1. Files Changed table (3 NEW docs + backlog).
2. Route → component → main-pattern mapping (≥10 routes).
3. **Per-route × per-breakpoint × per-locale audit matrix WITH SEVERITY TAGS** (every cell has a severity: CRITICAL / HIGH / MEDIUM / LOW or N/A; cells must cover all 7 breakpoints × all 4 locales).
4. Per-route Note 22 inventory.
5. Per-route policy assignment + rationale + sticky-column + scroll-affordance choice.
6. **Dashboard sub-audit narrative** (KPI cards + recent listings grid + spacing per breakpoint).
7. **Header / action-row sub-audit narrative** per route.
8. **Filter / tab / button consistency sub-audit narrative** across routes (input for Task 304).
9. **Record-separation / card-divider sub-audit narrative** per surface.
10. **Localization visual QA notes** per route (does text overflow / truncate / push controls?).
11. **Severity summary table** — counts of CRITICAL / HIGH / MEDIUM / LOW findings per route.
12. List of any conflicts with Decision 1 (preliminary classification) + STOP & ASK transcript + resolutions.
13. AC-by-AC self-audit table.
14. Owner approval gate section verbatim.
15. Confirmation NO file under `src/` was edited.

Do NOT emit git commands. Do NOT run git. Do NOT introduce any source code. STOP & ASK on per-route conflicts before finalising the spec.
