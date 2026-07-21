# Session Archive: Task 654 — SaveToCollectionButton trigger legacy shadcn → Mantine migration — 2026-07-21

## Task path and status

`tasks/kickoff_prompt_Task_654_SaveToCollectionButton_Trigger_Mantine_Migration.md`

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW** (base task + Revision 1)

## Revision 1 (2026-07-21) — orchestrator-flagged R3 radius regression, fixed

The orchestrator appended a "Revision 1" section directly to the kickoff file (now present in
`git diff` for that file — a task/docs artifact edit made by Opus, not by this session) identifying
that this session's own base-task icon-shape prop, `radius="lg"`, does **not** reproduce the legacy
`rounded-lg` value in this project. Confirmed by direct inspection of `globals.css`:

```
--radius-lg:  var(--radius);   /* globals.css:92 */
--radius:     0.75rem;         /* globals.css:399 */
```

So Tailwind's `rounded-lg` in this project resolves to `0.75rem` (12px) — a legacy shadcn/TailAdmin
override, NOT Tailwind's stock 8px default. Mantine's own theme radius scale (`theme.ts:198`) defines
`radius.lg` = `0.5rem` (8px) — a *different* token that happens to share the name `"lg"`. My original
implementation used Mantine's `radius="lg"` believing it reproduced `rounded-lg`; it actually rendered
the `FavoritesShell.tsx` overlay icon at 8px instead of the legacy 12px — the same Tailwind-`lg`-vs-
Mantine-`lg` trap already documented in Task 652's own R8 revision. This is a genuine regression I
introduced and did not catch in the base-task self-review (the base session's real-browser capture
recorded `borderRadius: 8px` and I incorrectly treated 8px as the "traced" target instead of
re-deriving it from `globals.css`'s actual `--radius` override, which I had not opened at that point).

**Fix applied (this session, same scope as the base task):**
- `src/modules/listings/components/SaveToCollectionButton.tsx`: icon `ActionIcon`'s `radius="lg"` →
  `radius="0.75rem"` (12px, `size={28}`/`variant="subtle"`/`data-shape="icon"` unchanged). Comment
  corrected to state the actual `globals.css` override and explicitly stop claiming Mantine `lg` ==
  Tailwind `rounded-lg`.
- `src/modules/listings/components/SaveToCollectionButton.module.css`: same inaccurate "8px" comment
  corrected (the module's background/hover rule itself needed no change — only the JSX `radius` prop
  and both comments were wrong).

**Re-verification (real browser, Playwright/Chromium, fresh dev-route capture — same substitution
technique as the base task, created and fully deleted/reverted again):**

```
IconButton (Revision 1): {
  "width": "28px",
  "height": "28px",
  "borderRadius": "12px",
  "backgroundColor": "rgba(255, 255, 255, 0.8)"
}
```

`border-radius: 12px` confirmed exactly — matches the legacy `rounded-lg` value, corrects the
regression. `width`/`height` (28px) and `backgroundColor` (unchanged, `rgba(255,255,255,.8)` resting)
confirmed unaffected by the fix, as expected (only the radius prop changed).

**Gates re-run after the fix (final state):**
1. `npm run typecheck` → 0 errors.
2. `npm run check:stories` → PASSED, 122 files, 0 violations.
3. `npm run check:i18n` → PASSED, 2206/2206 keys, 4 locales.
4. `npm run check:mojibake` → 0 artifacts (1854 files — governance-report auto-touch on the
   pre-existing unrelated file, see below, adds one file to the scan count).
5. `npm run build` → exit 0, `✓ Compiled successfully in 67s` — run on the fully-cleaned final state
   (temp dev route deleted, `AuthContext.tsx` reverted, confirmed via `git diff` empty for that file).

**Temporary evidence artifacts for Revision 1 (created, used, fully removed before this report):**
`src/app/[locale]/dev654qatest/page.tsx` (icon-only variant, minimal), a second temporary `export` on
`AuthContext.tsx` (reverted, `git diff` empty), `task654_rev1_capture.mjs` +
`task654_rev1_capture2.mjs` (project-root scratch scripts, deleted). Same substitution rationale as
the base task: `FavoritesShell.tsx`'s icon overlay is auth-gated and no test credentials exist in this
sandbox.

**Files touched by Revision 1 (on top of the base task's diff, same two owned files):**
`SaveToCollectionButton.tsx`, `SaveToCollectionButton.module.css` — no new files, no scope expansion.
`docs/backlog.md` and this session log updated with a concise revision note per the mid-turn
instruction's contract.

## Kickoff path correction

The kickoff states the target is `src/components/shared/SaveToCollectionButton.tsx` and cites
`src/components/shared/FavoriteButton.tsx` as the template. Both paths are wrong (same class of
correction Task 653's own session log made for itself) — grep-confirmed single matches:
- Target: `src/modules/listings/components/SaveToCollectionButton.tsx`
- Template: `src/modules/listings/components/FavoriteButton.tsx` (post-Task-653)

## Summary

`SaveToCollectionButton.tsx`'s trigger now renders Mantine `ActionIcon` (icon shape,
`FavoritesShell.tsx`'s card-overlay consumer) / `Button` (default pill, `ListingContact.tsx`'s
action row) instead of the shadcn `Button`, mirroring Task 653's exact pill props
(`variant="default" radius="1.125rem" bd="1px solid var(--border)"`). The action row's favorite
pill (Task 653) and save-to-collection pill now render at identical 44px height / 18px radius /
matching border — confirmed via real-browser computed style, not assumption.

**One genuine defect found and fixed before completion** (self-review, not part of the kickoff's
literal prop list): the kickoff's suggested icon-shape props (`size={32} radius="pill"`, a literal
copy of Task 653's icon shape) do not match this component's actual traced usage. Direct CSS-source
inspection (`node_modules/@mantine/core/styles.css`) confirmed `ActionIcon`'s own `background`/
`border-radius` rules are unconditional and unlayered, so `FavoritesShell.tsx`'s passed
`className="bg-card/80 hover:bg-card shadow-sm rounded-lg"` (the only current icon-variant consumer)
would silently stop applying its background/radius once migrated — a real visual regression to an
out-of-scope file. Resolved entirely within `SaveToCollectionButton.tsx` (no `FavoritesShell.tsx`
edit): `radius="lg"` (theme token = 8px, matches the traced `rounded-lg`) instead of `"pill"`,
`size={28}` (matches legacy `icon-sm` = 28px, not 32px), and a new `SaveToCollectionButton.module.css`
reproducing the exact `bg-card/80` → white-hover background via the same attribute-selector
specificity technique as `FavoriteButton.module.css` (Task 653) — explicitly pre-authorized by the
kickoff's own "Assumptions" section ("Add a small CSS module only if a specific color/hover needs to
beat Mantine's unlayered CSS — mirror Task 653's technique if so"). Real-browser verification
confirms the icon overlay's resting/hover background and radius are pixel-identical to the
pre-migration render.

## Requirement and acceptance-criteria evidence

| ID | Requirement | Evidence |
|---|---|---|
| R1/AC1 | `variant="default"` → Mantine `Button`, 44px/radius `1.125rem`/`bd var(--border)`, matching the Task-653 favorite pill | Real-browser computed style (uk@320, en@1440): both pills `height:44px`, `borderRadius:18px`, `border:1px solid lab(90.952 …)` (identical string, both resolve `var(--border)` identically) — see Computed-style section |
| R2/AC1 | Favorite + save pills same height/radius/border, no vertical misalignment | Confirmed identical across both viewports (see table below); `git diff` shows props applied via Mantine, not Tailwind classes |
| R3/AC2 | `variant="icon"` → Mantine `ActionIcon` mirroring Task 653's icon shape (adapted); wherever consumed still renders correctly | `FavoritesShell.tsx` (the only consumer) real-browser capture: `28×28px`, `bg rgba(255,255,255,.8)`→`#fff` hover — pixel-match to pre-migration Tailwind classes. **`borderRadius` originally measured `8px` (wrong — a `radius="lg"` Mantine/Tailwind token-name collision, see Revision 1 above), corrected to the real-browser-confirmed `12px` matching the legacy `rounded-lg`.** |
| R4/AC2 | Click still opens dialog (`handleOpen`), `preventDefault`/`stopPropagation` preserved, `aria-label={t('save_to')}` unchanged, real `<button>` | Real interaction capture: `Dialog opened after click: true` (both viewports); `git diff` — `handleTriggerClick` calls `e.preventDefault(); e.stopPropagation(); handleOpen()` identically to the original inline handler; `aria-label` computed = `t('save_to')` per locale (uk "Зберегти в колекцію", en "Save to collection"); `tagName: "BUTTON"` confirmed both shapes |
| R5/AC3 | Dialog/Input/in-dialog Buttons, `ListingContact.tsx`, `theme.ts`, i18n untouched | `git diff --stat` — empty for all four; real dialog-open capture shows the shadcn Dialog/Input/collection-row/Create Button unchanged (still red-branded shadcn chrome) |
| R6/AC3 | typecheck/check:stories/check:i18n/check:mojibake + `npm run build` all exit 0 | All green — see Validation evidence (run twice on the base task: once mid-task, once on the final clean state after temp-evidence cleanup; re-run again in full after the Revision 1 radius fix — see the Revision 1 section above) |

## Current versus required behavior

**Current (before):** trigger = shadcn `ghost` `Button` — icon variant `size="icon-sm"` (28px,
`rounded-md`-ish, background/radius/shadow entirely from the consumer's passed Tailwind className);
default variant `size="sm"`/`"lg"` (36px at `size="lg"`, transparent `ghost` background), causing a
~4px vertical misalignment against the now-44px Mantine favorite pill in `ListingContact`.

**Required after (implemented):** trigger = Mantine `ActionIcon` (icon)/`Button` (pill); the
`ListingContact` action row shows two 44px pills (favorite + save) with matching radius/border;
clicking still opens the unchanged collections dialog; the `FavoritesShell` card-overlay icon
retains its pre-migration frosted-white look via a new component-scoped CSS module.

## Positive and negative flows

| Branch | Applicable? | Evidence |
|---|---:|---|
| Pill renders in ListingContact row (44px, matches favorite pill) | Yes | Real-browser capture uk@320 + en@1440, computed style |
| Click opens collections dialog | Yes (regression) | Real interaction capture — dialog opens, shadcn `DialogContent`/`Input`/collection-row `Button`/Create `Button` all render unchanged, empty-state (`no_collections`) shown correctly |
| `icon` variant (FavoritesShell overlay) | Yes | Real-browser capture — background/radius/shadow preserved via new CSS module + `radius="lg"` prop |
| Dialog internals unchanged | Yes | `git diff --stat` empty for the Dialog/Input/in-dialog-Button block; real capture confirms |
| Production build | Yes | `npm run build` exit 0 (twice) |
| i18n key change | No | reused `collections.save_to` (and all other existing `collections.*` keys) unchanged; `check:i18n` parity unchanged (2206/2206, 4 locales) |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/listings/components/SaveToCollectionButton.tsx` | Trigger: shadcn `Button` → Mantine `ActionIcon`/`Button`; dialog/state/handlers untouched below the trigger |
| `src/modules/listings/components/SaveToCollectionButton.module.css` | **New.** Icon-shape resting/hover background (`bg-card/80`→white), reproducing `FavoritesShell.tsx`'s passed Tailwind chrome that becomes inert once the trigger is a Mantine `ActionIcon` (unlayered-CSS rule) — same technique as `FavoriteButton.module.css` (Task 653) |
| `docs/backlog.md` | Concise active-state entry for Task 654 |
| `docs/sessions/2026-07-21-task654-savetocollection-trigger-mantine.md` | This session log |

**Confirmed NOT touched** (`git diff --stat` empty): `ListingContact.tsx`, `FavoritesShell.tsx`,
`FavoriteButton.tsx`, `theme.ts`, `collectionActions.ts`, `messages/*.json`, and the
Dialog/Input/in-dialog-Button block inside `SaveToCollectionButton.tsx` itself (byte-identical,
visible in the diff below).

**Temporary evidence-capture artifacts, created and fully reverted/deleted before this report** (not
in the final diff — confirmed via a second `git status --short` after cleanup):
- `src/app/[locale]/dev654qatest/page.tsx` — temporary route rendering the real
  `FavoriteButton`+`SaveToCollectionButton` action row and the `SaveToCollectionButton` icon overlay
  under the real `MantineRootProvider`/theme (needed because `ListingContact`'s row and
  `FavoritesShell`'s overlay are both auth-gated and no test credentials exist in this sandbox — same
  substitution class as Task 653/630). Deleted.
- A one-line temporary `export` added to `AuthContext.tsx`'s module-scoped `AuthContext` object (to
  supply a fake authenticated user to the dev route, bypassing `SaveToCollectionButton`'s
  `if (!user) return null` guard — `getCollectionsWithMembership`'s own server-side `getUser()` call
  is unaffected, reads real cookies, safely returns an empty list). Reverted; `git diff -- AuthContext.tsx`
  is empty.
- `task654_capture.mjs` (project-root Playwright script, needed Node module resolution from
  `node_modules`). Deleted.

## Before/after

**Before:**
```tsx
<Button
  type="button" variant="ghost" size={variant === 'icon' ? 'icon-sm' : (size ?? 'sm')}
  onClick={e => { e.preventDefault(); e.stopPropagation(); handleOpen() }}
  aria-label={t('save_to')} className={className}
>
  <FolderOpen className="h-4 w-4 shrink-0" />
  {variant === 'default' && <span className="ml-1">{t('save_to')}</span>}
</Button>
```

**After (icon shape, final state post-Revision-1 — base task originally shipped `radius="lg"`,
corrected below):**
```tsx
<ActionIcon {...commonProps} data-shape="icon" variant="subtle" size={28} radius="0.75rem">
  {icon}
</ActionIcon>
```

**After (default/pill shape):**
```tsx
<MantineButton {...commonProps} variant="default" size={PILL_SIZE_MAP[size ?? 'default']}
               radius="1.125rem" bd="1px solid var(--border)">
  {icon}
  <span className="ml-1">{t('save_to')}</span>
</MantineButton>
```
Where `commonProps` carries `type`/`onClick`(=`handleTriggerClick`)/`aria-label`/
`className={cn(styles.control, className)}` — identical for both shapes. Full diff in
`git diff -- src/modules/listings/components/SaveToCollectionButton.tsx`.

## Computed-style confirmation (real browser, Playwright/Chromium, via the temporary dev route)

**Action-row pills (uk@320 and en@1440):**

| Property | Favorite pill (Task 653) | Save-to-collection pill (Task 654) | Match? |
|---|---|---|---|
| `height` | `44px` | `44px` | ✅ |
| `border-radius` | `18px` | `18px` | ✅ |
| `border` | `1px solid lab(90.952 …)` | `1px solid lab(90.952 …)` (identical string, both `var(--border)`) | ✅ |
| `box-shadow` | `rgba(16,24,40,.05) 0 1px 2px 0` | `rgba(16,24,40,.05) 0 1px 2px 0` (identical, both from theme.ts's shared `outline`/`default` `boxShadow` rule) | ✅ |
| `background-color` (resting) | `rgba(255,255,255,.8)` (from `FavoriteButton.module.css`'s `[data-favorited='false']` rule, which ALSO governs the pill since the CSS module targets `.control` regardless of shape) | `rgb(255,255,255)` solid (from Mantine's own `variant="default"` theme.ts `vars`, no CSS-module override needed for this component) | **Deviates — see below** |
| `aria-label` | localized (`Додати в обрані`/`Add to favorites`) | localized (`Зберегти в колекцію`/`Save to collection`) | ✅ (each own label) |
| `tagName` | `BUTTON` | `BUTTON` | ✅ |

**Flagged, non-blocking deviation:** the two pills' *background* differs at the CSS-property level
(translucent `rgba(…,.8)` vs solid `rgb(255,255,255)`). R1/R2's own literal text names only
height/radius/border as the required-match dimensions ("matching the Task-653 favorite pill" in
context of "44px, radius `1.125rem`, `bd var(--border)`") — background match was not a stated
requirement, and the two pills sit on the same white page background in `ListingContact`, so this
difference is **not human-visually perceptible** in the real page context (both render as
solid-looking white pills) — confirmed via the full-page screenshot capture. Root cause: the
favorite pill's translucent resting background is an emergent side effect of `FavoriteButton
.module.css`'s OWN three-state color rules (needed for ITS favorited/disabled states, not a
"pills should be translucent" design decision), which this component correctly did not replicate
(no such multi-state need exists here — confirmed in the kickoff's own "Assumptions" section: "the
trigger is `variant="ghost"`... it likely needs no CSS module"). Not fixed, flagged for orchestrator
awareness only.

**Icon overlay (`FavoritesShell.tsx` consumer, uk@320 and en@1440 — identical both viewports):**

| Property | Value | Traced source |
|---|---|---|
| `width`/`height` | `28px` | `radius`/`size` prop, matches legacy `icon-sm` (`size-7`=1.75rem) |
| `border-radius` | ~~`8px` (via `radius="lg"`, WRONG — Mantine's theme `lg`=8px ≠ this project's Tailwind `rounded-lg`=12px)~~ **`12px`, final/correct** | `radius="0.75rem"` prop (`globals.css:92,399` — `--radius-lg:var(--radius)`, `--radius:0.75rem` — see Revision 1 above) |
| `background-color` (resting) | `rgba(255,255,255,.8)` | `SaveToCollectionButton.module.css` `[data-shape='icon']` rule — matches the original `bg-card/80` value exactly |
| `background-color` (hover) | `rgb(255,255,255)` | same module's `:hover` rule — matches the original `hover:bg-card` value exactly |
| `box-shadow` | `…, rgba(0,0,0,.1) 0 1px 3px 0, rgba(0,0,0,.1) 0 1px 2px -1px` | passed-through Tailwind `shadow-sm` className (no conflicting Mantine `ActionIcon` box-shadow rule exists at rest, confirmed via `node_modules/@mantine/core/styles.css`, so the layered utility class applies unopposed) |
| `aria-label` | localized (`Зберегти в колекцію`/`Save to collection`) | unchanged |
| `tagName` | `BUTTON` | unchanged |

Every icon-overlay value matches the pre-migration Tailwind-driven look exactly.

## Rendered proof

- **Full-page captures** (`task654_uk320_full.png`, `task654_desktop1440_full.png` — scratchpad-only,
  not committed): action row (favorite pill + save pill, visually identical height/shape/border) and
  the `FavoritesShell`-style icon overlay (frosted-white folder icon on a mock photo background),
  rendered under the real `MantineRootProvider`/theme via the temporary dev route.
- **Dialog-open interaction captures** (`task654_uk320_dialog_open.png`,
  `task654_desktop1440_dialog_open.png`): clicking the pill opens the unchanged shadcn `Dialog`
  (title "Зберегти в колекцію"/"Save to collection", empty-state folder icon + "No collections yet"
  text, unchanged red-branded shadcn `Input`+`Create` `Button` row) — confirms R4/R5.
- All screenshots/scripts/the temporary route/the temporary `AuthContext` export were
  session-scratchpad or fully reverted, per the same substitution pattern Task 653/630 used for
  auth-gated evidence in this sandbox; re-capturable via the same technique.

## Canonical UI decision record

| Visible artifact | Search evidence | Canonical source | Disposition | Consumed style/token path |
|---|---|---|---|---|
| Pill shape (default variant) | Inspected `FavoriteButton.tsx` (post-653) + `theme.ts` Button block | `FavoriteButton.tsx`'s pill branch, `theme.ts` Button `vars`/`styles` | **Reuse** — identical prop values, no new token | `variant="default" radius="1.125rem" bd="1px solid var(--border)"` — traced, not invented |
| Icon shape (icon variant) | Inspected `FavoriteButton.tsx`'s icon branch (`ActionIcon variant="subtle"`); traced actual current consumer (`FavoritesShell.tsx:214-217`) and its passed Tailwind className via `grep` | `FavoriteButton.tsx`'s icon branch (mechanism); `node_modules/@mantine/core/styles.css` (unlayered-CSS confirmation); `globals.css:92,399` (`--radius-lg`/`--radius` = 12px, the real `rounded-lg` value in this project — Revision 1 correction; Mantine's own `theme.ts` `radius.lg`=8px is a same-named but different token, initially and incorrectly used) | **Reuse the mechanism, adapt the values** — `size`/`radius` corrected from the template's literal `32`/`"pill"` to the traced `28`/`0.75rem` (icon-sm/legacy-`rounded-lg`, not the favorite heart's 32px circle) | `radius="0.75rem"` (traced `globals.css` token value, passed literally); `SaveToCollectionButton.module.css` (new, component-scoped, same pattern as `FavoriteButton.module.css`) |
| Icon-overlay background chrome | Direct CSS-source inspection (`.mantine-ActionIcon-root { background: var(--ai-bg, …) }`, unconditional/unlayered) proved the passed `bg-card/80`/`hover:bg-card` Tailwind classes would become inert | `FavoriteButton.module.css`'s icon-default rule (identical `rgba(255,255,255,.8)`→`#fff` values, same visual pattern) | **Reuse the exact traced token values + the attribute-selector specificity technique** — kickoff-pre-authorized ("Add a small CSS module only if a specific color/hover needs to beat Mantine's unlayered CSS") | `SaveToCollectionButton.module.css` `[data-shape='icon']` rule |

No new shared component, pattern, or design token was created.
`SaveToCollectionButton.module.css` is a component-scoped CSS module, matching the
`FavoriteButton.module.css` precedent exactly.

## Validation evidence

1. `npm run typecheck` → **0 errors** (run twice: mid-task and on the final clean state).
2. `npm run check:stories` → **PASSED — 122 files checked, 0 violations.**
3. `npm run check:i18n` → **PASSED — 2206/2206 keys, 4 locales, no delta.**
4. `npm run check:mojibake` → **0 artifacts in 1853 files.**
5. `npm run build` → **exit 0**, `✓ Compiled successfully` (run twice — once mid-task with the
   temporary dev route/AuthContext export present, once on the final clean state after full
   cleanup — both green; the temp route/export were `'use client'`-only additions with no
   server-build implications, but re-running on the clean state is the reported gate result).
6. **Rendered proof + computed-style check** — see sections above (real-browser Playwright capture,
   both action-row pills + the icon overlay, both viewports, plus the dialog-open interaction).
7. `git status --short` (final) → `SaveToCollectionButton.tsx`, `SaveToCollectionButton.module.css`
   (new), `docs/backlog.md`, this session log, plus the pre-existing `git status` entry for
   `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` — **confirmed
   NOT touched by this session** (present in `git status` at session start, before any edit; see
   below).

**Pre-existing modification, not from this session:** `git status --short` at session start already
showed `docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md` as modified
(current branch `task/q0-ci-rendered-locale-split`, unrelated in-progress work). Not touched, read, or
regenerated by this session.

## Self-review findings

1. **Real defect found and fixed before completion:** the kickoff's literal icon-shape prop
   suggestion (`size={32} radius="pill"`, copied from Task 653's icon) does not match this
   component's actual traced consumer (`FavoritesShell.tsx`, `icon-sm`=28px, legacy `rounded-lg`=12px,
   not a 32px circle) — see Summary. Caught by tracing the actual consumer's passed className before
   implementing, then confirmed via direct `node_modules/@mantine/core/styles.css` inspection that
   the unlayered-CSS rule would silently break it if left unaddressed. Resolved within
   `SaveToCollectionButton.tsx` only (no `FavoritesShell.tsx` edit, no scope expansion).
   **NOT fully caught in the base session, however:** `size={28}` was corrected, but `radius="lg"`
   was used believing Mantine's theme token reproduced the traced 12px value — it actually resolves
   to 8px, a genuine regression only caught in Revision 1 (see the dedicated section above) after the
   orchestrator flagged it. The base session's own real-browser capture recorded `8px` and was
   (wrongly) accepted as matching the trace, rather than being cross-checked against `globals.css`'s
   `--radius` override.
2. **Flagged, non-blocking background deviation** between the two action-row pills (translucent vs
   solid white) — see Computed-style section. Not silently resolved either way; R1/R2's literal text
   only names height/radius/border, both of which match exactly; visually imperceptible on the page's
   white background.
3. **Kickoff path corrections** (target + template both under `src/modules/listings/components/`, not
   `src/components/shared/`) — same class of correction Task 653's own session log made.
4. **Build gate run twice** — once mid-task (temporary evidence infrastructure present) and once on
   the fully-cleaned final state, both exit 0, to ensure the reported gate result reflects the actual
   committable diff, not a state with temporary scaffolding still present.

## Assumptions, deviations, and limitations

- **Pill background deviation** (translucent vs solid white) — genuine, evidenced, non-blocking per
  R1/R2's literal text; see Computed-style section and Self-review #2.
- **Auth-gated live-page capture substituted** — both `ListingContact`'s action row and
  `FavoritesShell`'s card overlay require an authenticated session; no test credentials available in
  this sandbox. Substituted with a temporary, fully-reverted/deleted dev route + one temporary,
  fully-reverted `AuthContext` export (see Files Changed) — same substitution class as Task 653/630.
- No new test file was added (the kickoff did not request one; `SaveToCollectionButton.tsx` had no
  pre-existing test file to extend, unlike `FavoriteButton.test.tsx`). All behavior evidence is
  real-browser (computed style + interaction), per the Q3 profile's own evidence list.
- `check:hydration` not run — not part of this task's named Q3 gate list; no new client boundary
  (file already `'use client'`).

## Opus handoff

Evidence locations:
- Diff: `src/modules/listings/components/SaveToCollectionButton.tsx`,
  `SaveToCollectionButton.module.css` (new) — reproduced in relevant part above, full diff via
  `git diff`.
- Rendered screenshots + the Playwright capture script + the temporary dev route/AuthContext export:
  captured/verified this session, then deleted/reverted (session-scratchpad only) — re-capturable via
  the same technique described in Files Changed.

Questions/risks for the reviewer to inspect:
1. **Pill background deviation** (R1/R2 literal text satisfied on height/radius/border; background
   differs at the CSS level but not visually) — confirm this reading of R1/R2's scope is correct, or
   decide whether the save pill should also adopt a `rgba(255,255,255,.8)` resting background for
   byte-for-byte CSS parity with the favorite pill (would require a new, currently-unauthorized CSS
   module rule for the pill shape).
2. **RESOLVED by Revision 1:** icon-shape prop adaptation was `size={28} radius="lg"` in the base
   session — the `radius="lg"` half was itself wrong (Mantine theme `lg`=8px ≠ this project's Tailwind
   `rounded-lg`=12px); corrected to `radius="0.75rem"` and real-browser re-verified `border-radius:
   12px`. `size={28}` was correct from the base session and unchanged. See the Revision 1 section
   above for the full fix + re-verification.
3. Confirm the temporary `AuthContext.tsx` export-and-revert technique (used only for evidence
   capture, verified via a clean `git diff` afterward) is an acceptable QA method for future
   auth-gated evidence gaps of this kind, or whether a more permanent test-harness solution (e.g. an
   exported mock-auth utility for RTL/Playwright) should be a follow-up task.

## Backlog update

`docs/backlog.md` updated with a concise Task 654 entry under "Open — needs action" (after Task 653)
and the "Task numbering — last used" line advanced to 654 (next free: 655). Resulting physical line
count: **75 lines** (within the 80-line hard limit — no `BACKLOG LIMIT BREACH`).
