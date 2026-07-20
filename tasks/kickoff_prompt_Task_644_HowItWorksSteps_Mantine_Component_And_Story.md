# Task 644 — Create a canonical Mantine `HowItWorksSteps` component (client island) that reproduces the current homepage "How it works" 3-step block using Mantine primitives + theme tokens, and add its toolbar-reactive canonical Storybook story + coverage registration. Do NOT wire it into the homepage yet (that is Task 645).

- **Task number:** 644
- **Epic:** MM — Mantine/TailAdmin Restyle (homepage section migration; **Story-first slice 1 of 2**).
- **Parent / origin:** Owner directive 2026-07-20: migrate the homepage "How it works" (`Як це працює`) block to Mantine, Story-first ("Якщо треба Mantine Story — спочатку робимо Story"), preserving the current visual. Investigation confirmed the block is legacy Tailwind in a server component (`src/app/[locale]/page.tsx`) with no existing canonical Mantine pattern/story for icon-step cards (`MantineCardGrid` is for listing cards, not this). This slice builds + proves the component in isolation; Task 645 swaps it into `page.tsx`.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** **create-canonical** Mantine UI — a new shared client island component + its canonical toolbar-reactive Storybook story + coverage/catalog registration. Visual target = **preserve the current look** (owner decision), rebuilt on Mantine primitives + theme tokens (no pixel redesign). No homepage/`page.tsx` change in this task.

## Objective

Create `src/components/shared/HowItWorksSteps.tsx` — a `'use client'` Mantine component that renders the "How it works" section (centered heading + a responsive 1→3 column grid of three step cards, each: a rounded icon box with the brand-tinted background, a small numbered badge in the corner, a title, and a description) — visually matching the current legacy block, built from Mantine primitives (`SimpleGrid`/`Stack`/`Group`/`Box`/`ThemeIcon`/`Text`/`Title` as appropriate) and theme tokens (no raw Tailwind color/spacing utilities for the migrated chrome). Add its canonical Storybook story at `src/stories/mantine/primitives/HowItWorksSteps.stories.tsx` (toolbar-reactive: locale + viewport), and register it in the coverage/catalog so `check:story-coverage` / `check:stories` pass. The component takes localized strings as props (like `FooterView`) so both the story and the future `page.tsx` consumer supply them.

## Verified context

Inspected on 2026-07-20 against `HEAD`. Reference by structure/id.

### Current legacy block — `src/app/[locale]/page.tsx` ("How it works" section, verbatim)

```tsx
<section className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_340px]">
  <div className="container-wide">
    <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold text-center mb-10">{t('how_it_works')}</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
      {[
        { Icon: Search, title: t('step1_title'), desc: t('step1_desc'), num: '1' },
        { Icon: Home,   title: t('step2_title'), desc: t('step2_desc'), num: '2' },
        { Icon: Phone,  title: t('step3_title'), desc: t('step3_desc'), num: '3' },
      ].map(step => (
        <div key={step.num} className="flex flex-col items-center text-center gap-3">
          <div className="relative h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <step.Icon className="h-6 w-6 text-primary" />
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {step.num}
            </span>
          </div>
          <h3 className="font-semibold">{step.title}</h3>
          <p className="text-sm text-muted-foreground">{step.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

- i18n keys (namespace `home`, present in all four locales): `how_it_works`, `step1_title`/`step1_desc`, `step2_title`/`step2_desc`, `step3_title`/`step3_desc`. Icons are fixed: `Search`, `Home`, `Phone` (lucide-react). Numbers are fixed `1/2/3`. **No i18n change in this task.**
- The `page.tsx` section itself is NOT migrated here (Task 645). This task only creates the standalone component + story.

### Visual source trace (current Tailwind → Mantine theme; preserve exactly)

| Artifact | Current Tailwind | Mantine/theme target | Token source |
|---|---|---|---|
| Section heading | `text-xl sm:text-2xl 2xl:text-3xl font-bold text-center mb-10` | `Title order={2}` (or `Text fw={700}`) centered, responsive size, `mb` ~ theme spacing | `theme.ts` typography; matches the sibling section headings (agent CTA uses the same class) |
| Grid | `grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto` | `SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl"` centered, max-width container | Mantine `SimpleGrid`; `max-w-3xl` wrapper preserved |
| Icon box | `h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center` | `ThemeIcon` (or `Box`) 56×56, `radius` ~ `rounded-2xl` (16px), background = brand at ~10% alpha | `theme.ts` `primaryColor:'brand'` (brand-700 `#EC5447` @ shade 7); brand-tinted light bg (e.g. `ThemeIcon variant="light" color="brand"` or a `color-mix`/brand-alpha token) — trace the exact alpha to a theme value, do not hardcode a raw rgba |
| Icon | `h-6 w-6 text-primary` | 24×24 lucide icon, `color` = brand-700 | `text-primary` = brand-700 |
| Number badge | `absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold` | absolutely-positioned 24×24 circle, filled brand bg, white text, xs bold | `bg-primary` = brand-700; `text-primary-foreground` = white; TailAdmin badge provenance |
| Step title | `font-semibold` (h3) | `Text fw={600}` (or `Title order={3}`) | theme typography |
| Step desc | `text-sm text-muted-foreground` | `Text size="sm" c="dimmed"` | `text-muted-foreground` = gray-5-equivalent (`c="dimmed"`) |

