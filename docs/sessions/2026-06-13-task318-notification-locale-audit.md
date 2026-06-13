# Session Log — 2026-06-13 — Task 318

**Task:** `tasks/Epics/Epic_II_kickoff_prompt_Task_318.md`
**Scope:** Notification locale-binding audit (audit/spec only — NO code). Diagnoses the live
"Скарга на ваш акаунт…" wrong-locale notification bug; the fix is Task 319.

**STATUS: DONE.** New report
`docs/governance-reports/2026-06-13-notification-locale-audit.md` (§1–§9 + self-validation),
plus a one-line cross-reference update in `docs/i18n-rules.md` §8. `git diff --stat src` empty.

---

## 1. Pre-read performed

- `docs/agent-contract.md` clauses 1–14.
- `docs/backlog.md` (current state, Task 423 approved, Task 318 kickoff READY).
- `tasks/Epics/Epic_II_Global_i18n_Hardening.md` (Phase 1 Task 318 / Phase 2 Task 319 scope).
- `docs/i18n-rules.md` (canonical i18n doc — where the pointer lands).
- `docs/integrations.md` → "Outbound email language policy" (Albanian-only, Epic GG —
  confirmed this is a SEPARATE concern from in-app notification locale, per kickoff §pre-read 4).
- `docs/rls-rules.md` / `docs/data-access-rules.md` / `docs/domain-rules.md` — notification-relevant
  sections (light; `notifications` table is service-role write / RLS-owner-scoped read, per
  `docs/rls-rules.md:307`).
- Source, read in full: `src/modules/notifications/lib/mutations.ts`,
  `src/modules/notifications/components/NotificationItem.tsx`,
  `src/modules/notifications/lib/emails/resolveUserLocale.ts`, `src/types/database.ts`
  (`NotificationType` + `notifications` row + no `locale` column), and every
  `createNotification(...)` call site (6, see below) + each producer's `s`-strings source.

## 2. Audit method

```
$ grep -rn "createNotification(" src
src\modules\notifications\lib\mutations.ts:9        (definition)
src\modules\admin\actions\index.ts:835
src\modules\admin\actions\index.ts:898
src\app\api\cron\saved-searches\route.ts:135
src\app\api\cron\price-alerts\route.ts:156
src\modules\listings\actions\applyListingTransition.ts:114
src\modules\listings\actions\reportListing.ts:160
```

**6 producers** (the orchestrator's pre-analysis expected 7, including `cron/inactivity`).
`src/app/api/cron/inactivity/route.ts` was read in full — it sends `InactivityWarningEmail` /
`InactivityFinalEmail` via `sendEmail()` only (hardcoded `locale='sq'`, Epic GG); it has **no**
`createNotification` call. Producer count corrected to 6 — documented in report §2/§9.

Each of the 6 producers was traced to its `s`-strings source (`SUPPORT_NOTIFY_STRINGS`,
`NOTIF` objects in both cron routes, `getReporterNotificationEmailStrings`, or the
`listing_status_change` JSON-codes pattern) and given a verdict per the report §2 table.

Additionally traced `users.preferred_locale`'s write paths
(`AuthSheet.tsx:611` at signup; `Header.tsx:110-116` → `admin/actions/locale.ts:24` on **every**
locale-switcher click, public AND admin) — this is the new finding that explains the drift
mechanism behind the live bug (report §1, §4).

## 3. Root cause (summary — full evidence in report §4)

The string "Скарга на ваш акаунт" exists in exactly one place:
`SUPPORT_NOTIFY_STRINGS.uk.created_title` (`src/modules/admin/actions/index.ts:728`), reachable
only from producer #1 (`createSupportTicket`, line 835). `resolveUserLocale(reportedUserId)`
(line 833) snapshots the recipient's `preferred_locale` **at ticket-creation time** — a value
that drifts on every locale-switcher click and is unrelated to the recipient's *current* session
locale. The resulting uk prose is written verbatim into `notifications.title` (no locale column
exists) and rendered verbatim by `NotificationItem.tsx:97` regardless of the viewer's current
`useLocale()`. Producer #2 shares the identical mechanism (same risk, different verdict path);
producers #3/#4/#5 are a separate, additional WRONG-LOCALE-RISK (hardcoded `sq`, copied from the
Epic GG email policy). Producer #6 (`listing_status_change`) is the only fully render-time-safe
pattern and is cited as the reference for Task 319's recommended fix shape.

