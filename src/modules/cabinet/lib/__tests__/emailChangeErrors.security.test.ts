// @vitest-environment node
/**
 * Security (Task 923 R83 (d)): the refusal texts of the e-mail change moved out of the 'use server' file `actions/index.ts` into `lib/emailChangeErrors.ts`.
 *  - SEC-X-SRV-EMAIL-ERRORS-SAME: every key of the table gives the very text it gave before the move, in sq, en, uk and it; an unknown locale answers the `en` text; an unknown key
 *    answers the key itself (never a missing text); and the real `initiateEmailChange` returns the module's text.
 * The expected texts below are a literal copy of the table as it stood in `actions/index.ts` before the move (kickoff C726). The real action runs with its server
 * dependencies replaced by doubles; the address it is given is refused before any of them is asked.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => { throw new Error('the admin client must not be reached by a refused address') } }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({}) }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => ({ id: 'user-1', email: 'old@example.com' }) }))
vi.mock('@/lib/auth/blockCheck', () => ({ getBlockedError: async () => null }))
vi.mock('next/cache', () => ({ revalidatePath: () => undefined }))
vi.mock('next/headers', () => ({ headers: async () => ({ get: () => null }), cookies: async () => ({ getAll: () => [] }) }))
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({}) }))
vi.mock('@/modules/notifications/lib/emails/emailChange', () => ({ sendEmailChangeEmails: async () => undefined }))
vi.mock('@/modules/notifications/lib/emails/passwordChanged', () => ({ sendPasswordChangedEmail: async () => undefined }))
vi.mock('@/modules/listings/actions/applyListingTransition', () => ({ applyListingTransitionByStatus: async () => ({ ok: true }) }))

import { initiateEmailChange } from '../../actions'
import { emailChangeErrorText } from '../emailChangeErrors'

const LOCALES = ['sq', 'en', 'uk', 'it'] as const

// the table before the move, literal
const BEFORE_THE_MOVE: Record<string, Record<(typeof LOCALES)[number], string>> = {
  rate_limit: {
    sq: 'Shumë kërkesa. Provoni sërish pas një ore.',
    en: 'Too many requests. Please try again in one hour.',
    uk: 'Забагато запитів. Спробуйте за годину.',
    it: 'Troppe richieste. Riprova tra un\'ora.',
  },
  same_email: {
    sq: 'Ky email është tashmë adresa juaj aktuale.',
    en: 'This is already your current email address.',
    uk: 'Це вже ваша поточна електронна адреса.',
    it: 'Questa è già la tua email attuale.',
  },
  email_taken: {
    sq: 'Ky email është tashmë i regjistruar.',
    en: 'This email address is already in use.',
    uk: 'Ця електронна адреса вже використовується.',
    it: 'Questo indirizzo email è già in uso.',
  },
  failed: {
    sq: 'Ndryshimi i emailit dështoi. Provoni sërish.',
    en: 'Could not initiate email change. Please try again.',
    uk: 'Не вдалось ініціювати зміну email. Спробуйте ще раз.',
    it: 'Impossibile avviare il cambio email. Riprova.',
  },
  no_active_request: {
    sq: 'Nuk ka kërkesë aktive ndryshimi email-i. Filloni një të re.',
    en: 'No active email change request found. Please start a new request.',
    uk: 'Немає активного запиту зміни email. Надішліть новий.',
    it: 'Nessuna richiesta di cambio email attiva. Inizia una nuova.',
  },
  invalid_password: {
    sq: 'Fjalëkalimi aktual është i gabuar.',
    en: 'Current password is incorrect.',
    uk: 'Поточний пароль неправильний.',
    it: 'La password attuale non è corretta.',
  },
  reauth_required: {
    sq: 'Hyni sërish me Google për të ndryshuar emailin.',
    en: 'Sign in with Google again to change your email.',
    uk: 'Увійдіть через Google ще раз, щоб змінити email.',
    it: 'Accedi di nuovo con Google per cambiare l\'email.',
  },
}

describe('emailChangeErrors', () => {
  it('[SEC-X-SRV-EMAIL-ERRORS-SAME] the refusal texts are unchanged', async () => {
    expect(Object.keys(BEFORE_THE_MOVE), 'the seven keys of the table').toHaveLength(7)
    for (const [key, texts] of Object.entries(BEFORE_THE_MOVE)) {
      for (const locale of LOCALES) {
        const text = emailChangeErrorText(key, locale)
        expect(text, `${key} in ${locale}`).toBe(texts[locale])
        expect(text, `${key} in ${locale} is a text, never the raw key`).not.toBe(key)
      }
      expect(emailChangeErrorText(key, 'xx'), `${key} in an unknown locale answers the en text`).toBe(texts.en)
    }
    expect(emailChangeErrorText('no_such_key', 'en'), 'an unknown key answers the key').toBe('no_such_key')

    // the real action answers with the same text, per locale, and never reaches the admin client for a refused address
    for (const locale of LOCALES) {
      const answer = await initiateEmailChange({ newEmail: 'not an address', locale })
      expect(answer, `initiateEmailChange in ${locale}`).toEqual({ error: BEFORE_THE_MOVE.failed[locale] })
    }
    expect(await initiateEmailChange({ newEmail: 'not an address', locale: 'xx' })).toEqual({ error: BEFORE_THE_MOVE.failed.en })
  })
})