- **§16b canonical provenance:** the icon-box + numbered-badge is a net-new Mantine composite. Trace each visual value to a theme token or TailAdmin reference (`docs/tailadmin-style-reference.md`); if the brand-alpha icon-box background has no direct theme token, establish it via a documented theme value (e.g. `ThemeIcon variant="light" color="brand"`, whose computed light background must be verified to match `bg-primary/10`) rather than a raw inline rgba. Record the decision in the canonical UI decision record.

### Story + coverage conventions (from `FooterView.stories.tsx` and the coverage system)

- Canonical stories live at `src/stories/mantine/primitives/<Name>.stories.tsx`, `title: 'Mantine/Primitives/<Name>'`, use `storyT(locale, key)` (`../../_storyI18n`) with `context.globals.locale` for **toolbar-reactive locale**, and pass strings as props (the component takes localized strings as props — do not call `useTranslations` inside a component meant to be rendered in the story with `storyT`). `FooterView` is the precedent: it takes `brand`/`tagline`/`navLinks`/… as props and the story feeds `storyT` values.
- Coverage: `docs/component-coverage-matrix.md` + `docs/component-catalog.md` track story coverage; `check:story-coverage` / `check:stories` enforce it. The new component + story must be registered so these gates pass (add the matrix/catalog row per the existing format; regenerate if the matrix is script-generated — confirm from the file header/how `FooterView`/`HeaderView` were registered).
- Toolbar-reactive **viewport**: the canonical Storybook proof path renders across the viewport matrix (per `docs/qa-profiles.md` Q3 + the `MANTINE_STORY_EXTRA_VIEWPORTS`/`screenshots:assert --mantine-only` mechanism, e.g. Tasks 573/629). The story must render correctly at the mandated viewports incl. `uk@320`.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Owner | `src/components/shared/HowItWorksSteps.tsx` (`'use client'`) renders the heading + 1→3-col grid of three step cards (icon box + numbered badge + title + desc) from Mantine primitives + theme tokens; visual preserves the current look | P0 | `git diff`; rendered Storybook proof | Confirmed |
| R2 | Preserve look | The migrated chrome uses Mantine/theme tokens, not raw Tailwind color/spacing utilities, for the icon box / badge / typography / grid; visual matches the legacy block (side-by-side) | P0 | Visual source trace; Storybook render vs legacy | Confirmed |
| R3 | Props/i18n | The component takes localized strings as props (heading + three `{title, desc}` pairs; icons/numbers owned internally as the fixed `Search/Home/Phone` + `1/2/3`); it does not hardcode visible copy and is renderable in the story via `storyT`. No i18n key added/changed | P0 | `git diff`; story renders with `storyT`; `check:i18n` unchanged | Confirmed |
| R4 | Canonical story | `src/stories/mantine/primitives/HowItWorksSteps.stories.tsx` (`title: 'Mantine/Primitives/HowItWorksSteps'`) renders the component toolbar-reactively (locale via `context.globals.locale` + viewport), incl. `uk@320` | P0 | Storybook build; rendered matrix | Confirmed |
| R5 | Coverage registration | The component/story is registered in `docs/component-coverage-matrix.md` + `docs/component-catalog.md` (per existing format / regeneration) so `check:story-coverage` and `check:stories` pass | P0 | Commands exit 0 | Confirmed |
| R6 | Provenance (§16b/§16a) | Every visual value traces to a theme token or a TailAdmin reference row; the brand-alpha icon-box background and the number badge have documented provenance (no raw inline rgba without a token); canonical UI decision record = `create canonical` | P1 | Canonical decision record + visual source trace in the session log | Confirmed |
| R7 | Isolation | No change to `src/app/[locale]/page.tsx`, i18n files, `theme.ts` (unless a documented token addition is required and owner-safe), or any other consumer; the component is not yet used anywhere but the story | P0 | `git diff` scope | Confirmed |
| R8 | Gates | `typecheck`, `check:stories`, `check:story-coverage` (if a distinct script), `check:i18n`, `check:mojibake` all green; the Q3 rendered proof path passes for the new story | P0 | Commands exit 0 + rendered evidence | Confirmed |

## Assumptions and open questions

