# Task 601 — Deterministic, noise-immune proof that the authenticated-header `useId` hydration mismatch is caught

Sprint 44 (Epic MM Phase-2 / Epic RS — Regression Shield). Kickoff:
`tasks/Sprints/Sprint_44_kickoff_prompt_Task_601_HydrationIdParityDeterministicProof.md`
(includes the "🟢 Orchestrator directive (2026-07-15)" section added mid-session after the
STOP-AND-ASK below — not authored by me, already present in the working tree when read back).

## Summary

The kickoff's primary approach — a Playwright script comparing the header LocaleSwitcher/UserMenu
Mantine Menu **target ids** in the raw SSR HTML against the SAME elements' ids in the *settled*
hydrated DOM, run against a real `next build`+`next start` with a captured session — was built,
wired up, and then **empirically proven to be a false-positive generator** by 3 independent native
experiments (not guessed — actually run against the real prod build with the real Task 599
fix/bug). This triggered the kickoff's own STOP-AND-ASK escape hatch. The owner/orchestrator
accepted the finding, rejected closing the task as "undetectable," and authorized a **deterministic
jsdom dual-phase `renderToString`→`hydrateRoot` vitest harness** asserting on React's own
`onRecoverableError` callback instead. That harness was built, its planted-violation proof captured
the EXACT symptom the original Task 599 diagnosis described, and the registry row now flips to ✅.

## Part 1 — the settled-DOM approach and why it failed (native experiments)

### Build

`scripts/check-header-id-parity.mjs` — Playwright `request.get()` (authenticated via the captured
`playwright/.auth/admin-storage-state.json`) for the raw SSR HTML, loaded into a network-blocked
page via `page.setContent()` for pure-static extraction; a separate authenticated `page.goto()` +
settle-wait for the hydrated DOM; `.site-header [aria-haspopup="menu"]` selector — verified against
the real Mantine v8 source shipped in `node_modules` (not guessed):
- `MenuTarget.mjs:56` → renders `Popover.Target` with `popupType:"menu"` (only `Menu`-wrapped
  triggers get `aria-haspopup="menu"`; `HeaderActions`/`NotificationBell*` grep-confirmed zero
  `Menu.Target` usage, only `Popover`s with the default `popupType:"dialog"`).
- `PopoverTarget.mjs:39-44` → clones the child with `id: ctx.getTargetId()`.
- `Popover.mjs:135,228` → `uid = useId(id)`; `getTargetId: () => \`${uid}-target\``.

CI-safe `--verify-gate` self-test (pure comparator + a literal-fixture selector check) passed
first try (5/5 sub-checks). `node --check`, `tsc`=0, `check:file-integrity`, `check:mojibake` all
green on this file from the start.

### Native run 1 — settled-DOM comparison against the FIXED code (current HEAD)

Owner authorized stopping the pre-existing `next dev` server on :3000 (native machine, not a
sandbox) to run a clean `next build` + `next start` (see the AskUserQuestion exchange — owner chose
"stop dev server, build+start prod, run the proof yourself, then restore dev after").

```
npm run build                      # clean prod build, current HEAD (fixed code)
npm run start                      # next start on :3000
HEADER_ID_PARITY_STORAGE_STATE=playwright/.auth/admin-storage-state.json \
  BASE_URL=http://localhost:3000 npm run check:header-id-parity
```

Result: **FAIL** on `/en` — 2 violations:
```
[1] (id-mismatch) [0] "EN" server id="mantine-_R_1aehivbdb_-target" !== client id="mantine-6h4oqvcqo-target"
[2] (id-mismatch) [1] "AGAgrogul" server id="mantine-_R_1auhivbdb_-target" !== client id="mantine-o1t56yc6a-target"
```
(`/uk`/`/sq`/`/it` timed out on `waitUntil:'networkidle'` — root cause: `useNotifications`'s
Supabase Realtime `channel().subscribe()` keeps a long-lived connection open, so the network never
goes idle; a script defect unrelated to the id question, noted for completeness.)

**This FAILed on the FIXED code** — code that Task 599 already verified visually clean at 10
breakpoint×locale combos. That is the first sign this comparison method is not measuring what it
claims to measure.

### Investigation — root cause of the false positive

