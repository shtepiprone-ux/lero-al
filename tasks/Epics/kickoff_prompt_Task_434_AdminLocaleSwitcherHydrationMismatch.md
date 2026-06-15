# Task 434 — Admin sidebar LocaleSwitcher hydration mismatch (DIAGNOSE → FIX)

> **Type:** UI / hydration / SSR-CSR boundary bug. **Owner-reported console error (2026-06-15).**
> Separate from Task 432 (clear-history toast), Task 433 (globals.css/Tailwind), Task 435 (report submit).
> **Supersedes the earlier vague "whitespace hydration in AdminTable.tsx" framing** — the real error is a
> Base-UI `DropdownMenu` auto-`id` mismatch on the admin `LocaleSwitcher` trigger, NOT AdminTable whitespace.

## The actual error (verbatim, owner-supplied)

```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
...
<LocaleSwitcher onSwitch={…} isPending={false} showLabel={true} align="start" …>
  <DropdownMenu defaultOpen={undefined}>
    …<DropdownMenuTrigger …>
      <button … aria-haspopup="menu"
+        id="base-ui-_R_eelitmlb_"
-        id="base-ui-_R_1pqmitmlb_"
        data-slot="dropdown-menu-trigger" … >
  at AdminLayout (src/app/admin/layout.tsx:61:7)
Next.js 15.5.18 (Turbopack)
```

Only the auto-generated `id` differs (server vs client). `id="base-ui-_R_…_"` = Base UI prefix +
**React 19 `useId()`**. A `useId` value mismatch means the React tree (number of `useId`-consuming
nodes, or subtree shape) **diverges between SSR and first client render somewhere at or above
`AdminLocaleSwitcher`** in `AdminShell` → `SidebarContent`. Env: `@base-ui/react ^1.4.0`, `react 19.2.4`,
`next 15.5.18` (Turbopack).

## Pre-read (rule-index → UI/layout task + SSR boundary)

- `docs/agent-contract.md` + `docs/backlog.md` (always)
- `docs/ui-rules.md`, `docs/component-rules.md`, `docs/qa-rules.md`
- `docs/state-authority.md` (SSR vs client authority — central to this bug)
- `docs/dependencies.md` (**only if** the fix turns out to be a Base-UI version bump)

## Orchestrator-traced facts (start here — do not re-derive)

- `src/app/admin/layout.tsx` (server component) resolves locale from the `admin-locale` cookie, gates on
  auth/role, then renders `<NextIntlClientProvider><AdminShell …><Toaster/></NextIntlClientProvider>`.
- `src/components/admin/AdminLocaleSwitcher.tsx` and `src/components/shared/LocaleSwitcher.tsx` are both
  `'use client'` and contain **no** `Date.now()/Math.random()/typeof window` branch — they are
  deterministic given `useLocale()`/`useTranslations()`. So the divergence is NOT inside the switcher
  itself; it is an **ancestor** that renders differently SSR vs CSR (offsetting the `useId` counter), OR
  an external DOM mutation before hydration.
- Candidate ancestors to inspect for SSR/CSR divergence: `src/components/admin/AdminShell.tsx` and its
  `SidebarContent` (collapsed/expanded state from a cookie/localStorage? client-only active-nav? a
  client-only conditional that adds/removes a node?), the `Toaster`, and any client-only overlay
  (`src/components/shared/WebVitalsReporter.tsx` — the perf HUD visible in the owner's screenshots).

## Diagnose (ordered, do NOT fix until the divergence is named)

1. **Rule out external DOM mutation FIRST (cheapest):** reproduce in a **clean incognito window with all
   browser extensions disabled** and with any dev/perf HUD overlay off. If the mismatch disappears, the
   cause is an extension/overlay injecting DOM before React hydrates — document that and STOP (no product
   fix needed; note it for the owner). If it persists in clean incognito, it is a real app-tree divergence
   → continue.
2. **Locate the divergent ancestor:** identify which node between `AdminShell`/`SidebarContent` and
   `AdminLocaleSwitcher` renders a different subtree on the server's HTML vs the first client render
   (a client-only conditional, a cookie/localStorage-derived collapsed state, a `mounted` flag pattern,
   suspense boundary, or invalid HTML nesting the browser auto-corrects). Capture the exact file:line.
3. **Check Base-UI:** confirm whether `@base-ui/react ^1.4.0` resolves to a version with a known SSR
   `useId`/id-stability fix available WITHIN the `^1.4` range (changelog) — record the resolved version
   from `package-lock.json` and whether a patch bump addresses it. Do NOT bump outside the kickoff's
   authorization; report the finding.
4. **Classify the single root cause** (external-overlay / divergent-ancestor / base-ui-version / invalid-nesting)
   with file:line + evidence.

## Fix (only the classified cause; minimal change)

- **Divergent ancestor:** make the ancestor render the SAME tree on server and client (e.g. read the
  collapse state so the server markup matches, or gate the client-only node behind a stable wrapper that
  does not shift `useId` for siblings). Do NOT "fix" by suppressing hydration warnings broadly.
- `suppressHydrationWarning` is NOT an acceptable fix for a real tree divergence — only acceptable on a
  genuinely unavoidable single attribute, and must be justified in the session log.
- **Base-UI version:** if a patch within `^1.4` fixes it, bump per `docs/dependencies.md` and re-verify.
- Preserve the switcher's behavior, all 4 locales, and the mobile <640 full-width bottom-sheet gate for
  the dropdown (agent-contract clause 11) — verify the dropdown still renders correctly after the fix.

## Positive flow

Admin loads `/admin` → sidebar renders server-side → hydrates with **no** console hydration warning →
LocaleSwitcher opens, switching locale calls `setAdminLocale` + `router.refresh()` and updates the UI.

## Negative flow

- Mismatch caused by extension/overlay (step 1) → documented, no product change.
- Locale cookie missing/invalid → `resolveLocale` falls back to `en`; server and client must agree on the
  fallback (verify no divergence from the fallback path).
- Switch while `isPending` → guarded (no double-submit); confirm still works post-fix.

## Acceptance criteria

- AC1 — Mismatch reproduced and step-1 extension/overlay rule-out performed (incognito result recorded).
- AC2 — Single root cause classified with file:line evidence (or documented as external-overlay, no fix).
- AC3 — If app-tree cause: fix makes SSR and CSR markup match; **console shows zero hydration warnings**
  on `/admin` load (rendered evidence in the session log, all 4 locales).
- AC4 — LocaleSwitcher behavior + 4 locales + mobile <640 dropdown bottom-sheet preserved (verified).
- AC5 — `npx tsc --noEmit` = 0; no scope creep; "Files Changed" table; file-integrity green.
