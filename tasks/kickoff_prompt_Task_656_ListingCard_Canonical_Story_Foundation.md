# Task 656 — Establish the Story-first canonical foundation for the listing card: extract the copy-ID control into a canonical Mantine card footer-action component (owning its own styling), rebuild the `ListingCardPattern` Story as a truthful Mantine rendering (no legacy/demo stand-ins), add a canonical `ListingCard` Story that statically imports the real production component, then migrate production `ListingCard` onto the canonical copy-ID component — removing the Homepage-only local CSS hardcode. Supersedes Task 655.

- **Task number:** 656
- **Epic:** MM — Mantine/TailAdmin migration (listing-card Story-first correction).
- **Parent / origin:** Owner directive 2026-07-21 + new **agent-contract clause 16c** / orchestrator-procedures "Canonical Story source-of-truth check" / storybook-governance **§15.1a** (canonical Mantine Story is the mandatory visual source of truth). Task 655 hardcoded the copy-ID styling in a Homepage-only `ListingCard.module.css` and left the `ListingCardPattern` Story rendering legacy demo stand-ins (shadcn `DemoFavoriteButton`, a static copy-ID `<span>`), so the Story diverged from production. This task corrects that with the owner-defined structure.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** canonical-component extraction + Storybook Story-first foundation + consumer migration. Behavior-preserving. Multi-deliverable but one cohesive graph (below); execute the deliverables **in order**.
- **Build gate (governance `67340ff49`):** non-Q0 → final `npm run build` exit 0 required.
- **Critical flow:** "Listing card rendering" (`docs/critical-flow-registry.md`, 602/605) — copy-id is an asserted footer action. `ListingCard.smoke.test.tsx` regression + a planted-violation are mandatory.
- **Clause 16c binding:** the `ListingCardPattern` Story and the new `ListingCard` Story are the canonical visual source of truth; both must render the **real** canonical Mantine components (not demo stand-ins). Route-only evidence and demo-slot proof are prohibited.

## Target dependency graph (owner-defined — this is the required end state)

```
Canonical copy-ID footer-action component (Mantine, owns its own styling + clipboard/copied state)
├─ Mantine ListingCard primitive Story  (statically imports the real production ListingCard)
├─ ListingCardPattern Story             (feeds the pattern's footerActions/favorite slots with the SAME real canonical components)
└─ production ListingCard
   └─ MantineListingCardPattern         (layout/card-chrome owner — must NOT absorb clipboard state)
```

`MantineListingCardPattern` stays the layout/card-chrome owner and receives copy-ID via its `footerActions` slot. Copy-ID is a separate canonical behavior-bearing subcomponent; production `ListingCard` supplies it the real id + i18n labels. **Neither Story imports the other** — they are connected only through the shared real canonical components.

## Verified context

Inspected 2026-07-21.

