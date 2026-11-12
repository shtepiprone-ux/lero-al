#!/usr/bin/env node
/**
 * check-signed-in-pages.mjs — every signed-in page, for every role, on the running production build (Task 965).
 *
 * WHY: nothing checked signed-in pages on a build. `check-hydration-console.mjs` needs a session captured by hand and runs on `next dev`; the pages of a moderator, an agent
 * and a user were never walked, and `/admin/reports` and `/admin/support` threw React error 418 (a hydration mismatch) in production without any gate noticing.
 *
 * WHAT IT DOES (CI: the `click-shield` job, after `scripts/quality/ci-target.mjs`, with the production server on the DEVELOPMENT project):
 *   1. checks the route table against the `page.tsx` files of the repository (a page missing from the table fails, and so does a row without an expected result for a role);
 *   2. creates one user per role (admin, moderator with no permission key, agent, user) and one listing of the agent through `createRun()` of
 *      `src/tests/integration/fixtures.ts` — the code `npm run test:security-integration` uses: a password sign-in by a service-role caller, which Supabase's CAPTCHA
 *      protection lets through (Task 923 R154); Turnstile is not involved;
 *   3. puts each session into a browser as the `@supabase/ssr` auth cookie and opens every row of the table at each of the two widths (1280 and 390), each width a row of
 *      its own; a row fails on a status of 500 or more, a page error, a
 *      hydration message, or a final address that is not the expected one (an unexpected redirect, or a page where the role should have been sent away);
 *   4. READS ONLY: every request that is not GET, HEAD or OPTIONS is aborted before it leaves the browser, and counted;
 *   5. removes everything it created, whether the walk passed or failed, and the step fails if the clean-up leaves a row or cannot prove it left none.
 *
 * It can only run against a development project: `createRun()` refuses unless SECURITY_TEST_TARGET=development and SECURITY_TEST_PROJECT_REF names the project of the
 * Supabase URL, and the base URL must be this machine. Passwords, tokens and cookie values never reach the output.
 *
 * Usage (the server is already running):
 *   BASE_URL=http://127.0.0.1:3000 node scripts/check-signed-in-pages.mjs
 */

