# AC5 — manual sign-out observations

MISSING EVIDENCE.

No documented test-account credentials were found in `.env.local`/`.env.example`/`docs/*.md`, and the executor
has no authorization to create or sign in with a real Supabase account against the connected environment (local or
otherwise) without owner-provided credentials. Per §13.2's own fallback ("If the local environment cannot sign in,
record `MISSING EVIDENCE` and leave AC5 to O81-1"), this observation is deferred to owner step **O81-1** (live-site
manual QA).

What was verified instead, as indirect evidence for the same code path:
- `postSignOut.test.ts`'s classification table (AC1) exercises `resolvePostSignOutPath` for exactly the three
  URLs O81-1 will check: a listing page, `/favorites`, and the mobile-drawer-equivalent public/guarded routes —
  all 25 assertions pass (`11-postSignOut-test.txt`).
- `Header.tsx`'s diff (`AC2`, `08` census unchanged besides the three enrollments) shows `handleLogout` now calls
  `resolvePostSignOutPath(pathname, locale)` and branches to `router.push(target)` or `router.refresh()` exactly as
  specified — no other change to the mobile-drawer wiring (`MobileNavDrawer.tsx` is untouched, out of scope, and
  still calls `onLogout()` then `onClose()` per F1).
- The `router.refresh()` assumption (kickoff §5.1) itself is unverified by this executor for the same reason
  (no live sign-in). O81-1 owns that check too.
