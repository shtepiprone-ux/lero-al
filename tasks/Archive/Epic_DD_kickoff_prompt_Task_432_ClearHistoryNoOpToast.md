# Task 432 — Distinct "nothing to clear" feedback for the no-op clear-history race (Epic DD follow-up)

> **Executor:** Sonnet 4.6. **Orchestrator:** Opus 4.8.
> **Origin:** Task 246 (Epic DD.1 — admin clear user-profile change history). The `clear_user_history()`
> RPC and the `clearHistory` server action handle a **no-op** correctly at the data layer (nothing to
> clear → no audit row, no delete), but the UI shows the **same green "History cleared." success toast**
> as a real clear. In the race / double-submit case (another admin or another tab already cleared the
> rows, or a double-click), the admin sees "History cleared." even though **nothing was cleared this
> time** — a misleading success signal. Task 246's session log flagged this as a non-blocking follow-up;
> this task closes it.
> **Type:** server-action return-shape + client toast branch + i18n (4 locales). **No new UI control, no
> new dialog, no layout/responsive change.**

---

## Pre-read (rule-index → UI + server-action task — load ONLY these)

**Always required:**
- `docs/agent-contract.md` (P0 clauses 1–14)
- `docs/backlog.md`

**Required for this task:**
- `docs/ui-rules.md` (toast / feedback conventions, control-height rules — only the feedback parts apply)
- `docs/component-rules.md` (no-hardcode: every visible string via `t()`)
- `docs/qa-rules.md` (pre-commit checks, manual testing checklist)
- `docs/ai-behavior.md` → Note 19 "UX Flow Preservation" + Note 20 "Existing-Control Preservation" + "Localization (i18n) Rules"
- `src/modules/admin/actions/clearHistory.ts` (the action you edit — read in full first)
- `src/components/admin/AdminUserProfile.tsx` (the two clear handlers @ lines 633–659 + the `ClearHistoryDialog` @ 334–390 — read these regions)
- `docs/sessions/2026-06-15-task246-admin-clear-history.md` (the no-op contract: RPC returns `cleared_row_count: 0` with no audit row / no delete)

Do NOT load Storybook / design-system / responsive-matrix docs — this task adds no layout/container/control and no story.

---

## Context — what the no-op is, and why it must read differently

`clear_user_history()` (Task 246, SECURITY DEFINER) returns `jsonb_build_object('cleared_row_count', 0, …)`
and writes **no** audit row / performs **no** delete when there is nothing to clear. The action surfaces
this at `src/modules/admin/actions/clearHistory.ts:40–44`:

```ts
const result = data as { cleared_row_count: number } | null
if (!result || result.cleared_row_count === 0) return {}   // ← no-op returns {} …

revalidatePath(`/admin/users/${entityId}`)
return {}                                                   // … and a real clear ALSO returns {}
```

Because both paths return `{}` (no error), the two client handlers
(`handleClearHistoryRow` 633–645, `handleClearHistoryForEntity` 647–659) cannot tell them apart and both
call `toast.success(t('feedback.clear_history_success'))`. The fix surfaces the cleared count so the UI
shows a **neutral info toast** ("nothing to clear") for the no-op and keeps the green success toast only
for a real clear (`cleared_row_count > 0`).

**This is a real concurrency/double-submit case, not a hypothetical:** the per-entity "Clear history"
button and per-row trash buttons render against the list state at page render; if the rows are gone by the
time the confirm fires (another tab/admin cleared them, or a fast double-confirm), the second call is a
no-op and must say so.

---

## Scope — EXACTLY 2 code files + 4 locale files + 2 docs

**Implementation files:**
1. **`src/modules/admin/actions/clearHistory.ts`** — widen the return type to surface the cleared count and
   return it (no-op = `{ cleared: 0 }`, real clear = `{ cleared: <n> }`); error path unchanged.
2. **`src/components/admin/AdminUserProfile.tsx`** — in BOTH clear handlers, add a no-op branch BEFORE the
   success toast: `result.cleared === 0` → neutral info toast + close dialog + `router.refresh()`.

