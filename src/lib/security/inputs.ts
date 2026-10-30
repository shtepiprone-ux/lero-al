/**
 * Shape checks for values that arrive from a browser (Task 923 Revision 7). TypeScript types are erased at runtime: a Server Action receives whatever the caller
 * sent, so a value that is later stored, mailed, put in a query or in a cookie is checked here first.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** a canonical UUID string (the id of a listing, user, collection …) */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value)
}

/** the characters that can end a script element or a line of script text: `<`, `>`, `&` and the line terminators U+2028 and U+2029 (built from their code points on purpose) */
const SCRIPT_UNSAFE = new RegExp(`[<>&${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`, 'g')

/**
 * JSON that goes inside an inline `<script>` element (Task 923 R66 (g)). `JSON.stringify` leaves `<`, `>` and `&` as they are, so a value that holds `</script>` closes the
 * element and what follows is parsed as markup (a stored listing slug could do that on the pages of OTHER listings). Those three characters and the two line terminators
 * are written as backslash-u escapes: every JSON parser reads them back as the same characters and an HTML parser cannot see them as markup.
 * Every inline JSON script of the application uses this one helper.
 */
export function jsonForScript(value: unknown): string {
  return (JSON.stringify(value) ?? 'null').replace(SCRIPT_UNSAFE, (c) => `${String.fromCharCode(0x5c)}u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
}

/** one plain address: no whitespace, list separators, angle brackets, quotes, backslashes or a second "@"; a real domain; at most 254 characters */
const PLAIN_EMAIL = /^[^\s,;<>"()\\@]+@[^\s,;<>"()\\@]+\.[^\s,;<>"()\\@]{2,}$/

export function isPlainEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && PLAIN_EMAIL.test(value)
}

/** the longest name or last name of a profile, in characters after trimming (Task 923 R100; the `users` CHECKs of hardening v8b take the same number) */
export const MAX_PROFILE_NAME_LENGTH = 100

/**
 * the longest website a profile may store, in characters after the address is normalised (Task 923 R100; the CHECK of hardening v8b). `safeExternalUrl` accepts addresses up to 2048
 * characters for a link that is only output; a stored website is held to this tighter bound.
 */
export const MAX_PROFILE_WEBSITE_LENGTH = 200

/**
 * A name or last name that fits the stored bound: nothing at all (`null` / `undefined`), or text of at most `MAX_PROFILE_NAME_LENGTH` characters AFTER trimming. A value that is not
 * text is refused (the types are erased at runtime). The writers store the TRIMMED value, so the length checked here is the length stored.
 */
export function isProfileNameWithinBound(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim().length <= MAX_PROFILE_NAME_LENGTH)
}

/**
 * A phone number as the application stores it: E.164, a "+", a country digit 1–9 and 7–14 more digits (the same guard `validateNationalPhone` ends with).
 * The forms check and format the number in the browser; a Server Action receives whatever the caller sent, and a stored number is put into `tel:` and
 * `https://wa.me/<digits>` addresses (Task 923 Revision 7, finding S54).
 */
export function isE164(value: unknown): value is string {
  return typeof value === 'string' && /^\+[1-9]\d{7,14}$/.test(value)
}
