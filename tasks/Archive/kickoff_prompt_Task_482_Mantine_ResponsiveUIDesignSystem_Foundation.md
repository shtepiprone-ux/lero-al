# Task 482 — Mantine Responsive UI Design System — Full Audit, Foundation, Storybook Rebuild, and UI Migration Program

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (review-on-diff).
> **Type:** Architecture + implementation + migration MASTER plan. (NOT a few demo stories; NOT docs-only; NOT
> a whole-app migration in the first commit.)
> **Number policy (owner, HARD):** this is and stays **Task 482**. **Do NOT create Task 483; do NOT reserve a
> new number.** Anywhere a "483" appears in source instructions, it means this Task 482.
> **Owner decision 2026-06-24:** the old Tailwind / Base UI / shadcn-style responsive design system has FAILED;
> the current Storybook responsive adaptation is NOT trusted. **Mantine is now the canonical responsive UI
> design system for lero-al** — the source of truth, not inspiration, not a visual reference, not
> "Mantine-inspired Tailwind".

---

## 0. Owner decision (authority statement)

The legacy responsive system — Storybook canvas wrappers (`withCanvas`), hardcoded viewport tricks,
`.container-wide`, Tailwind breakpoint classes, and the old `docs/design-system.md` responsive rules — is **no
longer the source of truth.** Mantine is the source of truth for: responsive layout · component structure ·
theme · color scheme · spacing · density · form layout · table/list/card behavior · modal/drawer behavior ·
Storybook proof · future UI-migration acceptance.

**This Task 482 is the MASTER UI migration task.** It defines and STARTS the complete migration from the legacy
UI layer to Mantine. It does NOT migrate every product screen in the first commit — but it must produce the
complete, executable migration program so future slices need no system reinvention.

This task delivers all ten: (1) full UI audit; (2) Mantine foundation integration; (3) Mantine theme + responsive
system; (4) Storybook rebuild around Mantine; (5) full legacy→Mantine migration map; (6) canonical Mantine
patterns; (7) migration execution plan for every UI surface; (8) freeze of old UI work; (9) first executable
foundation implementation; (10) hard acceptance gates for future migration slices.

---

## 1. Pre-read + repo reality (orchestrator-verified 2026-06-24 — re-check before writing)

**Always required (`rule-index.md`):** `docs/agent-contract.md` (clauses 1–15), `docs/backlog.md`,
`docs/critical-flow-registry.md` (scan — root-layout/provider wiring may touch a registry flow; if so, baseline
its test and keep it green).

**Verified facts:**
- App Router layouts: `src/app/layout.tsx` (root), `src/app/[locale]/layout.tsx`, `src/app/admin/layout.tsx`.
  Existing provider tree present in root + `[locale]` layouts (confirm the correct single boundary).
- Storybook: `.storybook/main.ts`, `.storybook/preview.tsx`, `.storybook/preview-head.html`.
- `src/design-system/` does NOT exist → green-field for `src/design-system/mantine/*`.
- Stack: `@base-ui/react ^1.4.0`, **Next 15.5.18 (App Router)**, **React 19.2.4**, **Tailwind v4**
  (`tailwindcss ^4`, `@tailwindcss/postcss`), `postcss.config.mjs` present. **Mantine NOT installed.**
- UI scale (orchestrator scan): `src/app` ~46, `src/components` ~138, `src/modules` ~84 `.tsx/.jsx`; ~56
  `*.stories.tsx`; `.storybook/**` ~4 files; `src/app/globals.css` present.

> **🔴 Orchestrator risk flag — Tailwind v4 ↔ Mantine PostCSS/CSS-layer coexistence.** Mantine ships its own CSS
> and uses `postcss-preset-mantine` (+ `postcss-simple-vars`), while the repo runs Tailwind v4 via
> `@tailwindcss/postcss`. Plugin ordering and CSS-layer precedence is a real risk. Confirm the official Mantine
> Next.js setup; verify dev/build is clean. **If they cannot cleanly coexist without changing Tailwind/global
> token architecture beyond provider wiring → STOP & ASK.** (Tailwind remains in the repo as LEGACY styling
> during migration; it is no longer the future responsive authority — but it is NOT ripped out in this task.)

---

## 2. Legacy UI layer (treat as LEGACY — migrate, do not canonize)

