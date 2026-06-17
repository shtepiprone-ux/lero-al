#!/usr/bin/env node
/**
 * capture-admin-session.mjs — Playwright-based authenticated admin session capture.
 *
 * Logs in as a dedicated local/non-prod admin using env-supplied credentials,
 * captures the authenticated session as a Playwright storageState file, and writes
 * it to a git-ignored path. Re-running refreshes the session.
 *
 * NO credential or captured artifact is ever committed — the output path is
 * covered by .gitignore (playwright/.auth/).
 *
 * Usage:
 *   # Set credentials in .env.local (git-ignored):
 *   #   HYDRATION_ADMIN_EMAIL=admin@example.com
 *   #   HYDRATION_ADMIN_PASSWORD=your-password
 *
 *   # Then run against a local dev server:
 *   BASE_URL=http://localhost:3000 node scripts/capture-admin-session.mjs
 *   npm run capture:admin-session
 *
 * Output:
 *   playwright/.auth/admin-storage-state.json  (git-ignored)
 *
 * Added by Task 451 (Epic RS Slice 6b, 2026-06-17).
 */

import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Load .env.local if present (for credential env vars) ─────────────────────

const envLocalPath = resolve(ROOT, '.env.local');
if (existsSync(envLocalPath)) {
  const lines = readFileSync(envLocalPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const ADMIN_EMAIL = process.env.HYDRATION_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.HYDRATION_ADMIN_PASSWORD || '';
const OUTPUT_DIR = resolve(ROOT, 'playwright', '.auth');
const OUTPUT_PATH = resolve(OUTPUT_DIR, 'admin-storage-state.json');

// ── Validate credentials ─────────────────────────────────────────────────────

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('\n❌ capture-admin-session: missing credentials.\n');
  console.error('   Set HYDRATION_ADMIN_EMAIL and HYDRATION_ADMIN_PASSWORD in .env.local');
  console.error('   or export them as environment variables.\n');
  console.error('   Example .env.local entry:');
  console.error('     HYDRATION_ADMIN_EMAIL=admin@yourdomain.com');
  console.error('     HYDRATION_ADMIN_PASSWORD=your-password\n');
  process.exit(1);
}

// ── Capture ──────────────────────────────────────────────────────────────────

async function capture() {
  console.log('\n🔐 capture-admin-session');
  console.log(`   Target:  ${BASE_URL}`);
  console.log(`   Email:   ${ADMIN_EMAIL.slice(0, 3)}***`);
  console.log(`   Output:  ${OUTPUT_PATH}\n`);

  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the app — the login button is in the Header
    console.log('   [1/4] Navigating to app…');
    await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded', timeout: 15_000 });

    // Click the Login button in the header to open the AuthSheet
    console.log('   [2/4] Opening login form…');
    const loginBtn = page.getByRole('button', { name: /login|hyr|увійти|accedi/i });
    await loginBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await loginBtn.click();

    // Fill the login form
    console.log('   [3/4] Filling credentials…');
    const emailInput = page.locator('#login-email');
    await emailInput.waitFor({ state: 'visible', timeout: 5_000 });
    await emailInput.fill(ADMIN_EMAIL);

    const passwordInput = page.locator('#login-password');
    await passwordInput.fill(ADMIN_PASSWORD);

    // Submit the form
    const submitBtn = page.locator('form button[type="submit"]').first();
    await submitBtn.click();

    // Wait for authentication: the login sheet closes and the page refreshes.
    // We detect success by waiting for the auth sheet to disappear and for
    // an authenticated indicator (e.g. user avatar or profile link) to appear,
    // OR by waiting for the navigation/refresh that follows successful signIn.
    console.log('   [4/4] Waiting for authentication…');

    // Wait for the login form to disappear (sheet closes on success)
    await emailInput.waitFor({ state: 'hidden', timeout: 15_000 });

    // Give the auth middleware a moment to set cookies
    await page.waitForTimeout(2_000);

    // Verify we got auth cookies
    const cookies = await context.cookies();
    const authCookies = cookies.filter(c => c.name.includes('auth-token'));
    if (authCookies.length === 0) {
      console.error('\n❌ Login appeared to succeed but no auth cookies were captured.');
      console.error('   Check that the credentials are correct and the user has admin role.\n');
      await browser.close();
      process.exit(1);
    }

    // Save the storage state
    mkdirSync(OUTPUT_DIR, { recursive: true });
    await context.storageState({ path: OUTPUT_PATH });

    console.log(`\n✅ Admin session captured (${authCookies.length} auth cookie(s))`);
    console.log(`   Saved to: ${OUTPUT_PATH}\n`);
    console.log('   Next step — run the admin hydration check:');
    console.log(`   HYDRATION_GATE_STORAGE_STATE=${OUTPUT_PATH} \\`);
    console.log(`     HYDRATION_ADMIN_USER_ID=<real-uuid> \\`);
    console.log(`     BASE_URL=${BASE_URL} \\`);
    console.log('     npm run check:hydration -- --with-admin\n');
  } catch (err) {
    console.error(`\n❌ capture-admin-session failed: ${err.message}\n`);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
}

capture().catch(err => {
  console.error('\ncapture-admin-session.mjs: fatal error\n', err);
  process.exit(1);
});
