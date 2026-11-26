// @vitest-environment node
/**
 * Task 988 AC4 (owner decision O988-3): a new Google account keeps the language of the page it signed up on. Google sends no sign-up metadata, so the sign-up trigger
 * stores `'sq'`; the success path of the Google button (`completeGoogleSignIn`, the one completion of every Google sign-in) writes the account language with the page
 * language before it resolves, and every caller navigates only after it resolved. The write is the header's `setAccountLocale(locale)`, handed in as a callback
 * (`src/modules/auth` may not import the admin module: eslint.config.mjs MODULE_LAYERS).
 *  - a new account (Supabase's `last_sign_in_at` written by the same sign-in that created it, `created_at`): the write, awaited;
 *  - an existing account: no write; a refused sign-in: no write; a failed write never blocks the sign-in.
 * The Supabase browser client, the remembered-account store and the action are doubles; every value is synthetic.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  user: { id: 'u-synth', created_at: '2026-11-26T10:00:00.000000Z', last_sign_in_at: '2026-11-26T10:00:00.120000Z' } as Record<string, unknown> | null,
  error: null as null | { message: string },
  order: [] as string[],
  release: null as null | (() => void),
  actionFails: false,
}))
vi.mock('@/lib/auth/browser', () => ({
  signInWithGoogleIdToken: async () => ({ data: { user: state.user, session: state.user ? {} : null }, error: state.error }),
}))
vi.mock('@/lib/auth/rememberedGoogleAccount', () => ({ rememberedAccountFromCredential: () => null, saveRememberedGoogleAccount: () => undefined }))
vi.mock('@/modules/admin/actions/locale', () => ({
  setAccountLocale: (locale: string) => {
    state.order.push(`setAccountLocale:${locale}`)
    if (state.actionFails) return Promise.reject(new Error('network'))
    return new Promise<boolean>((resolve) => { state.release = () => { state.order.push('setAccountLocale:done'); resolve(true) } })
  },
}))

import { completeGoogleSignIn } from '@/modules/auth/lib/googleSignIn'
import { setAccountLocale } from '@/modules/admin/actions/locale'

beforeEach(() => {
  state.user = { id: 'u-synth', created_at: '2026-11-26T10:00:00.000000Z', last_sign_in_at: '2026-11-26T10:00:00.120000Z' }
  state.error = null
  state.order = []
  state.release = null
  state.actionFails = false
})

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('Google sign-in language', () => {
  it('[AC4] a new account writes the page language, and the sign-in resolves only after the write', async () => {
    let done = false
    const completion = completeGoogleSignIn({ credential: 'synthetic.jwt.value', nonce: 'n' }, () => setAccountLocale('uk')).then((key) => { done = true; state.order.push('resolved'); return key })
    await settle()
    expect(state.order).toEqual(['setAccountLocale:uk'])
    expect(done, 'the caller cannot navigate before the account language is written').toBe(false)
    state.release!()
    expect(await completion).toBeNull()
    expect(state.order).toEqual(['setAccountLocale:uk', 'setAccountLocale:done', 'resolved'])
  })

  it('[AC4] an existing account writes nothing', async () => {
    state.user = { id: 'u-synth', created_at: '2026-01-01T10:00:00.000000Z', last_sign_in_at: '2026-11-26T10:00:00.000000Z' }
    expect(await completeGoogleSignIn({ credential: 'synthetic.jwt.value', nonce: 'n' }, () => setAccountLocale('uk'))).toBeNull()
    expect(state.order).toEqual([])
  })

  it('[AC4] a refused sign-in writes nothing; a failed write never blocks the sign-in', async () => {
    state.user = null
    state.error = { message: 'Invalid nonce' }
    expect(await completeGoogleSignIn({ credential: 'synthetic.jwt.value', nonce: 'n' }, () => setAccountLocale('uk'))).not.toBeNull()
    expect(state.order).toEqual([])

    state.user = { id: 'u-synth', created_at: '2026-11-26T10:00:00.000000Z', last_sign_in_at: '2026-11-26T10:00:00.120000Z' }
    state.error = null
    state.actionFails = true
    expect(await completeGoogleSignIn({ credential: 'synthetic.jwt.value', nonce: 'n' }, () => setAccountLocale('it'))).toBeNull()
    expect(state.order).toEqual(['setAccountLocale:it'])
  })

  it('[AC4] every caller hands in the page language write and navigates only after the completion resolved', () => {
    const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')
    const header = read('src/components/layout/Header.tsx')
    const sheet = read('src/modules/auth/components/AuthSheet.tsx')
    // One Tap in the header, and the sheet the header renders: the write is setAccountLocale with the page language
    expect(header).toMatch(/await completeGoogleSignIn\(result, \(\) => setAccountLocale\(locale\)\)/)
    expect(header).toMatch(/onNewGoogleAccount=\{\(\) => setAccountLocale\(locale\)\}/)
    // the sheet's login view and Welcome back hand the same write to the completion, and both views get it
    expect([...sheet.matchAll(/await completeGoogleSignIn\(result, onNewGoogleAccount\)/g)]).toHaveLength(2)
    expect([...sheet.matchAll(/onNewGoogleAccount=\{onNewGoogleAccount\}/g)]).toHaveLength(2)
    for (const [file, text] of [['Header.tsx', header], ['AuthSheet.tsx', sheet]] as const) {
      for (const match of text.matchAll(/await completeGoogleSignIn\(/g)) {
        expect(text.slice(match.index).indexOf('openStoredDestination('), `${file}: the navigation comes after the completion`).toBeGreaterThan(0)
      }
      expect(text, `${file}: no completion that is not awaited`).not.toMatch(/[^t] completeGoogleSignIn\(/)
    }
  })
})