Read `node_modules/@mantine/hooks/esm/use-id/use-id.mjs`:
```js
function useId(staticId) {
  const reactId = useReactId()
  const [uuid, setUuid] = useState(reactId)      // seeded with reactId — matches SSR on first render
  useIsomorphicEffect(() => { setUuid(randomId()) }, [])  // UNCONDITIONAL post-mount overwrite
  if (typeof staticId === 'string') return staticId
  if (typeof window === 'undefined') return reactId       // true SSR
  return uuid                                    // client: reactId on first render, random after
}
```
Mantine intentionally swaps EVERY Menu-target id to a fresh random value shortly after mount, via
`useIsomorphicEffect` (browser: `useLayoutEffect`) — **unconditionally, on every render, bug or no
bug.** The id present in the SSR HTML (`reactId`, React's own `useId()` format, `_R_…`) never
survives past the first commit in the "settled" DOM read by any tool running after mount. This is
by design, not a bug — but it means a "settled DOM vs SSR HTML" comparison can never reflect the
hydration-time value; it always reflects Mantine's own randomization.

### Native run 2 — replant the bug, rebuild, re-run the SAME probe

Restored the exact pre-fix diff (verified against `git show 7130555486bd`, the Task 599 fix
commit) — throwaway edit, captured, reverted within this session:

```diff
- import { NotificationBell } from '@/modules/notifications/components/NotificationBell'
+ import dynamic from 'next/dynamic'
+ const NotificationBell = dynamic(
+   () => import('@/modules/notifications/components/NotificationBell').then(m => m.NotificationBell),
+   { ssr: false },
+ )
```
```diff
- const { notifications, unreadCount, refetch } = useNotifications()
+ const { notifications, unreadCount, loading, refetch } = useNotifications()
+ if (loading) return null
```

Rebuilt + restarted `next start`, re-ran the same settled-DOM probe on `/en`:
```
server id="mantine-_R_1aehivbdb_-target" (EN)   → client id="mantine-smuqn54qy-target"
server id="mantine-_R_1auhivbdb_-target" (User) → client id="mantine-gg1kh63bw-target"
```
**Identical failure shape to the fixed-code run** — same SSR reactId values (this alone was a
surprise, discussed below), same single-swap-to-random pattern. The settled-DOM approach cannot
distinguish fixed from buggy code: **confirmed empirically, not theorized.**

### Investigation — could a MutationObserver catch the transient pre-swap value?

Hypothesis: intercept the DOM's id-attribute mutation history via `page.addInitScript()` +
`MutationObserver({attributeOldValue:true})`, installed before any page script runs, to see the
value the DOM held immediately after hydration but before Mantine's effect swap.

Ran against BOTH the fixed prod build and the buggy prod build (throwaway probe script, deleted
after use):
```
Fixed code:  1 mutation record per target, oldValue = SSR reactId, currentValue = random swap
Buggy code:  1 mutation record per target, oldValue = SSR reactId, currentValue = random swap
```
**Identical pattern in both cases.** Root cause: browsers coalesce multiple synchronous mutations
to the same attribute on the same node into a single `MutationRecord` (per the MutationObserver
spec) — whatever intermediate "hydration-corrected" value might have existed between the SSR value
and Mantine's final random value is invisible to any observer, because React's hydration-time DOM
patch (if any) and Mantine's `useLayoutEffect` swap both happen synchronously within the same
commit, before any MutationObserver callback can fire and "see" the intermediate state.

### Investigation — direct console-warning capture (diagnostic only, not for the shipped gate)

To understand whether the bug produces ANY observable signal at all, captured `console`/`pageerror`
under `next dev` (clean `.next`, bug replanted, real captured session), 4 consecutive runs
(1 cold-compile + 3 warm):
```
Run 1 (cold .next): zero hydration/console warnings
Run 2: zero
Run 3: zero
Run 4: zero
```
Consistent null result even on the cold-compile run (the exact condition Task 600's own findings
associate with the dev noise floor firing on OTHER routes) — reinforcing that this specific bug
does not reliably surface via console scanning either, in either direction.

### STOP-AND-ASK

Per the kickoff's own hard-contract escape hatch ("If, after investigation, the `dynamic(ssr:false)`
offset cannot be reproduced deterministically by ANY id-parity approach, STOP and ASK the
orchestrator before writing a weaker proof"), reverted the planted violation
(`git status --porcelain -- src/` confirmed clean), restored the dev-server environment to its
original state (killed 2 stray processes left over from the build/restart/dev-diagnostic cycle,
started exactly one clean `npm run dev` on :3000, matching what was running before this session
started), and asked the user how to proceed, presenting the 3 convergent findings above verbatim.

**Owner/orchestrator response (recorded verbatim in the kickoff's new "🟢 Orchestrator directive"
section):** finding accepted; premature-closure option rejected; the settled-DOM approach's failure
correctly attributed to Mantine's randomization + prod warning-stripping, not proof the bug is
undetectable; authorized building a jsdom dual-phase `renderToString`→`hydrateRoot` harness
asserting on `onRecoverableError`, with a mandatory faithfulness check and its own escape hatch (if
the asymmetric tree does NOT trigger `onRecoverableError`, that refutes the Task 599 diagnosis and
must be reported, not papered over).

## Part 2 — the authorized dual-phase harness (AC1′–AC4′, AC5–AC7)

### AC1′ — harness exists, asserts on `onRecoverableError`

`src/components/layout/__tests__/header-hydration-id-parity.test.tsx`. Core:
```ts
const serverHtml = renderToString(<HeaderTreeUnderTest bellPresent={serverBellPresent} />)
const container = document.createElement('div')
container.innerHTML = serverHtml
document.body.appendChild(container)
await act(async () => {
  hydrateRoot(container, <HeaderTreeUnderTest bellPresent={clientBellPresent} />, {
    onRecoverableError: (error) => recoveredErrors.push(String(error?.message ?? error)),
  })
})
```
(`header-hydration-id-parity.test.tsx:157-175`, `runHydrationExperiment`)

`HeaderTreeUnderTest` renders the REAL `HeaderView` (`../HeaderView`, unchanged import) with a REAL
`NotificationBell` passed through `HeaderView`'s own `notificationSlot` prop (Task 590's
presentational-primitive seam) — the EXACT wiring `Header.tsx` itself uses
(`notificationSlot={user ? <NotificationBell /> : undefined}`), toggled by a `bellPresent` boolean.
Wrapped in the real `MantineProvider`+`theme` and `NextIntlClientProvider`+real `en.json` messages.
`useNotifications`'s `createClient()` mocked (hermetic — no real Supabase network/env dependency;
its render-time output, `loading:true`/`notifications:[]`/`unreadCount:0`, is byte-identical to the
real hook's render-time output per Task 599's own SSR-safety audit, so mocking it does not change
the experiment).