## 4. Clauses 11/12/13 — N/A

No UI rendered, no component/story touched, no breakpoint or responsive surface affected. This
task produced one new governance report + a one-line docs cross-reference. The mobile <640
full-width gate and the breakpoint × locale render matrix do not apply.

## 5. Clause 14 — file-integrity transcript

```
=== docs/governance-reports/2026-06-13-notification-locale-audit.md ===
$ tr -cd '\000' < docs/governance-reports/2026-06-13-notification-locale-audit.md | wc -c
0
$ head -c 3 docs/governance-reports/2026-06-13-notification-locale-audit.md | xxd
00000000: 2320 4e                                  # N
$ wc -l docs/governance-reports/2026-06-13-notification-locale-audit.md
349 docs/governance-reports/2026-06-13-notification-locale-audit.md
$ tail -c 200 docs/governance-reports/2026-06-13-notification-locale-audit.md
...recommended fallback (§6); Task 319 hand-off checklist (§7) is concrete and actionable;
`git diff --stat src` empty (§8); discrepancies vs pre-analysis documented (§9) — PASS**

=== docs/i18n-rules.md ===
$ tr -cd '\000' < docs/i18n-rules.md | wc -c
0
$ wc -l docs/i18n-rules.md
195 docs/i18n-rules.md
$ tail -c 100 docs/i18n-rules.md
... the
full Task 316 audit and `tasks/Epics/Epic_II_Global_i18n_Hardening.md` for the
full epic plan.

=== docs/backlog.md ===
$ tr -cd '\000' < docs/backlog.md | wc -c
0
$ head -c 3 docs/backlog.md | xxd
00000000: 2320 50                                  # P
$ wc -l docs/backlog.md
65 docs/backlog.md
$ tail -c 200 docs/backlog.md
...Negative flow rule (`orchestrator-role.md`). Non-optional acceptance gates on every task.

## Archive

Completed tasks, sprints, and epics live in **[`docs/backlog-archive.md`](backlog-archive.md)**.

=== docs/backlog-archive.md ===
$ tr -cd '\000' < docs/backlog-archive.md | wc -c
0
$ head -c 3 docs/backlog-archive.md | xxd
00000000: 2320 42                                  # B
$ wc -l docs/backlog-archive.md
312 docs/backlog-archive.md
$ tail -c 200 docs/backlog-archive.md
...| — | Post-Governance Debt Burn-down · Future Maintenance Direction · Responsive/UI Governance
· Filter Architecture Stabilization — all CLOSED | Tasks 64–71, 58–63, 51–57, 50.4 | — |

=== docs/sessions/2026-06-13-task318-notification-locale-audit.md ===
$ tr -cd '\000' < docs/sessions/2026-06-13-task318-notification-locale-audit.md | wc -c
0
$ head -c 3 docs/sessions/2026-06-13-task318-notification-locale-audit.md | xxd
00000000: 2320 53                                  # S
$ wc -l docs/sessions/2026-06-13-task318-notification-locale-audit.md
138 docs/sessions/2026-06-13-task318-notification-locale-audit.md
$ tail -c 200 docs/sessions/2026-06-13-task318-notification-locale-audit.md
...line (no
duplicated body); clauses 11/12/13 N/A documented; clause 14 green for both touched files;
backlog tidied (Task 423 archived, Last Session = Task 318, Epic II queue → 319 next) — PASS**
```
(Note: this transcript for the session log itself was captured from the pre-addendum file state,
immediately before the addendum appended this §5 transcript + §7 exception note. The file grows
as a result — see the Files Changed table for the updated rationale.)

