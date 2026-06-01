# Session: Task 346 — Form the remaining Design System execution queue (DS-2..DS-8) (Opus orchestrator/architect)

**Date:** 2026-06-01
**Type:** orchestration / architecture / task-planning (docs + tasks only — ZERO product code).
**Role:** Opus 4.7 = orchestrator / architect / reviewer. Opus does NOT write product code. Sonnet is the only executor.
**Parent:** Task 340 (`docs/design-system.md` rule layer) → Task 344 (graduated DS-1..DS-8 queue) → Task 345 (DS-1 shipped).
**Numbering:** "Task TBD" in the kickoff resolved to **Task 346** (backlog "Next free: 346"; this Opus planning
session consumes its own number exactly as Task 344 did). The seven generated Sonnet tasks are **Tasks 347–353**.

---

## 1. Verdict

**READY — DS-2 (Task 347 PageHeader) is the immediate next executable task; DS-3..DS-8 (Tasks 348–353) are
queued/blocked with explicit dependencies.** Task 344's actual DS-1..DS-8 queue is canonical and complete, so
no OWNER REVIEW REQUIRED was needed for *phase existence*; the only OWNER-REVIEW items are the **exact pilot
route (DS-6)** and **exact cabinet/auth surface (DS-7)**. No contradiction found between Task 344, `docs/backlog.md`,
and `docs/design-system.md`, so no STOP & ASK was triggered. Opus changed only `docs/**` + `tasks/**`.

## 2. Required investigation inventory

| Source | What it says | Execution impact | Risk / finding |
|---|---|---|---|
| `docs/backlog.md` | Last task number **345**; **Next free: 346**; DS-1 done by Task 345 (UNCOMMITTED); next step "owner approves DS-1, then DS-2 PageHeader kickoff"; reservations 310/311/313/319–323 (all <346, unrelated); Sprint 28 (306/306-Fix/308/309) FROZEN. Hard limit ~80 lines active content. | Numbering: this session=346, DS-2..DS-8=347–353. DS-2 gated on DS-1 owner approval+commit. | Backlog current (2026-06-01). DS-1 uncommitted → DS-2 marked READY *with precondition gate*, not "start now". |
| Task 344 session (`…task-344-design-system-implementation-path.md`) | **§6 defines the canonical DS-1..DS-8 queue** (table): DS-1 PageShell+Section; DS-2 PageHeader; DS-3 ActionBar; DS-4 FilterBar; DS-5 Storybook proof hardening; DS-6 public route pilot (ONE route); DS-7 cabinet/auth pilot (one surface); DS-8 admin compatibility review only + migration planning. Hard rule: no route migration (DS-6+) until DS-1..DS-5 shipped+approved. | This is the source of truth for all phase names/scopes. Preserved EXACTLY. | File present + complete. Task 344's queue **differs from the owner-prompt fallback shape** (see §4) — Task 344 wins per the kickoff's "prefer Task 344's actual queue". |
| Task 345 session (`…task-345-ds1-pageshell-section.md`) | DS-1 PASS (OWNER QA REQUIRED for full 14×4). Created PageShell+Section+index.ts + 2 stories; component-catalog +2 CANONICAL; globals.css byte-identical; zero route adoption; admin untouched. Stories default `desktop1440`. **UNCOMMITTED.** | Prevents duplicate DS-1 work; DS-2 builds on the existing barrel. DS-1's `OWNER QA REQUIRED` is what DS-5 later resolves. | Uncommitted/partial risk → DS-2 carries an explicit "DS-1 must exist on disk + be owner-approved+committed" precondition gate. |
| `docs/design-system.md` | §18 "Execution note (Task 344)" confirms graduated DS-1..DS-4 primitives → DS-5 proof → Phase 2+ route migration gated. §4 containers (`.container-wide` public / `.container-admin` admin — must not cross). §7 Tier ownership (Tier-2 = PageShell/PageHeader/Section/FilterBar/ActionBar; admin specialisations separate). §9 header anatomy. §11.1 FilterBar / §11.2 Search / §11.4 ActionBar. §12 touch ≥44px. §16 route snapshots. §19–§21 rendered-QA / PASS-FAIL. ADDENDUM 14×4 canon. | Supplies each generated task's AC + QA gates + container targets + the §16 migration surfaces. | **No contradiction** with Task 344 or backlog. §18 only names DS-1..DS-5 inline but points to Task 344 for the full queue → consistent. |
| `docs/component-catalog.md` | Layout Components section already registers PageShell + Section as CANONICAL Tier-2 (DS-1 Task 345). AdminPageShell CANONICAL; AdminPageHeader "superseded by AdminPageShell". | New primitives (PageHeader/ActionBar/FilterBar) are genuinely NEW (no public equivalent) — each generated task registers itself + bumps the count. | Catalog current. No stale-catalog conflict for the public layer. |
| `.storybook/preview.tsx` | VIEWPORTS presets: 320/360/375/390/412/480/640/768/1024/1280/1440/1720/1920/2560/3440. Locale global sq/en/uk/it (uk = longest-strings). `defaultViewport: 'desktop1280'`. | **5 canon widths (560/680/810/960/1200) have NO exact preset** → every generated task tells Sonnet to MANUALLY RESIZE for those 5 and cycle 4 locales; DS-5 is dedicated to consolidating this proof. | Missing-preset risk handled in every task's "Required responsive QA" + STOP & ASK ("if 14×4 can't render → OWNER QA REQUIRED"). No generated task uses an invalid `defaultViewport`. |
| `package.json` (via Task 344/345) | Scripts: `build`, `lint`, `typecheck` (`tsc --noEmit`), `test`, `check:i18n`, `build-storybook`, `screenshots:responsive`, `governance:*`. | Every generated task runs the canonical four (`npx tsc --noEmit`, `npm run build`, `npm run lint`, `npm run check:i18n`); DS-5 references `screenshots:responsive`. | Tasks tell Sonnet to report exact script names if they differ. |

