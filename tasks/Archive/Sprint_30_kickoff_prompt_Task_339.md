# Sprint 30 — Task 339 kickoff (Opus) — Global clickable-area / hover-target consistency audit + Sonnet fix sub-task

> **You are Opus 4.7 orchestrator / architect / reviewer.** Planning + spec only. Allowed: `docs/`, `tasks/`. Forbidden: `src/`, `messages/`, migrations, scripts. Single-writer git.
>
> **Numbering:** Task 339 = Opus architectural (renumbered from old "338"). Sonnet sub-task ≥ 343 (single comprehensive audit + fix; not split per surface). Wave 2.
>
> **Source:** `issues.md` 2026-05-31 — "Create global clickable-area / hover-target consistency audit + Sonnet fix task".

```
Type:     bugfix / UX / accessibility (global)
Priority: high
Area:     docs/clickable-area-rules.md (NEW) OR addendum §18 to docs/ui-rules.md
          tasks/Sprints/Sprint_30_kickoff_prompt_Task_<NEXT_FREE>.md (NEW Sonnet ≥ 343)
          docs/sessions/2026-05-31-task-339-clickable-area-audit.md
```

## Pre-read

1. `docs/agent-contract.md`, `docs/orchestrator-role.md`, `docs/backlog.md`
2. `docs/ai-behavior.md` Notes 14 / 18 / 19 / 20
3. `docs/ui-rules.md` (§0 + §15 + §16 + §17)
4. `docs/component-rules.md` + `docs/component-governance.md` §1
5. `docs/qa-rules.md`
6. `tasks/Epics/Epic_Q_Combobox_and_UI_Primitive_Single_Source.md` + `Epic_CC_Combobox_v2.md`
7. `src/components/layout/Header.tsx`
8. `src/components/ui/dropdown-menu.tsx` (canonical primitive)
9. `src/components/shared/LocaleSwitcher.tsx`
10. Sidebar + admin row-action components

## Owner-reported problem

In user dropdown menu, items visually show hover over WHOLE ROW, but click works only when cursor is directly over text. Hover background = full row; clickable target = text/icon only.

Owner example — Header user dropdown (Profile / My listings / Add listing / Admin panel / Logout). Likely exists globally.

## Core UX rule (to encode in Sonnet sub-task)

The clickable target MUST match the visual interactive target.

If component shows hover/focus/active/cursor-pointer/background/ring/border over FULL row/card/button area, then the full visible interactive area MUST be clickable/tappable AND keyboard-focusable as the same action.

Text-only click targets are acceptable ONLY when the visual affordance is also text-only.

## Triage rule (per owner comment on Task 339)

Sonnet sub-task scope is broad — global grep WILL find many candidates. Triage:

| Bucket | Action |
|---|---|
| **Must fix now** | Shared primitives (`dropdown-menu.tsx`, `Button`, `Link`, `LocaleSwitcher`), header user dropdown, language/currency dropdowns, mobile nav, obvious menu rows. **Fix root pattern in shared primitive first → consumers inherit.** |
| **Document follow-up** | Low-risk locations OR large rewrites (admin tables with non-standard row hover; legacy form CTAs; complex listing card hover states that would require larger refactor). List in session log as follow-up tasks. |

## Required Opus output

### 1. Canonical doc `docs/clickable-area-rules.md` (NEW)

Recommend new dedicated doc; cross-reference from `docs/ui-rules.md` §18 + `docs/rule-index.md`.

Sections:

1. Rule statement.
2. **Anti-pattern inventory** (search targets):
   - `<Link>` wrapping only text inside larger hoverable parent.
   - `<button>` / `<a>` nested inside `<div>` / `<li>` that owns hover background.
   - `hover:*` on parent while `onClick` / `href` only on child.
   - `DropdownMenuItem` / `SelectItem` with `asChild` making only text clickable.
   - `cursor-pointer` on non-clickable parent.
   - `group-hover:*` on parent while only child is interactive.
   - `inline-flex` / `w-fit` / `fit-content` links inside full-width menu rows.
   - `onClick` on child `<span>` / icon instead of row/button.
   - `pointer-events-*` shrinking or blocking hit target.
   - Absolute overlay blocking clicks (Note 16 z-index).
   - Nested interactive elements (a11y).
   - `<div role="button">` where `<button>` / `<a>` should be used.
   - Mobile-only wrappers where touch target ≠ desktop target.
