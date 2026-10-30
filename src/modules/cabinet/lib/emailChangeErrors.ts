// The refusal texts of the e-mail change (Task 923 R83 (d)): moved unchanged out of the 'use server' file `actions/index.ts`, so that a Story and a test can use
// the same texts as the Server Action. A plain module: no 'use server', no server import.

const EMAIL_ERRORS: Record<string, Record<string, string>> = {
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
  // Re-authentication (Task 923 R70 (a), R80, D54)
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

/** the text of one refusal key in a locale; an unknown locale answers the `en` text, an unknown key answers the key itself */
export function emailChangeErrorText(key: string, locale: string): string {
  const msgs = EMAIL_ERRORS[key]
  return msgs?.[locale] ?? msgs?.['en'] ?? key
}
