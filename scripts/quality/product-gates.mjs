#!/usr/bin/env node
// Product checks of the "quality" CI job: i18n, design system, UI contract, Stories, database grants.
// Each runs on its own; every failure is reported, then the script exits non-zero if any failed.
//
// Diff-based checks compare against BASE_SHA (the PR base, or the commit before a push); without it they use
// `origin/main`, so a local run gives the same answer as CI:  node scripts/quality/product-gates.mjs

import { spawnSync } from 'node:child_process';

const base = process.env.BASE_SHA || 'origin/main';
const head = process.env.HEAD_SHA || 'HEAD';

const env = {
  ...process.env,
  UI_CONTRACT_BASE_SHA: base,
  UI_CONTRACT_HEAD_SHA: head,
  MOBILE_ADAPTATION_BASE_SHA: base,
  MOBILE_ADAPTATION_HEAD_SHA: head,
  SURFACE_CENSUS_BASE_SHA: base,
  SURFACE_CENSUS_HEAD_SHA: head,
};

const GATES = [
  // Text and encoding
  ['npm', 'run', 'check:file-integrity:all'],
  ['npm', 'run', 'check:mojibake'],
  // Localization
  ['npm', 'run', 'check:i18n'],
  ['npm', 'run', 'check:i18n-hardcode'],
  ['npm', 'run', 'check:i18n-dynamic'],
  ['npm', 'run', 'governance:localization'],
  // Design system and UI contract
  ['npm', 'run', 'governance'],
  ['npm', 'run', 'governance:verify'],
  ['npm', 'run', 'governance:primitives'],
  ['npm', 'run', 'governance:ssr'],
  ['npm', 'run', 'governance:responsive'],
  ['npm', 'run', 'governance:tailwind'],
  ['npm', 'run', 'check:design-tokens:strict'],
  ['npm', 'run', 'check:tailwind-runtime-tokens'],
  // Homepage theme runtime tokens: no CI job ran it, so it went red unseen (Task 968)
  ['npm', 'run', 'check:homepage-theme-runtime-deps'],
  ['npm', 'run', 'check:homepage-theme-runtime-deps:verify-gate'],
  ['npm', 'run', 'check:enrolled-tailwind'],
  ['npm', 'run', 'check:type-responsive'],
  ['npm', 'run', 'check:pattern-enrolment'],
  ['npm', 'run', 'check:media-enrolment'],
  ['npm', 'run', 'check:rendered-scope'],
  ['npm', 'run', 'check:ui-contract'],
  ['node', 'scripts/check-mobile-adaptation-contract.mjs'],
  ['node', 'scripts/check-mobile-adaptation-contract.mjs', '--verify-gate'],
  ['node', 'scripts/check-badge-canonical.mjs'],
  ['node', 'scripts/check-dialog-canonical.mjs'],
  ['npm', 'run', 'check:surface-census:changed'],
  // Stories
  ['npm', 'run', 'check:stories'],
  ['npm', 'run', 'check:story-coverage'],
  // Backlog holds active state only (GR-5; its Stop hook was removed 2026-11-06, so CI runs it)
  ['npm', 'run', 'check:backlog-active'],
  // Hydration
  ['npm', 'run', 'check:hydration:verify'],
  ['npm', 'run', 'check:hydration:admin-config'],
  // Database grants and listing visibility (authorization at the data layer)
  ['npm', 'run', 'check:listing-reports-grants'],
  ['npm', 'run', 'check:notifications-grants'],
  ['npm', 'run', 'check:notification-type-enum'],
  ['npm', 'run', 'check:listing-visibility'],
];

const failed = [];
for (const command of GATES) {
  const label = command.join(' ');
  const started = Date.now();
  const result = spawnSync(command[0], command.slice(1), {
    env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 256 * 1024 * 1024,
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(0);
  if (result.status === 0) {
    console.log(`PASS ${label} (${seconds}s)`);
    continue;
  }
  failed.push(label);
  const output = `${result.stdout || ''}${result.stderr || ''}`.trim().split('\n').slice(-40).join('\n');
  console.log(`::group::FAIL ${label} (${seconds}s)\n${output || String(result.error || '')}\n::endgroup::`);
  console.log(`::error::${label} failed`);
}

console.log(`\n${GATES.length - failed.length} of ${GATES.length} product checks passed.`);
if (failed.length) {
  console.log(`Failed:\n${failed.map((f) => `  - ${f}`).join('\n')}`);
  process.exit(1);
}
