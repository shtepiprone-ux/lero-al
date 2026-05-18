/**
 * Storybook / Next.js 15.5 compatibility shim
 *
 * Background:
 *   In Next.js 15.5, `getDefineEnv` moved from:
 *     next/dist/build/webpack/plugins/define-env-plugin.js   (old path, removed)
 *   to:
 *     next/dist/build/define-env.js                          (new path)
 *
 *   vite-plugin-storybook-nextjs@1.x (pinned by @storybook/experimental-nextjs-vite@8.6.x)
 *   still imports from the old path, causing:
 *     CriticalPresetLoadError: Cannot find module 'next/dist/build/webpack/plugins/define-env-plugin.js'
 *
 *   This script creates a re-export stub at the old path so Storybook can load.
 *
 * Upgrade path:
 *   When Storybook is upgraded to v9, switch @storybook/experimental-nextjs-vite for the
 *   then-current stable Next.js Vite framework (which bundles vite-plugin-storybook-nextjs@2.x+).
 *   vite-plugin-storybook-nextjs@2.x+ supports Next.js 15.5 natively. Delete this file and
 *   remove the prestorybook / prebuild-storybook / pregovernance:storybook hooks from package.json.
 *
 * Scope:
 *   Called only via npm pre-hooks on Storybook scripts. Does NOT run on every npm install.
 *   Does NOT touch any production source files.
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const stubPath = join(
  root,
  'node_modules', 'next', 'dist', 'build', 'webpack', 'plugins', 'define-env-plugin.js',
);

const sourcePath = join(root, 'node_modules', 'next', 'dist', 'build', 'define-env.js');

const STUB_CONTENT = [
  "'use strict';",
  "// Storybook compat stub — Next.js 15.5+ moved getDefineEnv to next/dist/build/define-env.js",
  "// Created by scripts/prepare-storybook-next15.mjs — remove when upgrading to Storybook v9+",
  "module.exports = require('../../define-env.js');",
  "",
].join('\n');

// Fail with guidance if the expected new source module is no longer present.
// This guards against future Next.js versions moving the file again.
if (!existsSync(sourcePath)) {
  console.error(
    '\n[prepare-storybook-next15] ERROR: expected source module not found:\n' +
    '  ' + sourcePath + '\n\n' +
    'The Next.js internal path may have changed in the installed version.\n' +
    'Action required — check one of:\n' +
    '  1. Whether getDefineEnv was renamed or moved in the installed Next.js version.\n' +
    '  2. Whether vite-plugin-storybook-nextjs has been updated to support the new path.\n' +
    '  3. Whether Storybook has been upgraded to v9+ (if so, remove this script\n' +
    '     and the pre-hooks in package.json — the shim is no longer needed).\n',
  );
  process.exit(1);
}

// Idempotent: skip if the stub already exists with the correct content.
if (existsSync(stubPath)) {
  try {
    if (readFileSync(stubPath, 'utf8') === STUB_CONTENT) process.exit(0);
  } catch {
    // Fall through and rewrite.
  }
}

mkdirSync(dirname(stubPath), { recursive: true });
writeFileSync(stubPath, STUB_CONTENT, 'utf8');
console.log('[prepare-storybook-next15] Created define-env-plugin compat stub for Storybook.');
