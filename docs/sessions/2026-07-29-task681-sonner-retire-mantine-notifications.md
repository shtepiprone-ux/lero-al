# Task 681 — Sonner retirement onto Mantine notifications — session log

**Task path:** `tasks/kickoff_prompt_Task_681_SonnerToaster_Mantine_Notifications.md`
**Status:** `BLOCKED` — census divergence found at I0, per A1's stop condition. **No code was changed.**

## 1. Worktree snapshot (A5)

- `git status --porcelain` → empty (clean start). Confirmed before any write.
- `git rev-parse HEAD` → `00fb744dff6142d5bdf3fe1682704e21d292c45f`, branch `task/q0-ci-rendered-locale-split`.
  (The kickoff's cited commit is `9601d6908`; HEAD is 2 commits ahead — `82735a3b7`, `00fb744df`, neither of which
  touches any sonner/toast file per `git log 9601d6908..HEAD -- src/app/admin/layout.tsx` returning no output, so
  the divergence below is not new drift — it existed at the cited commit too and was missed by the kickoff's
  research.)

## 2. I0 census — re-run vs §3.2's expected numbers

| Measure | Expected (§3.2) | Actual (this session) | Match? |
|---|---:|---:|---|
| Files importing `from 'sonner'` | 34 | **33** | ❌ |
| Total `toast.*` call sites | 169 | 169 | ✅ |
| `toast.error` | 101 | 101 | ✅ |
| `toast.success` | 57 | 57 | ✅ |
| `toast.info` | 7 | 7 | ✅ |
| `toast.warning` | 4 | 4 | ✅ |
| Bare `toast(...)` | 0 | 0 | ✅ |
| `.promise`/`.loading`/`.custom`/`.dismiss` | 0 | 0 (the `uniq -c` breakdown returns only the four variants above) | ✅ |
| `next-themes` consumers in `src/` | 1 (`sonner.tsx`) | 1 (`sonner.tsx`) | ✅ |

Commands run (identical to §3.2's table):

```
grep -rln "from 'sonner'" src/ | wc -l          → 33
grep -rn "toast\.[a-z]" src/ --include=*.tsx --include=*.ts | wc -l   → 169
grep -rhoE "toast\.[a-zA-Z]+" src/ | sort | uniq -c
    101 toast.error
      7 toast.info
     57 toast.success
      4 toast.warning
grep -rhoE "(^|[^.a-zA-Z])toast\(" src/ | wc -l  → 0
grep -rln "next-themes" src/                     → src/components/ui/sonner.tsx
```

**Every message/variant number matches exactly** (169/101/57/7/4/0) — the four-method adapter shape itself is not
in question. **Only the file-count census diverges (33 vs 34), and the reason it diverges is the actual defect: a
second, undocumented Sonner mount site.**

## 3. Root cause of the divergence

`diff` of "all files referencing `sonner`" (40 hits) against "files matching the exact `from 'sonner'` import"
(33 hits) surfaces 7 files outside the import census, as expected for the wrapper itself, the 3 test mocks, and the
`[locale]/layout.tsx` `Toaster` mount — **except one**:

```
src/app/admin/layout.tsx:9:  import { Toaster } from '@/components/ui/sonner'
src/app/admin/layout.tsx:62:   <Toaster />
```

This is a **second, independent mount point** for the same Sonner `Toaster`, rendered (with no props, so default
bottom-right) inside `AdminLayout`, wrapping every `/admin/*` route. `git log --follow` on this file shows the
`Toaster` line traces back to `3e30eae9b` ("fix: avatar upload silent failures + admin nav guard back-button +
Toaster"), long before the cited `9601d6908` commit — **it is not new drift, it is a pre-existing fact the kickoff's
§3.2 research missed.**

Confirmed `MantineRootProvider` (with `<Notifications position="top-right" />`) is mounted once, in the true root
`src/app/layout.tsx:50`, which wraps **every** route including `src/app/admin/`. So §3.3's claim ("already live in
production on every route, public and admin") is correct. But §3.2's claim ("Mounted in exactly one place… with no
props") is **false**: admin routes currently render Mantine `Notifications` (top-right) **and** a second Sonner
`Toaster` instance (bottom-right, default), the same dual-mount problem the task describes for the public layout,
just also present under `/admin` and omitted from the verified-context section.

## 4. Why this is a stop condition, not a note

- **A1** is explicit: "If any number differs… stop and report — the four-method adapter is no longer a lossless
  replacement and the task needs re-scoping. Do not extend the adapter on your own initiative." The file-count
  census differs (33 actual vs 34 expected).
- **§7 Scope** authorizes exactly one layout file for the unmount step: `src/app/[locale]/layout.tsx`. It does not
  list `src/app/admin/layout.tsx`. I6's implementation-discipline rule ("change only the task's owned scope") forbids
  me from silently adding an unlisted file to scope on my own initiative.
- **Consequence if ignored:** completing I7 exactly as scoped (delete `src/components/ui/sonner.tsx`, edit only
  `src/app/[locale]/layout.tsx`) would leave `src/app/admin/layout.tsx:9` importing a deleted module — a hard
  TypeScript/build failure (violates R10/AC10), and `grep -rn "sonner" src/` would still return a hit in that file
  (violates R5/AC5). The defect is not cosmetic; it blocks the hard build gate.
- This is exactly the class of finding the kickoff itself warns about (§18 "Failure path": "Census divergence… →
  stop (A1)") and the workflow's `TASK SPECIFICATION CONTRADICTION` pattern for a verified-context claim the
  repository contradicts.

## 5. What I did **not** do

- No file was created, edited, or deleted in `src/`.
- No test was run against product code (only read-only `grep`/`git log`/`Read`).
- No mutating git command was run or suggested.

## 6. Open question for the orchestrator

Two live options, both requiring an owner/orchestrator ruling before Sonnet resumes:

1. **Expand §7 Scope** to add `src/app/admin/layout.tsx` (import line + `<Toaster />` removal, mechanically
   identical to I7's treatment of `[locale]/layout.tsx`), making the file-count census 34→35 files touched overall
   (33 call-site imports + 2 layout unmounts), and updating AC5's grep expectation accordingly. This looks like the
   correct fix — the admin route needs the exact same dual-mount cleanup as the public route — but it is a scope
   change the kickoff didn't authorize and I have no approval authority to make unilaterally.
2. Alternatively, if there is a reason the admin `Toaster` mount was intentionally left out of scope (none is stated
   in the kickoff), the task needs an explicit note carving it out and R5/AC5's "0 hits" wording needs relaxing to
   name the exception.

Recommend (1). No other census divergence was found; re-scoping only needs to add one file to §7/I7/AC5's grep
scope — the adapter (R1–R3), the 33-file import migration (R4), the test mocks (R6), and everything else in the
kickoff is unaffected by this finding.

## 7. Files changed this session

| Path | Action | Reason |
|---|---|---|
| `docs/backlog.md` | modified (2 in-place edits, net 0 line-count change, still 78 lines) | Recorded 681 as BLOCKED with the census-divergence reason, per Sonnet's backlog-update duty. |
| `docs/sessions/2026-07-29-task681-sonner-retire-mantine-notifications.md` | created | This session log. |

No `src/` file was touched.
