# Task 654 — Migrate the `SaveToCollectionButton` **trigger** control from the legacy shadcn `Button` to canonical Mantine (`ActionIcon` for the `variant="icon"` shape, `Button` for the `variant="default"` pill), so the listing-detail action row unifies at the canonical 44px height next to the now-Mantine favorite pill (Task 653). The collections **Dialog/Input/in-dialog buttons are OUT OF SCOPE** — deferred to a later task.

- **Task number:** 654
- **Epic:** MM — Mantine/TailAdmin migration.
- **Parent / origin:** Task 653 review (2026-07-21). The favorite pill in `ListingContact.tsx` migrated to a Mantine `Button` at the project-wide 44px touch-target height; its row neighbour `SaveToCollectionButton` is still a shadcn `Button` at 36px (`size="lg"`=`h-9`), leaving a ~4px vertical misalignment. Owner decision (2026-07-21): keep the a11y-correct 44px favorite and migrate this sibling to unify the row.

## Mode and task type

- **Mode:** implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- **Task type:** legacy shadcn → canonical Mantine migration of an interactive **trigger** control (two visual shapes), **behavior-preserving**. Reuse existing canonical primitives (`ActionIcon`, `Button`). This directly mirrors the just-completed Task 653 `FavoriteButton` migration — **use `src/components/shared/FavoriteButton.tsx` (post-653) and `docs/sessions/2026-07-21-task653-favoritebutton-mantine-migration.md` as the canonical template**.
- **Build gate (governance `67340ff49`):** non-Q0 → final `npm run build` exit 0 required.
- **Unlayered-CSS rule (Tasks 629/650/651/653):** apply any state colors/geometry via Mantine props / `variant` / `styles` / a CSS module (NOT Tailwind `bg-*`/`text-*`/`hover:*`/`rounded-*`/`border` classes, which Mantine component CSS overrides unlayered).

## Objective

In `src/components/shared/SaveToCollectionButton.tsx`, replace the shadcn `Button` **trigger** (lines ~106–116) with:

