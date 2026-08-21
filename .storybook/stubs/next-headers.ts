// Storybook/Vite resolution stub for `next/headers` (Task 757, §15.1a).
//
// `AuthSheet.tsx` statically imports the real production `'use server'` action modules
// `recovery.ts`/`captcha.ts`. Next.js's own bundler splits `'use server'` files into
// RSC-only references so their bodies never ship to the browser; Vite/Storybook has no
// equivalent split and tries to bundle the real module body, which fails on `next/headers`
// (server-only, no browser build). `headers()` here is called only inside `recovery.ts`'s
// `logPasswordRecoveryRequest` action body — never at module init or render time — so this
// stub is never actually invoked by any Story; it exists purely to satisfy Vite's static
// module resolution during the build. It does not alter, mock, or fake AuthSheet's own
// behavior or composition.
export function headers(): never {
  throw new Error('next/headers is unavailable in Storybook — this stub should never execute (called only inside a server action body, never during render).')
}
