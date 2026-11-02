// Task 931 revision 3 design (Opus, 2026-11-02): build the revision 3 sidecar from the revision 1-2 sidecar, the d16 migration
// list and the class A list. Prints the JSON; the caller saves it. Usage: node <this file> [extra class A file ...]
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const read = p => readFileSync(resolve(ROOT, p), 'utf8');
const old = JSON.parse(read('tasks/Archive/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.security.json'));
const d16 = read('docs/sessions/evidence/task931/design/d16-guard-criterion.txt').split(/\r?\n/);
const migrate = d16.slice(d16.indexOf('Guard hits (the revision 3 migration list):') + 1).filter(l => /^src\/\S+\.test\.tsx?$/.test(l));
const CLASS_A = ['src/lib/auth/__tests__/googlePopup.test.ts', 'src/components/layout/__tests__/Header.google.security.test.tsx',
  'src/modules/auth/components/__tests__/AuthSheet.google.security.test.tsx', 'src/modules/auth/components/__tests__/AuthSheet.test.tsx',
  'src/modules/cabinet/components/__tests__/ProfileTab.googleReauth.security.test.tsx',
  // added after d18/d22: a short find default under load (class A)
  'src/modules/listings/components/__tests__/ListingDetailView.contactSession.security.test.tsx'];
const FAKE = 'src/tests/fakeSupabase.ts', FAKE_TEST = 'src/tests/__tests__/fakeSupabase.test.ts', GUARD = 'src/tests/__tests__/queryDoubles.guard.test.ts';
const PLANTED = ['src/modules/listings/actions/deleteListing.ts', 'src/modules/listings/actions/favoriteActions.ts', 'src/modules/listings/actions/reportListing.ts',
  'src/modules/listings/actions/contactEvents.ts', 'src/modules/listings/actions/applyListingTransition.ts', 'src/modules/listings/actions/updateListing.ts',
  'src/lib/auth/blockCheck.ts', 'src/lib/auth/requireViewer.ts', 'src/app/auth/confirm/route.ts', 'src/app/api/cron/listings-expiry/route.ts',
  'src/modules/auth/actions/recovery.ts', 'src/modules/notifications/lib/mutations.ts', 'src/lib/getExchangeRateServer.ts'];
const scope = [...new Set([...old.scope, ...CLASS_A, FAKE, FAKE_TEST, GUARD, ...migrate, ...PLANTED])];
const inputs = old.inputs.filter(f => !scope.includes(f));
const cases = old.cases.map(c => c.id !== 'SEC-931-SRV-MODPERM-ALLOW' ? c : {
  ...c, response: c.response.replace('13 keys present', 'every registry key present'),
  testName: c.testName.replace('every other key false; 13 keys present', 'every other key false; every registry key present') });
const row = (id, outcome, invariant, actor, resource, input, response, forbidden, testFile, describe, title) => ({
  id, layer: 'server', outcome, boundary: 'unit', critical: false, invariant, actor, resource, input, response,
  forbiddenEffects: forbidden, testFile, testName: `${describe} [${id}] ${title}` });
const FD = 'createFakeDb — filters a production query depends on';
cases.push(
  row('SEC-931-SRV-FAKE-FILTER-ALLOW', 'allow', 'The shared Supabase fake returns and changes exactly the rows a filter selects',
    'Test using createFakeDb', 'createFakeDb lt, gt, like, ilike, match and or()', 'seeded rows; select, update and delete with each filter',
    'the matching row is returned, updated or deleted', ['a matching row left out'], FAKE_TEST, FD,
    'lt, gt, like, ilike, match and or() select, update and delete the rows that satisfy them'),
  row('SEC-931-SRV-FAKE-FILTER-DENY', 'deny', 'The shared Supabase fake never touches a row a filter excludes',
    'Test using createFakeDb', 'createFakeDb lt, gt, like, ilike, match and or()', 'a seeded decoy row that each filter excludes',
    'the decoy is not returned, not updated and not deleted', ['a filter ignored by the fake'], FAKE_TEST, FD,
    'a row that a filter excludes is never returned, updated or deleted'),
  row('SEC-931-SRV-FAKE-OR-DENY', 'deny', 'An or() expression the fake cannot evaluate fails loudly instead of matching every row',
    'Test using createFakeDb', 'createFakeDb or()', 'an or() term with an unsupported operator; an unknown filter kind',
    'throws fakeSupabase: unsupported or() term; no row matched', ['a silent match of every row'], FAKE_TEST, FD,
    'an unsupported or() term or filter kind throws and matches nothing'),
  row('SEC-931-SRV-FAKE-ERROR', 'error', 'An injected query error reaches the caller and changes no row',
    'Test using createFakeDb', 'createFakeDb db.fail', 'db.fail({ table, op, error }) before an update and a select',
    'the query resolves { data: null, error }, no row changes, the log records the error', ['a write applied despite the error'], FAKE_TEST, FD,
    'an injected error resolves { data: null, error }, changes no row and is logged'),
  row('SEC-931-SRV-QUERY-GUARD-ALLOW', 'allow', 'No unit test replaces the Supabase query builder with a double that ignores its filters',
    'Every unit test file of the project', 'src/**/*.test.ts(x) except *.integration.test.ts', 'the d16 criterion over the test tree',
    'no file is a hit', ['a hand-written query double merged unnoticed'], GUARD, 'Supabase query doubles',
    'no unit test file mocks a Supabase client with a hand-written query double or a filter stub that ignores its arguments'),
  row('SEC-931-SRV-QUERY-GUARD-DENY', 'deny', 'No unit test replaces the Supabase query builder with a double that ignores its filters',
    'Fixture test texts', 'the guard criterion', 'inline texts of the four d16 shapes; a createFakeDb text with from: db.from',
    'each shape is a hit; the fake-based text is not', ['a shape the guard misses'], GUARD, 'Supabase query doubles',
    'the criterion flags every hand-written shape and accepts a test built on createFakeDb'));
const sidecar = { version: 1, stage: 'planned', executionStatus: 'ready', kind: 'product', qaProfile: 'Q4',
  task: 'tasks/Sprints/Sprint_92_kickoff_prompt_Task_931_Full_Unit_Suite_Green_Again.md', taskSha256: 'PENDING',
  scope, inputs, rules: old.rules, report: 'docs/sessions/evidence/task931/security/report-r3.json', cases };
console.log(JSON.stringify(sidecar, null, 2));