1. **`variant="icon"`** → Mantine **`ActionIcon`** (round, matching the legacy `icon-sm` overlay usage; mirror Task 653's icon shape).
2. **`variant="default"`** (the labelled pill used in `ListingContact.tsx`, passed `size="lg"`) → Mantine **`Button`** (`variant="default"`, radius/border pinned to the same `1.125rem` / `var(--border)` values Task 653 used for the favorite pill, so both row buttons match; height is the theme's 44px, unifying the row).

The `FolderOpen` icon + conditional `save_to` label, `onClick` (preventDefault/stopPropagation → `handleOpen`), `aria-label`, and the passed `className` (positioning: `flex-1 rounded-xl border border-border` from the consumer) are preserved. The **Dialog, its `Input`, and the in-dialog `Button`s are NOT touched** in this task.

## Verified context

Inspected 2026-07-21.

- `SaveToCollectionButton.tsx` (191 lines): the trigger `<Button variant="ghost" size={variant==='icon' ? 'icon-sm' : (size ?? 'sm')} onClick={...handleOpen} aria-label={t('save_to')} className={className}>` renders `<FolderOpen h-4 w-4>` + (default only) `<span className="ml-1">{t('save_to')}</span>`. Below it, a shadcn `<Dialog>` (`DialogContent`/`DialogHeader`/`DialogTitle`), a shadcn `<Input>` for the new-collection name, and shadcn `<Button>`s for each collection row + the create action.
- Consumer of the pill: `ListingContact.tsx:~276` — `<SaveToCollectionButton listingId variant="default" size="lg" className="flex-1 rounded-xl border border-border" />`, in a `flex flex-wrap gap-2` row directly after the Task-653 favorite pill.
- Props: `variant?: 'icon' | 'default'`, `size?`, `className?`, `listingId`, plus collections state/actions (unchanged).
- Canonical precedents: Task 653 `FavoriteButton.tsx` (`ActionIcon variant="subtle" size={32} radius="pill"` for icon; `Button variant="default" radius="1.125rem" bd="1px solid var(--border)"` for pill) — reproduce the same prop choices. `theme.ts` Button `styles.root.minHeight: '2.75rem'` (44px, P0 touch-target) is why the pill is 44px — **do not override it**.

## Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | Migration | `variant="default"` trigger renders a Mantine `Button` (44px, radius `1.125rem`, `bd` `var(--border)`) matching the Task-653 favorite pill; the shadcn `Button` no longer renders the trigger | P0 | `git diff`; rendered `ListingContact` row | Confirmed |
| R2 | Row unification | In `ListingContact`, the favorite pill and the Save-to-collection pill are the same height (44px), radius, and border — no vertical misalignment | P0 | Rendered `/[locale]/listings/[slug]` action row, uk@320 + desktop | Confirmed |
| R3 | Icon shape | `variant="icon"` trigger renders a Mantine `ActionIcon` mirroring Task 653's icon shape; wherever the `icon` variant is consumed still renders correctly | P0 | `git diff`; grep consumers + render | Confirmed |
| R4 | Behavior/a11y parity | Click still opens the collections dialog (`handleOpen`), `preventDefault`/`stopPropagation` preserved, `aria-label={t('save_to')}` unchanged, element is a real `<button>` | P0 | Rendered interaction; grep | Confirmed |
| R5 | Isolation | The collections `Dialog`/`Input`/in-dialog `Button`s, collections state/actions, `ListingContact.tsx`, `theme.ts`, and i18n are unchanged; only the trigger changes | P0 | `git diff` scope | Confirmed |
| R6 | Gates + build | typecheck, check:stories, check:i18n, check:mojibake green AND `npm run build` exit 0 | P0 | Commands exit 0 | Confirmed |

## Assumptions and open questions

- **Trigger-only migration.** The shadcn `Dialog`/`Input`/in-dialog `Button`s remain in this component after this task — a known, deliberate follow-up (a future "SaveToCollection dialog → Mantine modal/TextInput" task, reusing the `MantineDrawer`/dialog pattern already used by `FiltersPanel`). This task exists solely to unify the action-row pill height per the owner decision; do not expand into the dialog.
- **Colors:** the trigger is `variant="ghost"` (transparent) — unlike the favorite it has no multi-state color logic, so it likely needs no CSS module; use Mantine `variant` (`default` for the pill, `subtle` for the icon) and confirm the rendered look via computed style. Add a small CSS module only if a specific color/hover needs to beat Mantine's unlayered CSS (mirror Task 653's technique if so).
- **`icon` variant consumers:** grep for `SaveToCollectionButton` before implementing; if `variant="icon"` is unused in the app, still migrate it for consistency but note it.

## Pre-read rule bundle

- `docs/agent-contract.md` (clauses 1 scope, 9 validation + mandatory build, 11 touch/a11y, 12 rendered evidence, 14 file integrity, 16 tokens).
- `docs/rule-index.md` (legacy→Mantine control migration); `docs/qa-profiles.md` (Q3 visual) + viewport/locale policy.
- `docs/mantine-responsive-design-system.md` (unlayered-CSS rule, `ActionIcon`/`Button`), `docs/component-rules.md`.
- Source: `src/components/shared/SaveToCollectionButton.tsx` (target); `src/components/shared/FavoriteButton.tsx` + `docs/sessions/2026-07-21-task653-favoritebutton-mantine-migration.md` (canonical template); `src/modules/listings/components/ListingContact.tsx` (consumer, do not edit); `src/design-system/mantine/theme.ts` (Button 44px + `--border`).

## Scope

1. Replace the trigger `Button` with `variant`-branched `ActionIcon` (icon) / `Button` (default pill), mirroring Task 653's prop choices; preserve the `FolderOpen` icon, conditional label, `onClick`, `aria-label`, and passed `className`.
2. Remove the shadcn `Button` import **only if** it is no longer used by the (out-of-scope, still-shadcn) in-dialog buttons — it almost certainly IS still used inside the dialog, so **keep the `@/components/ui/button` import** and migrate only the trigger JSX. Grep-confirm.
3. Produce Q3 rendered proof of the unified `ListingContact` row (favorite + save pill same 44px height/radius/border) at uk@320 + desktop, plus the `npm run build` exit-0 transcript.
4. Write the session log + a concise `docs/backlog.md` entry.

## Out of scope

- The collections `Dialog`, its `Input`, and the in-dialog collection/create `Button`s (separate future task).
- `ListingContact.tsx`, `theme.ts`, i18n keys, collections state/actions/realtime, `FavoriteButton.tsx`.

## Current and required behavior

- **Current:** Save-to-collection trigger = shadcn ghost `Button` (36px at `size="lg"`), misaligned beside the 44px Mantine favorite pill.
- **Required after:** trigger = Mantine `ActionIcon`/`Button`; the `ListingContact` action row shows two 44px pills (favorite + save) with matching radius/border; clicking still opens the (unchanged) collections dialog.

## Positive and negative flows

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Pill renders in ListingContact row | Yes | R1/R2 | 44px Mantine Button, matches favorite pill | Rendered detail row |
| Click opens collections dialog | Yes (regression) | R4 | `handleOpen` fires; dialog opens; event propagation stopped | Rendered interaction |
| `icon` variant (if consumed) | Yes | R3 | ActionIcon renders correctly | grep + render |
| Dialog internals unchanged | Yes | R5 | shadcn dialog still works (out of scope, must not break) | Rendered dialog |
| Production build | Yes | R6 | `npm run build` exit 0 | transcript |
| i18n key change | No | reuse `save_to` | check:i18n unchanged |

## Acceptance criteria

- `AC1 [R1,R2]` Given the rendered `ListingContact` action row, the favorite pill and the Save-to-collection pill are the same 44px height with matching radius (`1.125rem`) and border (`var(--border)`); the trigger is a Mantine `Button` (default) applied via Mantine props, not Tailwind classes.
- `AC2 [R3,R4]` Given the diff + render, `variant="icon"` renders a Mantine `ActionIcon`; clicking either shape opens the collections dialog with propagation stopped and `aria-label={t('save_to')}` intact; the element is a real `<button>`.
- `AC3 [R5,R6]` Given the repo, only `SaveToCollectionButton.tsx` (+ any needed CSS module), `docs/backlog.md`, and the session log changed; the Dialog/Input/in-dialog buttons are untouched; typecheck + check:stories + check:i18n + check:mojibake + `npm run build` all exit 0.

## QA profile and verification plan

**Profile: Q3 Visual + build gate.** Evidence: (1) typecheck 0; (2) check:stories 0; (3) check:i18n parity; (4) check:mojibake 0; (5) `npm run build` exit 0 (transcript); (6) rendered before/after of the unified `ListingContact` row (both pills 44px, matching radius/border) at uk@320 + desktop + a dialog-still-opens interaction capture, plus a computed-style confirmation of the pill height/radius/border; (7) `git status --short` → only `SaveToCollectionButton.tsx` (+ optional CSS module), `docs/backlog.md`, session log.

## Completion report contract

Write `docs/sessions/2026-07-21-task654-savetocollection-trigger-mantine.md` + a concise `docs/backlog.md` update. Include: Files Changed table; R1–R6 with evidence; before/after of the unified row (computed-style height/radius/border of both pills); explicit confirmation the Dialog/Input/in-dialog buttons + `ListingContact.tsx`/`theme.ts`/i18n are unchanged; typecheck/check:stories/check:i18n/mojibake + `npm run build`. Final status `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.

## Task quality gate

- A fresh Sonnet session can execute this without chat context: the target trigger JSX, the `variant`→`ActionIcon`/`Button` split with exact Task-653 prop values, the 44px row-unification goal, the keep-the-shadcn-import-for-the-dialog note, the explicit dialog-out-of-scope boundary, and the Q3 + build matrix are all named, with Task 653 as the working template. ✅
- Every P0 requirement has a binary AC + verification; row-unification is measurable (both pills 44px/matching radius+border). ✅
- Scope protects the dialog internals, the consumer, `theme.ts`, i18n; names what must not change. ✅
- Canonical decision = reuse (`ActionIcon`/`Button`, per Task 653); no new token/story. ✅
- Negative flows selected by applicability (render/click-opens-dialog/icon-variant/build in; i18n-change out). ✅