All 5 touched files: 0 NUL bytes, no BOM, complete final content.

## 6. `git diff --stat src` — confirmed EMPTY

```
$ git diff --stat src
(empty, exit 0)
```

## 7. Backlog-tidy exception (`docs/backlog-archive.md`) — explicit log

`docs/backlog-archive.md` is **outside** the parent kickoff's explicit file allowlist
(`docs/governance-reports/**`, `docs/i18n-rules.md`, `docs/backlog.md`, `docs/sessions/**`). It
was touched in this task to move the Task 423 "Last Session" row to the top of the archive ledger,
per the standing **owner backlog-tidy P0 (2026-06-12)**: "the MOMENT you finish
verifying/reviewing/closing a task, immediately tidy `docs/backlog.md`... move every older session
entry to ONE row at the TOP of `docs/backlog-archive.md`". This is a **sanctioned, standing-rule
addition** to the file allowlist, not scope creep — logged here explicitly per this addendum's
requirement.

---

## Files Changed

| File | Change | Rationale |
|---|---|---|
| `docs/governance-reports/2026-06-13-notification-locale-audit.md` | New report: §1 binding model (incl. new `preferred_locale`-drift finding), §2 per-producer map (6 producers, corrects pre-analysis's 7), §3 render-layer map (all 9 `NotificationType`s), §4 named root cause (`admin/actions/index.ts:728`, producer #1), §5 three fix options (A/B/C) for Task 319, §6 legacy-rows handling, §7 Task 319 hand-off checklist, §8 empty-diff confirmation, §9 discrepancies vs pre-analysis | Task 318 primary deliverable |
| `docs/i18n-rules.md` | §8 Epic II cross-reference table: Task 318 row updated from "PLANNED" to "318 audit DONE … see `docs/governance-reports/2026-06-13-notification-locale-audit.md`; 319 fix PLANNED" | One-line pointer per kickoff decision 2 (no duplicated report body) |
| `docs/backlog.md` | "Last Session" Task 318 entry + Epic II queue note (319 next, blocked on owner picking Option A/B/C) | Mandatory backlog update (agent-contract clause 10) |
| `docs/backlog-archive.md` | Task 423 entry archived to top row (was occupying "Last Session") | Backlog-tidy rule (owner P0 2026-06-12) |
| `docs/sessions/2026-06-13-task318-notification-locale-audit.md` | This session log (new file; amended by the Task 318 validation addendum to complete the §5 Clause-14 transcript for all 5 touched files + add §7 backlog-tidy exception note) | Required session log (agent-contract clause 10) + addendum acceptance criteria |

No `src/`, `messages/`, or `package.json` changes — diagnosis only, per kickoff decision 1.

---

## Self-validation

**Self-validation: 6 `createNotification` producers enumerated via `grep -rn` (pasted §2 above),
producer-count discrepancy vs pre-analysis (7→6) documented; every producer traced to its
`s`-string source and given a verdict; render-layer map covers all 9 `NotificationType`s;
root cause named to `admin/actions/index.ts:728` with the full creation-time-snapshot ↔
`preferred_locale`-drift mechanism (new finding, §1/§4); §5 presents 3 scoped options (A/B/C),
none implemented; §6 legacy-rows recommendation given; §7 hand-off checklist concrete;
`git diff --stat src` empty; `docs/i18n-rules.md` gains exactly one cross-reference line (no
duplicated body); clauses 11/12/13 N/A documented; clause 14 green for ALL 5 touched files
(addendum-complete, §5); `docs/backlog-archive.md` exception explicitly logged (§7) as the owner
backlog-tidy P0 (2026-06-12), not scope creep; backlog tidied (Task 423 archived, Last Session =
Task 318, Epic II queue → 319 next); `git diff --stat src` reconfirmed empty (§6) — PASS**
