# Session Log — 2026-06-12 — Task 419 (Sprint 35, Slice 4b)

**Task:** `tasks/Sprints/Sprint_35_kickoff_prompt_Task_419_Slice4b_AdminShellActionButtonsFullWidth.md`
**Scope:** Admin shell action buttons full-width at `<640` (§26.1), audit all 6 admin-shell
surfaces, fix only proven non-compliance, container-only / `max-sm:`-gated, byte-identical at
`≥640`. Tab bar verify-only (owner-decided, no `flex-1`/full-width change). No primitive edits.
No AdminSidebar drawer→bottom-sheet conversion (§26.6 exception preserved).

---

## 1. Per-component audit

| Surface | §26.1/§26.4/§26.6 verdict | Action |
|---|---|---|
| **AdminPageShell** (`pageShellActions` target — actions row in `WithActions`/`MultipleActions`/`WithTabsAndActions`) | Container already carries `max-sm:w-full [&>*]:max-sm:w-full sm:shrink-0` — every action button stretches full-width at `<640`, content-width at `≥640`. **Compliant.** | Verify-only, no edit. |
| **AdminSettings** (`settingsFooter` target — Save-button footer row) | **Non-compliant.** Footer row was `flex items-center justify-between pt-2 border-t`; the Save button sat in `<div className="ml-auto">`, which is content-width (shrink-to-fit) at all breakpoints — the Save button never reached full container width at `<640`. | **FIXED** — see §2.1 below. |
| **AdminSidebar** (`sidebarDrawer` target — mobile drawer: Logout button + first NavItem link) | Logout button already `w-full justify-start`; NavItem links already full-width via flex-col stretch. Close button is icon-only → §26.4 exempt. Left-nav drawer (`side="left"` Sheet) is the owner-approved §26.6 exception — **NOT converted to bottom-sheet** (preserved as-is). **Compliant.** | Verify-only, no edit. |
| **AdminMobileHeader** (`mobileHeaderBar` target) | Only control is the hamburger menu button, `size="icon"` (icon-only) → §26.4 exempt — no full-width control to assert. `noHScroll` check covers the bar itself. **Compliant.** | Verify-only, no edit. |
| **AdminUserAvatar** (`avatarEditButtons` target — edit-mode Replace/Upload + Remove buttons) | **Non-compliant.** Wrapper `flex flex-col sm:flex-row gap-2` is itself a flex item of an `items-center` (column) parent, giving it an indefinite cross-size; the Button primitive's `max-sm:w-full` (`size="sm"`) resolved to `auto` against that indefinite containing block and was a no-op. Measured ~96.09375px at 320/375/390/1024 — i.e. NOT stretching at `<640`. Camera button is icon-only → §26.4 exempt (unaffected). | **FIXED** — see §2.2 below. Pre-authorized by kickoff item 5 ("Add `max-sm:w-full` only if the stretch is proven NOT to hold; otherwise verify-only"). |
| **AdminLayout.stories** (`adminLayoutToolbar` target — `system-adminlayout--admin-toolbar`, Search/Filter/Add row) | Row already `flex flex-col md:flex-row md:flex-wrap md:items-center gap-2` with all children `max-md:w-full` — full-width at `<640` (and at `640–767` per `md:` breakpoint, intentional per existing design), content-width at `≥768`. **Compliant.** | Verify-only, no edit. |

**Tab bar (AdminSettings tab strip, `flex gap-1 bg-muted rounded-xl p-1 flex-wrap`):** left as-is
per owner decision (no `flex-1`/full-width change). Verified `overflow=0` (no horizontal scroll)
at all 4 locales × 320/375/390/1024 — confirmed via the focused QA matrix below.

---

## 2. Product fixes (container-only, `max-sm:`-gated)

### 2.1 `src/components/admin/AdminSettings.tsx` — Save-button footer

```diff
- <div className="flex items-center justify-between pt-2 border-t">
+ <div className="flex items-center justify-between pt-2 border-t max-sm:flex-col max-sm:items-stretch [&>*]:max-sm:w-full">
    {saveState === 'error' && ( ... )}
-   <div className="ml-auto">
+   <div className="ml-auto max-sm:ml-0 max-sm:w-full">
      <Button ...>{...}</Button>
    </div>
  </div>
```

