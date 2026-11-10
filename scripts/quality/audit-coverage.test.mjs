// audit-coverage.mjs (whole-project audit 2026-11-06, G-02): every file kind lands in its lane, an unknown file is
// refused, and every tracked file of this repository is in a lane.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assign, LANES } from './audit-coverage.mjs';

const laneOf = (f) => Object.entries(assign([f]).byLane).find(([, files]) => files.length)?.[0] ?? null;

test('each kind of file lands in the lane that reads it', () => {
  const cases = {
    'src/app/api/upload-avatar/route.ts': 'server-entry',
    'src/proxy.ts': 'server-entry',
    'src/modules/listings/actions/createListing.ts': 'server-entry',
    'src/modules/companies/actions.ts': 'server-entry',
    'src/app/admin/users/page.tsx': 'server-page',
    'src/lib/auth/staff.ts': 'server-lib',
    'src/modules/cabinet/statistics/data.ts': 'server-lib',
    'src/modules/listings/actions/__tests__/contactGateway.security.test.ts': 'test',
    'scripts/quality/db-catalog-audit.test.mjs': 'test',
    'src/stories/patterns/mantine/ListingContactPattern.stories.tsx': 'story',
    'src/modules/listings/components/ImageUpload.tsx': 'client-ui',
    'supabase/sql_migrations/task923/db-catalog/proposed-hardening.sql': 'sql',
    '.github/workflows/ci.yml': 'ci-agent-config',
    // Task 970: the secret scan's reviewed fingerprints and any future config are read by gitleaks in CI.
    '.gitleaksignore': 'ci-agent-config',
    '.gitleaks.toml': 'ci-agent-config',
    '.claude/skills/review-task/SKILL.md': 'ci-agent-config',
    'next.config.ts': 'build-config',
    '.npmrc': 'build-config',
    'scripts/quality/db-catalog-audit.mjs': 'quality-script',
    'scripts/check-click-shield.mjs': 'script',
    'messages/sq.json': 'locale-data',
    'docs/sessions/evidence/task923/r42-run.mjs': 'evidence',
    'docs/security/audit-2026-11-06/findings.md': 'docs-tasks',
    'docs/security/owasp/controls.json': 'owasp-reference',
    'scripts/quality/owasp.mjs': 'quality-script',
    'public/og-default.png': 'static-asset',
    'src/app/favicon.ico': 'static-asset',
  };
  for (const [file, lane] of Object.entries(cases)) assert.equal(laneOf(file), lane, file);
});

test('a file of a kind no lane knows is refused, not silently passed', () => {
  assert.deepEqual(assign(['infra/terraform/main.tf']).unassigned, ['infra/terraform/main.tf']);
  assert.deepEqual(assign(['src/app/robots.txt']).unassigned, ['src/app/robots.txt']);
});

test('every lane names its checks and its reading rule', () => {
  for (const l of LANES) {
    assert.ok(l.checks.length > 10, l.id);
    assert.ok([true, false, 'flagged'].includes(l.read), l.id);
  }
});

test('every tracked file of this repository is in a lane', () => {
  const script = fileURLToPath(new URL('./audit-coverage.mjs', import.meta.url));
  const r = spawnSync(process.execPath, [script], { encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, r.stderr);
});
