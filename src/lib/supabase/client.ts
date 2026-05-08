import { createBrowserClient } from '@supabase/ssr'

// Promise-queue mutex for auth operations.
//
// @supabase/auth-js uses navigator.locks (Web Locks API) to serialise
// concurrent auth operations across multiple client instances. We replace it
// because:
//   1. We maintain a singleton — there is only one client instance.
//   2. React Strict Mode double-invokes useEffect (mount → unmount → mount),
//      which causes two concurrent auth inits to race on the same Web Lock and
//      throw "lock was released because another request stole it".
//
// The replacement is a promise-queue mutex that serialises every auth operation
// inside a single JS context. This fixes the race condition that produces
// "AuthApiError: Invalid Refresh Token: Refresh Token Not Found":
//
//   When the tab becomes visible after inactivity, @supabase/auth-js fires its
//   own visibility handler AND the auto-refresh timer concurrently. With no-op
//   locking both run at the same time, each consuming the same single-use
//   refresh token. The first succeeds; the second gets "Not Found", emits
//   SIGNED_OUT, and wipes the successfully-refreshed session.
//
//   With the queue mutex the second call starts only after the first has stored
//   the new tokens, so it sees a valid non-expired session and skips refresh.
let _lockTail: Promise<void> = Promise.resolve()

function authLock(
  _name: string,
  _timeout: number,
  fn: () => Promise<unknown>
): Promise<unknown> {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  const prev = _lockTail
  _lockTail = gate
  return prev
    .then(() => fn())
    .catch((raw: unknown) => {
      // Normalise every rejection to an Error instance.
      //
      // @supabase/auth-js has internal throw sites that can produce non-Error
      // values (undefined, plain strings, AuthApiError subclasses). When the
      // lock's returned promise is not awaited by the caller (fire-and-forget
      // in emitInitialSession / auto-refresh timer), those rejections surface as
      // "UnhandledPromiseRejection: undefined" in the browser console and Sentry.
      //
      // Normalising here ensures:
      //   1. All rejections carry a traceable stack frame.
      //   2. Unhandled-rejection reporters receive an Error, not a primitive.
      //   3. catch (e) { if (e instanceof Error) ... } guards downstream work.
      const err =
        raw instanceof Error
          ? raw
          : new Error(
              typeof raw === 'string'
                ? raw
                : `Auth lock operation failed: ${String(raw ?? 'unknown')}`
            )
      throw err
    })
    .finally(release)
}

// Singleton: one browser client for the entire app lifetime.
let _client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          lock: authLock,
        } as any,
      }
    )
  }
  return _client
}
