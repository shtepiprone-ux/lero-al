# Checklist I — Sonnet implements a task (skill `execute-task`)

Every item, in this order, under checklist A. The report names each item with its result. Sonnet never edits
`.claude/**`, `CLAUDE.md`, `AGENTS.md`, `.github/**`, `.githooks/**` or `scripts/quality/**`; the need is reported.

| # | Step | Done when |
|---|---|---|
| I1 | `git status --short` | the output is empty; otherwise stop and report it |
| I2 | Read the kickoff in full; write down the Scope files and the Route's test files | these are the only files you change and the only tests you run |
| I3 | Read each Scope file and its `main` version (`git show main:<path>`) | you know what `main` does there (A2) |
| I4 | Write each acceptance criterion's test; run it: `npm test -- <test file>`; a `scripts/quality/*.test.mjs` file: `node --test <test file>` (Vitest excludes `scripts/quality/**`, `vitest.config.ts`) | it fails on the unchanged code; keep that output |
| I5 | Make the change the "Fix:" line names | the smallest diff that removes the Cause (A1); no new UI, behaviour or wording |
| I6 | Before every edit ask: is this file in the Scope, and does the Cause need this line? | no: do not edit. The Cause cannot be fixed inside the Scope: stop, report to Opus as `BLOCKED` with the fact, never widen the Scope yourself |
| I7 | `git diff --stat`, then read every changed file once, from its first line to its last | only Scope files changed; every changed line is needed by the Cause; a hole in it is fixed at once with its test; a hole elsewhere is reported (A4) |
| I8 | `npm test -- <the Route's test files>`; a `scripts/quality/*.test.mjs` file: `node --test <test file>` | every one exits 0 |
| I8a | **Visible UI: measure what you changed** (owner, 2026-11-23). On the running app dev server and Storybook dev server (A5), open every page and every Story that renders an element you changed, in every state the Story renders, at 320, 640, 1024 and 1440px; read each changed element's computed style (height, radius, border colour and width, padding, font size and weight, text colour, shadow, focus, error, disabled) and compare it with its canonical primitive Story and with the same element type elsewhere on the page; no browser tool in the session: `BLOCKED: no browser` | every difference is fixed within the Scope or reported with its values; the report lists each element, its values and its comparison |
| I9 | Each security test: remove its control once, run the test, restore | the test fails without the control; the file is restored |
| I10 | Only when the kickoff names them: `node scripts/quality/db-catalog-audit.mjs`, `node --env-file=.env.local scripts/quality/cloudinary-config.mjs` | outputs in the report |
| I11 | No CI check runs locally (A5): no full test run, CI job, build or census; the dev servers of I8a are not CI | — |
| I12 | Report to the owner in Ukrainian | `git diff --stat`; every command with its exit code; the failing-first output (I4); the break output (I9); each item not done with its fact; no Git command |
