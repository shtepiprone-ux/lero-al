# Sprint 35 — Task 422 — Evidence Addendum (session-log only, NOT a new task)

> Read this file directly; do not work from chat paraphrase. This is a **documentation/evidence
> addendum** to the already-implemented Task 422 — **NOT a new task number** and **NOT a code rework**.
> Single-writer git: do **NOT** run `git add` / `git commit`. The orchestrator emits commit commands at review.

## Why this exists

Task 422's implementation is approved on engineering (v4 `!`-suffix fix in `mobile-bottom-sheet.ts`
+ scoped `max-sm:max-w-none!` in `navigation-menu.tsx`; full `screenshots:assert` 2912/2912 PASS).
Two **literal acceptance criteria** from the kickoff are present in substance but not in the exact
required form in the session log:

- **AC2** literally requires **uk@320 / uk@375 / uk@390 shown explicitly** for
  `NavigationMenu/MobileOpen` — the log currently generalizes "all 4 locales × all 5 <640".
- **AC5** literally requires pasting `grep -rn "MOBILE_POSITIONER\|MOBILE_POPUP" src/components/ui/`
  (both tokens) with a **per-consumer before → after** result — the log currently shows a summarized
  table grepping `MOBILE_POSITIONER` only, after-result only.

This addendum closes those two gaps so the evidence matches the literal AC text. The data already
exists in `scripts/task422-full-assert.txt`; this is transcription, not new work.

## Scope — STRICT

- **ONLY** edit `docs/sessions/2026-06-13-task422-mobile-positioner-v4-syntax-navmenu.md` — append a
  new section `## 9. Evidence addendum (AC2 explicit uk cells + AC5 literal grep)`.
- **NO** changes to `src/`, stories, harness, `package.json`, or any other file.
- **NO** new task number; this is part of Task 422.
- Do **NOT** loosen any assertion or `FULL_WIDTH_TOLERANCE`.
- Do **NOT** emit `git add` / `git commit`.

## Required addendum content

Append exactly this section (fill the grep block with the **raw** command output):

```
## 9. Evidence addendum (AC2 explicit uk cells + AC5 literal grep)

### AC2 — explicit uk stress cells (NavigationMenu/MobileOpen, post-fix `screenshots:assert`)
NavigationMenu/MobileOpen × uk × mobile-320 — popupBottomSheetAtMobile: true → PASS
NavigationMenu/MobileOpen × uk × mobile-375 — popupBottomSheetAtMobile: true → PASS
NavigationMenu/MobileOpen × uk × mobile-390 — popupBottomSheetAtMobile: true → PASS

### AC5 — literal consumer enumeration (both tokens)
$ grep -rn "MOBILE_POSITIONER\|MOBILE_POPUP" src/components/ui/
<paste the RAW grep output here, unedited>

Per-consumer assertion (e), before fix → after fix (ONLY the token-consumers the grep returns):
  select.tsx          PASS → PASS
  popover.tsx         PASS → PASS
  dropdown-menu.tsx   PASS → PASS
  navigation-menu.tsx FAIL (20 cells) → PASS

Not token-consumers (correctly absent from the grep — bottom-sheet via a different mechanism,
verified independently in the full 2912-cell matrix, NOT via the shared tokens):
  sheet.tsx / dialog  — own bottom-sheet classes (Task 373)
  command.tsx         — hosted inside Dialog (inherits the sheet behavior)
(`mobile-bottom-sheet.ts` appears in the grep only as the token DEFINITION site, not a consumer.)
```

> **Template note (orchestrator correction, 2026-06-13):** an earlier draft of this addendum listed
> `command.tsx`/`sheet.tsx` as `PASS → PASS` grep-consumer rows — that was wrong. The literal
> both-token grep returns only the 4 consumers above; Sheet/Dialog/Command do NOT import the shared
> tokens (consistent with §2 of the session log). Do not invent rows for files the grep does not return.

## Acceptance criteria

- **A1:** the section above is appended to the existing session log; the three uk cells are written
  out explicitly; the grep block contains the **raw** output of the literal both-token command.
- **A2:** per-consumer before → after table present for **every consumer the grep actually returns**
  (expected: the 4 listed above). Files absent from the grep get the short "not token-consumers" note,
  not fabricated PASS rows.
- **A3:** **if the raw grep reveals a consumer NOT in the 4-row list above, or any before/after that is
  NOT `PASS → PASS` / the documented `FAIL → PASS`** — i.e. a real mismatch with §2 of the log —
  **STOP and report it; do NOT silently fix code.** A real mismatch is a finding, not a doc edit.
  (The `command.tsx`/`sheet.tsx` absence is the EXPECTED, already-resolved case — not a mismatch.)
- **A4:** no file other than the session log is modified (`git status` shows only that one file vs.
  the already-modified Task 422 set). Add a one-row "Files Changed" note for the session log.
- Do NOT emit `git add` / `git commit`.

## After Sonnet returns

Orchestrator verifies the appended section against `scripts/task422-full-assert.txt`, then the owner
runs the **native** authoritative `npm run screenshots:assert`. If native = **2912/2912, 0 FAIL**,
the orchestrator emits the Task 422 commit (the two source files + session log + backlog) for the
owner to run in PowerShell.
