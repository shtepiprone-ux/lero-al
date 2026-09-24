# Task 621 — Migrate Homepage Agent-CTA button to the canonical Mantine Button

## Mode and task type

- Mode: implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- Task type: **UI — legacy shadcn → Mantine migration** of a single consumer surface (not a new/changed primitive).
- UI boundary: the **source** surface (`src/app/[locale]/page.tsx` Agent-CTA) is **legacy shadcn/Tailwind**; the **target** is the already-canonical **Mantine `Button` current path**. This is a migration bridge for one control only.

## Objective

Replace the Homepage "Приєднатись як агент" Agent-CTA — currently a `next/link` `<Link>` styled with the legacy shadcn `buttonVariants(...)` helper — with the canonical Mantine `Button` primitive, rendered through a small `'use client'` island (because the homepage is a Server Component). Navigation target, analytics attribute, leading icon, localized label, solid-primary appearance, and the current responsive full-width behavior must all be preserved.

## Verified context

All facts below were inspected in the repository on 2026-07-17. Do not re-derive; re-open the cited files to implement.

### The surface under change (verified)

`src/app/[locale]/page.tsx` is an **async Server Component** (`export default async function HomePage()`, `await getTranslations(...)` from `next-intl/server`, `await createClient()` + a Supabase query in the render body). Mantine `Button` is a `'use client'` component, so it **cannot** be placed directly in this file without a client boundary.

The Agent-CTA section is `page.tsx` lines 91–108. The button itself is lines 98–105:

```tsx
<Link
  href={`/${locale}/auth/register?type=agent`}
  className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
  data-track="register"
>
  <Building2 className="h-5 w-5" />
  {t('agent_cta_button')}
</Link>
```

- `t` is `await getTranslations('home')`; `locale` is `await getLocale()`.
- Import at `page.tsx:8`: `import { buttonVariants } from '@/components/ui/button'`; `cn` at `:9`.
- `Building2` is `lucide-react` (`page.tsx:3`).
- `data-track="register"` is an analytics hook (present on the current control) — a cross-cutting effect that P0 clause 5 requires preserving.

### Legacy styling being replaced (verified)

`src/components/ui/button.tsx` — `buttonVariants` is a `cva(...)` over a `@base-ui/react/button` primitive (legacy shadcn/Base UI stack).
- Default `variant` (none passed) = solid primary: `bg-primary text-primary-foreground [a]:hover:bg-primary/80` (`button.tsx:11`).
- `size: 'lg'` = `h-9 gap-1.5 px-2.5 ... max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words` (`button.tsx:27`).
- Net current rendered behavior: **solid brand-primary button; below 640px it is full-width with ≥44px (`min-h-11`) height and wrapping label; at ≥640px it is natural content width**, centered by the section's `text-center` container (`page.tsx:94`).

### Canonical Mantine target + precedents (verified)

- Mantine `Button` is theme-configured in `src/design-system/mantine/theme.ts` (`Button` block from line 252) and story-backed at `src/stories/mantine/primitives/Button.stories.tsx`. **No new primitive or story is created by this task.**
- Polymorphic-as-link precedent: `src/components/layout/HeaderActions.tsx:27` renders `ActionIcon component={Link}` — Mantine `component={Link}` is an established pattern in this repo.
- Variant vocabulary precedent (`src/components/layout/MobileNavDrawer.tsx`): primary CTA = `variant="filled"` (`:91`), neutral-secondary = `variant="default"` (`:88`). The Agent-CTA is a **primary** CTA → `variant="filled"`.
- Mixing Tailwind utility `className` on Mantine components for chrome/layout is already established repo-wide (e.g. `className="size-5"` icons, `navLinkClass` on links) — permitted under the UI split (Mantine = behavior; Tailwind/TailAdmin = visual) for this migration bridge.

