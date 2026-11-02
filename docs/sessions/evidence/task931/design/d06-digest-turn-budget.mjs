// Task 931 revision 3 (Opus, read-only, 2026-11-02): how many setImmediate turns does a WebCrypto SHA-256 digest take
// before it resolves, cold (first call in the process) and warm, with the libuv thread pool idle and busy?
// The Google sign-in tests wait at most 500 turns for the window to open, and the attempt hashes its nonce first.
// Usage: node <this file> [busy]
import { pbkdf2 } from 'node:crypto';

const busy = process.argv[2] === 'busy';
async function turnsUntil(promise) {
  let done = false; promise.then(() => { done = true });
  let turns = 0; const started = process.hrtime.bigint();
  while (!done && turns < 1e6) { await new Promise(resolve => setImmediate(resolve)); turns++ }
  return { turns, ms: Number(process.hrtime.bigint() - started) / 1e6 };
}
if (busy) for (let i = 0; i < 8; i++) pbkdf2('x', 'y', 300000, 64, 'sha512', () => {}); // occupies the 4 pool threads
const data = new TextEncoder().encode('nonce');
const cold = await turnsUntil(crypto.subtle.digest('SHA-256', data));
const warm = [];
for (let i = 0; i < 5; i++) warm.push(await turnsUntil(crypto.subtle.digest('SHA-256', data)));
console.log(`thread pool ${busy ? 'busy' : 'idle'}; cold digest: ${cold.turns} turns, ${cold.ms.toFixed(2)} ms; warm: ${warm.map(w => w.turns).join(', ')} turns; budget in the tests: 500 turns`);
