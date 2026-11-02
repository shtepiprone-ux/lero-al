// Task 931 revision 3 design (Opus, read-only probe, 2026-11-02): a preload that keeps the libuv thread pool of every Vitest
// worker busy, for the class A reproduction. Loaded with NODE_OPTIONS=--import=<file URL of this file>; no project file changes.
// It re-submits eight PBKDF2 jobs (four pool threads by default) for at most BUSY_POOL_MS milliseconds (default 120000).
import { pbkdf2 } from 'node:crypto';

const until = Date.now() + Number(process.env.BUSY_POOL_MS || 120000);
function job() {
  if (Date.now() > until) return;
  pbkdf2('x', 'y', 300000, 64, 'sha512', () => job());
}
for (let i = 0; i < 8; i++) job();
process.stderr.write(`[busy-pool] pid ${process.pid}: eight PBKDF2 jobs re-submitted until ${new Date(until).toISOString()}\n`);
