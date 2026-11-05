// Writes fake.generated.ts: the real src/tests/fakeSupabase.ts plus what revision 4 asks of it (R6, R15): lt and gt, db.fail with a count, and columns, head, orders and range
// in the log. A throwaway for the prototype: the real change is the executor's. Each replacement must apply.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
let text = readFileSync('src/tests/fakeSupabase.ts', 'utf8');
const swap = (from, to) => { if (!text.includes(from)) throw new Error(`no: ${from}`); text = text.replace(from, to); };
swap("values?: unknown; affected: number }", "values?: unknown; affected: number; columns?: string; head?: boolean; orders?: { column: string; ascending: boolean }[]; range?: [number, number] | null; failed?: boolean }");
swap("let nextId = 1\n", "let nextId = 1\n  const failures: { table: string; op: string; error: unknown; count?: number | null; times: number }[] = []\n");
swap("let countOpt: { head?: boolean } | null = null\n", "let countOpt: { head?: boolean } | null = null\n    let columns: string | undefined\n");
swap("if (kind === 'or') return true", "if (kind === 'lt') return r[c] !== undefined && r[c] !== null && (r[c] as string | number) < (v as string | number)\n      if (kind === 'gt') return r[c] !== undefined && r[c] !== null && (r[c] as string | number) > (v as string | number)\n      if (kind === 'or') return true");
swap("let affected = 0\n", "const failure = failures.find((f) => f.table === table && f.op === op && f.times > 0)\n      if (failure) { failure.times -= 1; log.push({ table, op, filters: [...filters], values, affected: 0, columns, head: countOpt?.head, orders: [...orders], range: rangeOpt, failed: true }); return { data: null, count: failure.count, error: failure.error } as never }\n      let affected = 0\n");
swap("log.push({ table, op, filters: [...filters], values, affected })", "log.push({ table, op, filters: [...filters], values, affected, columns, head: countOpt?.head, orders: [...orders], range: rangeOpt })");
swap("select: (_cols?: string, opts?: { count?: string; head?: boolean }) => { if (opts?.count) countOpt = { head: opts.head }; return chain }", "select: (cols?: string, opts?: { count?: string; head?: boolean }) => { columns = cols; if (opts?.count) countOpt = { head: opts.head }; return chain }");
swap("lte: (c: string, v: unknown) => { filters.push([c, 'lte', v]); return chain },", "lte: (c: string, v: unknown) => { filters.push([c, 'lte', v]); return chain },\n      lt: (c: string, v: unknown) => { filters.push([c, 'lt', v]); return chain },\n      gt: (c: string, v: unknown) => { filters.push([c, 'gt', v]); return chain },");
swap("return { from, tables, log, client: { from } }", "const fail = (f: { table: string; op: string; error: unknown; count?: number | null; times?: number }) => { failures.push({ times: 1, ...f }) }\n  return { from, tables, log, fail, client: { from } }");
// Outside the tracked tree: tsconfig.json holds every .ts file but node_modules, so a prototype kept beside this file would enter the project's typecheck.
mkdirSync('test-results/task931-r4-proto', { recursive: true });
writeFileSync('test-results/task931-r4-proto/fake.generated.ts', text);
copyFileSync('docs/sessions/evidence/task931/design/r4-proto/holes.test.tsx.txt', 'test-results/task931-r4-proto/holes.test.tsx');
console.log('prototype written to test-results/task931-r4-proto');
