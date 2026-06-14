# Epic II — Global i18n Hardening (admin / public / notifications / emails / toasts / dynamic DB labels)

> **Owner:** Opus 4.8 orchestrator (planning); Sonnet 4.6 (per-task execution after kickoff approval).
> **Status:** FORMED 2026-05-30 (owner directive — recurring i18n problems are systemic, not isolated bugs).
> **Owner gate:** Phase 1 (audit + missing-key scanner) ships standalone; Phase 2+ remediation kickoffs blocked on audit output.

## Why this Epic exists

Owner observations (2026-05-30):

1. **Public site notifications render the wrong locale** — on `sq` locale, a notification popup showed Ukrainian text: "Скарга на ваш аккаунт..." (translation: "Complaint about your account..."). Notifications are not reliably locale-bound to the recipient.
2. **Admin support shows missing i18n keys at runtime** — `MISSING_MESSAGE: Could not resolve 'admin.support.role_user' in messages for locale 'uk'`, raw keys visible like `admin.support.support_status_open` (this is **Task 300** in Sprint 21 — first concrete slice of this Epic).
3. **Dynamic key patterns** (`t(\`role_${role}\`)`, `t(\`status_${state}\`)`) are scattered across the codebase without a parity guard catching missing keys ahead of runtime.
4. **Notifications, emails, toasts, modals, dynamic DB status/role labels** all share the same risk surface but have no canonical i18n hardening playbook.
5. **Pre-build i18n scanner** for missing keys + raw key leakage exists implicitly (`npm run check:i18n` matches counts), but does not catch dynamic-key gaps or locale-binding bugs at the rendering layer.

The owner's directive: form an Epic-level workstream so these stop being filed as one-off hotfixes. Each runtime i18n bug is the surface of a deeper systemic issue.

## Out of scope for this Epic

- General copy quality / translation editorial polish (separate content QA effort).
- Adding new languages beyond sq/en/uk/it.
- Outbound email language policy (already canonical: sq-only — see `docs/integrations.md` "Outbound email language policy" + Task 251 / Epic GG). This Epic covers email TEMPLATE rendering correctness in sq, not language scope.
- Public site responsive recovery (separate Epic).
- Admin UX System (Epic HH).

## Phases

### Phase 0 — Sprint 21 critical hotfix slice

Task **300** — Admin Support i18n missing keys (`admin.support.role_*`, `admin.support.support_status_*`) — kickoff complete, in Sprint 21. Treated as Phase 0 of this Epic because the underlying class of bug (dynamic-key calls with no parity guard) is exactly what Phase 1 will systematically audit.

### Phase 1 — Audit + missing-key scanner

**Task 316 — Project-wide dynamic-key + missing-key audit** (audit/spec only)

- Scan the entire repo for dynamic `t()` calls: `t(\`...${var}\`)`, `t(\`prefix_${enum}\`)`, `t(variableExpression)`.
- For each dynamic call site, enumerate every possible resolved key (from the source enum / array / object).
- Cross-reference against `messages/{sq,en,uk,it}.json` — list missing keys per locale.
- Inventory raw-key leakage risks: any place a fallback string could leak the raw key to the user.
- Produce `docs/governance-reports/2026-XX-XX-i18n-dynamic-key-audit.md` (NEW): per-file, per-call-site dynamic enumeration + missing-key matrix.

**Task 317 — Missing-key scanner script** (script-only, no production code changes)

- Add `scripts/governance/i18n-missing-keys.mjs` that statically resolves dynamic `t()` calls against the enum / source-of-truth and reports missing keys in any locale.
- Wire into `npm run check:i18n` (or new `check:i18n-dynamic`).
- Add to CI gate (separate concern — owner approves the CI wiring).
- Documentation: `docs/i18n-rules.md` (NEW or extend `docs/ai-behavior.md` i18n section) with the canonical pattern: every dynamic `t()` call MUST cite the source enum + every enum value MUST appear in a CI-checked list.

**Task 318 — Notification locale-binding audit** (audit/spec only — surfaces the "Скарга на ваш аккаунт" Ukrainian-in-sq bug)

- Inventory the notification creation paths: which DB rows / which actions / which queue producers emit notifications.
- For each path, document where the locale is bound (creation time vs. delivery time vs. render time).
- Identify the root cause of the wrong-locale bug: was the notification rendered with the actor's locale instead of the recipient's? Cached? Default-fallback-misfire?
- Produce `docs/governance-reports/2026-XX-XX-notification-locale-audit.md` with the per-path locale-binding map + fix recommendations.
- Likely Phase 2 task to remediate (see Task 319 below).

