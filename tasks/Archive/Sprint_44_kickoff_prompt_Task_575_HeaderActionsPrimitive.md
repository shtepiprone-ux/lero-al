# Task 575 — `HeaderActions` presentational primitive (Favorites + auth buttons → Mantine)

**Sprint:** 44 (Header → Mantine + presentational split — Epic MM Phase-2). **Executor:** Sonnet 4.6.
**Type:** UI / presentational-primitive extraction + last base-UI `ui/button` migration (NOT a redesign).
**Depends on:** Task 574 landed on HEAD. **Plan + shared gates/STOP-AND-ASK:** `tasks/Sprints/Sprint_44_Header_Mantine_Primitives.md`.
**Sprint ordering:** `Header.tsx` is touched by every Sprint-44 task — execute in number order, rebase on the prior.

> ## 🔴 CORRECTION ROUND — round-1 REJECTED by orchestrator review (2026-07-11)
> Round-1 shipped the story as a **co-located `src/components/layout/HeaderActions.stories.tsx` titled `Layout/HeaderActions`**.
> That title is outside the `Mantine/Primitives/*` prefix, so it is NOT auto-discovered by
> `discoverMantinePrimitiveStories()` in `scripts/check-stories-rendered.mjs` AND was never added to `ASSERT_STORIES`
> — so under `--mantine-only` it got **zero** standing machine coverage, and its only rendered proof was a
> **throwaway, uncommitted Playwright script** (fails the Sprint 33 rendered-evidence gate + clause 12/13). The
> round-1 rationale ("mirrors `AdminLocaleSwitcher`") is wrong: `AdminLocaleSwitcher` DOES have a durable
> `ASSERT_STORIES` entry (`admin-adminlocaleswitcher--default`), whereas this story had none. The canonical pattern —
> owner-decided 2026-07-11 — is the one `FiltersPanelShell`/`HeroSearch`/`FilterControls`/`PhoneField` already use:
> **story in `src/stories/mantine/primitives/`, title `Mantine/Primitives/HeaderActions`, wrapped in `MantineStoryShell`,
> single `Default`.** The COMPONENT `src/components/layout/HeaderActions.tsx` is fine as-is; this round only **relocates
> and rewrites the story** so it lands in the standing enforced gate. **Do not re-touch `HeaderActions.tsx`'s public
> API or `Header.tsx` wiring — those passed review.**

## Why

The Header's standalone action controls — Favorites (Link-as-button for a logged-in user / ghost button that opens
the auth sheet for a guest) and the logged-out desktop **Login / Register** buttons — are the last base-UI
`@/components/ui/button` holdouts in the shell and have no prop-driven primitive. Extract them into a
`HeaderActions` presentational primitive and finish their Mantine migration. **Absorbs the reserved "leftover
action buttons → Mantine" work.**

## Files in scope

- `src/components/layout/HeaderActions.tsx` — the prop-driven primitive (ALREADY LANDED in round-1 and passed review —
  do NOT change its public API; only touch if a story import path requires it, which it should not).
- **DELETE** `src/components/layout/HeaderActions.stories.tsx` — the mis-placed round-1 co-located story.
- `src/stories/mantine/primitives/HeaderActions.stories.tsx` — **NEW canonical Mantine story** (see "Story" below):
  title `Mantine/Primitives/HeaderActions`, `MantineStoryShell`, single `Default`, `import { HeaderActions } from
  '@/components/layout/HeaderActions'`.
- `src/components/layout/Header.tsx` — already consumes `<HeaderActions … />` (round-1, passed review) — do NOT re-touch.

**MUST NOT touch:** `HeaderActions.tsx` public API, `Header.tsx` wiring, `NotificationBell`, `LocaleSwitcher`,
`AuthSheet`, the overlay primitives, routing/auth logic, any other file. The `storybook.mantine.header_actions_*`
i18n keys already exist in all 4 locales — reuse them; add none.

## Current behavior to PRESERVE

- **Favorites (sm+):** logged-in → `<Link href={/${locale}/favorites}>` styled as a ghost icon button, `aria-label`
  `nav.favorites`; logged-out → ghost icon button that calls `openAuthSheet('login')`. Visible `sm+` only.
- **Login / Register (md+, logged-out):** ghost **Login** → `openAuthSheet('login')`; solid **Register** →
  `openAuthSheet('register')`. Visible in the `md:flex` cluster only.