### AC2′ — immune to dev noise + prod stripping, by construction

jsdom (vitest's configured `environment: 'jsdom'`), no Next.js server, no Turbopack, no Playwright,
no console-text pattern matching anywhere in the assertion path. `onRecoverableError` is a
first-class `hydrateRoot` option — React invokes it directly on hydration mismatch regardless of
`NODE_ENV`/dev-tooling; it is not subject to production's console-warning stripping (that stripping
only affects the human-readable `console.error` text some default handlers additionally emit, not
the callback invocation itself).

### AC3′ — package.json alias

`"test:header-hydration-id-parity": "vitest run src/components/layout/__tests__/header-hydration-id-parity.test.tsx"`
(`package.json`).

### AC4′ — both directions proven + faithfulness check

**Faithfulness check (mandatory):** `HeaderView`'s child order is LocaleSwitcher → `HeaderActions`
(Favorites ActionIcon, then `{notificationSlot}`, then guest buttons — all in ONE Fragment, no
wrapper element) → `UserMenu` (separate sibling, `hidden md:flex` wrapper div) → hamburger →
`MobileNavDrawer` (`HeaderView.tsx:113-167`). Using `notificationSlot` to toggle the bell inserts/
removes it at that EXACT real position — a sibling within `HeaderActions`'s Fragment, before the
later `UserMenu` sibling — identical to where `Header.tsx`'s real `dynamic(ssr:false)` bell sits.
This is not a synthetic approximation; it is the real production prop seam.

**Asymmetric (bell absent server / present client — the pre-Task-599 shape), 3 sequential runs:**
```
✓ ASYMMETRIC tree → onRecoverableError fires — planted-violation proof   484ms
```
All 3 runs: `recoveredErrors.length > 0`. Captured error text (full transcript, one representative
run — captured via a throwaway diagnostic probe, deleted after use):

