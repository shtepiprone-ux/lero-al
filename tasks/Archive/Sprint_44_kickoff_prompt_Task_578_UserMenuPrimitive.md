# Task 578 — `UserMenu` presentational primitive (desktop user dropdown)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI / presentational-primitive extraction (NOT a redesign, NO behavior change).
**Depends on:** Task 577 landed. **Plan + shared gates/STOP-AND-ASK:** `tasks/Sprints/Sprint_44_Header_Mantine_Primitives.md`.
**Sprint ordering:** touches `Header.tsx` — execute in number order, rebase on the prior.

## Why

The desktop user menu (`md+`, logged-in) — a `MantineDropdownMenu` whose `items` are built inline in `Header.tsx`
(the `userMenuItems` builder ~120–136 + the trigger ~199–213) — is inline and untested. Extract it into a
prop-driven `UserMenu` primitive with fixtures for regular + admin users.

## Files in scope

- `src/components/layout/UserMenu.tsx` — **NEW** prop-driven primitive.
- `src/stories/mantine/primitives/UserMenu.stories.tsx` — **NEW canonical Mantine story** (per the plan's 🔴 Canonical
  Mantine story location gate): title `Mantine/Primitives/UserMenu`, `MantineStoryShell`, single `Default` (regular +
  admin/moderator fixtures stacked), `import { UserMenu } from '@/components/layout/UserMenu'`. **NOT** co-located.
- `src/components/layout/Header.tsx` — consume `<UserMenu … />` in the `user` branch of the `hidden md:flex` cluster;
  remove the inline `userMenuItems` builder + trigger JSX.

**MUST NOT touch:** `MantineDropdownMenu`/`Avatar` (consume as-is), routing/`handleLogout`, any other file.

## Current behavior to PRESERVE (exact)

- **Trigger:** Mantine `Button variant="default"` = Mantine `Avatar` (src `avatar_url`, fallback initials via
  `name`, `color="brand"`, size 28) + truncated `user.name` + `ChevronDown`.
- **Items, in order:** Profile → `/${locale}/cabinet`; My listings → `/${locale}/cabinet?tab=listings`; *(sep)* Add
  listing → `/${locale}/listings/create`; *(sep, ONLY if role `admin`|`moderator`)* **Admin dashboard** → opens
  `/admin` in a **new tab** (`window.open('/admin','_blank','noopener,noreferrer')`), `color="brand"`, medium weight;
  *(sep)* **Logout** → `color="red"` (destructive), calls logout.

## Primitive API

`UserMenu({ user, locale, onNavigate, onOpenAdmin, onLogout }: {
  user: { name: string|null; avatar_url: string|null; role: string };
  locale: string; onNavigate: (path: string) => void; onOpenAdmin: () => void; onLogout: () => void })`.
The primitive builds the role-gated `DropdownMenuItemDef[]` and renders the trigger + `MantineDropdownMenu`.
Navigation items call `onNavigate('/${locale}/…')`; Admin → `onOpenAdmin()`; Logout → `onLogout()`. No `useRouter`,
no `window.open` inside the primitive — those are container callbacks.

## Story fixtures

Single `Default`: regular user (no Admin item) and admin/moderator user (Admin new-tab item present, destructive
Logout) — both menus shown OPEN.

## Gates + STOP-AND-ASK

Apply the plan's **Per-task gates** (incl. the 🔴 Canonical Mantine story location gate — story goes in
`src/stories/mantine/primitives/` under `Mantine/Primitives/UserMenu`, NOT co-located) + **Standing STOP-AND-ASK**.
Task-specific:
- **#A** — new-tab Admin item / current styling must be expressible via `DropdownMenuItemDef` (color, separator,
  onClick). If not, STOP and ASK — do NOT fork `MantineDropdownMenu`.

## Acceptance criteria

1. `UserMenu.tsx` prop-driven; 6-item order preserved; Admin role-gated + new-tab via `onOpenAdmin`; Logout destructive. *(diff)*
2. `Header.tsx` renders `<UserMenu/>` in the `md+` logged-in branch; inline builder/trigger removed. *(diff)*
3. `src/stories/mantine/primitives/UserMenu.stories.tsx` (title `Mantine/Primitives/UserMenu`, `MantineStoryShell`,
   single `Default`) renders regular + admin fixtures OPEN, no hook mock, and appears in the standing `--mantine-only`
   auto-discovery sweep. *(diff + render)*
4. Rendered matrix + TailAdmin present; `tsc=0`/lint/`check:stories`/`screenshots:assert` green; file-integrity clean. *(transcripts)*
