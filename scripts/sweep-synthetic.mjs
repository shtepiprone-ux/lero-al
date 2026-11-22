#!/usr/bin/env node
/**
 * Removes the synthetic users and listings a CI run that was cancelled or killed left behind (Task 957, O957-5).
 *
 * The integration suites and the signed-in walk create users and listings that carry the run prefix `zz_synth_<8 base-36 time><4 hex>` (`src/tests/integration/fixtures.ts`) and delete them in
 * process at the end. A pull-request run is cancelled when a newer commit arrives, so that clean-up may never run. This script is the step that always runs (`if: always()`):
 *  - the prefixes the job wrote to `SYNTHETIC_RUN_LOG` are removed at any age;
 *  - every prefix of the exact shape found in an auth e-mail (`<prefix>_<tag>@example.com`) or a listing slug (`<prefix>-<tag>`) whose time is MORE than two hours old is removed too
 *    (a job lasts at most 30 minutes, so a younger prefix may belong to a run in progress);
 *  - anything that is not of that exact shape (`walk_agent@example.com`, `zz_synthx…`, a real address) is never read for deletion.
 * Each prefix goes through `removeRun` of the fixtures: the same order and the same verified clean-up the suites use. It starts only through `loadIntegrationEnv()`: the approved DEVELOPMENT
 * project, confirmed by its ref (`src/tests/integration/environment.ts`). It prints counts and prefixes only. Exit 1 when a read fails (nothing is deleted then), the target is refused or a
 * removal leaves anything. `--dry-run` only reads and lists.
 *
 * Run: SECURITY_TEST_TARGET=development SECURITY_TEST_PROJECT_REF=<ref> node scripts/sweep-synthetic.mjs [--dry-run]
 */
import { existsSync, readFileSync } from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from './lib/entry-point.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIME_AND_HEX = 'zz_synth_[0-9a-z]{8}[0-9a-f]{4}';

/** the exact shape of a run prefix */
export const PREFIX_SHAPE = new RegExp(`^${TIME_AND_HEX}$`);
const EMAIL_PREFIX = new RegExp(`^(${TIME_AND_HEX})_.+@example\\.com$`);
const SLUG_PREFIX = new RegExp(`^(${TIME_AND_HEX})-`);
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/** The prefixes of a run log: one per line, only a line that is exactly a prefix counts (the log can never name a person). */
export function parseRunLog(text) {
  if (typeof text !== 'string') return [];
  return [...new Set(text.split(/\r?\n/).map((line) => line.trim()).filter((line) => PREFIX_SHAPE.test(line)))];
}

/** The time a prefix was made at: its 8 base-36 characters are `Date.now().toString(36)`. */
function prefixTime(prefix) {
  return Number.parseInt(prefix.slice('zz_synth_'.length, 'zz_synth_'.length + 8), 36);
}

/**
 * The sweep, with every outside thing handed in (so the test needs no database): `loadEnv` (the development-target guard), `readEmails` / `readSlugs` (read-only), `removeRun`, `readLog`.
 * @param {{
 *   argv?: string[],
 *   loadEnv: () => unknown,
 *   readEmails: (env: any) => Promise<string[]>,
 *   readSlugs: (env: any) => Promise<string[]>,
 *   removeRun: (prefix: string) => Promise<{ verified: boolean, remaining: number, errors?: string[] }>,
 *   readLog: () => string | null,
 *   now?: () => number,
 *   out?: (line: string) => void,
 * }} deps
 * @returns {Promise<{ exitCode: number, prefixes: string[] }>}
 */
