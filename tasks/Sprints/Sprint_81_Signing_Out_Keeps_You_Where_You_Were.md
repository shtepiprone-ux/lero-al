# Sprint 81 — signing out keeps you where you were, and every node the header renders is proven

**Opened:** 2026-09-24 · **Status:** 🟠 **OPEN** · **Landed tasks:** 3 (872, 873, 876) · **Kickoffs filed:** 0 · **Reserved:** 2 (874, 875)

> **These counts drift.** Re-derive them from the Tasks table below, never from this line.

> **Opened by owner instruction, 2026-09-23** (verbatim): *"Напиши задачу про виправлення виходу з акаунту."*
> The report came from Task 870's O80-3 check: *"коли я розлогінююсь, то мене перкидає на головну сторінку, а не мало
> б, якщо я знаходжусь на публічній сторінці, наприклад на такій як сторінка оголошення. Це треба виправити."*

## The defect

`src/components/layout/Header.tsx:46-48` handles every header sign-out, both from the desktop `UserMenu` and from the
mobile `MobileNavDrawer`, with `signOut(() => router.push(\`/${locale}\`))`. The target is unconditional, so a guest
who just signed out on a listing page lands on the homepage and loses their place.

Fixing it edits `Header.tsx`, and that triggers GR-1 for the header's render tree. The census for
`src/components/layout/Header.tsx` (run 2026-09-24, 21 nodes) fails on **five** tier-1 nodes, all baselined debt:
`Header` itself, `NotificationBell`, `CaptchaWidget`, `LocaleSwitcher` and `PhoneField`. It also lists one tier-2
node through `AuthSheet`: `src/components/ui/PasswordRequirementsHint.tsx`.

*Correction, 2026-09-24:* the first version of this plan said "three". The orchestrator had truncated the census
transcript at 60 lines, and 872's executor caught the difference at I0 (872 kickoff §16).

## Owner decisions this sprint carries

| ID | Decision (verbatim) | Date | Effect |
|---|---|---|---|
| **D81-1** | Q: "Як робимо?" (scope of 872 given the census) → *"Разом з обгортками, але треба перевірити які вже є Minetine Stories для Header"* | 2026-09-23 | The wrappers are in scope, and the existing Stories are checked first (done — see D81-2). |
| **D81-2** | Q: "Як робимо з обгортками Header і NotificationBell у задачі 872?" → *"View-stories достатньо (Recommended)"*. The option read: *"Діє правило P0 про обгортки. Header і NotificationBell вважаються покритими вже наявними stories HeaderView і NotificationBellView: без нових stories і без підміни хуків. CaptchaWidget отримує власну story і реєстрацію."* | 2026-09-23 | *(D81-3 below.)* Resolves the conflict between GR-1 (every tier-1 node needs its own Story) and `docs/component-rules.md` → "Container / Presentational Primitive Split" (owner P0, 2026-07-10: a container Story that mocks hooks is forbidden). A pure container whose entire UI is an enrolled, storied View is proven by that View's Story. It stays in the census as baselined debt, because the census cannot yet recognise the split. Recorded in `docs/golden-rules.md` → GR-1. |

