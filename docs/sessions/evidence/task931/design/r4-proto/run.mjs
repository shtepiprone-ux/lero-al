// Task 931 revision 4 prototype run: the tests on the real source, then each named defect in memory, each of which the tests must notice. Run from the repository root.
import { spawnSync } from 'node:child_process';
spawnSync(process.execPath, ['docs/sessions/evidence/task931/design/r4-proto/make-fake.mjs'], { stdio: 'inherit' });
const args = ['vitest', 'run', '--config', 'docs/sessions/evidence/task931/design/r4-proto/vitest.config.mts', '--reporter=dot'];
const run = env => {
  const r = spawnSync('npx', args, { shell: true, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 200000, env: { ...process.env, ...env } });
  const text = `${r.stdout}${r.stderr}`.replace(/\x1b\[[0-9;]*m/g, '');
  return { status: r.status, tests: /Tests\s+(.*)/.exec(text)?.[1] ?? 'no summary', applied: !/break not applied/.test(text), text };
};
const base = run({});
console.log(`on the real source: exit ${base.status}; ${base.tests}`);
if (base.status !== 0) console.log(base.text.slice(0, 5000));
const C = 'src/modules/listings/actions/contactEvents.ts', I = 'src/modules/listings/actions/submitListingInquiry.ts', P = 'src/modules/admin/actions/permissions.ts', A = 'src/modules/listings/actions/applyListingTransition.ts', G = 'src/app/admin/listings/page.tsx';
const breaks = [
  [C, "return { ok: false, reason: 'insert_failed' }", 'return undefined as never', 1, 'contactEvents.ts:63 lookup failure'],
  [C, "return { ok: false, reason: 'insert_failed' }\n  }\n}", 'return undefined as never\n  }\n}', 1, 'contactEvents.ts:109 unexpected error'],
  [I, 'result.count === null || result.count === undefined', 'result.count === null && result.count === undefined', 1, 'submitListingInquiry.ts:46 second ||'],
  [I, "result.error || result.count === null", "result.error && result.count === null", 1, 'submitListingInquiry.ts:46 first ||'],
  [P, "console.error('setModeratorPermission unexpected error', err)\n    return { error: 'save_failed' }", "console.error('setModeratorPermission unexpected error', err)\n    return undefined as never", 1, 'permissions.ts:206'],
  [P, 'if (eventError) {', 'if (!eventError) {', 1, 'permissions.ts:198'],
  [A, "revalidatePath(`/${locale}/listings`, 'page')", 'void 0', 1, 'applyListingTransition.ts:161'],
  [A, "revalidatePath(`/${locale}/listings/${slug}`, 'page')", 'void 0', 1, 'applyListingTransition.ts:163'],
  [A, 'if (slug) {\n      revalidatePath', 'if (true) {\n      revalidatePath', 1, 'applyListingTransition.ts:162'],
  [A, 'if (ownerId && ownerId !== actor.userId)', 'if (ownerId || ownerId !== actor.userId)', 1, 'applyListingTransition.ts:140'],
  [A, 'title: listingTitle ?? listingId', 'title: listingTitle ?? undefined as never', 1, 'applyListingTransition.ts:144'],
  [A, 'link: slug ? `/listings/${slug}` : undefined', 'link: undefined', 1, 'applyListingTransition.ts:148'],
  [A, 'rows: written?.length ?? 0', 'rows: 7', 1, 'applyListingTransition.ts:132'],
  [A, 'actor: actor.source ?? actor.userId,\n      rows', 'actor: undefined,\n      rows', 1, 'applyListingTransition.ts:131'],
  [G, 'await getAdminLocale()', 'void 0', 1, 'page.tsx:21'],
  [G, "sp.tab ?? 'all'", "sp.tab ?? ''", 1, 'page.tsx:24'],
  [G, 'const PER_PAGE = 25', 'const PER_PAGE = 26', 1, 'page.tsx:33'],
  [G, 'Math.max(1, Number(sp.page ?? 1))', 'Number(sp.page ?? 1)', 1, 'page.tsx:32'],
  [G, 'ascending: false', 'ascending: true', 1, 'page.tsx:69'],
  [G, "if (tab === 'premium') query = query.eq('is_premium', true)", 'void 0', 1, 'page.tsx:73'],
  [G, "if (status) query = query.eq('status', status)", 'void 0', 1, 'page.tsx:75'],
  [G, 'query = query.or(orParts.join(\',\'))', 'void 0', 1, 'page.tsx:91'],
  [G, 'query = applyAdminListingsVisibility(query, visibility, reason)', 'void 0', 1, 'page.tsx:94'],
  [G, "if (ownerIds.length > 0) orParts.push(`user_id.in.(${ownerIds.join(',')})`)", 'void 0', 1, 'page.tsx:85'],
  [G, 'if (FULL_UUID.test(qTrimmed)) orParts.push(`id.eq.${qTrimmed}`)', 'void 0', 1, 'page.tsx:89'],
  [G, "supabase.from('listings').select('id', { count: 'exact', head: true }),\n    ),\n    applyPublicEligibleButHidden", "supabase.from('listings').select('id', { count: 'exact', head: false }),\n    ),\n    applyPublicEligibleButHidden", 1, 'page.tsx:99'],
  [G, 'expired: auditExpiredResult.count ?? 0', 'expired: 0', 1, 'page.tsx:113'],
  [G, 'total={count ?? 0}', 'total={0}', 1, 'page.tsx:124'],
];
let noticed = 0, missed = 0;
for (const [BREAK_FILE, BREAK_FROM, BREAK_TO, nth, name] of breaks) {
  const r = run({ BREAK_FILE, BREAK_FROM, BREAK_TO, BREAK_NTH: String(nth) });
  const state = !r.applied ? 'NOT APPLIED' : r.status !== 0 ? 'noticed' : 'NOT NOTICED';
  if (state === 'noticed') noticed += 1; else missed += 1;
  console.log(`${state}: ${name}; ${r.tests}`);
}
console.log(`defects ${breaks.length}; noticed ${noticed}; not noticed or not applied ${missed}`);