At `<640`: footer row stacks vertically and every direct child (error message, Save wrapper)
becomes full-width, so the Save button fills the available width. At `≥640`: unchanged —
`flex items-center justify-between pt-2 border-t` + `ml-auto` content-width Save button,
byte-identical to before.

### 2.2 `src/components/admin/AdminUserAvatar.tsx` — edit-mode buttons wrapper (line 187)

```diff
- <div className="flex flex-col sm:flex-row gap-2">
+ <div className="flex flex-col sm:flex-row gap-2 max-sm:w-full">
    <Button type="button" variant="outline" size="sm" ...>{...}</Button>
    {showRemove && currentUrl && (
      <Button type="button" variant="ghost" size="sm" ...>{...}</Button>
    )}
  </div>
```

At `<640`: wrapper now has a definite full width, so the Button primitive's existing
`max-sm:w-full` (size `sm`) now resolves correctly and the Replace/Upload + Remove buttons
stack full-width. At `≥640`: unchanged — `sm:flex-row gap-2`, content-width row, byte-identical
(96.09375px measured before and after).

No Button primitive (`src/components/ui/button.tsx`) edits — both fixes are container-level in
product components.

---

## 3. Focused QA — `scripts/task419-qa-shell-fullwidth.mjs` (new script)

9 stories × 4 locales (sq/en/uk/it) × 4 viewports (320/375/390/1024) = **144 cells**.

Two QA-script-only bugs were found and fixed during development (both make the script MORE
correct/strict — no assertion weakened):

1. **Hidden-duplicate-instance bug (`sidebarDrawer` target):** `admin-adminsidebar--mobile-drawer-open`
   renders BOTH a hidden desktop sidebar copy and the visible mobile-drawer instance. The
   original `.find()` matched the hidden (width=0) copy, producing a false `0==0` pass on all
   12 AdminSidebar mobile cells. **Fix:** filter candidates to `b.offsetParent !== null`
   (visible instance only).
2. **Parent-padding bug (`sidebarDrawer` target):** after fix 1, the same 12 cells failed with
   real measurements `parentWidth:167, children:[159]` (diff 8 > TOL 4) — the Logout button's
   immediate parent has `px-1` (8px total horizontal padding), and the button correctly fills
   the parent's *content-box* width (167−8=159). The kickoff spec (item 6) requires comparing
   against the parent's content width (`clientWidth` minus horizontal padding). **Fix:**
   `parentContentWidth = parentRect.width - paddingLeft - paddingRight` via `getComputedStyle`.

After both QA-script fixes + the `AdminUserAvatar.tsx` product fix and selector update
(exact-class match updated to `flex flex-col sm:flex-row gap-2 max-sm:w-full`):

```
Results: 144/144 PASS, 0 FAIL
Manifest: .screenshots/task419-qa/2026-06-12T13-24/manifest.json
PNGs (uk@320/375/390 only): .screenshots/task419-qa/2026-06-12T13-24/*.png
```

All 9 stories: 16/16 PASS each (4 locales × 4 viewports).

Verified via manifest measurements:
- AdminUserAvatar edit-buttons wrapper: 288px@320, 343px@375, 358px@390 (full-width, matches
  parent content width within TOL), **96.09375px@1024** (unchanged desktop width, proving
  `≥640` byte-identical).
- AdminSettings Save-button: full-width at 320/375/390, content-width at 1024 (unchanged).
- AdminSidebar mobile drawer: Logout button + NavItem links full-width at `<640` (alwaysFull
  pattern, mobile-only assertion).
- `noHScroll` = true (overflow=0) for all 144 cells, including the AdminSettings tab bar at
  all 4 locales × 320/375/390/1024.

(An earlier intermediate run, before both QA-script fixes were applied, recorded
132/144 PASS / 12 FAIL — all 12 failures were the AdminSidebar `sidebarDrawer` hidden-instance
false-positive-then-real-padding-diff described above; fully resolved by fixes 1+2, not a
product regression.)

---

## 4. Validation gates

Run twice — once after the `AdminSettings.tsx` fix, once after the `AdminUserAvatar.tsx` fix —
both times **clean / PASS**:

- `npx tsc --noEmit` — clean (0 errors), both runs.
- `npm run lint` — clean (0 new issues), both runs.
- `npm run build-storybook` — builds successfully, both runs.
- `check:stories` — PASS.
- `check:i18n` — PASS.
- `check:story-coverage` — PASS.
- `check:design-tokens` — PASS.

