# Task 646 — Migrate the remaining inline text chrome in `src/app/[locale]/page.tsx` (Hero `<h1>`/subtitle, Latest `<h2>`, Agent-CTA icon + `<h2>` + description) from raw Tailwind to Mantine `Title`/`Text`/icon, rendered server-side, preserving the look

- **Task number:** 646
- **Epic:** MM — Mantine/TailAdmin Restyle (homepage completion; **block A of the homepage-migration plan**).
- **Parent / origin:** Homepage Mantine-migration audit (2026-07-20). After Tasks 644/645 the "How it works" block is Mantine, but `page.tsx` still holds raw-Tailwind typography chrome in three sections (Hero heading/subtitle, Latest heading, Agent-CTA icon+heading+description). This task migrates that inline text chrome to Mantine primitives. (Sibling blocks, separate tasks: 647 = Featured/Latest skeletons; 648/649 = PopularLocations; HeroSearch = Phase-2 deferred.)

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** current-Mantine chrome migration of inline typography in one server component. Visual target = **preserve the look** (consistent with the homepage-migration decision). Mantine presentational primitives render **directly in the server component** — no `'use client'`, no island extraction (precedent: `FooterView.tsx` is a server component importing `@mantine/core` `Box/Stack/Group/Flex` directly).

## Objective

