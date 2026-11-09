/**
 * Task 952 Revision 1 (F1): a build talks to Sentry (release, source-map upload) only on Vercel.
 * `.env.local` holds a live SENTRY_AUTH_TOKEN, and Next rereads it, so the token alone must not switch the upload on.
 */
export function usesSentryBuild(env: Record<string, string | undefined>): boolean {
  return Boolean(env.SENTRY_AUTH_TOKEN) && Boolean(env.VERCEL)
}