Legacy sources: `src/components/ui/*`, `src/components/layout/*`, `src/components/admin/*`,
`src/modules/**/components/*`, `src/app/**/*.{tsx,jsx}`, all `*.stories.tsx`, `.storybook/preview.tsx`,
`src/app/globals.css` responsive/layout rules, Tailwind responsive fragments, and the old design-system docs:
`docs/design-system.md`, `docs/ui-rules.md`, `docs/admin-ux-rules.md`, `docs/storybook-governance.md`,
`docs/responsive-screenshot-governance.md`, `docs/tailwind-governance.md`, `docs/tailwind-canonical-fragments.md`.

**Legacy means:** do NOT copy from it as future canon; do NOT treat it as responsive proof; do NOT use it as
design-system authority; migrate it to Mantine via the roadmap; keep ONLY what is explicitly classified safe or
temporarily required during transition.

---

## 3. Absolute source-of-truth rule

New Mantine UI MUST use: `MantineProvider`; the Mantine theme; Mantine breakpoints; Mantine responsive style
props + style objects; Mantine layout primitives; the Mantine color-scheme model; Mantine component APIs.

New Mantine UI MUST NOT use: Tailwind breakpoint classes as responsive logic; `.container-wide` as responsive
proof; old `withCanvas` as responsive proof; old Storybook viewport hardcode as layout logic; old
`docs/design-system.md` breakpoints as canonical rules; fixed-width wrappers to make screenshots pass;
per-viewport conditional hacks; "Mantine-inspired Tailwind classes".

Tailwind may remain ONLY as legacy styling during migration. Tailwind is no longer the future responsive
design-system authority.

---

## 4. Official Mantine evidence (inspect BEFORE writing code; record in session log)

Required sources: Mantine **Next.js App Router setup**; **MantineProvider**; **ColorSchemeScript / color
scheme**; **responsive styles**; **theme**; **layout components**; **AppShell**; **Storybook integration**;
**license** (MIT) evidence.

The session log MUST record: exact docs inspected (links); exact setup requirements extracted; package
requirements; App Router provider-boundary decision; Storybook provider decision; responsive source-of-truth
decision; any incompatibility/risk. **If official Mantine docs contradict this kickoff → STOP & ASK.**

Record explicitly: Mantine components are client-side/context-based (NOT Server Components); the provider +
`ColorSchemeScript` + Mantine CSS go in the root layout; the `MantineProvider` is a client boundary.

---

## 5. Package scope (install only what the full foundation needs — justified)

| Package | Installed now | Runtime/dev | Reason | Used in this task | Deferred reason |
|---|---|---|---|---|---|
| `@mantine/core` | | | | | |
| `@mantine/hooks` | | | | | |
| `@mantine/form` | | | | | |
| `@mantine/notifications` | | | | | |
| `@mantine/modals` | | | | | |
| `postcss-preset-mantine` | | | | | |
| `postcss-simple-vars` | | | | | |
| `@mantine/dates` | | | | | |

Rules: `@mantine/core` required. `@mantine/hooks` required if used by setup/patterns. `@mantine/form` required
(forms are a core migration target). `@mantine/notifications` required if notification patterns are in the
foundation/roadmap (they are — `MantineNotificationPattern`). `@mantine/modals` required if the modal manager is
part of the new architecture. `@mantine/dates` **deferred** unless date components are implemented in this task
(they are not → defer). `postcss-preset-mantine` + `postcss-simple-vars` added ONLY if the official Mantine
setup requires them for this repo (verify Tailwind-v4 coexistence; STOP & ASK on conflict). No "Mantine UI"
runtime package. No Tailwind Plus. No Radix migration. **Base UI is NOT removed in this task.** Pin versions
compatible with React 19 / Next 15; record resolved versions.

---

## 6. Full UI audit (complete inventory — no sampling)

Audit scope = every UI-rendering or UI-support source in: `src/app/**/*.{tsx,jsx}`,
`src/components/**/*.{tsx,jsx}`, `src/modules/**/*.{tsx,jsx}`, `src/stories/**/*.{tsx,jsx,ts,js}`, all
`*.stories.tsx`, `.storybook/**/*`, `src/app/globals.css`, the Storybook + screenshot/assert scripts that define
UI proof behavior (`scripts/check-stories*.mjs`, `scripts/check-stories-rendered.mjs`), and the UI governance
docs (§2 list).

Create this table in `docs/mantine-responsive-design-system.md`:

| Source | UI role | Current implementation type | Responsive risk | Storybook status | Mantine migration class | Mantine target | Migration phase | Blocking issue |
|---|---|---|---|---|---|---|---|---|

