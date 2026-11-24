// Storybook/Vite resolution stub for the Server Action `@/modules/auth/actions/explainRefusedSignIn` (Task 991).
//
// The real action reaches the service-role client and the password check in the database: no browser build exists for it, and no Story may call it. The `LoginBlocked` Story drives the real sheet
// through its own `play`: the sign-in stub (`supabase-client.ts`) answers `user_banned` for the one synthetic address below, and the sheet then asks this action. The stub answers what the real
// action answers a caller that proved the password of a blocked account (`{ blocked: true }`), and `{ blocked: false }` for every other address, as the real one does. It reaches no network and
// no database. It never reaches the Next.js build (`next build` does not read `.storybook/`).
const BLOCKED_STORY_EMAIL = 'blocked@example.com'

export async function explainRefusedSignIn(params: { email: string }): Promise<{ blocked: boolean }> {
  return { blocked: params.email === BLOCKED_STORY_EMAIL }
}
