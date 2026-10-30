// Storybook/Vite resolution stub for Node's `crypto` (Task 757, §15.1a).
//
// See next-headers.ts in this same directory for the full rationale. `createHash` is called
// only inside `recovery.ts`'s `hashEmailForCorrelation`, itself only invoked from within a
// server action body — never at module init or render time — so this stub is never actually
// invoked by any Story; it exists purely to satisfy Vite's static module resolution.
export function createHash(): never {
  throw new Error('node:crypto is unavailable in Storybook — this stub should never execute (called only inside a server action body, never during render).')
}

// Task 781 — `randomBytes` (`src/modules/cabinet/actions/index.ts:354,:419`) reaches Vite's
// static module graph for the first time via `SaveSearchButton`'s canonical story
// (`Patterns/Mantine/ListingsActionRow`), which statically imports the real production
// `SaveSearchButton` → `saveSavedSearch` per clause 16c. Both call sites are inside server
// action bodies invoked only on click (`startTransition`), never at module init or render time
// — same never-invoked rationale as `createHash` above.
export function randomBytes(): never {
  throw new Error('node:crypto is unavailable in Storybook — this stub should never execute (called only inside a server action body, never during render).')
}

// Task 923 R38 — `createHmac` and `timingSafeEqual` (`src/lib/uploads/uploadGrant.ts`) reach Vite's static module graph through the company-registration
// Stories (`createCompanyAction` in `src/modules/companies/actions.ts` makes the upload grant). Both are called only inside the server action body, never at
// module init or render time — same never-invoked rationale as above.
export function createHmac(): never {
  throw new Error('node:crypto is unavailable in Storybook — this stub should never execute (called only inside a server action body, never during render).')
}

export function timingSafeEqual(): never {
  throw new Error('node:crypto is unavailable in Storybook — this stub should never execute (called only inside a server action body, never during render).')
}
