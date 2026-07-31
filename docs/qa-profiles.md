# QA Profiles

This file defines how much evidence a task must produce. It prevents small changes from inheriting
release-level visual QA while keeping high-risk UI, auth, RLS, lifecycle, and design-system work protected.

## Selection rule

Every kickoff and review must name one QA profile:

| Profile | Use when | Required evidence |
|---|---|---|
| `Q0 Docs/Governance` | The task changes only rules, docs, prompts, reports, or task files. | Read-after-write check, markdown structure/reference validation, contradiction scan against affected rules, and no product validation unless a referenced command is changed. |
| `Q1 Targeted` | Non-UI code, localized copy, small isolated fixes, tests, internal helpers, or low-blast-radius behavior. | Targeted tests or commands for the touched area, typecheck when source code changes, the final production build (`npm run build`) with exit code 0, i18n key parity when messages change, and file-integrity/mojibake checks for touched text files. |
| `Q2 Standard UI` | A UI change that touches an existing surface but does not create or migrate a primitive, overlay, table strategy, page shell, or major responsive layout. | `Q1` plus rendered checks at minimum `320`, `390`, `768`, `1024`, and one desktop width (`1440` or `1920`); `uk@320` is mandatory. Check all four locales at `320` and the selected desktop width; when user-facing text changes, check all four locales at every required Q2 width. |
| `Q3 Full Visual Matrix` | New or migrated Mantine primitive, overlay/popup, table/card switch, page shell, navigation/header/footer, Storybook governance, TailAdmin conformance slice, high-risk responsive work, or any task the owner marks visual-critical. | `Q1` gates, including the final zero-exit production build, plus full canonical visual evidence for the relevant proof path: all required Storybook/app widths and all four locales, including mobile stress cells; TailAdmin side-by-side evidence when styling/chrome is in scope. |
| `Q4 Release/Critical Flow` | Release readiness, auth/account lifecycle, RLS/write-path security, data loss risk, payment/moderation/reporting critical flows, or changes touching `docs/critical-flow-registry.md`. | `Q1`/`Q2`/`Q3` as applicable plus regression baseline, changed-behavior test, planted-violation failure proof when a gate is claimed, and owner-native or CI evidence for security/integrity-sensitive checks. |

## UI evidence routing

- Mantine-native work uses `docs/mantine-responsive-design-system.md` and the Mantine Storybook proof path.
- Legacy shadcn/Tailwind surfaces use the legacy docs only until migrated.
- TailAdmin visual conformance is required when visual chrome, density, spacing, typography, border, shadow, radius, or primitive styling is in scope.
- A logic-only task that touches a UI file does not automatically become `Q3`; choose the profile by user-visible and layout risk.

## Viewport policy

The canonical full matrix remains:

`320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560`

Use it for `Q3` and `Q4` visual work. For `Q2`, use the targeted subset listed above unless the kickoff explains why the full matrix is necessary.

Older references to 7-width, 9-width, or 12-width sets are historical unless the active task's proof path explicitly names them. When in doubt, use this file to pick the profile, then use the task-type document for the exact command or story path.

Some legacy proof commands capture an additional ultrawide viewport (15 cells instead of this 14-width canon).
That is an acceptable superset, not a competing canonical matrix.

**Per-story viewport sets are not uniform.** The `--mantine-only` rendered matrix assigns viewports per story, so a
story enrolled at 4 viewports (e.g. `HowItWorksSteps/Default`, `HomepageListingGrids/Default` — mobile-320/375/390 +
desktop-1024) proves nothing above 1024px. Before claiming a breakpoint tier is covered, read the tier's widths out of
the manifest for that specific story; do not infer coverage from the union of all viewports in the run. See
`docs/storybook-governance.md` §14.9.17 for the per-story mechanism.

**Comparing a rendered run against a baseline.** When a task's claim is that nothing rendered differently, the
comparator and the tolerance for md5-changed cells are governed by `docs/storybook-governance.md` §14.11 (D26,
sub-perceptual rasterization delta) together with the empirically measured harness-noise set. Do not invent a
per-task pixel tolerance.

## Negative-flow applicability

Kickoffs must include positive and negative flows, but not every possible branch applies to every task.
Use an applicability table instead of inventing irrelevant scope:

| Branch | Applicable? | Owner/source | Expected behavior | Evidence |
|---|---:|---|---|---|
| Validation | Yes/No | Form schema, action, or existing behavior | Specific localized response or N/A | Test/manual step |
| Authorization/RLS | Yes/No | Route/action ownership | Typed forbidden/unauthorized result or N/A | Test/native/CI |
| Offline/network | Yes/No | Existing network layer | Existing global behavior or N/A | Manual/test |
| Concurrent writer | Yes/No | Data model | Conflict behavior or N/A | Test/manual |

Do not add a negative branch to implementation scope unless it is relevant to the changed flow or already part of the preserved behavior.

## Approval impact

- `Q0` and `Q1` can be approved without rendered screenshots when no rendered UI behavior changed.
- `Q2` can be approved with targeted rendered evidence.
- `Q3` cannot be approved without full visual proof for the affected stories/surfaces.
- `Q4` cannot be approved without the named regression/security evidence.

If evidence is unavailable, the review decision is `PARTIALLY VERIFIED`, `NEEDS REVISION`, or `BLOCKED`, not `APPROVED`.
