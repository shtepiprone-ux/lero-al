# Sprint 81 — signing out keeps you where you were, and every node the header renders is proven

**Opened:** 2026-09-24 · **Status:** 🟠 **OPEN** · **Landed tasks:** 0 · **Kickoffs filed:** 1 (872) · **Reserved:** 1 (873)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner instruction, 2026-09-23** (verbatim): *"Напиши задачу про виправлення виходу з акаунту."*
> The report came from Task 870's O80-3 check: *"коли я розлогінююсь, то мене перкидає на головну сторінку, а не мало
> б, якщо я знаходжусь на публічній сторінці, наприклад на такій як сторінка оголошення. Це треба виправити."*

## The defect

`src/components/layout/Header.tsx:46-48` handles every header sign-out, both from the desktop `UserMenu` and from the
mobile `MobileNavDrawer`, with `signOut(() => router.push(\`/${locale}\`))`. The target is unconditional, so a guest
who just signed out on a listing page lands on the homepage and loses their place.

Fixing it edits `Header.tsx`, and that triggers GR-1 for the header's render tree. The census for
`src/components/layout/Header.tsx` (run 2026-09-24, 21 nodes) fails on three tier-1 nodes, all baselined debt under
`src/app/[locale]/layout.tsx`: `Header` itself, `NotificationBell` and `CaptchaWidget`. It also lists one tier-2 node
through `AuthSheet`: `src/components/ui/PasswordRequirementsHint.tsx`.

## Owner decisions this sprint carries

| ID | Decision (verbatim) | Date | Effect |
|---|---|---|---|
| **D81-1** | Q: "Як робимо?" (scope of 872 given the census) → *"Разом з обгортками, але треба перевірити які вже є Minetine Stories для Header"* | 2026-09-23 | The wrappers are in scope, and the existing Stories are checked first (done — see D81-2). |
| **D81-2** | Q: "Як робимо з обгортками Header і NotificationBell у задачі 872?" → *"View-stories достатньо (Recommended)"*. The option read: *"Діє правило P0 про обгортки. Header і NotificationBell вважаються покритими вже наявними stories HeaderView і NotificationBellView: без нових stories і без підміни хуків. CaptchaWidget отримує власну story і реєстрацію."* | 2026-09-23 | Resolves the conflict between GR-1 (every tier-1 node needs its own Story) and `docs/component-rules.md` → "Container / Presentational Primitive Split" (owner P0, 2026-07-10: a container Story that mocks hooks is forbidden). A pure container whose entire UI is an enrolled, storied View is proven by that View's Story. It stays in the census as baselined debt, because the census cannot yet recognise the split. Recorded in `docs/golden-rules.md` → GR-1. |

## Why a new sprint — goal fit checked against every open sprint

| Sprint | Its goal | Fits? |
|---|---|---|
| **46** | ListingCard de-Tailwind + overlay exit | No. |
| **55 · 56 · 57** | ARIA semantics / raw enum leaks / deleting unused code | No. |
| **61 · 62** | Projection layer / Tailwind runtime tokens | No. |
| **69 · 71 · 72 · 74** | `/listings`, listing detail, similar listings, card width | No — listing surfaces. |
| **70** | The site chrome leaves Tailwind, and the mobile bar goes away | **Closest, and still no.** The header is site chrome, but 70's goal is a de-Tailwind migration, and 872 changes no styling. `Header.tsx` has 0 `className`. |
| **73** | A sold listing is reachable by link but never listed | No. |
| **77** | The full test suite is red | No. |
| **78** | Admin and agent dashboards | No. |
| **79 · 80** | CMS pages read path / Data API privileges | No. |

## Goal

1. Signing out from the header on a **public** page keeps the visitor on that page, re-rendered as a guest. Signing
   out on a page that needs a session goes to the locale homepage, exactly as today.
2. Which pages need a session is decided in **one** place, and that place is tested against the real guest-redirect
   guards in `src/app/[locale]/**/page.tsx`, so a new protected page cannot silently be treated as public.
3. Every tier-1 node the header renders is enrolled with its own Story, or exempt under D81-2. The tier-2 edge is
   named and filed (873).

## Tasks

> **This table is the single state source for the sprint.**

| # | Title | Priority | QA | Depends on | State |
|---|---|---|---|---|---|
| **872** | Header sign-out stays on public pages: one route classifier with a drift test against the page guards; `CaptchaWidget` gets its own story export and a manifest entry; `Header`/`NotificationBell` exempt under D81-2 | **P2** | **Q4** (Logout is a registered critical flow) | — | 📝 `KICKOFF FILED` 2026-09-24 → [`…Task_872…`](Sprint_81_kickoff_prompt_Task_872_Sign_Out_Stays_On_Public_Pages.md) |
| **873** | `PasswordRequirementsHint` leaves `src/components/ui/`: the Mantine-native hint moves to its canonical design-system home, and its three importers (`AuthSheet`, `ResetPasswordClient`, `CabinetPasswordSection`) follow, so the header, reset-password and cabinet surfaces stop importing a tier-2 path | P3 | Q3 | — | 🔒 **RESERVED** — full text → `docs/backlog-reserved.md` |

## Owner actions this sprint needs

| ID | Action |
|---|---|
| **O81-1** | After 872 is deployed: sign out on a listing page (stays, shows the sign-in prompt), on `/favorites` or `/cabinet` (goes to the homepage), and from the mobile menu (the drawer closes). |
| **O81-2** | 872's `OWNER VISUAL QA REQUIRED` matrix for the new `CaptchaWidget` story export. |

## Exit criteria

1. 872's classifier tests and its drift test pass, and the drift test fails on a planted list omission.
2. `npm run test:auth` and `npm run build` exit 0.
3. O81-1 returns the three observations above.
4. The census for `Header.tsx` fails on no node other than `Header` and `NotificationBell` (D81-2) and the tier-2 edge
   (873).