import { readdirSync } from 'node:fs';
import Module, { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from './lib/entry-point.mjs';
import { redactSensitive } from './lib/redact-log.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** The four roles of `UserRole` (`src/types/database.ts:1`). The moderator is created with no permission key granted. */
export const ROLES = ['admin', 'moderator', 'agent', 'user'];

/** The two widths of the Goal (the 418 was measured at both): the desktop table layout and a phone, where cards and sheets replace it below 640px. Each page is a row at each width. */
export const WIDTHS = [1280, 390];

// ── The route table ──────────────────────────────────────────────────────────

const PAGE = { kind: 'page' };
const NOT_FOUND = { kind: 'not-found' };
const redirectTo = (to) => ({ kind: 'redirect', to });

// A role that is not staff is sent from every admin route to the home page of the admin locale (`src/app/admin/layout.tsx:46`, default `en`).
const AWAY_FROM_ADMIN = redirectTo('/en');
const STAFF_ONLY = { admin: PAGE, moderator: PAGE, agent: AWAY_FROM_ADMIN, user: AWAY_FROM_ADMIN };
const STAFF_REDIRECT = (to) => ({ admin: redirectTo(to), moderator: redirectTo(to), agent: AWAY_FROM_ADMIN, user: AWAY_FROM_ADMIN });
// `src/app/admin/permissions/page.tsx:16`: a moderator gets `notFound()`.
const ADMIN_ONLY = { admin: PAGE, moderator: NOT_FOUND, agent: AWAY_FROM_ADMIN, user: AWAY_FROM_ADMIN };
const EVERY_SIGNED_IN_ROLE = { admin: PAGE, moderator: PAGE, agent: PAGE, user: PAGE };
// `src/app/[locale]/cabinet/statistics/page.tsx:38`: only an agent sees the dashboard.
const AGENT_ONLY = { admin: redirectTo('/sq/cabinet'), moderator: redirectTo('/sq/cabinet'), agent: PAGE, user: redirectTo('/sq/cabinet') };
// `src/app/[locale]/listings/[slug]/edit/page.tsx:96`: the owner and staff edit; anyone else is sent to the listing.
const OWNER_OR_STAFF = { admin: PAGE, moderator: PAGE, agent: PAGE, user: redirectTo('/sq/listings/{listingSlug}') };

/**
 * One row per `page.tsx`. `path` is what the browser opens; `{userId}`, `{listingId}` and `{listingSlug}` are the run's user and the run agent's listing. `expect` states, for each
 * role, the page, the redirect that role gets (the final address), or the not-found page.
 */
export const ROUTES = [
  { page: 'src/app/admin/page.tsx', path: '/admin', expect: STAFF_ONLY },
  { page: 'src/app/admin/companies/page.tsx', path: '/admin/companies', expect: STAFF_ONLY },
  { page: 'src/app/admin/currency/page.tsx', path: '/admin/currency', expect: STAFF_ONLY },
  { page: 'src/app/admin/email-templates/page.tsx', path: '/admin/email-templates', expect: STAFF_ONLY },
  { page: 'src/app/admin/footer/page.tsx', path: '/admin/footer', expect: STAFF_ONLY },
  { page: 'src/app/admin/inquiries/page.tsx', path: '/admin/inquiries', expect: STAFF_REDIRECT('/admin/inquiries/support') },
  { page: 'src/app/admin/inquiries/sales/page.tsx', path: '/admin/inquiries/sales', expect: STAFF_ONLY },
  { page: 'src/app/admin/inquiries/support/page.tsx', path: '/admin/inquiries/support', expect: STAFF_ONLY },
  { page: 'src/app/admin/legal/page.tsx', path: '/admin/legal', expect: STAFF_REDIRECT('/admin/pages') },
  { page: 'src/app/admin/listings/page.tsx', path: '/admin/listings', expect: STAFF_ONLY },
  { page: 'src/app/admin/listings/[id]/preview/page.tsx', path: '/admin/listings/{listingId}/preview', expect: STAFF_ONLY },
  { page: 'src/app/admin/locations/page.tsx', path: '/admin/locations', expect: STAFF_ONLY },
  { page: 'src/app/admin/pages/page.tsx', path: '/admin/pages', expect: STAFF_ONLY },
  { page: 'src/app/admin/permissions/page.tsx', path: '/admin/permissions', expect: ADMIN_ONLY },
  { page: 'src/app/admin/popular-locations/page.tsx', path: '/admin/popular-locations', expect: STAFF_ONLY },
  { page: 'src/app/admin/property-types/page.tsx', path: '/admin/property-types', expect: STAFF_ONLY },
  { page: 'src/app/admin/reports/page.tsx', path: '/admin/reports', expect: STAFF_ONLY },
  { page: 'src/app/admin/settings/page.tsx', path: '/admin/settings', expect: STAFF_ONLY },
  { page: 'src/app/admin/support/page.tsx', path: '/admin/support', expect: STAFF_ONLY },
  { page: 'src/app/admin/users/page.tsx', path: '/admin/users', expect: STAFF_ONLY },
  { page: 'src/app/admin/users/new/page.tsx', path: '/admin/users/new', expect: STAFF_ONLY },
  { page: 'src/app/admin/users/[id]/page.tsx', path: '/admin/users/{userId}', expect: STAFF_ONLY },
  { page: 'src/app/[locale]/cabinet/page.tsx', path: '/sq/cabinet', expect: EVERY_SIGNED_IN_ROLE },
  { page: 'src/app/[locale]/cabinet/statistics/page.tsx', path: '/sq/cabinet/statistics', expect: AGENT_ONLY },
  { page: 'src/app/[locale]/favorites/page.tsx', path: '/sq/favorites', expect: EVERY_SIGNED_IN_ROLE },
  { page: 'src/app/[locale]/listings/create/page.tsx', path: '/sq/listings/create', expect: EVERY_SIGNED_IN_ROLE },
  { page: 'src/app/[locale]/listings/[slug]/edit/page.tsx', path: '/sq/listings/{listingSlug}/edit', expect: OWNER_OR_STAFF },
];

/** The folders whose pages the table must cover (Task 965 scope): `/admin`, the cabinet, favorites, listing create and listing edit. */
const PAGE_ROOTS = [
  'src/app/admin',
  'src/app/[locale]/cabinet',
  'src/app/[locale]/favorites',
  'src/app/[locale]/listings/create',
  'src/app/[locale]/listings/[slug]/edit',
];
const PAGE_FILE = /^page\.(tsx|ts|jsx|js)$/;

/** Every page file under the covered folders, as sorted repository-relative paths with forward slashes. */
export function listPages(root = REPO_ROOT) {
  const found = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(path.join(root, dir), { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const child = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(child);
      else if (PAGE_FILE.test(entry.name)) found.push(child);
    }
  };
  for (const folder of PAGE_ROOTS) walk(folder);
  return found.sort();
}

/** Problems of the table itself: a page without a row, a row without a page, a page listed twice, a role without an expected result. Empty when the table is complete. */
export function checkRouteTable(routes, pages) {
  const problems = [];
  const seen = new Set();
  for (const row of routes) {
    if (seen.has(row.page)) problems.push(`page listed twice in the route table: ${row.page}`);
    seen.add(row.page);
    if (!pages.includes(row.page)) problems.push(`route table row has no page: ${row.path} (${row.page})`);
    for (const role of ROLES) {
      const expectation = row.expect?.[role];
      if (!expectation || !['page', 'redirect', 'not-found'].includes(expectation.kind)) problems.push(`route table row ${row.path} has no expected result for ${role}`);
      else if (expectation.kind === 'redirect' && !expectation.to) problems.push(`route table row ${row.path} has a redirect for ${role} with no target`);
    }
  }
  for (const page of pages) if (!seen.has(page)) problems.push(`page missing from the route table: ${page}`);
  return problems;
}

/** Fills `{userId}`, `{listingId}` and `{listingSlug}`; a placeholder with no value throws, so a missing fixture is a failure, never a request for "undefined". */
export function resolveTemplate(template, params) {
  return template.replace(/\{(\w+)\}/g, (_match, name) => {
    const value = params?.[name];
    if (typeof value !== 'string' || value === '') throw new Error(`the run has no ${name}`);
    return encodeURIComponent(value);
  });
}

// ── Judging one visit ────────────────────────────────────────────────────────

// React strips the readable hydration warnings from a production build, so the minified error numbers count too: 418 (text differs), 419, 422, 423, 425.
const HYDRATION_PATTERNS = [
  /hydrat(?:ion|ing|ed)/i,
  /Minified React error #(?:418|419|422|423|425)\b/,
  /did not match|didn't match/i,
  /cannot be a descendant of|cannot contain a nested|validateDOMNesting/i,
];

const clip = (text) => String(text).replace(/\s+/g, ' ').slice(0, 300);

/**
 * @param {{ row: { path: string; expect: Record<string, { kind: string; to?: string }> }, role: string, params: Record<string, string>, observed: object }} visit
 * @returns {string[]} what is wrong with this visit; empty when the row passes
 */
export function judgeVisit({ row, role, params, observed }) {
  const failures = [];
  if (observed.navigationError) return [`navigation failed: ${clip(observed.navigationError)}`];

  const status = observed.status;
  if (typeof status === 'number' && status >= 500) failures.push(`status ${status}`);
  for (const error of observed.pageErrors ?? []) failures.push(`page error: ${clip(error)}`);
  for (const message of observed.consoleErrors ?? []) {
    if (HYDRATION_PATTERNS.some((pattern) => pattern.test(message))) failures.push(`hydration message: ${clip(message)}`);
  }

  const expectation = row.expect[role];
  const requested = resolveTemplate(row.path, params);
  const wanted = expectation.kind === 'redirect' ? resolveTemplate(expectation.to, params) : requested;
  if (observed.finalPath !== wanted) failures.push(`unexpected redirect: wanted ${wanted}, got ${observed.finalPath}`);
  if (expectation.kind === 'not-found') {
    if (status !== 404 && !(typeof status === 'number' && status >= 500)) failures.push(`status ${status} where the not-found page was expected`);
  } else if (typeof status === 'number' ? status >= 400 && status < 500 : true) {
    failures.push(`status ${status} where the page was expected`);
  }
  return failures;
}

// ── Reading only ─────────────────────────────────────────────────────────────

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Routes every request of a browser context: GET, HEAD and OPTIONS go on, anything else is aborted before it is sent and counted (the review walk of Task 952 did the same).
 * The list keeps the method and the path only — a query string can carry a token.
 */
export async function installReadOnlyGuard(context) {
  const blocked = [];
  await context.route('**/*', async (route) => {
    const request = route.request();
    const method = String(request.method()).toUpperCase();
    if (READ_METHODS.has(method)) {
      await route.continue();
      return;
    }
    let where = 'request';
    try {
      where = new URL(request.url()).pathname;
    } catch {
      // an address that cannot be read stays "request": it is aborted all the same
    }
    blocked.push(`${method} ${where}`);
    await route.abort('blockedbyclient');
  });
  return { blocked: () => [...blocked] };
}

// ── The browser ──────────────────────────────────────────────────────────────

const NAVIGATION_TIMEOUT_MS = 60_000;
const SETTLE_MS = 2_000; // after the load event: hydration, then any client-side redirect
const CLOSE_TIMEOUT_MS = 15_000;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const VIEWPORT_HEIGHT = 900;

async function visitPage(context, guard, base, requested, width) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error?.message ?? error)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  const blockedBefore = guard.blocked().length;
  let status = null;
  let finalPath = null;
  let navigationError = null;
  try {
    const response = await page.goto(`${base}${requested}`, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS });
    status = response ? response.status() : null;
    await page.waitForTimeout(SETTLE_MS);
    finalPath = new URL(page.url()).pathname;
  } catch (error) {
    navigationError = String(error?.message ?? error);
  }
  try {
    await withTimeout(page.close(), CLOSE_TIMEOUT_MS, 'page.close');
  } catch {
    // a page that will not close is left to the browser's own close below
  }
  return { status, finalPath, pageErrors, consoleErrors, navigationError, blockedWrites: guard.blocked().length - blockedBefore, blockedList: guard.blocked().slice(blockedBefore) };
}

