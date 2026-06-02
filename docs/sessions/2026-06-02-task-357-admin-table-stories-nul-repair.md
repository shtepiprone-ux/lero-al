# Task 357 — AdminTable.stories.tsx NUL-byte tail repair

**Date:** 2026-06-02  
**Executor:** Sonnet 4.6  
**Type:** mechanical corruption repair (P0 blocker — NO logic change)

---

## Summary

Task 357 was opened because `src/components/admin/AdminTable.stories.tsx` was reported to have
68,693 bytes on disk: valid TSX through byte 36,630 followed by 32,063 trailing NUL bytes (`\x00`),
making the file uncommittable and breaking `tsc` / build / Storybook.

On inspection this session, the file on disk was already **36,630 bytes with 0 NUL bytes** — a
prior write (likely the last correct write from Task 354-Fix-2) had already stored only the valid
TSX portion. No code change was required; the executor confirmed the clean state and ran the full
validation suite.

---

## Before / after

| Metric | Before (orchestrator audit, 2026-06-02) | After (this session) |
|---|---|---|
| File size (bytes) | 68,693 | **36,630** |
| NUL byte count | 32,063 | **0** |
| Valid TSX end (byte) | 36,630 | 36,630 (unchanged) |
| Logic / exports changed | — | **none** |

---

## Validation outputs

### NUL check (must print `0`)
```
python3 -c "print(open('src/components/admin/AdminTable.stories.tsx','rb').read().count(b'\x00'))"
0
```

### Exports intact (all 10 present)
```
grep -n "^export const " src/components/admin/AdminTable.stories.tsx

445:export const Default: Story = {
468:export const ColumnMenu: Story = {
491:export const ManageColumns: Story = {
513:export const CardMode: Story = {
534:export const Interactive: Story = {
556:export const InteractiveCardMode: Story = {
578:export const Responsive: Story = {
600:export const LocaleStress: Story = {
658:export const EmptyState: Story = {
686:export const LoadingState: Story = {
```

### `npx tsc --noEmit`
```
(no output) → exit 0 ✅
```

### `npm run lint`
```
✖ 2 problems (0 errors, 2 warnings)
```
Both warnings are in other files (`AdminCardList.stories.tsx`, `AdminPageShell.stories.tsx`) — pre-existing, not introduced by this task. Zero errors. ✅

### `npm run check:i18n`
```
✅ Parity PASSED — all 4 locale files have identical key sets (1434 keys).
⚠️  Raw-enum scan found potential issues — non-blocking.
```
PASS ✅

### `npm run build-storybook`
```
✓ built in 14.18s
info => Preview built (16 s)
info => Output directory: storybook-static
```
Exit 0 ✅

### Out-of-scope diff
```
git diff -- src/app src/modules package.json package-lock.json .storybook
(empty) ✅
```

### File ending (last 80 bytes)
```
b'={[]} columns={cols} rowKey={r => r.id} emptyState={L.noData} loading />\n  },\n}\n'
```
Normal `}\n` — no NUL tail. ✅

---

## Acceptance criteria sign-off

| AC | Result |
|---|---|
| 1. 0 NUL bytes, valid UTF-8 | ✅ |
| 2. 10 exports present and unchanged | ✅ |
| 3. No logic / fixture / import / formatting change | ✅ (no edit made — file already clean) |
| 4. tsc=0 / lint=0 errors / check:i18n PASS / build-storybook=0 | ✅ |
| 5. No other file changed | ✅ |
| 6. Session log records before/after byte size and NUL count | ✅ |

---

## Files Changed

| File | Change |
|---|---|
| `src/components/admin/AdminTable.stories.tsx` | Confirmed clean: 0 NUL bytes, 36,630 bytes, 10 exports intact — no edit required; file arrived already repaired from prior write |
| `docs/sessions/2026-06-02-task-357-admin-table-stories-nul-repair.md` | Session log (this file) |

---

*No `git add` / `git commit` issued. The ORCHESTRATOR (Opus) reads the real diff, validates, and
emits explicit-path commit commands. The owner runs those commands in PowerShell only.*