**Locale files (all four — clause 7 parity):**
3. **`messages/en.json`**, 4. **`messages/sq.json`**, 5. **`messages/uk.json`**, 6. **`messages/it.json`** —
   add ONE new key `feedback.clear_history_noop`, immediately after `feedback.clear_history_forbidden`
   (currently the last key in the `feedback` object @ line 1257 — you MUST add a trailing comma to that
   line to keep the JSON valid).

**Required documentation files (clause 10):**
7. **`docs/sessions/2026-06-15-task432-clear-history-noop-toast.md`** — new session log (summary, Files
   Changed table = **8 rows**, gate transcript, AC-by-AC self-audit, N/A justifications).
8. **`docs/backlog.md`** — Task 432 row (Epic DD follow-up) under the Epic DD area + Last Session entry.

**No other files may be touched.**

**Out of scope — do NOT touch:**
- `docs/backlog-archive.md` — the backlog-tidy move of the prior (Task 431) Last-Session entry to the
  archive top is the **ORCHESTRATOR's** job at review (owner-P0 backlog-tidy rule). Do NOT edit the archive
  yourself — just write the Task 432 row + Last Session into `docs/backlog.md`. (This is the lesson from the
  Task 431 review: the archive edit is mandated but is the orchestrator's, not the executor's.)
- The `clear_user_history()` RPC / any SQL / the Supabase DB — single-writer; the data-layer no-op contract
  is already correct and stays unchanged.
- `src/types/database.ts`, `ClearHistoryDialog` markup, the clear buttons, any other `src/`/`app/` file.
- The success / error / forbidden toasts and their keys — they keep their exact current wording.

---

## Required changes (literal)

### 0. Pre-edit investigation — `toast.info` availability (MANDATORY, before touching `AdminUserProfile.tsx`)

Before editing the handlers, resolve the toast variant deterministically — do NOT just assume `toast.info` exists:

```
grep -rn "toast.info(" src/
```

- **If found** → use the existing `toast.info(` pattern (matches project convention).
- **If NOT found** → verify from the installed `sonner` type/API that `toast.info` exists AND that
  `npm run lint` accepts the call (no `no-restricted-syntax` / custom rule against it).
- **If `toast.info` is unavailable OR a lint rule / clear project convention forbids it → STOP and ASK.**
  Do NOT silently substitute `toast()` / `toast.message` / `toast.warning`.

Record the grep result + the type/lint verification in the session log (this is what makes AC5's STOP
condition auditable).

### 1. `src/modules/admin/actions/clearHistory.ts` — surface the cleared count

Change the return type of all three functions from `Promise<{ error?: string }>` to
`Promise<{ error?: string; cleared?: number }>` (inner `clearHistory` + both exported wrappers
`clearHistoryRow`, `clearHistoryForEntity`).

Replace lines 40–44:

```ts
  const result = data as { cleared_row_count: number } | null
  if (!result || result.cleared_row_count === 0) return {}

  revalidatePath(`/admin/users/${entityId}`)
  return {}
```

with:

```ts
  const result = data as { cleared_row_count: number } | null
  const cleared = result?.cleared_row_count ?? 0
  if (cleared === 0) return { cleared: 0 }   // no-op: no audit row, no delete, no revalidate

  revalidatePath(`/admin/users/${entityId}`)
  return { cleared }
```

The error path (lines 35–38) is unchanged. Wrappers just `return clearHistory(...)` as today — the wider
type flows through automatically.

### 2. `src/components/admin/AdminUserProfile.tsx` — no-op branch in BOTH handlers

In `handleClearHistoryRow` (633–645), between the `if (result.error) { … }` block and the
`toast.success(...)` line, insert:

```ts
    if (result.cleared === 0) {
      toast.info(t('feedback.clear_history_noop'))
      setClearRowTarget(null)
      router.refresh()
      return
    }
```

In `handleClearHistoryForEntity` (647–659), insert the same, but closing the entity dialog:

```ts
    if (result.cleared === 0) {
      toast.info(t('feedback.clear_history_noop'))
      setClearEntitySource(null)
      router.refresh()
      return
    }
```