Every source receives **exactly one** migration class: `MIGRATE TO MANTINE` · `REPLACE WITH MANTINE` ·
`WRAP TEMPORARILY` · `KEEP TEMPORARILY AS LEGACY` · `DELETE AFTER MIGRATION` · `NON-UI SUPPORT` ·
`BLOCKED — OWNER/ARCHITECTURE DECISION REQUIRED`.

**Acceptance:** every discovered UI source appears in the inventory; every UI source has exactly one class; the
`BLOCKED …` count is explicitly listed; no source hidden under vague grouping (`misc`/`other`/`representative`/
`similar`/`covered by pattern`); no source deferred without a phase + reason.

---

## 7. Full migration classification count (must reconcile)

| Metric | Count |
|---|---:|
| UI files discovered | |
| Story files discovered | |
| Storybook config/support files discovered | |
| UI governance docs audited | |
| `MIGRATE TO MANTINE` | |
| `REPLACE WITH MANTINE` | |
| `WRAP TEMPORARILY` | |
| `KEEP TEMPORARILY AS LEGACY` | |
| `DELETE AFTER MIGRATION` | |
| `NON-UI SUPPORT` | |
| `BLOCKED — OWNER/ARCHITECTURE DECISION REQUIRED` | |

The total MUST reconcile to the inventory. **If counts do not reconcile, the task FAILS.**

---

## 8. Mantine design-system document — the new authority

Create `docs/mantine-responsive-design-system.md` with these sections **in this exact order**:
1. Executive decision
2. Why the old responsive design system failed
3. Mantine as source of truth
4. Mantine official evidence
5. Mantine provider architecture
6. Mantine theme architecture
7. Mantine responsive rules
8. Mantine Storybook proof rules
9. Full UI inventory (§6 table)
10. Migration classification count (§7 table)
11. Legacy-to-Mantine component map (§12 table)
12. Canonical Mantine patterns (§10 table)
13. Storybook rebuild plan (§9)
14. Full UI migration roadmap (§13)
15. Freeze rule for old UI work (§14)
16. Future-task acceptance gates (the §17 P0 gate)
17. Open architecture decisions (every `BLOCKED …` item)

---

## 9. Mantine provider architecture (implement)

Required files: `src/design-system/mantine/theme.ts`; `src/design-system/mantine/MantineRootProvider.tsx`
(`"use client"`); app-root provider wiring at the correct App Router boundary; Storybook provider wiring.

Provider must include: `MantineProvider`; the project theme; color-scheme setup; required Mantine CSS imports;
`ColorSchemeScript` in the correct layout; **no duplicate providers** across root/locale/admin unless technically
required and justified. Must respect Server Component boundaries; the Mantine client boundary must be explicit.

---

## 10. Mantine theme architecture + canonical patterns

### 10.1 Theme (`src/design-system/mantine/theme.ts`) must define
color palette strategy · primary color · radius scale · spacing scale · font-family strategy · heading
typography · body typography · line-height · breakpoints · container sizes · shadows/elevation · default
component radius · default component size · defaults for **Button, TextInput, Textarea, Select, Checkbox, Radio,
Switch, Badge, Card/Paper, Modal, Drawer, Table, Alert, Notification**. The theme must NOT clone old Tailwind
tokens blindly; it makes Mantine the styling authority for new UI.

### 10.2 Mantine responsive rules (in the doc, §7 of the doc)
Cover: mobile 320; mobile 375/390; tablet; desktop; wide desktop; long-Ukrainian text; RTL-safe where relevant;
touch targets; stacked actions; form-field behavior; table-to-card/list; dialog vs drawer; app shell; page
heading; empty/loading/error; admin dense data surfaces; public listing grids; listing detail; auth/cabinet
forms. **Every responsive rule must name the Mantine API that implements it. No rule may say "use Tailwind classes".**

### 10.3 Canonical Mantine patterns (define + prove ALL 14)

> **🔴 HARD RULE (owner 2026-06-24) — patterns are REAL design-system components, not Storybook demos.**
> Each canonical Mantine pattern MUST be implemented as a **reusable design-system component** under
> **`src/design-system/mantine/patterns/**`**. The Storybook stories under `src/stories/patterns/mantine/**`
> must **import and render those canonical components** — a story that defines the canonical layout INLINE is
> NOT accepted (tiny local mock data is the only thing allowed to live in the story). A pattern implemented
> only inside a Storybook story file does NOT count as a canonical pattern and FAILS review. An `index.ts`
> barrel under `patterns/` may be added if useful.

