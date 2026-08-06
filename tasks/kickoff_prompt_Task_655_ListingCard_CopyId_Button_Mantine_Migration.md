# Task 655 — Migrate the copy-listing-ID control in `ListingCard.tsx` from a raw HTML `<button>` to the canonical Mantine `UnstyledButton`, preserving the copy-to-clipboard behavior and the muted-mono look exactly. This is the last non-Mantine interactive control rendered on the Homepage card.

- **Task number:** 655
- **Epic:** MM — Mantine/TailAdmin migration.
- **Parent / origin:** Homepage Mantine-migration re-audit (2026-07-21). After Tasks 653 (`FavoriteButton`) and 654 (`SaveToCollectionButton` trigger), the Homepage render tree has **zero legacy shadcn (`@/components/ui/*`) styled surfaces**. The only remaining **non-Mantine** interactive element on the Homepage card is the copy-listing-ID pill, which is still a raw `<button>` (Tailwind-styled) rather than a Mantine primitive.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** raw-element → canonical Mantine primitive migration (raw `<button>` → `UnstyledButton`), **behavior- and pixel-preserving**. Reuse an existing canonical primitive — no new component/pattern/token/story.
- **Build gate (governance `67340ff49`):** non-Q0 → final `npm run build` exit 0 required.
- **Critical flow:** the copy-ID control is part of the registered **"Listing card rendering"** critical flow (`docs/critical-flow-registry.md`, entries 602/605 — "copy-id" is an asserted footer action). Automated regression evidence via `ListingCard.smoke.test.tsx` is mandatory.
- **Unlayered-CSS rule (Tasks 629/650/651/653/654):** if any Tailwind class on the migrated control is overridden by `UnstyledButton`'s own CSS, apply that property via Mantine props / `styles` / a CSS module — verified by computed style, not assumed.

## Objective

In `src/components/shared/../modules/listings/components/ListingCard.tsx`, replace **both** raw copy-ID `<button>` elements with Mantine `UnstyledButton`:

1. `footerActions` (line ~286) — the copy-ID pill in the **grid/vertical** card footer (this is the one rendered on the Homepage via `FeaturedListings`/`LatestListings` → `MantineListingCardPattern`).
2. `listFooterActions` (line ~189) — the identical copy-ID pill in the **list/horizontal** card footer (rendered on `/listings` List view; migrated together for one-file consistency).

The `copyId` handler, `idCopied` state, `aria-label` toggle, the `#{public_id}`/`Copy`/`Check` content, and both footer nodes' placement in the `MantineListingCardPattern` (`footerActions`/`listFooterActions` props) stay unchanged.

## Verified context

Inspected 2026-07-21.

