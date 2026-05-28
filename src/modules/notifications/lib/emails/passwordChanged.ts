/**
 * sendPasswordChangedEmail — fire-and-forget helper for password-change notifications.
 *
 * Called from two integration sites (fire-and-forget with `void` at each):
 *   1. src/modules/cabinet/actions/index.ts → changeCabinetPassword (Task 273)
 *   2. src/modules/auth/actions/recovery.ts → logPasswordRecoveryCompletion (Task 157)
 *
 * sq-only per Task 251 Albanian-only outbound email policy.
 * Never throws — all errors are logged and swallowed.
 */
import * as React from 'react'
import { sendEmail, type SendEmailResult } from './send'
import { PasswordChangedEmail } from './PasswordChangedEmail'

const SUBJECT = 'Fjalëkalimi juaj në Lero.al është ndryshuar'

interface SendPasswordChangedEmailParams {
  to: string
  name?: string | null
  changedAt?: Date
}

export async function sendPasswordChangedEmail({
  to,
  name,
  changedAt = new Date(),
}: SendPasswordChangedEmailParams): Promise<SendEmailResult> {
  if (!to) {
    console.error('[email:password-changed] missing recipient — skipping', { changedAt })
    return { error: 'missing_content' }
  }

  const result = await sendEmail({
    to,
    subject: SUBJECT,
    react: React.createElement(PasswordChangedEmail, { name: name ?? null, changedAt }),
  })

  if (result.error) {
    console.error('[email:password-changed] send failed', { error: result.error, changedAt })
  }

  return result
}