Create canonical pattern components + Storybook proof for: 1. `MantineAppShellFoundation` ·
2. `MantinePageHeaderWithActions` · 3. `MantineFormSectionStack` · 4. `MantineTwoColumnForm` ·
5. `MantineResponsiveActionFooter` · 6. `MantineCardGrid` · 7. `MantineDataTableToCards` ·
8. `MantineDialogDrawerPattern` · 9. `MantineEmptyLoadingErrorState` · 10. `MantineNotificationPattern` ·
11. `MantineListingCardPattern` · 12. `MantineListingDetailPattern` · 13. `MantineAdminSurfacePattern` ·
14. `MantineAuthFormPattern`.

Table in the doc:

| Pattern | Mantine components | Mobile behavior | Tablet behavior | Desktop behavior | Wide behavior | Long `uk` behavior | Storybook proof | Product migration targets |
|---|---|---|---|---|---|---|---|---|

Each pattern names exact Mantine components/APIs.

---

## 11. Storybook rebuild rule (Mantine-native proof — legacy proof demoted)

The current Storybook responsive layer is LEGACY. For new Mantine stories: old `withCanvas` must NOT be the
proof mechanism; `.container-wide` must NOT be the proof mechanism; Tailwind breakpoint classes must NOT be the
proof mechanism; fake wrappers must NOT be used; fixed viewport-specific layout hacks must NOT be used.

Change Storybook so `Patterns/Mantine/*` stories render through **Mantine-native proof**. Allowed: a
Mantine-specific story decorator; a story parameter that bypasses the legacy canvas; a Mantine
`Container`/`Box`/`AppShell` proof wrapper; global setup supporting BOTH legacy and Mantine stories during
migration. Final result: legacy stories still work; Mantine stories do NOT depend on the old canvas;
`MantineProvider` wraps Mantine stories; dark/light proof uses the Mantine color scheme; responsive proof uses
Mantine layout + breakpoints.

### Required Storybook story groups
`Patterns/Mantine/AppShellFoundation` · `…/PageHeaderWithActions` · `…/FormSectionStack` · `…/TwoColumnForm` ·
`…/ResponsiveActionFooter` · `…/CardGrid` · `…/DataTableToCards` · `…/DialogDrawerPattern` ·
`…/EmptyLoadingErrorState` · `…/NotificationPattern` · `…/ListingCardPattern` · `…/ListingDetailPattern` ·
`…/AdminSurfacePattern` · `…/AuthFormPattern`.

Each group MUST include states: `Mobile320` · `Mobile390` · `Tablet768` · `Desktop1024` · `Desktop1440` ·
`Wide1920` · `LongUk` · `Dark` · `Pass` · `Fail`. The `Fail` story is a planted bad example OR a documented
harness limitation. Stories use Mantine APIs for responsiveness; NOT Tailwind breakpoint classes; NOT the old canvas.

**🔴 Storybook proof rule:** every `Patterns/Mantine/*` story MUST import the canonical pattern component from
`src/design-system/mantine/patterns/**` and render it. A story that defines the canonical layout inline is NOT
accepted (only tiny local mock data may live in the story). Storybook-only implementations do not count as
canonical patterns.

---

## 12. Legacy-to-Mantine component map (full)

Table in the doc:

| Legacy category | Legacy source paths | Current usage | Mantine target | Migration action | Product surfaces affected | Phase | Risk |
|---|---|---|---|---|---|---|---|

Must include: Button · Icon button · Link button · Input · Textarea · Select · Combobox · Checkbox · Radio ·
Switch · Badge · Card · Paper · Dialog · Modal · Drawer · Sheet · Popover · Menu · Tabs · Table · Data cards ·
Pagination · Breadcrumbs · Header · Footer · App shell · Admin shell · Page heading · Form shell · Action footer
· Listing card · Listing detail · Listing gallery · Notification center · Auth forms · Cabinet forms · Empty
state · Loading state · Error state · Toast/notification · Theme/dark mode · Storybook canvas/proof layer.

---

## 13. Full UI migration roadmap (executable)

Every phase MUST list: files likely touched · dependencies · acceptance criteria · Storybook proof · screenshot
proof · rollback risk · what remains legacy after the phase.

- **Phase 0 — Stop old UI path:** Tailwind Plus retired; Task 482 repurposed; Mantine selected; old
  UI/responsive tasks frozen; old Storybook responsive proof demoted.
- **Phase 1 — Mantine foundation** *(← this task)*: Mantine packages installed; provider integrated; theme
  created; Storybook Mantine setup + Mantine-native story-proof path created; design-system doc created;
  canonical patterns created; inventory + migration map created.
