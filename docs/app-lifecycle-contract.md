# App Lifecycle Contract

This document defines mandatory architectural rules for the application.
Any code that violates these rules is considered invalid, even if it appears to work.

---

## 1. SSR Rule (Server-Side Rendering Constraints)

In this product, SSR is allowed **only** for public, non-interactive, and SEO-significant parts of the interface where the server-rendered HTML is deterministic, stable, and guaranteed not to change before hydration.

SSR **MUST NOT** be used for any screens or components that include:
- forms,
- input, textarea, select, combobox, range inputs,
- password or email fields,
- modal dialogs containing forms,
- controlled components,
- UI built on Radix, Base UI, shadcn, or similar libraries,
- logic dependent on browser-only state or APIs.

This rule is **mandatory** for:
- admin panel screens,
- internal user cabinets,
- authentication and registration flows,
- create/edit forms for any entities,
- any UI without direct SEO value.

For these cases, **only client-only rendering is permitted**:
- the server component may act solely as a layout or shell,
- no HTML for forms or inputs may be generated on the server,
- no hydration of form-related UI is allowed.

The following are **strictly forbidden**:
- SSR or hydration of forms or inputs,
- usage of `suppressHydrationWarning` to mask mismatches,
- conditional rendering using `typeof window !== 'undefined'` in JSX.

SSR is permitted only for:
- landing pages,
- public listing pages without interactive forms,
- SEO text blocks,
- static headers, breadcrumbs, and content sections.

All other cases are considered **client-only by default**.

---

## 2. Routing Rule (404 and Navigation Integrity)

Any page resulting from a routing error (404 / not-found) must behave strictly as a **temporary navigation state** and must never be treated as a terminal route.

A 404 page **MUST NOT**:
- break the browser history stack,
- modify or invalidate global router state,
- affect subsequent navigation behavior,
- cache or lock the previous route.

Pressing the browser Back button after visiting a 404 page **MUST ALWAYS**:
- return the user to the previous route,
- fully restore the page content,
- correctly re-run data fetching,
- correctly remount client components if required,
- not require a manual page refresh.

The following approaches are **architecturally forbidden**:
- `window.location.reload`
- forced redirects after 404
- `history.replaceState` or similar history manipulation
- browser-level or router-level hacks to “fix” navigation

Error boundaries, not-found boundaries, and redirect logic **must not**:
- lock the routing chain,
- block remounting of the previous page,
- leave the application in a partial, empty, or inconsistent state.

Navigation must remain deterministic, reversible, and fully controlled by the router.

---

## 3. Resume Rule (Background / Sleep / Inactivity Recovery)

After browser inactivity, backgrounding, tab suspension, or system sleep:
- application content must fully restore,
- no empty screens or frozen UI states are allowed,
- no indefinitely stuck loading states are allowed,
- no manual page reload may be required.

If state or data becomes stale or invalid during inactivity:
- the application must explicitly re-fetch required data,
- not assume previous client state is valid.

The following are **strictly forbidden**:
- forced reload on focus,
- automatic refresh on visibility change,
- timer-based “wake up” mechanisms,
- masking the issue with fallback UI.

Resume behavior must be systemic and consistent across:
- SSR pages,
- client-only pages,
- form screens,
- list-based views.

---

## 4. Merge Criteria

A pull request **MUST NOT** be merged if it violates any rule defined in this contract.

Rule compliance is mandatory regardless of whether the implementation
appears to function correctly.

## 5. Auth Session Recovery Contract

- Authentication recovery must be handled through centralized lifecycle management.
- Invalid, expired, or missing refresh tokens must trigger deterministic auth recovery.
- Only auth-related cookies, storage entries, and caches may be cleared during recovery.
- Global browser cookie clearing is forbidden.
- Forced page reloads must not be used to recover auth state.
- Session recovery must preserve router consistency and application lifecycle integrity.
- Client and server auth state must converge to a single deterministic source of truth after resume, reconnect, or server restart.
- Invalid auth state must never leave the application in partially authenticated, frozen, or inconsistent UI states.
- Auth recovery logic must work consistently for:
  - browser refresh;
  - tab restore;
  - browser sleep/wake;
  - development server restart;
  - expired sessions;
  - invalid refresh tokens.