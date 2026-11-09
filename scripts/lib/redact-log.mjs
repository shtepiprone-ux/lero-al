// Text that comes from a page under test (a console message, an error, a URL) can carry what must not reach a log: credentials in a URL, a token in a query string, an
// authorization header, a JWT, or the value of a session cookie given to the run. (Task 951, CodeQL js/clear-text-logging in check-hydration-console.mjs.)

/**
 * @param {unknown} text what is about to be logged
 * @param {string[]} [secrets] exact values that must never appear (for example the values of the session cookies of this run)
 * @returns {string}
 */
export function redactSensitive(text, secrets = []) {
  let out = String(text);
  for (const secret of secrets) {
    if (typeof secret === 'string' && secret.length >= 8) out = out.split(secret).join('[redacted]');
  }
  return out
    // user:password@ in a URL
    .replace(/\/\/[^\s/@:]+:[^\s/@]*@/g, '//[redacted]@')
    // Authorization header values
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi, '$1 [redacted]')
    // a JSON Web Token
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g, '[redacted-jwt]')
    // the value of a secret-like parameter in a query string, a cookie string or key=value text
    .replace(/((?:access_token|refresh_token|id_token|token|apikey|api_key|password|passwd|secret|signature|code)=)[^&\s"';]+/gi, '$1[redacted]');
}

/** The values of the cookies in a Playwright cookie array given as JSON text; an unreadable value gives an empty list. */
export function cookieValues(json) {
  try {
    const parsed = JSON.parse(String(json));
    return Array.isArray(parsed) ? parsed.map((cookie) => cookie?.value).filter((value) => typeof value === 'string') : [];
  } catch {
    return [];
  }
}