- **Phase 2 — Primitive replacement:** replace/wrap old primitive categories with Mantine equivalents
  (Button/Input/Select/Checkbox/Radio/Switch/Badge/Card/Dialog/Drawer/Tabs/Table); old primitives marked legacy;
  no product migration yet unless needed for proof.
- **Phase 3 — Layout migration:** AppShell; page headers; containers; action footers; dialog/drawer system;
  admin shell; public shell.
- **Phase 4 — Product surface migration:** listing cards; listing detail; listing forms; admin reports; admin
  users; admin support; notification center; auth/cabinet forms; public search/listing pages.
- **Phase 5 — Storybook rebuild:** all old stories migrated or retired; Mantine stories cover all migrated
  surfaces; no old-canvas proof for migrated stories; PASS/FAIL stories exist; rendered proof Mantine-native.
- **Phase 6 — Full UI cutover:** entire UI migrated to Mantine; legacy layer no longer used by product surfaces;
  old Tailwind/Base UI/shadcn-style responsive docs retired; old wrappers deleted/quarantined; full
  screenshot/assert matrix re-baselined under Mantine; owner visual QA completed.

Phases 2–6 are FUTURE numbered tasks (each its own kickoff). This task delivers Phases 0–1 + the full program.

---

## 14. Governance freeze (pointer in `docs/rule-index.md` + stated in the doc)

> **Until Task 482 (Mantine foundation) is accepted and the migration roadmap approved:** no new UI/responsive
> product task may start on the old system; old Base UI/Tailwind/shadcn-style components are LEGACY; old
> Storybook responsive proof is LEGACY; old responsive docs are LEGACY; critical production UI defects may be
> fixed only as containment; new UI work must target Mantine; future UI migration tasks must map to a Mantine
> canonical pattern; **any task using Tailwind breakpoint classes as new responsive canon FAILS review.**

This freeze does NOT block DB/security/permissions/i18n work unless the task changes UI layout/components.

---

## 15. Implementation files (create/modify) + do-not-touch

**Expected:** `package.json`; lockfile; `postcss.config.mjs` (only if Mantine setup requires it); the root App
Router layout/provider boundary file; `src/design-system/mantine/theme.ts`;
`src/design-system/mantine/MantineRootProvider.tsx`; **`src/design-system/mantine/patterns/**` — the reusable
canonical Mantine pattern components (the source of truth for the patterns)**; Storybook preview/config for
MantineProvider + Mantine-native story proof; **`src/stories/patterns/mantine/**` — Storybook proof ONLY, each
story importing from `src/design-system/mantine/patterns/**`**; `docs/mantine-responsive-design-system.md`;
`docs/rule-index.md`; `docs/backlog.md`; session log under `docs/sessions/`.

**Required reusable pattern component files (all 14):**
`src/design-system/mantine/patterns/MantineAppShellFoundation.tsx` ·
`…/MantinePageHeaderWithActions.tsx` · `…/MantineFormSectionStack.tsx` · `…/MantineTwoColumnForm.tsx` ·
`…/MantineResponsiveActionFooter.tsx` · `…/MantineCardGrid.tsx` · `…/MantineDataTableToCards.tsx` ·
`…/MantineDialogDrawerPattern.tsx` · `…/MantineEmptyLoadingErrorState.tsx` · `…/MantineNotificationPattern.tsx` ·
`…/MantineListingCardPattern.tsx` · `…/MantineListingDetailPattern.tsx` · `…/MantineAdminSurfacePattern.tsx` ·
`…/MantineAuthFormPattern.tsx` (optional `…/patterns/index.ts` barrel).

**Do NOT touch:** DB migrations unrelated to Mantine; Supabase actions; permissions logic; i18n message files
(except story/demo strings if existing story rules require them); product components — except a tiny
import/provider-boundary change where technically required.

---

## 16. Positive & Negative flows

**Positive flow:** (1) inspect official Mantine docs + repo provider/Storybook/PostCSS reality → record evidence,
package decision, Tailwind-v4 coexistence verdict. (2) build the full UI inventory (§6) + reconciling counts
(§7). (3) install minimal Mantine; wire root `MantineProvider`+`ColorSchemeScript`+CSS at the correct boundary;
wire Storybook Mantine-native proof. (4) create `theme.ts`+`MantineRootProvider.tsx`, the 14 canonical patterns,
and the 14 `Patterns/Mantine/*` story groups with the full state matrix. (5) write
`docs/mantine-responsive-design-system.md` (17 sections incl. inventory, counts, map, roadmap, freeze, gates,
open decisions), add the §14 governance pointer, run validation (§18), update `docs/backlog.md`, write the
session log. **Success:** Mantine is source of truth in app + Storybook; theme + 14 patterns + stories render
Mantine-native; full inventory/counts/map/roadmap exist; legacy layer untouched as product code; gates green.

