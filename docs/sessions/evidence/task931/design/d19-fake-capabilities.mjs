// Task 931 revision 3 design (Opus, read-only, 2026-11-02): which builder methods does src/tests/fakeSupabase.ts offer today,
// and which filter kinds does its `match` evaluate? Usage: node <this file>
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const text = readFileSync(resolve(ROOT, 'src/tests/fakeSupabase.ts'), 'utf8');
const chain = text.slice(text.indexOf('const chain'), text.indexOf('return chain\n  }'));
const methods = [...chain.matchAll(/^\s{6}([a-zA-Z]+):/gm)].map(m => m[1]);
const evaluated = [...text.matchAll(/if \(kind === '([a-z]+)'\) return (.+)$/gm)].map(m => `${m[1]}${m[2].startsWith('true') ? ' (always true)' : ''}`);
console.log(`builder methods (${methods.length}): ${methods.join(', ')}`);
console.log(`filter kinds evaluated by match: ${evaluated.join(', ')}`);
for (const wanted of ['lt', 'gt', 'like', 'ilike', 'match', 'contains', 'rpc', 'auth', 'storage']) console.log(`${wanted}: ${methods.includes(wanted) ? 'present' : 'absent'}`);
console.log(`unknown kind fallback returns true: ${/return true\n\s*\}\)/.test(text)}`);
console.log(`error injection option: ${/error\s*:\s*\{\s*message/.test(text) && /fail|inject/i.test(text) ? 'present' : 'absent'}`);
