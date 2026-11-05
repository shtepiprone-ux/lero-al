# Task 945 review 1 — each line of `r10-change-review.md`, answered

The owner asked for an answer to each line. Runs with all tests: `r11-mutation-all.txt`, `r15-mutation-security.txt`, `r18-mutation-more.txt`, `r24-mutation-last.txt`. No product file or test was changed for any of this.

## A check said less (11)

| Line | Answer |
|---|---|
| `scripts/workflow-gates/change-review.selftest.mjs:169` | A fixture string for the rule under test; nothing is switched off. |
| `scripts/workflow-gates/code-check.selftest.mjs:363` | Fixture string of the quieting rule; nothing is switched off. |
| `scripts/workflow-gates/code-check.selftest.mjs:368` | Fixture string of the quieting rule; nothing is switched off. |
| `scripts/workflow-gates/code-check.selftest.mjs:371` | Fixture string of the quieting rule; nothing is switched off. |
| `scripts/workflow-gates/code-check.selftest.mjs:379` | Fixture string of the quieting rule; nothing is switched off. |
| `scripts/workflow-gates/code-check.selftest.mjs:388` | Fixture string of the quieting rule; nothing is switched off. |
| `scripts/workflow-gates/code-check.selftest.mjs:411` | Fixture strings of the rule that finds a switched-off rule; nothing is switched off. |
| `src/app/api/cron/listings-expiry/__tests__/route.test.ts:79` | A spy that silences `console.info`; the route itself stays real. From Task 923, not this commit. |
| `src/app/api/cron/listings-expiry/__tests__/route.test.ts:157` | A spy that asserts the error was logged once: it adds an assertion. From Task 923, not this commit. |
| `src/app/api/cron/listings-expiry/__tests__/route.test.ts:170` | The same as line 157. |
| `src/components/admin/__tests__/AdminListingsTable.smoke.test.tsx:82` | Mocks `requireViewer` at the viewer boundary; the comment says the real `requireStaffPage` stays in the path. I read the mock and the comment, not the whole path; the test belongs to the reviews of Task 923. |

## What an attacker reaches, and what steers later agents (35)