**Negative flow:** Tailwind v4 ↔ Mantine can't cleanly coexist → STOP & ASK (don't rip out Tailwind/globals
tokens). Provider boundary ambiguous → smallest boundary wrapping all UI; if ambiguous → STOP & ASK (no
duplicate providers). A package seems needed beyond the justified set → don't install; note as future phase or
STOP & ASK. Temptation to migrate a product surface before foundation/patterns exist → STOP (out of scope). A UI
source can't be confidently classified → mark `BLOCKED — OWNER/ARCHITECTURE DECISION REQUIRED` with the missing
decision (listed in doc §17). `screenshots:assert` can't target only Mantine stories → document the limitation,
provide explicit Storybook render proof; do NOT claim a product-wide matrix. Mantine used without a client
boundary → fix the boundary. Validation red → fix within scope or STOP & ASK.

---

## 16a. Mandatory post-execution review file checklist

After Sonnet execution, the orchestrator MUST inspect these files before approval:
- `.storybook/preview.tsx`
- `package.json`
- `postcss.config.mjs`
- `src/app/layout.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/app/globals.css`
- `docs/design-system.md`
- `docs/storybook-governance.md`
- `docs/rule-index.md`

This checklist is mandatory because these files can preserve or reintroduce the failed legacy responsive system.
**Approval is forbidden unless the orchestrator explicitly reports the review result for every file in this
checklist.**

| File | Required post-execution verification |
|---|---|
| `.storybook/preview.tsx` | Mantine stories render through `MantineProvider`; `Patterns/Mantine/*` are not proven by old `withCanvas`, `.container-wide`, Tailwind breakpoint classes, fake wrappers, or viewport-specific hardcode; legacy stories may remain supported only during migration. |
| `package.json` | Only justified Mantine packages are added; no Tailwind Plus; no Radix migration; no random UI libraries; existing scripts remain intact. |
| `postcss.config.mjs` | Mantine / Tailwind v4 coexistence is explicit and build-safe; no silent rewrite of Tailwind/global token architecture; no hidden CSS-layer hack that makes Mantine dependent on old Tailwind responsive rules. |
| `src/app/layout.tsx` | Correct App Router Mantine boundary; `ColorSchemeScript` and Mantine CSS are placed according to official Mantine setup; no duplicate-provider mistake. |
| `src/app/[locale]/layout.tsx` | Locale provider remains correct; Mantine integration does not break i18n boundaries or duplicate providers. |
| `src/app/admin/layout.tsx` | Admin layout is not randomly migrated; provider inheritance is correct; no duplicate Mantine provider unless explicitly justified. |
| `src/app/globals.css` | Old Tailwind responsive system is not promoted as future canon; no destructive global rewrite; no new responsive hardcode for Mantine stories. |
| `docs/design-system.md` | Old design-system is not still presented as the future responsive source of truth; it is explicitly demoted or points to `docs/mantine-responsive-design-system.md` as the new authority. |
| `docs/storybook-governance.md` | Storybook governance does not contradict Mantine-native proof; old proof layer is legacy for Mantine stories; no rule requires Mantine stories to pass through old canvas. |
| `docs/rule-index.md` | Governance freeze exists and points to Task 482 / `docs/mantine-responsive-design-system.md`; future UI work targets Mantine. |

**If any mandatory file contradicts Mantine as the new responsive UI design-system source of truth, the task
FAILS. If `.storybook/preview.tsx` still proves new Mantine stories through the old legacy canvas, the task
FAILS. If `docs/design-system.md` or `docs/storybook-governance.md` still leaves old Tailwind responsive rules
as active future canon without demotion or pointer to Mantine, the task FAILS.**

---

## 17. 🔴 P0 review gate (future-task acceptance gates + this task's gate)

Orchestrator runs this at review and reports each row; **any FAIL = return for REWORK, no approve, no commit.**