| **D81-3** | Q: "Який обсяг у задачі 873?" → *"Вся форма пароля (Recommended)"*. The option read: *"873 переносить підказку, замінює старий PasswordInput на Mantine і мігрує обидві форми зміни пароля (ResetPasswordClient і CabinetPasswordSection) з власними stories. PhoneField просто додається в manifest."* | 2026-09-24 | 873 covers the whole password-form family, not only the hint. The `PhoneField` enrolment later moved to 872 (amendment 1), because 872 runs first and its census already fails on it. |
| **D81-4** | Q: "How does GR-1 apply to AuthContext (a non-visual provider) in 876?" → *"Обираю 1 — non-visual provider."* Record, verbatim: *"AuthContext / AuthProvider є non-visual state provider: він рендерить лише Context.Provider та children, не створює DOM/UI, має 0 className і не імпортує legacy UI primitives. Зміна лише його state/command contract не розширює GR‑1 на весь src/app/[locale]/layout.tsx. Він не отримує Story або manifest entry; baseline entry layout лишається. GR‑1 застосовується до кожного візуального consumer-а, який показує цей стан; його canonical View Story має перевіряти pending UI. Виняток не поширюється на provider, який сам рендерить будь-який UI."* Also: *"pending-вигляд треба додати до наявної canonical Story HeaderView, без нової Story для Header чи AuthProvider"*; *"доречний useTransition у provider і явний isSigningOut для Header"*; *"клієнтський pending-стан не може бути security boundary"*. | 2026-09-24 | 876's census is the Header tree; `AuthContext` gets no Story or manifest entry. Written into `docs/golden-rules.md` GR-1 as the non-visual provider exemption. |
| **D81-5** | Q (873 review 1): keep or drop the cabinet new-password → requirements-hint link that Mantine `PasswordInput` now overwrites? → *"Обираю 1 — зберегти зв’язок."* The full verbatim answer is in the 873 kickoff §16.0. It covers the hint as the Mantine `description`, `inputWrapperOrder` below the field, no manual id, and an AC5 judged on the DOM. It applies to the cabinet only, and the server-side policy check stays mandatory. | 2026-09-24 | 873 R5/AC5 amended (kickoff §16.3); rated **P0** accessibility by the owner. |

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
| **872** | Header sign-out stays on public pages: one route classifier with a drift test against the page guards; `CaptchaWidget` gets its own story export and a manifest entry; `Header`/`NotificationBell` exempt under D81-2 | **P2** | **Q4** (Logout is a registered critical flow) | — | ✅ `APPROVED WITH NOTES` 2026-09-24, review 3 (I0 stop → amendments 1–2 → re-entry at §17). The owner confirmed AC5 locally (listing page stays, `/favorites` → home, mobile menu closes); O81-2 found the Turnstile widget English in every locale, a pre-existing defect filed as **875** → [`…Task_872…`](Sprint_81_kickoff_prompt_Task_872_Sign_Out_Stays_On_Public_Pages.md) |
| **873** | The password-form family on canonical Mantine: `PasswordRequirementsHint` moves to `patterns/` and the duplicate rows in `Mantine/Primitives/PasswordInput` go; `ResetPasswordClient` and `CabinetPasswordSection` split into container + View on native Mantine `PasswordInput`/`Alert`/`Button` (per `AuthSheet`); the auth card is extracted from `MantineAuthFormPattern` | **P2** | **Q4** | 872 | ✅ `APPROVED WITH NOTES` 2026-09-24, review 5 (reviews 1–4: NEEDS REVISION → PARTIALLY VERIFIED → NEEDS REVISION on the one O81-3 Story → PARTIALLY VERIFIED). The owner accepted the O81-3 Storybook matrix; the live reset + cabinet change after deploy stays open as O81-3 → [`…Task_873…`](Sprint_81_kickoff_prompt_Task_873_Password_Form_Family_On_Mantine.md) |
| **874** | The last `ui/PasswordInput` consumer (`AdminExchangeProvidersManager`) moves to Mantine, then the legacy file and its Story are deleted | P3 | Q3 | 873 | 🔒 **RESERVED** — full text → `docs/backlog-reserved.md` |
| **876** | Sign-out is one visible step: `AuthProvider` exposes `isSigningOut` (`useTransition`, navigation re-wrapped after `await`); `Header` holds its signed-in layout until the new page arrives; the `UserMenu` trigger and the mobile hamburger show Mantine `loading` (owner measurement 2026-09-24: logout 97 ms + refresh 439 ms, header flipped ~0.5 s before the card) | **P2** | **Q4** | 872 | ✅ `APPROVED` 2026-09-24, review 3 (review 1 PARTIALLY VERIFIED on the plant transcripts, review 2 PARTIALLY VERIFIED on O81-5); the owner accepted O81-4 and O81-5 → [`…Task_876…`](Sprint_81_kickoff_prompt_Task_876_Sign_Out_Is_One_Visible_Step.md) |
| **875** | The Turnstile captcha follows the app locale: `CaptchaWidget` passes `useLocale()` to Turnstile's native `options.language` (filed 2026-09-24 by 872's O81-2 review) | P3 | Q2 | — | 🔒 **RESERVED** — full text → `docs/backlog-reserved.md` |

## Owner actions this sprint needs

| ID | Action |
|---|---|
| **O81-1** | ✅ Done locally 2026-09-24 (owner, before approval); repeat on the live site after deploy. After 872 is deployed: sign out on a listing page (stays, shows the sign-in prompt), on `/favorites` or `/cabinet` (goes to the homepage), and from the mobile menu (the drawer closes). |
| **O81-2** | ✅ Reviewed 2026-09-24 — all 8 tuples show the Turnstile widget in English regardless of locale: pre-existing, filed as **875**. |
| **O81-4** | ✅ **Accepted by the owner 2026-09-24**, all 12 tuples (*"все ок"*). 876's `OWNER VISUAL QA REQUIRED` matrix: `UserMenu` → `SigningOut` × 4 locales × 1440, `HeaderView` → `SigningOut` × 4 locales × 320/1440 (12 tuples). |
| **O81-5** | ✅ **Confirmed by the owner 2026-09-24**, all three observations (*"По кожному пункту все ок"*). Before 876's approval (local or live): sign out on a listing page (loader, then the header and the card switch together), on `/favorites` (loader, then a guest homepage), and at 390px from the drawer (the drawer closes, hamburger loader, then the switch). |
| **O81-3** | ✅ Storybook matrix accepted 2026-09-24 (after the §17 Story fix). **Still owed after deploy:** one real password reset and one cabinet password change. 873's `OWNER VISUAL QA REQUIRED` matrix (ResetPasswordView, CabinetPasswordSectionView, PasswordInput hint states, AuthFormPattern + AuthCard). After deploy, complete one real password reset and one cabinet password change. Note: the green/red ring around the new-password field goes, matching the canonical `AuthSheet` registration form. |

## Exit criteria

1. 872's classifier tests and its drift test pass, and the drift test fails on a planted list omission.
2. `npm run test:auth` and `npm run build` exit 0.
3. O81-1 returns the three observations above.
4. The census for `Header.tsx` fails on no node other than `Header` and `NotificationBell` (D81-2) and the tier-2 edge
   (873).
5. 876: the header and the page switch together after sign-out, and the sign-out control shows a pending state
   until then (O81-5).
