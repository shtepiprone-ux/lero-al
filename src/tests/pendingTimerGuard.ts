// Task 971: a leak guard for the unit-test environment. It wraps the real timer globals, remembers every timer with a delay above 0 and every animation
// frame that is still pending, and `assertNoPendingTimers` (called from the `afterEach` in `setup.ts`, after Testing Library's cleanup) fails the test that
// left one, naming the test and the first `node_modules` or `src` frame that created it.
//
// Revision 2: the check first WAITS on the real clock (never clearing anything) up to a budget for pending handles to run, then fails what is left. A handle that
// runs during the wait cannot crash the run, and whether a library's deferred handle is still pending at the instant of cleanup depends on machine load.
//
// Why: a timer that outlives its test fires after Vitest has torn down the jsdom environment, and React then throws `ReferenceError: window is not defined`
// as an unhandled error that fails the whole run at random (CI run 42766290854, a Mantine `use-transition` timer). The guard turns that random crash into a
// deterministic failure of the test that started the timer.
//
// Rules: zero-delay timers are allowed (Mantine's focus trap schedules them and they fire on the next macrotask); a timer or frame the test cancels or that has
// fired is not pending; a test that uses `vi.useFakeTimers()` talks to the fake clock, which replaces these wrappers while it is installed; the guard never
// clears a handle (it only reports).

interface PendingHandle {
  readonly kind: 'timer' | 'frame'
  readonly delay: number
  readonly frame: string
  reported: boolean
}

export interface PendingLeak {
  readonly kind: 'timer' | 'frame'
  readonly delay: number
  readonly frame: string
}

const pendingTimers = new Map<unknown, PendingHandle>()
const pendingFrames = new Map<unknown, PendingHandle>()

const THIS_FILE = 'src/tests/pendingTimerGuard.ts'

// The native timer, captured before the guard wraps it: the wait in `assertNoPendingTimers` must not depend on a fake clock.
const nativeSetTimeout = globalThis.setTimeout
const nativeNow = Date.now.bind(Date)

// The first stack line inside `node_modules` or `src` that is not this file: the code that asked for the timer.
function creatingFrame(): string {
  const previousLimit = Error.stackTraceLimit
  Error.stackTraceLimit = 40
  const stack = new Error().stack ?? ''
  Error.stackTraceLimit = previousLimit
  const lines = stack.split('\n').slice(1).map((line) => line.trim().replace(/\\/g, '/'))
  const own = lines.find((line) => !line.includes(THIS_FILE) && (line.includes('/node_modules/') || line.includes('/src/')))
  const found = own ?? lines.find((line) => !line.includes(THIS_FILE)) ?? 'unknown frame'
  return found.replace(/^at\s+/, '').replace(/file:\/\/\/?/g, '').replace(/^.*?(node_modules\/|src\/)/, '$1')
}

function copyProperties(from: object, to: object) {
  for (const key of Reflect.ownKeys(from)) {
    if (key === 'length' || key === 'name' || key === 'prototype') continue
    const descriptor = Object.getOwnPropertyDescriptor(from, key)
    if (descriptor) Object.defineProperty(to, key, descriptor)
  }
}

const INSTALLED = Symbol.for('lero.pendingTimerGuard')

