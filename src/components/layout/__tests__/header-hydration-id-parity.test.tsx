/**
 * Header hydration id-parity — dual-phase `renderToString` → `hydrateRoot` proof (Task 601).
 *
 * WHY THIS EXISTS / METHODOLOGY:
 *
 * Task 601 set out to build a deterministic, dev-noise-immune proof that the Task 599
 * authenticated-header `useId` hydration mismatch (NotificationBell absent server-side via
 * `dynamic(..., {ssr:false})`, present client-side, shifting the `LocaleSwitcher`/`UserMenu`
 * Mantine Menu-target `useId` sequence) is genuinely caught by an automated gate. The kickoff's
 * primary approach — a Playwright-based comparison of the header Menu-target `id` attribute in
 * the raw SSR HTML vs the SAME element's id in the *settled* hydrated DOM
 * (`scripts/check-header-id-parity.mjs`, retained for its self-test-verified comparator +
 * selector logic) was EMPIRICALLY PROVEN to be a false-positive generator, via 3 independent
 * native experiments (see the Task 601 session log for full transcripts):
 *
 *   1. Settled-DOM comparison diverged 100% of the time on BOTH the fixed HEAD code and the
 *      `ssr:false`-replanted buggy code (identical failure shape both ways — not a real signal).
 *   2. A `MutationObserver`-based capture of the full id-attribute-mutation history (attempting
 *      to catch the transient hydration-time value before it gets overwritten) showed an
 *      IDENTICAL single-coalesced-mutation pattern on both fixed and buggy code.
 *   3. Direct console hydration-warning capture under `next dev` with the bug replanted showed
 *      ZERO warnings across 4 consecutive runs (including a cold `.next` cache) — confirming the
 *      dev-mode noise floor Task 600 already documented cuts both ways (false negatives too).
 *
 * Root cause of (1)/(2): Mantine's own `useId` hook
 * (`node_modules/@mantine/hooks/esm/use-id/use-id.mjs`) seeds client state with the
 * SSR-matching `reactId` (`useState(reactId)`), returns it unchanged on the FIRST render (so
 * hydration itself can succeed cleanly), then an unconditional `useIsomorphicEffect` overwrites
 * it with a fresh `randomId()` immediately after mount — on EVERY render, bug or no bug. By the
 * time any external tool (Playwright, a MutationObserver) can read the DOM, that swap has
 * already happened, erasing the only moment (the hydration-defining first commit) where the
 * real signal exists.
 *
 * This test sidesteps all of that by driving React's OWN hydration machinery directly and
 * asserting on the exact callback React itself invokes when it detects and recovers from a
 * hydration mismatch (`onRecoverableError`) — not settled DOM ids, not console text:
 *
 *   - SERVER phase: `renderToString` with the bell ABSENT (`notificationSlot={undefined}`) —
 *     mirrors what `dynamic(..., {ssr:false})` renders server-side.
 *   - CLIENT phase: `hydrateRoot` with the bell PRESENT (`notificationSlot={<NotificationBell/>}`)
 *     — mirrors the client tree once the dynamically-imported module has loaded.
 *   - The bell is inserted via `HeaderView`'s own `notificationSlot` prop — the EXACT real
 *     production wiring (`Header.tsx`: `notificationSlot={user ? <NotificationBell /> : undefined}`)
 *     — not a synthetic approximation of the tree position. `HeaderView` renders it inside
 *     `HeaderActions`, between the Favorites control and the guest login/register buttons,
 *     BEFORE the separate `UserMenu` sibling — the same position the real dynamic-imported bell
 *     occupies. This satisfies the mandatory faithfulness check: the simulated asymmetry sits at
 *     the real tree position, so any `useId` fork-encoding shift it causes on the LATER siblings
 *     (`UserMenu`) matches production.
 *
 * Deterministic, jsdom-only (vitest's configured environment) — no Next.js server, no
 * Turbopack, no Playwright, no console-text pattern matching. Immune to both the dev noise floor
 * (Task 600) and production's warning-stripping (Task 599) by construction: `onRecoverableError`
 * is React's own hydration-mismatch signal, invoked directly by `hydrateRoot` regardless of
 * NODE_ENV or dev-tooling.
 */

import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderToString } from 'react-dom/server'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { theme } from '@/design-system/mantine/theme'
import { HeaderView } from '../HeaderView'
import { NotificationBell } from '@/modules/notifications/components/NotificationBell'

