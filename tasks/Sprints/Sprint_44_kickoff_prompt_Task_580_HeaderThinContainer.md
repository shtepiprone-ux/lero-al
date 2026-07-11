# Task 580 — `Header` thin-container audit + final parity matrix

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI / container cleanup + verification (NOT a redesign, NO behavior change).
**Depends on:** Tasks 575–579 landed. **Plan + shared gates/STOP-AND-ASK:** `tasks/Sprints/Sprint_44_Header_Mantine_Primitives.md`.

## Why

After 575–579, `Header.tsx` composes the five primitives (`HeaderActions`, `MobileLocaleSwitcher`, `UserMenu`,
`MobileNavDrawer`, `LocaleSwitcher`). This closing task audits that the container is genuinely **thin** — hooks +
side effects + composition only, with NO leftover presentational JSX — and proves end-to-end parity with the
pre-decomposition (post-574) Header across every breakpoint × locale.

## Files in scope

- `src/components/layout/Header.tsx` — final cleanup ONLY: remove any residual inline presentational JSX, dead
  imports, or unused locals left by 575–579; confirm it holds only `useUser`/`useRouter`/`useLocale`/`useState`/
  `setAdminLocale`/`signOut`/the `AUTH_SHEET_EVENT` listener/the dynamic `NotificationBell` + the callback builders,
  and renders the five primitives + `AuthSheet`. No new behavior.

**MUST NOT touch:** the five primitives (frozen after their own tasks), any other file. If a fix is needed inside a
primitive, STOP and ASK — do NOT patch it from the container.

## Current behavior to PRESERVE

100% of the Header behavior (post-574): all locale surfaces, Favorites, bell, desktop user menu (role-gated Admin
new-tab + destructive Logout), mobile drawer, auth sheet, responsive visibility (<640 only the combobox; 640–767
LocaleSwitcher + hamburger; ≥768 user menu, no hamburger). No console hydration `base-ui-_R_` id.

## Deliverable

- A confirmed thin `Header.tsx` (composition only).
- The **final rendered parity matrix** (clause 12): 320·375·390·…·2560 × sq/en/uk/it, uk@320/375/390 mandatory,
  covering every surface OPEN where applicable, PLUS the Task-574 human-eye cell (exactly one language switcher per
  breakpoint) — proving byte-equivalence to the post-574 baseline.
- Split-gate confirmation: every smart surface now has its own prop-driven primitive + fixture story; no data/network
  hook mock anywhere in the Header story set.
- **Canonical-coverage confirmation (owner 2026-07-11):** all five Header primitive stories
  (`HeaderActions`, `MobileLocaleSwitcher`, `UserMenu`, `MobileNavDrawer`, `LocaleSwitcher`) live in
  `src/stories/mantine/primitives/` under `Mantine/Primitives/*` and appear in the standing
  `screenshots:assert --mantine-only` auto-discovery sweep — verified by their presence in the run's
  `Mantine/Primitives/*` story count. **No Header primitive story is `Layout/*`/co-located, and none relies on a
  throwaway one-off render script.**

## Gates + STOP-AND-ASK

Apply the plan's **Per-task gates** + **Standing STOP-AND-ASK**. Task-specific:
- **#A** — if the audit reveals a behavior/style drift introduced by any of 575–579, do NOT fix it here — STOP and
  ASK; the orchestrator routes a follow-up to the owning primitive task.

## Acceptance criteria

1. `Header.tsx` contains no presentational overlay/action JSX beyond composing the five primitives + `AuthSheet`;
   holds hooks/side-effects/callbacks only. *(diff)*
2. Final parity matrix present with real per-cell evidence, incl. exactly-one-language-switcher-per-breakpoint. *(session log)*
3. Split-gate satisfied across the Header surface (all primitives prop-driven + fixture stories, no hook mocks); all
   five primitive stories confirmed in the standing `Mantine/Primitives/*` `--mantine-only` sweep. *(diff + stories)*
4. `tsc=0`/lint/`check:stories`/`screenshots:assert` green; regression (locale/auth/logout/mobile-nav + no hydration id) proven; file-integrity clean. *(transcripts)*