- **Component is a homepage-shaped island taking string props** (precedent: `FooterView`, `AgentCtaButton`, `ViewAllLink`). Signature (suggested): `HowItWorksSteps({ heading: string; steps: { title: string; desc: string }[] })` where `steps.length === 3`; icons `[Search, Home, Phone]` and numbers `['1','2','3']` are owned internally by index. Keep it minimal and story-renderable.
- **Icon-box background:** prefer a theme-native expression (`ThemeIcon variant="light" color="brand"` or equivalent) whose computed light background is verified to match `bg-primary/10`. If no theme construct matches, document the exact brand-alpha value and its provenance in the decision record; do not silently inline a raw rgba. If this requires a `theme.ts` token addition, stop for a `CANONICAL STYLE DECISION` note rather than improvising.
- **Heading element:** use `Title order={2}` (semantic h2, matches the legacy `<h2>`); step title `Text fw={600}` rendered as an `h3`-equivalent (or `Title order={3}`) to preserve the heading hierarchy. Confirm the rendered typography matches the legacy sizes.
- **No behavior/interactivity:** the block is purely presentational (no links/clicks). Do not add interactivity.
- **`page.tsx` swap is Task 645** — explicitly out of scope here.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 7 i18n, 11 mobile/overlay, 12 rendered evidence, 13 Storybook/no-hardcode, 14 file integrity, 16 TailAdmin visual source, 16a missing-reference provenance, 16b canonical provenance before code).
- `docs/rule-index.md` (current-Mantine create-canonical UI routing).
- `docs/qa-profiles.md` (Q3 visual — new canonical story) and its viewport/locale matrix.
- `docs/mantine-responsive-design-system.md` (SimpleGrid/ThemeIcon/Text/Title chrome + responsive props), `docs/tailadmin-style-reference.md` (icon-box/badge/typography provenance), `docs/component-rules.md` (container/presentational, i18n, no-duplicate), `docs/component-catalog.md` + `docs/component-coverage-matrix.md` (registration).
- Source/precedent: `src/app/[locale]/page.tsx` (legacy block, context), `src/components/layout/FooterView.tsx` + `src/stories/mantine/primitives/FooterView.stories.tsx` (string-props island + canonical story precedent), `src/components/shared/AgentCtaButton.tsx`/`ViewAllLink.tsx` (homepage island precedent), `src/design-system/mantine/theme.ts` (`primaryColor:'brand'`, `primaryShade:7`, radius/spacing tokens), `src/stories/_storyI18n.ts` (`storyT`).

## Scope

1. Create `src/components/shared/HowItWorksSteps.tsx` (`'use client'`) per R1–R3/R6, Mantine primitives + theme tokens, string props, fixed icons/numbers, visual preserved.
2. Create `src/stories/mantine/primitives/HowItWorksSteps.stories.tsx` (`title: 'Mantine/Primitives/HowItWorksSteps'`) — toolbar-reactive locale (`storyT` + `context.globals.locale`) + viewport; renders the three real steps via `storyT('home.*')`.
3. Register in `docs/component-coverage-matrix.md` + `docs/component-catalog.md` per the existing format (or regenerate if script-driven) so coverage gates pass.
4. Produce the Q3 rendered Storybook proof (locale/viewport matrix incl. `uk@320`) + the canonical UI decision record + visual source trace.
5. Write the session log + a concise `docs/backlog.md` entry (note this is Story-first slice 1/2; Task 645 wires it into `page.tsx`). Keep the file ≤80 lines.

## Out of scope

- `src/app/[locale]/page.tsx` (the actual homepage swap — Task 645).
- i18n keys (reuse the existing `home.*` keys; none added/changed).
- `theme.ts` changes beyond a documented, owner-safe token addition if strictly required for the icon-box background (else stop for a decision note).
- Any redesign of the visual (owner chose preserve-current-look), interactivity, or other homepage sections.

## Current and required behavior

- **Current:** the "How it works" block exists only as inline legacy Tailwind markup in `page.tsx`; there is no reusable component and no Mantine story.
- **Required after:** a canonical `HowItWorksSteps` Mantine component exists, visually matching the current block, proven in a toolbar-reactive Storybook story and registered for coverage — but not yet used on the homepage (the legacy `page.tsx` block is untouched and still renders the live page until Task 645).

## Positive and negative flows