- **Pattern** `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` (SINGLE SOURCE OF TRUTH, Task 605): Mantine `Card`; `image`/`favorite`/`footerActions` are `ReactNode` slots. `favorite` contract: grid → self-positions `absolute top-2 right-2`; list → inline `shrink-0 -mt-0.5 -mr-1`. `footerActions` → copy-id + date cluster passed as a node. Owns all chrome; must stay clipboard-agnostic.
- **Story (broken)** `src/stories/patterns/mantine/ListingCardPattern.stories.tsx`: renders `DemoImage`, `DemoFavoriteButton` (built on legacy `import { Button } from '@/components/ui/button'`, line 4 — shadcn), `DemoFooterActions` (a static `<span>`, lines 65–75). `Default` story renders a grid section (6 variants) + a list section (6 variants) via `DemoCard`. These demos do NOT reflect production (real favorite = Mantine `ActionIcon` since Task 653; real copy-id = `UnstyledButton` since Task 655).
- **Production consumer** `src/modules/listings/components/ListingCard.tsx` (`'use client'`, thin data-mapper): `useLocale`/`useTranslations('listing')`, `useState` (`idCopied`), `copyId` (line ~117: `preventDefault`, `navigator.clipboard?.writeText(listing.id)`, `setIdCopied(true)`, `setTimeout(...1500)`). Props include `listing`, `variant: 'vertical'|'horizontal'`, `rates`, `displayCurrency`, `isFavorited`, `onFavoriteToggled` (exchange **rates are passed in as a prop** — no exchange hook inside ListingCard). Renders `FavoriteButton` (→ `useAuth`/`AuthContext`) and two identical copy-ID controls (`footerActions` line ~286 grid, `listFooterActions` line ~189 list).
- **Task 655 (uncommitted, to be superseded):** `ListingCard.tsx` copy-id → `UnstyledButton` + a local `ListingCard.module.css` hardcoding `font-size: var(--text-2xs)`, `color: color-mix(muted-foreground 70%)`, `:hover` → muted-foreground, `:focus-visible { outline: none }` (to beat `UnstyledButton`'s unlayered CSS which forces 16px/inherit + a doubled focus outline). **These exact overrides move into the canonical component** (D1). Revert the local `ListingCard.module.css` before/as part of this task; do not keep it.
- **Story infra:** `src/stories/_MantineStoryShell.tsx`, `src/stories/_storyI18n.ts` (`storyT`), `src/stories/fixtures/`. No existing story mounts a real listings component with `AuthContext` — the `ListingCard` Story (D4) must add a mocked signed-in `AuthContext` provider so `FavoriteButton` renders. Coverage: `scripts/check-story-coverage.mjs` + the `scripts/mantine-migration-scope.json` manifest (currently 6 entries; `ListingCard.tsx` not yet listed).
- **Canonical primitive precedents:** `src/design-system/mantine/patterns/` (`MantineCountButton.tsx` etc.) is where canonical behavior-bearing card subcomponents live; `src/stories/mantine/primitives/*.stories.tsx` (title `Mantine/Primitives/<Name>`) is the primitive-story convention; `FavoriteButton.tsx` + `FavoriteButton.module.css` is the `data-*`-attribute-specificity CSS-module template (Task 653) for beating `UnstyledButton`'s unlayered CSS.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D1 | A canonical Mantine copy-ID footer-action component exists (e.g. `MantineCopyIdButton`, `src/design-system/mantine/patterns/`), built on `UnstyledButton`, owning its own co-located `.module.css` (the exact Task-655 overrides) + the clipboard write + Copy↔Check copied-state toggle. App-specific bits (`id` to copy, display label `#<public_id>`, aria `copy`/`copied` labels) are **props** — no app i18n inside. Pattern stays clipboard-agnostic. | P0 | `git diff`; component source | Confirmed |
| R2 | D2 | A primitive Story `Mantine/Primitives/CopyIdButton` renders the D1 component (resting + copied states), toolbar-reactive; registered so `check:story-coverage` sees it | P0 | Storybook render; coverage | Confirmed |
| R3 | D3 | `ListingCardPattern` Story renders **only** real canonical Mantine components: `DemoFavoriteButton` → real `FavoriteButton`; `DemoFooterActions` static span → the D1 copy-ID component; `DemoImage` fully Mantine; the `@/components/ui/button` import is removed. Grid + list sections + all 6 variants preserved. The Story does not import another Story. | P0 | `git diff`; grep no `@/components/ui`; rendered | Confirmed |
| R4 | D4 | A canonical `ListingCard` Story `Mantine/Primitives/ListingCard` **statically imports the real production `ListingCard`** and renders grid (`variant="vertical"`) + list (`variant="horizontal"`) via MantineStoryShell + NextIntl messages + a mocked signed-in `AuthContext` + fixture `listing`/`rates` — copy-id + favorite render through the real components | P0 | `git diff` (static import); Storybook render | Confirmed |
| R5 | D5 | Production `ListingCard.tsx` consumes the D1 canonical copy-ID component in both footers (real id + labels + handler); the local `ListingCard.module.css` is DELETED; `ListingCard.tsx` added to `scripts/mantine-migration-scope.json`; `check:story-coverage` proves the static import from the D4 Story | P0 | `git diff`; coverage exit 0 | Confirmed |
| R6 | Parity | Copy-ID look + behavior are byte-identical to pre-migration at the Homepage grid card and `/listings` list card (mono `text-2xs`, 70%-muted color + hover, no doubled focus ring; click copies `listing.id`, flips to Check + `id_copied` for ~1500ms, reverts; no card nav); favorite unchanged | P0 | Computed-style before/after; `ListingCard.smoke.test.tsx` | Confirmed |
| R7 | Isolation / critical flow | `MantineListingCardPattern` unchanged (no clipboard state absorbed); `FavoriteButton`, server actions, `theme.ts`, i18n keys unchanged except added `storybook.*` demo keys if needed; `ListingCard.smoke.test.tsx` green + planted-violation | P0 | `git diff` scope; vitest | Confirmed |
| R8 | Gates + build | typecheck, check:stories, check:story-coverage, check:i18n, check:mojibake green AND `npm run build` exit 0; smoke test green | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **Owner-defined structure — no owner decision pending** (owner message 2026-07-21). Execute the graph above exactly.
- **Canonical component API (D1):** own the clipboard write + copied state + styling internally; receive `id`, display `label` (`#<public_id ?? id.slice(0,8)>`), and `copyLabel`/`copiedLabel` (aria) as props; keep `preventDefault`/`stopPropagation` so card navigation never fires. An injected `onCopy` handler is acceptable **only if** the pattern still never holds clipboard state and the component still owns styling + copied state. Move the Task-655 `.module.css` overrides into this component's co-located module verbatim (same `data-*`-attribute-specificity technique).
- **`ListingCard` Story providers (D4):** the real `ListingCard` needs Mantine (shell) + NextIntl messages + a **mocked signed-in `AuthContext`** (so `FavoriteButton` renders its authenticated state) + fixture `listing` + fixture `rates` + `displayCurrency`. No exchange-rate hook is needed (rates are a prop). If a signed-in `AuthContext` cannot be mocked cleanly in a story, STOP and report — do not fall back to a demo stand-in (clause 16c).
- **Copy-id styling provenance:** the values are already the traced production tokens (`--text-2xs`, `--color-muted-foreground` at 70%). Reuse verbatim; no new visual value invented.
- **Task 655 is superseded:** its uncommitted `ListingCard.tsx` change + `ListingCard.module.css` are reverted/deleted here; do not commit 655 separately.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, **16c canonical-Story**, 9 validation + build, 11 a11y, 12 rendered evidence, 14 file integrity).
- `docs/orchestrator-procedures.md` "Canonical Story source-of-truth check"; `docs/storybook-governance.md` §15.1a + §14/§15 coverage; `docs/rule-index.md`; `docs/qa-profiles.md` (Q3 + critical-flow).
- `docs/critical-flow-registry.md` (Listing card rendering); `docs/mantine-responsive-design-system.md` (unlayered-CSS rule, `UnstyledButton`); `docs/component-rules.md`.
- Source: `MantineListingCardPattern.tsx` + `.module.css`; `ListingCardPattern.stories.tsx`; `ListingCard.tsx` + the uncommitted `ListingCard.module.css`; `FavoriteButton.tsx` + `FavoriteButton.module.css` (CSS-module template); `MantineCountButton.tsx` (canonical subcomponent precedent); `_MantineStoryShell.tsx`, `_storyI18n.ts`, `src/stories/fixtures/`; `scripts/mantine-migration-scope.json`, `scripts/check-story-coverage.mjs`; `ListingCard.smoke.test.tsx`.