**🟠 Orchestrator review follow-up (2026-07-15) — assertion tightened.** Review found the durable
assertion (`expect(recoveredErrors.length).toBeGreaterThan(0)`) passes on ANY recoverable error, not
specifically a hydration mismatch — the target-id evidence lived only in the session-log narrative
above + a deleted throwaway probe, not in CI. Tightened to
`expect(recoveredErrors.some(m => /hydrat/i.test(m))).toBe(true)`
(`header-hydration-id-parity.test.tsx:197`) — asserts the durable test itself proves it caught a
**hydration mismatch** specifically (not the exact `-target` attribute text, which arrives via the
console diff deliberately excluded from the assertion path, and which React could reword across
versions — `/hydrat/i` is the stable level per the review). Re-verified after the change:
```
npm run test:header-hydration-id-parity   → RUN 1: Test Files 1 passed (1) / Tests 3 passed (3)
npm run test:header-hydration-id-parity   → RUN 2: Test Files 1 passed (1) / Tests 3 passed (3)
npm run test:header-hydration-id-parity   → RUN 3: Test Files 1 passed (1) / Tests 3 passed (3)
npx tsc --noEmit                           → 0 errors
npm run check:file-integrity               → PASSED — all 8 file(s) clean
git status --porcelain -- src/             → ?? src/components/layout/__tests__/  (only the test file)
```
No other change made; product code (`src/components/layout/Header.tsx`,
`src/modules/notifications/components/NotificationBell.tsx`) remains untouched.
```
Hydration failed because the server rendered HTML didn't match the client. ...
  <HeaderActions isAuthenticated={true} ...>
    <@mantine/core/ActionIcon>              (Favorites — unaffected, matches)
    <NotificationBell>                       (present client-side, absent server-side)
      <NotificationBellView ...>
        <MantinePopover trigger=<Indicator> ...>
          ...
            <@mantine/core/ActionIcon variant="default" aria-label="Notifications" ...>
              <button
                ...
+               aria-label="Notifications"
-               aria-haspopup="menu"
-               aria-expanded="false"
-               id="mantine-_R_ann_-target"
              >
```
The `-` (server-side, removed on the client) attributes on this button are `aria-haspopup="menu"`,
`aria-expanded="false"`, `id="mantine-_R_ann_-target"` — the exact signature of a Mantine
`Menu.Target` (the `-target` suffix + `aria-haspopup="menu"`), NOT the NotificationBell's own
Popover (which uses `popupType:"dialog"`, confirmed above). This is **direct, independent proof of
the original Task 599 root-cause mechanism**: because the bell is absent server-side, React's
hydration reconciler runs out of server-provided siblings inside `HeaderActions`'s Fragment when the
client tries to insert the bell subtree, and ends up comparing the client's bell button against the
SERVER's `UserMenu` target node (the next real DOM node in tree order) — producing exactly the
`mantine-_R_..._-target` / `aria-haspopup="menu"` mismatch the owner originally observed. The
positional/structural shift theory from Task 599 is confirmed, not merely asserted.

**Symmetric (bell present on BOTH phases — current fixed HEAD shape), 3 sequential runs:**
```
✓ SYMMETRIC tree → onRecoverableError is NEVER called — ≥3/3 stable   184ms
```
All 3 runs: `recoveredErrors` = `[]`.

**Symmetric guest-shaped control (bell absent on BOTH phases), 1 run:**
```
✓ SYMMETRIC control (bell absent on BOTH phases — guest-shaped, sanity check) → onRecoverableError is NEVER called   45ms
```

**Stability — 3 full independent `vitest run` invocations of the whole file** (not just the
in-test loop), all 3/3 tests green each time, zero flakiness:
```
RUN 1: Test Files 1 passed (1) / Tests 3 passed (3)
RUN 2: Test Files 1 passed (1) / Tests 3 passed (3)
RUN 3: Test Files 1 passed (1) / Tests 3 passed (3)
```

`git status --porcelain -- src/` after the whole session (planted violation reverted, throwaway
diagnostic scripts deleted): only the NEW test file shows as untracked — zero modifications to
existing product code:
```
?? src/components/layout/__tests__/
```

### AC5 — registry row flipped

`docs/critical-flow-registry.md` "Authenticated header hydration — NotificationBell SSR shell" row:
leading status `🟡` → `✅`; "Required regression test" / "Command" columns updated to point to
`npm run test:header-hydration-id-parity` as authoritative, with `check:hydration -- --with-admin`
kept as a secondary/supplementary console-error net (not the source of truth for this bug); full
narrative of both the failed settled-DOM attempt and the successful dual-phase harness appended.

### AC6 — gates

