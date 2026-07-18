# Task 623 — Split `Footer` into `FooterView` + `Mantine/Primitives/FooterView` story, then migrate its mechanism to Mantine

## Mode and task type

- Mode: implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- Task type: **UI — container/presentational split + new Storybook primitive + Mantine migration** of the site-wide
  public footer. Blast radius: every public page (`src/app/[locale]/layout.tsx:53` renders `<Footer />` globally).
- UI boundary: source surface is **legacy shadcn/Tailwind**; destination is the **current Mantine/TailAdmin path**.
  Sources of truth: `docs/mantine-responsive-design-system.md` (behavior/responsive),
  `docs/tailadmin-style-reference.md` (chrome/density), `docs/component-rules.md` (split + Storybook-First).
- **Two ordered phases with a mandatory checkpoint** (see `Scope`). The owner chose the combined scope; the phasing
  exists so the structural split can be proven independently of the restyle, not to reduce that scope.

## Objective

Make the public footer renderable and provable in Storybook, then move its rendering mechanism from legacy Tailwind
markup to Mantine primitives — **without changing how it looks**. Today `Footer.tsx` is an `async` Server Component
that fetches its own data, so no story can render it at all, and its appearance is enforced by nothing.

## Verified context

All facts below were inspected in the repo on 2026-07-18. Re-open the cited files to implement; do not re-derive.

### Current component (verified)

- `src/components/layout/Footer.tsx` — `export async function Footer()`, an **async Server Component**. It awaits
  four things in one `Promise.all`: `getTranslations('nav')`, `getLocale()`,
  `getSetting('site_name', 'Lero.al')`, and `getFooterContent(await getLocale()).catch(() => null)`.
- Consumer: `src/app/[locale]/layout.tsx:9,53` — the only consumer, `<Footer />`, no props.
- `getFooterContent` (`src/modules/admin/actions/footer.ts:36-57`) is `'use server'`, builds an **admin Supabase
  client**, reads `site_footer`, falls back `locale → 'sq' → null`, and returns `null` on any throw. This is exactly
  the kind of dependency that `docs/component-rules.md:35-48` forbids in a presentational primitive.
- Data shape: `SiteFooter` / `FooterLink` (`src/types/database.ts:546-567`). `FooterLink` =
  `{ id, label, url, enabled, order }`; `url` is relative (`/listings`) **or** absolute (`https://…`).
- Local helpers in `Footer.tsx:8-30`: `resolveHref(url, locale)` (absolute passthrough, else `/${locale}${…}`),
  `isExternal(url)`, and the `FooterLink_` renderer that adds `target="_blank" rel="noopener noreferrer"` for
  external URLs only.
- Container-side derivations that must be preserved exactly:
  - brand/TLD split — `siteName.includes('.') ? [split[0], '.' + rest] : [siteName, '']` (`Footer.tsx:41-43`);
  - per-field fallback — `footerData?.X || t('…')` for tagline, three section titles, copyright template
    (`Footer.tsx:46-51`);
  - `copyrightTmpl.replace('{year}', String(year))` with `year = new Date().getFullYear()`;
  - `.filter(l => l.enabled)` on all three link arrays (`Footer.tsx:53-55`);
  - `hasNavLinks`/`hasInfoLinks`/`hasSocialLinks` → hardcoded fallback link sets
    (`Footer.tsx:57-59, 86-92, 106-113, 133-138`).

### Precedent to follow (verified)

- `src/components/layout/HeaderView.tsx` + `src/stories/mantine/primitives/HeaderView.stories.tsx` (Task 590) is the
  exact pattern: container keeps hooks/data, `HeaderView` is `'use client'` and prop-driven, story lives under
  `Mantine/Primitives/`. `HeaderView` is **mostly Tailwind** internally (one Mantine import: `ActionIcon`,
  `HeaderView.tsx:7`) — so the `Mantine/Primitives/` title is a **gate-enrolment choice, not a taxonomy claim**, as
  its own story header documents.
- `docs/component-rules.md:34-51` — Container/Presentational split is **OWNER P0, MANDATORY**. A story that has to
  mock a data/network hook means the split was skipped → task incomplete.
- `docs/component-rules.md:53-64` — Storybook-First is **OWNER P0**: the story must render and prove the changed
  state *before* it is considered live. A site-only change is a task failure.