## Canonical UI decision record (clause 16c — mandatory)

| Visible artifact | Inspected source/story | Canonical decision | Shared source + coverage |
|---|---|---|---|
| Copy-ID control | `ListingCard.tsx` inline `<button>`/655 `UnstyledButton` + local `.module.css`; no primitive story | **create canonical** — new `MantineCopyIdButton` (design-system) owning styling+state; new `Mantine/Primitives/CopyIdButton` story | Shared by ListingCard Story, ListingCardPattern Story, production ListingCard; registered in `mantine-migration-scope.json`, coverage proven |
| Favorite (in card story) | `ListingCardPattern.stories` `DemoFavoriteButton` = legacy shadcn `Button` | **reuse** real `FavoriteButton` (Mantine `ActionIcon`, Task 653) in both stories | Real component; no demo |
| ListingCard (composed) | no story renders the real ListingCard | **create canonical** — `Mantine/Primitives/ListingCard` static-import story | Real production import; coverage proven |

## Scope (execute in order)

1. **D0** — revert Task 655's uncommitted `ListingCard.tsx` diff and delete `ListingCard.module.css` (start from the committed `ListingCard`; the copy-id migration is redone via the canonical component in D5).
2. **D1** — create the canonical `MantineCopyIdButton` (design-system pattern) + co-located `.module.css` (Task-655 overrides moved here, `data-*`-attribute specificity); export from the patterns barrel.
3. **D2** — `Mantine/Primitives/CopyIdButton` story (resting + copied), coverage-registered.
4. **D3** — rewrite `ListingCardPattern.stories.tsx`: real `FavoriteButton` + `MantineCopyIdButton` + Mantine image; remove `@/components/ui/button` and all demo stand-ins; keep the grid+list × 6-variant matrix; no cross-Story import.
5. **D4** — `Mantine/Primitives/ListingCard` story: static-import the real `ListingCard`, render grid+list via shell + NextIntl + mocked signed-in `AuthContext` + fixtures.
6. **D5** — migrate production `ListingCard.tsx` to `MantineCopyIdButton` in both footers; add `ListingCard.tsx` to `mantine-migration-scope.json`; `check:story-coverage` proves the static import; confirm the local module.css is gone.
7. Q3 rendered proof + computed-style parity + both vitest branches + planted-violation + `npm run build` exit 0; session log + concise `docs/backlog.md` entry.