/** The real browser: one context per role, the session cookie in it, the read-only guard on it. */
export async function playwrightBrowser({ base, chromium }) {
  const browser = await chromium.launch();
  return {
    async openSession(_role, cookies) {
      const context = await browser.newContext();
      await context.addCookies(cookies.map((cookie) => ({ name: cookie.name, value: cookie.value, url: base })));
      const guard = await installReadOnlyGuard(context);
      return {
        visit: (requested, width) => visitPage(context, guard, base, requested, width),
        blocked: () => guard.blocked(),
        close: () => withTimeout(context.close(), CLOSE_TIMEOUT_MS, 'context.close'),
      };
    },
    close: () => withTimeout(browser.close(), CLOSE_TIMEOUT_MS, 'browser.close'),
  };
}

// ── The run ──────────────────────────────────────────────────────────────────

const errorText = (error) => String(error?.message ?? error);

/**
 * @param {{
 *   createRun: () => { makeUser: Function, makeListing: Function, cleanup: Function },
 *   launchBrowser: () => Promise<{ openSession: Function, close: Function }>,
 *   buildCookies: (session: { accessToken: string, refreshToken: string }) => Promise<{ name: string, value: string }[]>,
 *   routes?: object[], pages: string[], log?: (line: string) => void }} deps
 * @returns {Promise<{ ok: boolean, rows: { role: string, path: string, width: number, ok: boolean, failures: string[] }[], blockedWrites: number, cleanup: object | null }>}
 */
