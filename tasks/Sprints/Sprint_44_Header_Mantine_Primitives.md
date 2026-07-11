# Sprint 44 — Header / app-shell → Mantine + presentational-primitive decomposition

**Epic:** MM (Mantine/TailAdmin) Phase-2. **Owner decisions (2026-07-11):** decompose the Header into **5 separate
prop-driven presentational primitives** (not one `HeaderView` monolith), **one task per primitive**, each with its
own Mantine story on deterministic fixtures (Presentational-primitive split gate, owner P0 2026-07-10). `Header`
becomes a **thin container** that holds the data/network hooks + side effects and composes the primitives.

## Why (governance)

`Header` is a smart component (`useUser`, `useRouter`, `useLocale`, `setAdminLocale`, `signOut`, the global
`AUTH_SHEET_EVENT` window listener, `useState`). Per the split gate every such surface needs a prop-driven primitive
that stories/tests with fixtures — NO hook mocks, NO `.storybook` alias, NO live Supabase. Decomposing also makes
each surface independently reviewable and lower-risk than one big rewrite.

## Container / presentational boundary

- **Container `Header.tsx`** keeps ONLY: `useUser`, `useRouter`, `useState` (`mobileOpen`/`authOpen`/`authView`),
  `setAdminLocale`, `signOut`, the `AUTH_SHEET_EVENT` listener, the dynamic `NotificationBell` (`ssr:false`) import,
  and builds callback props (`onSwitchLocale`, `onLogout`, `onOpenAuth`, `mobileOpen`+`onMobileOpenChange`). It
  composes the 5 primitives and passes everything via props/slots. Side-effectful children (`AuthSheet`,
  `NotificationBell`) stay in the container or are passed as `ReactNode` slots — never hook-called inside a primitive.
- **Each primitive** is prop-driven (data via props/callbacks) and may use ONLY Storybook-provided context hooks
  (`useTranslations`/`useLocale`). Responsive visibility uses Mantine `visibleFrom`/`hiddenFrom` or a plain wrapper —
  **NOT Tailwind display utilities on Mantine roots** (Task 574 lesson).

## Task breakdown & numbering (dependency order)

| # | Task | Scope | Depends on |
|---|------|-------|-----------|
| **574** | Header overlay migration + hydration fix (IN PROGRESS — correction round 1) | LocaleSwitcher + Header overlays → Mantine; fix SSR-id hydration; flags→abbr. Fixes the responsive-visibility regression. | — |
| **575** | `HeaderActions` primitive | Favorites (Link-as-button) + logged-out login/register buttons → Mantine; `NotificationBell` as a slot; extract prop-driven primitive + Mantine story. **Absorbs the reserved "leftover action buttons" work.** | 574 |
| **576** | `LocaleSwitcher` story + inert-prop cleanup | LocaleSwitcher is already prop-driven (post-574): add its own Mantine story on fixtures; drop the now-inert `align`/`side`/`defaultOpen`; update `AdminLocaleSwitcher.tsx`/story + restore its open-state QA evidence WITHOUT `defaultOpen`. | 574 |
| **577** | `MobileLocaleSwitcher` primitive | Extract the `sm:hidden` `MantineCombobox` locale switcher (Header:182) as a prop-driven primitive (`value`/`onChange`/options) + Mantine story. | 574 |
| **578** | `UserMenu` primitive | Extract the desktop `MantineDropdownMenu` user menu (6-item order, role-gated new-tab Admin, destructive Logout) as a prop-driven primitive (`user`, callbacks) + Mantine story (logged-in regular + admin fixtures). | 574 |
| **579** | `MobileNavDrawer` primitive | Extract the hamburger `MantineDrawer` body (user header, nav links, auth/logout — each closes) as a prop-driven primitive (`user`, `opened`, callbacks) + Mantine story (open, logged-in + logged-out fixtures). | 574 |
| **580** | `Header` thin container | Compose 575–579; container holds hooks/side-effects only; final rendered parity matrix (byte-equivalent to post-574 Header) + split-gate confirmation. | 575–579 |

**Numbering note:** last-used stays 574 until these land; 575–580 reserved by this plan. Backlog `last used` pointer
to be bumped to 580 at the owner's next commit (orchestrator will emit it then — not touched pre-emptively).

## Per-task gates (every primitive task)

- **🔴 Canonical Mantine story location + namespace (OWNER DECISION 2026-07-11 — resolves standing STOP-AND-ASK #A; supersedes any per-task "co-locate" wording).** Every Sprint-44 primitive story is authored EXACTLY like the existing composite-component Mantine stories (`FiltersPanelShell`, `HeroSearch`, `FilterControls`, `PhoneField`): the story file lives in **`src/stories/mantine/primitives/<Name>.stories.tsx`** (NOT co-located in `src/components/**`), its meta `title` is **`Mantine/Primitives/<Name>`**, and its content is wrapped in **`MantineStoryShell`** (`import { MantineStoryShell } from '../_MantineStoryShell'`) with `parameters: { skipCanvas: true, layout: 'fullscreen' }`, a **single `Default`** export (fixture states stacked inside it; toolbar drives locale + viewport — NO `LocaleStress`/per-state/`Ukrainian*` exports, clause 13), and strings via `storyT(locale, 'storybook.mantine.*')`. The COMPONENT stays where it belongs (`src/components/layout/…`); only the STORY location/namespace is fixed. **Why:** only titles matching `Mantine/Primitives/*` are auto-discovered by `discoverMantinePrimitiveStories()` in `scripts/check-stories-rendered.mjs` and get PERMANENT enforced coverage at 320/375/390/1024 × sq/en/uk/it. A `Layout/*`/co-located story falls outside BOTH that sweep AND `ASSERT_STORIES`, so its only proof is a throwaway uncommitted script — which is exactly the Task-575 defect the owner rejected. A co-located `Layout/*` story = TASK FAILURE, route back.
- **Split gate (P0):** primitive prop-driven; story targets it with fixtures; NO data/network hook mock.
- **Mobile <640 full-width (clause 11)** + **TailAdmin (clause 16):** unchanged vs post-574 — proven side-by-side,
  zero style drift, zero invented values; responsive visibility via `visibleFrom`/`hiddenFrom` or plain wrapper.
- **Rendered matrix (clause 12):** 320·375·390·…·2560 × sq/en/uk/it, uk@320/375/390 mandatory, per fixture state;
  machine `screenshots:assert` **via the standing enforced `Mantine/Primitives/*` auto-discovery only** (the story
  MUST appear in the `--mantine-only` sweep — a one-off/throwaway Playwright script is NOT accepted proof, Sprint 33
  rendered-evidence gate); + the Task-574 human-eye cell (exactly one language switcher per breakpoint) where a
  locale surface is in scope.
- **Regression (clause 15):** locale-switch / auth-entry / logout / mobile-nav still route; no console hydration
  `base-ui-_R_` id. **File-integrity (clause 14)** clean. Self-validation + AC table + Files-Changed table.

## Standing STOP-AND-ASK (applies across the sprint)

1. Side-effectful children (`AuthSheet`, dynamic `NotificationBell`, `AUTH_SHEET_EVENT`): container-owned or slot —
   never hook-called inside a primitive. Confirm the slot shape before wiring.
2. Multiple fixture states within the single Mantine `Default` export (proof-path rule) — confirm the canonical way
   (stacked fixtures in one `Default`), never per-state/`Ukrainian*` exports (clause 13).
3. No behavior/style/public-API change "while extracting" — extraction is mechanical; STOP and ASK otherwise.