- **NotificationBell (auth only):** currently `{user && <NotificationBell/>}` between the mobile combobox and the
  desktop menu — it has its own hooks + is `dynamic ssr:false`, so it stays container-owned and is handed to
  `HeaderActions` as a `notificationSlot` ReactNode (never hook-called inside the primitive — plan STOP-AND-ASK #1).

## Primitive API (no invention beyond this)

`HeaderActions({ isAuthenticated, favoritesHref, onOpenAuth, notificationSlot }: {
  isAuthenticated: boolean; favoritesHref: string; onOpenAuth: (view: 'login'|'register') => void;
  notificationSlot?: ReactNode })`. Migrate the controls to Mantine `Button`/`ActionIcon` (TailAdmin chrome — no
invented styles). Responsive visibility via Mantine `visibleFrom`/`hiddenFrom` or a plain wrapper — **NOT Tailwind
display utilities on Mantine roots** (Task 574 lesson): Favorites `sm+`, login/register `md+`.

## Story (canonical `Mantine/Primitives/*` pattern — this is the crux of the redo)

Author it EXACTLY like `src/stories/mantine/primitives/FiltersPanelShell.stories.tsx`:

- `meta = { title: 'Mantine/Primitives/HeaderActions', parameters: { skipCanvas: true, layout: 'fullscreen' } }` (no `component` field needed).
- One `Default` export whose `render` reads `context.globals.locale`, builds `t = (k) => storyT(locale, 'storybook.mantine.' + k)`, and returns the two fixture states **stacked inside a single `<MantineStoryShell>`**: Guest (`isAuthenticated={false}`, no slot → Login+Register visible `md+`, Favorites `sm+`) and Authed (`isAuthenticated`, `notificationSlot={<placeholder bell ActionIcon>}`, Favorites links out). Keep the short caption `Text` above each state via the existing `header_actions_guest_caption` / `header_actions_authed_caption` / `header_actions_bell_slot_aria` keys.
- **NO `LocaleStress` export, NO per-state/`Ukrainian*` exports** — the enforced gate drives 320/375/390/1024 × sq/en/uk/it off the single `Default` automatically (clause 13). This is the whole point of the relocation: coverage becomes standing + machine-produced, not a one-off script.
- `HeaderActions` is NOT an overlay primitive (not in `MANTINE_OVERLAY_PRIMITIVES`), so the harness will not auto-click — it renders inline; the captions guarantee `#storybook-root` is never blank at mobile widths where the controls are legitimately hidden.

## Positive / Negative flow

- Favorites (authed) routes to `/favorites`; Favorites (guest) + Login/Register open the auth sheet in the right view.
- Guest: no bell slot. Authed: bell slot present, no login/register. Callbacks fire; no direct routing/auth inside
  the primitive. Dismiss/keyboard behavior unchanged (inherited).

## Gates + STOP-AND-ASK

Apply the plan's **Per-task gates** (incl. the new 🔴 **Canonical Mantine story location + namespace** gate) and
**Standing STOP-AND-ASK** in full. Task-specific:
- **#A — RESOLVED (owner 2026-07-11), no longer an ask:** the story goes in `src/stories/mantine/primitives/` under
  `Mantine/Primitives/HeaderActions` with `MantineStoryShell` — NOT co-located. This is the correction being made.
- **#B** — the `NotificationBell` slot was cleanly resolved in round-1 (container-owned, passed as `notificationSlot`) —
  unchanged this round.

## Acceptance criteria

1. `src/components/layout/HeaderActions.stories.tsx` is **DELETED**; the story now lives at
   `src/stories/mantine/primitives/HeaderActions.stories.tsx` with `title: 'Mantine/Primitives/HeaderActions'` and is
   wrapped in `MantineStoryShell`. *(diff)*
2. Single `Default` export, guest + authed fixtures stacked, strings via `storyT('storybook.mantine.*')`; NO
   `LocaleStress`/per-state export; NO data/network hook mock (placeholder bell only). *(diff)*
3. `HeaderActions.tsx` public API and `Header.tsx` wiring are **unchanged** vs round-1 (verify no diff there beyond
   what round-1 already landed). *(diff)*
4. The story appears in the **standing** `screenshots:assert --mantine-only` sweep (auto-discovered — confirm it is in
   the run's `Mantine/Primitives/*` story count, NOT a separate script) and PASSES 320/375/390/1024 × sq/en/uk/it;
   `tsc=0`/lint/`check:stories`/`check:file-integrity` green. **No throwaway/one-off render script may be cited as
   proof.** *(transcripts)*
