# Task 986 — The e-mail templates use supported React Email packages, and the dead preview script is gone

Sprint 93. Priority P2. Found 2026-11-17 by Opus in Task 972 Review 2 (findings F5, F6); no owner decision needed to
start (golden rule, 2026-11-07). Implementer: Sonnet, after Task 972 is merged (both change `package.json` and
`package-lock.json`). Reviewer: Opus. Human owner of the change: the owner.

## Goal

Every e-mail the product sends is built from `@react-email/components` 1.0.12, which npm marks "Package no longer
supported" and which has no newer release, so no security fix will reach the e-mail rendering path. The `npm run email`
preview cannot start and would show no template. After the task the templates import the same components from the
supported `react-email` package and `render` from `@react-email/render`, `@react-email/components` is not in the tree,
and the dead script and its documentation are gone.

## Cause

- `npm view @react-email/components@1.0.12 deprecated` → "Package no longer supported. Contact Support at
  https://www.npmjs.com/support for more info."; `npm view @react-email/components dist-tags --json` → `latest` 1.0.12.
- `package.json:147` declares `@react-email/components` `^1.0.12`; `src/modules/notifications/lib/emails/send.ts:15`
  imports `render` from it, and `src/modules/notifications/lib/emails/BaseEmail.tsx:23` and eight more templates import
  `Body`, `Column`, `Container`, `Head`, `Hr`, `Html`, `Link`, `Preview`, `Row`, `Section`, `Text` from it.
- `node_modules/react-email/dist/index.mjs` (6.1.5, `package.json:217`, a devDependency) exports each of those eleven
  components and not `render`; `npm view react-email@6.1.5 deprecated` → empty; `npm view @react-email/render@2.0.8
  deprecated` → empty; `npm ls @react-email/render --all` → 2.0.6 top-level (from `@react-email/components`), 2.0.8 under
  `react-email`.
- `package.json:54`: `"email": "email dev --dir src/modules/notifications/lib/emails"`. `react-email` 6.1.5 asks to
  install `@react-email/ui` before the preview starts (`node_modules/react-email/dist/cli/index.mjs:6625`), and the
  lockfile has no `node_modules/@react-email/ui` (on `origin/main` and in Task 972); a file counts as a template only with
  a default export (`index.mjs:6489-6492`), and no file in the emails folder has one.
Fix: the templates and `send.ts` import the components from `react-email` and `render` from `@react-email/render`;
`react-email` 6.1.5 and `@react-email/render` 2.0.8 are exact production dependencies; `@react-email/components` and
the `email` script leave, with the documentation lines that describe them.

## Scope

- `package.json`, `package-lock.json`: remove `@react-email/components` and the `email` script; `react-email` moves from
  `devDependencies` to `dependencies` as exactly `6.1.5` (no version change); `@react-email/render` exactly `2.0.8` in
  `dependencies`; `npm install --ignore-scripts`; no other version changes.
- Dependencies: `@react-email/render` 2.0.8 — `npm view @react-email/render time.created` → 2022-09-22, version released
  2026-04-28, repository `https://github.com/resend/react-email.git`, `npm view @react-email/render@2.0.8 scripts` → no
  install script, dependencies `prettier`, `html-to-text`; already in the lockfile under `react-email`.
- `src/modules/notifications/lib/emails/{BaseEmail,VerifyEmail,RecoveryEmail,ReauthEmail,MagicLinkEmail,
  PasswordChangedEmail,InactivityWarningEmail,InactivityFinalEmail,ReporterNotificationEmail}.tsx`: the component
  import comes from `react-email`; `send.ts`: `render` from `@react-email/render`. No other line of these files changes.
- The three `vi.mock('@react-email/components', …)` of `send.security.test.ts`, `send.address.test.ts` and
  `src/app/api/auth-email-hook/authEmailHook.security.test.ts` mock `@react-email/render` instead.
- New `src/modules/notifications/lib/emails/__tests__/templates.render.test.tsx` (AC1, AC2).
- `docs/dependencies.md:12-13`, `docs/env.md:26`, `docs/integrations.md:220,239,251`: the packages and the preview as
  they are after the task.
- Out of scope: the template designs and texts; a working preview (`@react-email/ui` would be a new dependency: a
  separate owner decision); `docs/sessions/**` (history).

## Attack surface

Dependency change; no route, action, permission or data flow changes. Threat model:
- T1 Tampering (supply chain): an unsupported package receives no security fix → it leaves; the replacement versions are
  the ones already in the lockfile, at least 14 days old — eliminate, AC3, AC4.
- T2 Tampering (output): a template's HTML changes, or user text stops being escaped → every template rendered through
  the real `render`, its escaping checked — mitigate, AC1, AC2.
- T3 Denial of service (regressions): the build or a send path breaks → AC5.

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (upstream 7af0ef1b745f, 2026-11-17).