### Gate consequences of the new story title (verified)

- `scripts/check-stories-rendered.mjs:269` — `MANTINE_STORY_TITLE_PREFIXES = ['Mantine/Primitives/', 'Patterns/Mantine/']`.
  Enrolment is **purely prefix-derived**, never a hardcoded list. Titling the story `Mantine/Primitives/FooterView`
  therefore enrols it automatically into the `--mantine-only` **hard-blocking CI gate**
  (`.github/workflows/governance-pr.yml`, per `check-stories-rendered.mjs:273`). This is intended, not a side effect.
- `src/stories/_storyI18n.ts` — `storyT(locale, key)` **throws** on a missing key (no English fallback, by design).
  Every new `storybook.mantine.footer_*` key must exist in **all four** `messages/{en,sq,uk,it}.json` or the story
  throws at render. `messages/en.json` currently holds 322 keys under `storybook.mantine`.
- Story fixture strings must go through `storyT` — raw literals are forbidden
  (`docs/storybook-governance.md` §14.2, cited by `_storyI18n.ts`).

### Visual source map

Every token below was traced to its concrete value in `src/app/globals.css`.

| Visible artifact/state | Component/markup | Class/selector | Utility, cascade, and token path | Disposition | Evidence |
|---|---|---|---|---|---|
| Footer band background | `<footer>` | `bg-surface-2` | `--color-surface-2` → `--surface-2` → `--neutral-50` (`#FAFAFA`); dark `oklch(0.162 0 0)` | **Preserved** — identical computed colour after migration | `globals.css:70,379,461` |
| Top hairline | `<footer>` | `border-t` | default border token, 1px top only | **Preserved** | `Footer.tsx:62` |
| MobileBottomNav clearance | `<footer>` | `pb-14 md:pb-0` | 56px bottom padding `<768` only; clears `src/components/layout/MobileBottomNav.tsx` | **Preserved — P0.** Losing it hides footer content behind the mobile bottom bar | `Footer.tsx:62` |
| Dead hook class | `<footer>` | `site-footer` | **no CSS anywhere** — repo-wide grep finds exactly one occurrence, its own declaration; no rule in `globals.css`, no script, no test | **Preserved as-is** — removal is a separate decision (OQ2) | `Footer.tsx:62` |
| Content column geometry | inner `<div>` | `container-wide` | `width:100%; max-width:88rem (1408px); margin-inline:auto;` padding-inline `1rem` → `1.5rem`@640 → `2rem`@1024 → `3rem`@1536 | **Preserved — P0.** Must not become Mantine `Container` defaults | `globals.css:577-587` |
| Vertical rhythm | inner `<div>` | `py-12` | 48px block padding | **Preserved** | `Footer.tsx:63` |
| Column grid | grid `<div>` | `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10` | 1 col `<640`, 2 cols `≥640`, 3 cols `≥768`; 40px gap | **Preserved** — same breakpoints and gap after migration | `Footer.tsx:64` |
| Link colour + hover | `FooterLink_` | `text-sm text-muted-foreground hover:text-foreground transition-colors w-fit` | `--color-muted-foreground` → `--muted-foreground` → `--neutral-500` (5.2:1 on white, WCAG AA) | **Preserved** — including the AA contrast ratio | `globals.css:35,337` |
| Section headings | `<p>` | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` | 12px / 600 / uppercase / widest tracking | **Preserved** | `Footer.tsx:79,99` |
| Brand wordmark | `<Link>` | `font-bold text-xl` + `text-primary` / `text-foreground` | brand in primary, TLD in foreground — the `.`-split at `Footer.tsx:41-43` | **Preserved** | `Footer.tsx:67-70` |
| Bottom bar | `<div>` | `mt-12 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3` | stacks `<640`, row `≥640` | **Preserved** | `Footer.tsx:119` |

### Known gap — no TailAdmin reference exists for a site footer

`docs/tailadmin-style-reference.md` contains **no site-footer section**. Its only footer content is an addendum on
**overlay/dialog footers** (line 511: popover/modal button-group gap 12px). That reference governs dialog action
rows and is **not applicable** to a page footer. Consequence: chrome parity for this surface **cannot** be sourced
from TailAdmin, so the migration target is defined as *appearance-preserving* (see `Implementation requirements`).

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | `component-rules.md:34-51` | `FooterView` exists as a prop-driven presentational component: **no** data-fetching, network, Supabase, router, or `getSetting`/`getFooterContent` call; renders JSX only | P0 | Source inspection + the story renders with zero hook/module mocks | Confirmed |
| R2 | Boundary rule | `Footer.tsx` public API unchanged — `layout.tsx:53` `<Footer />` untouched; container keeps all four awaited data calls and all derivations listed in Verified context | P0 | Diff inspection; `layout.tsx` not in the diff | Confirmed |
| R3 | Phase 1 gate | After Phase 1 the rendered footer is **visually identical** to the pre-task baseline at every canonical width and all 4 locales | P0 | Before/after screenshot comparison at the Phase-1 checkpoint | Confirmed |
| R4 | Owner | Story `Mantine/Primitives/FooterView` renders **two** fixtures: DB-content (all three link groups populated, incl. ≥1 external URL) and fallback (all three empty → hardcoded sets) | P1 | Rendered story; both fixtures visible | Confirmed |
| R5 | `_storyI18n.ts`, governance §14.2 | Every fixture string resolves via `storyT`; every new `storybook.mantine.footer_*` key exists in all 4 message files | P1 | `npm run check:i18n`; story renders in all 4 locales without throwing | Confirmed |
| R6 | Owner | Phase 2: footer markup uses Mantine primitives for layout/typography/links, with **appearance preserved** against the Phase-1 baseline | P1 | Q3 matrix + Phase-1-vs-Phase-2 screenshot comparison | Confirmed |
| R7 | Visual source map | `pb-14 md:pb-0` MobileBottomNav clearance and `container-wide` geometry (88rem cap + the four padding steps) survive Phase 2 | P0 | DOM measurement of footer padding-bottom `<768` and content-column width/padding at 320/640/1024/1536 | Confirmed |
| R8 | `Footer.tsx:18-30` | External links keep `target="_blank" rel="noopener noreferrer"`; internal links keep the locale prefix from `resolveHref` | P0 | Rendered DOM attribute assertion in both fixtures | Confirmed |
| R9 | `check-stories-rendered.mjs:269` | The new story passes the prefix-enrolled `--mantine-only` blocking gate | P1 | `node scripts/check-stories-rendered.mjs --mantine-only` | Confirmed |
| R10 | Preserve | Fallback-selection logic (`hasNavLinks`/`hasInfoLinks`/`hasSocialLinks`, `.filter(l => l.enabled)`, `{year}` substitution, brand/TLD split) behaves exactly as before, wherever it now lives | P0 | Inspection + both story fixtures | Confirmed |

## Assumptions and open questions

- **A1 — prop shape.** `FooterView` should receive **fully-resolved** props (`brand`, `tld`, `tagline`, three section
  titles, three already-filtered link arrays *including* the fallback substitution, `copyright` as a finished string,
  `locale`), so it needs **no i18n hook at all**. `component-rules.md:44-48` permits `useTranslations` inside a
  presentational primitive, but keeping it out is strictly better here: the container already resolves every string,
  and a hook-free view is trivially storyable. **Consequence the executor must accept:** fallback *selection* stays
  container logic and is therefore not proven by the story — only fallback *rendering* is. That is the correct split;
  do not move selection into the view to make it storyable.
- **A2 — appearance-preserving migration.** Because no TailAdmin site-footer reference exists (see Verified context),
  "migrate to Mantine" means **swap the mechanism, keep the pixels**. Any deliberate visual change is out of scope and
  needs its own owner-approved task. If a Mantine primitive cannot reproduce an artifact from the visual source map
  within ±1px, **stop and report** rather than approximating.
- **OQ1 (owner, not blocking):** should Phase 2 use Mantine `Container` or keep the `container-wide` class? Mantine
  `Container` has its own `size`/padding defaults that do **not** match the four `container-wide` steps. Default
  position: keep `container-wide` on the inner wrapper and use Mantine for everything inside it. Deviating requires
  reproducing all four padding steps and proving it by measurement (R7).
- **OQ2 (owner, not blocking):** the `site-footer` class is dead (no CSS, no consumer, repo-wide). Preserve it in this
  task; removing it is a Task 613-style dead-code cleanup and needs its own decision.

## Pre-read rule bundle

Executor reads exactly:

- `docs/agent-contract.md`
- `docs/rule-index.md` → **UI / Layout / Component → Current Mantine path** + **Storybook / Visual Proof**
- `docs/qa-profiles.md`
- `docs/component-rules.md` (§ Container/Presentational Split, § Storybook-First)
- `docs/mantine-responsive-design-system.md`
- `docs/tailadmin-style-reference.md`
- `docs/storybook-governance.md` (§14.2 fixture-i18n rule)
- `docs/qa-rules.md`
- `docs/backlog.md`
- `src/components/layout/HeaderView.tsx` + `src/stories/mantine/primitives/HeaderView.stories.tsx` (the pattern)
- `src/components/layout/Footer.tsx`, `src/app/[locale]/layout.tsx`, `src/types/database.ts:546-567`

## Scope

**Phase 1 — split, zero visual change.**

1. Create `src/components/layout/FooterView.tsx` — presentational, prop-driven, Tailwind classes moved **1:1** from
   `Footer.tsx`. Move `resolveHref`/`isExternal`/`FooterLink_` with it (pure functions, no data access).
2. Reduce `Footer.tsx` to the container: keep all four data calls and every derivation, render `<FooterView … />`.
3. Create `src/stories/mantine/primitives/FooterView.stories.tsx`, title `Mantine/Primitives/FooterView`, two fixtures
   (R4), all strings via `storyT`, wrapped in `MantineStoryShell`.
4. Add `storybook.mantine.footer_*` keys to all four `messages/*.json`.

**CHECKPOINT — do not start Phase 2 until this passes.** Capture the Q3 width matrix for the live footer *before* any
edit and again after Phase 1, and confirm they are identical. Record both artifact sets. If they differ, Phase 1 has a
regression — fix it before touching styling. This checkpoint is what makes the Phase 2 diff interpretable.

**Phase 2 — Mantine mechanism, appearance preserved.**

5. Replace the layout/typography/link markup inside `FooterView` with Mantine primitives, preserving every artifact in
   the visual source map. Prove each state in the story first (Storybook-First), then confirm the site inherits it.

## Out of scope

- Any deliberate visual redesign of the footer (see A2) — including spacing, type scale, colour, or column layout
  changes not present in the current render.
- `src/components/admin/AdminFooterManager.tsx`, `src/modules/admin/actions/footer.ts`, the `site_footer` table, RLS,
  or the footer route allowlist (`src/lib/footer-route-allowlist.ts`).
- `MobileBottomNav.tsx` itself (only the footer's clearance for it is in scope).
- Removing the dead `site-footer` class (OQ2).
- `HeaderView`, any other layout component, and the `theme.ts` Button work from Task 622.

## Current and required behavior

**Current:** the footer is an async Server Component that fetches its own settings and DB content, so it cannot be
rendered in Storybook at all and no gate enforces its appearance. Its markup is legacy Tailwind. It renders a
3-column grid (brand+tagline · nav · info) plus a bottom bar (copyright · social links), with DB-driven links and
hardcoded fallbacks when the DB is empty or unreachable.

**Required after:** the same footer, pixel-for-pixel, but rendered by a hook-free `FooterView` that a story exercises
in both content states across four locales and the full width matrix, built on Mantine primitives, enrolled in the
blocking `--mantine-only` gate.

## Implementation requirements

- `FooterView` must not import `getSetting`, `getFooterContent`, `createClient`, `next/navigation`, or any Supabase
  module. Importing `next/link` and `lucide-react` is fine.
- Per A1, `FooterView` takes resolved props and calls no i18n hook. Do not add `useTranslations` to it.
- Keep `resolveHref` behavior byte-identical, including the `if (!url) return '#'` guard.
- No new off-token raw values. Tailwind utilities carried over 1:1 in Phase 1 are not new violations; any *new* value
  introduced in Phase 2 must resolve to an existing token.
- Do not weaken or re-baseline any gate to make it pass. If `check:i18n-hardcode` or `check:story-coverage` flags the
  new files, fix the cause; do not run an `--update-baseline`/`--update-exempt` variant.

## Positive and negative flows

**Positive flow:** a visitor on any public page scrolls to the footer → sees brand + tagline, the nav and information
columns, and the bottom bar with copyright and social links → internal links carry the locale prefix, external links
open in a new tab → identical layout to before this task at every width and locale.

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Empty/missing DB content | **Yes** | `getFooterContent` returns `null` on error or empty table (`footer.ts:44-56`) | Hardcoded fallback links + i18n section titles render; no empty columns, no crash | Story fallback fixture (R4) |
| External vs internal URL | **Yes** | `resolveHref`/`isExternal` (`Footer.tsx:8-16`) | External → `target="_blank" rel="noopener noreferrer"`, no locale prefix; internal → locale-prefixed, no target | DOM attribute assertion in the DB fixture (R8) |
| Locale expansion | **Yes** | 4 locales; `uk` longest | No clipping, no horizontal overflow at 320 in any locale | Q3 matrix, 4 locales @320 |
| Small viewport / MobileBottomNav overlap | **Yes** | `pb-14 md:pb-0` + `MobileBottomNav.tsx` | Footer content clears the mobile bottom bar `<768` | Measured padding-bottom (R7) |
| `site_name` without a TLD | **Yes** | `Footer.tsx:41-43` brand/TLD split | Whole name renders as brand, empty TLD span, no stray `.` | Inspection + one fixture value |
| Validation | No | No form or input in the footer | N/A | — |
| Authorization/RLS | No | Public read-only surface; admin write path is out of scope | N/A | — |
| Concurrent writer | No | No write path in the footer | N/A | — |

## Acceptance criteria

- **AC1 [R1]** Given `FooterView.tsx`, when its imports are inspected, then it contains no data-fetching, network,
  Supabase, or router import, and the story renders it with no hook mock, no `.storybook` module alias, and no live
  Supabase.
- **AC2 [R2]** Given the diff, then `src/app/[locale]/layout.tsx` is unchanged and `Footer`'s exported signature is
  unchanged.
- **AC3 [R3]** Given the pre-task and post-Phase-1 screenshot sets at the canonical widths × 4 locales, then they are
  visually identical.
- **AC4 [R4, R10]** Given the story, when both fixtures render, then the DB fixture shows the supplied links and the
  fallback fixture shows the hardcoded sets, in all four locales.
- **AC5 [R5]** Given `npm run check:i18n`, then it passes with the new keys present in all four message files, and the
  story renders in `en`/`sq`/`uk`/`it` without a `storyT` throw.
- **AC6 [R6]** Given the post-Phase-2 render, then every artifact in the visual source map matches the Phase-1
  baseline within ±1px, at every canonical width and all four locales.
- **AC7 [R7]** Given measurement, then footer `padding-bottom` is 56px `<768` and 0 `≥768`, and the content column
  measures max-width 1408px with padding-inline 16/24/32/48px at 320/640/1024/1536.
- **AC8 [R8]** Given both fixtures, then every external link carries `target="_blank"` and `rel="noopener noreferrer"`
  and no locale prefix; every internal link carries the locale prefix and neither attribute.
- **AC9 [R9]** Given `node scripts/check-stories-rendered.mjs --mantine-only`, then it passes with the new story
  enrolled.
- **AC10 [R10]** Given a `site_name` without a `.`, then the brand renders whole with no trailing separator.

## QA profile and verification plan

**Profile: `Q3 Full Visual Matrix`.** Justification: a new `Mantine/Primitives/*` story plus a migrated layout surface
that appears on every public page — `docs/qa-profiles.md:15` names "new or migrated Mantine primitive" and "page
shell" explicitly. Full canonical widths + all four locales required. TailAdmin side-by-side is **not applicable**:
no site-footer reference exists (Verified context), and A2 fixes the target as appearance-preserving, so the
Phase-1 baseline *is* the reference.

Run and record **actual** results:

1. `npm run typecheck` → 0 errors.
2. `npx eslint src/components/layout/FooterView.tsx src/components/layout/Footer.tsx src/stories/mantine/primitives/FooterView.stories.tsx` → clean.
3. `npm run check:i18n` → pass (new keys in all 4 files).
4. `npm run check:i18n-hardcode` → no new finding. Do **not** update the baseline.
5. `npm run check:design-tokens` → no new violation in the touched files.
6. `npm run check:file-integrity` + `npm run check:mojibake` → pass (Cyrillic `uk` keys make mojibake non-trivial here).
7. `npm run check:stories` → pass.
8. `npm run check:story-coverage` → pass. Do **not** update the exempt list.
9. `node scripts/check-stories-rendered.mjs --mantine-only` → pass, with `Mantine/Primitives/FooterView` present in
   the enrolled set. Record the line proving enrolment.
10. Q3 matrix for `mantine-primitives-footerview--default` at `320/375/390/480/560/680/768/810/960/1024/1200/1440/1920`
    at `en`, plus all four locales at 320. Both fixtures visible in every capture.
11. **Phase-1 checkpoint evidence:** the same width matrix captured against the live footer (`next dev`) *before* any
    edit and *after* Phase 1, plus the comparison result (AC3).
12. **Phase-2 comparison:** Phase-1 vs Phase-2 renders with the per-artifact result for every visual-source-map row (AC6).
13. DOM measurement for AC7 (footer padding-bottom at 320/768; content-column width and padding-inline at
    320/640/1024/1536) and AC8 (link attributes in both fixtures).
14. `npm run check:hydration` → Homepage en/sq/uk PASS. Warm run: the gate is cold-compile-flaky — prime routes first
    and restart the dev server before trusting a FAIL (documented Task 582/622 pattern).

Persist every artifact under `.screenshots/task623/` (gitignored) and **record the paths in the session log**. Do not
write evidence to a session scratchpad — Task 622 lost its entire Q3 proof that way and it had to be re-captured.

If any command cannot run in the executor sandbox, record it as **missing evidence** with the exact native command and
expected artifact — never substitute a confidence claim (agent-contract clause 9).

## Completion report contract

Sonnet's session log (`docs/sessions/<date>-task623-*.md`) and a concise `docs/backlog.md` update must include:

- A "Files Changed" table matching the real diff.
- R1–R10 with the evidence location for each.
- Every verification-plan command with the **actual** result.
- The Phase-1 checkpoint comparison (AC3) stated explicitly as its own result, before any Phase-2 evidence.
- Per-artifact Phase-1-vs-Phase-2 results for every visual-source-map row (AC6).
- Measured numbers for AC7 and attribute results for AC8.
- Artifact paths under `.screenshots/task623/`.
- Where fallback-selection logic ended up and why (A1), plus the OQ1 decision actually taken.
- Assumptions, deviations, limitations, unresolved issues.
- Final status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, `PARTIALLY IMPLEMENTED`, or `BLOCKED` — never
  self-approval.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path. Do not run or emit mutating git
commands.

## Task quality gate

- [x] A fresh Sonnet session can execute without hidden chat context (exact files, line numbers, tokens, story title, commands named).
- [x] Every primary requirement (R1–R10) has ≥1 binary acceptance criterion and ≥1 verification method.
- [x] Scope names what must not change (`layout.tsx`, `Footer` API, `container-wide` geometry, `pb-14` clearance, link attributes, fallback logic) and what is explicitly excluded.
- [x] Current Mantine path, Q3 profile, four-locale need, and the Storybook proof path are explicit; the source surface is correctly identified as legacy.
- [x] Every changed and preserved visual artifact is traced to inspected markup, classes, and concrete token values.
- [x] The missing TailAdmin site-footer reference is surfaced, not papered over, and resolved by defining an appearance-preserving target (A2) with the Phase-1 baseline as the reference.
- [x] The two risky changes (split, restyle) are separated by a checkpoint so a regression is attributable.
- [x] Negative flows are selected by applicability (empty DB, external URL, locale, mobile clearance, TLD-less site name), not copied generically.
- [x] No command, file, class, token, story ID, or gate behavior claimed without inspection — all npm scripts verified against `package.json`, gate enrolment verified at `check-stories-rendered.mjs:269`.
- [x] Gates prove the changed behavior (visual identity, attribute correctness, measured geometry, gate enrolment), not mere procedure; baseline-updating escape hatches are explicitly forbidden.
- [x] Assumptions (A1, A2) and open owner decisions (OQ1, OQ2) are visible to executor and reviewer.
