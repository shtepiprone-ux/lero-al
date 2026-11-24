// Storybook/Vite resolution stub for the Server Actions `@/modules/auth/actions/captcha` (Task 991).
//
// `AuthSheet.tsx` imports the real `'use server'` module, whose body now reaches the service-role client, the mail helper and `next/server` — none of which has a browser build, and Vite has no
// split that keeps a `'use server'` body out of the bundle. The `RegisterSuccess` Story drives the real sheet through its own `play`, and the sheet needs the sign-up and the reset request to
// ANSWER: this stub answers `{ ok: true }`, the answer the real action gives for every address that Auth accepts (the sheet's own states for a failed answer are proved in
// `src/modules/auth/components/__tests__/AuthSheet.test.tsx`). It reaches no network and no database. It never reaches the Next.js build (`next build` does not read `.storybook/`).
export async function signUpWithCaptcha(): Promise<{ ok: true }> {
  return { ok: true }
}

export async function requestPasswordResetWithCaptcha(): Promise<{ ok: true }> {
  return { ok: true }
}