export function installPendingTimerGuard() {
  const target = globalThis as typeof globalThis & { [INSTALLED]?: true }
  if (target[INSTALLED]) return
  target[INSTALLED] = true

  const realSetTimeout = globalThis.setTimeout
  const realClearTimeout = globalThis.clearTimeout
  const guardedSetTimeout = function guardedSetTimeout(handler: unknown, timeout?: unknown, ...args: unknown[]) {
    const delay = Number(timeout)
    if (typeof handler !== 'function' || !(delay > 0)) return (realSetTimeout as (...a: unknown[]) => unknown)(handler, timeout, ...args)
    const frame = creatingFrame()
    const created: { handle?: unknown } = {}
    const wrapped = (...callArgs: unknown[]) => {
      pendingTimers.delete(created.handle)
      return (handler as (...a: unknown[]) => unknown)(...callArgs)
    }
    created.handle = (realSetTimeout as (...a: unknown[]) => unknown)(wrapped, timeout, ...args)
    pendingTimers.set(created.handle, { kind: 'timer', delay, frame, reported: false })
    return created.handle
  }
  copyProperties(realSetTimeout, guardedSetTimeout)
  globalThis.setTimeout = guardedSetTimeout as unknown as typeof setTimeout
  globalThis.clearTimeout = function guardedClearTimeout(handle?: Parameters<typeof clearTimeout>[0]) {
    pendingTimers.delete(handle)
    return realClearTimeout(handle)
  } as typeof clearTimeout

  const realRequestFrame = globalThis.requestAnimationFrame
  const realCancelFrame = globalThis.cancelAnimationFrame
  if (typeof realRequestFrame === 'function' && typeof realCancelFrame === 'function') {
    globalThis.requestAnimationFrame = function guardedRequestAnimationFrame(callback: FrameRequestCallback) {
      const frame = creatingFrame()
      let handle = 0
      const wrapped: FrameRequestCallback = (time) => {
        pendingFrames.delete(handle)
        return callback(time)
      }
      handle = realRequestFrame.call(globalThis, wrapped)
      pendingFrames.set(handle, { kind: 'frame', delay: 0, frame, reported: false })
      return handle
    }
    globalThis.cancelAnimationFrame = function guardedCancelAnimationFrame(handle: number) {
      pendingFrames.delete(handle)
      return realCancelFrame.call(globalThis, handle)
    }
  }
}

// Handles still pending that no test has been told about yet.
export function pendingLeaks(): PendingLeak[] {
  const leaks: PendingLeak[] = []
  for (const entry of [...pendingTimers.values(), ...pendingFrames.values()]) {
    if (!entry.reported) leaks.push({ kind: entry.kind, delay: entry.delay, frame: entry.frame })
  }
  return leaks
}

export function describeLeaks(testName: string, leaks: readonly PendingLeak[], budgetMs: number): string {
  const lines = leaks.map((leak) => (leak.kind === 'frame' ? `  - animation frame created at ${leak.frame}` : `  - ${leak.delay} ms timer created at ${leak.frame}`))
  return `The test "${testName}" left ${leaks.length} timer(s) or animation frame(s) pending after cleanup and a wait of ${budgetMs} ms (they fire after the environment is torn down and crash the run with "window is not defined"; cancel them in the test or in the component that unmounts):\n${lines.join('\n')}`
}

// How long the guard waits for a test's pending timers and frames to run before it fails the test. A Mantine transition lasts up to 200 ms, a Tiptap or ProseMirror
// teardown up to 20 ms; 3 s is generous on a loaded CI machine and costs nothing when nothing is pending.
export const DEFAULT_PENDING_BUDGET_MS = 3000

// Waits, on the real clock, until nothing is pending or the budget is spent. It only waits: it never clears a handle. A handle that runs during the wait cannot
// crash the run, because the environment is still alive. The native clock and timer are captured at load, so a fake clock a test left installed cannot stall the wait.
async function waitForPendingHandles(budgetMs: number) {
  const deadline = nativeNow() + budgetMs
  while (pendingLeaks().length > 0 && nativeNow() < deadline) {
    await new Promise<void>((resolve) => nativeSetTimeout(resolve, 10))
  }
}

// For the test named `testName`: waits up to `budgetMs` for every pending timer (delay above 0) and frame to run, then throws, naming the test, for what is
// left. A leak is reported once (to the test that left it) so it is not blamed on every later test; the handle itself is never cleared.
export async function assertNoPendingTimers(testName: string, budgetMs: number = DEFAULT_PENDING_BUDGET_MS) {
  await waitForPendingHandles(budgetMs)
  const leaks = pendingLeaks()
  if (leaks.length === 0) return
  for (const entry of [...pendingTimers.values(), ...pendingFrames.values()]) entry.reported = true
  throw new Error(describeLeaks(testName, leaks, budgetMs))
}

// What the guard saw at the moment it ran, so a test can prove it runs after Testing Library's cleanup.
let lastObservation: { testName: string; rootChildren: number } | undefined

export function observeGuardRun(testName: string) {
  // Test files that run in the node environment have no document.
  lastObservation = { testName, rootChildren: typeof document === 'undefined' ? 0 : document.body.childElementCount }
}

export function lastGuardObservation() {
  return lastObservation
}
