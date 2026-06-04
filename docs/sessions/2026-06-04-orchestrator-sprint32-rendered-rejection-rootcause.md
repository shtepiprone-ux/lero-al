# Session Log — Orchestrator root-cause + self-audit: Sprint 32 stories REJECTED on rendered QA

**Date:** 2026-06-04
**Role:** Opus 4.8 orchestrator / reviewer / QA
**Trigger:** Owner manually rendered every Storybook story (sq/en/uk/it × all breakpoints) and found the
Sprint 32 correctives (Tasks 372, 373, 374, 375, 376, 379) FAIL on the rendered canvas, despite the
orchestrator having "approved" 372–375 + 379 from diff review. Owner uploaded `Stories_fails.zip`
(rendered evidence per story). Status before this log: 372–379 implemented but **UNCOMMITTED**.
**Verdict:** ALL approvals of 372–375/379 are **RESCINDED**. 376 was never reviewed; 377 never ran.
A new corrective sprint (Sprint 33, Tasks 380–383) replaces the 377 sweep with an **enforced** model.

---

## 1. What the owner found (rendered, per story)

Owner PASS/FAIL ledger (rendered): **FAIL** on AdminCardList, AdminPageShell, AdminTable,
StatusChangeHistory, PageHeader, PageShell, Section, PasswordInput, Badge, Button, Checkbox, Dialog,
Input, Select, Skeleton, Tabs, AdminLayout, Containers, ListingGrid, RecentlyViewedSection.
**PASS** only: StatusChangeControl, FilterBar, Combobox, PasswordRequirementsHint, Command,
DropdownMenu, Popover, Sheet, EmptyState. Plus explicit "delete the Ukrainian Locale / Mobile Form
Ukrainian story" notes on Badge, Button, Input, EmptyState, ListingGrid, RecentlyViewedSection,
PasswordInput.

I reproduced and confirmed every category against the actual code and the screenshots.

---

## 2. Systemic root causes (confirmed in code — NOT pointwise)

### RC-1 — The Storybook canvas layout silently defeats the OWNER P0 "mobile <640 full-width" rule.
The Button primitive is **correct**: `button.tsx` has `max-sm:w-full max-sm:min-h-11 …` on **every**
text size variant. Yet `Button/Default` renders content-width and centred at 320px. Cause:
`button.stories.tsx` sets `parameters.layout: 'centered'`, which makes Storybook wrap the story in a
shrink-to-content, centred flex box — so `w-full` resolves to "100% of a content-width box" and the
button stays small and centred. Same mechanism breaks `Badge` (centred), `Checkbox`, `Dialog` trigger,
`PasswordInput`.
- `layout: 'centered'` in **5** story files (button, badge, checkbox, PasswordInput, PasswordRequirementsHint).
- `layout: 'padded'` in **11** story files — adds a gutter that is not the real page gutter and eats width at 320.
- There is **no global decorator** that renders each story in a true, full-available-width, mobile-accurate
  canvas. So the P0 is unverifiable from the canvas and frequently looks broken even when the primitive is right.
- **This single root cause explains the Button / Badge / Dialog / Select-trigger / Checkbox "not full-width / centred" FAILs.**

### RC-2 — Hardcoded user-facing strings live in fixtures and inline story arrays.
`src/stories/fixtures/listing.fixture.ts` hardcodes English titles (`'Modern Apartment in Tirana Center'`,
`'Cozy Studio in Sauk District'`, the 8-item `LISTINGS_GRID_FIXTURE` array) and a single hardcoded
**Ukrainian** long title — so ListingGrid / RecentlyViewedSection / AdminCardList leak English on the sq/uk/it
canvases. `select.stories.tsx` + `Combobox.stories.tsx` hand-maintain per-locale option maps (English used
for "Long Label Locale Stress"); `AdminTable.stories.tsx` hardcodes `role: 'Agent'/'User'/'Moderator'`;
`button.stories.tsx` `AllVariantsDemo` uses `['Primary','Outline',…]`. The governance doc *already requires*
per-locale fixture maps — but **nothing enforces it**, so the batch "fix" in Task 376 left the raw fixture file
untouched and the leaks remain.

### RC-3 — Redundant locale-pinned "Ukrainian" stories duplicate the locale toolbar.
`PasswordInput.UkrainianLocaleStress`, `PasswordRequirementsHint.UkrainianLocale`, `input.MobileFormUkrainian`,
`EmptyState.UkrainianLocale`, `RecentlyViewedSection.UkrainianLocale` (and per-component hardcoded uk render
fns) exist alongside the locale toolbar that already renders uk. Task 376 removed the `globals:{locale:'uk'}`
**pin** but kept the redundant **exports**. Owner wants them deleted; keep exactly one toolbar-reactive
`LocaleStress` export per component (longest-string content from the i18n layer, never a hardcoded uk fixture,
never named "Ukrainian").

### RC-4 — Component-layout defects the primitive tasks missed.
- **Tabs**: `tabs.tsx` list is `inline-flex w-fit … overflow-x-auto justify-center` with `max-sm:w-full`. At 320
  the centred scroll origin **clips the first tab on the left** and the list is not truly full-width. (primitive)
- **Select trigger**: not `max-sm:w-full`; long label clipped by the chevron, canonical internal padding/height not held. (primitive)
- **AdminLayout toolbar**: header + search do not stack vertically at <640 → search overflows the right edge. (story/layout)
- **RecentlyViewedSection**: header wraps to 4 cramped lines (no vertical stack) AND the story deliberately shows
  the horizontal scrollbar ("scrollbar visible in story for QA") — owner rejects this; production uses `no-scrollbar`. (story)
