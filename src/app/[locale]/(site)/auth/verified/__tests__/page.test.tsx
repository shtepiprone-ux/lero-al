/**
 * Regression test — /[locale]/auth/verified page component (Task 446)
 *
 * INVARIANT: the page must NEVER render success copy ("use all features") while
 * the session is absent. Any state where resolveSession() returns null and no
 * error param must show the sync-fail guard, not the success state.
 *
 * Planted-violation proof: removing the `if (syncFailed)` branch in page.tsx
 * causes the sync-fail invariant test below to FAIL:
 *   AssertionError: expected html to not include 'verified_title' — but it does
 *   AssertionError: expected html to include 'verified_nosession_body' — but it does not
 *
 * This confirms the guard is load-bearing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'

// ── Module stubs ─────────────────────────────────────────────────────────────

vi.mock('@/lib/auth/server', () => ({
  resolveSession: vi.fn(),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
}))

vi.mock('../VerifiedBridge', () => ({
  VerifiedBridge: () => null,
}))

// next/link renders as <a> for content assertions — sufficient for this test
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement('a', { href, className }, children),
}))

// lucide-react icons — render as spans with data-testid for assertions
vi.mock('lucide-react', () => ({
  CheckCircle2: ({ className }: { className?: string }) =>
    React.createElement('span', { 'data-testid': 'check-circle', className }),
  XCircle: ({ className }: { className?: string }) =>
    React.createElement('span', { 'data-testid': 'x-circle', className }),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

import { resolveSession } from '@/lib/auth/server'
import { getTranslations } from 'next-intl/server'
import type { User } from '@/types/database'

// Identity translator: t('some_key') → 'some_key'
// Cast through unknown to avoid satisfying the full next-intl Translator interface in tests.
const makeT = ((key: string) => key) as unknown as Awaited<ReturnType<typeof getTranslations>>

function mockSession(user: Partial<User> | null) {
  vi.mocked(resolveSession).mockResolvedValue({ user: user as User | null })
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('VerifiedPage — page/auth-state invariant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTranslations).mockResolvedValue(makeT as Awaited<ReturnType<typeof getTranslations>>)
  })

  // ── Success state ────────────────────────────────────────────────────────

  it('session present → renders success copy (verified_title + verified_body)', async () => {
    mockSession({ id: 'user-1' })
    const { default: VerifiedPage } = await import('../page')

    const jsx = await VerifiedPage({
      params: Promise.resolve({ locale: 'uk' }),
      searchParams: Promise.resolve({}),
    })
    const html = renderToStaticMarkup(jsx as React.ReactElement)

    expect(html).toContain('verified_title')
    expect(html).toContain('verified_body')
    expect(html).toContain('verified_browse')
    expect(html).not.toContain('verified_nosession_body')
    expect(html).not.toContain('verified_error_body')
    expect(html).toContain('data-testid="check-circle"')
  })

  // ── CRITICAL INVARIANT ───────────────────────────────────────────────────

  it('INVARIANT: no session + no error param → sync-fail state, NOT success copy', async () => {
    mockSession(null)
    const { default: VerifiedPage } = await import('../page')

    const jsx = await VerifiedPage({
      params: Promise.resolve({ locale: 'uk' }),
      searchParams: Promise.resolve({}),
    })
    const html = renderToStaticMarkup(jsx as React.ReactElement)

    // CRITICAL: page must never say "use all features" while header is guest
    expect(html).not.toContain('verified_title')
    expect(html).not.toContain('verified_body')
    expect(html).not.toContain('verified_browse')
    // Must show sync-fail state with Login CTA
    expect(html).toContain('verified_nosession_body')
    expect(html).toContain('data-testid="x-circle"')
    expect(html).toContain('/uk/auth/login')
  })

  // ── Error state ──────────────────────────────────────────────────────────

  it('error=confirm_failed → error state (not success, not sync-fail)', async () => {
    const { default: VerifiedPage } = await import('../page')

    const jsx = await VerifiedPage({
      params: Promise.resolve({ locale: 'uk' }),
      searchParams: Promise.resolve({ error: 'confirm_failed' }),
    })
    const html = renderToStaticMarkup(jsx as React.ReactElement)

    expect(html).not.toContain('verified_title')
    expect(html).not.toContain('verified_body')
    expect(html).not.toContain('verified_nosession_body')
    expect(html).toContain('verified_error_title')
    expect(html).toContain('verified_error_body')
    expect(html).toContain('data-testid="x-circle"')
    expect(html).toContain('/uk/auth/login')
  })

  it('error=confirm_failed → resolveSession() is NOT called (no unnecessary Supabase round-trip)', async () => {
    const { default: VerifiedPage } = await import('../page')

    await VerifiedPage({
      params: Promise.resolve({ locale: 'uk' }),
      searchParams: Promise.resolve({ error: 'confirm_failed' }),
    })

    expect(vi.mocked(resolveSession)).not.toHaveBeenCalled()
  })

  it('Login CTA href uses the active locale, not a hardcoded fallback', async () => {
    mockSession(null)
    const { default: VerifiedPage } = await import('../page')

    // sq locale
    const jSq = await VerifiedPage({
      params: Promise.resolve({ locale: 'sq' }),
      searchParams: Promise.resolve({}),
    })
    expect(renderToStaticMarkup(jSq as React.ReactElement)).toContain('/sq/auth/login')

    // it locale
    const jIt = await VerifiedPage({
      params: Promise.resolve({ locale: 'it' }),
      searchParams: Promise.resolve({}),
    })
    expect(renderToStaticMarkup(jIt as React.ReactElement)).toContain('/it/auth/login')
  })
})

// ── Planted-violation proof ──────────────────────────────────────────────────
//
// To verify the guard is load-bearing:
//   1. In page.tsx, remove the `if (syncFailed) { return ... }` branch
//      (or swap `syncFailed` to always be false)
//   2. Re-run: the 'INVARIANT: no session + no error param' test FAILS with:
//      AssertionError: expected html to not include 'verified_title' — but it does
//      AssertionError: expected html to include 'verified_nosession_body' — but it does not
//   3. Restore the guard → all tests pass
//
// FAIL transcript (syncFailed branch removed from page.tsx):
//   × INVARIANT: no session + no error param → sync-fail state, NOT success copy
//     AssertionError: expected '<div …>…verified_title…</div>' to not include 'verified_title'
//     verified_title IS rendered because syncFailed guard is absent → falls through to success state
//     → the exact mismatch the owner reported (success copy while header is guest)

describe('planted-violation proof', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTranslations).mockResolvedValue(makeT as Awaited<ReturnType<typeof getTranslations>>)
  })

  it('CONFIRM: syncFailed guard blocks success path when user=null', async () => {
    mockSession(null)
    const { default: VerifiedPage } = await import('../page')
    const jsx = await VerifiedPage({
      params: Promise.resolve({ locale: 'uk' }),
      searchParams: Promise.resolve({}),
    })
    const html = renderToStaticMarkup(jsx as React.ReactElement)

    // If guard is absent, html WOULD contain 'verified_title'.
    // This assertion FAILS on the planted violation (guard removed),
    // PASSES on the real implementation (guard present).
    expect(html).not.toContain('verified_title')
    // Additionally: sync-fail key MUST be present
    expect(html).toContain('verified_nosession_body')
  })
})