- `ListingCard.tsx` is a `'use client'` thin data-mapper (`useState` at line 3); it currently imports **no** `@mantine/core` (only `lucide-react`: `Maximize2, Copy, Check`, line 11).
- `copyId` (line ~117): `e.preventDefault()`, `navigator.clipboard?.writeText(listing.id).catch(()=>{})`, `setIdCopied(true)`, `setTimeout(()=>setIdCopied(false), 1500)`. `idCopied` state at line ~113. **Preserve verbatim.**
- Both raw buttons are byte-identical: `type="button"`, `onClick={copyId}`, `title={listing.id}`, `aria-label={idCopied ? t('id_copied') : t('copy_id')}`, `className="font-mono text-2xs text-muted-foreground/70 hover:text-muted-foreground transition-colors inline-flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"`, content = `#{listing.public_id ?? listing.id.slice(0,8)}` + (`idCopied` ? `<Check class="h-2.5 w-2.5 shrink-0 text-status-success">` : `<Copy class="h-2.5 w-2.5 shrink-0 opacity-50">`).
- Consumed by the pattern: `footerActions` → `MantineListingCardPattern` at line ~328 (grid); `listFooterActions` at line ~230 (list). **Do not change the pattern or its props.**
- Canonical reuse target: `UnstyledButton` is already consumed in `MantineCombobox.tsx`, `MantineDropdownMenu.tsx`, `MantineListingGalleryPattern.tsx`, `MantineNavigationMenu.tsx`, `MantineSelect.tsx` — `UnstyledButton` renders a real `<button>` with reset chrome (no bg/border/padding/font of its own), so the existing Tailwind color/font/layout classes should apply cleanly. **Verify by computed style** (esp. the `focus-visible:ring-*` and `hover:text-*` — confirm `UnstyledButton`'s own `:focus`/reset CSS doesn't override them; if it does, move only the affected property to a CSS module keyed off a `data-*` attribute, per the Task 653/654 technique).

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Migration | Both copy-ID controls render a Mantine `UnstyledButton` (real `<button>`); no raw `<button>` remains in `ListingCard.tsx` | P0 | `git diff`; grep `<button` = 0 | Confirmed |
| R2 | Pixel parity | The copy-ID pill looks identical (mono font, `text-2xs`, muted color + hover, focus-ring, icon + `#id`) at the Homepage grid card and the `/listings` list card | P0 | Computed-style before/after; rendered uk@320 + desktop | Confirmed |
| R3 | Behavior parity | Click copies `listing.id` to clipboard, flips to the `Check` + `id_copied` aria-label for 1500ms, then reverts; card navigation is not triggered (event-guarded) | P0 | Rendered interaction; `ListingCard.smoke.test.tsx` | Confirmed |
| R4 | Critical flow | `ListingCard.smoke.test.tsx` stays green (copy-id present + card content parity, both grid + horizontal branches) with one planted-violation re-proof | P0 | vitest + planted violation | Confirmed |
| R5 | Isolation | No change to `MantineListingCardPattern.tsx`, `FavoriteButton`, the card data mapping, server actions, `theme.ts`, or i18n; `footerActions`/`listFooterActions` props unchanged; `UnstyledButton` added to a new `@mantine/core` import | P0 | `git diff` scope | Confirmed |
| R6 | Gates + build | typecheck, check:stories, check:i18n, check:mojibake green AND `npm run build` exit 0; `ListingCard.smoke.test.tsx` green | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **Scope is the raw `<button>` only.** This is not a shadcn/legacy-DS surface — it is raw markup; the Homepage is already free of `@/components/ui/*` styled surfaces. This task is the final polish to a 100%-Mantine-primitive Homepage card.
- **Prefer `UnstyledButton` over Mantine `CopyButton`.** `UnstyledButton` is a drop-in for the existing `copyId`/`idCopied` logic and keeps the diff minimal + behavior byte-identical. Do **not** swap in Mantine `CopyButton` (it owns its own copied-state/timeout and would change the tested behavior). Keep `copyId`/`idCopied` exactly as-is.
- **Tailwind classes on `UnstyledButton`:** expected to apply (UnstyledButton ships no color/font CSS). If computed style shows any override (focus ring, hover color), move only that property to a small CSS module (`ListingCard.module.css`) keyed off a `data-*` attribute — same technique as `FavoriteButton.module.css` (Task 653). Do not silently accept a Tailwind class that renders inert.
- `AppImage` (`@/components/ui/AppImage`, a next/image wrapper) stays — it is an image utility, not a control, and is a documented keep (Task 648).

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 9 validation + mandatory build, 11 touch/a11y, 12 rendered evidence, 14 file integrity, 16 tokens).
- `docs/rule-index.md` (raw→Mantine primitive migration); `docs/qa-profiles.md` (Q3 visual + critical-flow regression) + viewport/locale policy.
- `docs/critical-flow-registry.md` (the "Listing card rendering" entry — copy-id asserted).
- `docs/mantine-responsive-design-system.md` (unlayered-CSS rule; `UnstyledButton`), `docs/component-rules.md`.
- Source: `src/modules/listings/components/ListingCard.tsx` (target); `src/design-system/mantine/patterns/MantineDropdownMenu.tsx` or `MantineListingGalleryPattern.tsx` (`UnstyledButton` precedent); `src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` (regression); `FavoriteButton.tsx` + `FavoriteButton.module.css` (Task 653 CSS-module template if needed).

## Scope

1. Add `UnstyledButton` to a new `import { UnstyledButton } from '@mantine/core'` in `ListingCard.tsx`.
2. Replace both raw copy-ID `<button>…</button>` (grid `footerActions` + list `listFooterActions`) with `<UnstyledButton …>…</UnstyledButton>`, keeping every attribute/handler/child and the className verbatim (adjust only if computed style proves a class inert → CSS module).
3. Produce Q3 rendered proof (copy-ID pill resting + copied state, Homepage grid card + `/listings` list card, uk@320 + desktop) + computed-style parity; run `ListingCard.smoke.test.tsx` + one planted-violation; capture `npm run build` exit 0.
4. Write the session log + a concise `docs/backlog.md` entry (Homepage card now 100% Mantine primitives).

## Out of scope

- `MantineListingCardPattern.tsx`, `FavoriteButton`, the card data mapping, server actions, `theme.ts`, i18n keys, any new story.
- Mantine `CopyButton` (do not introduce); the `AppImage` utility.
- Any other card surface not part of the copy-ID control.

