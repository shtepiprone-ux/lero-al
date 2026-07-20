# Task 645 — Swap the legacy inline "How it works" markup in `src/app/[locale]/page.tsx` for the canonical `<HowItWorksSteps/>` component (Task 644), removing the now-dead `Search`/`Home`/`Phone` lucide imports; render proof on the real `/{locale}` homepage

- **Task number:** 645
- **Epic:** MM — Mantine/TailAdmin Restyle (homepage section migration; **Story-first slice 2 of 2**).
- **Parent / origin:** Task 644 created the canonical `HowItWorksSteps` Mantine component + Storybook story (committed `ad937f2fa`), visually matching the legacy block with exact-parity spacing (`mb={40}`/`spacing={32}`, owner option B). This slice wires it into the live homepage and deletes the inline legacy Tailwind markup.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** consume-canonical UI swap in one server component (`page.tsx`) — replace inline legacy markup with the Task-644 client island, drop dead imports. No new component, no i18n, no visual redesign (644 already preserves the look).

## Objective

In `src/app/[locale]/page.tsx`, replace the inline "How it works" `<h2>` + step-grid markup with `<HowItWorksSteps heading={t('how_it_works')} steps={[…]} />` (Task 644's component), keeping the existing `<section>`/`container-wide` wrappers; import `HowItWorksSteps`; and remove `Search`, `Home`, `Phone` from the `lucide-react` import (they were used only by the deleted block), keeping `Building2` (still used by the Agent-CTA section). The rendered homepage must look identical to before.

## Verified context

Inspected on 2026-07-20 against `HEAD` (Task 644 committed `ad937f2fa`). Reference by structure/id (line numbers shift).

### `page.tsx` — server component, current "How it works" section (verbatim)

```tsx
{/* ── How it works ── */}
<section className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_340px]">
  <div className="container-wide">
    <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold text-center mb-10">{t('how_it_works')}</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
      {[
        { Icon: Search, title: t('step1_title'), desc: t('step1_desc'), num: '1' },
        { Icon: Home,   title: t('step2_title'), desc: t('step2_desc'), num: '2' },
        { Icon: Phone,  title: t('step3_title'), desc: t('step3_desc'), num: '3' },
      ].map(step => ( … icon box + numbered badge + h3 + p … ))}
    </div>
  </div>
</section>
```

- `page.tsx` is a **server component** (`import { getTranslations, getLocale } from 'next-intl/server'`, `export default async function HomePage()`); `t = await getTranslations('home')`.
- Line 2: `import { Search, Home, Phone, Building2 } from 'lucide-react'`. **`Search`/`Home`/`Phone` are used ONLY inside the how-it-works block** (grep-confirmed: lines 66–68). `Building2` is used at line ~89 by the Agent-CTA section — **keep it**.
- Importing the `'use client'` `HowItWorksSteps` into this server component is fine and precedented — `HeroSearchClient`, `AgentCtaButton`, `ViewAllLink` are all client islands already imported into `page.tsx`. The `heading`/`steps` props are plain serializable strings passed from the server (`getTranslations`) across the client boundary.

### Task 644 component API (available, committed)

```ts
// src/components/shared/HowItWorksSteps.tsx  ('use client')
export interface HowItWorksStep { title: string; desc: string }
export interface HowItWorksStepsProps {
  heading: string
  steps: readonly [HowItWorksStep, HowItWorksStep, HowItWorksStep]  // exactly 3
}
export function HowItWorksSteps({ heading, steps }: HowItWorksStepsProps): JSX.Element
```

- The component renders the heading (`Title order={2}`) + the 1→3-col `SimpleGrid` of three step cards, with `maw={768} mx="auto"` internally. Icons (`Search`/`Home`/`Phone`) and numbers (`1/2/3`) are owned internally by index — **do not pass them**. The section `<section>`/`container-wide` wrappers are NOT part of the component and stay in `page.tsx`.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Swap | The inline `<h2>` + step-grid markup is replaced by `<HowItWorksSteps heading={t('how_it_works')} steps={[{title:t('step1_title'),desc:t('step1_desc')},{…step2…},{…step3…}]} />`; the `<section className="py-12 md:py-16 2xl:py-20 [content-visibility:auto] [contain-intrinsic-size:auto_340px]">` + `<div className="container-wide">` wrappers are preserved | P0 | `git diff`; rendered `/{locale}` | Confirmed |
| R2 | Import hygiene | `HowItWorksSteps` is imported; `Search`, `Home`, `Phone` are removed from the `lucide-react` import; `Building2` is kept (still used by Agent-CTA) | P0 | `git diff`; `typecheck` (no unused-import/undefined); grep | Confirmed |
| R3 | Visual parity | The rendered homepage "How it works" section looks identical to before (Task 644 preserved the look with exact-parity spacing) — same heading, 3 step cards (icon box + numbered badge + title + desc), 1→3-col responsive, same section padding/rhythm | P0 | Rendered `/{locale}` before/after at viewports incl. `uk@320` | Confirmed |
| R4 | Behavior/parity | No change to any other homepage section (Hero, Featured, Latest, PopularLocations, Agent-CTA), the `home.*` i18n keys, or `HowItWorksSteps` itself; only the how-it-works block + the lucide import line change in `page.tsx` | P0 | `git diff` scope | Confirmed |
| R5 | Gates | `typecheck`, `check:stories`, `check:i18n`, `check:mojibake` all green; no i18n key change | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **Section wrapper stays in `page.tsx`** (the component is heading+grid only). Preserve the `[content-visibility:auto] [contain-intrinsic-size:auto_340px]` performance hint and `py-*`/`container-wide` classes exactly — these are page-layout concerns, not migrated chrome.
- **`steps` prop is a 3-tuple** — build it as `[{ title: t('step1_title'), desc: t('step1_desc') }, { title: t('step2_title'), desc: t('step2_desc') }, { title: t('step3_title'), desc: t('step3_desc') }] as const` (or matching the tuple type) so it satisfies `readonly [Step, Step, Step]`.
- **No i18n change** — reuse the existing `home.how_it_works`/`step{1,2,3}_{title,desc}` keys.
- **No new client-boundary concern** — precedented; do not convert `page.tsx` to a client component.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 3 capabilities-reachable, 7 i18n, 12 rendered evidence, 14 file integrity).
- `docs/rule-index.md` (current-Mantine UI consume/swap routing).
- `docs/qa-profiles.md` (Q3 visual — live homepage section) and its viewport/locale matrix; `docs/performance.md` (content-visibility hint preservation).
- Source: `src/app/[locale]/page.tsx` (target), `src/components/shared/HowItWorksSteps.tsx` (Task 644 component, consumed), `src/components/shared/AgentCtaButton.tsx`/`ViewAllLink.tsx`/`HeroSearchClient` (client-island-in-server-page precedent).

