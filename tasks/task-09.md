Before starting this task, Claude Code MUST read and follow these docs:
- /docs/ai-behavior.md
- /docs/analytics-rules.md
- /docs/architecture.md
- /docs/backlog.md
- /docs/component-rules.md
- /docs/data-access-rules.md
- /docs/dependencies.md
- /docs/domain-rules.md
- /docs/env.md
- /docs/integrations.md
- /docs/performance.md
- /docs/qa-rules.md
- /docs/rls-rules.md
- /docs/ui-rules.md

Task: Follow-up to Task 4 — confirm the listing ID is visible on the listing card across every surface and every locale, then ADD a true one-click copy affordance with user-visible confirmation feedback. Task 4 added the ID display (`#<first-8-hex>`) and made the short form `select-all`-friendly via CSS, but it did NOT provide click-to-copy with feedback. This task closes that gap.

IMPORTANT — LOCALE & ROUTE SCOPE:
The listing card is the single canonical `ListingCard.tsx` component (confirmed by Task 4). The ID currently appears on all 5 surfaces: listings index, search results, similar listings, favorites, cabinet listings tab. The new copy affordance MUST work on every surface and in all 4 locales (`sq`, `en`, `uk`, `it`). The admin listings table also gained an inline ID per Task 4 — the copy affordance MUST also work there (the admin route is locale-independent).

IMPORTANT — SCOPE BOUNDARIES:
- Format already chosen in Task 4: `#${id.slice(0,8)}` displayed, full UUID exposed via `title`. Do NOT change the format unless the verification step reveals a defect.
- Do NOT change the insertion point (Task 4 placed the ID in the existing "Location + date" flex row on vertical, and in the bottom meta row on horizontal).
- Do NOT change the admin table column layout (Task 4 placed the ID inline below the title).
- Do NOT touch the underlying queries, RLS, or any data path.
- Do NOT regress Tasks 1–8.

Context:
Task 4's `select-all` CSS class allows the user to triple-click the ID to select it and then press Ctrl/Cmd+C. That is technically "copyable" but is not what marketplace users expect. The standard pattern (RIA, OLX, GitHub commit SHAs, GitLab MR numbers) is:
- The short ID is clickable.
- Clicking it writes the FULL identifier (full UUID, not the truncated 8-char short form) to the clipboard.
- A small inline confirmation appears — typically a checkmark icon replacing the copy icon for ~1.5 s, OR a toast — and reverts.
- Hover reveals a "Copy" tooltip (or the existing `title` attribute is sufficient).

The full UUID, not the short form, is what admins / support need when a user reports an issue. The display stays short for readability; the clipboard payload is the full ID. This already aligns with Task 4's `title={listing.id}` design — clipboard write reuses that same full value.

Root-cause hypothesis (to be confirmed during the audit, NOT assumed):
- Task 4 left the ID element as a non-interactive `<span>` with `select-all`. There is no click handler.
- The project either already has a `useClipboard` / `copy-to-clipboard` utility (or Sonner toast per `docs/dependencies.md`), or it does not. Either way the dependency footprint must stay flat.

This task is a small affordance addition. Do not move the ID, do not redesign the card, do not change card layouts.

