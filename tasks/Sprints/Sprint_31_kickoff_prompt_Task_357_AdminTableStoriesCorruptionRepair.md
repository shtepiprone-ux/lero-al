# Sprint 31 — Task 357 kickoff (Sonnet) — Repair corrupted AdminTable.stories.tsx (strip NUL-byte tail; NO logic change) — unblocks Task 354-Fix-2 commit

> **Status: READY. Owner priority #1 — BLOCKER.** Task 354-Fix-2 wrote correct code, but the on-disk
> file `src/components/admin/AdminTable.stories.tsx` is **corrupted**: valid TSX ends cleanly at byte
> 36630 (the `LoadingState` story closes with `}\n`), then **32,063 trailing NUL bytes (`\x00`)** run to
> EOF with zero real code after them. This is almost certainly a Cowork↔Windows shared-mount write race
> (see `docs/orchestrator-role.md` → "Environment & git safety"). In this state `tsc` / `build` /
> Storybook will fail and the file **cannot be committed**. The earlier "tsc=0 / build=✅" claim was
> against the pre-corruption buffer; the persisted artifact is broken.
>
> **You are Sonnet 4.6, the executor.** This is a **mechanical repair**, not a redesign. Re-save the file
> with the valid code ONLY and the NUL tail removed. Do **NOT** change any logic, exports, story content,
> imports, or formatting of the valid portion. If the valid portion itself appears damaged (not just the
> NUL tail), **STOP and ASK the orchestrator** — do not regenerate or guess story content.
>
> **Single-writer git:** you do NOT run `git add` / `git commit` / any mutating git. End with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) reviews the real diff and emits commit commands. (agent-contract clause 10.)

```
Type:     mechanical corruption repair (P0 blocker; NO logic change)
Priority: CRITICAL (owner #1; blocks Task 354-Fix-2 approval & commit)
Area:     src/components/admin/AdminTable.stories.tsx (ONLY)
```

## Confirmed root cause (orchestrator audit, 2026-06-02)

```
file size:            68,693 bytes
valid TSX ends at:    byte 36,630  (…visibility: 'sm', cell: r => r.role }, ] return <AdminTable … loading /> }, })
NUL bytes:            32,063  (from byte 36,630 to EOF)
real code after NULs: 0 bytes
expected exports:     Default, ColumnMenu, ManageColumns, CardMode, Interactive, InteractiveCardMode,
                      Responsive, LocaleStress, EmptyState, LoadingState  (10 — all present in the valid portion)
```
Only this one source file is affected (a repo-wide scan found NULs elsewhere only in `src/app/favicon.ico`,
which is a legitimate binary and MUST NOT be touched).

## Required scope (literal)

1. Open `src/components/admin/AdminTable.stories.tsx` and read the **valid** portion (bytes 0–36,630 — the
   10 scenario stories, ending at the `LoadingState` story's closing `}`).
2. Re-save the file containing **exactly that valid TSX and nothing after it** — i.e. remove every trailing
   NUL byte. The file must end with a normal final newline after the last story's closing brace.
3. Do **NOT** alter, add, remove, reorder, or reformat any of the valid code: same 10 exports, same imports,
   same fixtures, same comments, same whitespace within the valid portion. The ONLY change is the deletion
   of the NUL tail.
4. After writing, **verify there are zero NUL bytes** and the file is valid UTF-8 TSX.

## Out of scope (STOP & ASK if any seems required)

- Any change to story logic, exports, fixtures, the column-menu/sort/hide behavior, or `AdminTable.tsx`.
- Any other file (incl. `src/app/favicon.ico` — leave it; its NULs are legitimate).
- Storybook config, docs (beyond backlog + the session log), messages, package files, `src/app`, `src/modules`.
- Regenerating story content from scratch (if the valid portion is itself damaged → STOP & ASK).

## Current behavior to PRESERVE

The 10 canonical scenario stories produced by Task 354-Fix-2 and the entire `AdminTable.tsx` column-menu /
sort / hide / global-search behavior — unchanged. This task only removes appended NUL garbage.

## Positive flow (happy path)

**Actor:** executor repairing a corrupted source file. **Precondition:** file has valid TSX then a NUL tail.
1. Read the valid TSX (10 scenario stories).
2. Re-save the file with the valid TSX only, no NUL bytes, normal trailing newline.
3. `tsc` / `build` / `build-storybook` succeed; the 10 exports are intact; Storybook renders AdminTable.
**Post-condition:** file is clean UTF-8, 0 NUL bytes, identical logic; 354-Fix-2 becomes committable.

## Negative flow (off-happy-path branches)

- **Valid portion is also damaged** (truncated mid-statement, missing braces, garbled chars within bytes
  0–36,630) → STOP & ASK; do not invent or regenerate content.
- **NUL bytes are interleaved with code** (not a clean trailing run) → STOP & ASK; report the byte offsets.
- **Another tracked source file is found with a NUL tail** (besides favicon.ico) → report it in the session
  log; do NOT fix outside this file without orchestrator authorisation.
- **Re-save reintroduces NULs** (mount race recurs) → re-write and re-verify; if it persists after a retry,
  STOP & report the environment issue (do not commit a still-corrupted file).

## Acceptance criteria (literal)

1. `src/components/admin/AdminTable.stories.tsx` contains **0 NUL bytes** and is valid UTF-8.
2. The 10 scenario exports are unchanged and present: `Default`, `ColumnMenu`, `ManageColumns`, `CardMode`,
   `Interactive`, `InteractiveCardMode`, `Responsive`, `LocaleStress`, `EmptyState`, `LoadingState`.
3. No logic / fixture / import / formatting change to the valid portion (diff = NUL-tail removal only).
4. `npx tsc --noEmit` → 0 errors; `npm run build` passes; `npm run lint` → 0 new; `npm run check:i18n` →
   PASS; `npm run build-storybook` exits 0.
5. No change to any other file (favicon.ico untouched; no `src/app`/`src/modules`/docs-beyond-backlog/
   messages/package/Storybook-config diff).
6. Session log records the before/after byte size, NUL count (before: 32,063 → after: 0), and the
   "Files Changed" table.

## Required validation (run & report exact command + output)

- NUL check (MUST print `0`):
  `python3 -c "print(open('src/components/admin/AdminTable.stories.tsx','rb').read().count(b'\x00'))"`
- exports intact (MUST list the 10):
  `grep -a "^export const " src/components/admin/AdminTable.stories.tsx`
- `git diff --stat -- src/components/admin/AdminTable.stories.tsx` (expect only this file)
- `npx tsc --noEmit` · `npm run build` · `npm run lint` · `npm run check:i18n` · `npm run build-storybook`
- `git diff -- src/app src/modules package.json package-lock.json .storybook` → MUST be empty

## Final report required (no git commands from you)

- **Files Changed** table (one row: the repaired file + rationale "removed 32,063-byte NUL tail; no logic change").
- Before/after NUL count + byte size.
- Confirmation the 10 exports and all valid code are unchanged (diff is NUL-removal only).
- Validation command outputs.
- **No `git add` / `git commit` / `git push`.** End with the Files Changed table; Opus emits the commit
  (this repair commits together with the rest of Task 354-Fix-2 under one `fix(Task354-Fix-2): …`).