**Positive:** Storybook → `Mantine/Primitives/HowItWorksSteps` → the story renders the heading + three step cards (icon box + numbered badge + title + desc) matching the legacy look → switching the locale toolbar re-renders the copy in sq/en/uk/it → the viewport matrix (incl. uk@320) shows 1-column stack on mobile, 3-column on ≥sm, no clip/overflow.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Desktop 3-column render | **Yes** | R1/R4 | three cards in a row, centered, matches legacy | Storybook desktop |
| Mobile (<sm / 320) 1-column stack | **Yes** | R1/R4 | cards stack, icon box + badge + text no clip/overflow, uk@320 | Storybook uk@320 |
| Locale expansion (sq/en/uk/it via toolbar) | **Yes** | R3/R4 | copy re-renders per locale, longest strings (uk/it) wrap without overflow | Storybook locale toolbar |
| Visual parity vs legacy | **Yes** | R2 | icon box tint, badge, radius, typography match the current block | Side-by-side (story vs legacy screenshot) |
| Provenance for icon-box bg / badge | **Yes** | R6 | traced to theme token / TailAdmin; no raw untokened rgba | Decision record + trace |
| Interactivity / links | No | block is presentational; none exists | — |
| i18n key change | No | reuse existing `home.*` keys | `check:i18n` unchanged |

## Acceptance criteria

- `AC1 [R1,R2]` Given the story, then `HowItWorksSteps` renders the heading + a 1→3-col grid of three step cards built from Mantine primitives + theme tokens, visually matching the legacy block (no raw Tailwind color/spacing utilities in the migrated chrome).
- `AC2 [R3]` Given the component, then it takes localized strings as props (heading + three `{title,desc}`), owns the fixed `Search/Home/Phone` icons + `1/2/3` numbers internally, hardcodes no visible copy, and renders in the story via `storyT`; no i18n key changed.
- `AC3 [R4]` Given the story `Mantine/Primitives/HowItWorksSteps`, then it renders toolbar-reactively (locale + viewport) and passes the Q3 rendered matrix incl. `uk@320`.
- `AC4 [R5,R8]` Given the repo, then the component/story is registered for coverage and `typecheck` + `check:stories` + `check:story-coverage` + `check:i18n` + `check:mojibake` all exit 0.
- `AC5 [R6]` Given the session log, then a `create canonical` UI decision record + a full visual source trace document each visual value's theme/TailAdmin provenance (icon-box bg and number badge explicitly).
- `AC6 [R7]` Given the diff, then `page.tsx`, i18n files, and other consumers are unchanged; the component is used only by its story.

## QA profile and verification plan

**Profile: Q3 Visual (new canonical Mantine story).** Evidence:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0 (new story compliant: locale-backed strings, no forbidden raw controls).
3. `npm run check:story-coverage` (or the project's coverage gate) → the new component is covered.
4. `npm run check:i18n` → unchanged parity (no new key).
5. `npm run check:mojibake` → 0 artifacts.
6. **Rendered Storybook proof** (Q3 matrix per `docs/qa-profiles.md`): the `Mantine/Primitives/HowItWorksSteps` story captured across the mandated viewport set × the four locales, `uk@320` mandatory; plus a side-by-side vs the legacy block to confirm visual parity. Use the project's canonical `--mantine-only` screenshot path (e.g. `screenshots:assert`, Tasks 573/629 precedent). If a required render can't run in the sandbox, record it as missing evidence with the exact owner-native command + expected result.
7. `git status --short` / `git diff --stat` → only the new component, the new story, `docs/component-coverage-matrix.md`, `docs/component-catalog.md`, `docs/backlog.md`, and the new session log. No `page.tsx`/i18n change.

Q3 cannot be approved without the rendered Storybook matrix (incl. uk@320) and the visual-parity evidence.

## Completion report contract

Write `docs/sessions/2026-07-20-task644-howitworksteps-mantine-component-story.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R8 each with evidence; the canonical UI decision record (`create canonical`) + the full visual source trace (every value → theme token / TailAdmin row, icon-box bg + badge explicit); the component signature; typecheck/check:stories/check:story-coverage/check:i18n/mojibake results; the rendered Storybook matrix (locale × viewport incl. uk@320) + the legacy side-by-side parity evidence; explicit confirmation that `page.tsx`, i18n, `theme.ts`, and other consumers were NOT changed; and a note that Task 645 will wire this into the homepage. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the legacy block verbatim, the full visual source trace (Tailwind → Mantine/theme with token sources), the component path/signature/props, the story path/title/toolbar-reactive convention (`storyT` + `globals.locale`), the coverage-registration files, the provenance requirement (§16b, icon-box bg + badge), and the Q3 render matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the `create canonical` disposition names the shared source + canonical story + coverage registration in one task. ✅
- Scope is Story-first only — `page.tsx` is explicitly deferred to Task 645; the component is used only by its story. ✅
- Visual target = preserve the current look (owner decision); every value traced to a theme/TailAdmin token, no untokened raw rgba. ✅
- No i18n key change (reuses `home.*`); locale-backed strings via props + `storyT`. ✅
- Negative flows selected by applicability (desktop/mobile/locale/parity/provenance in; interactivity/i18n-change out). ✅
