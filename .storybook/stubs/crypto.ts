// Storybook/Vite resolution stub for Node's `crypto` (Task 757, §15.1a).
//
// See next-headers.ts in this same directory for the full rationale. `createHash` is called
// only inside `recovery.ts`'s `hashEmailForCorrelation`, itself only invoked from within a
// server action body — never at module init or render time — so this stub is never actually
// invoked by any Story; it exists purely to satisfy Vite's static module resolution.
export function createHash(): never {
  throw new Error('node:crypto is unavailable in Storybook — this stub should never execute (called only inside a server action body, never during render).')
}
