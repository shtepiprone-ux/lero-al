# Session: Sprint 32 owner-rejection corrective planning (Opus orchestrator)

**Date:** 2026-06-03
**Role:** Opus 4.7 orchestrator / architect / reviewer. ZERO product code — docs/tasks only.
**Trigger:** Owner rejected ALL Sprint 32 Storybook/UI/DS tasks after rendered QA. Requirements were ignored or
watered down. This is a process + task-quality failure, not a single bug.

## 1. Statement (no defense)
**ALL Sprint 32 implementation tasks 360–371 are OWNER-REJECTED and NOT approved** (owner directive 2026-06-03:
"у всіх задачах 360-371 не виконані вимоги від власника проекту"). This includes 360, 361, 362, 363, 364, 365 and the
later-written 369, 370, 371 (366/367/368 are planning tasks). None is marked approved. The defects are accepted as real
owner-reported failures — NOT "OWNER QA REQUIRED".

**Scope of the story sweep = EVERY story, no exceptions** (owner directive 2026-06-03: "корективний план має покривати
усі, без винятку, Stories"). There are **26** `*.stories.tsx` files (full list in Corrective F). The audit is not
limited to the screenshotted components — problems are assumed present across all stories until each is verified
conformant against the canonical checklist.

## 2. Requirement → miss matrix (file-verified)

| Owner requirement | Original task | What shipped | File evidence | Root cause | Corrective |
|---|---|---|---|---|---|
| Tabs underline = **default**; old styles removable | 360 | underline made **opt-in** `variant="underline"`; 6 consumers stay pill/fill | `ui/tabs.tsx` `default:"bg-muted"`; consumers in `ListingsStatusTabs/CabinetShell/AdminPagesManager/AdminFooterManager/AdminEmailTemplatesManager/AdminCurrencyTabs` | **Opus mis-spec** (kickoff said "additive opt-in") | A |
| Buttons full-width <640px (all text buttons) | 360 | only `size="xl"`,`"tab"` got `max-sm:w-full` | `ui/button.tsx:28` only `xl`/`tab`; `default/sm/lg/xs` none | **Opus under-spec** + Sonnet narrow pass | A |
| Dialog clean, no scroll defects | 361 | inner `overflow-y-auto` + `absolute` close + `bg-muted/50` footer + backdrop-blur → h-scroll, scrollbar over X, gray bg | `ui/dialog.tsx:56,61,70,107,34` | Sonnet visual fail + Opus vague AC | B |
| FilterBar clear vertical hierarchy (search row first) | 362/369 | flex-wrap row; search floats mid-row; reset/count float | `layout/FilterBar.tsx:45-71` | **Opus mis-spec** (asked alignment, not hierarchy) | C |
| Phone AL = exactly 9 digits; block >9, letters, symbols at input | 363 | strips non-`[\d\s\-().]` only; no max-9; libphonenumber validate-on-submit | `shared/PhoneField.tsx:75-82`, `lib/phone/index.ts:97-160` | **Opus under-spec** + Sonnet partial | D |
| Phone placeholder national-only | 363 | `phone_placeholder="+355 XX XXX XXXX"` repeats dial code | `messages/*.json` | Opus under-spec | D |
| StoryListingCard no governance/i18n leaks | 365 | raw `<button>`, English aria-labels, visible `"2h ago"` | `stories/StoryListingCard.tsx:128,130,191,195,204` | Sonnet governance violation | E |
| PasswordInput localized in all 4; uk-stress pinned | 365/369 | uk story pins `locale:'uk'` but renders English | `ui/PasswordInput.stories.tsx:131` + `auth` keys / Storybook intl provider | Sonnet/infra i18n fail | E |
| RVS + AdminLayout wire Storybook Actions via `fn()`/args | 365 | only `useState` in-canvas | `stories/AdminLayout.stories.tsx:30,76`, `RecentlyViewedSection.stories.tsx:111` | Sonnet ignored requirement | E |
| Select trigger shows label not raw value | 365/371 | `<SelectValue/>` shows raw value (`in_progress`,`tirana`) | `ui/select.tsx:21-29` | (folded into E or kept as 371-scope) | E |

## 3. Root-cause assessment
- **Opus (task-writing) failures:** softened owner intent into narrow, technically-passable ACs (Tabs "opt-in" vs
  "default"; Button scoped to `xl/tab`; FilterBar "alignment" vs "hierarchy"; Phone "reject non-digits" vs "exactly 9").
  Allowed "OWNER QA REQUIRED" to stand in for visible defects.
- **Sonnet (execution) failures:** narrow AC satisfaction; raw `<button>` + English leaks in story helpers; visual
  defects shipped while self-audit claimed green; ignored explicit Actions-panel + underline-default requirements.
- **Fix:** corrective tasks A–E below encode the owner's literal UI/UX outcomes as concrete, visible, file-verifiable
  ACs with negative branches, full locale + breakpoint coverage, and forbidden-pattern grep gates.

## 4. Corrective sprint plan (each independently reviewable, exact file scope)
- **Corrective A** — Tabs underline-as-default + Button mobile full-width (primitives + all consumers).
- **Corrective B** — Dialog visual model correction (no h-scroll, no overlap, no gray bg, designed scroll model).
- **Corrective C** — FilterBar desktop owner hierarchy redesign (search row → active → available → reset/count).
- **Corrective D** — PhoneField Albanian 9-digit validation hardening (input + paste + schema + tests + placeholder).
- **Corrective E** — Storybook governance/i18n STANDARD + deep fixes (StoryListingCard leaks, PasswordInput i18n infra, Select label, Actions-panel pattern). Establishes the canonical story rules Corrective F enforces everywhere.
- **Corrective F** — FULL per-file conformance sweep over ALL 26 `*.stories.tsx` (owner "all stories" directive). Per-file × per-check matrix; nothing skipped; forbidden-pattern grep gates; all 4 locales + all breakpoints.

The 26 story files (Corrective F scope): AdminCardList, AdminPageShell, AdminTable, StatusChangeControl,
StatusChangeHistory, FilterBar, PageHeader, PageShell, Section, Combobox, PasswordInput, PasswordRequirementsHint,
badge, button, checkbox, dialog, input, select, sheet, skeleton, tabs (under `src/components/**`), and AdminLayout,
Containers, EmptyState, ListingGrid, RecentlyViewedSection (under `src/stories/`).

Files: `tasks/Sprints/Sprint_32_CORRECTIVE_{A..F}_*.md`.

## 5. Files Changed
| File | Rationale |
|------|-----------|
| `docs/sessions/2026-06-03-sprint-32-owner-rejection-corrective-planning.md` | This planning log |
| `tasks/Sprints/Sprint_32_CORRECTIVE_A_Tabs_Button.md` | Corrective A kickoff |
| `tasks/Sprints/Sprint_32_CORRECTIVE_B_Dialog.md` | Corrective B kickoff |
| `tasks/Sprints/Sprint_32_CORRECTIVE_C_FilterBar.md` | Corrective C kickoff |
| `tasks/Sprints/Sprint_32_CORRECTIVE_D_Phone.md` | Corrective D kickoff |
| `tasks/Sprints/Sprint_32_CORRECTIVE_E_StorybookGovernance.md` | Corrective E kickoff |
| `tasks/Sprints/Sprint_32_CORRECTIVE_F_AllStoriesConformanceSweep.md` | Corrective F kickoff (all 26 stories) |
| `docs/backlog.md` | Mark Sprint 32 owner-rejected + corrective queue |

No product code changed. No git run. Owner runs commits in PowerShell.
