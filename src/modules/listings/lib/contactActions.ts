/**
 * The Cloudflare Turnstile `action` of each contact path (Task 923 R110, R86). The widget sets it, the server compares it: a token solved for one path is refused on the other.
 * Both names fit Cloudflare's rule (at most 32 letters, digits, `_` and `-`). No `server-only`: the client widget reads the same names.
 */
export const CONTACT_ACTIONS = { reveal: 'contact_reveal', inquiry: 'contact_inquiry' } as const

export type ContactAction = (typeof CONTACT_ACTIONS)[keyof typeof CONTACT_ACTIONS]