## Current and required behavior

- **Current:** copy-ID pill = raw `<button>` + Tailwind, with `copyId`/`idCopied` clipboard logic.
- **Required after:** copy-ID pill = Mantine `UnstyledButton`, identical look + behavior; `ListingCard.tsx` renders zero raw `<button>` elements; the Homepage card is 100% Mantine primitives.

## Positive and negative flows

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Copy-ID renders (grid, Homepage) | Yes | R1/R2 | mono muted pill + `#id` + Copy icon, identical | Rendered `/[locale]` |
| Copy-ID renders (list, /listings) | Yes | R1/R2 | identical in the horizontal footer | Rendered `/[locale]/listings` |
| Click copies + flips to copied state | Yes (regression) | R3 | clipboard write; Check + `id_copied` aria 1500ms then revert; no card nav | Rendered interaction + smoke test |
| a11y | Yes | R2/R3 | real `<button>`, `aria-label` toggles, `title`, focus ring | smoke test + computed style |
| Critical flow (card renders copy-id) | Yes (regression) | R4 | smoke test green + planted-violation fails | vitest |
| Production build | Yes | R6 | `npm run build` exit 0 | transcript |
| i18n key change | No | reuse `copy_id`/`id_copied` | check:i18n unchanged |

## Acceptance criteria

- `AC1 [R1,R2]` Given the diff + render, both copy-ID controls are Mantine `UnstyledButton`, `ListingCard.tsx` has zero raw `<button>`, and computed styles (font/color/hover/focus-ring/layout) match the pre-migration pill at the Homepage grid card and the list card.
- `AC2 [R3]` Given a click, `listing.id` is copied, the control shows `Check` + the `id_copied` aria-label for ~1500ms then reverts, and the card link is not navigated.
- `AC3 [R4]` Given the repo, `ListingCard.smoke.test.tsx` passes (grid + horizontal branches, copy-id present) and one planted violation genuinely fails a test, then is reverted.
- `AC4 [R5,R6]` Given the repo, only `ListingCard.tsx` (+ an optional `ListingCard.module.css`), `docs/backlog.md`, and the session log changed; typecheck + check:stories + check:i18n + check:mojibake + `ListingCard.smoke.test.tsx` + `npm run build` all exit 0.

## QA profile and verification plan

**Profile: Q3 Visual + mandatory critical-flow regression + build gate.** Evidence: (1) typecheck 0; (2) check:stories 0; (3) check:i18n parity; (4) check:mojibake 0; (5) `npx vitest run src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx` green + one documented planted-violation (e.g. break the copied-state toggle or the copy-id render) that genuinely fails, then reverted; (6) rendered before/after of the copy-ID pill (resting + copied) on the real Homepage grid card and the `/listings` list card at uk@320 + desktop, plus a computed-style parity confirmation (font/color/hover/focus-ring) and a check that no Tailwind class rendered inert on `UnstyledButton`; (7) `npm run build` exit 0 (transcript); (8) `git status --short` → only `ListingCard.tsx` (+ optional CSS module), `docs/backlog.md`, session log.

## Completion report contract

Write `docs/sessions/2026-07-21-task655-listingcard-copyid-unstyledbutton.md` + a concise `docs/backlog.md` update. Include: Files Changed table; R1–R6 with evidence; before/after render of the copy-ID pill (resting + copied) both layouts; the computed-style parity confirmation (+ any CSS-module rationale if a class was inert); the smoke-test result + planted-violation transcript; typecheck/check:stories/check:i18n/mojibake + `npm run build`; explicit confirmation the pattern/`FavoriteButton`/mapping/`theme.ts`/i18n are unchanged and `ListingCard.tsx` now renders zero raw `<button>`. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the two raw-button locations (grid `footerActions` + list `listFooterActions`), the exact preserved attributes/handler/children, the `UnstyledButton` reuse target + precedents, the unlayered-CSS verify-or-CSS-module rule, the do-not-use-`CopyButton` constraint, the isolation boundary, and the Q3 + critical-flow + build matrix are all named. ✅
- Every P0 requirement has a binary AC + verification; behavior + critical-flow + computed-style-parity checks are explicit. ✅
- Canonical decision = reuse (`UnstyledButton`, 5 existing consumers); no new token/story. ✅
- Scope protects the pattern, FavoriteButton, mapping, `theme.ts`, i18n; names what must not change. ✅
- Negative flows selected by applicability (render both layouts / copy-interaction / a11y / critical-flow / build in; i18n-change out). ✅
