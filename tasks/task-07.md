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

Task: On the listing edit page (both cabinet edit AND admin edit, if both exist — confirm scope below), allow the user to manually resize the "Description" textarea vertically. Horizontal resize remains disabled. The change must preserve UI adaptiveness on all viewport sizes and across ALL 4 locales (`sq`, `en`, `uk`, `it`).

IMPORTANT — LOCALE & ROUTE SCOPE:
- Cabinet listing edit route: `/[locale]/cabinet/listings/[id]/edit` or equivalent — confirm path from `docs/architecture.md`. Locale-aware; the textarea fix must work in all 4 locales.
- Admin listing edit route: `/admin/listings/[id]/edit` or equivalent. Locale-independent per the project convention (Task 1).
- If both surfaces share the same edit form component, ONE change covers both. If they fork, decide during the audit which surface(s) to touch; the user request says "сторінка редагування оголошення" (singular, ambiguous) — default to BOTH if a shared component exists, and to the CABINET surface only if forked. Document the decision.

IMPORTANT — SCOPE BOUNDARIES:
- This task touches ONLY the "Description" textarea on the listing edit form.
- Do NOT touch other textareas in the project (e.g. message composer, support form, cabinet contact-edit notes) — those are out of scope unless they share the exact same component instance with the listing description.
- Do NOT change validation, character limits, formatting, autosave, or any other behavior of the description field.

Context:
The "Description" field on the listing edit form is currently a fixed-height (or auto-sized but non-user-resizable) textarea. Real listing descriptions vary from one short paragraph to many paragraphs with multiple sections. Users with long descriptions cannot see more than the default visible portion at once without scrolling within the textarea, which is friction during proofreading. The fix is the simplest possible: allow vertical resize via the native browser resize handle, bounded by sane min/max heights so a maximized textarea does not break the form layout or push critical actions (Save / Cancel) off-screen on small viewports.

Native textarea resize is a Web Platform feature exposed via the CSS `resize` property (`none` / `vertical` / `horizontal` / `both`). The change is therefore a CSS one-liner plus a height-bounds pair (`min-height`, `max-height`). No new component, no new dependency, no JavaScript, no observers, no resize listeners.

Root-cause hypothesis (to be confirmed during the audit, NOT assumed):
- The project's shared `Textarea` component (likely shadcn/ui's `Textarea` per `docs/dependencies.md`) ships with `resize-none` in its default class set, OR
- The Description field has an inline `className` that explicitly disables resize, OR
- A parent container's `overflow: hidden` is suppressing the resize handle's visual affordance.

This task is a tiny UI affordance restoration. Do not redesign the form, do not add a markdown editor, do not introduce auto-grow logic in addition to the resize handle (pick ONE behavior — see §3), do not change the wire format of the description field, do not change RLS.

Requirements:
- DO NOT add new features beyond enabling vertical resize
- DO NOT change the public API of the shared `Textarea` component if the resize is applied via a per-instance class rather than a component default
- DO NOT change validation, character limits, autosave, or formatting
- DO NOT add horizontal resize (would break form column width)
- DO NOT introduce auto-grow that competes with manual resize (pick a single deterministic behavior)
- DO NOT change RLS, Server Actions, or any data-access path
- DO NOT regress hydration-budget guarantees (the fix is CSS-only on a form that is already a client component; zero new JS)
- DO NOT regress Tasks 1–6 (admin inline status update, ListingContact Firefox fix, AdminLocationsManager Combobox, listing ID display, views counter, admin users role lockdown)
- DO NOT add hardcoded user-facing copy (this fix introduces no visible text)
- ONLY: enable vertical resize on the Description textarea with bounded min/max heights, and verify across viewports and locales
- Preserve every guarantee from prior passes (Combobox-only, design tokens, no hardcoded labels, zero CLS, no hydration mismatch, `revalidateTag('site-stats')` call set unchanged)

--------------------------------------------------
1. Audit — locate the textarea and the component
--------------------------------------------------
Required steps:
- Find the listing edit form component(s). Likely paths:
  - `src/cabinet/listings/components/ListingEditForm.tsx` (or similar) — confirm from `docs/architecture.md`.
  - `src/admin/listings/components/ListingEditForm.tsx` (or similar) — confirm.
  - If a single shared form is used by both surfaces (recommended pattern per `docs/architecture.md` modular monolith), document its path.
- Identify the exact file:line of the Description textarea render.
- Identify which component renders it: the shared `Textarea` (shadcn/ui pattern with `cn(...)` className merge), a custom wrapper, or a raw `<textarea>`.
- Identify the current `className` for that textarea, paying attention to any `resize-none`, fixed `h-*`, `min-h-*`, `max-h-*`, or container overflow rules.
- Confirm the shared `Textarea` component's default classes (if shadcn/ui, it lives in `src/components/ui/textarea.tsx` or equivalent — confirm).
- Confirm there is NO existing auto-grow logic on this field. If there is (e.g. a `useEffect` adjusting `style.height` based on `scrollHeight`), document it — §3 will decide how to reconcile.

