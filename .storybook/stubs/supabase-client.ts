// Storybook/Vite resolution stub for the browser Supabase client `@/lib/supabase/client` (Task 939).
//
// The real `createClient()` builds a browser client from `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, which a Storybook build does not have, so it throws
// and every Story whose component calls it (`useFavoritesRealtime` in FavoritesShell) ends on the error screen. This stub is inert: it opens no connection and makes no
// network call. A realtime channel subscribes to nothing and a query chain settles to `{ data: null, error: null }`. Every `auth` method that `src/lib/auth/browser.ts`
// calls answers in the shape the real client gives a visitor who is not signed in (`getUser` → `{ data: { user: null } }`, `getSession` → `{ data: { session: null } }`,
// `onAuthStateChange` → `{ data: { subscription } }`, the sign-in, sign-up, OTP, update and reset calls → `{ data: { user: null, session: null } }`, `signOut` →
// `{ error: null }`), so a component that destructures the answer does not throw. It never reaches the Next.js build (`next build` does not read `.storybook/`).
type Settled = { data: null; error: null }

// A query builder: any method (`select`, `eq`, `neq`, `maybeSingle`, ...) returns the builder, and awaiting it settles.
type QueryBuilder = { [method: string]: (...args: unknown[]) => QueryBuilder } & PromiseLike<Settled>

const settled = (): Settled => ({ data: null, error: null })

type SignedOutUser = { data: { user: null }; error: null }
type SignedOutSession = { data: { session: null }; error: null }
type SignedOutPair = { data: { user: null; session: null }; error: null }

const signedOutUser = (): SignedOutUser => ({ data: { user: null }, error: null })
const signedOutSession = (): SignedOutSession => ({ data: { session: null }, error: null })
const signedOutPair = (): SignedOutPair => ({ data: { user: null, session: null }, error: null })

function queryBuilder(): QueryBuilder {
  const target = {} as QueryBuilder
  return new Proxy(target, {
    get(_target, property) {
      if (property === 'then') {
        return (onFulfilled?: (value: Settled) => unknown, onRejected?: (reason: unknown) => unknown) =>
          Promise.resolve(settled()).then(onFulfilled, onRejected)
      }
      return () => queryBuilder()
    },
  })
}

type Channel = {
  on(...args: unknown[]): Channel
  subscribe(...args: unknown[]): Channel
}

function channel(): Channel {
  return {
    on() { return this },
    subscribe() { return this },
  }
}

const auth = {
  // `controller.ts` destructures `{ data: { subscription } }` from this call and unsubscribes it later.
  onAuthStateChange: (..._args: unknown[]) => ({ data: { subscription: { unsubscribe() {} } } }),
  getUser: async (..._args: unknown[]): Promise<SignedOutUser> => signedOutUser(),
  getSession: async (..._args: unknown[]): Promise<SignedOutSession> => signedOutSession(),
  signOut: async (..._args: unknown[]): Promise<{ error: null }> => ({ error: null }),
  signInWithPassword: async (..._args: unknown[]): Promise<SignedOutPair> => signedOutPair(),
  signInWithIdToken: async (..._args: unknown[]): Promise<SignedOutPair> => signedOutPair(),
  signUp: async (..._args: unknown[]): Promise<SignedOutPair> => signedOutPair(),
  verifyOtp: async (..._args: unknown[]): Promise<SignedOutPair> => signedOutPair(),
  updateUser: async (..._args: unknown[]): Promise<SignedOutPair> => signedOutPair(),
  resetPasswordForEmail: async (..._args: unknown[]): Promise<SignedOutPair> => signedOutPair(),
  refreshSession: async (..._args: unknown[]): Promise<SignedOutPair> => signedOutPair(),
}

export function createClient() {
  return {
    channel: (..._args: unknown[]) => channel(),
    removeChannel: async (..._args: unknown[]): Promise<void> => undefined,
    from: (..._args: unknown[]) => queryBuilder(),
    rpc: (..._args: unknown[]) => queryBuilder(),
    auth,
  }
}
