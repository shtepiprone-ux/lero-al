# Task 603 — `FavoriteButton` (icon shape): stop the mobile full-width stretch; keep a compact ~32px circle at every breakpoint (dom.ria reference)

**Sprint:** 44 (Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI — single-primitive responsive/styling fix. **NO redesign, NO behavior change, NO new control, NO new i18n key.**
**Owner report (2026-07-15):** on mobile (<640px) the "Add to favorites" heart on the listing card renders as a wide
full-width white pill instead of the small round heart. It must look like the reference —
`https://dom.ria.com/uk/prodazha-kvartir/` (a compact circular heart in the top-right corner of the photo).
**Owner decision (2026-07-15, orchestrator AskUserQuestion):** keep the heart **compact ~32px (matching the reference
and the current desktop appearance) at ALL breakpoints** — this is a **documented icon-only exemption from BOTH the
clause-11 mobile full-width rule AND the ≥44px touch-target minimum** for this overlay control (same class of explicit
owner override as the Task 557 day-cell 39px exemption). Record the exemption in the session log.

**Pre-read:** `agent-contract.md`, `backlog.md`, `critical-flow-registry.md`,
`docs/mantine-responsive-design-system.md` (§7 mobile gate, §18 pitfalls — note this primitive is the legacy
`@/components/ui/button`, NOT Mantine, so §18 CSS-cascade notes apply to the Tailwind/cva layer),
`docs/tailadmin-style-reference.md` + `demo_tailadmin_com.zip` (clause 16), `docs/ui-rules.md`,
`docs/component-rules.md`, `docs/qa-rules.md`.

## Root cause (confirmed by orchestrator source review — implement against this, do not re-derive from scratch)

`src/modules/listings/components/FavoriteButton.tsx` renders the canonical `Button` (`@/components/ui/button`) and, for
`shape === 'icon'` (the default, used by both `ListingCard` overlays), passes **`size={shape === 'pill' ? size : undefined}`**.
`size={undefined}` → the canonical `Button` falls back to **`size="default"`**, whose cva class string includes
**`max-sm:w-full max-sm:h-auto max-sm:min-h-11 max-sm:whitespace-normal max-sm:break-words`** (see `src/components/ui/button.tsx`
lines 23–24). Below 640px those responsive utilities **beat** the unprefixed `w-8 h-8` in the local `className`, so the
icon button stretches to full width and grows to a 44px min-height pill — exactly the stretched white oval in the owner's
320px screenshot. The `icon-*` size variants (`icon`, `icon-sm`, `icon-lg`, `icon-xs`, `icon-xl`) carry **no**
`max-sm:w-full`, which is why every other icon-only overlay in the codebase (`src/stories/StoryListingCard.tsx` uses
`size="icon"` / `size="icon-sm"`) renders as a compact circle on mobile. The `pill` shape passes `size="lg"` and is used
only by `ListingContact.tsx`'s action row with `flex-1` — there the `max-sm:w-full` behavior is **correct and must stay**.

## Files in scope

- `src/modules/listings/components/FavoriteButton.tsx` — the ONLY product file. In the `shape === 'icon'` branch, pass a
  **canonical `icon-*` `Button` size** (recommended `size="icon-sm"`) instead of `size={undefined}`, so the text-size
  `default` chrome (`max-sm:w-full` / `max-sm:min-h-11` / `whitespace-normal` / `break-words`) can never apply. Keep the
  local override that makes it a **compact ~32px `rounded-full` circle** (`rounded-full w-8 h-8 p-0`) so the final
  rendered diameter is ~32px (identical to today's desktop) at **every** breakpoint, ≤ the reference size. The
  `pill`-shape branch (`size={size}`, i.e. `size="lg"` from `ListingContact`) must be **byte-identical** — do not touch it.
  Everything else in the component (guest guard → `openAuthSheet`, optimistic toggle, `useTransition`, disabled/closed
  handling, `disabledLabel`/`title`, `aria-label`/`aria-pressed`/`aria-disabled`, the two-effect authority pattern, the
  `Heart` fill-on-favorited) stays exactly as-is. **This is a styling-only change.**

**MUST NOT touch:** `src/components/ui/button.tsx` (the canonical primitive — do NOT edit its cva; the fix is choosing the
right existing size, not changing the primitive), `ListingCard.tsx`, `ListingContact.tsx`, `MantineListingCardPattern.tsx`,
any locale JSON (no new/changed string — reuses `common.aria_add_favorite` / `common.aria_remove_favorite`), routing, or
any other file. If passing an `icon-*` size does NOT reliably yield the ~32px circle at all breakpoints without adding a
new hardcode/one-off, **STOP and ASK the orchestrator** — do not invent a bespoke size.

## Current behavior to PRESERVE / required after-behavior

- **≥640 (desktop/tablet):** identical to today — compact ~32px round heart, top-right of the card photo (vertical) /
  inline (horizontal). No visual change.
- **<640 (the fix):** the SAME compact ~32px round heart — NOT a full-width pill, NOT 44px tall. Icon-only exemption from
  the full-width + ≥44px rules (documented). No horizontal scroll, no clip, no overlap with the photo-count badge or
  badges in any of sq/en/uk/it.
- **`ListingContact` pill (unchanged):** still `shape="pill"` `size="lg"` with `flex-1`, still full-width in its action
  row on mobile (that is the desired behavior for that surface — clause 11 applies to it as a text/pill control).

## Positive flow (happy path)

- Actor: any visitor on `/{locale}` (homepage Latest, now the vertical card) or `/{locale}/listings` Grid, at 320px and at 1280px.
- Step 1: card renders → the favorite heart is a compact ~32px circle in the top-right of the photo at BOTH widths.
- Step 2 (logged-in user): tap the heart → `stopPropagation`+`preventDefault` (no navigation), optimistic toggle to
  filled/destructive, server action reconciles, `onToggled` fires. Identical at 320 and 1280.
- Step 3 (guest): tap the heart → the AuthSheet login drawer opens (`openAuthSheet('login')`); no navigation, no toggle.

## Negative flow (every off-happy-path branch — all pre-existing, must keep working after the restyle)

- **Closed listing (`disabled` + `disabledLabel`):** heart is disabled, dimmed (`bg-muted/60 opacity-50 cursor-not-allowed`),
  `title`/`aria-label` = the closed label; tap does nothing. (Sold/rented cards.)
- **Pending transition:** `opacity-60 cursor-wait`, `disabled` while the server action is in flight; no double-submit.
- **Server error:** optimistic state reverts to `previousState`, `toast.error(common.favorite_error)` shown.
- **Signing-out (`status === 'signing_out'`, `!user`):** tap is a no-op (no auth sheet, no toggle).
- **Locale:** `aria-label` resolves in all four locales (existing keys — no new key). No visible text to wrap.
- **Touch device:** compact target; the icon-only exemption is documented (owner-approved <44px for this overlay).

## Gates (all mandatory — session log must contain the evidence, not just claims)

- **Rendered matrix (clause 12) on the REAL card, not the Storybook demo favorite.** ⚠️ Task 602's matrix captured the
  `MantineListingCardPattern` *Default* story, whose favorite is the pattern's own demo `ActionIcon` (44px) — NOT the real
  `FavoriteButton` injected via `imageSlot`. That is precisely why this defect slipped through. So: capture the **real
  `ListingCard` vertical card rendering the real `FavoriteButton`** — via the live dev server (`/uk` homepage Latest +
  `/uk/listings` Grid) — at 320·375·390·768·1280·1440·2560 × sq/en/uk/it, **uk@320/375/390 mandatory**. Every cell proves:
  compact round heart top-right, NOT full-width, no clip/overlap/h-scroll. Include an explicit **before/after at uk@320**.
- **Internal-spacing / chrome visual check (owner P0):** personally OPEN the uk@320 screenshots and confirm by eye the
  heart is a small circle that does not overlap the badges (top-left) or photo-count (bottom-right) — `screenshots:assert`
  is geometry-blind to this.
- **Mobile <640 (clause 11):** heart = documented icon-only exemption (compact ~32px, NOT full-width, NOT forced ≥44px —
  record the owner override in the session log). The `pill` shape is NOT exempt and stays full-width — confirm it is
  untouched.
- **TailAdmin (clause 16):** the heart stays `variant="ghost"` compact circle; no invented color/px/radius/shadow; the
  `bg-card/80` resting + `destructive` favorited states unchanged. No style drift.
- **Regression coverage:** add a focused assertion to
  `src/modules/listings/components/__tests__/FavoriteButton.test.tsx` proving the **icon shape does NOT carry
  `max-sm:w-full`** (and the pill shape still does / still passes `size="lg"`). Provide a planted-violation transcript
  (revert to `size={undefined}` → the new assertion FAILs) then revert → green. Favorites is not yet in
  `critical-flow-registry.md`; adding a row is optional for this styling fix, but the behavior tests already in that file
  must stay green.
- **File-integrity (clause 14)** clean; `tsc=0` / lint / `check:stories` / `check:i18n` / `check:mojibake` green.
- **No `git add`/`git commit` emitted by Sonnet** (single-writer; the orchestrator emits commits at review). Session log:
  Files-Changed table + AC-by-AC self-audit + the rendered matrix + the documented exemption note.

## Acceptance criteria

1. `FavoriteButton.tsx` `shape === 'icon'` branch passes a canonical `icon-*` size (recommended `icon-sm`) instead of
   `undefined`; the local `rounded-full w-8 h-8 p-0` compact-circle override is kept; the `pill` branch is byte-identical;
   no other behavior/markup changed. *(diff)*
2. The heart renders as a compact ~32px round heart at EVERY breakpoint including <640, in all 4 locales, on the REAL
   `ListingCard` (homepage Latest + `/listings` Grid) — never a full-width pill, never 44px tall. *(live-app render matrix
   + personally-reviewed uk@320 before/after)*
3. All pre-existing behavior preserved: guest→auth sheet, logged-in→optimistic toggle+reconcile, disabled/closed, pending,
   server-error revert+toast, signing-out no-op. *(AC self-audit citing the negative-flow branches)*
4. `ListingContact` pill favorite unchanged and still full-width in its action row on mobile. *(diff + one render cell)*
5. Regression assertion added (icon shape ≠ full-width; pill shape still `size="lg"`) with a verified planted-violation
   FAIL; existing `FavoriteButton.test.tsx` behavior tests stay green. *(transcripts)*
6. `tsc=0` / lint / `check:stories` / `check:i18n` / `check:mojibake` green; file-integrity clean; Files-Changed table +
   AC self-audit + documented icon-only/≥44px-exemption note in the session log; NO `git add`/`git commit` by Sonnet.
   *(transcripts)*