## Scope

1. In `src/app/[locale]/page.tsx`: add `import { HowItWorksSteps } from '@/components/shared/HowItWorksSteps'`; remove `Search`, `Home`, `Phone` from the `lucide-react` import (keep `Building2`); replace the inner `<h2>` + step-grid markup with `<HowItWorksSteps heading={t('how_it_works')} steps={[…3…]} />`, preserving the `<section>`/`container-wide` wrappers.
2. Produce the Q3 rendered proof on the real `/{locale}` route (before/after parity, viewports incl. `uk@320`, four locales).
3. Write the session log + a concise `docs/backlog.md` entry; note this closes the "How it works" Mantine migration (644 story + 645 swap). Keep the file ≤80 lines.

## Out of scope

- `HowItWorksSteps.tsx` itself (Task 644 — do not modify), its story, `theme.ts`, i18n keys.
- Any other homepage section (Hero, Featured, Latest, PopularLocations, Agent-CTA) or any visual redesign.
- The section wrapper's performance hint / padding (preserve exactly).

## Current and required behavior

- **Current:** the homepage "How it works" section is inline legacy Tailwind markup in `page.tsx`, importing `Search`/`Home`/`Phone`.
- **Required after:** the section renders `<HowItWorksSteps/>` (Task 644 Mantine component) inside the same `<section>`/`container-wide` wrappers; `Search`/`Home`/`Phone` imports are gone; the page looks identical; every other section is unchanged.

## Positive and negative flows

