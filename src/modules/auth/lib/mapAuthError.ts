// Map Supabase error messages → stable i18n keys (Epic A error-code contract)
export function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  // A banned account gets the wrong-credentials text (Task 923 R40, D21): Supabase Auth answers `user_banned` before it checks the
  // password, so a distinct text would tell a visitor that an account exists and is blocked (OWASP ASVS 5.0 6.3.8).
  if (m.includes('invalid login credentials') || m.includes('invalid credentials') || m.includes('user is banned')) return 'error_invalid_credentials'
  if (m.includes('user already registered') || m.includes('already registered') || m.includes('already exists')) return 'error_email_exists'
  if (m.includes('password should be at least') || m.includes('weak password')) return 'error_weak_password'
  if (m.includes('email not confirmed') || m.includes('not confirmed')) return 'error_email_not_confirmed'
  if (m.includes('rate limit') || m.includes('too many')) return 'error_rate_limit'
  // Supabase's CAPTCHA protection refused the token (Task 923 R152): the person gets a new check, not a generic error
  if (m.includes('captcha')) return 'captcha_error_failed'
  return 'error_generic'
}