### Phase 2 — Remediation

**Task 319 — Notification locale-binding fix** (implementation)

- Based on Phase 1 Task 318 audit. Most likely scope: notification render-time localisation using the RECIPIENT's preferred locale, not the actor's.
- Touches notification helper layer + DB column for recipient locale (if missing) + rendering layer + all four locale files (notification namespace key parity).

**Task 320 — Dynamic-key remediation sprint (admin + public)**

- Fill every missing dynamic key surfaced by Phase 1 Task 316 audit.
- Likely multi-batch (admin batch, public batch, notification batch, email batch). May split into Tasks 320a/b/c at orchestrator's discretion based on Phase 1 output volume.

**Task 321 — Email template i18n correctness** (audit + remediation)

- Confirm every email template renders in sq (the only outbound locale per policy) without missing keys / raw key leaks.
- Cross-reference all `messages/sq.json` keys consumed by email templates against the template list.
- Fix any sq-side gaps. Document the email-template key surface in `docs/i18n-rules.md`.

**Task 322 — Toast + modal + dialog i18n correctness audit**

- Inventory every `toast(t('...'))` + every `<Dialog>` / `<Sheet>` / `<Popover>` rendered text.
- Confirm all keys exist in all 4 locales; confirm no hardcoded English fallbacks.

### Phase 3 — Governance / CI hardening

**Task 323 — `check:i18n` extension** (script + CI)

- Combine Phase 1 Task 317 scanner with existing parity guard.
- Make the combined check a blocking CI gate (governance:i18n) — owner approval required for blocking behaviour.
- Document the canonical i18n rules in `docs/i18n-rules.md` (or `docs/ai-behavior.md` i18n section): every UI string in `useTranslations()`, every dynamic key statically enumerable, every locale parity, every notification render-time bound to recipient locale, etc.

## Per-task universal rules

- Locale coverage: sq / en / uk / it always. No "uk-only stress test" approvals.
- Outbound email policy unchanged (sq-only — Epic GG).
- Notes 18 / 19 / 20 / 21 / 22 / 23 apply per `docs/ai-behavior.md`.
- Files Changed table per Task 264; orchestrator emits commits.
- No git from executor.
- No scope creep into other Epics (admin UX, responsive).

## Dependencies / sequencing

- **Phase 0 (Task 300) ships standalone** in Sprint 21 as a CRITICAL hotfix.
- **Phase 1 (Tasks 316/317/318) ships standalone (Sprint 24)** — audit/spec only. **NOT blocked** on Epic HH owner decisions or on any other Epic. Phase 1 produces documentation + new scripts; no production code changes. Owner-approved 2026-05-30.
- **Phase 2 (Tasks 319/320/321/322) blocked on Phase 1 output** — each remediation kickoff cites the specific Phase 1 audit row(s) it addresses. Kickoffs for 319-322 are **NOT written yet** — they will be drafted only after 316/317/318 ship and the audit output is reviewed.
- **Phase 3 (Task 323) ships last** — locks in the governance that makes Phase 1's audit a permanent CI guard.

## Status / progress tracking

| Phase | Tasks | Status |
|---|---|---|
| Phase 0 — Sprint 21 hotfix slice | 300 (Admin Support i18n) | FORMED 2026-05-30 |
| Phase 1 — Audit + scanner | 316, 317, 318 | PLANNED (kickoffs to be written after Phase 0 ships) |
| Phase 2 — Remediation | 319 (notif), 320 (dynamic-key), 321 (email), 322 (toast/modal) | PLANNED (blocked on Phase 1 output) |
| Phase 3 — CI / governance | 323 | DONE (2026-06-14) — `check:i18n-dynamic` wired as a blocking step in `governance-pr.yml`, immediately after `check:i18n-hardcode`; parity gate (`governance:localization`) verified green, unchanged |

## Cross-Epic references

- Sprint 21 → `tasks/Sprints/Sprint_21_—_Admin_Critical_Hotfixes_and_Footer_Fix.md` (Task 300 is Phase 0 here).
- Epic HH — Admin UX System → `tasks/Epics/Epic_HH_Admin_UX_System.md` (Phase 1 Task 303 audit may surface admin-specific i18n gaps to be fed into this Epic's Task 320).
- Epic GG — Albanian-Only Outbound Email → already CLOSED; remains canonical.
- Task 288 — i18n hardcode audit (2026-05-29, COMMITTED) → already addressed static hardcode strings; this Epic addresses dynamic-key gaps + locale-binding bugs, the next layer.
- `docs/integrations.md` → "Outbound email language policy" — referenced by Task 321.
