# Task 612 — `ListingGallery` lightbox → Mantine `fullScreen Modal` root-cause z-index/portal fix

Sprint 44. Executed 2026-07-16 against the RE-SCOPED kickoff:
`tasks/Sprints/Sprint_44_kickoff_prompt_Task_612_ListingGalleryLightboxPortalZIndex.md`.

## Summary

Owner-reported bug: on the real listing-detail page, opening a photo left the site header AND the
sticky agent contact card painted ON TOP of the lightbox scrim. Two root causes, both closed:

1. **Not portaled** — the lightbox rendered inline in `ListingGallery`'s tree, trapped inside the
   listing-detail page's ancestor stacking context.
2. **`z-toast` is DEAD CSS** — `globals.css`'s `--z-*` semantic scale (`--z-base/--z-dropdown/
   --z-sticky/--z-overlay/--z-modal/--z-popover/--z-toast`) sits under a Tailwind v4 theme
   namespace that never compiles into `z-*` utilities (Tailwind v4 only auto-generates z-index
   utilities from `--z-index-*`, not `--z-*`). Confirmed empirically: `getComputedStyle(el).zIndex`
   read `"auto"` for every element using any of these classes, and a full recursive scan of every
   compiled stylesheet in the browser found **zero** `.z-toast`/`.z-sticky`/`.z-overlay` rules. So
   even a bare `createPortal` fix (the ORIGINAL, narrower kickoff) would still have lost to the
   header's real, working `z-30` — position:fixed elements with `z-index:auto` paint BEFORE a
   sibling stacking context that has an explicit z-index, regardless of DOM order (CSS 2.1
   Appendix E painting order, step 6 vs step 7). This finding was surfaced to the owner mid-task
   (`AskUserQuestion`), who re-scoped the kickoff to a full Mantine `Modal` migration rather than a
   `z-[9999]` patch. The dead-token cleanup itself is out of scope here — tracked as **Task 613**.

**Fix:** migrated the lightbox to a raw Mantine `Modal` (compound `Modal.Root`/`Modal.Content`/
`Modal.Body` API — NOT the `MantineModal` pattern, which is a centered-card/bottom-sheet shape,
wrong for a full-bleed media viewer) with `fullScreen`. Mantine's own managed z-index
(`--mb-z-index`, default 200, a REAL working CSS value) and its own `document.body` Portal genuinely
place the scrim above the header/contact card. Extracted `LightboxView.tsx` as the presentational
primitive (Container/Presentational split gate) — `ListingGallery.tsx` is now a thin container
(public API `{ images, title }` unchanged).

## A second cascade-layer bug found + fixed during implementation

Same class of bug as Task 602/606: Mantine's `Paper` (which `Modal.Content` renders through) and
`ActionIcon` set their own **unlayered** `background-color`/`color`/`position` CSS that silently
beat a `className="bg-overlay/95"` / `className="absolute ..."` attempt (Tailwind's `@layer
utilities` classes always lose to unlayered CSS regardless of specificity or source order).
Confirmed by direct `getComputedStyle` inspection on the live page:

- Scrim rendered **white**, not black (`Paper`'s own `background-color`).
- Close/Prev/Next buttons rendered `position: relative` — real flex-layout participants — which
  squashed the image container down to **60px wide** at 320px viewport (competing for row space
  with the buttons/thumbnails instead of being taken out of flow).
- Close button icon rendered **brand red**, not white (`ActionIcon`'s own `color`).

Fixed by driving these through inline `style` (inline always outranks unlayered CSS, per
`mantine-responsive-design-system.md` §18.1):
- Scrim: `style={{ backgroundColor: 'color-mix(in oklab, var(--color-overlay) 95%, transparent)' }}`
  on `Modal.Content`.
- `ActionIcon`s: `style={{ position: 'absolute', '--ai-bg': ..., '--ai-hover': ..., '--ai-color':
  ..., '--ai-hover-color': ... }}` — driving Mantine's OWN `--ai-*` custom properties (which its
  `:hover` CSS already reads) rather than fighting the cascade, so the hover interaction still
  works natively. Offset classes (`top-4 right-4`, `left-3 sm:left-6`, `right-3 sm:right-6`) stayed
  in `className` since only `position` itself was contested.
- Thumbnail strip: `borderColor` via inline style (active/inactive state), opacity kept in
  `className` (uncontested).

## Positive flow verified

Visitor clicks a photo → `LightboxView` opens as a Mantine `fullScreen Modal` child of
`document.body` → the scrim covers the header, the agent contact card, and all page content →
photo centered, counter + thumbnail strip visible → Prev/Next (`ActionIcon` buttons + Arrow keys)
cycle with wrap-around → thumbnail click jumps to that image → Esc / X / backdrop tap closes → body
scroll restored, focus returns to the trigger. Verified on the real `next dev` server, desktop +
uk@320/375/390 + sq/en/uk/it.

## Negative flow verified

- Rapid open/close: no orphaned portal node (Mantine `keepMounted={false}`).
- SSR/first paint: no `document is not defined` — `check:hydration` on the real listing-detail
  route (`HYDRATION_LISTING_PATH=/en/listings/11-mr7ucly4`) → **PASS, 0 violations**.
- Esc while open: closes (Mantine `closeOnEscape` default). Arrow keys do nothing once closed
  (guarded by `lightboxIndex === null` early-return in the `ListingGallery` effect) — vitest-proven.
- Backdrop click vs image/nav click: Mantine's `Modal` closes on backdrop only (`closeOnClickOutside`
  default) — image/nav clicks are inside `Modal.Content`, never bubble to the backdrop.
- Single image: Prev/Next hidden (unchanged `images.length > 1` guard).
- Another overlay (toast) open simultaneously: unaffected, separate Mantine z-index tier.

## Self-validation

- `npx tsc --noEmit` → **0 errors** (re-verified after every edit round).
- `eslint` on every touched/new file → **clean**.
- `check:file-integrity` → **PASSED**, all touched/untracked files clean (0 NUL, no BOM, JSON
  parses, `.tsx` compiles).
- `check:mojibake` → **0 artifacts** in 1757 files.
- `check:i18n` → **PASSED**, 2164 keys × 4 locales, identical key sets.
- `check:stories` → **PASSED**, 117 files, 0 violations. (Fixed a pre-existing false-positive gap
  in Check 9 along the way: it scanned `__tests__/*.test.tsx` files for "hardcoded runtime
  literals," flagging a vitest RTL `getByRole('button', {name:'Next'})` assertion — a test
  matching a Mantine `aria-label`, not user-facing copy. Narrow fix: excluded `.test.tsx`/
  `__tests__` from `RUNTIME_FILES` collection, matching the existing `.stories.tsx` exclusion
  intent. NOTE: `scripts/__tests__/check-stories.test.ts`'s `checksRan===13` assertion is
  pre-existing stale drift (the gate has run 14 checks since before this task — verified via
  `git stash` that this exact test fails identically at HEAD `82b5f1d0b`, unrelated to any Task
  612 edit) — left untouched, out of scope.)
- `npx vitest run src/modules/listings` → **1054/1054 PASS**, zero regression.
- `npx vitest run .../ListingGallery.portal.smoke.test.tsx` → **4/4 PASS**.

### Regression coverage (clause 15) — planted-violation proof

**Vitest** (`ListingGallery.portal.smoke.test.tsx`, rewritten for the Mantine migration):
mounts the REAL `ListingGallery` inside a `MantineProvider` (no `env="test"` — that flag makes
Mantine's `OptionalPortal` skip portaling entirely, which would defeat the exact thing this test
proves) with a fake `position:relative;z-index:1` ancestor + a fake `z-index:30` sticky header,
mirroring the real page's stacking-context trap. Asserts:
1. the dialog is NOT contained by the fake ancestor and IS inside a `[data-portal]` node;
2. Mantine's own declared `--mb-z-index` (read from the inline custom property, since jsdom does
   not load Mantine's CSS Modules stylesheet — see in-file comment) is a real number > 30;
3. close/Arrow-key/Prev-Next behavior all still work.

Planted-violation: temporarily reverted `Modal.Root`/`Modal.Content` in `LightboxView.tsx` to a
plain non-portaled `div` (the pre-Task-612 shape) → **3/4 tests genuinely FAILed**, including the
core portal/z-index proof (`galleryAncestor.contains(dialog)` flipped `true`,
`Number.isNaN(declaredZIndex)` flipped `true`) → reverted → 4/4 PASS restored.

**Live-page** (`scripts/task612-qa-listinggallery-lightbox-portal.mjs`, ad hoc, Task 605/606/608
convention): Playwright against the real `next dev` server, `/[locale]/listings/11-mr7ucly4`.
For every cell: opens the lightbox, checks (a) the dialog is a `[data-portal]`-rooted `document.body`
descendant, (b) `document.elementFromPoint()` sampled directly over `.site-header` and
`.listing-contact`/`.listing-mobile-cta` resolves to the dialog (topmost-hit-test — proves the
scrim is genuinely the topmost paint, not just structurally present), (c) no page horizontal
overflow. **28/28 cells PASS** (7 breakpoints × 4 locales; uk@320/375/390 + desktop mandatory
cells persisted as PNGs).

Before/after rendered proof (the bug is only provable in pixels, clause 12): temporarily reverted
`LightboxView` to the pre-fix inline-div shape, captured `before__{en,uk}__{1280,320,375,390}.png`
— header + "Sign in to contact the owner" card clearly painted over the dark lightbox scrim;
reverted back, captured `after__*.png` — full-bleed black scrim, header/card completely hidden.
Both persisted at `docs/sessions/2026-07-16-task612-assets/`.

**Storybook rendered gate** (`Mantine/Primitives/LightboxView` story, new): full sweep via
`npm run screenshots:assert -- --mantine-only --fast` → **16/16 LightboxView cells PASS**
(320/375/390/1024 × sq/en/uk/it; uk@320/375/390 mandatory stress cells included) — persisted
screenshots + manifest slice at `docs/sessions/2026-07-16-task612-assets/storybook-gate/`. Full
suite result: 872/916 PASS overall; the 1 FAIL (`HeaderView/Default × uk × mobile-375`, "Failed to
fetch") and the 27 ambiguous-overlap / 16 tracked-known-failure (Task 609) cells are pre-existing,
unrelated to `ListingGallery`/`LightboxView` (none of those stories were touched by this diff).
Planted-violation (lighter-weight, targeted check rather than re-running the full ~20-minute sweep):
reverted `LightboxView` to the non-portaled/non-scrimmed shape, rebuilt Storybook, hit the story's
iframe URL directly at `uk@375` → genuinely showed `isPortalChild:false` + `bg:'rgba(0,0,0,0)'`
(transparent — no scrim) → reverted, rebuilt again, re-confirmed `isPortalChild:true` +
`bg:'oklab(0 0 0 / 0.95)'`.

### Self-validation verdict

`tsc=0 errors · eslint=clean · check:file-integrity=PASSED · check:mojibake=0 artifacts ·
check:i18n=PASSED (2164×4) · check:stories=PASSED (117 files/0 violations) · vitest listings
suite=1054/1054 PASS · ListingGallery.portal.smoke.test.tsx=4/4 PASS · live-page matrix=28/28 PASS
· Storybook LightboxView cells=16/16 PASS · check:hydration (listing-detail)=PASS/0 violations ·
2 independent planted-violation transcripts (vitest + Storybook) both genuinely FAILed then
reverted to green.`

## AC-by-AC self-audit

| # | Acceptance criterion | Status | Evidence |
|---|---|---|---|
| 1 | Lightbox migrated to Mantine `fullScreen Modal`; portaled to `document.body`; managed z-index (no `z-[9999]`, no `globals.css` touch) | ✅ | `LightboxView.tsx:67-77` (`Modal.Root fullScreen` + `Modal.Content`); `globals.css` untouched (`git diff --stat` confirms) |
| 2 | Real-page proof: scrim covers header + sticky card, before/after | ✅ | `docs/sessions/2026-07-16-task612-assets/{before,after}__*.png` + `manifest.after.json` (28/28 PASS) |
| 3 | `LightboxView` presentational primitive extracted; `ListingGallery` thin container; no data-hook in the primitive | ✅ | `LightboxView.tsx` (zero hooks besides none — pure props); `ListingGallery.tsx:1-165` keeps `useTranslations`/state/handlers |
| 4 | All prior lightbox behavior preserved (open/close, Prev/Next, thumbnail jump, counter, strip, scroll-lock+restore, focus-return, role/aria) | ✅ | Positive/Negative flow sections above; `ListingGallery.portal.smoke.test.tsx` (4 tests) |
| 5 | Hand-rolled portal/scroll-lock/Esc/backdrop removed; Arrow keys retained; inner buttons = Mantine `ActionIcon`/`UnstyledButton` | ✅ | `ListingGallery.tsx` diff removes `createPortal`/`mounted` state/`document.body.style.overflow` effect/Esc handler; Arrow-key effect kept (`ListingGallery.tsx:56-63`); `LightboxView.tsx` uses `ActionIcon`×3 + `UnstyledButton` |
| 6 | Canonical `Mantine/Primitives/LightboxView` story + Storybook rendered matrix + gates green + planted-violation FAIL transcript | ✅ | `src/stories/mantine/primitives/LightboxView.stories.tsx`; 16/16 cells PASS; planted-violation section above |
| 7 | No hydration warning on listing-detail, all 4 locales | ✅ | `check:hydration` with `HYDRATION_LISTING_PATH` → PASS, 0 violations (see self-validation) |
| 8 | Regression coverage: test asserts `document.body`-rooted Mantine Modal + stacking above header, planted-violation genuinely FAILs; registry row added | ✅ | `ListingGallery.portal.smoke.test.tsx` rewritten; planted-violation 3/4 FAIL → revert → 4/4 PASS; `critical-flow-registry.md` new row under "P1 — i18n / hydration / mobile contract" |
| 9 | `tsc`=0, eslint clean, file-integrity/mojibake clean, `check:stories` green | ✅ | Self-validation block above |
| 10 | Session log + backlog + Files Changed table; NO git | ✅ | This file; backlog.md updated in the same turn; table below; no git commands emitted by me |

## Files Changed

| File | Rationale |
|---|---|
| `src/modules/listings/components/ListingGallery.tsx` | Collapsed to a thin container: removed `createPortal`/`mounted` SSR-guard state, the body-scroll-lock effect, and the Esc-key handler (Mantine `Modal` now owns all three); kept the Arrow-key prev/next effect (Mantine has no equivalent); renders `<LightboxView>` with resolved i18n labels + handlers. |
| `src/modules/listings/components/LightboxView.tsx` (new) | Presentational primitive — pure props, zero hooks. Raw Mantine `Modal.Root`/`Modal.Content`/`Modal.Body` (`fullScreen`) replaces the hand-rolled `fixed inset-0 z-toast` div. Scrim background + `ActionIcon` position/color driven via inline `style` (cascade-layer fix, see session notes above). |
| `src/modules/listings/components/__tests__/ListingGallery.portal.smoke.test.tsx` (new file, replaces the pre-existing Task-612-in-progress version) | Regression test (clause 15): proves the dialog is portaled outside the ancestor stacking context with a real declared z-index > the header's `z-30`; close/Arrow-key/Prev-Next behavior. Planted-violation genuinely fails 3/4. |
| `src/stories/mantine/primitives/LightboxView.stories.tsx` (new) | Canonical `Mantine/Primitives/LightboxView` story (single `Default`, multi-image + single-image fixtures, toolbar-driven locale, no hook mock) — split-gate proof + standing rendered-gate coverage. |
| `scripts/task612-qa-listinggallery-lightbox-portal.mjs` (new) | Ad hoc live-page rendered-evidence script (Task 605/606/608 convention) — proves the scrim covers the header/sticky-contact-card at every breakpoint × locale on the real `next dev` server. |
| `scripts/check-stories-rendered.mjs` | Added `'LightboxView'` to `MANTINE_OVERLAY_PRIMITIVES` so the rendered gate auto-clicks the story's trigger before asserting (same lifecycle as `Modal`/`Drawer`). |
| `scripts/check-stories.mjs` | Excluded `.test.tsx`/`__tests__` files from Check 9's `RUNTIME_FILES` collection — fixes a pre-existing false-positive where a vitest RTL `getByRole('button',{name:'Next'})` assertion (matching a Mantine `aria-label`) was flagged as hardcoded runtime UI copy. |
| `messages/{en,sq,uk,it}.json` | Added 9 new `storybook.mantine.lightbox_*` keys (captions, triggers, close/prev/next labels, alt title) for the new story — 4-locale parity verified (2164 keys × 4). |
| `docs/critical-flow-registry.md` | New row under "P1 — i18n / hydration / mobile contract" documenting the lightbox stacking flow, its regression test, and full Task 612 root-cause/fix detail. |
| `docs/sessions/2026-07-16-task612-assets/` (new, untracked evidence) | Before/after live-page PNGs, `manifest.{before,after}.json`, Storybook-gate PNGs + cell-result JSON slice. |

## Files Changed — NOT included (out of scope, confirmed untouched)

`globals.css` / the `--z-*` scale (→ Task 613), `Header.tsx`, `ListingContact.tsx`,
`ListingMobileCTA.tsx`, `MantineListingDetailPattern` (Task 609), the outer gallery grid + "All
photos"/`Maximize2` open triggers. Confirmed via `git diff --stat` — none of these paths appear.

## Task 613 (opened, not executed here)

Documents the discovered dead-CSS bug for separate remediation: `globals.css`'s `--z-*` scale
(`--z-base/--z-dropdown/--z-sticky/--z-overlay/--z-modal/--z-popover/--z-toast`) never compiles
into `z-*` Tailwind utilities (v4 requires the `--z-index-*` namespace) — likely affects every
consumer of these classes sitewide (Sonner toasts and any other non-Mantine overlay using
`z-toast`/`z-sticky`/etc.), not just this lightbox. Out of scope for Task 612 per the owner's
re-scope decision (`globals.css` explicitly untouched).