## 3. Final DS phase queue (Task 344 canonical — preserved exactly)

| Phase | Scope (Task 344 §6) | Task # | State | Client? | i18n strings | Risk | Depends on |
|---|---|---|---|---|---|---|---|
| **DS-1** | PageShell + Section + barrel + 2 stories | **345** | ✅ **DONE** (Task 345; UNCOMMITTED — owner approval pending) | server | none | low | — |
| **DS-2** | **PageHeader** primitive (+ extend barrel) + story | **347** | **READY** (next executable) | server | none (props) | low | DS-1 on disk + owner-approved+committed |
| **DS-3** | **ActionBar** primitive (+ barrel) + story; Button-height governance in isolation | **348** | **QUEUED** | server | none (props) | medium | DS-2 shipped+approved |
| **DS-4** | **FilterBar** primitive (+ barrel) + story; client Sheet, conditional Reset, overflow collapse, i18n-safe `labels` | **349** | **QUEUED** (HIGH risk, isolated) | **client** | labels via props (no `messages/*`) | high | DS-3 shipped+approved |
| **DS-5** | Storybook responsive/locale **proof hardening** for all 5 layout primitives (incl. 560/680/810/960/1200 gap) | **350** | **QUEUED** | — | — | low | DS-2/3/4 primitives exist |
| **DS-6** | **Public route pilot** — adopt primitives on ONE public route (route migration BEGINS here) | **351** | **BLOCKED** + **OWNER REVIEW REQUIRED** (exact route) | — | per route | medium | DS-1..DS-5 all shipped+approved (hard gate) |
| **DS-7** | **Cabinet/auth pilot** — one cabinet/auth surface (first edit-flow surface) | **352** | **BLOCKED** + **OWNER REVIEW REQUIRED** (exact surface) | — | per route | medium | DS-6 shipped+approved |
| **DS-8** | **Admin compatibility review only** + public/cabinet/admin migration planning (AUDIT/DOCS, zero code) | **353** | **QUEUED** (audit-only) | — | — | low | DS-6 + DS-7 shipped+approved |

**Hard rule preserved:** no route migration (DS-6+) starts until DS-1..DS-5 are implemented, reviewed, and
owner-approved. Each slice is a separate kickoff released one at a time after the prior slice ships + the owner approves.

## 4. Task 344 queue vs the owner-prompt "fallback shape" — difference explained

The kickoff supplied a *fallback* DS shape and instructed: "prefer Task 344's actual DS queue if present." Task
344 **does** define a complete DS-1..DS-8 queue, so the fallback was NOT used. The two differ — Task 344 governs:

| Phase | Owner-prompt fallback | **Task 344 canonical (USED)** |
|---|---|---|
| DS-3 | FilterBar/Search/Tabs/ActionBar primitive layer | **ActionBar only** (FilterBar split out to DS-4; Tabs not a separate DS phase) |
| DS-4 | Public route migration pilot | **FilterBar primitive** (client, isolated) |
| DS-5 | Public listings/search/filter migration | **Storybook proof hardening** (no route migration) |
| DS-6 | Cabinet/auth layout migration | **Public route pilot** (ONE route) |
| DS-7 | Admin responsive migration | **Cabinet/auth pilot** (one surface) |
| DS-8 | Final governance/catalog/QA closure | **Admin compatibility review only + migration planning** (audit/docs) |

Rationale for following Task 344: it keeps the four primitives in separate, individually-verifiable slices
(the whole point of rejecting Task 343's all-at-once bundle), defers ALL route migration until the primitive
foundation is proven, and isolates the highest-risk primitive (FilterBar) alone. The owner's listings/search
migration concern is not lost — it falls under Task 344's Phase 2 route-migration waves that DS-8 plans out
(the DS-6 public pilot is deliberately a small route first; listings/search is a later wave).

## 5. Generated task files (Sonnet-ready)

- `tasks/Sprints/Sprint_30_kickoff_prompt_Task_347_DS-2_PageHeader.md` — READY
- `tasks/Sprints/Sprint_30_kickoff_prompt_Task_348_DS-3_ActionBar.md` — QUEUED
- `tasks/Sprints/Sprint_30_kickoff_prompt_Task_349_DS-4_FilterBar.md` — QUEUED (HIGH risk)
- `tasks/Sprints/Sprint_30_kickoff_prompt_Task_350_DS-5_StorybookProofHardening.md` — QUEUED
- `tasks/Sprints/Sprint_30_kickoff_prompt_Task_351_DS-6_PublicRoutePilot.md` — BLOCKED + OWNER REVIEW (route)
- `tasks/Sprints/Sprint_30_kickoff_prompt_Task_352_DS-7_CabinetAuthPilot.md` — BLOCKED + OWNER REVIEW (surface)
- `tasks/Sprints/Sprint_30_kickoff_prompt_Task_353_DS-8_AdminCompatibilityReview.md` — QUEUED (audit-only, zero code)

Every file contains all 20 required sections (Title; Type/priority/area; Required pre-read; Role contract;
Problem; Goal; Current behavior to preserve; Required after behavior; Positive flow; Negative flow; Scope; Out
of scope; Acceptance criteria; Required validation; Required responsive QA; Required localization QA; STOP &
ASK; Final report; Files Changed table requirement; No-git-commands rule) and carries the full
**14-width × 4-locale** canon (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560 × sq/en/uk/it),
uk@320 longest-locale stress check, the rendered-QA-not-code-level rule, the 560/680/810/960/1200 preset-gap
note, the control-preservation / relocation / edit-flow rules (where applicable), and the canonical four
validation commands.

## 6. Dependencies & run order

```
DS-1 (345 ✅, owner approve+commit)
   └─> DS-2 PageHeader (347, READY)        ─ owner approve+commit ─┐
        └─> DS-3 ActionBar (348)           ─ owner approve+commit ─┤
             └─> DS-4 FilterBar (349)      ─ owner approve+commit ─┤
                  └─> DS-5 Proof hardening (350) ─ owner approve+commit ─┘  ← primitive foundation COMPLETE (hard gate)
                       └─> DS-6 Public route pilot (351, BLOCKED until gate; route = OWNER REVIEW)
                            └─> DS-7 Cabinet/auth pilot (352, surface = OWNER REVIEW)
                                 └─> DS-8 Admin compat review + migration plan (353, audit only)
```

Primitive slices (DS-2..DS-5) are strictly sequential + owner-gated between each (the owner's "one small slice
at a time, can't loop for hours" preference). Route migration (DS-6..DS-8) is fully blocked behind the
foundation gate.

## 7. Status legend applied

- **READY** — DS-2 (347): next executable; only precondition is DS-1 owner approval+commit.
- **QUEUED** — DS-3 (348), DS-4 (349), DS-5 (350), DS-8 (353): defined + Sonnet-ready, released after their dependency ships.
- **BLOCKED** — DS-6 (351), DS-7 (352): cannot start until the DS-1..DS-5 foundation gate (DS-6) / DS-6 (DS-7) is cleared.
- **OWNER REVIEW REQUIRED** — DS-6 exact pilot route + DS-7 exact cabinet/auth surface (phase is canonical; only the target needs owner confirmation).

## 8. Provenance confirmations

- **Task 345 = DS-1 DONE** — recognized, not duplicated. DS-2 only ADDS to the existing barrel; it does not recreate PageShell/Section.
- **Task 343 = FROZEN / provenance only** — not resurrected, not referenced as executable; no generated task asks Sonnet to run it.
- **Task 340 = rule-layer / provenance only** — `docs/design-system.md` is consumed as the ruleset, never as an executable path.
- **Sprint 28 (306/306-Fix/308/309) = FROZEN** — DS-8 (353) explicitly forbids committing/reviving those patches; admin is read-only audit there.

## 9. Confirmation — no product code changed by Opus

Opus wrote/edited only `docs/**` + `tasks/**`. No `src/`, no `messages/*.json`, no SQL/migrations/server
actions/business logic, no `globals.css`, no `.storybook/**`. No primitive implemented; no route adopted. No
`git add`/`git commit` run by Opus.

## 10. Validation performed (read-only) — see §V in the final chat report for exact command output

- Confirmed next free number 346 from `docs/backlog.md`; assigned 346 (this session) + 347–353 (generated tasks); no reuse of 343; no renumber of completed tasks.
- Confirmed Task 344 §6 defines a complete DS-1..DS-8 queue → preserved exactly; documented the fallback-shape divergence (§4 above).
- Confirmed no contradiction between Task 344 / `docs/backlog.md` / `docs/design-system.md` → no STOP & ASK.
- Confirmed `.storybook/preview.tsx` preset gap (560/680/810/960/1200) → propagated to every task + dedicated DS-5.
- Confirmed git tree clean before edits; Opus changed only docs + tasks.

## 11. Files changed (Opus — docs + tasks only)

| File | Change | Rationale |
|---|---|---|
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_347_DS-2_PageHeader.md` | NEW | DS-2 PageHeader Sonnet kickoff (READY) |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_348_DS-3_ActionBar.md` | NEW | DS-3 ActionBar Sonnet kickoff (QUEUED) |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_349_DS-4_FilterBar.md` | NEW | DS-4 FilterBar Sonnet kickoff (QUEUED, HIGH risk) |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_350_DS-5_StorybookProofHardening.md` | NEW | DS-5 proof-hardening Sonnet kickoff (QUEUED) |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_351_DS-6_PublicRoutePilot.md` | NEW | DS-6 public route pilot kickoff (BLOCKED + OWNER REVIEW route) |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_352_DS-7_CabinetAuthPilot.md` | NEW | DS-7 cabinet/auth pilot kickoff (BLOCKED + OWNER REVIEW surface) |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_353_DS-8_AdminCompatibilityReview.md` | NEW | DS-8 admin compat review + migration plan (QUEUED, audit-only) |
| `docs/sessions/2026-06-01-task-346-ds-remaining-phases-planning.md` | NEW — this log | Inventory, queue, dependencies, provenance, owner git commands |
| `docs/backlog.md` | UPDATE — Last Session block + DS queue line | Per agent-contract clause 10 (concise; full detail here) |

## 12. Owner git commands (single-writer — owner runs in PowerShell; Opus does NOT run git)

If `git status` shows phantom-corruption mods first run:
`Remove-Item .git\index -ErrorAction SilentlyContinue; git reset`

```
git add tasks/Sprints/Sprint_30_kickoff_prompt_Task_347_DS-2_PageHeader.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_348_DS-3_ActionBar.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_349_DS-4_FilterBar.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_350_DS-5_StorybookProofHardening.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_351_DS-6_PublicRoutePilot.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_352_DS-7_CabinetAuthPilot.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_353_DS-8_AdminCompatibilityReview.md docs/sessions/2026-06-01-task-346-ds-remaining-phases-planning.md docs/backlog.md
git commit -m "docs(Task346): form remaining DS queue — DS-2..DS-8 Sonnet kickoffs (Tasks 347-353) + planning session + backlog"
```

---

READY — DS-2 (Task 347) is the next executable slice once the owner approves + commits DS-1 (Task 345).
DS-3..DS-8 follow one slice at a time, owner-approved between each; route migration stays blocked behind the
DS-1..DS-5 foundation gate.