### Visual source map (required for UI)

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Solid primary fill | `<Link className=cn(buttonVariants({size:'lg'}))>` | `bg-primary text-primary-foreground` | cva default variant → `--primary` brand token | **Changed** — re-rendered via Mantine `variant="filled"` on the same brand primary; visual result must match | `page.tsx:100`, `button.tsx:11` |
| Size / height | same | `h-9 px-2.5` + `max-sm:min-h-11 max-sm:w-full` | shadcn size `lg` + mobile full-width/≥44px | **Changed** — Mantine `size="lg"` + responsive full-width; ≥44px mobile touch target preserved | `button.tsx:27` |
| Leading icon | `<Building2 className="h-5 w-5"/>` | lucide svg | — | **Preserved** — moves to Mantine `leftSection` | `page.tsx:103` |
| Icon/label gap | `'gap-2'` on the link | Tailwind gap | — | **Changed/subsumed** by Mantine `leftSection` spacing | `page.tsx:100` |
| Analytics hook | `data-track="register"` | attribute | — | **Preserved** verbatim on the rendered control | `page.tsx:101` |
| Navigation target | `href="/${locale}/auth/register?type=agent"` | — | — | **Preserved** verbatim | `page.tsx:99` |
| Section gradient bg | `<section class="... from-primary/10 to-primary/5">` | Tailwind gradient | `--primary` | **Out of scope** — sibling wrapper, not the button | `page.tsx:92` |
| Section header icon + h2 + p copy | `<Building2/>`,`<h2>`,`<p>` | Tailwind text utils | — | **Out of scope** — preserved siblings | `page.tsx:95–97` |

### Real validation commands (verified in `package.json`)

`typecheck` (`tsc --noEmit`), `lint` (`eslint`), `check:i18n`, `check:i18n-hardcode`, `check:file-integrity`, `check:mojibake`, `check:design-tokens`, `screenshots:responsive` (`node scripts/responsive-screenshots.mjs` — app-page rendered proof, the correct path for a non-story homepage surface), `check:hydration` (`node scripts/check-hydration-console.mjs`).

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | User + rule-index (Mantine path) | The Agent-CTA renders as the canonical Mantine `Button` primitive, not `buttonVariants`/`@/components/ui/button` | P0 | Inspect diff; `page.tsx` no longer imports `buttonVariants` for this control | Confirmed |
| R2 | P0 clause 5 | Navigation target `"/${locale}/auth/register?type=agent"` is preserved exactly | P0 | Rendered `href` inspection / AC test | Confirmed |
| R3 | P0 clause 5 (analytics) | `data-track="register"` remains present on the rendered control | P0 | DOM/markup inspection | Confirmed |
| R4 | Owner intent (preserve) | Leading `Building2` icon and localized label `home.agent_cta_button` are preserved; label reads from i18n in all four locales | P0 | `screenshots:responsive` four-locale; `check:i18n` | Confirmed |
| R5 | P0 clause 11 | Below 640px the button is full-width with a ≥44px touch target and a wrapping (non-overflowing) label; at ≥640px it renders natural width, centered | P0 | `screenshots:responsive` at 320/390 incl. `uk@320` | Confirmed |
| R6 | Owner intent (visual parity) | The button reads as the same solid brand-primary CTA (Mantine `variant="filled"`) — no color/emphasis regression | P1 | TailAdmin side-by-side + rendered screenshots | Confirmed |
| R7 | P0 clause 1 | Only the Agent-CTA control changes; the section wrapper, header icon, `h2`/`p` copy, and the other homepage `buttonVariants` usage (`page.tsx:53`, ghost/sm) are untouched | P0 | Diff scope inspection | Confirmed |
| R8 | State authority | The new client boundary is minimal (a single presentational island); `page.tsx` stays a Server Component and keeps its Supabase/`getTranslations` server work | P1 | Diff inspection; `check:hydration` | Confirmed |

## Assumptions and open questions

- **A1 (assumed):** Label stays server-resolved. Recommended shape: a `'use client'` island `src/components/shared/AgentCtaButton.tsx` with props `{ href: string; label: string }`, rendering `<Button component={Link} href={href} variant="filled" size="lg" leftSection={<Building2 .../>} data-track="register" className="w-full sm:w-auto">{label}</Button>`. The server page passes `href={`/${locale}/auth/register?type=agent`}` and `label={t('agent_cta_button')}`. The executor may instead use `useTranslations('home')` inside the island; either is acceptable provided i18n parity and SSR safety hold. Confirm the chosen mechanism in the session log.
- **A2 (assumed):** The responsive full-width mechanism is `className="w-full sm:w-auto"` plus a ≥44px mobile min-height (Mantine `mih="2.75rem"` at `<sm`, or an equivalent Tailwind `max-sm:min-h-11`). Executor confirms the exact mechanism and records the rendered ≥44px evidence. Only the **observable** outcome in R5 is mandatory.
- **OQ1 (owner decision):** QA depth. This kickoff selects **Q2** (single existing primitive reused on one surface, low blast radius). If the owner considers the Homepage visually critical, elevate to **Q3** (full matrix + Storybook proof of a new/added story). Await owner sign-off only if elevating; otherwise proceed at Q2.

