/**
 * Sanitizes a `next` redirect path to ensure it is a safe same-origin relative path.
 * (`next` is the canonical post-login redirect param across the whole codebase.)
 *
 * Accepts: relative paths that start with a single "/" (e.g. "/sq/cabinet").
 * Rejects:
 *   - undefined / null / empty string
 *   - protocol-relative URLs (//)
 *   - anything with a URL scheme (javascript:, data:, https:, etc.)
 *   - paths that do not start with /
 *   - backslashes (browser normalisation may expand \ to / in some contexts)
 *   - ASCII control characters (U+0000–U+001F)
 *   - path-traversal segments: ".." in raw or percent-encoded forms
 *     (%2e%2e, .%2e, %2e.) including with encoded slash (%2f)
 *
 * Admin-path enforcement (after login): the server-side admin layout guard
 * handles unauthorized access — a non-admin who lands on /admin is
 * immediately redirected away by the role check in app/admin/layout.tsx.
 * sanitizeReturnTo is a path-safety check only, NOT an authorization check.
 */
export function sanitizeReturnTo(raw: string | null | undefined): string | null {
  if (!raw) return null
  // Must start with / but not //
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  // Must not contain a URL scheme (javascript:, data:, vbscript:, etc.)
  if (/^[a-z][a-z0-9+.\-]*:/i.test(raw)) return null
  // Reject backslashes — browsers may normalise \ to / in some contexts.
  if (raw.includes('\\')) return null
  // Reject ASCII control characters (U+0000–U+001F).
  if (/[\x00-\x1f]/.test(raw)) return null
  // Reject path-traversal segments. Normalise %2e → . so that all encoded
  // forms (%2e%2e, .%2e, %2e.) collapse to "..", then test for ".." as a
  // path segment (followed by /, end-of-string, ?, #, or encoded slash %2f).
  const normalized = raw.replace(/%2e/gi, '.')
  if (/(^|\/)\.\.($|[/?#]|%2f)/i.test(normalized)) return null
  return raw
}
