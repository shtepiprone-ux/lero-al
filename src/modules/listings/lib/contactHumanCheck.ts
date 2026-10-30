import 'server-only'

import { headers } from 'next/headers'
import { verifyTurnstile } from '@/lib/captcha/verifyTurnstile'
import type { ContactAction } from '@/modules/listings/lib/contactActions'

/**
 * The one human check of every contact path (Task 923 R110, R86): the phone and WhatsApp reveal, the message to the owner, and the future chat's first message.
 * It asks Cloudflare for the token, for the action of that path and for this site. `true` only for a verified human; an unreadable, refused, replayed or foreign token is `false`.
 */
export async function checkContactHuman(token: unknown, action: ContactAction): Promise<boolean> {
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim()
           ?? hdrs.get('x-real-ip')
           ?? undefined
  const result = await verifyTurnstile(token, ip, { action })
  return result.success
}