export async function runSweep({ argv = [], loadEnv, readEmails, readSlugs, removeRun, readLog, now = () => Date.now(), out = console.log }) {
  const dryRun = argv.includes('--dry-run');

  // the target is judged before anything is read
  let env;
  try {
    env = loadEnv();
  } catch {
    out('sweep-synthetic: refused: this is not the approved development project (SECURITY_TEST_TARGET and SECURITY_TEST_PROJECT_REF must name it)');
    return { exitCode: 1, prefixes: [] };
  }

  let logged;
  try {
    logged = parseRunLog(readLog());
  } catch {
    out('sweep-synthetic: the run log could not be read');
    return { exitCode: 1, prefixes: [] };
  }

  // every read first: a read that fails removes nothing
  let emails;
  let slugs;
  try {
    emails = await readEmails(env);
  } catch {
    out('sweep-synthetic: the read of the accounts failed; nothing was removed');
    return { exitCode: 1, prefixes: [] };
  }
  try {
    slugs = await readSlugs(env);
  } catch {
    out('sweep-synthetic: the read of the listings failed; nothing was removed');
    return { exitCode: 1, prefixes: [] };
  }

  const found = new Set(logged);
  const cutoff = now() - TWO_HOURS_MS;
  for (const [list, shape] of [[emails, EMAIL_PREFIX], [slugs, SLUG_PREFIX]]) {
    for (const value of list) {
      const match = typeof value === 'string' ? shape.exec(value) : null;
      if (match && prefixTime(match[1]) < cutoff) found.add(match[1]);
    }
  }
  const prefixes = [...found].sort();
  out(`sweep-synthetic: ${logged.length} logged, ${prefixes.length} to remove${dryRun ? ' (dry run)' : ''}`);

  if (dryRun) {
    for (const prefix of prefixes) out(`  would remove ${prefix}`);
    return { exitCode: 0, prefixes };
  }

  let failures = 0;
  for (const prefix of prefixes) {
    let result;
    try {
      result = await removeRun(prefix);
    } catch {
      result = { verified: false, remaining: -1, errors: ['threw'] };
    }
    if (result.verified) out(`  ${prefix}: removed, verified`);
    else {
      failures += 1;
      out(`  ${prefix}: NOT verified, ${result.remaining < 0 ? '?' : result.remaining} left, ${(result.errors ?? []).length} error(s)`);
    }
  }
  out(failures === 0 ? `sweep-synthetic: ${prefixes.length} run(s) removed` : `sweep-synthetic: FAILED for ${failures} of ${prefixes.length} run(s)`);
  return { exitCode: failures === 0 ? 0 : 1, prefixes };
}

// ── Entry point ──────────────────────────────────────────────────────────────

/**
 * The fixtures are TypeScript with `@/` imports and `import 'server-only'`: `tsx` reads the first, and the resolver answers the second with the empty stub Vitest uses for the same import
 * (`src/tests/server-only-stub.ts`), as `scripts/check-signed-in-pages.mjs` does.
 */
async function loadModules() {
  const { register: registerTsx } = await import('tsx/cjs/api');
  registerTsx();
  const stub = path.join(REPO_ROOT, 'src/tests/server-only-stub.ts');
  const resolveFilename = Module._resolveFilename;
  Module._resolveFilename = function resolveServerOnly(request, ...rest) {
    return request === 'server-only' ? stub : resolveFilename.call(this, request, ...rest);
  };
  const require = createRequire(import.meta.url);
  return {
    fixtures: require(path.join(REPO_ROOT, 'src/tests/integration/fixtures.ts')),
    environment: require(path.join(REPO_ROOT, 'src/tests/integration/environment.ts')),
    escape: require(path.join(REPO_ROOT, 'src/lib/postgrest/escape.ts')),
  };
}

async function main() {
  const { fixtures, environment, escape } = await loadModules();
  const { createClient } = await import('@supabase/supabase-js');
  const clientOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const admin = (env) => createClient(env.url, env.serviceKey, clientOptions);
  const logFile = process.env.SYNTHETIC_RUN_LOG;
  let env = null;

  return runSweep({
    argv: process.argv.slice(2),
    loadEnv: () => {
      env = environment.loadIntegrationEnv();
      return env;
    },
    readLog: () => (logFile && existsSync(logFile) ? readFileSync(logFile, 'utf8') : null),
    readEmails: async (confirmed) => {
      const client = admin(confirmed);
      const emails = [];
      for (let page = 1; page <= 100; page++) {
        const list = await client.auth.admin.listUsers({ page, perPage: 200 });
        if (list.error) throw new Error('listUsers failed');
        for (const user of list.data.users) if (user.email) emails.push(user.email);
        if (list.data.users.length < 200) return emails;
      }
      throw new Error('more accounts than the sweep reads');
    },
    readSlugs: async (confirmed) => {
      const client = admin(confirmed);
      const slugs = [];
      const pattern = `${escape.escapeLike('zz_synth_')}%`;
      for (let from = 0; ; from += 1000) {
        const { data, error } = await client.from('listings').select('slug').like('slug', pattern).order('slug').range(from, from + 999);
        if (error) throw new Error('listings read failed');
        for (const row of data ?? []) slugs.push(row.slug);
        if ((data ?? []).length < 1000) return slugs;
      }
    },
    removeRun: (prefix) => fixtures.removeRun(admin(env), prefix),
  });
}

// Importing this module (the unit test) starts nothing: run only when it is the entry point.
if (isEntryPoint(import.meta.url)) {
  main().then(
    (result) => process.exit(result.exitCode),
    () => {
      console.error('sweep-synthetic: the sweep crashed');
      process.exit(1);
    },
  );
}