// ── Hermetic useNotifications — no real Supabase network/env dependency ──────
// Render-time output (loading:true, notifications:[], unreadCount:0) is identical to the real
// hook's render-time output (see useNotifications.ts — createClient() is only called inside
// effects, never during render), so this does not change the id-parity experiment; it only
// keeps the test from touching real Supabase config.

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        order: () => ({ limit: () => Promise.resolve({ data: [] }) }),
      }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => {},
  }),
}))

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

function loadMessages(locale: string): Record<string, unknown> {
  const raw = readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf-8')
  return JSON.parse(raw) as Record<string, unknown>
}

const MESSAGES = loadMessages('en')
const noop = () => {}
const TEST_USER = { name: 'Test User', avatar_url: null, role: 'user' }

// React's act() requires this flag outside of a React-Testing-Library render() call
// (react-dom/test-utils normally sets it; this file drives hydrateRoot directly).
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// ── The tree under test ───────────────────────────────────────────────────────
// notificationSlot is HeaderView's real prop seam (Task 590) — toggling it is exactly what
// Header.tsx itself does (`notificationSlot={user ? <NotificationBell /> : undefined}`),
// not a stand-in for it.

function HeaderTreeUnderTest({ bellPresent }: { bellPresent: boolean }) {
  return (
    <NextIntlClientProvider locale="en" messages={MESSAGES}>
      {/* env="test" makes Mantine's Transition components mount synchronously (no rAF/timer),
          the same convention used by MantinePopover.smoke.test.tsx — irrelevant to id
          computation but keeps the tree from needing fake timers. */}
      <MantineProvider theme={theme} env="test">
        <HeaderView
          isAuthenticated
          user={TEST_USER}
          locale="en"
          onOpenAuth={noop}
          onSwitchLocale={noop}
          onNavigate={noop}
          onOpenAdmin={noop}
          onLogout={noop}
          mobileOpen={false}
          onOpenMobile={noop}
          onCloseMobile={noop}
          notificationSlot={bellPresent ? <NotificationBell /> : undefined}
        />
      </MantineProvider>
    </NextIntlClientProvider>
  )
}

// ── Core: run one dual-phase hydration and report whether React recovered an error ───────────

async function runHydrationExperiment({
  serverBellPresent,
  clientBellPresent,
}: {
  serverBellPresent: boolean
  clientBellPresent: boolean
}) {
  const recoveredErrors: string[] = []

  const serverHtml = renderToString(<HeaderTreeUnderTest bellPresent={serverBellPresent} />)

  const container = document.createElement('div')
  container.innerHTML = serverHtml
  document.body.appendChild(container)

  await act(async () => {
    hydrateRoot(container, <HeaderTreeUnderTest bellPresent={clientBellPresent} />, {
      onRecoverableError: (error) => {
        recoveredErrors.push(String((error as Error)?.message ?? error))
      },
    })
  })

  document.body.removeChild(container)

  return { recoveredErrors, finalHtml: container.innerHTML }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Header hydration id-parity — dual-phase onRecoverableError proof (Task 601)', () => {
  describe('desktop (>=640px — Mantine Menu.Target path, matches the real Task 599 bug shape)', () => {
    it('ASYMMETRIC tree (bell absent server / present client, the pre-Task-599 shape) → onRecoverableError fires — planted-violation proof', async () => {
      stubMatchMedia(false)

      // Sequential, not Promise.all: overlapping act() calls are unsupported by React and
      // produce a spurious warning — each hydration must fully settle before the next starts.
      for (let i = 0; i < 3; i++) {
        const { recoveredErrors } = await runHydrationExperiment({
          serverBellPresent: false,
          clientBellPresent: true,
        })
        expect(recoveredErrors.some(m => /hydrat/i.test(m))).toBe(true)
      }
    })

    it('SYMMETRIC tree (bell present on BOTH phases, the current fixed HEAD shape) → onRecoverableError is NEVER called — ≥3/3 stable', async () => {
      stubMatchMedia(false)

      for (let i = 0; i < 3; i++) {
        const { recoveredErrors } = await runHydrationExperiment({
          serverBellPresent: true,
          clientBellPresent: true,
        })
        expect(recoveredErrors).toEqual([])
      }
    })

    it('SYMMETRIC control (bell absent on BOTH phases — guest-shaped, sanity check) → onRecoverableError is NEVER called', async () => {
      stubMatchMedia(false)

      const { recoveredErrors } = await runHydrationExperiment({
        serverBellPresent: false,
        clientBellPresent: false,
      })

      expect(recoveredErrors).toEqual([])
    })
  })
})
