# Task 967 — A failing play function fails the Storybook render gates

Sprint 93 (governance reset). Priority P1. Owner decision D1 (2026-11-06): "rewrite the rules of the flow and the
gates"; golden rule (2026-11-07): a gap found is closed, not reported. Found in the Task 948 review 1 (2026-11-09).
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

A play function that fails is invisible to the gates that render Stories. `storybook/test` adds a project annotation
`throwPlayFunctionExceptions: false` (`node_modules/storybook/dist/preview/runtime.js:30962`). With it, Storybook
catches the play's error, emits `PLAY_FUNCTION_THREW_EXCEPTION`, calls `console.error(error)` and continues to the
`completed` phase (`node_modules/storybook/dist/_browser-chunks/chunk-M6YZR3ZW.js`, the `catch` after
`runPhase(abortSignal, "playing", …)`). `scripts/check-locale-leak.mjs` (`collectStoryTokens`) fails a tuple only on
`sb-show-errordisplay`, an `errored` phase, a page error or a console line `Error rendering story '<id>'`, so the
failed play passes. The Task 948 executor saw it: the new play of `ListingGalleryPattern` `Default` failed while the
detector reported the Story rendered, until the Story set `throwPlayFunctionExceptions: true`
(`src/stories/patterns/mantine/ListingCardPattern.stories.tsx:286-290` documents the same blind spot). On
2026-11-09, 39 Story files have a play function and 17 set the parameter (`grep -rl "play:"` and
`grep -rl "throwPlayFunctionExceptions: true"` over `src/stories`), so the plays of up to 22 files are not gated.

After the task a failing play fails every Story, at every width and locale of the CI shards, and every play passes.

## Scope

- `.storybook/preview.tsx`: `parameters.throwPlayFunctionExceptions: true` in the project preview, with a one-line
  comment naming this task. The project preview is applied after the addon annotations, so it wins; the test proves it
  on the composed annotations, not by reading the file.
- New `.storybook/__tests__/preview.test.ts`: the composed project annotations (`composeConfigs` of the addon
  annotations the build uses plus `.storybook/preview.tsx`, or the Storybook API that builds them) resolve
  `throwPlayFunctionExceptions` to `true`.
- Every play that fails once the parameter is on: measure with the six shards first (report the list with the cause of
  each), then fix the play or the Story data. A failure caused by the product (a component that behaves wrongly) is
  not fixed here: report it to Opus, who files it.
- The per-Story `throwPlayFunctionExceptions: true` lines may stay (redundant, harmless); none is removed in this task.
- Out of scope: product code, the detectors' code, `scripts/quality/**`, CI workflow.
- Dependencies: none.

## Attack surface

Unchanged: Storybook build and its CI gates only; nothing reaches the Next.js build (`next build` does not read
`.storybook/`).

## OWASP

Required by `node scripts/quality/owasp.mjs plan` (3751c8beb70f, mapping of 2026-11-09).

- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the play and Story-data fixes render text through React escaping only; lint (react/no-danger, no-script-url) runs on them — AC4.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the preview parameter and play fixes add no eval, Function, innerHTML or computed URL; lint (no-eval, no-implied-eval) checks them — AC4.
- Injection_Prevention: not applicable — the detector is run with fixed flags only; its code, which builds the iframe URL, is out of scope.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC4.
- Logging: not applicable — the task changes no log of the product; the `console.error` named in Goal is Storybook's own, in the Storybook preview.
- Logging_Vocabulary: not applicable — no security event is logged or renamed; only Storybook's play error handling in the preview changes.
- Nextjs_Security: not applicable — Storybook renders components only; no Server Action, route, proxy or Next.js build input changes.
- OS_Command_Injection_Defense: not applicable — no script that starts a process is changed; the detector runs unchanged with fixed flags.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC2, AC3.
- Third_Party_Javascript_Management: not applicable — the preview gets one parameter; no third-party script is added to Storybook's head or to the site.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC3.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the play and Story-data fixes use no innerHTML; lint (react/no-danger) fails on one — AC4.

## UI

No visible change of production UI. Stories render as before; a play that fails now fails the gate.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The project preview turns a failed play into a failed render — test: `.storybook/__tests__/preview.test.ts`
  (new; red without the parameter in `.storybook/preview.tsx`, because the `storybook/test` annotation is `false`).
- AC2 A failing play of a Story without its own parameter fails the gate — test: `node scripts/check-locale-leak.mjs
  --mantine-only --report-only-leaks --story=patterns-mantine-listinggallerypattern--default --widths=320` exits 1 with
  "Story render/play failed" when that Story's own `throwPlayFunctionExceptions` line is removed and its play asserts a
  wrong value (deliberate break, restored by sha), and exits 0 restored; with the AC1 parameter removed the same break
  exits 0 (the blind spot, kept as the red output).
- AC3 Every play passes: `node scripts/check-locale-leak.mjs --mantine-only --report-only-leaks --shard=N/6` exits 0
  for N = 1…6 on one build, with no tuple whose reason is a render or play failure (report paths and counts).
- AC4 `npm run lint`, `npm run typecheck`, `npm test -- --coverage`, `node scripts/quality/check-files.mjs --worktree`
  and `node scripts/quality/ac-tests.mjs --base main <kickoff>` exit 0.

## Route

1. Write the AC1 test; run it red. Add the parameter; run it green.
2. Build Storybook (`NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npm run build-storybook`); run the six
   shards; list every play failure with its cause.
3. Fix each failing play or its Story data; report a product cause to Opus instead of fixing it.
4. Run AC2's deliberate break both ways, then AC3 and AC4. Report each command, exit code and the relevant lines.

## Review