- **Skeleton**: hardcoded pixel widths instead of canonical responsive adaptation. (story)

### RC-5 (META) — Why review let this through (the holes the owner asked me to find).
1. **I approved 372–375/379 from the diff of the primitives alone.** The primitive classes were correct on
   paper, so the diff "looked right" and tsc=0/lint=0/build=✅ were taken as sufficient. I did **not** require or
   inspect a rendered matrix at uk@320/375/390 — which would have immediately exposed the `layout:'centered'`
   masking. **This is a direct violation of agent-contract clause 12 ("It compiles is NOT proof") that I am
   supposed to enforce on others.**
2. **Task 376 was never orchestrator-reviewed** (owner confirms). It was redone v1→v2→v3 by batch script and is
   uncommitted. **Task 377 — the conformance sweep whose entire purpose is to catch exactly these rendered
   defects — never ran**, because it was gated behind 376's review.
3. **The governance was prose + self-reported greps only.** `docs/storybook-governance.md` already states the
   correct rules (per-locale fixture maps, toolbar-reactive Locale Stress, no raw controls). They failed anyway
   because there is **no machine gate** that fails the build on: `layout:'centered'|'padded'` in a story, a raw
   user-facing string literal in a story/fixture, a `Ukrainian*`-named story, or a <640 horizontal overflow.
   Sonnet can (and did) self-report PASS with "build-storybook exit 0". The rendered matrix was logged as
   "NOT CHECKED — no browser access" and I approved anyway.

**Lesson, in one line:** *rules that are not machine-enforced and proof that is not machine-produced do not
survive contact with Sonnet.* The corrective must make hardcode and non-full-width **impossible to commit**, and
make rendered evidence **automatic**, not a checkbox.

---

## 3. Corrective plan (Sprint 33 — replaces the un-run Task 377)

Strictly sequential; each starts only after the previous is implemented AND I have reviewed the **rendered**
evidence (not the report). Files: `tasks/Sprints/Sprint_33_CORRECTIVE_*`.

- **Task 380 — Canvas + i18n infra + ENFORCEABLE GATES (foundation, kills RC-1/RC-2 structurally).**
  Global full-width mobile-accurate canvas decorator + `layout:'fullscreen'` standard; single locale-aware
  story fixture/i18n layer (`storybook.*` keys ×4 locales); **lint rules + `scripts/check-stories.mjs`** wired
  into `prebuild-storybook` that FAIL on hardcode / `layout:'centered'|'padded'` / `Ukrainian*` story / raw
  control; **automated rendered assertion** (extend `responsive-screenshots.mjs`: no h-scroll at 320, text
  controls full-width at <640) that emits the evidence matrix as artifacts.
- **Task 381 — De-hardcode every fixture/story onto the i18n layer + delete redundant Ukrainian stories (RC-2/RC-3).**
- **Task 382 — Component-layout fixes (RC-4):** Tabs left-clip/full-width, Select full-width+padding,
  AdminLayout toolbar vertical stack, RVS header stack + `no-scrollbar`, Skeleton responsive.
- **Task 383 — Rendered conformance sweep (377 redux), now BACKED by the gates** — 26×9 matrix where every cell
  is evidenced by a machine-produced screenshot; gates green in CI; nothing self-reported.

## 4. Process fixes I am committing to (orchestrator)
- A Storybook/UI task is **auto-rejected** if its session log lacks attached rendered screenshots at
  uk@320/375/390 + the automated overflow report. Session-log tables alone never approve. (Encoded in
  `orchestrator-role.md` this session.)
- New `agent-contract.md` clause 13: the enforceable Storybook gate is part of the P0 contract.
- I will not approve Sprint 33 from diffs — only from rendered artifacts produced by the new gate.

## Files Changed (this orchestrator session — docs/tasks only; NO product code, NO git)
| File | Change | Rationale |
|------|--------|-----------|
| `docs/sessions/2026-06-04-orchestrator-sprint32-rendered-rejection-rootcause.md` | This log | Root-cause + self-audit + plan |
| `tasks/Sprints/Sprint_33_CORRECTIVE_Storybook_Rendered_Conformance.md` | Master plan | Sprint 33 orchestration |
| `tasks/Sprints/Sprint_33_CORRECTIVE_A_Task_380_StorybookCanvasAndGates.md` | Kickoff | Canvas + i18n infra + enforceable gates |
| `tasks/Sprints/Sprint_33_CORRECTIVE_B_Task_381_DeHardcodeAndRemoveUkStories.md` | Kickoff | De-hardcode + remove uk stories |
| `tasks/Sprints/Sprint_33_CORRECTIVE_C_Task_382_ComponentLayoutFixes.md` | Kickoff | Tabs/Select/AdminLayout/RVS/Skeleton |
| `tasks/Sprints/Sprint_33_CORRECTIVE_D_Task_383_RenderedConformanceSweep.md` | Kickoff | 26×9 rendered sweep backed by gates |
| `docs/storybook-governance.md` | Append "Enforceable Storybook gates (Sprint 33)" | Machine enforcement of the prose rules |
| `docs/orchestrator-role.md` | Append "Rendered-evidence approval gate (Sprint 33)" | Never approve UI from diff alone again |
| `docs/agent-contract.md` | Add clause 13 (enforceable Storybook/hardcode gate) | Hardcode/non-full-width impossible to commit |
| `docs/backlog.md` | Update Last Session | Tracking |

NO `git add` / `git commit` run. Commit commands emitted to the owner after this log.
