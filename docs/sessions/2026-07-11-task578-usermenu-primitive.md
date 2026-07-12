# Task 578 — `UserMenu` presentational primitive (desktop user dropdown)

Sprint 44. Kickoff: `tasks/Sprints/Sprint_44_kickoff_prompt_Task_578_UserMenuPrimitive.md`.
Depends on Task 577 (landed).

## Why

The desktop user menu (`md+`, logged-in) was an inline `MantineDropdownMenu` with its `items`
builder and trigger JSX living directly in `Header.tsx` (~120–136 + ~199–213), untested. Extracted
into a prop-driven `UserMenu` primitive with a canonical Mantine story (regular + admin/moderator
fixtures).

## Files Changed

| File | Rationale |
|---|---|
| `src/components/layout/UserMenu.tsx` | **NEW.** Prop-driven primitive (`user`, `locale`, `onNavigate`, `onOpenAdmin`, `onLogout`). Builds the same role-gated `DropdownMenuItemDef[]` array `Header.tsx` used inline, renders the same `MantineButton` (Avatar + truncated name + chevron) trigger via `MantineDropdownMenu`. No `useRouter`/`window.open` inside — both are container callbacks per the kickoff's API. |
| `src/stories/mantine/primitives/UserMenu.stories.tsx` | **NEW.** Canonical location (`Mantine/Primitives/UserMenu`, `MantineStoryShell`, single `Default`): regular-user + admin/moderator fixtures stacked, captions via `storyT()`. `play` function opens both dropdowns at desktop widths only (see STOP-AND-ASK resolution below). |
| `src/components/layout/Header.tsx` | Removed the inline `userMenuItems` builder (~17 lines) and the inline trigger/`MantineDropdownMenu` JSX; now renders `<UserMenu user={user} locale={locale} onNavigate={(path) => router.push(path)} onOpenAdmin={() => window.open('/admin','_blank','noopener,noreferrer')} onLogout={handleLogout} />` inside the unchanged `{user && <div className="hidden md:flex ...">}` wrapper. Dropped now-fully-unused imports: `ChevronDown`, `User`, `ListPlus`, `LayoutList`, `LayoutDashboard` (lucide-react), `Button as MantineButton` (mantine/core), `MantineDropdownMenu`, `DropdownMenuItemDef` (design-system patterns) — `LogOut` and `Avatar` stay (still used by the mobile drawer). |
| `messages/{en,sq,uk,it}.json` | 2 new `storybook.mantine.user_menu_{regular,admin}_caption` keys, full 4-locale parity (562 keys each, up from 560). |

## STOP-AND-ASK resolutions

- **#A (Admin item / styling expressible via `DropdownMenuItemDef`):** yes, no fork needed —
  `color`, `separator`, custom `ReactNode` `label` (for the `fontWeight:500` span) and `onClick`
  already cover the exact chrome `Header.tsx` used inline. Confirmed via diff — `UserMenu.tsx`
  reproduces the item array byte-for-byte, just parameterized.
- **Unplanned finding — "both menus shown OPEN" vs Mantine's uncontrolled `Menu`:** Mantine's
  `Menu` closes on any outside click, and clicking a *second* trigger counts as "outside" the
  *first* Menu's refs — so sequentially clicking both fixtures' triggers does not leave both
  dropdowns open simultaneously; the second click closes the first and opens the second. This is
  inherent, uncontrolled-primitive behavior (matches STOP-AND-ASK #A's "do NOT fork
  `MantineDropdownMenu`" instruction — adding controlled/multi-open support would be exactly that
  fork). Resolved pragmatically: the story's `play` function opens both sequentially; the rendered
  proof therefore shows the **admin** fixture's dropdown open (the differentiating content — the
  Dashboard item — is the more valuable thing to visually prove) with the **regular** fixture's
  trigger visible-but-closed. Both triggers' chrome, and the admin item list, are directly
  screenshot-verified; the regular item list (no Admin entry) is verified via diff review of
  `UserMenu.tsx`'s role gate. Not escalated as a blocking STOP-AND-ASK since it doesn't change the
  primitive's public API or require forking anything — it's a property of the existing, unchanged
  `MantineDropdownMenu`.
- **Mobile bottom-sheet overlap (found + fixed during verification):** the first `screenshots:assert`
  run genuinely FAILED 12 cells with `element-overlap` — opening both dropdowns unconditionally
  meant two independent full-width bottom sheets (fixed, bottom-anchored at `<640`) stacked on top
  of each other, a state no real user can ever reach (only one trigger is ever tapped at a time).
  Fixed by guarding the `play` function with `if (window.innerWidth < 640) return` — mobile
  viewports now show both triggers closed (still proving full-width chrome, no overlap); desktop
  shows the open-dropdown proof described above. Not a harness false-positive — a real story-design
  defect, correctly caught and fixed.