## Out of scope

- Any card chrome change in `MantineListingCardPattern` beyond receiving the same slots (no clipboard state in the pattern).
- `FavoriteButton` internals (reuse as-is), server actions, `theme.ts`, non-copy-id i18n keys, the SaveToCollection dialog, other card surfaces.
- Changing the card's visual look (this is a structural/ownership refactor — pixels must not change).

## Current and required behavior

- **Current:** copy-id = raw/655-`UnstyledButton` with Homepage-only local CSS; `ListingCardPattern` Story renders legacy demo stand-ins; no `ListingCard` story; production not in `mantine-migration-scope.json`.
- **Required after:** copy-id = shared canonical `MantineCopyIdButton` (owns styling+state), used by production + both stories; `ListingCardPattern` Story is a truthful Mantine rendering; a `ListingCard` Story statically imports the real component; production registered + coverage-proven; zero Homepage-only local card CSS; look + behavior byte-identical.

## Positive and negative flows

| Branch | Applicable? | Expected | Evidence |
|---|---:|---|---|
| Copy-id renders + copies (grid, Homepage) | Yes (regression) | canonical component, click copies, Check 1500ms, no nav | rendered + smoke test |
| Copy-id renders (list, /listings) | Yes | identical via canonical component | rendered |
| `ListingCardPattern` Story truthful | Yes | real FavoriteButton + real copy-id, no `@/components/ui` | grep + Storybook |
| `ListingCard` Story mounts real component | Yes | static import + providers render grid+list | Storybook + `git diff` |
| Favorite still works in stories | Yes | real Mantine ActionIcon, auth-mocked | Storybook |
| Critical flow (card renders copy-id) | Yes (regression) | smoke green + planted-violation fails | vitest |
| Coverage proves static import | Yes | `check:story-coverage` exit 0 with ListingCard listed | gate |
| Production build | Yes | exit 0 | transcript |
| Non-copy-id i18n key change | No | reuse `copy_id`/`id_copied`; only add `storybook.*` if needed | check:i18n |

## Acceptance criteria

