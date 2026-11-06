# Sprint 34 — Task 399 — Harden the i18n-hardcode scanner against `{'...'}` / `{"..."}` string-literal evasion

> **Origin:** the Task 397 review found that hardcoded user-facing strings can be hidden from `check-hardcoded-i18n.mjs`
> (Task 396) simply by wrapping a JSX text child in an expression container — `<Text>Hello</Text>` becomes
> `<Text>{'Hello'}</Text>` and the text-child detector no longer sees it. This is a trivial, copy-pasteable evasion of
> the gate. This task closes that hole. **Read `docs/agent-contract.md` (1–13) FIRST.** STOP & ASK if ambiguous.
>
> **Priority:** MEDIUM (hardening; not a blocker for 397 — 397 fixes its own instances by reverting the wraps). Best
> done AFTER 397 so the scanner change is validated against a clean tree.

```
Type:        tooling (scanner hardening) + governance
Area:        scripts/check-hardcoded-i18n.mjs, scripts/i18n-hardcode-baseline.json (re-baseline if new true-positives
             surface), docs/i18n-governance.md (document the new detection), package.json (no new script expected)
NON-area:    No product-code edits beyond what a re-baseline of genuine new findings requires (route real fixes to a
             remediation task, do not silently fix in this tooling task).
```

## What to detect (the gap)
Today the scanner flags raw JSX **text children** (`>Hello<`) and string-valued **attributes** (`aria-label="…"`, etc.),
using `isEnglishish` + the language-neutral `STATIC_ALLOWLIST`. It does NOT flag a user-facing English string when it is
written as a **JSX expression container holding a string literal**:
- `{'Hello'}` / `{"Hello"}` as a JSX child.
- Template literals with no interpolation: `` {`Hello`} ``.
- (Consider) the same inside attribute expressions: `aria-label={'Hello'}` vs `aria-label="Hello"`.

The hardening must treat a **string-literal (or no-substitution template-literal) inside a JSX expression child/attribute**
the same as a raw literal — run it through `isEnglishish` + `STATIC_ALLOWLIST` exactly like a text child. Interpolated
expressions (`{t('x')}`, `{name}`, `` {`Hi ${x}`} ``) must NOT be flagged (those are dynamic / already-translated).

## Pre-read (mandatory)
- `docs/agent-contract.md` (1–13) · `docs/backlog.md`
- `scripts/check-hardcoded-i18n.mjs` (the existing walker, `isEnglishish`, `STATIC_ALLOWLIST`, baseline diff, SKIP_DIRS/
  SKIP_SUFFIXES) — extend it, do not rewrite.
- `docs/i18n-governance.md` (document the new rule) · the Task 397 redo result (so the email accepted-entries are in the
  baseline before this runs).

## Positive flow
- Extend the detector so JSX expression children/attributes whose expression is a bare string literal or a
  no-substitution template literal are evaluated as hardcoded-string candidates (same `isEnglishish`/allowlist path).
- Re-run the scanner over the (post-397) clean tree. If genuine NEW true-positives surface (real English now caught that
  the old scanner missed), **list them** and re-generate the baseline as documented debt — do NOT fix product code here
  (route to a remediation task). The accepted sq-only email entries from 397 stay accepted.
- Document the new detection rule in `docs/i18n-governance.md`.

## Negative flow (must be proven)
- **Evasion now caught:** in a probe component, `<button aria-label={'Evasion Probe'}>` and `<span>{'Evasion Probe'}</span>`
  → scanner FLAGS both (exit 1, not in baseline). Revert. (Use a temp file you can delete — note the sandbox EPERM-unlink
  caveat; if you cannot delete it, leave it inert and flag it to the orchestrator for owner deletion.)
- **No false positives on dynamic/translated:** `{t('x')}`, `{count}`, `` {`Page ${n}`} ``, `{cond ? a : b}` are NOT
  flagged. Show a sample.
- **Non-substitution template literal:** `` {`Static`} `` IS flagged; `` {`Hi ${x}`} `` is NOT.
- **Baseline integrity:** existing accepted entries (incl. the 397 sq-only email strings) remain accepted; the gate is
  green after re-baseline; an English plant in an email file still FAILS (no blind spot).

## Acceptance criteria (machine-proven)
- `node --check scripts/check-hardcoded-i18n.mjs` passes; file complete (Task 395 lesson — verify the end of file).
- The brace-literal evasion is detected (negative-flow transcript proves a planted `{'...'}` now fails the gate).
- No false positives on interpolated/translated expressions (sample transcript).
- `check:i18n-hardcode` green on the clean tree; any newly-surfaced true-positives captured in the baseline as
  documented debt (with a one-line note each); accepted email entries preserved.
- `docs/i18n-governance.md` documents the expression-literal rule; `tsc=0`, `lint=0`; Files Changed table matches diff.
- **No `git add`/`commit` from the executor** — orchestrator emits commits on review.

## Out of scope
- Fixing product-code hardcodes the hardened scanner newly surfaces (→ a remediation batch task, like 397 was for 396).
- The story-coverage gate (Task 398, parked). The render-based locale-leak gate (395, done).
