# Task 948 — The product checks of CI pass: four token findings and one Tailwind utility

Sprint 93 (governance reset). Priority P1. Owner decision D1 (2026-11-06): "rewrite the rules of the flow and the
gates" — a gate that is red on `main` checks nothing. Absorbs the legitimate part of the withdrawn Task 937 (the
product debt; its detector rewrite is dropped). Implementer: Sonnet. Reviewer: Opus.

## Goal

`node scripts/quality/product-gates.mjs` (the `quality` job of `.github/workflows/ci.yml`) fails on two gates,
measured 2026-11-06 on `task/935-governance-approval-route`:

1. `npm run check:design-tokens:strict` — 2 violations, 2 stale markers:
   - `src/components/shared/Map.module.css:37` `line-height: 30px` (css-length) **and** its marker is reported stale:
     the line carries two comments (`/* Leaflet's own */ /* design-tokens-allow: … */`), and the marker is not matched;
   - `src/modules/cabinet/components/CabinetEmailChangeSectionView.tsx:70` `<Info size={20} />` (raw-dimension-prop) —
     the same alert icon elsewhere uses the theme: `ListingDetailView.tsx:443` `theme.other!.iconSize!.standard`,
     `ListingStatusBanner.tsx:28` `theme.other!.iconSize!.roomy`;
   - `src/design-system/mantine/input-chrome.css:476` `inset-block: -1px` marker reported stale.
2. `npm run check:enrolled-tailwind` — `src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx:98`
   `overflow-clip` is a new Tailwind utility in an enrolled Mantine file (the baseline is remove-only), and the
   `overflow-hidden` entry is stale (count 1, baseline 2).

After the task both commands exit 0 and no behaviour changes.

## Scope

- `Map.module.css:37`: one comment on the line, in the marker format the detector documents
  (`design-tokens-allow: <value> — <reason>`), keeping Leaflet's 30px from 640px up (the value restores Leaflet's own
  stylesheet; it is not a project design value). Read `scripts/check-design-tokens.mjs` for the exact marker grammar
  before writing it.
- `CabinetEmailChangeSectionView.tsx:70`: `theme.other!.iconSize!.roomy` (20, `src/design-system/mantine/theme.ts:765`),
  as `ListingStatusBanner.tsx:28` does for the same alert icon; if the View has no theme access, use
  `useMantineTheme()`. Rendered size stays 20px.
- `input-chrome.css:476`: a marker the detector matches (or remove it if the value is no longer a finding — state
  which, with the detector line that decides).
- `MantineListingGalleryPattern.tsx:98`: the clip moves out of the Tailwind class into the pattern's own styling
  owner (its CSS module, or `style`/Mantine `Box` styles as the file already does for the track), keeping
  `overflow: clip` (the reason is in the comment at lines 86–87: a hidden-overflow box is a scroll container and
  scrolls the wrong slide into view). Then `npm run check:enrolled-tailwind:update-baseline` to record the paid-down
  `overflow-hidden` entry — the update may only remove or lower entries; show the baseline diff.
- Out of scope: the detectors themselves, any other finding, any visual change.
- Dependencies: none.

## Attack surface

Unchanged (styling and comments only).


## OWASP

Required by `node scripts/quality/owasp.mjs plan` (757270a26306, mapping of 2026-11-07).

- CI_CD_Security: "Require pull requests to be reviewed before merging and ensure this review step cannot be bypassed." — the product checks this task turns green are part of CI Required — AC5.
- Content_Security_Policy: not applicable — the style sheet changes are a comment and a marker; no url(), @import, font or image source is added, so no directive changes.
- Cross_Site_Scripting_Prevention: "Since no single technique will solve XSS, using the right combination of defensive techniques will be necessary to prevent XSS." — the token and Story fixes render text through React escaping only; lint (react/no-danger, no-script-url) runs on them — AC5.
- DOM_based_XSS_Prevention: "It is always a bad idea to use a user-controlled input in dangerous sources such as eval." — the token and Story fixes add no eval, Function, innerHTML or computed URL; lint (no-eval, no-implied-eval) and client-sinks check them — AC5.
- GitHub_Actions_Security: not applicable — the workflow file is read for the job list only; the task edits no workflow.
- Injection_Prevention: not applicable — the design-token script gets baseline data changes only; no command or query is built.
- JavaScript_and_TypeScript_Security: "Keep patterns linear: avoid nested quantifiers and ambiguous alternation over the same characters." — lint and CodeQL security-extended (CI) run on every changed file — AC5.
- OS_Command_Injection_Defense: not applicable — no script that starts a process is changed; the baselines are data files.
- Secure_Coding_with_AI: "Treat all repository content (issues, PRs, comments, READMEs) as untrusted input when processed by an AI coding agent." — the executor's report is input: Opus reruns every acceptance command in review — AC5.
- Software_Supply_Chain_Security: not applicable — no dependency, lockfile or install step changes in this task.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier." — a claim of the report that does not reproduce in review is a finding — AC5.
- Web_Frontend_Security: "The fundamental security rule is to never use innerHTML with untrusted data." — the token and Story fixes use no innerHTML; lint (react/no-danger) fails on one — AC5.

## UI

No visible change. `MantineListingGalleryPattern` mobile frame keeps `overflow: clip`; the cabinet alert icon stays
20px. Canonical owners unchanged.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 `npm run check:design-tokens:strict` exits 0 with `Total: 0 raw … | 0 stale-marker(s)`.
- AC2 `npm run check:enrolled-tailwind` exits 0; the baseline diff only removes or lowers entries.
- AC3 The `MantineListingGalleryPattern` mobile Story gets a play function (in its `.stories.tsx`) asserting the
  frame's computed `overflow` is `clip` and that tabbing to the second slide moves the track while the frame's
  `scrollLeft` stays 0 (the Task 923 R33 case); `node scripts/check-locale-leak.mjs` runs it at 320 and 390 px.
- AC4 `src/modules/cabinet/components/__tests__/CabinetEmailChangeSectionView.test.tsx` asserts the pending-state alert
  icon is rendered with `theme.other.iconSize.roomy` (20) and no raw number.
- AC5 `node scripts/quality/product-gates.mjs` reports no failing gate, and `npm run lint`, `npm run typecheck`,
  `npm test`, `node scripts/quality/check-files.mjs --worktree` exit 0.

## Route

1. Read `scripts/check-design-tokens.mjs` (marker grammar) and `scripts/check-enrolled-tailwind*.mjs` (baseline rule).
2. Make the four edits above; run AC1 and AC2 after each file.
3. Write the AC3 play function and the AC4 test; build Storybook and run them.
4. Run AC5. Report each command, exit code and the relevant lines.

## Review