| Gate | Required evidence | Pass/Fail |
|---|---|---|
| Task number stays 482; no 483 created | file name + backlog | |
| Tailwind Plus retired; Mantine = source of truth | doc §1–3 | |
| Official Mantine evidence recorded | session log links + setup notes | |
| Minimal justified package set installed | §5 table + lockfile | |
| MantineProvider integrated at correct App Router boundary (RSC-safe) | diff + `ColorSchemeScript`/CSS | |
| Storybook renders Mantine stories via MantineProvider, NOT old canvas/`.container-wide`/Tailwind breakpoints | preview config + story diff | |
| Full UI inventory complete; every source exactly one class | doc §9 table | |
| Classification counts reconcile to inventory total | doc §10 table | |
| Legacy-to-Mantine map complete (all categories) | doc §11 table | |
| 14 canonical patterns defined | doc §12 table | |
| 14 `Patterns/Mantine/*` story groups with required states + PASS/FAIL | stories diff | |
| Canonical Mantine patterns are reusable components, not Storybook-only demos | `src/design-system/mantine/patterns/**` + stories importing them | |
| Full roadmap Phase 0–6, each phase fully specified | doc §14 | |
| Governance freeze added | `docs/rule-index.md` | |
| No random product migration before foundation | diff + Files Changed | |
| No DB/security/permissions logic changed | diff | |
| Mandatory post-execution review files inspected | orchestrator explicitly reviewed `.storybook/preview.tsx`, `package.json`, `postcss.config.mjs`, root/locale/admin layouts, `globals.css`, `design-system.md`, `storybook-governance.md`, and `rule-index.md`; no file contradicts Mantine as source of truth | |
| Exact self-validation marker line present | final report | |

The new doc's section 16 ("Future-task acceptance gates") restates this so future migration slices inherit it:
a future UI slice is accepted ONLY if it maps to a Mantine canonical pattern, proves it Mantine-native in
Storybook, and uses no Tailwind breakpoint classes as new responsive canon.

---

## 18. Validation (run or require owner-native run; paste transcript)

Package install result · `npm run typecheck` (0 errors) · `npm run lint` (0 new) · `npm run check:i18n` (green)
· `npm run check:stories` (green) · Storybook build or render validation · Mantine foundation stories render ·
`screenshots:assert` for Mantine foundation stories **if** the harness can target them (else document the
limitation + provide explicit Storybook render proof) · file-integrity check (0 NUL, parses, not truncated).

**No product-wide screenshot matrix may be claimed complete** until migration phases reach product surfaces.

---

## 19. Hard rejection rules (any one = REWORK)

Reject if Sonnet: keeps Tailwind as the future responsive authority; writes "Mantine-inspired Tailwind"; makes
new Mantine stories pass through old `.container-wide`; uses Tailwind breakpoint classes in new Mantine pattern
stories; creates only demo stories without the full migration map; creates only docs without
provider/theme/Storybook implementation; installs Mantine but does not make it source of truth; leaves Storybook
Mantine proof dependent on the old canvas; omits the full UI inventory; omits migration classification counts;
omits the full legacy-to-Mantine map; omits the full roadmap to complete UI cutover; migrates random product UI
before foundation + patterns exist; claims full migration complete in this first execution; changes
DB/security/permissions logic; **implements canonical Mantine patterns only inside Storybook story files (not as
reusable components under `src/design-system/mantine/patterns/**`)**; creates Task 483.

**Post-execution review rejection rules (orchestrator side):** Reject if orchestrator approval does not
explicitly inspect the mandatory post-execution review file checklist (§16a). Reject if any mandatory review
file contradicts Mantine as the new responsive UI design-system source of truth. Reject if
`.storybook/preview.tsx` still proves new Mantine stories through the old legacy canvas. Reject if
`docs/design-system.md` or `docs/storybook-governance.md` still leaves old Tailwind responsive rules as active
future canon without demotion or pointer to Mantine. Reject if `package.json` adds Tailwind Plus, Radix
migration, random UI libraries, or unapproved Mantine packages. Reject if `postcss.config.mjs` silently rewrites
Tailwind/global token architecture instead of establishing safe Mantine coexistence. Reject if root/locale/admin
layout changes duplicate providers, break i18n boundaries, or randomly migrate admin/product UI outside the
foundation scope.

---

## 20. Hard contract (P0 — verified against the real diff)

- Scope = MASTER plan + Phase 0–1 implementation. No random product migration; no rewrite/removal of legacy
  `src/components/ui|layout|admin/*`; Base UI stays installed; no DB/security/permissions/i18n logic touched.
- Mantine is the implemented source of truth (provider + theme + Storybook + patterns), not just documented.
- Self-validates BEFORE complete (clause 9): typecheck=0, AC-by-AC table, the exact §21 marker line.
- Updates `docs/backlog.md` + session log with a **Files Changed** table (one row/path + 1-line rationale).
- Does NOT emit `git add`/`git commit` — the **orchestrator** emits commit commands at review (single-writer).
- File-integrity (clause 14): every written file read back, complete, 0 NUL bytes, parses.