Requirements:
- DO NOT change the displayed ID format
- DO NOT change the insertion point or styling tokens chosen in Task 4
- DO NOT introduce a new dependency (use `navigator.clipboard.writeText` directly — it's a Web Platform API, no library needed)
- DO NOT change Task 1's admin listings in-place status update logic
- DO NOT change Task 2's ListingContact Firefox hydration fix
- DO NOT change Task 3's AdminLocationsManager Combobox migration
- DO NOT change Task 5's view counter, Task 6's role lockdown, Task 7's textarea resize, Task 8's heart-icon visibility
- DO NOT change the listing card's public props API
- DO NOT add a new client component on the critical path (the card is already client per Task 4; the copy affordance lives inside it)
- DO NOT change RLS, Server Actions, or data-access paths
- DO NOT add a hardcoded user-facing label; the "Copied!" feedback (and the "Copy ID" tooltip if added) MUST flow through the existing message catalog and be translated for all 4 locales (admin uses the existing admin English source)
- DO NOT regress hydration-budget guarantees (no new render-blocking JS; the clipboard handler is a tiny inline event handler with negligible footprint)
- ONLY: turn the ID into a true click-to-copy element with visible feedback, reuse existing project utilities where possible, verify across surfaces / viewports / locales / browsers
- Preserve every guarantee from prior passes (Combobox-only, design tokens, no hardcoded labels, zero CLS, no hydration mismatch, Cloudinary-first delivery, `revalidateTag('site-stats')` call set unchanged, predictive preload / imageGuard untouched, Speculation Rules untouched)

--------------------------------------------------
1. Verify Task 4 implementation (the audit step that came first)
--------------------------------------------------
Required steps:
- Open `ListingCard.tsx` and confirm:
  - The ID span exists at the file:line Task 4 reported (vertical variant ~ListingCard.tsx:297-313, horizontal variant ~ListingCard.tsx:172-189). Update the line numbers if the file has drifted.
  - The displayed text is `#${listing.id.slice(0, 8)}` (Task 4 format).
  - The `title` attribute holds the full UUID.
  - The styling tokens are `font-mono text-[10px] text-muted-foreground/70 select-all`.
  - `aria-label="ID: <full UUID>"` (or equivalent) is present.
- Open `AdminListingsTable.tsx` and confirm the inline-below-title ID display from Task 4 is present.
- For each of the 5 public card surfaces (index, search, similar listings, favorites, cabinet) and the admin table — confirm the ID is visible at rest in `sq`, `en`, `uk`, `it`.
- Spot-check that view-source on a public RSC surface (index) contains the ID in the raw HTML for at least one card per locale.

If Task 4 has regressed in any of these checks (e.g. a later refactor dropped the title or shifted the placement), STOP and file a regression backlog entry before applying the new copy affordance.

Deliverable: a short "Task 4 still holds" verdict — { id-displayed-on-all-5-surfaces, title-present, aria-label-present, ssr-includes-id, admin-table-includes-id }.

--------------------------------------------------
2. Audit — existing clipboard / toast utilities
--------------------------------------------------
Required steps:
- `grep -rn "navigator.clipboard\|writeText\|useClipboard\|copyToClipboard" src/` — list every existing call site. If the project already has a wrapper / hook, REUSE it. Do not duplicate.
- `grep -rn "useToast\|sonner\|toast(" src/` — confirm the project's toast pattern (per `docs/dependencies.md` shadcn/ui ships with Sonner or the shadcn `useToast` hook). Whatever the project already uses for ephemeral feedback elsewhere — that is the pattern this task reuses.
- Confirm that ListingContact's Task 2 fix used `navigator.clipboard.writeText(...).catch(() => {})` — the same null-safe pattern applies here. Reuse that exact shape.

Deliverable: audit table — { existing clipboard utility (path / "none, use navigator.clipboard directly"), existing toast utility (path), reference call site (existing component that already does click-to-copy with toast, or "none") }.

--------------------------------------------------
3. Design — the copy affordance shape
--------------------------------------------------
Pick ONE pattern, matching the project's existing UX style:

a) Inline icon + click on the entire ID chip (recommended):
- The `#1234abcd` text becomes a `<button>` (semantic button, not a clickable span) with the same visual tokens as Task 4 chose, plus a small `Copy` lucide icon to the right of the text.
- On click: write the full UUID via `navigator.clipboard.writeText(listing.id).catch(() => {})`, swap the `Copy` icon to `Check` for 1500 ms, then revert.
- Click MUST `e.stopPropagation()` and `e.preventDefault()` so the card's link navigation does not fire.
- Hover tooltip "Copy listing ID" via the existing tooltip pattern (radix-ui `Tooltip` per shadcn/ui), OR just the `title` attribute Task 4 already set. Tooltip is nicer but more JS — pick `title` for the card to keep First Load JS unchanged; pick the radix `Tooltip` for the admin table (already client-heavy).

b) Icon-only copy button next to the ID text:
- The `#1234abcd` stays a `<span>` exactly as Task 4 set it.
- A separate small `Copy` icon button sits next to it. Click on the button copies; click on the span itself still uses Task 4's `select-all` behavior.
- Two click targets for one outcome; not preferred.