## Positive / Negative flow

- **Positive:** desktop `md+`, logged-in → clicking the trigger opens the menu; Profile/My
  listings/Add listing route via `onNavigate`; Admin dashboard (role admin/moderator only) opens
  `/admin` in a new tab via `onOpenAdmin`; Logout calls `onLogout`. Byte-identical to pre-extraction
  behavior (diff-verified — the item array and trigger markup are unchanged, only parameterized).
- **Negative:** non-admin/moderator users never see the Admin item (role gate unchanged); Logout
  stays `color="red"` (destructive); no direct routing/`window.open` inside the primitive itself —
  verified via `UserMenu.tsx`'s source (both are callback props, called only on the container's
  behalf).

## Verification

- `npx tsc --noEmit` → **0 errors**.
- `npx eslint src/components/layout/UserMenu.tsx src/components/layout/Header.tsx src/stories/mantine/primitives/UserMenu.stories.tsx` → clean, no output.
- `npm run check:stories` → **PASSED**, 114 files checked, 0 violations; `storybook.*` parity 562 keys × 4 locales (up from 560).
- `npm run check:i18n` → **PASSED**, 2141 keys × 4 locales.
- `npm run check:file-integrity` → **PASSED**, 8/8 changed files clean.
- **`npm run build-storybook`** → rebuilt fresh; `storybook-static/index.json` confirms
  `"id":"mantine-primitives-usermenu--default"` (title `Mantine/Primitives/UserMenu`) is indexed.
- **`npm run screenshots:assert -- --mantine-only`** (standing enforced gate):
  - First run: **644 total / 606 pass / 12 FAIL / 26 pre-existing-ambiguous** — all 12 fails were
    `mantine-primitives-usermenu--default` mobile cells, `element-overlap` between the two
    simultaneously-open bottom sheets (see STOP-AND-ASK above). Genuine defect, not allowlisted.
  - After the `window.innerWidth < 640` guard: **644 total / 618 pass / 0 FAIL / 26
    pre-existing-ambiguous** — `UserMenu`'s 16 cells all `verdict:"pass"`; +16 net cells over Task
    577's 628/602/0/26 baseline, zero regression elsewhere.
  - Screenshots manually reviewed: desktop-1024 shows both trigger chrome + the admin dropdown open
    with the correct 5-item order (Profile, My listings, Add listing, Dashboard, Logout) and the
    Dashboard entry's brand-colored icon/label; uk@320 (mandatory stress cell) shows both triggers
    full-width, closed, Ukrainian captions/labels wrap correctly, no clip/h-scroll.

## Rendered matrix (clause 12)

| Breakpoint | sq | en | uk | it |
|---|---|---|---|---|
| 320 | PASS — both closed, full-width, no clip | PASS | PASS (mandatory, screenshot reviewed) | PASS |
| 375 | PASS | PASS | PASS (mandatory) | PASS |
| 390 | PASS | PASS | PASS (mandatory) | PASS |
| 1024 | PASS | PASS (screenshot reviewed — admin dropdown open, correct item order/chrome) | PASS | PASS |

## AC-by-AC self-audit

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `UserMenu.tsx` prop-driven; 6-item order preserved; Admin role-gated + new-tab via `onOpenAdmin`; Logout destructive | ✅ | diff — item array byte-identical to the removed inline builder, parameterized |
| 2 | `Header.tsx` renders `<UserMenu/>` in the `md+` logged-in branch; inline builder/trigger removed | ✅ | diff |
| 3 | `Mantine/Primitives/UserMenu` story, `MantineStoryShell`, single `Default`, regular+admin fixtures, no hook mock, appears in standing `--mantine-only` sweep | ✅ | story file; index.json + manifest confirm auto-discovery, 16/16 pass |
| 4 | Rendered matrix + TailAdmin present; `tsc=0`/lint/`check:stories`/`screenshots:assert` green; file-integrity clean | ✅ | see Verification + Rendered matrix above |

## Self-validation

`tsc --noEmit`=0, `eslint`=clean, `check:stories`=PASS (114 files/0 violations, 562×4 parity),
`check:i18n`=PASS (2141×4), `check:file-integrity`=8/8 clean, fresh `build-storybook`=0 errors,
`screenshots:assert --mantine-only`=644/618/0/26 (+16 new `UserMenu` cells over Task 577's baseline,
all pass after fixing a genuine mobile-overlap defect found during verification, zero regression
elsewhere). Git NOT run by this session (single-writer rule) — Files Changed table above is for the
user/orchestrator to review before committing.

**Verdict: Task 578 is functionally complete and verified by every automated gate available in this
environment**, including standing (not throwaway) `Mantine/Primitives/UserMenu` coverage and a real
mobile-overlap defect caught and fixed during the story's own verification pass.
