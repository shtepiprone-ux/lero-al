# Task 579 — `MobileNavDrawer` presentational primitive (hamburger drawer body)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI / presentational-primitive extraction (NOT a redesign, NO behavior change).
**Depends on:** Task 578 landed. **Plan + shared gates/STOP-AND-ASK:** `tasks/Sprints/Sprint_44_Header_Mantine_Primitives.md`.
**Sprint ordering:** touches `Header.tsx` — execute in number order, rebase on the prior.

## Why

The mobile hamburger drawer (`MantineDrawer` + body, `Header.tsx` ~239–332) — user header, nav links, auth buttons,
logout — is inline. Extract it into a controlled prop-driven `MobileNavDrawer` primitive with fixtures for
logged-in + logged-out.

## Files in scope

- `src/components/layout/MobileNavDrawer.tsx` — **NEW** prop-driven primitive (controlled `MantineDrawer` + body).
- `src/stories/mantine/primitives/MobileNavDrawer.stories.tsx` — **NEW canonical Mantine story** (per the plan's 🔴
  Canonical Mantine story location gate): title `Mantine/Primitives/MobileNavDrawer`, `MantineStoryShell`, single
  `Default` (open × logged-in and open × logged-out fixtures). **NOT** co-located. **Render the drawer `opened`
  directly** (like `FiltersPanelShell.stories.tsx`): the harness's `MANTINE_OVERLAY_PRIMITIVES` open-trigger set keys
  off the title suffix and does NOT include `MobileNavDrawer`, so it will not auto-click — the sheet must already be
  open for capture. `import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer'`.
- `src/components/layout/Header.tsx` — consume `<MobileNavDrawer opened={mobileOpen} onClose={…} … />`; the hamburger
  `ActionIcon` trigger stays in the container (sets `mobileOpen=true`) — the primitive is controlled and supplies no
  trigger (STOP-AND-ASK #A if the trigger should move in).

**MUST NOT touch:** `MantineDrawer` (consume as-is), `NavLinks` (module-level — keep at module scope), routing/auth
logic, any other file.

## Current behavior to PRESERVE (exact)

- Right-side drawer, `size="xs"`. Body: optional user header (Avatar size 40 + name) when logged-in; nav links
  (`NavLinks` = Home, Listings; + when logged-in: Profile, My listings, Favorites, Add listing) — **each closes the
  drawer on click**; logged-out: Login / Register / Register-as-agent (each closes drawer + opens the AuthSheet in
  the right view); logged-in: a destructive Logout (closes drawer + logs out). Every action sets `mobileOpen=false`.

## Primitive API

`MobileNavDrawer({ opened, onClose, user, locale, onNavigate, onOpenAuth, onLogout }: {
  opened: boolean; onClose: () => void; user: { name: string|null; avatar_url: string|null } | null; locale: string;
  onNavigate: (path: string) => void; onOpenAuth: (view: 'login'|'register'|'register-agent') => void;
  onLogout: () => void })`. Nav entries stay `<Link>` but keep `onClick` that calls `onClose()` (+ `onNavigate` if
  the container needs it); auth/logout call the callbacks then `onClose()`. No `useRouter`/`signOut`/`window.*`
  inside the primitive.

## Story fixtures

Single `Default`: drawer OPEN × logged-in (user header + full nav + logout) and OPEN × logged-out (nav + auth buttons).

## Gates + STOP-AND-ASK

Apply the plan's **Per-task gates** (incl. the 🔴 Canonical Mantine story location gate — story goes in
`src/stories/mantine/primitives/` under `Mantine/Primitives/MobileNavDrawer`, rendered `opened`, NOT co-located) +
**Standing STOP-AND-ASK**. Task-specific:
- **#A** — keep the hamburger trigger in the container vs move it into the primitive. Default: container-owned
  (controlled drawer). Confirm before moving.

## Acceptance criteria

1. `MobileNavDrawer.tsx` prop-driven controlled drawer; every nav/auth/logout action closes the drawer + fires its callback. *(diff)*
2. `Header.tsx` renders `<MobileNavDrawer/>`; hamburger trigger preserved; inline drawer body removed. *(diff)*
3. `src/stories/mantine/primitives/MobileNavDrawer.stories.tsx` (title `Mantine/Primitives/MobileNavDrawer`,
   `MantineStoryShell`, single `Default`, drawer rendered `opened`) renders open logged-in + logged-out fixtures, no
   hook mock, and appears in the standing `--mantine-only` auto-discovery sweep. *(diff + render)*
4. Rendered matrix (<640 full-width bottom sheet) + TailAdmin present; `tsc=0`/lint/`check:stories`/`screenshots:assert` green; file-integrity clean. *(transcripts)*
