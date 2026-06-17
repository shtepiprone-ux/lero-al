# Task 450 — Chore: dedupe `import-in-the-middle` to clear OpenTelemetry dev warnings

**Date:** 2026-06-17
**Type:** Dependency hygiene / chore (no product code, no UI)
**Status:** IMPLEMENTED — awaiting orchestrator final review

## Summary

Added `"overrides": { "import-in-the-middle": "3.0.1" }` (global) to `package.json` to resolve
all copies of `import-in-the-middle` to a single version. This eliminates the repeated
`import-in-the-middle can't be external` warnings from Next.js/Turbopack on `npm run dev`.

**This is an approved orchestrator exception** — see decision history below.

## Decision history

1. **Investigation:** found three incompatible major ranges (`^3.0.0`, `^2.0.x`, `^1.x`). Stopped
   and asked per kickoff rule.
2. **Orchestrator approved Option B** (scoped override targeting only `@fastify/otel` and
   `@prisma/instrumentation`).
3. **Option B proven infeasible:** three scoped override shapes were tested (direct scoping,
   deeper nesting, fresh lockfile generation). All failed — npm marks nested `2.0.6` as
   `invalid: "3.0.1"` but still installs 2.0.6; Turbopack warnings persist unchanged. Additionally,
   scoped overrides leak into the lighthouse subtree. See detailed findings below.
4. **Orchestrator approved Option A** (global override) as the only npm-native solution. Approved
   as a temporary dependency hygiene workaround, not a broad pattern.

## Why scoped overrides failed (Option B)

npm's `overrides` with nested package selectors cannot replace deeply nested transitive
dependencies. Three shapes were tested:

- `"@fastify/otel": { "import-in-the-middle": "3.0.1" }` — npm installs 2.0.6, marks `invalid`
- `"@fastify/otel": { "@opentelemetry/instrumentation": { "import-in-the-middle": "3.0.1" } }` — same result
- Full `rm -rf node_modules && npm install` — same result

In all cases, the nested copies persist at 2.0.6 with `invalid` status, and the override leaks
into the lighthouse tree regardless of the scoping syntax.

## Version compatibility analysis

| Consumer | Installed version | Declared IITM range | Forced to |
|---|---|---|---|
| `@opentelemetry/instrumentation` (root) | 0.214.0 | `^3.0.0` | 3.0.1 (native) |
| `@sentry/node-core` (10.x) | 10.53.1 | `^3.0.0` | 3.0.1 (native) |
| `@opentelemetry/instrumentation` (@fastify/otel) | 0.212.0 | `^2.0.6` | 3.0.1 (override) |
| `@opentelemetry/instrumentation` (@prisma) | 0.207.0 | `^2.0.0` | 3.0.1 (override) |
| `@opentelemetry/instrumentation` (lighthouse) | 0.57.2 | `^1.8.1` | 3.0.1 (override) |
| `@sentry/node-core` (lighthouse 9.x) | 9.47.1 | `^1.14.2` | 3.0.1 (override) |

Per the IITM CHANGELOG:
- **3.0.0**: sole breaking change = drop Node.js < 18 support. No API change. (Project uses Node 22.)
- **2.0.0**: sole breaking change = internal CJS→ESM in loader thread. No public API change.

Lighthouse is a `devDependency` (profiling tool). It never runs in the app server process and
does not produce the Turbopack warning. The override affects its self-contained dependency tree
but has no runtime impact on the application.

## Critical-flow-registry

No registered critical flow is touched (dependency dedupe, no product code).

## Verification results

### Step 1 — `npm ls import-in-the-middle`

All copies resolve to `3.0.1 deduped`. Zero `invalid` entries, zero second versions.
`@fastify/otel` and `@prisma/instrumentation` subtrees both show `3.0.1 deduped`.
Lighthouse subtree shows `3.0.1 deduped`.

### Step 2 — `npm run dev` (zero warnings)

```
▲ Next.js 15.5.18 (Turbopack)
✓ Starting...
✓ Compiled instrumentation Node.js in 479ms
✓ Compiled instrumentation Edge in 184ms
✓ Compiled middleware in 157ms
✓ Ready in 2.4s
○ Compiling /[locale] ...
✓ Compiled /[locale] in 4.4s
GET /en 200 in 5936ms
✓ Compiled /api/auth/me in 279ms
GET /api/auth/me 200 in 627ms
GET /en 200 in 288ms
```

Zero `import-in-the-middle can't be external` lines across startup, public page compile,
API route compile, and repeated post-compile request.

### Step 3 — `npx tsc --noEmit`

0 errors.

### Step 4 — `npm run build`

Passes. All routes compile.

### Step 5 — Instrumentation boot check

Dev server output confirms:
- `✓ Compiled instrumentation Node.js in 479ms`
- `✓ Compiled instrumentation Edge in 184ms`

No Sentry/OTel initialization failure, no new boot errors.

### Step 6 — `git diff --stat`

```
package-lock.json  | 260 +----
package.json       |   3 +
```

(Plus owner-modified docs/tasks files not part of this task.)

### Step 7 — `git diff -- package.json package-lock.json`

`package.json`:
```diff
+  "overrides": {
+    "import-in-the-middle": "3.0.1"
+  },
```

`package-lock.json`: removal of nested IITM `2.0.6` and `1.15.0` copies, all deduped to root `3.0.1`.

## Scope confirmation

- No product/runtime code changed.
- No `next.config` edits or warning suppression.
- No Sentry upgrade (remains 10.53.1).
- No unrelated dependency bumps (lockfile changes are limited to IITM deduplication).
- No mutating git commands run.

## AC-by-AC checklist

| AC | Status | Evidence |
|----|--------|----------|
| AC1 — No second IITM version under the two warning-producing paths | DONE | `npm ls` shows all copies → 3.0.1 deduped (global override; scoped was infeasible) |
| AC2 — Zero dev warnings across startup + 3 requests | DONE | Transcript above |
| AC3 — tsc + build pass | DONE | tsc clean, build passes |
| AC4 — Instrumentation init | DONE | Node.js + Edge instrumentation compiled |
| AC5 — Diff limited to package.json + package-lock.json | DONE | git diff --stat confirmed |
| AC6 — Session log + Files Changed | DONE | This file |

## Files Changed

| Path | Why |
|------|-----|
| `package.json` | Added global `overrides` pinning `import-in-the-middle` to `3.0.1` (approved orchestrator exception) |
| `package-lock.json` | Regenerated — all IITM copies deduped to 3.0.1 |
| `docs/backlog.md` | Task 450 status → IMPLEMENTED |
| `docs/sessions/2026-06-17-task450-dedupe-import-in-the-middle.md` | This session log |