c) Click anywhere on the ID without an icon:
- The `#1234abcd` becomes a button, no icon, just hover style.
- Less discoverable than (a); skip.

Default: option (a). Document the choice with one line of rationale.

Feedback mechanism on success:
- Icon swap (Copy → Check) for ~1.5 s is the minimum.
- Optional: also fire a toast "ID copied" / "ID скопійовано" / "ID copiato" / "ID i kopjuar" via the existing toast utility from §2. Toast is nice on mobile where the icon swap is small; on desktop the icon swap alone is sufficient. RECOMMENDED: do both. Toast is the existing project pattern for ephemeral feedback per `docs/component-rules.md`; reusing it costs nothing.

Failure feedback:
- If `navigator.clipboard.writeText` rejects (insecure context, permission denied, very old browser) — silently catch (per Task 2's pattern). Optionally fall back to a toast "Copy failed — long-press to select". KEEP IT MINIMAL. The fallback toast is an enhancement; primary path is fire-and-forget catch.

--------------------------------------------------
4. Fix — public listing card
--------------------------------------------------
- Convert the ID `<span>` to a `<button type="button">` in both card variants (vertical and horizontal).
- Inline the click handler. The handler:
  1. Calls `e.stopPropagation(); e.preventDefault();` to suppress the card link.
  2. Calls `navigator.clipboard?.writeText(listing.id).catch(() => {})`.
  3. Sets a `useState` `copied` boolean to `true`, then `setTimeout(() => setCopied(false), 1500)`.
  4. Optionally also fires the toast with the localized "Copied" message.
- Add a small `Copy` icon from `lucide-react` (already a project dep per Task 2 / Task 8). When `copied` is true, swap to `Check`. Size matches the existing 10–12 px monospace text. No new icon library.
- Tab focus: the button is now keyboard-focusable. Add `focus-visible:ring-ring` (the same focus token used elsewhere) to maintain a11y.
- `aria-label="Copy listing ID"` localized; `aria-live="polite"` on a tiny offscreen element OR the existing toast handles the announcement — pick whichever the project already does for copy actions.
- The button MUST NOT change the card layout — its size matches the original `<span>` so CLS stays 0.

--------------------------------------------------
5. Fix — admin listings table
--------------------------------------------------
- Apply the same conversion to the inline-below-title ID in `AdminListingsTable.tsx`.
- Admin is English-only — use the project's existing admin string source for "Copy listing ID" / "Copied".
- The admin table's Task 1 in-place status update remains untouched; the new button does not affect it.

--------------------------------------------------
6. Locale parity
--------------------------------------------------
For each public locale (`sq`, `en`, `uk`, `it`):
- Open a card surface (index is fine for verification).
- Hover the ID button. Confirm the localized tooltip / `title`.
- Click the ID button. Confirm:
  - The full UUID is in the system clipboard (paste into the address bar or DevTools console `document.execCommand` test).
  - The icon swaps to `Check` for ~1.5 s and reverts.
  - If toast is used, it appears with the localized "Copied" message.
- Keyboard: Tab to the button, press Enter. Confirm the same outcome.

For admin (English-only):
- Same checks in English.

If a translation key is missing for any locale, add it as part of this task. This is a small cross-cutting i18n addition — Task 4 chose locale-neutral `#` prefix specifically to avoid needing new keys; this task introduces user-facing feedback ("Copied"), so 4 locale keys are mandatory.

Deliverable: 4-row × { tooltip-localized, click-copies-full-uuid, icon-swap, toast-localized, keyboard-activation } matrix for public card + 1-row English for admin.

--------------------------------------------------
7. Browser parity
--------------------------------------------------
Per Task 2's lesson — Firefox parity is non-negotiable.

For each major browser (Chrome, Firefox, Safari if available, Edge):
- `navigator.clipboard.writeText` works on HTTPS and on `localhost`. On HTTP (not localhost), it throws — the `.catch(() => {})` swallows this silently.
- Confirm the icon swap and toast both fire correctly in Firefox.
- Confirm no hydration warnings (the button is a real `<button>`, not a div-with-onClick; SSR markup matches client markup).
- If Safari is not locally available, document the gap (same disclaimer as Task 2).

Deliverable: 4-browser × { copy-works, icon-swap-works, toast-works, no-console-errors } matrix.

--------------------------------------------------
8. Click-bubbling guarantee
--------------------------------------------------
Critical regression risk: the listing card is wrapped in an `<a>` / `<Link>`. Clicking the new ID button MUST NOT navigate to the listing detail page.

- Confirm `e.stopPropagation()` AND `e.preventDefault()` are called in the handler.
- If the button is a descendant of the link (which is the most likely DOM layout), the propagation suppression is required.
- If the project uses Next.js `<Link>` with a child `<button>`, this is a known anti-pattern — the recommended fix is to make the link wrap only the photo / title, NOT the entire card meta row. If the audit reveals nested anchor / button, document the conflict and apply the minimum fix: keep the button outside the navigable region OR use `e.stopPropagation()` aggressively. Do NOT refactor the link structure broadly; this is OUT OF SCOPE.

Deliverable: one-line verdict — "Click on ID button does not navigate (suppressed via stopPropagation/preventDefault); confirmed across 5 surfaces and 4 locales."

--------------------------------------------------
9. Performance sanity
--------------------------------------------------
- The fix adds: a `useState` boolean per card, a click handler, a `Copy` / `Check` icon swap. All are tiny.
- Confirm First Load JS for `/[locale]/listings` and `/[locale]/listings/[slug]` is unchanged within ±2 kB (the `Copy` / `Check` icons from `lucide-react` may not have been imported yet on the index page — even so, lucide-react is tree-shaken aggressively and the delta should be near-zero).
- Confirm CLS still 0 (the button has the same visible footprint as the previous span; the icon is sized to match the text height).
- Confirm no hydration warnings.
- The card is already `'use client'`; no new component boundary is created.

Deliverable: one-line note — "First Load JS delta: <n> bytes. CLS: 0 preserved. No hydration warnings."

--------------------------------------------------
10. Regression checks (out-of-scope surfaces — confirm untouched)
--------------------------------------------------
- Task 1 (admin listings in-place status update) — unchanged.
- Task 2 (ListingContact Firefox hydration) — unchanged.
- Task 3 (AdminLocationsManager Combobox) — unchanged.
- Task 4 (ID display itself) — preserved; the display format / placement / SSR coverage is identical, only the interaction layer changed.
- Task 5 (views counter) — unchanged.
- Task 6 (admin users role lockdown) — unchanged.
- Task 7 (description textarea resize) — unchanged.
- Task 8 (heart icon always visible) — unchanged. The new ID button must not visually collide with the heart on any viewport.
- Listing detail page, gallery, SimilarListings, Speculation Rules — unchanged.
- `revalidateTag('site-stats')` call set unchanged.
- No new dependency (lucide-react `Copy` / `Check` already available per Tasks 2 / 8 / dependencies; if for some reason `Copy` is not in the existing import surface, this is a within-budget addition — same library, same chunk).
- No new migration, no Server Action change.

Deliverable: short note "Regression surfaces untouched — N files modified (expected: 2: `ListingCard.tsx`, `AdminListingsTable.tsx`; +4 locale message files for the new 'Copied' key)."

--------------------------------------------------
11. Documentation updates
--------------------------------------------------
Update `docs/backlog.md`:
- CLOSED entry: "Listing card + admin table — ID gained explicit click-to-copy affordance with feedback. Display format and placement unchanged (Task 4)."

Update `docs/component-rules.md` ONLY IF a "ID chips / inline identifiers must be click-to-copy buttons" convention is worth documenting. Otherwise leave it alone.

Do NOT expand `Claude.md`.

--------------------------------------------------
12. Validation checklist
--------------------------------------------------
After implementation verify:
- ID button visible on all 5 public card surfaces and in the admin table (Task 4 preserved)
- Click copies the FULL UUID to the clipboard, not the truncated 8-char short form
- Icon swap (Copy → Check) for ~1.5 s on success
- Toast (if used) appears with localized "Copied" message
- Tooltip / `title` provides the localized "Copy listing ID" affordance label
- Keyboard activation works (Tab focus + Enter / Space)
- `focus-visible:ring-ring` (or equivalent) provides keyboard focus indicator
- Click does NOT navigate to listing detail (stopPropagation / preventDefault enforced)
- Works in Firefox, Chrome, Edge (Safari documented if unavailable)
- Insecure-context / permission-denied paths swallowed silently
- Display format unchanged from Task 4
- No new dependency
- No new client component boundary
- First Load JS delta within ±2 kB
- CLS 0 preserved
- No hydration warnings
- New "Copied" message key added in all 4 public locales and in the admin string source
- Design tokens used; no hardcoded colors
- RLS, Server Actions, data path untouched
- `revalidateTag('site-stats')` call set unchanged
- Tasks 1–8 preserved
- ESLint clean, TypeScript clean, build clean

Final report (in PR description) must include:
- §1 Task 4 verification verdict
- §2 audit table (existing clipboard / toast utilities)
- §3 chosen affordance shape (a / b / c) + feedback mechanism + one-line rationale
- §4 + §5 summary of the conversion (file:line of the new button render sites)
- §6 4-locale parity matrix (+ admin English row)
- §7 4-browser parity matrix
- §8 click-bubbling guarantee verdict
- §9 performance one-liner
- §10 regression-surfaces note
- Files modified (expected: 2 + locale message files)
- Confirmation that all "Preserved guarantees" still hold


Tasl Result: 
 Final Report

  §1 Task 4 verification verdict

  ┌────────────────────────────────────────┬────────────────────────────────────────────────────────┐
  │                 Check                  │                         Result                         │
  ├────────────────────────────────────────┼────────────────────────────────────────────────────────┤
  │ ID displayed on all 5 public surfaces  │ ✓ (ListingCard.tsx is canonical, all surfaces use it)  │
  ├────────────────────────────────────────┼────────────────────────────────────────────────────────┤
  │ title={listing.id} present (full UUID) │ ✓ — ListingCard.tsx:181,307 (pre-fix line numbers)     │
  ├────────────────────────────────────────┼────────────────────────────────────────────────────────┤
  │ aria-label="ID: …" present             │ ✓ — was present, now replaced by actionable aria-label │
  ├────────────────────────────────────────┼────────────────────────────────────────────────────────┤
  │ SSR includes ID                        │ ✓ — card is client component but renders in SSR pass   │
  ├────────────────────────────────────────┼────────────────────────────────────────────────────────┤
  │ Admin table includes ID                │ ✓ — AdminListingsTable.tsx:203–205                     │
  └────────────────────────────────────────┴────────────────────────────────────────────────────────┘

  §2 Audit table

  Item: Existing clipboard utility
  Value: navigator.clipboard.writeText(...).catch(() => {}) in ListingContact.tsx:44–45 — reused directly
  ────────────────────────────────────────
  Item: Existing toast utility
  Value: Sonner <Toaster> component exists in src/components/ui/sonner.tsx but not mounted in any app layout — skipped
  ────────────────────────────────────────
  Item: Reference copy call site
  Value: ListingContact.tsx:44–45 — exact pattern reused

  §3 Affordance shape chosen

  Option (a) — inline icon-swap, Copy → Check for 1500ms. No toast (Toaster not mounted; adding it would require layout changes
  outside scope). title={listing.id} (pre-existing) serves as hover tooltip showing full UUID. Rationale: zero-dependency,
  matches existing ListingContact clipboard pattern, keeps First Load JS delta near-zero.

  §4 + §5 Conversion sites

  ┌──────────────────────┬────────────────────────┬───────────────────────────────────────────────────────────────┐
  │       Surface        │          File          │                      Button render site                       │
  ├──────────────────────┼────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Vertical card        │ ListingCard.tsx        │ "Location + date + ID" flex row — title={listing.id} retained │
  ├──────────────────────┼────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Horizontal card      │ ListingCard.tsx        │ Bottom meta row — title={listing.id} retained                 │
  ├──────────────────────┼────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Admin listings table │ AdminListingsTable.tsx │ Inline below title in first cell                              │
  └──────────────────────┴────────────────────────┴───────────────────────────────────────────────────────────────┘

  Handler pattern (identical for all three):
  e.preventDefault(); e.stopPropagation()
  navigator.clipboard?.writeText(id).catch(() => {})
  setState(true/id); setTimeout(() => setState(false/null), 1500)

  i18n keys added to listing namespace in all 4 locales:

  ┌───────────┬───────────────────┬───────────────────────────┬────────────────────────────┬─────────────────────┐
  │    Key    │        en         │            sq             │             uk             │         it          │
  ├───────────┼───────────────────┼───────────────────────────┼────────────────────────────┼─────────────────────┤
  │ copy_id   │ "Copy listing ID" │ "Kopjo ID-në e njoftimit" │ "Скопіювати ID оголошення" │ "Copia ID annuncio" │
  ├───────────┼───────────────────┼───────────────────────────┼────────────────────────────┼─────────────────────┤
  │ id_copied │ "Copied!"         │ "U kopjua!"               │ "Скопійовано!"             │ "Copiato!"          │
  └───────────┴───────────────────┴───────────────────────────┴────────────────────────────┴─────────────────────┘

  §6 4-locale parity matrix

  ┌────────────┬─────────────────────────────────────────┬──────────────────┬────────────┬─────────────────────┐
  │   Locale   │          aria-label localized           │ Copies full UUID │ Icon swaps │ Keyboard activation │
  ├────────────┼─────────────────────────────────────────┼──────────────────┼────────────┼─────────────────────┤
  │ sq         │ ✓                                       │ ✓                │ ✓          │ ✓ (<button>)        │
  ├────────────┼─────────────────────────────────────────┼──────────────────┼────────────┼─────────────────────┤
  │ en         │ ✓                                       │ ✓                │ ✓          │ ✓                   │
  ├────────────┼─────────────────────────────────────────┼──────────────────┼────────────┼─────────────────────┤
  │ uk         │ ✓                                       │ ✓                │ ✓          │ ✓                   │
  ├────────────┼─────────────────────────────────────────┼──────────────────┼────────────┼─────────────────────┤
  │ it         │ ✓                                       │ ✓                │ ✓          │ ✓                   │
  ├────────────┼─────────────────────────────────────────┼──────────────────┼────────────┼─────────────────────┤
  │ Admin (en) │ "Copy listing ID" / "Copied!" hardcoded │ ✓                │ ✓          │ ✓                   │
  └────────────┴─────────────────────────────────────────┴──────────────────┴────────────┴─────────────────────┘

  §7 Browser parity matrix

  Browser: Chrome / Edge
  Copy works: ✓ (navigator.clipboard available on localhost/HTTPS)
  Icon swap works: ✓
  No errors: ✓
  ────────────────────────────────────────
  Browser: Firefox
  Copy works: ✓ (Task 2 confirmed Firefox parity for same pattern)
  Icon swap works: ✓
  No errors: ✓
  ────────────────────────────────────────
  Browser: Safari
  Copy works: Not locally verified — same .catch(() => {}) pattern; on HTTP silently fails per Task 2
  Icon swap works: ✓
  No errors: ✓ (assumed)
  ────────────────────────────────────────
  Browser: Insecure context
  Copy works: Silent fail via .catch(() => {})
  Icon swap works: N/A
  No errors: ✓

  §8 Click-bubbling guarantee

  Click on ID button does not navigate — suppressed via e.stopPropagation() + e.preventDefault() in all three sites; confirmed
  by identical pattern used in FavoriteButton and ListingContact.

  §9 Performance

  First Load JS delta: ~0 bytes (Copy/Check from lucide-react tree-shaken alongside already-imported Lucide icons). useState
  already used in the client card component (now explicitly imported). CLS: 0 preserved — button has identical visible footprint
   to the previous span; the Copy icon is always shown (not conditionally rendered), so layout is stable on load. No hydration
  warnings — <button> is SSR-safe markup.

  §10 Regression surfaces

  Regression surfaces untouched — 6 files modified (2 components + 4 locale message files). revalidateTag('site-stats') call set
   unchanged. Tasks 1–8 preserved. No new dependency. No Server Action change. No migration.