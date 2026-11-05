# Task 945 review 1 — the owner's answers on the decisions list, and what was measured (2026-11-05)

The list came from point 7 of the author's report (`impl/completion-report.md:226`). The review passed it on. No product file changed for any of this.

## 1. Updating `next` and `@sentry/nextjs`

The owner asked for commands, if the owner can run them. Measured on a temporary folder holding only the manifests, nothing installed.

| Fact | Evidence |
|---|---|
| With `next@15.5.28`, `eslint-config-next@15.5.28` and `@sentry/nextjs@10.78.0`: production audit from 2 critical, 9 high, 34 total to 0 critical, 9 high, 22 total | `r29-audit-fix-dry-run.txt:1-5` |
| The same totals with `next@15.5.29` | `r27-upgrade-dry-run.txt` |
| `next@15.5.29` is 2 days old, `next@15.5.28` 22, `@sentry/nextjs@10.78.0` 8; the check of Task 945 sets `minVersionAgeDays` to 7 | `r27-upgrade-dry-run.txt`; `scripts/workflow-gates/code-check.json` |
| `npm audit fix` after them: 0 critical, 4 high, 14 total, but 514 lock entries change | `r29-audit-fix-dry-run.txt` |
| What stays high needs a major: `next-cloudinary@7`, `next@16` | `r29-audit-fix-dry-run.txt` |
| One changed byte of the lock file changes the digest of all 9 reviewed contracts; runtime files are never rebased | `r28-update-gate.txt:3-14` |
| `package.json` and the lock file are product paths, so a diff needs a product contract holding them | `scripts/workflow-gates/cli.mjs:106,142` |

Do the critical advisories apply here? Windows-hosted RCE: no, production is on Vercel. Image Optimization RCE (AVIF, SVG): the project imports `next/image` nowhere and sets no `images` config (`r28-update-gate.txt`, `next.config.ts:10`); whether the `/_next/image` endpoint can still be reached was not tested. Sentry: no `tunnelRoute`, the advisory's first condition. What does apply: the high denial of service in Server Actions, ranges up to 15.5.27, because this is an App Router application using them.

Not run: a real `npm install`, `npm run build` or the tests on the updated tree, which would rewrite `node_modules` under any session working in this folder.

Open: how the update reaches main, given the digests. Owner decision; the Sprint's Order text says so.

## 2. `ignore-scripts=true` in `.npmrc`

The review listed this as "not measured" and handed it to the owner without measuring it. It could have been measured, and now it is (`r26-ignore-scripts.txt`, `r27-upgrade-dry-run.txt`):

- `npm ci --ignore-scripts` exits 0 and all 8 probes pass on Windows: seven packages with an install script, of which `esbuild` only in its top-level copy, and the compiler of `next`. `fsevents` is macOS only. On Linux nothing was run; its binaries are in the lock file.
- In `.npmrc` it does more than the install. It also stops the `pre` hooks of `npm run` (executed): `prebuild-storybook`, `prestorybook` and `pregovernance:storybook` would silently not run, and with them `scripts/prepare-storybook-next15.mjs` and `scripts/check-stories.mjs`, including in the CI job at `.github/workflows/governance-pr.yml:280`. That is a check going quiet with nothing red.

So the measured answer: not in `.npmrc`. If install scripts are to be off, the flag belongs on the install command only. Not measured: a real `next build` and Vercel with scripts off.

## 3. CODEOWNERS

It came from the OWASP page the implementer read: "Set up CODEOWNERS rules that require specific reviewers for sensitive files". The implementer found no such file and listed it; the review passed it on and added the path to R19. The repository has one collaborator and the ruleset requires no reviewer, so the file would enforce nothing today. No decision is needed. The path in R19 only keeps the file under governance if one is ever made.

## 4. Agents' access to `.env.local`

Not answered by the owner. It stays open.

## 5. MCP allowlist and Vercel write tools

- The Vercel MCP of this session is signed in: `get_auth_user` answered with the owner's account (executed once, read-only).
- It offers write tools: production promotion and rollback, deployment, project environment variables, firewall, DNS records, domain purchase.
- Nothing denies them: `permissions.deny` in the project and user settings lists Git and `gh` commands only, `.claude/settings.json` has no `mcp__` entry, and `PreToolUse` matches `Edit|Write|Bash|PowerShell` (`security-hook.mjs` names no MCP tool).
- The rule "deploy and env writes are the owner's" is a saved memory, which nothing enforces. A page or file an agent reads could ask for such a call, and all that stands in its way is the session's permission mode.

The possible fix, a deny list of the write tools in `.claude/settings.json`, is a policy path and goes through governance. Owner decision.

## 6. The test holes

Decided: Task 931 as a revision with no new number (D29). Done: revision 4, `docs/sessions/evidence/task931/design/readiness-r4.md`.