export async function runCheck({ createRun, launchBrowser, buildCookies, routes = ROUTES, pages, log = console.log }) {
  const secrets = [];
  const emit = (line) => log(redactSensitive(line, secrets));
  const rows = [];

  // 1. the table: nothing is created for a table that is wrong
  const tableProblems = checkRouteTable(routes, pages);
  if (tableProblems.length > 0) {
    for (const problem of tableProblems) emit(`FAIL route table: ${problem}`);
    return { ok: false, rows, blockedWrites: 0, cleanup: null };
  }

  // 2. the target: a refused run has created nothing, so there is nothing to clean
  let run;
  try {
    run = createRun();
  } catch (error) {
    emit(`ERROR the walk did not start: ${errorText(error)}`);
    return { ok: false, rows, blockedWrites: 0, cleanup: null };
  }

  let walkError = null;
  let browser = null;
  const sessions = {};
  const sessionProblems = {};
  const params = {};
  try {
    // 3. one user per role, one listing of the agent
    const users = {};
    for (const role of ROLES) {
      try {
        users[role] = await run.makeUser(`walk_${role}`, role === 'user' ? {} : { role });
        secrets.push(users[role].accessToken, users[role].refreshToken, users[role].password);
        const cookies = await buildCookies({ accessToken: users[role].accessToken, refreshToken: users[role].refreshToken });
        for (const cookie of cookies) secrets.push(cookie.value);
        sessions[role] = cookies;
      } catch (error) {
        sessionProblems[role] = errorText(error);
      }
    }
    if (users.user) params.userId = users.user.id;
    if (users.agent) {
      try {
        const listing = await run.makeListing(users.agent.id, 'active', 'walk');
        params.listingId = listing.id;
        params.listingSlug = listing.slug;
      } catch (error) {
        emit(`ERROR the agent's listing could not be created: ${errorText(error)}`);
      }
    }

    // 4. the walk
    browser = await launchBrowser();
    for (const role of ROLES) {
      if (!sessions[role]) {
        for (const row of routes) {
          for (const width of WIDTHS) rows.push({ role, path: row.path, width, ok: false, failures: [`no session for ${role}: ${sessionProblems[role] ?? 'not created'}`], status: null, finalPath: null, blockedWrites: 0 });
        }
        continue;
      }
      const session = await browser.openSession(role, sessions[role]);
      try {
        for (const row of routes) {
          for (const width of WIDTHS) {
            let failures;
            let observed = null;
            try {
              const requested = resolveTemplate(row.path, params);
              observed = await session.visit(requested, width);
              failures = judgeVisit({ row, role, params, observed });
            } catch (error) {
              failures = [`the visit could not be made: ${errorText(error)}`];
            }
            rows.push({ role, path: row.path, width, ok: failures.length === 0, failures, status: observed?.status ?? null, finalPath: observed?.finalPath ?? null, blockedWrites: observed?.blockedWrites ?? 0, blockedList: observed?.blockedList ?? [] });
          }
        }
      } finally {
        await session.close().catch(() => {});
      }
    }
  } catch (error) {
    walkError = error;
    emit(`ERROR the walk stopped: ${errorText(error)}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  // 5. the clean-up runs whether the walk passed, failed or threw, and its result is part of the verdict
  let cleanup;
  try {
    cleanup = await run.cleanup();
  } catch (error) {
    cleanup = { verified: false, remaining: -1, errors: [`clean-up threw: ${errorText(error)}`] };
  }

  for (const row of rows) {
    emit(row.ok ? `PASS ${row.role} ${row.path} @${row.width} -> ${row.status} ${row.finalPath}` : `FAIL ${row.role} ${row.path} @${row.width}: ${row.failures.join('; ')}`);
  }
  for (const role of ROLES) {
    const own = rows.filter((row) => row.role === role);
    emit(`${role}: ${own.length} rows, ${own.filter((row) => row.ok).length} passed`);
  }
  const blockedWrites = rows.reduce((sum, row) => sum + row.blockedWrites, 0);
  if (blockedWrites > 0) {
    emit(`${blockedWrites} write requests aborted (the walk only reads)`);
    const byRequest = new Map();
    for (const request of rows.flatMap((row) => row.blockedList ?? [])) byRequest.set(request, (byRequest.get(request) ?? 0) + 1);
    for (const [request, count] of [...byRequest].sort((a, b) => b[1] - a[1]).slice(0, 10)) emit(`  ${request} x${count}`);
  }
  const left = cleanup.remaining < 0 ? '?' : String(cleanup.remaining);
  emit(`clean-up: ${cleanup.verified ? 'verified' : 'NOT verified'}, ${left} rows left`);
  for (const error of cleanup.errors ?? []) emit(`  clean-up error: ${error}`);

  const ok = walkError === null && rows.every((row) => row.ok) && cleanup.verified === true;
  emit(ok ? `signed-in pages: ${rows.length} rows passed` : `signed-in pages: FAILED (${rows.filter((row) => !row.ok).length} of ${rows.length} rows${cleanup.verified ? '' : ', clean-up not verified'})`);
  return { ok, rows, blockedWrites, cleanup };
}

// ── Entry point ──────────────────────────────────────────────────────────────

/** The walk opens test users on a development project: it never opens a site that is not this machine. */
export function assertLocalBase(base) {
  let url;
  try {
    url = new URL(base);
  } catch {
    throw new Error('BASE_URL is not a URL');
  }
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('BASE_URL must be this machine (127.0.0.1 or localhost)');
  return url.origin;
}

/**
 * The fixtures are TypeScript with `@/` imports and `import 'server-only'`. `tsx` reads the first. The second names a package that is not installed (Next.js
 * answers it itself) and `tsx` loads the file as CommonJS, so the resolver answers it with the empty stub Vitest uses for the same import
 * (`src/tests/server-only-stub.ts`).
 */
async function loadFixtures() {
  const { register: registerTsx } = await import('tsx/cjs/api');
  registerTsx();
  const stub = path.join(REPO_ROOT, 'src/tests/server-only-stub.ts');
  const resolveFilename = Module._resolveFilename;
  Module._resolveFilename = function resolveServerOnly(request, ...rest) {
    return request === 'server-only' ? stub : resolveFilename.call(this, request, ...rest);
  };
  return createRequire(import.meta.url)(path.join(REPO_ROOT, 'src/tests/integration/fixtures.ts'));
}

async function main() {
  const base = assertLocalBase(process.env.BASE_URL ?? 'http://127.0.0.1:3000');
  const { chromium } = await import('playwright');
  const { createServerClient } = await import('@supabase/ssr');
  const fixtures = await loadFixtures();

  let current = null;
  const createRun = () => {
    current = fixtures.createRun();
    return current;
  };
  // The auth cookie is written by the library that reads it (name, encoding, chunks), never rebuilt here.
  const buildCookies = async ({ accessToken, refreshToken }) => {
    const written = new Map();
    const client = createServerClient(current.env.url, current.env.anonKey, {
      cookies: {
        getAll: () => [],
        setAll: (list) => {
          for (const cookie of list) written.set(cookie.name, cookie.value);
        },
      },
    });
    const { error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw new Error('the session could not be turned into a cookie');
    const cookies = [...written].filter(([, value]) => value !== '').map(([name, value]) => ({ name, value }));
    if (cookies.length === 0) throw new Error('the session produced no cookie');
    return cookies;
  };

  const result = await runCheck({ createRun, launchBrowser: () => playwrightBrowser({ base, chromium }), buildCookies, pages: listPages(REPO_ROOT) });
  return result.ok ? 0 : 1;
}

// Importing this module (the unit test) starts nothing: run only when it is the entry point.
if (isEntryPoint(import.meta.url)) {
  main().then(
    (code) => process.exit(code),
    (error) => {
      console.error(`signed-in pages: the check crashed: ${redactSensitive(errorText(error))}`);
      process.exit(1);
    },
  );
}