3. **Preferred fix patterns:**
   - Semantic interactive element OWNS visible hover/focus/padding/background area.
   - Menu rows: full row = `Link` / `Button` / `DropdownMenuItem` action.
   - `display: block` / `flex`, `width: 100%`, full padding, full hit area when row visually behaves as row.
   - `Link` for navigation, `button` for actions, form controls for form actions.
   - Tab focus + Enter/Space activation + visible focus state.
   - Accessible names + ARIA preserved.
   - No nested interactive elements.
4. Audit scope (full list per `issues.md`).
5. Localization invariance — fixes MUST NOT depend on label width.
6. Responsive invariance — clickable area = visible area at every canonical width.
7. **Triage** (must-fix-now vs document-follow-up).

### 2. Sonnet sub-task kickoff (Opus writes file ≥ 343)

Title: `Task <NEXT_FREE> — Sonnet: Fix global clickable-area / hover-target consistency (root pattern in shared primitives + must-fix consumers)`.

The Sonnet sub-task MUST follow Canonical Task Template + include ALL: Pre-read · Current behavior to preserve · Required after behavior · **Positive flow** (user clicks anywhere on visible hover area → action fires) **· Negative flow** (text-only link inside paragraph remains text-only; disabled/loading states preserved; nested-interactive avoided; keyboard nav valid) · Implementation · AC (citing both flows) · Out of scope · Validation (pnpm) · Manual QA · Final report.

**Sonnet audit phase** (in session log):
```
rg -n "cursor-pointer|hover:|group-hover|onClick=|role=\"button\"|DropdownMenuItem|MenuItem|SelectItem|asChild|<Link|<button|pointer-events|inline-flex|w-fit|fit-content" src app components modules
rg -n "DropdownMenu|Menu|Popover|Sheet|Sidebar|Header|Topbar|User|Account|Navigation|Footer|Button|Link" src app components modules
```

**Sonnet implementation phase:**
1. Fix root pattern in shared primitives (`dropdown-menu.tsx`, etc.) → consumers inherit.
2. Fix must-fix-now consumers (header dropdown, locale switcher, obvious menu rows).
3. Document document-follow-up bucket in session log.
4. Verify each fix at all 14 canonical widths × 4 locales.

**Sonnet AC** (per `issues.md`):
- Header user dropdown clickable across full row at every locale + breakpoint.
- All discovered must-fix instances fixed OR documented as document-follow-up with reason.
- Shared primitives fixed.
- Text-only links remain text-only ONLY when visual affordance is text-only.
- No control / route / permission / mutation / auth behavior change.
- No nested-interactive regression.
- Keyboard nav valid; focus visible + aligned with clickable area.
- Disabled / loading states preserved.
- sq/en/uk/it verified.
- 14 canonical widths verified.

### 3. Session log + backlog update

Standard.

## Required investigation

1. Read `src/components/layout/Header.tsx` (user dropdown).
2. Read `src/components/ui/dropdown-menu.tsx` — determine if bug is in primitive OR one-off consumer.
3. Read `src/components/shared/LocaleSwitcher.tsx`.
4. Sample 3–5 admin row-action sites.
5. Sample listing card CTA + footer link CTAs.

## Acceptance criteria for THIS Opus task

- Rule encoded in canonical doc; cross-referenced from `docs/ui-rules.md` §18 + `docs/rule-index.md`.
- Anti-pattern inventory documented.
- Preferred fix patterns documented.
- Audit scope documented.
- Triage rule (must-fix-now vs document-follow-up) documented.
- Sonnet sub-task kickoff written with ALL canonical sections.
- `docs/backlog.md` + session log updated.
- NO `src/` / `messages/` / migration changes.

## Out of scope

- Do NOT redesign header/dropdown visual style.
- Do NOT change menu item order or labels.
- Do NOT change permissions or visibility rules.
- Do NOT add new features.
- Do NOT rewrite unrelated navigation architecture.
- Do NOT replace the design system.
- Do NOT fix unrelated responsive bugs.
- Do NOT remove hover/focus states.
- Do NOT hide existing actions.

## Validation

```
rg -n "cursor-pointer|hover:|DropdownMenuItem|asChild" docs tasks src
git status --short
```

## Final report

Files changed; clickable-area rule doc path; anti-pattern inventory summary; triage rule; audit scope; Sonnet sub-task path; validation; no `src/` / `messages/` / DB changes confirmation; explicit-path owner git commands.