In `src/app/[locale]/page.tsx`, replace the raw-Tailwind text elements with Mantine primitives, preserving the current appearance:
- **Hero:** `<h1>` → `Title order={1}`, subtitle `<p>` → `Text` (white text on the dark gradient).
- **Latest:** `<h2>` → `Title order={2}` (same section-heading treatment as Task 644's `HowItWorksSteps` heading).
- **Agent-CTA:** the `Building2` icon → Mantine-wrapped tokened icon, `<h2>` → `Title order={2}`, description `<p>` → `Text c="dimmed"`.

Keep the `<section>`/`container-wide`/gradient/`max-w-*`/flex layout wrappers as-is (page layout scaffolding — matches `FooterView`'s `Box component="…" className="container-wide …"` approach; converting those is not required and not in scope). No i18n change.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Task 645 landed). `page.tsx` is a **server component** (`getTranslations`/`getLocale` from `next-intl/server`, `async function HomePage`). `t = getTranslations('home')`, `tl = getTranslations('listing')`.

### Server-component + Mantine precedent (the enabler)

`src/components/layout/FooterView.tsx` has **no `'use client'`** and imports `@mantine/core` `Box/Stack/Group/Flex` directly, using `Box component="footer" className="container-wide …"` for layout. This proves Mantine presentational primitives render server-side under the root `MantineProvider` — so `page.tsx` can use `Title`/`Text`/`Box` inline without becoming a client component or extracting islands.

### The three inline-chrome targets (verbatim) + Mantine mapping

**Hero (lines ~25–37):**
```tsx
<section className="relative bg-gradient-to-br from-brand-950 via-primary/80 to-brand-950 text-primary-foreground py-16 md:py-24">
  <div className="container-wide relative z-10">
    <div className="max-w-3xl mx-auto text-center mb-10">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">{t('hero_title')}</h1>
      <p className="text-base sm:text-lg text-primary-foreground/80 max-w-xl mx-auto">{t('hero_subtitle')}</p>
    </div>
    <HeroSearchClient />
  </div>
</section>
```
- `<h1>` → `<Title order={1} c="white" fw={700} lh={1.1} fz={{ base: '1.875rem', sm: '2.25rem', md: '3rem' }} mb="md">` (text-3xl/4xl/5xl = 30/36/48px; `mb-4`=16px=`md` spacing; `text-primary-foreground` on the dark gradient = white).
- `<p>` → `<Text c="white" opacity={0.8} fz={{ base: '1rem', sm: '1.125rem' }} maw={576} mx="auto">` (text-base/lg = 16/18px; `/80` → `opacity={0.8}` not a raw rgba; `max-w-xl`=576px).
- Keep the `<section>`/`container-wide`/`max-w-3xl mx-auto text-center mb-10` wrappers and `<HeroSearchClient/>` unchanged.

**Latest heading (line ~50):**
```tsx
<h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">{tl('latest')}</h2>
```
- → `<Title order={2} fw={700} fz={{ base: '1.25rem', sm: '1.5rem', xxl: '1.875rem' }}>` — **identical treatment to Task 644's `HowItWorksSteps` heading** (consistency). Keep the surrounding `flex items-center justify-between mb-6` row + `<ViewAllLink/>`.

**Agent-CTA (lines ~78–86):**
```tsx
<div className="max-w-2xl mx-auto text-center">
  <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
  <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-3">{t('agent_cta_title')}</h2>
  <p className="text-muted-foreground mb-6">{t('agent_cta_desc')}</p>
  <AgentCtaButton href={…} label={t('agent_cta_button')} />
</div>
```
- `Building2` (`h-12 w-12`=48px, `text-primary`=brand-7, centered, `mb-4`=16px) → a Mantine-wrapped tokened icon, e.g. `<Box ta="center" mb="md"><Building2 size={48} color="var(--mantine-color-brand-7)" /></Box>` (no ThemeIcon background box — the legacy is a bare colored icon; keep it bare). Do not introduce a tinted box.
- `<h2>` → `<Title order={2} fw={700} fz={{ base:'1.25rem', sm:'1.5rem', xxl:'1.875rem' }} mb="sm">` (`mb-3`=12px=`sm`).
- `<p>` → `<Text c="dimmed" mb="xl">` (`text-muted-foreground`=`dimmed`; `mb-6`=24px=`xl`).
- Keep the `<section>` gradient wrapper + `max-w-2xl mx-auto text-center` + `<AgentCtaButton/>` unchanged.

### Token map (all exact — spacing values here DO map, unlike Task 644's 40px)

| Legacy | Mantine | Note |
|---|---|---|
| `mb-3` 12px | `mb="sm"` | spacing.sm=12px exact |
| `mb-4` 16px | `mb="md"` | spacing.md=16px exact |
| `mb-6` 24px | `mb="xl"` | spacing.xl=24px exact |
| `text-primary-foreground` | `c="white"` | white on dark hero |
| `/80` alpha | `opacity={0.8}` | not a raw rgba |
| `text-muted-foreground` | `c="dimmed"` | gray-5 |
| `text-primary` | `color="var(--mantine-color-brand-7)"` | brand-700 #EC5447 |
| section-heading scale | `fz={{base:'1.25rem',sm:'1.5rem',xxl:'1.875rem'}}` | same as Task 644 |

- `import { Title, Text, Box } from '@mantine/core'` (Box only if used for the icon wrapper). `Building2` stays imported from `lucide-react`.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Migration | Hero `<h1>`→`Title order={1}` + subtitle `<p>`→`Text` (white, /80 via opacity); Latest `<h2>`→`Title order={2}`; Agent-CTA `<h2>`→`Title order={2}`, desc `<p>`→`Text c="dimmed"`, `Building2` wrapped as a Mantine-tokened bare icon — all rendered server-side (no `'use client'`), visual preserved | P0 | `git diff`; rendered `/{locale}` | Confirmed |
| R2 | Preserve look | Migrated text uses Mantine props/theme tokens (no raw Tailwind `text-*`/`font-*`/color utilities on the migrated elements); sizes/weights/colors/margins match the legacy per the token map | P0 | Visual source trace; rendered before/after parity | Confirmed |
| R3 | Layout untouched | The `<section>`/`container-wide`/gradient/`max-w-*`/flex/`content-visibility` wrappers and `HeroSearchClient`/`ViewAllLink`/`AgentCtaButton`/`LatestListings`/`FeaturedListings` are unchanged; page stays a server component | P0 | `git diff` scope | Confirmed |
| R4 | Isolation | No i18n key change; no other homepage section, no `theme.ts`, no other file changed | P0 | `git diff`; `check:i18n` unchanged | Confirmed |
| R5 | Gates | `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **Server-side Mantine is fine** (FooterView precedent) — do NOT add `'use client'` to `page.tsx` or extract islands; render `Title`/`Text`/`Box` inline.
- **Section/layout wrappers stay Tailwind** — `<section className="py-… bg-gradient-…">`, `container-wide`, `max-w-*`, `flex`, `[content-visibility:auto]` are page layout, kept as-is (FooterView keeps layout on `className`). Migrating gradient sections to `Box` is explicitly out of scope.
- **Hero white text:** the section sets `text-primary-foreground`; Mantine `Title`/`Text` would otherwise apply the theme text color, so set `c="white"` explicitly. Subtitle `/80` → `opacity={0.8}` (clean, no raw rgba).
- **Building2 stays a bare colored icon** (no ThemeIcon tinted box) — legacy is a bare `text-primary` icon; preserve exactly.
- **Heading consistency:** Latest + Agent-CTA `<h2>` use the same `Title order={2}` responsive scale as Task 644 — do not invent a different scale.
- No new shared "SectionHeading" component (Task 644 confirmed none exists and each `Title` is component-local; keep inline).

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 7 i18n, 11 mobile, 12 rendered evidence, 14 file integrity, 16 TailAdmin visual source, 16b canonical provenance).
- `docs/rule-index.md` (current-Mantine chrome migration).
- `docs/qa-profiles.md` (Q3 visual — live homepage) + viewport/locale matrix.
- `docs/mantine-responsive-design-system.md` (Title/Text/Box + responsive `fz`/`c`/`opacity`), `docs/tailadmin-style-reference.md` (typography provenance), `docs/component-rules.md`.
- Source/precedent: `src/app/[locale]/page.tsx` (target), `src/components/layout/FooterView.tsx` (server-component + `@mantine/core` precedent), `src/components/shared/HowItWorksSteps.tsx` (heading-scale + white/dimmed token precedent), `src/design-system/mantine/theme.ts` (spacing/fontSizes/brand tokens).

## Scope

1. In `page.tsx`: add `import { Title, Text, Box } from '@mantine/core'`; migrate the Hero `<h1>`/subtitle, Latest `<h2>`, and Agent-CTA `Building2`/`<h2>`/desc to Mantine primitives per the mapping, server-side, preserving the look and the layout wrappers.
2. Produce the Q3 rendered proof on the real `/{locale}` route (before/after parity, viewports incl. `uk@320`, four locales).
3. Write the session log (with the visual source trace) + a concise `docs/backlog.md` entry (block A of homepage migration). Keep ≤80 lines.

## Out of scope

- Section/layout wrappers, gradients, `container-wide`, `content-visibility` (kept Tailwind).
- `HeroSearch`/`HeroSearchClient` (Phase-2 deferred), `FeaturedListings`/`LatestListings` bodies + their skeletons (Task 647), `PopularLocations` (Tasks 648/649), `ViewAllLink`/`AgentCtaButton`/`HowItWorksSteps` (already Mantine).
- i18n keys, `theme.ts`, any visual redesign.

## Current and required behavior

- **Current:** Hero heading/subtitle, Latest heading, and Agent-CTA icon/heading/description are raw Tailwind typography in `page.tsx`.
- **Required after:** those elements render via Mantine `Title`/`Text`/`Box`+icon (server-side), visually identical; all section layout, other components, and i18n unchanged; `page.tsx` remains a server component.

## Positive and negative flows

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Hero on dark gradient (white text) | **Yes** | R1/R2 | `Title`/`Text` render white (`c="white"`, subtitle 0.8 opacity), identical to legacy | Rendered `/en` desktop |
| Latest + Agent-CTA headings | **Yes** | R1/R2 | `Title order={2}` matches the 644 section-heading scale | Rendered |
| Agent-CTA bare brand icon | **Yes** | R1/R2 | `Building2` brand-7, centered, no tinted box | Rendered Agent-CTA |
| Mobile uk@320 parity | **Yes** | R2 | headings/text wrap, no clip/overflow, identical | Rendered uk@320 |
| Locale expansion (sq/en/uk/it) | **Yes** | R2 | copy per locale, longest wraps cleanly | Rendered per locale |
| Server-render (no client boundary added) | **Yes** | R3 | `page.tsx` stays server; no hydration change | `git diff`; no `'use client'` |
| Other sections / layout unchanged | **Yes (regression)** | R3 | Hero search, listings, PopularLocations, wrappers unchanged | Rendered full page |
| i18n key change | No | reuse `home.*`/`listing.*` | `check:i18n` unchanged |

## Acceptance criteria

- `AC1 [R1]` Given the diff, then the Hero `<h1>`/subtitle, Latest `<h2>`, and Agent-CTA `Building2`/`<h2>`/desc are Mantine `Title`/`Text`/`Box`+icon, rendered server-side, with the mapped tokens.
- `AC2 [R2]` Given the rendered `/{locale}` homepage (viewports incl. uk@320 × four locales), then those elements are visually identical to the pre-migration legacy (size, weight, color, spacing, white-on-hero), with no raw Tailwind text/color utilities on the migrated elements.
- `AC3 [R3]` Given the diff, then all section/layout wrappers, `HeroSearchClient`/`ViewAllLink`/`AgentCtaButton`/listings, and the server-component nature are unchanged.
- `AC4 [R4,R5]` Given the repo, then no i18n key/`theme.ts`/other file changed and typecheck + check:stories + check:i18n + check:mojibake all exit 0.

## QA profile and verification plan

**Profile: Q3 Visual (live homepage chrome).** Evidence:

1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → unchanged parity.
4. `npm run check:mojibake` → 0 artifacts.
5. **Rendered proof (real `/{locale}` route):** capture the Hero, Latest header, and Agent-CTA before (legacy `HEAD`) and after at the mandated viewport set × four locales, `uk@320` mandatory; confirm visual parity (white hero text at 0.8 subtitle opacity, heading scale, bare brand icon). Live-app capture path (Tasks 621/630/645 precedent). If the sandbox cannot run the app, record it as missing evidence with the exact owner-native command + expected result and request the owner's visual confirmation.
6. `git status --short` / `git diff --stat` → only `src/app/[locale]/page.tsx`, `docs/backlog.md`, and the session log. Classify any harness side-effect as `EXCLUDED AS UNRELATED`.

Q3 cannot be approved without the rendered `/{locale}` parity evidence incl. uk@320.

## Completion report contract

Write `docs/sessions/2026-07-20-task646-homepage-inline-chrome-mantine.md` + a concise `docs/backlog.md` update. Include: a Files Changed table; R1–R5 with evidence; the before/after of each migrated element + the full visual source trace (each value → theme token, white/opacity/dimmed/brand explicit); typecheck/check:stories/check:i18n/mojibake results; the rendered `/{locale}` before/after parity (incl. uk@320 × four locales); explicit confirmation that layout wrappers, other sections, i18n, and `theme.ts` are unchanged and `page.tsx` stays a server component; and a note that this is block A of the homepage migration (647 skeletons, 648/649 PopularLocations, HeroSearch Phase-2 remain). Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the three targets verbatim, the exact Mantine mapping + token map (all-exact spacing, white/opacity/dimmed/brand), the server-component + Mantine precedent (FooterView), the heading-scale consistency with Task 644, the preserved layout wrappers, and the Q3 render matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method. ✅
- Scope protects layout wrappers + every other section + the server-component nature; names what must not change. ✅
- Visual target = preserve the look; every value tokenized (no raw rgba — /80 via opacity); no i18n change. ✅
- Negative flows selected by applicability (hero-white/headings/icon/mobile/locale/server-render/other-sections in; i18n-change out). ✅
