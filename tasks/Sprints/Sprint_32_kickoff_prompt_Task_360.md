### Task 360 — Tabs underline style + Button responsive (full-width <640px) & text-fit

Type:        UX (bug + style)
Priority:    high
Area:        Canonical UI primitives — `src/components/ui/tabs.tsx`, `src/components/ui/button.tsx`

Pre-read (mandatory before any code change):
1. docs/agent-contract.md
2. docs/backlog.md
3. docs/rule-index.md → "Storybook / visual snapshot task" bundle: docs/storybook-governance.md,
   docs/storybook-visual-snapshots.md, docs/component-rules.md, docs/qa-rules.md
4. docs/rule-index.md → "UI / layout / component task" bundle: docs/design-system.md, docs/ui-rules.md
5. **docs/ai-behavior.md → Note 14 (global-change rule)** — these are shared primitives; every consumer must keep working.
6. Prior art (read, do not undo): Task 359 mobile tab/control contract — `docs/sessions/2026-06-02-task-359-mobile-control-tab-fullwidth-contract.md` (design-system.md §12b + ui-rules.md §15a).
7. Inspect package.json for current validation scripts (`tsc`, `lint`, `build-storybook`, `check:i18n`).

Localization coverage:
- sq, en, uk, it. No new strings expected; verify the `uk` LocaleStress story still fits after the style change. If any new demo string is added in a story, add it to all four `messages/*.json`.

Responsive coverage:
- 320, 375, 390, 768, 1280, 1440, 2560 — Button full-width behaviour is specifically a <640px (`max-sm:`) requirement; verify 320/375/390 explicitly.

Current behavior to preserve:
- `src/components/ui/tabs.tsx`: existing `Tabs` / `TabsList` / `TabsTrigger` API and the 6 product consumers (per Task 358/359 there are 6). The `max-sm:flex max-sm:w-full max-sm:h-auto` list contract + `mobileScroll` prop + `max-sm:min-h-11` trigger from Task 359 MUST remain.
- `src/components/ui/button.tsx`: existing `variant` and `size` props (incl. `size="xl"`=44px, `size="tab"`). NO consumer may lose its current width/sizing unless this kickoff authorises it.
- Existing controls: none removed. This is additive style only.
- `tabs.stories.tsx` / `button.stories.tsx`: existing scenario-named exports stay (canonical taxonomy §8b — no per-width export names).

Bug / Goal:
1. **Tabs** — owner wants an **underline tab style** (active tab marked by an underline indicator, not only a filled/pill background). Add it as a canonical, opt-in style without breaking the existing default style any consumer relies on.
2. **Button** — on screens **< 640px** buttons must render **full width**; and the button must **adapt to the length of its text** (text must NOT overflow/clip past the button edges) at every breakpoint and in every locale.

Required after behavior:
As a developer in Storybook, and as any user on the running app:
1. **Tabs / underline:** A consumer can render the underline style (via a documented prop/variant, e.g. `variant="underline"` on `TabsList`/`TabsTrigger` — pick one canonical approach and document it in design-system.md/ui-rules.md). The active tab shows an underline indicator; inactive tabs show none; hover/focus/keyboard nav still work; the Task 359 mobile full-width + `mobileScroll` behaviour still applies to the underline style.
2. **Tabs / default preserved:** Consumers that do NOT opt into underline render exactly as before (no visual regression) — confirm by reading the 6 consumers.
3. **Button / mobile width:** At `< sm` (≤639px) buttons are full width (`w-full`) by the canonical fragment; at `≥ sm` they size to content as today. Do not force full-width on buttons that are intentionally icon-only/compact — scope the rule to text buttons per the design-system contract; if ambiguous which buttons, STOP and ASK.
4. **Button / text-fit:** Long button labels (test with `uk` locale) wrap or the button grows to fit; text never overflows the button box or is clipped. No `whitespace-nowrap` without a truncation/`min-w-0` safety per ui-rules.
5. **Stories:** `tabs.stories.tsx` gains an `Underline` scenario export; `button.stories.tsx` gains/extends a `LocaleStress` (uk, mobile320) export proving labels fit and full-width at <640. Scenario-named only (no `W320`/`Mobile375` export names — §8b).

