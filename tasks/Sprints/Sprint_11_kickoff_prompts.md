# Sprint 11 — Kickoff Prompts

**Filed by:** Opus 4.7 orchestrator 2026-05-25  
**Next task number:** 225

---

## Task 225 — T221b: Canonical `buttonVariants()` for raw interactive elements

**Kickoff file:** this section (copy-paste to Sonnet 4.6)

---

You are the Sonnet 4.6 executor for lero.al (Next.js / Tailwind / shadcn/ui).
Read `docs/ai-behavior.md` and `docs/ui-rules.md` in full before touching any file.
This is Task 225 — T221b follow-up from Task 221a.

### Context

Task 221a fixed 23 canonical `Button` height violations but deferred four categories of raw
interactive elements that need `buttonVariants()` instead of ad-hoc Tailwind. These are
admin-only or listing-detail surfaces. All are confirmed violations of `docs/ui-rules.md §0`.

### Exact scope — 4 change sites, nothing else

**Site 1 — `src/app/admin/users/page.tsx` line ~91**

```tsx
// CURRENT (violation):
<Link
  href="/admin/users/new"
  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
>
```

Fix: import `buttonVariants` from `@/components/ui/button`; replace the ad-hoc className with
`buttonVariants({ size: 'lg' })` (h-9, rounded-xl, primary variant). Keep the icon + label unchanged.
Do NOT use `cn()` to append — `buttonVariants()` already produces the full className string.

**Site 2 — `src/components/admin/AdminExchangeProvidersManager.tsx` line ~122**

Find the raw `<button>` element used as a segmented-control mode selector (not a `<Button>`
component from shadcn). Replace with the canonical `<Button>` component with appropriate
`variant` and `size` props that preserve the existing visual appearance. Confirm no other raw
`<button>` elements exist in this file outside of any library primitives.

**Site 3 — `src/modules/listings/components/ListingContact.tsx` lines ~207, ~212**

`FavoriteButton` and `SaveToCollectionButton` are called with `className="flex-1 h-9 ..."`.
These components accept a `className` prop, so the fix belongs in the component definitions,
not just the caller:

- Check if `FavoriteButton` and `SaveToCollectionButton` expose a `size` prop. If not, add one
  that maps to canonical Button sizes (e.g. `size?: 'default' | 'lg' | 'xl'`).
- In `ListingContact.tsx`, remove the `h-9` from `className`; use the `size` prop instead.
- The `flex-1` (fill available width) must be preserved — keep it in `className`.

**Site 4 — `src/modules/listings/components/ListingContact.tsx` (multiple lines) and
`src/modules/listings/components/ListingMobileCTA.tsx` lines ~32, ~44**

Raw `<a>` and `<div>` elements styled as buttons (h-10/h-11 + bg-* + rounded-xl + etc.).
These are telephone/WhatsApp contact links. Replace with:
```tsx
<a href="tel:..." className={cn(buttonVariants({ size: 'xl', variant: 'default' }), 'flex-1')}>
```
Use `buttonVariants()` imported from `@/components/ui/button`. Preserve all existing `href`,
`aria-label`, `target`, and icon children. Do NOT change the surrounding layout.

### Acceptance criteria

- [ ] Zero raw `<Link className="h-*...">` without `buttonVariants()` in `src/app/admin/users/page.tsx`
- [ ] Zero raw `<button>` elements (outside library primitives) in `AdminExchangeProvidersManager.tsx`
- [ ] `FavoriteButton` + `SaveToCollectionButton` expose `size` prop; `h-9` removed from `ListingContact.tsx` caller
- [ ] All `<a>`/`<div>` acting as buttons in `ListingContact.tsx` + `ListingMobileCTA.tsx` use `buttonVariants()`
- [ ] No new i18n keys (all visible strings already exist)
- [ ] `tsc --noEmit` → 0 errors
- [ ] §17 UI pre-flight output in session log
- [ ] `docs/backlog.md` updated (Last Session block for Task 225)
- [ ] `docs/sessions/2026-05-25-task-225-t221b-buttonvariants.md` created

### Hard contract

- Do NOT change any layout, spacing, color, or visible content
- Do NOT touch files not listed above (no scope creep)
- Do NOT invent new variants or sizes; use only existing canonical sizes
- Do NOT run git

---

## Task 226 — T221c: Admin form Input height standardization

**Kickoff file:** this section (copy-paste to Sonnet 4.6)

---