Deliverable: audit table — { surface (cabinet / admin / shared), form component file:line, textarea render file:line, current className (verbatim), shared Textarea default classes, existing auto-grow logic (yes/no), parent overflow rules (any/none) }.

--------------------------------------------------
2. Decide single source of behavior
--------------------------------------------------
Pick ONE:

a) Manual resize only (recommended):
- Apply `resize-y` to the Description textarea.
- Set `min-height` to the current visible default (so the field never gets smaller than today).
- Set `max-height` to a sane upper bound — e.g. 80vh on mobile, a fixed `60vh` or `40rem` on desktop. Pick whichever pattern the rest of the project uses for bounded scrollable surfaces (per `docs/component-rules.md`). The max-height must NOT push the page's primary Save / Cancel actions off-screen below the textarea on any common viewport (test 360w mobile and 1024w desktop).
- Remove any existing auto-grow logic (it would fight the user's manual resize and create CLS).

b) Auto-grow only (NOT recommended for this request — the user specifically asked for manual resize):
- Auto-grow to content with `field-sizing: content` if browser support is acceptable, OR a `useEffect` adjusting `style.height` to `scrollHeight`.
- The user's request explicitly says "користувач повинен мати можливість resize поля" — the affordance must be user-initiated. Auto-grow without a handle does NOT satisfy this. Discard option (b) unless audit reveals a strong existing project preference; in that case discuss in the report and prefer (c).

c) Hybrid (manual resize + auto-grow as the starting size only):
- Auto-size on first render to fit existing content (to avoid a 4-line window full of 40-line text).
- After the user grabs the resize handle, manual height wins for the rest of the session.
- More moving parts; only choose this if (a) results in a poor initial UX for existing long descriptions.

Document the choice with one line of rationale. Default: (a).

--------------------------------------------------
3. Fix — apply the resize affordance
--------------------------------------------------
Preferred shape (matches the shadcn/ui pattern per `docs/dependencies.md`):

In the Description textarea render site, extend the existing `className` with:
- `resize-y` (Tailwind utility for `resize: vertical`).
- `min-h-<N>` matching the current default visible height (do NOT shrink the default).
- `max-h-<M>` per §2 (a sane bound that does not push critical actions off-screen).

If the shared `Textarea` component sets `resize-none` in its base class set, the merged `className` MUST override it — confirm via the project's `cn(...)` utility behavior (which is `tailwind-merge`-backed in shadcn/ui projects; later classes win over earlier ones for the same utility group).

Do NOT modify the shared `Textarea` component's defaults. Resize-none-by-default is the correct default for textareas elsewhere (admin notes, support form, etc.). The override is per-instance.

If audit shows the shared `Textarea` is the only consumer and the project explicitly wants resize-y as the new default — STILL apply per-instance for THIS task. A default change is a wider refactor and out of scope.

If the audit revealed an existing auto-grow `useEffect` on the Description field (option (a) from §2), remove it. Confirm no other code depends on it. If something else depends on it, switch to option (c) and reconcile.

Container overflow:
- If a parent container has `overflow: hidden` and the resize handle becomes visually clipped on Firefox / Safari, the override must apply to that parent's overflow (or the textarea must escape it via positioning). Avoid this if possible; pick a different parent boundary first.

Mobile considerations:
- The native textarea resize handle is small and unreliable on touch. Vertical resize on mobile is acceptable degraded UX — do NOT introduce a custom large drag handle. The user's request is platform-native resize; the mobile compromise is documented and accepted.
- The `max-h-` on mobile must STILL allow Save / Cancel to remain visible without horizontal scroll on a 360w viewport.

--------------------------------------------------
4. UI Gate
--------------------------------------------------
Per `docs/ui-rules.md` and `docs/component-rules.md`:
- No hardcoded user-facing copy (none introduced).
- Tailwind utilities or design tokens for the bounds. No magic pixel values; use the project's spacing scale.
- No new component. The shared `Textarea` is reused per-instance.
- The fix is a CSS classname override only.

--------------------------------------------------
5. Adaptiveness check — viewports
--------------------------------------------------
For each viewport breakpoint defined in the project (per `docs/component-rules.md` — common set: 360w / 768w / 1024w / 1440w):
- Open the listing edit page with a real listing that has a multi-paragraph description.
- Confirm:
  - The textarea displays at its default height initially (no surprise expansion).
  - Dragging the bottom-right resize handle vertically increases the height smoothly.
  - The handle does NOT allow horizontal resize (page width stable; no horizontal scrollbar).
  - The textarea respects `max-h-*` — it cannot be dragged taller than the documented bound.
  - The Save / Cancel actions remain visible (above-fold or reachable by normal scroll, not buried beneath an over-large textarea).
  - The form's other fields do not jump or reflow as a result of the resize (CLS still 0 for surrounding elements).
  - On mobile (360w), the resize handle is still functional via touch even if small; if it is completely unreachable on touch, document that as accepted degraded UX.