## Pre-read rule bundle

Executor reads exactly:

- `docs/agent-contract.md`
- `docs/rule-index.md` → **UI / Current Mantine path** section
- `docs/qa-profiles.md`
- `docs/mantine-responsive-design-system.md`
- `docs/tailadmin-style-reference.md` (Button chrome / §6 Buttons)
- `docs/component-rules.md` (container/presentational split, no-duplicate, i18n)
- `docs/ui-rules.md` (legacy→Mantine boundary notes only)
- `docs/qa-rules.md`
- `docs/backlog.md`
- Scan `docs/critical-flow-registry.md` for the agent-registration entry (see negative-flow table).

## Scope

1. Create one minimal `'use client'` presentational island for the Agent-CTA (recommended `src/components/shared/AgentCtaButton.tsx`).
2. Render it in `src/app/[locale]/page.tsx` (lines 98–105) in place of the `buttonVariants` `<Link>`.
3. Remove the now-unused `buttonVariants`/`cn` import from `page.tsx` **only if** no other usage remains in the file — note: `page.tsx:53` still uses `buttonVariants`, so the import must **stay**. Do not remove it.

## Out of scope

- The second homepage `buttonVariants` usage at `page.tsx:53` (ghost/sm control) — leave untouched.
- All other `buttonVariants` consumers: `src/app/admin/users/page.tsx`, `src/app/[locale]/auth/confirm-email/page.tsx`, `src/app/[locale]/auth/verified/VerifiedCard.tsx`.
- Any change to the CTA copy, translation values, section gradient, header `Building2`, `h2`/`p`, or the auth/register destination page.
- Deleting or modifying `src/components/ui/button.tsx` (still used elsewhere).
- Adding a Storybook story (not required at Q2; only if owner elevates to Q3).

## Current and required behavior

**Current:** The Agent-CTA is a `<Link>` styled by legacy shadcn `buttonVariants({ size: 'lg' })` (solid primary). It navigates to `/${locale}/auth/register?type=agent`, carries `data-track="register"`, shows a `Building2` icon + `home.agent_cta_button` label, is full-width with ≥44px height and wrapping label below 640px, and natural-width centered at ≥640px.

**Required after:** Identical navigation, analytics attribute, icon, localized label, and responsive behavior — now rendered by the canonical Mantine `Button` (`variant="filled"`, `size="lg"`, `component={Link}`, `leftSection={<Building2/>}`) inside a minimal client island. `page.tsx` remains a Server Component.

## Positive and negative flows

**Positive flow:** A guest on the Homepage (any of `sq`/`en`/`uk`/`it`) sees the solid primary "Приєднатись як агент" CTA with the building icon → clicks/taps it → navigates to `/${locale}/auth/register?type=agent`; `data-track="register"` fires as before. On a 320px viewport the button spans the row full-width at ≥44px height with the label wrapping, not overflowing.

**Negative-flow applicability:**

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | No | Pure navigation control; no form/input in scope | N/A | — |
| Authorization/RLS | No | Public homepage → public register route; the swap changes rendering only, not the route or its guards | N/A | — |
| Offline/network | No | Standard `next/link` navigation; unchanged global behavior | N/A | — |
| Concurrent writer | No | No write path touched | N/A | — |
| Long-label / narrow viewport overflow | **Yes** | P0 clause 11; `uk` label is the longest | Label wraps within a full-width ≥44px button at 320px; no horizontal overflow | `screenshots:responsive` `uk@320` |

Critical-flow note: the destination (`/auth/register?type=agent`) may belong to the agent-registration critical flow, but **this task does not touch that route, its form, or its logic** — only the entry-point control's rendering. No automated regression of the registration flow is required; the executor must confirm (read-only) that the entry point still resolves to the same href (R2) and must not alter the destination.

## Acceptance criteria