---

## 5. `screenshots:assert` (2520-cell rendered matrix)

**Run 1** (after `AdminSettings.tsx` fix, before `AdminUserAvatar.tsx` fix):

```
Results: 2520/2520 PASS, 0 FAIL
flaky-recovered: 1
```

**Run 2** (after BOTH `AdminSettings.tsx` and `AdminUserAvatar.tsx` fixes — authoritative for
the final diff):

```
Output: .screenshots/rendered-assert/2026-06-12T13-28/
Results: 2520/2520 PASS, 0 FAIL
flaky-recovered: 0
Manifest: .screenshots/rendered-assert/2026-06-12T13-28/manifest.json
✅ All rendered assertions PASSED.
```

Executor-sandbox gate satisfied for the final diff (2520/2520, 0 FAIL, 0 flaky-recovered). Per
clause 14, the owner-native re-run remains the authoritative integrity check.

---

## 6. File-integrity checks

All three touched/added files verified clean (0 NUL bytes, no BOM, intact tails, no
mid-file truncation):

| File | NUL bytes | BOM | Tail | `node --check` |
|---|---|---|---|---|
| `src/components/admin/AdminSettings.tsx` | 0 | none | `</div>\n  )\n}\n` | n/a (tsx, covered by `tsc`) |
| `src/components/admin/AdminUserAvatar.tsx` | 0 | none | `</div>\n  )\n}\n` | n/a (tsx, covered by `tsc`) |
| `scripts/task419-qa-shell-fullwidth.mjs` | 0 | none | `main().catch(err => { console.error(err); process.exit(1); });\n` | clean (OK) |

---

## 7. Files Changed

| File | Change |
|---|---|
| `src/components/admin/AdminSettings.tsx` | Save-button footer row: `max-sm:flex-col max-sm:items-stretch [&>*]:max-sm:w-full` on the row, `max-sm:ml-0 max-sm:w-full` on the Save wrapper. §26.1 fix, byte-identical at `≥640`. |
| `src/components/admin/AdminUserAvatar.tsx` | Edit-mode buttons wrapper (line 187): added `max-sm:w-full`. §26.1 fix (pre-authorized by kickoff), byte-identical at `≥640`. |
| `scripts/task419-qa-shell-fullwidth.mjs` | **New** — focused QA script: 9 admin-shell stories × 4 locales × 4 viewports (144 cells), asserting full-width-at-`<640`, content-width-at-`≥640`, and `noHScroll` for the admin-shell surfaces in scope. |
| `docs/backlog.md` | "Last Session" updated to summarize Task 419 (both fixes), `screenshots:assert` status, session-log pointer. |
| `docs/responsive-storybook-inventory.md` | §5 Slice 4b header marked ✅ DONE (Task 419); "Result" paragraph describes both fixes, audit verdicts for the other 4 surfaces, QA matrix result, and `screenshots:assert` result. |

---

## 8. Confirmations

- **No primitive edited** — `src/components/ui/button.tsx` untouched; both fixes are
  container-level changes in product components (`AdminSettings.tsx`, `AdminUserAvatar.tsx`).
- **No `≥640` layout shift** — both fixes are `max-sm:`-gated; rendered measurements confirm
  unchanged desktop widths (AdminUserAvatar wrapper 96.09375px@1024 before and after;
  AdminSettings Save button content-width@1024 before and after).
- **No handler/control/locale-string changes** — only `className` strings touched.
- **Tab bar left as-is** (owner-decided) — verified `overflow=0` at all 4 locales ×
  320/375/390/1024.
- **AdminSidebar §26.6 exception preserved** — left-nav drawer (`side="left"` Sheet) NOT
  converted to a bottom-sheet; Logout/NavItem full-width and icon-only close button confirmed
  already compliant (verify-only).
- **`screenshots:assert` regression check** — final run (post both fixes) = 2520/2520, 0 FAIL,
  0 flaky-recovered — no regression vs the 2520/2520 baseline.
- **No scope creep** — AdminPageShell, AdminMobileHeader, AdminLayout.stories confirmed
  compliant via audit, left untouched.
- **No git commands emitted** by the executor (single-writer rule) — orchestrator to review
  diff and emit explicit-path commit commands.
