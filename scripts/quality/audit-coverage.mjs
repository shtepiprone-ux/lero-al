#!/usr/bin/env node
// Which checks cover which file (whole-project audit 2026-11-06, finding G-02). Every tracked file belongs to exactly one
// lane; a lane names its machine checks and whether a person or a model reads its files line by line in an audit.
// A file that matches no lane fails the run: a new kind of file cannot enter the repository unexamined.
// OWASP: Secure Code Review (scope is explicit), Attack Surface Analysis (every entry point is listed).
//
// Usage: node scripts/quality/audit-coverage.mjs [--list <lane>]   prints the count per lane; exit 1 on an unassigned file
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';

const MACHINE = 'check-files.mjs (encoding, invisible characters, secrets, syntax, links, stale paths), gitleaks';
const CODE = `${MACHINE}, ESLint (security rules), TypeScript, CodeQL`;

/**
 * The lanes, first match wins. `read` = every line read in an audit (true), or the lane is covered by its machine checks
 * plus a read of every line a detector flags ('flagged'). Changing a lane is a reviewed change of this file.
 */
export const LANES = [
  { id: 'server-entry', read: true, test: (f) => /^src\/app\/.*\/route\.ts$/.test(f) || /^src\/(proxy|instrumentation|middleware)\.ts$/.test(f) || (/\/actions\/[^/]+\.ts$|\/actions\.ts$/.test(f) && !/\.test\.ts$|__tests__/.test(f)),
    checks: `${CODE}; route and action security tests; authorization regression on real RLS` },
  { id: 'server-page', read: true, test: (f) => /^src\/app\/.*\/(page|layout|not-found|error|loading)\.tsx$/.test(f),
    checks: `${CODE}; page security tests where the page reads private data` },
  { id: 'server-lib', read: true, test: (f) => !/\.test\.|__tests__|\.stories\./.test(f) && (/^src\/lib\/.*\.ts$/.test(f) || /^src\/modules\/[^/]+\/(lib|dashboard|statistics|activity)\/.*\.ts$/.test(f) || /^src\/modules\/admin\/actions\//.test(f) || /^src\/i18n\/.*\.ts$/.test(f) || /^src\/types\//.test(f)),
    checks: `${CODE}; unit and security tests` },
  { id: 'test', read: 'flagged', test: (f) => /(^|\/)__tests__\/|\.(test|spec)\.(ts|tsx|mjs|cjs|js)$|^src\/tests\//.test(f) || /^vitest(\.[a-z]+)?\.config\.ts$/.test(f),
    checks: `${CODE}; run by CI (unit, authorization regression, quality self-tests)` },
  { id: 'story', read: 'flagged', test: (f) => /\.stories\.(tsx|ts|mdx)$/.test(f) || /^src\/stories\//.test(f) || /^\.storybook\//.test(f),
    checks: `${CODE}; Storybook build in CI` },
  { id: 'client-ui', read: 'flagged', test: (f) => /^src\/.*\.(tsx?|css)$/.test(f),
    checks: `${CODE}; scripts/quality/client-sinks.mjs on every line (postMessage, message listeners, outerHTML / insertAdjacentHTML, storage, stored URLs as href, DOM HTML / code / URL APIs, computed navigation, each dangerouslySetInnerHTML) and src/__tests__/security/clientSinks.test.ts (window.open, target _blank, dangerouslySetInnerHTML, eval, innerHTML, document.write); component tests` },
  { id: 'sql', read: true, test: (f) => /^supabase\//.test(f),
    checks: `${MACHINE}; scripts/quality/db-catalog-audit.mjs on the live catalog` },
  { id: 'ci-agent-config', read: true, test: (f) => /^(\.github|\.githooks|\.claude)\//.test(f) || /^(AGENTS|CLAUDE)\.md$/.test(f) || /^\.gitleaks(ignore|\.toml)$/.test(f),
    checks: `${MACHINE}; zizmor, ci-workflow.test.mjs, agent-settings.test.mjs, agent-check.test.mjs` },
  { id: 'build-config', read: true, test: (f) => /^[^/]+\.(ts|mjs|cjs|json|js)$/.test(f) || /^\.(npmrc|nvmrc|gitignore|gitattributes|orchestratorignore)$/.test(f),
    checks: `${MACHINE}; npm audit, install-scripts.test.mjs, SBOM, the build itself` },
  { id: 'quality-script', read: true, test: (f) => /^scripts\/quality\//.test(f),
    checks: `${CODE}; node --test scripts/quality/*.test.mjs in CI` },
  { id: 'script', read: 'flagged', test: (f) => /^scripts\//.test(f),
    checks: `${MACHINE}, CodeQL; the product gates that run them` },
  { id: 'locale-data', read: 'flagged', test: (f) => /^messages\/[a-z]{2}\.json$/.test(f),
    checks: `${MACHINE}; i18n product gates (the same keys in every locale); scripts/quality/locale-safety.mjs on every value (markup, dangerous schemes, plain http, ICU validity, placeholder parity, bypassing translation calls)` },
  { id: 'owasp-reference', read: true, test: (f) => /^docs\/security\/owasp\//.test(f),
    checks: `${MACHINE}; scripts/quality/owasp.mjs sync --verify (the registry equals upstream) and check (every sheet mapped at its version, every quote found in its sheet, every control evidence found in its file, every handed requirement cited by its task) in CI; the session-start context` },
  { id: 'evidence', read: false, test: (f) => /^docs\/(sessions|reviews\/artifacts)\//.test(f),
    checks: `${MACHINE}, CodeQL for the probe scripts; never run in CI` },
  { id: 'docs-tasks', read: false, test: (f) => /^(docs|tasks)\//.test(f) || /^(README|LICENSE)(\.md)?$/.test(f),
    checks: `${MACHINE}; kickoff checks for tasks/Sprints (ac-tests.mjs on the active kickoff)` },
  { id: 'static-asset', read: false, test: (f) => /^public\//.test(f) || /^src\/app\/[^/]+\.(ico|png|svg)$/.test(f),
    checks: `${MACHINE} (file type and encoding)` },
];

/** The lane of each file; `unassigned` holds the files no lane takes. */
export function assign(files) {
  const byLane = Object.fromEntries(LANES.map((l) => [l.id, []]));
  const unassigned = [];
  for (const f of files) {
    const lane = LANES.find((l) => l.test(f));
    if (lane) byLane[lane.id].push(f); else unassigned.push(f);
  }
  return { byLane, unassigned };
}

function trackedFiles(root) {
  const r = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  if (r.status !== 0) throw new Error(`git ls-files failed: ${r.stderr}`);
  return r.stdout.split('\0').filter(Boolean);
}

function main(argv) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const { byLane, unassigned } = assign(trackedFiles(root));
  const i = argv.indexOf('--list');
  if (i >= 0) { for (const f of byLane[argv[i + 1]] ?? []) console.log(f); return 0; }
  for (const l of LANES) console.log(`${l.id.padEnd(16)} ${String(byLane[l.id].length).padStart(6)}  read: ${l.read}  checks: ${l.checks}`);
  for (const f of unassigned) console.error(`unassigned: ${f}`);
  console.log(unassigned.length ? `audit-coverage: ${unassigned.length} file(s) in no lane` : 'audit-coverage: every tracked file is in a lane');
  return unassigned.length ? 1 : 0;
}

if (isEntryPoint(import.meta.url)) process.exitCode = main(process.argv.slice(2));