| Line | Answer |
|---|---|
| `.claude/hooks/block-mutating-git.ps1` | Not in this commit. Its independent reader was the approver of 935:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/hooks/orchestrator-response-gate.ps1` | Not in this commit. Its independent reader was the approver of 935:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/rules/README.md` | Read whole in this commit: the added paragraph points to the flow and weakens nothing. |
| `.claude/rules/create/01-preflight.md` | Read whole in this commit: the added paragraph points to the flow and weakens nothing. |
| `.claude/rules/create/03-publication.md` | Not in this commit. Its independent reader was the approver of 935:reviewed, 943:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/rules/execute/02-implement.md` | Read whole in this commit: the added paragraph points to the flow and weakens nothing. |
| `.claude/rules/execute/03-validate-handoff.md` | Read whole in this commit: the added paragraph points to the flow and weakens nothing. |
| `.claude/rules/review/02-adversarial-ui.md` | Read whole in this commit: the added paragraph points to the flow and weakens nothing. |
| `.claude/rules/review/03-decision-closure.md` | Not in this commit. Its independent reader was the approver of 935:reviewed, 940:reviewed, 943:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/rules/review/04-contract-rebases.md` | Not in this commit. Its independent reader was the approver of 943:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/rules/shared/git-publication.md` | Not in this commit. Its independent reader was the approver of 935:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/rules/shared/role-boundaries.md` | Not in this commit. Its independent reader was the approver of 935:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/rules/shared/secure-code-review.md` | Read whole against the OWASP page: the flow matches; its checklist omits items (F21, R18); section 3 says more than the tool does (F2). |
| `.claude/rules/shared/security-testing.md` | Not in this commit. Its independent reader was the approver of 935:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/rules/shared/task-readiness.md` | Read whole in this commit: the added paragraph points to the flow and weakens nothing. |
| `.claude/rules/shared/workflow-ci.md` | Not in this commit. Its independent reader was the approver of 935:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/rules/shared/workflow-contract.md` | Not in this commit. Its independent reader was the approver of 935:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/rules/shared/workflow-evidence.md` | Not in this commit. Its independent reader was the approver of 935:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/rules/shared/workflow-gates.md` | Not in this commit. Its independent reader was the approver of 935:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `.claude/settings.json` | Read whole: four events registered, matchers wide (AC7). Sound. |
| `.claude/skills/review-task/SKILL.md` | Not in this commit. Its independent reader was the approver of 935:reviewed (`r23-steering-owners.txt`). I did not reread that diff. |
| `AGENTS.md` | Read whole. The text is right; Sonnet may edit it: F10, R19. |
| `CLAUDE.md` | Read whole. The text is right; a contract naming it lets Sonnet edit it: F10, R19. |
| `scripts/workflow-gates/audit-baseline.json` | Read whole: 76 advisories (6 critical, 70 high), which a fresh `npm audit` matches with 0 stale and 0 missing. Unresolved findings, as its note says. Owner decision 1. |
| `scripts/workflow-gates/change-review.selftest.mjs:47` | A fixture string for the rule it tests; never run as code. |
| `scripts/workflow-gates/change-review.selftest.mjs:84` | A fixture string for the rule it tests; never run as code. |
| `scripts/workflow-gates/change-review.selftest.mjs:85` | A fixture string for the rule it tests; never run as code. |
| `scripts/workflow-gates/change-review.selftest.mjs:87` | A fixture string for the rule it tests; never run as code. |
| `scripts/workflow-gates/change-review.selftest.mjs:146` | A fixture string for the rule it tests; never run as code. |
| `scripts/workflow-gates/change-review.selftest.mjs:48` | A fixture string for the rule it tests; never run as code. |
| `scripts/workflow-gates/change-review.selftest.mjs:54` | A fixture string for the rule it tests; never run as code. |
| `scripts/workflow-gates/change-review.selftest.mjs:55` | A fixture string for the rule it tests; never run as code. |
| `scripts/workflow-gates/code-check.json` | Read whole: F2, F8 (d), F14; R10, R16. |
| `scripts/workflow-gates/code-check.mjs:136` | A real text command. The author's answer, "commands from the repository's own registry", is incomplete: a file name reaches it (F13, R12 (b)). |
| `scripts/workflow-gates/push-safety.mjs:13` | SHA-1 as Git's own blob id, not a protection. Agreed with the author. |

## Lines no test checks (1)

| Line | Answer |
|---|---|
| `scripts/workflow-gates/sensitivity-register.mjs` | A false line: `cli.mjs:295` replaces `NODE_OPTIONS`, so the loader cannot be there. It is covered by the sensitivity runs, which load it (F8 (c), R16). |

## What a changed test misses (42)

| Line | Answer |
|---|---|
| `src/lib/auth/permissions.ts:37` `\|\|` | Not caught by any test. Means the same. A viewer that is not ok carries no role (`requireViewer.ts:35-50`), and a null role is refused (`permissions.ts:9-10`). No test needed. (`r15-mutation-security.txt`) |
| `src/modules/admin/actions/permissions.ts:36` `&&` | Another test catches it (`r15-mutation-security.txt`, 64 of 68). |
| `src/modules/admin/actions/permissions.ts:70` `rows ?? []` | Another test catches it (`r15-mutation-security.txt`, 64 of 68). |
| `src/modules/admin/actions/permissions.ts:72` `!==` | Another test catches it (`r15-mutation-security.txt`, 64 of 68). |
| `src/modules/admin/actions/permissions.ts:76` `>` | Another test catches it (`r15-mutation-security.txt`, 64 of 68). |
| `src/modules/admin/actions/permissions.ts:78` `actors ?? []` | Another test catches it (`r15-mutation-security.txt`, 64 of 68). |
| `src/modules/admin/actions/permissions.ts:79` `actorNames[a.id] = a.name ?? ''` | Another test catches it (`r15-mutation-security.txt`, 64 of 68). |
| `src/modules/admin/actions/permissions.ts:88` `row.updated_at ?? null` | Another test catches it (`r15-mutation-security.txt`, 64 of 68). |
| `src/modules/admin/actions/permissions.ts:89` `row.updated_by_user_id` | Another test catches it (`r15-mutation-security.txt`, 64 of 68). |
| `src/modules/admin/actions/permissions.ts:90` `actorNames[row.updated_by_user_id] ?? null` | Another test catches it (`r15-mutation-security.txt`, 64 of 68). |
| `src/modules/auth/actions/captcha.ts:57` `!captchaToken` | Another test catches it (`r11-mutation-all.txt`, 26 of 26). |
| `src/modules/auth/actions/captcha.ts:57` `\|\|` | Another test catches it (`r11-mutation-all.txt`, 26 of 26). |
| `src/modules/auth/actions/captcha.ts:57` `!==` | Another test catches it (`r11-mutation-all.txt`, 26 of 26). |
| `src/modules/auth/actions/captcha.ts:65` `error` | Another test catches it (`r11-mutation-all.txt`, 26 of 26). |
| `src/modules/auth/actions/captcha.ts:65` `isCaptchaRefusal(error)` | Another test catches it (`r11-mutation-all.txt`, 26 of 26). |
| `src/modules/auth/actions/captcha.ts:66` `{ ok: true }` | Another test catches it (`r11-mutation-all.txt`, 26 of 26). |
| `src/modules/auth/actions/captcha.ts:66` `true` | Another test catches it (`r11-mutation-all.txt`, 26 of 26). |
| `src/modules/listings/domain/listingTransitionEngine.ts:129` `ALLOWED_LISTING_TRANSITIONS[currentStatus]` | Another test catches it (`r11-mutation-all.txt`, 37 of 38). |
| `src/modules/listings/domain/listingTransitionEngine.ts:167` `===` | Another test catches it (`r11-mutation-all.txt`, 37 of 38). |
| `src/modules/listings/domain/listingTransitionEngine.ts:170` `===` | Another test catches it (`r11-mutation-all.txt`, 37 of 38). |
| `src/modules/listings/domain/listingTransitionEngine.ts:192` `!==` | Another test catches it (`r11-mutation-all.txt`, 37 of 38). |
| `src/modules/listings/domain/listingTransitionEngine.ts:215` `&&` | Another test catches it (`r11-mutation-all.txt`, 37 of 38). |
| `src/modules/listings/domain/listingTransitionEngine.ts:220` `!STAFF_ONLY_TARGET_STATUSES.includes(status)` | Another test catches it (`r11-mutation-all.txt`, 37 of 38). |
| `src/modules/listings/domain/listingTransitionEngine.ts:236` `options.privileged` | Another test catches it (`r11-mutation-all.txt`, 37 of 38). |
| `src/modules/listings/domain/listingTransitionEngine.ts:237` `options.canPublish` | Another test catches it (`r11-mutation-all.txt`, 37 of 38). |
| `src/modules/listings/domain/listingTransitionEngine.ts:239` `!==` | Another test catches it (`r11-mutation-all.txt`, 37 of 38). |
| `src/modules/listings/domain/listingTransitionEngine.ts:249` `super(`Transition '${action}' is not allowed from… | Another test catches it (`r11-mutation-all.txt`, 37 of 38). |
| `src/modules/listings/actions/applyListingTransition.ts:102` `shouldReStampExpiresAt(nextStatus)` | Another test catches it (`r15-mutation-security.txt`, 46 of 61). |
| `src/modules/listings/actions/applyListingTransition.ts:103` `updatePayload.expires_at = computeExpiresAt()` | Another test catches it (`r15-mutation-security.txt`, 46 of 61). |
| `src/modules/listings/actions/applyListingTransition.ts:122` `actor.source ?? actor.userId` | Not caught by any test. Real test gap, log fields only. No decision depends on them. (`r15-mutation-security.txt`) |
| `src/modules/listings/actions/applyListingTransition.ts:124` `{ ok: false, reason: 'db_error' }` | Another test catches it (`r15-mutation-security.txt`, 46 of 61). |
| `src/modules/listings/actions/applyListingTransition.ts:131` `actor.source ?? actor.userId` | Not caught by any test. Real test gap, log fields only. No decision depends on them. (`r15-mutation-security.txt`) |
| `src/modules/listings/actions/applyListingTransition.ts:132` `written?.length ?? 0` | Not caught by any test. Real test gap, log fields only. No decision depends on them. (`r15-mutation-security.txt`) |
| `src/modules/listings/actions/applyListingTransition.ts:134` `{ ok: false, reason: 'conflict' }` | Another test catches it (`r15-mutation-security.txt`, 46 of 61). |
| `src/modules/listings/actions/applyListingTransition.ts:140` `&&` | Not caught by any test. Real test gap: who gets the status notification; an owner could be notified of an own act. No access decision. (`r15-mutation-security.txt`) |
| `src/modules/listings/actions/applyListingTransition.ts:144` `listingTitle ?? listingId` | Not caught by any test. Real test gap: the content or the recipient of the notification. No access decision. (`r15-mutation-security.txt`) |
| `src/modules/listings/actions/applyListingTransition.ts:148` `slug` | Not caught by any test. Real test gap: the content or the recipient of the notification. No access decision. (`r15-mutation-security.txt`) |
| `src/modules/listings/actions/applyListingTransition.ts:151` `(await import('next/server')).after(notifyOwner)` | Another test catches it (`r15-mutation-security.txt`, 46 of 61). |
| `src/modules/listings/actions/applyListingTransition.ts:156` `revalidateTag('site-stats')` | Another test catches it (`r15-mutation-security.txt`, 46 of 61). |
| `src/modules/listings/actions/applyListingTransition.ts:161` `revalidatePath(`/${locale}/listings`, 'page')` | Not caught by any test. Real test gap: the public pages are not refreshed after a status change, so a hidden listing could stay in a cached page until its next revalidation. Listed for the owner. (`r15-mutation-security.txt`) |
| `src/modules/listings/actions/applyListingTransition.ts:162` `slug` | Not caught by any test. Real test gap: the public pages are not refreshed after a status change, so a hidden listing could stay in a cached page until its next revalidation. Listed for the owner. (`r15-mutation-security.txt`) |
| `src/modules/listings/actions/applyListingTransition.ts:163` `revalidatePath(`/${locale}/listings/${slug}`, 'pa… | Not caught by any test. Real test gap: the public pages are not refreshed after a status change, so a hidden listing could stay in a cached page until its next revalidation. Listed for the owner. (`r15-mutation-security.txt`) |

## Not tried (28)

| Line | Answer |
|---|---|
| `scripts/check-listing-visibility.mjs` | The command this line names tried nothing: 0 defects, exit 0 (F22). With `--all` it did not finish in 9 minutes (`r24-mutation-last.txt:88`). Not answered by a mutation run; its own 34 fixtures and Task 942 AC2 cover the allowlist. |
| `src/app/api/cron/listings-expiry/route.ts` | Run: 16 of 17 caught, 0 not tried (`r18-mutation-more.txt`). The rest are classified above or below. |
| `src/design-system/mantine/theme.ts` | Not run: 142 defects of design values, no security decision, and the visual gates hold them. |
| `src/lib/i18n/listingStatusLabel.ts` | Run: 3 of 3 caught, 0 not tried (`r24-mutation-last.txt`). |
| `src/app/admin/listings/visibilityFilter.ts` | Run: 6 of 6 caught, 0 not tried (`r18-mutation-more.txt`). |
| `src/components/admin/AdminListingsTable.tsx` | Run: 18 of 31 caught, 0 not tried (`r24-mutation-last.txt`). The rest are classified above or below. |
| `src/app/admin/listings/page.tsx` | Run: 2 of 55 caught, 0 not tried (`r24-mutation-last.txt`). The rest are classified above or below. |
| `src/modules/listings/lib/visibility.ts` | Run: 55 of 57 caught, 0 not tried (`r18-mutation-more.txt`). The rest are classified above or below. |
| `src/lib/auth/permissions.ts` | Run: 16 of 17 caught, 0 not tried (`r15-mutation-security.txt`). The rest are classified above or below. |
| `src/modules/admin/actions/permissions.ts` | Run: 64 of 68 caught, 0 not tried (`r15-mutation-security.txt`). The rest are classified above or below. |
| `src/modules/auth/actions/captcha.ts` | Run: 26 of 26 caught, 0 not tried (`r11-mutation-all.txt`). |
| `src/modules/listings/domain/listingTransitionEngine.ts` | Run: 37 of 38 caught, 0 not tried (`r11-mutation-all.txt`). The rest are classified above or below. |
| `src/modules/listings/actions/applyListingTransition.ts` | Run: 46 of 61 caught, 0 not tried (`r15-mutation-security.txt`). The rest are classified above or below. |
| `scripts/workflow-gates/change-review.mjs` | With `--all` it did not finish in 15 minutes (`r18-mutation-more.txt:33`). Hand-chosen breaks here: `r03-breaks-c.txt`; one survived (F18, R17). |
| `scripts/workflow-gates/code-check.mjs` | Not run: 361 defects, each a run of its tests. This review ran hand-chosen breaks instead (`r03-breaks-c.txt`); three survivors become tests in R17. |
| `scripts/workflow-gates/dependency-check.mjs` | Run: 77 of 89 caught, 0 not tried (`r18-mutation-more.txt`). The rest are classified above or below. |
| `scripts/workflow-gates/mutation-check.mjs` | Not run: 317 defects, each a run of its tests; the author tried 21. Hand-chosen breaks here (`r03-breaks-c.txt`). The thin figure stands in the review. |
| `scripts/workflow-gates/check-workflow.mjs` | The command this line names tried nothing: 0 defects, exit 0 (F22). With `--all` not run. GOV-945-CI-SETTINGS-DENY holds its new check, and its break fails it (sensitivity artifact). |
| `scripts/workflow-gates/ci-status.mjs` | Not run: 90 defects. Not changed by this commit; reviewed with Task 935. |
| `scripts/workflow-gates/cli.mjs` | Not run: 361 defects. Changed by reviewed Tasks 935 to 944, whose reviews carry their breaks. |
| `scripts/workflow-gates/contract.mjs` | Not run: 338 defects. Changed by reviewed Tasks 935 to 944, whose reviews carry their breaks; R19 changes it again, with a test. |
| `scripts/workflow-gates/hook-differential.mjs` | The command this line names tried nothing: 0 defects, exit 0 (F22). With `--all` not run. Hand-chosen breaks here: its main that always exits 0 survived (F18, R17). |
| `scripts/workflow-gates/hook-load-check.mjs` | Not run: 67 defects. Not changed by this commit; reviewed with Task 944. |
| `scripts/workflow-gates/mutation-loader.mjs` | With `--all`: 27 defects, none reached, because the loader cannot load itself under the loader. The same false line as F8 (c), R16. The sensitivity and mutation self-tests exercise it from outside. |
| `scripts/workflow-gates/prepush.mjs` | Not run: 256 defects. Not changed by this commit; reviewed with Task 935. |
| `scripts/workflow-gates/push-safety.mjs` | Not run: 210 defects. Not changed by this commit; reviewed with Task 935. |
| `scripts/workflow-gates/security-hook.mjs` | Not run: 1233 defects. Task 942 R14 holds a mechanical mutator over its added lines. |
| `scripts/workflow-gates/sensitivity-hooks.mjs` | Not run: 30 defects. Not changed by this commit; reviewed with Task 944. |

## Not caught, and not among the lines above (90)

| Line | Answer |
|---|---|
| `src/modules/listings/domain/listingTransitionEngine.ts:250` `this.name = 'ListingTransitionError'` | The name of an error class. Harmless. |
| `src/modules/admin/actions/permissions.ts:133` `e.old_allowed ?? null` | Real test gap, display only: the permission history would show a wrong old value or actor. No decision depends on it. |
| `src/modules/admin/actions/permissions.ts:135` `e.actor_user_id ?? null` | Real test gap, display only: the permission history would show a wrong old value or actor. No decision depends on it. |
| `src/modules/admin/actions/permissions.ts:198` `eventError` | Real test gap: a failed audit insert would go unlogged. Touches the audit trail of a permission change, so it is listed for the owner. |
| `src/modules/admin/actions/permissions.ts:206` `{ error: 'save_failed' }` | Real test gap: an unexpected failure of saving a permission would read as success in the admin UI. Listed for the owner. |
| `src/modules/listings/actions/applyListingTransition.ts:222` `current.slug ?? null` | Real test gap: the content or the recipient of the notification. No access decision. |
| `src/modules/listings/actions/applyListingTransition.ts:222` `current.title ?? null` | Real test gap: the content or the recipient of the notification. No access decision. |
| `src/modules/listings/actions/applyListingTransition.ts:222` `current.user_id ?? null` | Real test gap: the content or the recipient of the notification. No access decision. |
| `src/modules/listings/actions/applyListingTransition.ts:277` `current.slug ?? null` | Real test gap: the content or the recipient of the notification. No access decision. |
| `src/modules/listings/actions/applyListingTransition.ts:277` `current.title ?? null` | Real test gap: the content or the recipient of the notification. No access decision. |
| `src/modules/listings/lib/visibility.ts:123` `q = q.in('status', eligibleStatuses)` | Dead branch today: only `active` is public (`visibility.ts:16-18`), so `.in` never runs. It becomes a gap the day a second public status exists. |
| `src/modules/listings/lib/visibility.ts:151` `q = q.in('status', eligibleStatuses)` | Dead branch today: only `active` is public (`visibility.ts:16-18`), so `.in` never runs. It becomes a gap the day a second public status exists. |
| `src/app/api/cron/listings-expiry/route.ts:59` `0` | A default of a count in a dry-run report. Harmless. |
| `scripts/workflow-gates/dependency-check.mjs:17` `true` | An option of the npm process: its output limit or timeout. A test could tell them apart only at the limit. Harmless. |
| `scripts/workflow-gates/dependency-check.mjs:17` `1` | An option of the npm process: its output limit or timeout. A test could tell them apart only at the limit. Harmless. |
| `scripts/workflow-gates/dependency-check.mjs:17` `28` | An option of the npm process: its output limit or timeout. A test could tell them apart only at the limit. Harmless. |
| `scripts/workflow-gates/dependency-check.mjs:17` `60000` | An option of the npm process: its output limit or timeout. A test could tell them apart only at the limit. Harmless. |
| `scripts/workflow-gates/dependency-check.mjs:20` `true` | An option of the npm process: its output limit or timeout. A test could tell them apart only at the limit. Harmless. |
| `scripts/workflow-gates/dependency-check.mjs:20` `1` | An option of the npm process: its output limit or timeout. A test could tell them apart only at the limit. Harmless. |
| `scripts/workflow-gates/dependency-check.mjs:20` `26` | An option of the npm process: its output limit or timeout. A test could tell them apart only at the limit. Harmless. |
| `scripts/workflow-gates/dependency-check.mjs:84` `real = realpathSync.native(real);` | The guard that runs its main when started as a script. The self-tests do start the main as a process (`dependency-check.selftest.mjs:136`), yet these defects are not noticed; I did not establish whether the defect reaches that child. R17 (the implementer explains it or a test catches it). |
| `scripts/workflow-gates/dependency-check.mjs:85` `===` | The guard that runs its main when started as a script. The self-tests do start the main as a process (`dependency-check.selftest.mjs:136`), yet these defects are not noticed; I did not establish whether the defect reaches that child. R17 (the implementer explains it or a test catches it). |
| `scripts/workflow-gates/dependency-check.mjs:85` `process.platform === 'win32' ? real.toLowerCase() | The guard that runs its main when started as a script. The self-tests do start the main as a process (`dependency-check.selftest.mjs:136`), yet these defects are not noticed; I did not establish whether the defect reaches that child. R17 (the implementer explains it or a test catches it). |
| `scripts/workflow-gates/dependency-check.mjs:87` `&&` | The guard that runs its main when started as a script. The self-tests do start the main as a process (`dependency-check.selftest.mjs:136`), yet these defects are not noticed; I did not establish whether the defect reaches that child. R17 (the implementer explains it or a test catches it). |
| `scripts/workflow-gates/dependency-check.mjs:87` `===` | The guard that runs its main when started as a script. The self-tests do start the main as a process (`dependency-check.selftest.mjs:136`), yet these defects are not noticed; I did not establish whether the defect reaches that child. R17 (the implementer explains it or a test catches it). |
| `src/components/admin/AdminListingsTable.tsx:58` `/` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:66` `useEffect(() => { setItems(init) }, [init])` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:66` `setItems(init)` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:77` `reason ?? null` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:89` `setPremiumDialog(null)` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:90` `router.refresh()` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:100` `propertyTypes.find(pt => pt.value === previewList | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:100` `===` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:105` `router.refresh()` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:109` `setPreviewListing(null)` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:114` `router.refresh()` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:130` `===` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/components/admin/AdminListingsTable.tsx:131` `\|\|` | Real test gap: what the staff table shows and refreshes after an action. Its filters navigate only; the server re-reads under its own guard. No access decision. |
| `src/app/admin/listings/page.tsx:21` `await getAdminLocale()` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:24` `sp.tab ?? 'all'` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:25` `sp.status ?? ''` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:30` `sp.visibility ?? ''` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:31` `sp.reason ?? ''` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:32` `max` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:32` `sp.page ?? 1` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:32` `1` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:33` `25` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:34` `-` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:34` `1` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:34` `*` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:35` `+` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:35` `-` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:35` `1` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:41` `qTrimmed` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:46` `100` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:47` `ownerIds = (nameMatches ?? []).map(u => u.id)` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:47` `nameMatches ?? []` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:53` `emailMatches` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:55` `ownerIds = [...new Set([...ownerIds, ...emailIds] | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:69` `false` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:73` `===` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:73` `query = query.eq('is_premium', true)` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:73` `true` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:75` `status` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:75` `query = query.eq('status', status)` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:76` `qTrimmed` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:82` `>` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:82` `1` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:85` `>` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:85` `orParts.push(`user_id.in.(${ownerIds.join(',')})` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:85` `0` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:89` `FULL_UUID.test(qTrimmed)` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:89` `orParts.push(`id.eq.${qTrimmed}`)` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:91` `query = query.or(orParts.join(','))` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:94` `query = applyAdminListingsVisibility(query, visib | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:99` `true` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:102` `true` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:106` `true` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:112` `auditTotalResult.count ?? 0` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:112` `0` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:113` `auditExpiredResult.count ?? 0` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:113` `0` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:114` `auditNoExpiryResult.count ?? 0` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:114` `0` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:119` `( <AdminPageFrame width="shell"> <AdminPageHeader | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:121` `count ?? 0` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:121` `0` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:123` `listings ?? []` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:124` `count ?? 0` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |
| `src/app/admin/listings/page.tsx:124` `0` | Real test gap: no test renders this server page past its guard, so its filters, search, pagination and counts are unchecked. The guard itself, `requireStaffPage` at `:20`, is caught. Listed for the owner. |