- **AC1 [R1]** Given the built Homepage, when the Agent-CTA renders, then it is a Mantine `Button` (Mantine `Button-root` class / `data-variant="filled"`) and the control no longer derives its classes from `buttonVariants`.
- **AC2 [R2]** Given any locale `L`, when the CTA renders, then its `href` equals `/${L}/auth/register?type=agent` exactly.
- **AC3 [R3]** Given the rendered CTA, then the element carries `data-track="register"`.
- **AC4 [R4]** Given each of `sq`/`en`/`uk`/`it`, when the Homepage renders, then the CTA shows the `Building2` icon and the locale's `home.agent_cta_button` string; `check:i18n` passes with no new/missing key.
- **AC5 [R5]** Given a 320px and 390px viewport (incl. `uk@320`), when the CTA renders, then it is full-width with a ≥44px height and the label wraps without horizontal overflow; given ≥640px, it renders at natural width, centered.
- **AC6 [R6]** Given desktop and mobile renders, when compared to the current solid-primary CTA and the TailAdmin Button reference, then color, emphasis, and radius read as the same primary CTA with no regression.
- **AC7 [R7]** Given the diff, then only the island file and the Agent-CTA block in `page.tsx` changed; `page.tsx:53`'s `buttonVariants` usage, the section wrapper, header icon, and copy are byte-unchanged; the `buttonVariants` import remains (still used at `:53`).
- **AC8 [R8]** Given `check:hydration`, then the Homepage produces no new hydration console error attributable to this change; `page.tsx` remains an async Server Component.

## QA profile and verification plan

**Profile: `Q2 Standard UI`.** Justification: a single, already-canonical primitive is reused on one existing surface; no new/migrated primitive, overlay, table strategy, page shell, or navigation region is created. Chrome does change for the one control, so TailAdmin side-by-side for the button is required per agent-contract clause 16, but the blast radius does not warrant a full Q3 matrix. (See OQ1 — owner may elevate.)

Run and record actual results for each:

1. `npm run typecheck` → expect 0 errors.
2. `npm run lint` (touched files) → expect clean.
3. `npm run check:i18n` → expect parity pass, no key delta (label preserved).
4. `npm run check:i18n-hardcode` → expect no new hardcoded string (label stays i18n-backed).
5. `npm run check:file-integrity` and `npm run check:mojibake` on touched files → expect pass.
6. `npm run check:design-tokens` → expect pass (no off-scale raw values introduced; justify any Tailwind utility used for chrome).
7. `npm run screenshots:responsive` for the Homepage → capture the Agent-CTA at **320, 390, 768, 1024, 1440**; `uk@320` mandatory; capture all four locales at 320 and the desktop width. Attach a TailAdmin Button side-by-side for the CTA chrome.
8. `npm run check:hydration` → expect no new Homepage hydration error (new client boundary added).

If any command cannot run in the executor sandbox, record it as **missing evidence** with the exact native command and the expected artifact — never substitute a confidence claim (agent-contract clause 9).

## Completion report contract

Sonnet's session log (`docs/sessions/2026-07-17-task621-*.md`) and a concise `docs/backlog.md` state update must include:

- Changed files (a "Files Changed" table matching the real diff).
- Completed requirement IDs (R1–R8) with the evidence location for each.
- Every command from the verification plan with the **actual** result (not "should pass").
- Rendered-evidence artifact paths (screenshots incl. `uk@320`, TailAdmin side-by-side).
- The chosen island mechanism (A1) and responsive-width mechanism (A2) as-built.
- Assumptions, deviations, limitations, unresolved issues.
- Final status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED` — never self-approval.

Handoff: execute this task via `.claude/skills/execute-task/SKILL.md` against this file path. Do not run or emit mutating git commands.

## Task quality gate

- [x] A fresh Sonnet session can execute without hidden chat context (exact files, lines, imports, and commands named).
- [x] Every primary requirement (R1–R8) has ≥1 binary acceptance criterion and ≥1 verification method.
- [x] Scope names what must not change (R7, Out of scope) and protects the surviving `buttonVariants` import.
- [x] Legacy→Mantine boundary, QA profile, four-locale need, and rendered-proof path are explicit; no Storybook story is falsely required at Q2.
- [x] Each changed visual artifact and each preserved sibling is traced to inspected markup/classes/tokens (visual source map); a solid fill is distinguished from gradient/border/section chrome.
- [x] Change/preserve/out-of-scope classifications agree with the owner's "make it the Mantine Button" intent; no plausible defect source mislabeled as preserved.
- [x] Negative flows are selected by applicability, not copied generically.
- [x] No command, file, story, or behavior is claimed without inspection (commands verified in `package.json`; lines verified in source).
- [x] Requested gates prove the changed behavior (Mantine render, href/data-track preservation, responsive full-width, hydration safety), not mere procedure.
- [x] Assumptions (A1, A2) and the open QA-depth decision (OQ1) are visible to executor and reviewer.