- Abuse_Case: not applicable — no feature or entry point is added; the denial of service threat is a regression only.
- Attack_Surface_Analysis: "developers should understand and monitor the Attack Surface as they design and build and change a system" — an unsupported package leaves the production tree and two supported ones take its place — AC3, AC4.
- Authentication: not applicable — triggered by the template name ReauthEmail; no authentication code or rule changes.
- Authentication_Patterns: not applicable — the reauthentication e-mail keeps its code and text; only an import changes.
- Bot_Management_and_Anti-Automation: not applicable — no endpoint or request limit changes; only e-mail rendering imports change.
- Cookie_Theft_Mitigation: not applicable — no cookie or session handling is touched by an import change.
- Credential_Stuffing_Prevention: not applicable — sign-in and its CAPTCHA are not touched by this task.
- Cross_Site_Scripting_Prevention: "Output encoding is not perfect. It will not always prevent XSS." — the rendered e-mail keeps React escaping of user values, checked on the real render — AC2.
- DOM_based_XSS_Prevention: not applicable — e-mails are rendered on the server to a string; no browser DOM code changes.
- Denial_of_Service: not applicable — no product endpoint or resource limit changes; regressions are covered by AC5.
- Dependency_Graph_SBOM: not applicable — the SBOM job is unchanged and records the new production packages on its run.
- HTTP_Strict_Transport_Security: not applicable — triggered by https addresses in the text; no header changes.
- JavaScript_and_TypeScript_Security: not applicable — `send.ts` changes one import; no merge, pattern or untrusted parsing is added.
- Key_Management: not applicable — `docs/env.md` loses a comment line; no key is created or read differently.
- Multifactor_Authentication: not applicable — triggered by the template name ReauthEmail; no factor or code rule changes.
- NPM_Security: "Always vet and perform due-diligence on third-party modules you install to confirm their health and credibility." — the replacement packages are read on npm in Scope (not deprecated, dated, no install script) — AC4.
- Nextjs_Security: not applicable — only a test mock of the auth e-mail hook changes; the route itself is untouched.
- Nodejs_Security: not applicable — no route or authentication flow changes; the hook test only mocks another module.
- REST_Security: not applicable — the auth e-mail hook endpoint and its checks do not change in this task.
- Secrets_Management: not applicable — `docs/env.md` loses the preview comment; no secret is added, moved or read.
- Secure_Code_Review: "Diff-Based Reviews focus on code changes only." — the review reads the import changes and the lockfile through its tools — AC3, AC4.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries" — both packages are already in the lockfile and read with `npm view` — AC4.
- Secure_Product_Design: "Threat Modeling - which results in security related stories being added during" — each threat of the model maps to an acceptance criterion — AC1, AC2, AC3, AC4, AC5.
- Serverless_FaaS_Security: not applicable — no trigger or function configuration changes; only a test mock changes.
- Session_Management: not applicable — triggered by the template name ReauthEmail; no session code changes.
- Software_Supply_Chain_Security: "limit the application's dependencies to a specific version that has been previously verified as legitimate and secure" — exact pins of versions already in the lockfile and at least 14 days old — AC4.
- Threat_Modeling: "the threat modeling process should answer the following four questions" — the Attack surface answers them for the dependency change — AC1, AC2, AC3, AC4, AC5.
- Transaction_Authorization: not applicable — the reauthentication code e-mail is only re-imported; no authorization step changes.
- Transport_Layer_Security: not applicable — triggered by https addresses in the text; no TLS setting changes.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — the reviewer reruns the render tests and the AC4 commands — AC1, AC4.
- Vulnerable_Dependency_Management: "It's highly recommended to perform automated analysis of the dependencies from the birth of the project." — a deprecated production package leaves and the CI audit covers its replacements — AC3, AC4.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — user values reach the e-mail only as escaped React text, never through innerHTML — AC2.
- Web_Service_Security: not applicable — no service schema or payload validation changes; only a test mock changes.

## UI

No visible change on the site. The e-mail HTML is checked by AC1 and AC2.

## Mobile adaptation record

- Scope: none

## Acceptance criteria

- AC1 Each of the eight templates (each wraps `BaseEmail`) renders through the real `render` of `@react-email/render`
  to an HTML document that holds the value passed to it (its link, the code of `ReauthEmail`, the name or the listing
  title) — test: `templates.render.test.tsx`.
- AC2 A user value with markup (`<img src=x onerror=alert(1)>`) as `name` of `PasswordChangedEmail`
  (`PasswordChangedEmail.tsx:14`) and as `listingTitle` of `ReporterNotificationEmail` (`ReporterNotificationEmail.tsx:93`)
  appears escaped, never as a tag — test: `templates.render.test.tsx` (fails when the value is passed through
  `dangerouslySetInnerHTML`, deliberate break).
- AC3 No file in the repository imports `@react-email/components`, and it is not in the tree — test:
  `templates.render.test.tsx` (reads every file under `src/` for the import; red before the change) and
  `npm ls @react-email/components --all` prints `(empty)`.
- AC4 No dependency is deprecated or younger than 14 days, none gains an install script, and the lockfile installs with
  the npm of CI (Task 972 F8) — test: `npx --yes npm@10.9.8 ci --ignore-scripts --dry-run` exits 0; `npm ci
  --ignore-scripts` prints no `npm warn deprecated @react-email`, `node scripts/quality/change-report.mjs --lockfile-age
  origin/main` and `node --test scripts/quality/install-scripts.test.mjs` exit 0, `node scripts/quality/audit-gate.mjs
  --omit-dev --level high` exits 0.
- AC5 The project still builds and passes — test: `npm run lint`, `npm run typecheck`, `npm test -- --coverage`,
  `npm run build`, each exit 0; `package.json` has no `email` script.

## Route

1. Test first: `templates.render.test.tsx` on the unchanged code (AC3 case red); save the output.
2. `package.json` and the install per Scope; `npm ls react-email @react-email/render @react-email/components --all`.
3. The imports, the three mocks and the documentation lines; three passes over every changed file.
4. Run: npm run lint · npm run typecheck · npm test -- --coverage · node scripts/quality/changed-lines-coverage.mjs
   --base origin/main · node scripts/quality/check-files.mjs --worktree · AC4 commands · npm run build; one deliberate
   break per AC1/AC2 case group, restored.
5. Report: each command, exit code, relevant output; every version change with its release date.

## Review