- `AC1 [R1,R2]` A canonical `MantineCopyIdButton` owns the copy-id styling (moved from the deleted local CSS) + clipboard/copied state, takes id/label/aria-label props, and has a `Mantine/Primitives/CopyIdButton` story (resting + copied).
- `AC2 [R3]` `ListingCardPattern.stories.tsx` imports zero `@/components/ui/*`, renders the real `FavoriteButton` + `MantineCopyIdButton` (+ Mantine image) across the grid+list × 6-variant matrix, and imports no other Story.
- `AC3 [R4]` `Mantine/Primitives/ListingCard` statically imports the real production `ListingCard` and renders grid+list with a mocked signed-in `AuthContext` + fixtures; copy-id + favorite are the real components.
- `AC4 [R5,R6]` Production `ListingCard` uses `MantineCopyIdButton` in both footers, the local `ListingCard.module.css` is deleted, `ListingCard.tsx` is in `mantine-migration-scope.json`, `check:story-coverage` exits 0 proving the static import, and computed styles + behavior match pre-migration exactly.
- `AC5 [R7,R8]` `MantineListingCardPattern` holds no clipboard state; `ListingCard.smoke.test.tsx` passes (both branches) with a planted-violation genuinely failing then reverted; typecheck + check:stories + check:story-coverage + check:i18n + check:mojibake + `npm run build` all exit 0.

## QA profile and verification plan

**Profile: Q3 Visual + mandatory critical-flow regression + coverage + build gate.** Evidence: (1) typecheck 0; (2) check:stories 0; (3) `check:story-coverage` exit 0 with `ListingCard.tsx` proven; (4) check:i18n parity; (5) check:mojibake 0; (6) `npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` green + one documented planted-violation (e.g. break the copied-state toggle) that genuinely fails, reverted; (7) rendered proof: `Mantine/Primitives/CopyIdButton`, the rebuilt `ListingCardPattern` story, and the new `Mantine/Primitives/ListingCard` story each render (uk@320 + desktop), PLUS before/after computed-style parity of the copy-id pill on the real Homepage grid card + `/listings` list card (font/color/hover/focus, no doubled ring); (8) `npm run build` exit 0 (transcript); (9) `git status --short` → the new component + `.module.css`, its story, the rewritten pattern story, the new ListingCard story, `ListingCard.tsx`, `mantine-migration-scope.json`, any `storybook.*` i18n, `docs/backlog.md`, session log (and the deleted `ListingCard.module.css`).

## Completion report contract

Write `docs/sessions/2026-07-21-task656-listingcard-canonical-story-foundation.md` + a concise `docs/backlog.md` update (supersedes the 655 entry). Include: Files Changed table; R1–R8 with evidence; the dependency graph realized; before/after of the copy-id computed style (proving the look is unchanged and no longer Homepage-local); the coverage proof (`ListingCard.tsx` static-import); both story renders; smoke + planted-violation transcript; typecheck/check:stories/check:story-coverage/check:i18n/mojibake + `npm run build`; explicit confirmation the pattern holds no clipboard state, `FavoriteButton`/`theme.ts` unchanged, and both stories render only real canonical components. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. If the signed-in `AuthContext` cannot be mocked in the `ListingCard` story, return `BLOCKED` (do not substitute a demo stand-in). Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the ordered deliverables D0–D5, the exact dependency graph, the canonical component API + the verbatim Task-655 style overrides to move, the pattern-Story demo→real replacement list (`DemoFavoriteButton`/`DemoFooterActions`/`@/components/ui/button`), the `ListingCard` Story provider set (Mantine + NextIntl + mocked signed-in AuthContext + fixture listing/rates), the coverage registration, the pattern-stays-clipboard-agnostic constraint, the no-cross-Story-import rule, and the Q3 + critical-flow + coverage + build matrix are all named. ✅
- Every P0 requirement has a binary AC + verification; clause-16c canonical-Story binding + the canonical UI decision record are explicit. ✅
- Scope protects the pattern (no clipboard state), FavoriteButton, theme, non-copy-id i18n; names what must not change; Task 655 explicitly superseded/reverted. ✅
- Canonical decision = create canonical (copy-id component + 2 stories) + reuse (real FavoriteButton), all coverage-registered; no demo stand-in counted as proof. ✅
- Negative flows selected by applicability (render both layouts / copy-interaction / story-truthfulness / coverage / critical-flow / build in; non-copy-id i18n out). ✅