**Positive:** load `/{locale}` → the "How it works" section renders via `<HowItWorksSteps/>` (heading + 3 step cards, icon box + numbered badge + title + desc), visually identical to before → responsive 1-col <sm / 3-col ≥sm → every other section unchanged.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Desktop render (real route) | **Yes** | R1/R3 | 3 cards in a row, identical to legacy | Rendered `/en` desktop before/after |
| Mobile uk@320 (real route) | **Yes** | R3 | 1-col stack, no clip/overflow, identical | Rendered `/uk` @320 |
| Locale expansion (sq/en/uk/it) | **Yes** | R3 | copy per locale, no overflow | Rendered per locale |
| Dead-import removal compiles | **Yes** | R2 | no unused/undefined `Search`/`Home`/`Phone`; `Building2` still resolves | `typecheck` green |
| Other sections unchanged | **Yes (regression)** | R4 | Hero/Featured/Latest/PopularLocations/Agent-CTA render as before | Rendered full page diff |
| content-visibility hint preserved | **Yes** | R1 | section keeps `[content-visibility:auto]`/`contain-intrinsic-size` | `git diff` |
| i18n key change | No | reuse existing `home.*` | `check:i18n` unchanged |

## Acceptance criteria

- `AC1 [R1]` Given the diff, then the inline `<h2>` + step-grid is replaced by `<HowItWorksSteps heading={t('how_it_works')} steps={[3]} />` inside the preserved `<section>`/`container-wide` wrappers.
- `AC2 [R2]` Given the diff, then `HowItWorksSteps` is imported and `Search`/`Home`/`Phone` are removed from the lucide import (`Building2` kept); `typecheck` passes with no unused/undefined symbol.
- `AC3 [R3]` Given the rendered `/{locale}` homepage at viewports incl. `uk@320` × four locales, then the "How it works" section is visually identical to the pre-swap legacy render (heading, cards, spacing, responsive behavior).
- `AC4 [R4]` Given the diff, then only the how-it-works block + the lucide import line in `page.tsx` changed; no other section, i18n key, or `HowItWorksSteps.tsx` is touched.
- `AC5 [R5]` Given the repo, then typecheck + check:stories + check:i18n + check:mojibake all exit 0 with no i18n key change.

## QA profile and verification plan

**Profile: Q3 Visual (live homepage section swap).** Evidence:

1. `npm run typecheck` → 0 errors (confirms dead-import removal + tuple prop type).
2. `npm run check:stories` → exit 0.
3. `npm run check:i18n` → unchanged parity (no key change).
4. `npm run check:mojibake` → 0 artifacts.
5. **Rendered proof (real `/{locale}` route):** capture the homepage "How it works" section before (legacy `HEAD`) and after (post-swap) at the mandated viewport set × four locales, `uk@320` mandatory, and confirm visual parity (the Task-644 component already matches, so before/after should be pixel-equivalent modulo the client-boundary). Use the live-app capture path (Tasks 621/630/644 precedent). If the sandbox cannot run the app, record it as missing evidence with the exact owner-native command + expected result and request the owner's quick visual confirmation.
6. `git status --short` / `git diff --stat` → only `src/app/[locale]/page.tsx`, `docs/backlog.md`, and the new session log. Classify any harness side-effect (e.g. a regenerated rendered-proof inventory) as `EXCLUDED AS UNRELATED`.

Q3 cannot be approved without the rendered `/{locale}` parity evidence incl. `uk@320`.

## Completion report contract

Write `docs/sessions/2026-07-20-task645-homepage-swap-howitworksteps.md` + a concise `docs/backlog.md` update. Include: a Files Changed table matching the real diff; R1–R5 each with evidence; the before/after of the `page.tsx` section + the lucide import line; typecheck/check:stories/check:i18n/mojibake results; the rendered `/{locale}` before/after parity (incl. uk@320 × four locales); explicit confirmation that no other section, i18n key, or `HowItWorksSteps.tsx` changed; and a note that this closes the "How it works" Mantine migration (644+645). Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the legacy block verbatim, the server-component + client-island-in-server precedent, the Task-644 component API + import path, the exact import-line change (drop Search/Home/Phone, keep Building2), the tuple `steps` prop shape, the preserved section wrapper + content-visibility hint, and the Q3 real-route render matrix are all named. ✅
- Every P0 requirement has a binary AC and a verification method; the dead-import removal is gated by typecheck. ✅
- Scope protects every other homepage section and the section wrapper; names what must not change. ✅
- No i18n key change (reuses `home.*`); no `HowItWorksSteps.tsx` change (644 owns it). ✅
- Negative flows selected by applicability (desktop/mobile/locale/import-compile/other-sections/content-visibility in; i18n-change out). ✅