---

## 21. Required final report (all mandatory)

1. Files Changed table. 2. Official Mantine evidence summary. 3. Package decision table. 4. Provider integration
summary. 5. Theme architecture summary. 6. Storybook Mantine proof summary. 7. Full UI inventory summary.
8. Migration classification counts. 9. Legacy-to-Mantine map. 10. Canonical Mantine patterns. 11. Created
Storybook pattern stories. 12. Storybook legacy-proof rejection summary (what legacy proof was demoted/bypassed).
13. Full migration roadmap Phase 0–6. 14. Governance freeze summary. 15. Out-of-scope confirmation. 16.
Validation transcript. 17. AC-by-AC table.
18. **Mandatory post-execution review file checklist** — one row for each required file, with verdict and
evidence. **Every row must be filled; any missing row = task FAILS:**

| File | Reviewed? | Verdict | Evidence |
|---|---|---|---|
| `.storybook/preview.tsx` | | | |
| `package.json` | | | |
| `postcss.config.mjs` | | | |
| `src/app/layout.tsx` | | | |
| `src/app/[locale]/layout.tsx` | | | |
| `src/app/admin/layout.tsx` | | | |
| `src/app/globals.css` | | | |
| `docs/design-system.md` | | | |
| `docs/storybook-governance.md` | | | |
| `docs/rule-index.md` | | | |

Final self-validation line — EXACTLY these tokens:
```
Self-validation: Task482=reused · TailwindPlus=retired · Mantine=source-of-truth · old-responsive-system=legacy · old-storybook-proof=legacy · mantine-provider=integrated · mantine-theme=created · storybook-mantine=integrated · mantine-native-proof=present · full-ui-inventory=complete · migration-map=complete · canonical-patterns=complete · canonical-pattern-components=reusable · mandatory-review-files=inspected · product-random-migration=not-done · full-migration-roadmap=present · typecheck=0 · lint=0-new · check:i18n=0 · check:stories=0
```

---

## 22. Acceptance criteria (task passes ONLY if all true)

1. Task number remains 482.
2. Tailwind Plus path is retired.
3. Mantine is established as the only future responsive UI design-system authority.
4. Old Tailwind/Base UI/shadcn-style responsive system is explicitly legacy.
5. Old Storybook responsive proof layer is explicitly legacy.
6. Mantine packages are installed and justified.
7. MantineProvider is integrated at the correct App Router boundary.
8. Mantine theme exists and defines the project responsive system.
9. Storybook renders Mantine stories through MantineProvider.
10. Mantine foundation stories are NOT proven by `.container-wide`, old `withCanvas`, or Tailwind breakpoint classes.
11. Full UI inventory exists.
12. Migration classification counts reconcile.
13. Legacy-to-Mantine map exists.
14. Canonical Mantine patterns exist (all 14).
15. Storybook stories exist for every canonical Mantine pattern (all 14 groups + required states + PASS/FAIL).
16. Full migration roadmap Phase 0–6 exists.
17. Governance freeze is added.
18. No random product migration is performed before foundation approval.
19. No DB/security/permissions logic is changed.
20. Validation transcript is present.
21. Final self-validation line is present with all required tokens.
22. Canonical Mantine patterns are implemented as reusable components under `src/design-system/mantine/patterns/**`, not only as Storybook demos.
23. Every `Patterns/Mantine/*` story imports and proves the reusable canonical pattern component.
24. Orchestrator post-execution review explicitly inspects the mandatory file checklist: `.storybook/preview.tsx`, `package.json`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`, `src/app/admin/layout.tsx`, `src/app/globals.css`, `docs/design-system.md`, `docs/storybook-governance.md`, and `docs/rule-index.md`.
25. None of the mandatory review files contradict Mantine as the new responsive UI design-system source of truth.
26. `.storybook/preview.tsx` does not prove new `Patterns/Mantine/*` stories through old `withCanvas`, `.container-wide`, Tailwind breakpoint classes, fake wrappers, or viewport-specific hardcode.
27. `docs/design-system.md` and `docs/storybook-governance.md` do not remain active future responsive authorities for new UI work; they are demoted or explicitly point to `docs/mantine-responsive-design-system.md`.
28. `package.json`, `postcss.config.mjs`, and root/locale/admin layouts preserve scope discipline: Mantine foundation only, safe coexistence, no random UI library, no duplicate provider mistake, no product migration.