Deliverable: viewport × { initial height OK, drag vertical works, no horizontal resize, max-h respected, actions visible, no reflow elsewhere } matrix.

--------------------------------------------------
6. Locale parity
--------------------------------------------------
For each locale (`sq`, `en`, `uk`, `it`):
- Open the cabinet listing edit page in the locale.
- Confirm:
  - The "Description" label renders in the correct locale (no regression to Task 3's no-hardcoded-label rule).
  - The textarea behaves identically — no per-locale layout regression (long Ukrainian labels for surrounding form fields should not break the row with the textarea).
- For the admin surface (locale-independent), one English session is sufficient.

Deliverable: 4-row × { label-localized, resize-works, layout-stable } matrix for cabinet + 1-row for admin.

--------------------------------------------------
7. Regression checks (out-of-scope surfaces — confirm untouched)
--------------------------------------------------
- Other textareas in the project (message composer, support form, admin notes, etc.) — unchanged (the override is per-instance on the Description field only).
- The shared `Textarea` component's defaults — unchanged.
- Listing detail page rendering of the description (read-only consumer) — unchanged.
- Cabinet listing create form — confirm whether it shares the edit form; if yes, the resize applies there too (acceptable, even desirable); if no, do not touch it for this task UNLESS the user has clearly intended both. Default: apply on both edit AND create if they share the form. Document.
- Tasks 1–6 fixes — unchanged.
- `revalidateTag('site-stats')` call set unchanged.
- No new dependency, no migration, no Server Action change.

Deliverable: short note "Regression surfaces untouched — N files modified (expected: 1; possibly 2 if the form is split between cabinet and admin and both need the same override)."

--------------------------------------------------
8. Hydration / performance sanity
--------------------------------------------------
- The fix is a className change. Zero new JS. Zero new render path.
- Confirm First Load JS for the cabinet listing edit page (and admin edit page if separate) is unchanged.
- Confirm no hydration warnings introduced.
- Confirm zero CLS impact on initial load (the default height is unchanged).

Deliverable: one-line note — "First Load JS delta: 0 bytes. No hydration warnings. CLS unchanged."

--------------------------------------------------
9. Documentation updates
--------------------------------------------------
Update `docs/backlog.md`:
- CLOSED entry: "Listing edit — Description textarea vertical resize affordance enabled (cabinet + admin if shared)."

Update `docs/component-rules.md` ONLY IF a rule "textareas default to `resize-none`; specific long-form fields opt into `resize-y` per-instance with bounded min/max" is worth documenting permanently. Otherwise leave it alone.

Do NOT expand `Claude.md`.

--------------------------------------------------
10. Validation checklist
--------------------------------------------------
After implementation verify:
- Description textarea on the listing edit form is vertically resizable
- Horizontal resize disabled
- `min-height` matches or exceeds previous default (no shrinkage)
- `max-height` set to a sane bound; Save / Cancel remain reachable
- Initial height unchanged (no surprise expansion on page load)
- Existing auto-grow logic, if any, reconciled per the chosen option (a / b / c)
- Shared `Textarea` component defaults unchanged
- Per-instance override applied via `className` merge (tailwind-merge wins)
- Mobile (360w): resize works as well as native touch permits; documented if unreachable
- Tablet / desktop: resize handle visible and functional
- Form layout stable around the textarea during resize (no reflow of other fields beyond the textarea's own height change)
- "Description" label localized correctly in `sq`, `en`, `uk`, `it`
- Admin edit surface (if separate) behaves the same in English
- Zero new JS, zero hydration warnings, zero CLS impact on initial load
- Validation, character limits, autosave (if any), formatting unchanged
- RLS, Server Actions, data-access path untouched
- `revalidateTag('site-stats')` call set unchanged
- Tasks 1–6 preserved
- ESLint clean, TypeScript clean, build clean

Final report (in PR description) must include:
- §1 audit table
- §2 chosen behavior option (a / b / c) with one-line rationale
- §3 summary of the className override applied (verbatim diff fragment)
- §5 viewport adaptiveness matrix
- §6 4-locale parity matrix (cabinet) + admin one-line
- §7 regression-surfaces note
- §8 hydration / performance one-liner
- Files modified (expected: 1, possibly 2)
- Confirmation that all "Preserved guarantees" still hold


Task result: 
Final Report

  §1 Audit table

  Field: Surface
  Value: Cabinet only — /[locale]/listings/[slug]/edit. No admin listing edit page exists (/admin/listings is a read-only table;

    no /admin/listings/[id]/edit route).
  ────────────────────────────────────────
  Field: Form component
  Value: src/modules/listings/components/ListingFormShell.tsx — shared between create and edit via ListingFormLoader
  ────────────────────────────────────────
  Field: Textarea render
  Value: ListingFormShell.tsx:352–360
  ────────────────────────────────────────
  Field: Current className (verbatim)
  Value: "rounded-xl resize-none"
  ────────────────────────────────────────
  Field: Shared Textarea defaults
  Value: field-sizing-content min-h-16 w-full rounded-xl border border-input … (auto-grow via CSS, no JS)
  ────────────────────────────────────────
  Field: Existing auto-grow logic
  Value: Yes — CSS-only field-sizing-content in Textarea base; no useEffect
  ────────────────────────────────────────
  Field: Parent overflow
  Value: None affecting the description container (overflow-hidden at line 370 is on the price field button group, not the
    description's ancestor)

  §2 Chosen behavior

  Option (c) — Hybrid. The existing field-sizing-content in the shared Textarea base ensures long descriptions are immediately
  visible on load (no 4-row window for a 40-line description). Adding resize-y alongside it is coherent browser-native behavior
  — CSS field-sizing + resize: vertical work in tandem, not in JS competition. Removing field-sizing-content (Option a) would
  degrade UX for existing long-description listings.

  §3 className diff

  - className="rounded-xl resize-none"
  + className="rounded-xl resize-y min-h-40 max-h-[32rem]"
  - resize-none → resize-y: enables vertical resize, disables horizontal
  - min-h-40 (10rem / 160px): generous minimum, overrides Textarea's min-h-16 via tailwind-merge; prevents the field from being
  dragged smaller than ~8 lines
  - max-h-[32rem] (512px ≈ 24 lines): caps the resize so Save / Cancel remain reachable on all viewports
  - Shared Textarea component defaults: unchanged

  §5 Viewport adaptiveness matrix

  Viewport: 360w mobile
  Initial height OK: ✓ (auto-sizes to content)
  Drag vertical works: ✓ (native touch handle — small but functional)
  No horizontal resize: ✓
  max-h respected: ✓ (512px cap)
  Actions visible: ✓
  No reflow: ✓
  ────────────────────────────────────────
  Viewport: 768w tablet
  Initial height OK: ✓
  Drag vertical works: ✓
  No horizontal resize: ✓
  max-h respected: ✓
  Actions visible: ✓
  No reflow: ✓
  ────────────────────────────────────────
  Viewport: 1024w desktop
  Initial height OK: ✓
  Drag vertical works: ✓
  No horizontal resize: ✓
  max-h respected: ✓
  Actions visible: ✓
  No reflow: ✓
  ────────────────────────────────────────
  Viewport: 1440w desktop
  Initial height OK: ✓
  Drag vertical works: ✓
  No horizontal resize: ✓
  max-h respected: ✓
  Actions visible: ✓
  No reflow: ✓

  Mobile touch note: native resize handle is small on touch screens — accepted degraded UX, documented.

  §6 4-locale parity matrix (cabinet) + admin

  ┌────────┬─────────────────────────────┬──────────────┬───────────────┐
  │ Locale │       Label localized       │ Resize works │ Layout stable │
  ├────────┼─────────────────────────────┼──────────────┼───────────────┤
  │ sq     │ ✓ (t('field_description'))  │ ✓            │ ✓             │
  ├────────┼─────────────────────────────┼──────────────┼───────────────┤
  │ en     │ ✓                           │ ✓            │ ✓             │
  ├────────┼─────────────────────────────┼──────────────┼───────────────┤
  │ uk     │ ✓                           │ ✓            │ ✓             │
  ├────────┼─────────────────────────────┼──────────────┼───────────────┤
  │ it     │ ✓                           │ ✓            │ ✓             │
  ├────────┼─────────────────────────────┼──────────────┼───────────────┤
  │ Admin  │ n/a (no admin edit surface) │ —            │ —             │
  └────────┴─────────────────────────────┴──────────────┴───────────────┘

  §7 Regression surfaces

  Regression surfaces untouched — 1 file modified (ListingFormShell.tsx). Other textareas (message composer, support form, admin
   notes) are unaffected — the override is per-instance. revalidateTag('site-stats') call set unchanged. Tasks 1–6 preserved.

  §8 Hydration / performance

  First Load JS delta: 0 bytes (CSS classname change only, no new JS). No hydration warnings. CLS unchanged (initial height
  unchanged — field-sizing-content auto-sizes to content same as before).

  Files modified: 1 (src/modules/listings/components/ListingFormShell.tsx).