You are the Sonnet 4.6 executor for lero.al (Next.js / Tailwind / shadcn/ui).
Read `docs/ai-behavior.md`, `docs/ui-rules.md`, and `docs/component-rules.md` in full.
This is Task 226 — T221c follow-up from Task 221a.

### Context

Admin form fields across multiple components use `className="h-10 rounded-xl"` on `<Input>`
elements, which overrides the canonical h-9 default (§4: "NEVER override Input height via
direct className"). Task 221a identified this as widespread (~10+ admin files) and likely
a deliberate design decision (40px admin inputs vs 36px public inputs).

### Your job — decision + implementation

1. **Confirm the pattern**: `grep -rn 'className=.*h-10.*rounded-xl\|className=.*rounded-xl.*h-10' src/components/admin/ src/app/admin/`. Count the files and occurrences.

2. **Decision gate**: If occurrences are ≥ 8 across ≥ 4 files → the 40px admin-input height is a
   deliberate design decision. In that case:
   - Add a new `admin` Input size variant to `src/components/ui/input.tsx` (e.g. `size="admin"` → `h-10 rounded-xl`), OR
   - Create a thin `AdminInput` wrapper at `src/components/admin/AdminInput.tsx` that applies the class.
   - Replace ALL `<Input className="... h-10 rounded-xl ...">` instances in admin files with the new variant/wrapper.
   - Update `docs/ui-rules.md §4` to document the admin-input canonical pattern.

   If occurrences are < 8 → simply remove the `h-10` overrides (let canonical h-9 apply).

3. **Scope**: `src/components/admin/` + `src/app/admin/` only. Do NOT touch public/listing/auth UI.

### Acceptance criteria

- [ ] Zero `className=.*h-10.*rounded-xl` on `<Input>` in admin files (replaced by canonical variant/wrapper OR removed)
- [ ] If a new variant/wrapper was created: documented in `docs/ui-rules.md §4` admin-input section
- [ ] `tsc --noEmit` → 0 errors
- [ ] §17 UI pre-flight output in session log
- [ ] `docs/backlog.md` updated
- [ ] `docs/sessions/2026-05-25-task-226-t221c-admin-input-height.md` created

### Hard contract

- No new locale keys
- No layout changes — only Input height canonicalization
- Do NOT run git

---

## Task 227 — z-index allowlist: add ListingGallery z-[100]

**Kickoff file:** this section (copy-paste to Sonnet 4.6)

---

You are the Sonnet 4.6 executor for lero.al (Next.js / Tailwind / shadcn/ui).
Read `docs/ai-behavior.md` and `docs/tailwind-governance.md` in full.
This is Task 227 — governance hygiene chore.

### Context

`src/modules/listings/components/ListingGallery.tsx:135` uses `z-[100]` for the fullscreen gallery
overlay (`fixed inset-0 z-[100]`). This arbitrary z-index is intentional (must sit above all
floating UI including dialogs/sheets at z-50) but is NOT in `scripts/governance/tailwind-entropy.allowlist.json`.
`PerfDevOverlay z-[9999]` IS correctly allowlisted (verified). The governance doc table
(`tailwind-governance.md §16`) already documents `z-[100]` as "Toast" tier but does not
reference ListingGallery.

### Exact changes

1. Add to `scripts/governance/tailwind-entropy.allowlist.json` under `"arbitrary-z-index"` entries:
```json
{
  "rule": "arbitrary-z-index",
  "file": "src/modules/listings/components/ListingGallery.tsx",
  "pattern": "z-[100]",
  "reason": "Full-screen gallery overlay must sit above all floating UI (dialogs z-50, sheets z-50). Fixed inset-0 — no conflict with positioned content.",
  "reviewer": "governance",
  "expires": "2026-12-01"
}
```

2. Update the z-index table in `docs/tailwind-governance.md §16` (or wherever the z-index scale
   table is) to add a row for ListingGallery:
   `| Full-screen gallery | z-[100] | ListingGallery overlay (allowlisted) |`

3. Also update the backlog.md comment in the 221a deferred section to note that the z-index
   allowlist chore is done.

### Acceptance criteria

- [ ] `ListingGallery z-[100]` entry added to `tailwind-entropy.allowlist.json`
- [ ] `tailwind-governance.md` z-index table updated
- [ ] `tsc --noEmit` → 0 errors (no TS changes expected)
- [ ] `docs/backlog.md` updated
- [ ] `docs/sessions/2026-05-25-task-227-zindex-allowlist.md` created

### Hard contract

- Only the two governance files + backlog. No production code changes.
- Do NOT run git