```
node --check scripts/check-header-id-parity.mjs       → OK
node -e JSON.parse(package.json)                       → OK
npx tsc --noEmit                                        → 0 errors
npx eslint src/components/layout/__tests__/header-hydration-id-parity.test.tsx → 0 errors
npm run check:file-integrity                            → PASSED, 4 file(s) clean
npm run check:mojibake                                  → 0 artifacts in 1717 files
npm run check:hydration:verify                          → GATE IS FUNCTIONAL (unaffected)
npm run check:hydration:admin-config                    → PASSED (unaffected)
npm run check:hydration:error-page                      → HARDENING IS FUNCTIONAL (unaffected)
npx vitest run src/modules/notifications src/components/layout \
  src/i18n/__tests__/i18n-render-parity.smoke.test.tsx  → 9 files, 37 tests, all passed (no regression)
```
`scripts/` is intentionally eslint-ignored (per Task 600's established note) — the new `.mjs` shows
only that ignore-pattern warning, 0 real errors.

### AC7 — session log / Files Changed / registry / backlog

This file. Table below. `docs/backlog.md` updated (Last Session). No `git add`/`git commit` run —
orchestrator emits at review.

## Positive / Negative flow trace (per the kickoff's own template)

**Positive:** fixed HEAD code, symmetric bell-present tree → `onRecoverableError` never fires, 3/3
stable → row ✅.

**Negative flows:**
- `ssr:false`-shaped asymmetric tree (the actual bug) → `onRecoverableError` fires 3/3, with the
  captured error text independently confirming the original Task 599 symptom (this is the
  planted-violation FAIL proof, clause 15).
- Symmetric guest-shaped tree (bell absent both phases) → never fires — proves the harness isn't a
  blanket "any bell-related render fails" false positive; it specifically requires the asymmetry.
- Escape hatch (not triggered, but exercised as a design constraint): if the asymmetric tree had
  NOT triggered `onRecoverableError`, this session would have stopped and reported a refuted Task
  599 diagnosis rather than shipping a green gate — this did not happen; the diagnosis is confirmed.
- Settled-DOM script (`check-header-id-parity.mjs`): kept, not deleted, re-documented as a narrower
  structural-drift detector — its own `--verify-gate` self-test still proves ITS narrower claim
  (comparator + selector correctness), header comment now explicitly redirects to the vitest test
  for the useId-mismatch bug class and documents why it cannot discriminate that class itself.

## Environment note (native run housekeeping)

Owner authorized (via AskUserQuestion) stopping the pre-existing `next dev` process on :3000 to run
the native `next build`+`next start` proof cycles, on the understanding the environment would be
restored afterward. Restoration performed at the end of Part 1 (before starting Part 2, which needed
no server at all — jsdom only): killed 2 stray Node processes left over from the multiple
build/restart/dev-diagnostic cycles (one on :3000 from an untracked diagnostic `next dev`, one on
:3001 from a port-conflict auto-shift), then started exactly one clean `npm run dev`, confirmed
listening on :3000 (`curl` 307 redirect, matching the original pre-session state).

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `scripts/check-header-id-parity.mjs` | NEW — settled-DOM header Menu-target id comparator; self-test-verified comparator+selector; header comment documents the empirical false-positive finding and redirects to the vitest test for the useId-mismatch bug class | Kept per the orchestrator directive's explicit "may be retired or kept... document the reason" — useful as a narrower structural (target-count) drift detector, not deleted |
| `src/components/layout/__tests__/header-hydration-id-parity.test.tsx` | NEW — deterministic jsdom dual-phase `renderToString`→`hydrateRoot` harness asserting on `onRecoverableError`; renders the real `HeaderView`/`LocaleSwitcher`/`UserMenu`/`NotificationBell` via `HeaderView`'s real `notificationSlot` prop seam | The authorized Task 601 regression gate for the Task 599 `useId` hydration mismatch (AC1′–AC4′) |
| `package.json` | 3 new script aliases: `check:header-id-parity`, `check:header-id-parity:verify`, `test:header-hydration-id-parity` | Wires both the settled-DOM script and the authoritative vitest test (AC3′) |
| `docs/critical-flow-registry.md` | "Authenticated header hydration" row: `🟡`→`✅`; "Required regression test"/"Command" columns repointed to the vitest test as authoritative; full narrative appended | Regression-coverage requirement (agent-contract clause 15); AC5 |
| `docs/backlog.md` | Last Session updated | Session-log discipline |
| `docs/sessions/2026-07-15-task601-header-hydration-id-parity-deterministic-proof.md` | This file | AC7 |

No product-code (`src/components/layout/Header.tsx`, `src/modules/notifications/components/NotificationBell.tsx`)
change in the final diff — the `ssr:false`/`if (loading) return null` replant used to prove the
settled-DOM script's (failed) discrimination attempt was a throwaway edit, captured, and reverted
within this session; `git status --porcelain -- src/` showed only the new test file as untracked,
zero modification to existing files, confirmed both immediately after the revert and again at
session end.

No `git add`/`git commit` run — orchestrator emits explicit-path commits at review time.
