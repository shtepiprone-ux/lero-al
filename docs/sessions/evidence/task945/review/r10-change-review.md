# Change review

Base `d8a07a3c7841022207fd5331f53e5a80b4d7c7e2`, 74 code files. A clean list here proves only that these checks found nothing; the reviewer still reads the whole diff.

## A check said less

A deleted test, a weakened or removed assertion, a new mock or a switched-off rule. Why was each right?

- scripts/workflow-gates/change-review.selftest.mjs:169: a test switched off: put('src/a.test.ts', "it.skip('a', () => {});\n");
- scripts/workflow-gates/code-check.selftest.mjs:363: a test switched off: const f = fixture(t, { registry: registryOf([row], { quieting: [rule, fewer] }), files: { 'src/a.test.ts': "it.skip('old
- scripts/workflow-gates/code-check.selftest.mjs:368: a test switched off: f.put('src/a.test.ts', "it.skip('old', () => {});\nit('a', () => { expect(1); expect(2); });\nit('c', () => { expect(3);
- scripts/workflow-gates/code-check.selftest.mjs:371: a test switched off: f.put('src/a.test.ts', "it.skip('old', () => {});\nit.skip('a', () => { expect(1); expect(2); });\n");
- scripts/workflow-gates/code-check.selftest.mjs:379: a test switched off: f.put('src/a.test.ts', "it.skip('old', () => {});\nit('a', () => { expect(1); });\n");
- scripts/workflow-gates/code-check.selftest.mjs:388: a test switched off: f.put('src/a.test.ts', "it.skip('old', () => {});\nit('a', () => { expect(1); expect(2); });\n");
- scripts/workflow-gates/code-check.selftest.mjs:411: a rule switched off: for (const text of ['// eslint-disable-next-line x', '/* design-tokens-allow: 1px */']) assert.match(text, rule('a rule 
- src/app/api/cron/listings-expiry/__tests__/route.test.ts:79: a new mock, which may replace what the test exists to exercise: vi.spyOn(console, 'info').mockImplementation(() => undefined)
- src/app/api/cron/listings-expiry/__tests__/route.test.ts:157: a new mock, which may replace what the test exists to exercise: const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
- src/app/api/cron/listings-expiry/__tests__/route.test.ts:170: a new mock, which may replace what the test exists to exercise: const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
- src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx:82: a new mock, which may replace what the test exists to exercise: vi.mock('@/lib/auth/requireViewer', () => ({

## What an attacker reaches, and what steers later agents

Read each against `.claude/rules/shared/secure-code-review.md`.

- .claude/hooks/block-mutating-git.ps1: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/hooks/orchestrator-response-gate.ps1: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/README.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/create/01-preflight.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/create/03-publication.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/execute/02-implement.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/execute/03-validate-handoff.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/review/02-adversarial-ui.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/review/03-decision-closure.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/review/04-contract-rebases.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/shared/git-publication.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/shared/role-boundaries.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/shared/secure-code-review.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/shared/security-testing.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/shared/task-readiness.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/shared/workflow-ci.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/shared/workflow-contract.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/shared/workflow-evidence.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/rules/shared/workflow-gates.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/settings.json: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- .claude/skills/review-task/SKILL.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- AGENTS.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- CLAUDE.md: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- scripts/workflow-gates/audit-baseline.json: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- scripts/workflow-gates/change-review.selftest.mjs:47: text run as code (CWE-95): ['text run as code', 'src/a.ts', 'const a = eval(b);', 'const a = retrieval(b);'],
- scripts/workflow-gates/change-review.selftest.mjs:84: text run as code (CWE-95): const { root, put, commit } = repository(t, { 'src/a.ts': 'const a = eval(b);\n' });
- scripts/workflow-gates/change-review.selftest.mjs:85: text run as code (CWE-95): put('src/a.ts', 'const a = eval(b);\nconst c = 1;\n');
- scripts/workflow-gates/change-review.selftest.mjs:87: text run as code (CWE-95): put('src/a.ts', 'const a = eval(b);\nconst c = eval(d);\n');
- scripts/workflow-gates/change-review.selftest.mjs:146: text run as code (CWE-95): put('src/a.ts', 'export const a = eval(b);\n');
- scripts/workflow-gates/change-review.selftest.mjs:48: a command built as text (CWE-78): ['a command built as text', 'src/a.ts', 'exec(`rm ${a}`);', "execFile('rm', [a]);"],
- scripts/workflow-gates/change-review.selftest.mjs:54: a broken hash, if it protects anything (CWE-327): ['a broken hash', 'src/a.ts', "createHash('md5');", "createHash('sha256');"],
- scripts/workflow-gates/change-review.selftest.mjs:55: certificate checks switched off (CWE-295): ['certificate checks switched off', 'src/a.ts', 'const o = { rejectUnauthorized: false };', 'const o = { rejectUnauthori
- scripts/workflow-gates/code-check.json: this file steers every later agent or runs by itself, so its whole diff needs an independent reader
- scripts/workflow-gates/code-check.mjs:136: a command built as text (CWE-78): const child = spawn(text, { cwd: root, shell: true, detached: process.platform !== 'win32', windowsHide: true, stdio: ['
- scripts/workflow-gates/push-safety.mjs:13: a broken hash, if it protects anything (CWE-327): return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');

## Lines no test checks

Broken in memory with every test still passing, or never loaded by those tests. Add an assertion that fails on it, or say why the two forms mean the same.

- scripts/workflow-gates/sensitivity-register.mjs: the tests that should reach it never loaded it, so they check nothing in it

## What a changed test misses

Only the changed test ran against its module, so another test may still catch these. Does it assert what it exists to assert? `node scripts/workflow-gates/mutation-check.mjs --all <file>` runs every test of that file.

- src/lib/auth/permissions.ts:37: `||` became `&&`, and every test of src/lib/auth/__tests__/permissions.test.ts still passed
- src/modules/admin/actions/permissions.ts:36: `&&` became `||`, and every test of src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts still passed
- src/modules/admin/actions/permissions.ts:70: `rows ?? []` became `((rows) && ([]))`, and every test of src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts still passed
- src/modules/admin/actions/permissions.ts:72: `!==` became `===`, and every test of src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts still passed
- src/modules/admin/actions/permissions.ts:76: `>` became `<=`, and every test of src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts still passed
- src/modules/admin/actions/permissions.ts:78: `actors ?? []` became `((actors) && ([]))`, and every test of src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts still passed
- src/modules/admin/actions/permissions.ts:79: `actorNames[a.id] = a.name ?? ''` became `;`, and every test of src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts still passed
- src/modules/admin/actions/permissions.ts:88: `row.updated_at ?? null` became `((row.updated_at) && (null))`, and every test of src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts still passed
- src/modules/admin/actions/permissions.ts:89: `row.updated_by_user_id` became `!(row.updated_by_user_id)`, and every test of src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts still passed
- src/modules/admin/actions/permissions.ts:90: `actorNames[row.updated_by_user_id] ?? null` became `((actorNames[row.updated_by_user_id]) && (null))`, and every test of src/modules/admin/actions/__tests__/getModeratorPermissions.smoke.test.ts still passed
- src/modules/auth/actions/captcha.ts:57: `!captchaToken` became `captchaToken`, and every test of src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts still passed
- src/modules/auth/actions/captcha.ts:57: `||` became `&&`, and every test of src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts still passed
- src/modules/auth/actions/captcha.ts:57: `!==` became `===`, and every test of src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts still passed
- src/modules/auth/actions/captcha.ts:65: `error` became `!(error)`, and every test of src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts still passed
- src/modules/auth/actions/captcha.ts:65: `isCaptchaRefusal(error)` became `!(isCaptchaRefusal(error))`, and every test of src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts still passed
- src/modules/auth/actions/captcha.ts:66: `{ ok: true }` became `undefined`, and every test of src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts still passed
- src/modules/auth/actions/captcha.ts:66: `true` became `false`, and every test of src/modules/auth/actions/__tests__/signUpWithCaptcha.smoke.test.ts still passed
- src/modules/listings/domain/listingTransitionEngine.ts:129: `ALLOWED_LISTING_TRANSITIONS[currentStatus]` became `undefined`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/domain/listingTransitionEngine.ts:167: `===` became `!==`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/domain/listingTransitionEngine.ts:170: `===` became `!==`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/domain/listingTransitionEngine.ts:192: `!==` became `===`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/domain/listingTransitionEngine.ts:215: `&&` became `||`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/domain/listingTransitionEngine.ts:220: `!STAFF_ONLY_TARGET_STATUSES.includes(status)` became `STAFF_ONLY_TARGET_STATUSES.includes(status)`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/domain/listingTransitionEngine.ts:236: `options.privileged` became `!(options.privileged)`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/domain/listingTransitionEngine.ts:237: `options.canPublish` became `!(options.canPublish)`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/domain/listingTransitionEngine.ts:239: `!==` became `===`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/domain/listingTransitionEngine.ts:249: `super(`Transition '${action}' is not allowed from status '${currentSta` became `;`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:102: `shouldReStampExpiresAt(nextStatus)` became `!(shouldReStampExpiresAt(nextStatus))`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:103: `updatePayload.expires_at = computeExpiresAt()` became `;`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:122: `actor.source ?? actor.userId` became `((actor.source) && (actor.userId))`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:124: `{ ok: false, reason: 'db_error' }` became `undefined`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:131: `actor.source ?? actor.userId` became `((actor.source) && (actor.userId))`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:132: `written?.length ?? 0` became `((written?.length) && (0))`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:134: `{ ok: false, reason: 'conflict' }` became `undefined`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:140: `&&` became `||`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:144: `listingTitle ?? listingId` became `((listingTitle) && (listingId))`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:148: `slug` became `!(slug)`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:151: `(await import('next/server')).after(notifyOwner)` became `;`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:156: `revalidateTag('site-stats')` became `;`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:161: `revalidatePath(`/${locale}/listings`, 'page')` became `;`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:162: `slug` became `!(slug)`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed
- src/modules/listings/actions/applyListingTransition.ts:163: `revalidatePath(`/${locale}/listings/${slug}`, 'page')` became `;`, and every test of src/modules/listings/actions/__tests__/listingStatusChange.smoke.test.ts still passed

## Not tried

Time ran out, so these say nothing either way. A reviewer of security-relevant code runs the command each names.

- scripts/check-listing-visibility.mjs: of 17 defects, 17 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/check-listing-visibility.mjs tries them
- src/app/api/cron/listings-expiry/route.ts: of 17 defects, 2 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/app/api/cron/listings-expiry/route.ts tries them
- src/design-system/mantine/theme.ts: of 142 defects, 142 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/design-system/mantine/theme.ts tries them
- src/lib/i18n/listingStatusLabel.ts: of 3 defects, 3 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/lib/i18n/listingStatusLabel.ts tries them
- src/app/admin/listings/visibilityFilter.ts: of 6 defects, 6 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/app/admin/listings/visibilityFilter.ts tries them
- src/components/admin/AdminListingsTable.tsx: of 31 defects, 31 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/components/admin/AdminListingsTable.tsx tries them
- src/app/admin/listings/page.tsx: of 55 defects, 55 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/app/admin/listings/page.tsx tries them
- src/modules/listings/lib/visibility.ts: of 57 defects, 57 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/modules/listings/lib/visibility.ts tries them
- src/lib/auth/permissions.ts: of 17 defects, 2 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/lib/auth/permissions.ts tries them
- src/modules/admin/actions/permissions.ts: of 68 defects, 50 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/modules/admin/actions/permissions.ts tries them
- src/modules/auth/actions/captcha.ts: of 26 defects, 8 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/modules/auth/actions/captcha.ts tries them
- src/modules/listings/domain/listingTransitionEngine.ts: of 38 defects, 23 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/modules/listings/domain/listingTransitionEngine.ts tries them
- src/modules/listings/actions/applyListingTransition.ts: of 61 defects, 43 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs --all src/modules/listings/actions/applyListingTransition.ts tries them
- scripts/workflow-gates/change-review.mjs: of 71 defects, 71 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/change-review.mjs tries them
- scripts/workflow-gates/code-check.mjs: of 361 defects, 361 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/code-check.mjs tries them
- scripts/workflow-gates/dependency-check.mjs: of 89 defects, 89 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/dependency-check.mjs tries them
- scripts/workflow-gates/mutation-check.mjs: of 317 defects, 317 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/mutation-check.mjs tries them
- scripts/workflow-gates/check-workflow.mjs: of 31 defects, 31 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/check-workflow.mjs tries them
- scripts/workflow-gates/ci-status.mjs: of 90 defects, 90 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/ci-status.mjs tries them
- scripts/workflow-gates/cli.mjs: of 361 defects, 361 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/cli.mjs tries them
- scripts/workflow-gates/contract.mjs: of 338 defects, 338 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/contract.mjs tries them
- scripts/workflow-gates/hook-differential.mjs: of 81 defects, 81 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/hook-differential.mjs tries them
- scripts/workflow-gates/hook-load-check.mjs: of 67 defects, 67 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/hook-load-check.mjs tries them
- scripts/workflow-gates/mutation-loader.mjs: of 27 defects, 27 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/mutation-loader.mjs tries them
- scripts/workflow-gates/prepush.mjs: of 256 defects, 256 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/prepush.mjs tries them
- scripts/workflow-gates/push-safety.mjs: of 210 defects, 210 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/push-safety.mjs tries them
- scripts/workflow-gates/security-hook.mjs: of 1233 defects, 1233 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/security-hook.mjs tries them
- scripts/workflow-gates/sensitivity-hooks.mjs: of 30 defects, 30 not tried because time ran out: node scripts/workflow-gates/mutation-check.mjs scripts/workflow-gates/sensitivity-hooks.mjs tries them
