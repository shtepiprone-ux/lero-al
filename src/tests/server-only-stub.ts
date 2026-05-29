// Stub for `server-only` in Vitest environment.
// The real package throws at runtime when imported in a client context.
// In tests (Vitest/jsdom) this guard is not meaningful, so we export an empty module.
export {}
