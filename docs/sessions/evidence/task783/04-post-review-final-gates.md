# Task 783 — final post-review gate batch (owner-native, Windows PowerShell)

Run by the owner on 2026-09-04 **after** the reviewer's corrections (T6 fix + kickoff/backlog/sprint
edits). These are the four gates the reviewer's own edits made stale; the rest (`check:stories`,
`check:story-coverage`, `build-storybook`, `listingsMigratedControls`) stayed current because no
story or story-adjacent file was touched after their run in `01-owner-native-gates.md`.

Why each was stale — measured, not assumed:

| Gate | Reason it needed re-running |
|---|---|
| `typecheck` | `tsconfig.json` sets `include: ["**/*.ts","**/*.tsx"]` and excludes only `node_modules` and `supabase/functions`, so `__tests__` **are** typechecked — and the reviewer edited the test file. |
| `build` | Next's "Checking validity of types" runs over that same tsconfig, so it is stale for the same reason. Its bundling stage never sees the test file, but the rule is that the build transcript is current for the reviewed diff. |
| `check:file-integrity` | Scans the git-changed + untracked set, which grew from 6 paths to 11 (kickoff, sprint plan, `docs/sessions/evidence/task783/`). |
| `check:mojibake` | Scans `docs/` and `tasks/`; the reviewer added evidence files containing box-drawing characters, `✓ ❯ × ⎯`, and emoji, and edited two task documents. |

```
PS C:\Claude_Code_Projects\lero-al> npm.cmd run typecheck
> lero-al@0.1.0 typecheck
> tsc --noEmit
PS C:\Claude_Code_Projects\lero-al> npm.cmd run check:file-integrity
> lero-al@0.1.0 check:file-integrity
> node scripts/check-file-integrity.mjs
🔍  check:file-integrity — git-changed + untracked (default)
    Checking 11 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation
✅  check:file-integrity PASSED — all 11 file(s) clean
PS C:\Claude_Code_Projects\lero-al> npm.cmd run check:mojibake
> lero-al@0.1.0 check:mojibake
> node scripts/check-mojibake.mjs
check:mojibake — scanning 3731 text file(s), tracked and untracked-not-ignored, under docs/ src/ app/ components/ modules/ messages/ tasks/ scripts/ + root *.md
check:mojibake: 0 artifacts in 3731 files
PS C:\Claude_Code_Projects\lero-al> npm.cmd run build
> lero-al@0.1.0 build
> next build
   ▲ Next.js 15.5.18
   - Environments: .env.local
   - Experiments (use with caution):
     · clientTraceMetadata
   Creating an optimized production build ...
 ✓ Compiled successfully in 43s
   Skipping linting
 ✓ Checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (40/40)
 ✓ Collecting build traces
 ✓ Finalizing page optimization
[... full route manifest emitted, identical shape to 01-owner-native-gates.md;
     /[locale]/listings 14.2 kB / 627 kB First Load JS, shared 184 kB, middleware 165 kB ...]
```

## Reviewer reading

- `typecheck` — no output, no error. The edited test file typechecks; `theme.breakpoints?.sm` is a
  real key on Mantine's breakpoints type.
- `check:file-integrity` — **11 files**, up from 6, all clean. The count rising by exactly the five
  paths the reviewer added or edited is itself the confirmation that the gate saw the new work.
- `check:mojibake` — **3731 files**, up from 3728 by the three new evidence files, **0 artifacts**.
  The heavy Unicode in the retained transcripts survived the round trip intact.
- `build` — `✓ Compiled successfully in 43s`, `✓ Checking validity of types`, 40/40 static pages.
  **The mandatory non-Q0 production build gate is current for the final reviewed diff.**

**AC8 is closed.** Every gate the task named exits 0 against the final tree, on `win32`.