Required investigation:
1. Read `src/components/ui/tabs.tsx` and all 6 consumers (grep `from '@/components/ui/tabs'`) to confirm the default style is untouched.
2. Read `src/components/ui/button.tsx` — locate the `size`/`variant` cva config; decide the canonical `max-sm:w-full` fragment placement (prefer a documented prop or the design-system canonical fragment, NOT a one-off className on each call site).
3. Read design-system.md §12b + ui-rules.md §15a (Task 359) and EXTEND them — do not contradict.
4. Confirm with `grep` there are no raw `<button>` / `h-11`-on-Button anti-patterns introduced (storybook-governance §9).

Acceptance criteria:
- AC1 = Required-after step 1 (underline style renders, indicator on active tab, a11y + mobile contract intact) — verifiable at `tabs.tsx`:line + `tabs.stories.tsx` `Underline` export.
- AC2 = step 2 (default tab style visually unchanged across all 6 consumers) — verifiable by diff showing default path untouched.
- AC3 = step 3 (Button full-width <640) — verifiable at `button.tsx`:line (canonical fragment) + story at 320/375/390.
- AC4 = step 4 (text never overflows; uk labels fit) — verifiable at `button.tsx`:line + `LocaleStress` story.
- AC5 = step 5 (scenario-named story exports, §8b compliant).
- Positive flow + Negative flow parity (below) both verifiable in diff.
- Existing controls/flows preserved; 6 tab consumers + all button consumers unaffected unless authorised.
- 0 new lint errors/warnings; `npx tsc --noEmit` → 0; `npm run build-storybook` passes; `npm run check:i18n` PASS.
- All 4 locales render; all 7 breakpoints render (rendered cells = OWNER QA REQUIRED if no browser — do NOT self-mark PASS, storybook-governance §8a).
- docs/design-system.md + docs/ui-rules.md updated with the underline-tab + button-mobile-width canonical fragment. docs/backlog.md updated. Session log under docs/sessions/ with Note 18 self-validation block, §17 UI pre-flight output, and a "Files Changed" table.
- Do NOT emit `git add`/`git commit` — orchestrator emits at review.

Positive flow (happy path):
- Actor: developer rendering Storybook + end user on app.
- Preconditions: Storybook builds; underline prop chosen and documented.
- Steps: (1) open `Tabs` underline story → active tab underlined, others not; (2) keyboard arrow-navigate tabs → focus ring + selection move correctly; (3) at 320px the underline TabsList is full width / scrolls per `mobileScroll`; (4) open Button `LocaleStress` (uk, 320px) → buttons full width, long labels fit, no clipping; (5) at ≥640px buttons size to content.
- Success state: all of the above visually correct.
- Post-conditions: no consumer regressed; docs updated.

Negative flow (every off-happy-path branch):
- **Default (non-underline) tab consumer:** trigger = consumer does not pass the underline prop → renders the exact prior style; NOT changed. Verify in diff that the default cva branch is untouched.
- **Icon-only / compact button:** trigger = button with no text label at <640 → does NOT get forced full-width if that would break its layout; behaviour defined explicitly (if undecided → STOP & ASK). What is NOT done: no blanket `w-full` on every button regardless of context.
- **Extra-long unbroken token in a button label (uk):** trigger = single long word → wraps or truncates safely (`break-words`/`min-w-0`), never overflows the box.
- **Disabled tab / disabled button:** trigger = disabled state → still renders correctly under the new styles; no pointer/interaction.
- **Locale mismatch:** trigger = uk locale active but story scaffolding English → forbidden (§8a/§19); locale stories use locale-appropriate sample labels.

Out of scope:
- Do NOT change tab/button consumers' business logic or layout beyond inheriting the primitive change.
- Do NOT remove or rename existing `variant`/`size` values.
- Do NOT touch any other primitive (Sheet/Dialog/FilterBar/Select/Combobox) — those are Tasks 361/362/364.
- Do NOT undo Task 359's mobile contract.