Use `toast.info` (sonner's neutral variant). If `toast.info` is not already used in the codebase AND a lint
rule or project convention forbids it, **STOP and ASK** rather than substituting a different pattern — do
not silently pick `toast()` vs `toast.message` vs `toast.warning` on your own. The success and error toasts
below/above keep their exact current calls.

### 3. Locale key — `feedback.clear_history_noop` in all four files

Add after `clear_history_forbidden` (add the trailing comma to that line). Suggested wording (tighten if
needed, but keep the "nothing to clear / already empty" meaning — neutral, not an error, not a success):

| Locale | Value |
|---|---|
| `en` | `Nothing to clear — the history was already empty.` |
| `uk` | `Немає чого очищати — історія вже порожня.` |
| `sq` | `Asgjë për të pastruar — historiku ishte tashmë bosh.` |
| `it` | `Niente da cancellare — la cronologia era già vuota.` |

All four must have the **same key path** (`feedback.clear_history_noop`) — `npm run check:i18n` parity must
stay green.

---

## Positive flow (happy path — a real clear still works exactly as before)

1. Admin opens `/admin/users/[id]`, a history list (Account-type or Status) has ≥1 row.
2. Admin clicks per-row trash (or top "Clear history"), confirms in `ClearHistoryDialog`.
3. Action runs the RPC → `cleared_row_count = N > 0` → `revalidatePath` → returns `{ cleared: N }`.
4. Handler: not error, `cleared !== 0` → **`toast.success(clear_history_success)`** ("History cleared."),
   dialog closes, `router.refresh()` re-renders the now-shorter / empty list.
5. Post-conditions: audit row written (Task 246), rows deleted, success toast shown — **unchanged from
   Task 246.**

## Negative flow (every off-happy-path branch)

| Branch | Trigger | Required handling | Toast / locale key | What is NOT done |
|---|---|---|---|---|
| **No-op race** | Rows already cleared (other tab/admin) or double-confirm → `cleared_row_count = 0` | Action returns `{ cleared: 0 }`; handler shows neutral info toast, closes dialog, `router.refresh()` (syncs the now-empty list) | `toast.info(feedback.clear_history_noop)` | No success toast; no error toast; no audit row (already none); no delete |
| **Permission denied** | `hasPermission('audit.clear_history')` false | Action returns `{ error: 'forbidden' }`; handler shows forbidden toast, dialog stays for user to dismiss | `toast.error(feedback.clear_history_forbidden)` | No clear, no refresh — **unchanged** |
| **Unauthorized** | no session | Action returns `{ error: 'Unauthorized' }` → handler error path → generic error toast | `toast.error(feedback.clear_history_error)` | unchanged |
| **RPC / server error** | DB raises | Action logs + returns `{ error: 'clear_failed' }` → error toast | `toast.error(feedback.clear_history_error)` | unchanged |
| **Cancel / dismiss** | Esc / backdrop / Return button on `ClearHistoryDialog` | Dialog closes via `onReturn`, no action call | none | no clear |
| **Double-submit** | second confirm while first in flight | `clearingHistory` guard already disables confirm during the call; if it still fires after completion it lands on the no-op branch | (no-op path) | no double delete |

The ONLY new branch is **No-op race**; every other branch must remain byte-for-byte the current behavior.
Confirm each still works (no regression).

---

## Acceptance criteria (each verifiable in the diff / runtime)

- **AC1** — `clearHistory.ts`: all three return types are `Promise<{ error?: string; cleared?: number }>`;
  no-op returns `{ cleared: 0 }` (no `revalidatePath`), real clear returns `{ cleared: <n> }` after
  `revalidatePath`. Error path unchanged. (diff)
- **AC2** — `AdminUserProfile.tsx`: BOTH handlers have a `result.cleared === 0` branch that fires
  `toast.info(t('feedback.clear_history_noop'))`, closes the correct dialog state
  (`setClearRowTarget(null)` / `setClearEntitySource(null)`), calls `router.refresh()`, and returns BEFORE
  `toast.success`. Success path unchanged for `cleared > 0`. (diff)
- **AC3** — `feedback.clear_history_noop` exists in **all four** locale files with the same key path and
  locale-appropriate text; `npm run check:i18n` parity green; the three existing `clear_history_*` keys are
  unchanged. (diff + gate)
- **AC4** — Existing controls preserved (Note 20): the per-row trash buttons, the per-entity "Clear history"
  buttons, and `ClearHistoryDialog` markup are byte-for-byte unchanged. Before/after control inventory in the
  session log. (diff)
- **AC5** — `npx tsc --noEmit` → 0 errors; `npm run lint` 0 new; the wider return type has no other consumers
  (grep confirms `clearHistory*` is imported only by `AdminUserProfile.tsx`). The §0 `toast.info(` pre-edit
  check is recorded in the session log (grep result + type/lint verification, or the STOP-and-ASK if it was
  unavailable/forbidden). Paste transcript. (gate)
- **AC6** — File-integrity (clause 14): every touched file — 0 NUL, no BOM, `.json` `JSON.parse` OK,
  `.ts/.tsx` compile, intact tail. Paste GREEN transcript.
- **AC7** — Runtime locale confirmation (clause 7) of the NEW toast. **Reproduce the no-op the real way —
  two tabs, no faked state:**
  1. Open the same user's history page in two tabs (A and B).
  2. In tab B, open the `ClearHistoryDialog` for the target list (do not confirm yet).
  3. In tab A, clear that same history.
  4. Back in tab B, confirm the already-open dialog → the call is now a genuine no-op → the
     `clear_history_noop` info toast fires.

  **Do NOT add temporary product code, SQL changes, test-only bypasses, debug UI, or hand-mutate the DB to
  force the no-op.** If no suitable test data exists to reproduce a real no-op, **document the blocker in the
  session log and STOP** — do not fake the runtime proof.

  Visually confirm `clear_history_noop` renders in **sq · en · uk · it** at the three mandatory mobile stress
  widths **320 / 375 / 390** — text wraps, no horizontal overflow, toast readable. A 4-locale × 3-width cell
  table (12 cells) with per-cell evidence in the session log. (This scoped toast matrix stands in for the full
  14-breakpoint matrix — justified under N/A below: no layout/container/control changed.)
- **AC8** — `docs/backlog.md` updated (Task 432 row + Last Session) + session log
  `docs/sessions/2026-06-15-task432-clear-history-noop-toast.md` with the 8-row "Files Changed" table and
  gate transcript. `docs/backlog-archive.md` NOT touched (orchestrator handles the tidy at review). Executor
  runs NO git.

**N/A for this task (state explicitly in the session log):** full 14-breakpoint × 4-locale rendered matrix
(no layout/container/control or responsive surface changed — only a toast string and a server-action return
shape; the scoped 12-cell toast matrix in AC7 covers the visible change); mobile <640 full-width gate (no
new/edited control or container — existing dialog + buttons unchanged, verified in AC4); Storybook /
`check:stories` (no story touched); RLS / SQL (data-layer no-op contract already correct, unchanged).

---

## Files Changed (expected — 8 rows: 2 code + 4 locale + 2 docs)

| File | Change |
|---|---|
| `src/modules/admin/actions/clearHistory.ts` | Return type widened to `{ error?; cleared? }`; no-op returns `{ cleared: 0 }`, real clear `{ cleared: n }`. |
| `src/components/admin/AdminUserProfile.tsx` | No-op `result.cleared === 0` branch in both clear handlers → `toast.info(clear_history_noop)` + close dialog + refresh. |
| `messages/en.json` | +`feedback.clear_history_noop`. |
| `messages/sq.json` | +`feedback.clear_history_noop`. |
| `messages/uk.json` | +`feedback.clear_history_noop`. |
| `messages/it.json` | +`feedback.clear_history_noop`. |
| `docs/sessions/2026-06-15-task432-clear-history-noop-toast.md` | New session log. |
| `docs/backlog.md` | Task 432 row + Last Session. |

---

## Hard contract (verified against the real diff on return)

- No scope change beyond the 8 files; `database.ts`, the RPC, the dialog, and the clear buttons untouched.
- No invented architecture; toast variant = `toast.info` (STOP and ASK if a convention forbids it).
- BOTH the positive flow (success toast for `cleared > 0`) AND the no-op negative branch implemented; every
  other negative branch unchanged and re-verified.
- 4-locale parity for the new key; runtime locale confirmation of the new toast (AC7) — `tsc=0` is NOT proof.
- Self-validate before "complete": tsc + lint + check:i18n + file-integrity transcript + AC-by-AC self-audit.
- "Files Changed" table (8 rows) present; executor runs NO git (single-writer). `docs/backlog-archive.md`
  NOT edited — orchestrator does the backlog-tidy at review.
