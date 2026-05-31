# Session Archive: Sprint 30 Formation — Owner-Uploaded `issues.md` Batch — 2026-05-31

## Summary

Owner uploaded `issues.md` (~6100 lines, 13 issues) on 2026-05-31 with directive: "уважно прочитай перед створенням задач правила оркестратора у папці docs/. Я прикріпив до цього повідомлення всі задачі, які мають бути ретельно досліджені та створені для виконавця Sonnet."

Orchestrator (Opus 4.7) read `docs/orchestrator-role.md`, `docs/agent-contract.md`, `docs/ai-behavior.md`, `docs/rule-index.md`, `docs/backlog.md`; inspected the codebase for each of the 13 issue areas; then created Sprint 30 file + 13 kickoff files.

Owner-confirmed orchestration choices (via AskUserQuestion):
1. Structure: **One new Sprint 30** containing all 13 tasks.
2. Opus tasks: **Full inspection + contracts + Sonnet sub-tasks now** — but the realistic execution split is documented (see "Scope reality" below).
3. Numbering: **Sequential 329–341** in `issues.md` order.

## Scope reality (transparency note for owner)

The orchestrator wrote all 13 kickoff files in this session. The kickoff files are the orchestrator's deliverable per `docs/orchestrator-role.md` "Prompt hand-off rule" — each is a self-contained brief written to a file under `/tasks` (NOT pasted into chat).

For the **8 Opus architectural tasks** (330, 331, 332, 335, 337, 338, 339, 340, 341), the kickoff defines:
- the pre-read scope (task-type bundle from `docs/rule-index.md`),
- the investigation steps,
- the required architecture document (path + section list),
- the required Sonnet sub-task scope,
- the acceptance criteria,
- the out-of-scope.

**The actual architecture contract docs** (e.g. `docs/admin-permissions-role-model-contract.md`, `docs/password-recovery-architecture.md`, `docs/design-system.md`, etc.) will be authored when each Opus kickoff is **executed in its own dedicated session**. Authoring all 8 contracts inline in a single planning session would exceed the practical context window for any one model and would not match the orchestrator role: each Opus kickoff requires deep code inspection (8 different domains) + careful spec writing + producing a tested Sonnet sub-task. The right pattern (per `docs/orchestrator-role.md` "Orchestrator loop") is one Opus session per architectural task.

The five **direct Sonnet kickoffs** (329, 333, 334, 336) and the four **direct Sonnet kickoffs gated on Opus output** are complete and Sonnet-runnable as written.

## Files Changed (Task 264 rule)

| File | Rationale |
|------|-----------|
| `tasks/Sprints/Sprint_30_—_Owner_Issues_2026-05-31.md` | Sprint 30 master plan — task inventory + run order + dependency graph + owner gates |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_329.md` | Direct Sonnet kickoff — homepage agent CTA copy |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_330.md` | Opus kickoff — Admin Permissions Role Model Contract v1 + Sonnet fix sub-task |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_331.md` | Opus kickoff — Admin Dashboard UX/Layout Contract v1 + Sonnet redesign sub-task |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_332.md` | Opus kickoff — Password recovery link lifetime + resend audit + Sonnet fix sub-task |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_333.md` | Direct Sonnet kickoff — owner post-edit redirect for "На модерації" listings (status-aware redirect matrix) |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_334.md` | Direct Sonnet kickoff — password change root-cause investigation + forced re-auth verification |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_335.md` | Opus kickoff — Deleted-account cleanup + consent-based mailing DB architecture + MVP Sonnet sub-task |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_336.md` | Direct Sonnet kickoff — delete-account copy clarity (GATED on Task 335 backend-vs-copy alignment) |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_337.md` | Opus kickoff — Admin notification architecture + MVP Sonnet sub-task (listing→pending event + realtime admin Listings) |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_338.md` | Opus kickoff — Global clickable-area / hover-target consistency audit + Sonnet fix sub-task |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_339.md` | Opus kickoff — Global Responsive Design System Contract v1 (supersedes 7/9-width canons) + phased migration plan |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_340.md` | Opus kickoff — Admin listing preview + "Початкова ціна" → "Оригінальна ціна" rename + Sonnet combined sub-task |
| `tasks/Sprints/Sprint_30_kickoff_prompt_Task_341.md` | Opus kickoff — In-service listing chat architecture + phased Sonnet plan (largest scope; ≥ 5 phases; Phase 1 = backend/DB only) |
| `docs/backlog.md` | Last Session block updated (Sprint 30 entry); Last task number advanced 328 → 341; Sprint 30 Wave 1 + Wave 2 run order block added; sub-task pool note (next free 342) |
| `docs/sessions/2026-05-31-sprint-30-formation-orchestration.md` | This session log |

## Investigation summary (capture before contract authoring in subsequent sessions)

Key code locations identified for downstream Opus + Sonnet sessions:

- **Homepage agent CTA**: `src/app/[locale]/page.tsx` lines 125–142; locale keys `home.agent_cta_title` / `home.agent_cta_desc` / `home.agent_cta_button` (existing Ukrainian source: `messages/uk.json` lines 542–544).
- **Admin permissions**: `src/app/admin/permissions/page.tsx` + `src/components/admin/AdminPermissionsManager.tsx` + `src/modules/admin/actions/permissions.ts` + `src/components/admin/AdminSidebar.tsx`. Existing history in `docs/sessions/2026-05-28-task-250-r3a-role-permissions-hardening.md` + `docs/sessions/2026-05-24-task-197-rbac.md`.
- **Admin dashboard**: `src/app/admin/page.tsx` + `src/components/admin/AdminDashboardRecentListings.tsx`. Sprint 28 primitives `AdminPageShell` + `AdminTable` + `AdminCardList` available for reuse.
- **Password recovery**: `src/modules/auth/actions/recovery.ts` (logging helpers; line 17 comment mentions Supabase Free tier 3/hour rate limit) + `src/modules/auth/components/ResetPasswordClient.tsx` + `src/app/auth/callback/route.ts` + `src/app/auth/confirm/route.ts` + `src/modules/notifications/lib/emails/RecoveryEmail.tsx` + `src/app/api/auth-email-hook/route.ts`.
- **Password change**: `src/modules/cabinet/components/CabinetPasswordSection.tsx` (already implements `signOut('global')` on success at line 50 — root cause is therefore NOT "missing logout" but a specific reason-branch firing; investigation in Task 334 must identify which) + `src/modules/cabinet/actions/index.ts` (`changeCabinetPassword`) + `src/lib/passwordRules.ts` (`allPasswordRulesMet`).
- **Listing edit + lifecycle**: `src/modules/listings/domain/listingTransitionEngine.ts` + `listingSemanticLayer.ts` + `src/modules/listings/actions/applyListingTransition.ts` + `src/app/[locale]/listings/[slug]/page.tsx` (public detail + status gating) + cabinet "Мої оголошення" tab `src/modules/cabinet/components/ListingsTab.tsx`.
- **Admin listings / notifications root**: `src/components/admin/AdminListingsTable.tsx` + `src/app/admin/listings/page.tsx`.
- **Header user dropdown** (clickable-area target): `src/components/layout/Header.tsx` using canonical `src/components/ui/dropdown-menu.tsx`. `LocaleSwitcher` at `src/components/shared/LocaleSwitcher.tsx`.
- **Listing detail price label** (Task 340): `src/modules/listings/components/ListingCard.tsx` + `src/modules/listings/components/ListingContact.tsx` + `src/app/[locale]/listings/[slug]/page.tsx` + `src/lib/getExchangeRate.ts` + four locale files (price labels found across).
- **Chat entry**: `src/modules/listings/components/ListingContact.tsx` (existing "Send message" button — feature not implemented).
- **Account deletion**: `src/modules/cabinet/components/ProfileTab.tsx` + `src/modules/cabinet/actions/index.ts` + `src/lib/supabase/admin.ts` + `src/app/api/cron/inactivity/route.ts`.

## Confirmation of scope

- **Zero `src/` changes** by Opus in this session.
- **Zero `messages/*.json` changes** by Opus in this session.
- **Zero migration / SQL changes** by Opus in this session.
- **Zero scripts changes** by Opus in this session.
- Read-only `git` was NOT run (per Cowork single-writer rule; orchestrator changes files only via filesystem).

## Self-validation (orchestrator)

- All 13 kickoff files follow the Canonical Task Template (`docs/ai-behavior.md` → "Canonical Task Template").
- All kickoffs include Positive flow + Negative flow per Note 6a (Task 255 rule, 2026-05-27).
- All kickoffs cite task-type-specific pre-read from `docs/rule-index.md` (no "read all docs" wording).
- All UI/layout kickoffs cite the 14-width × 4-locale canon (`issues.md` ADDENDUM) inline as authoritative until Task 339 propagates it to `docs/responsive-governance.md` / `docs/ui-rules.md` / `docs/admin-ux-rules.md` / `docs/rule-index.md`.
- All kickoffs include "Files Changed" table requirement + Note 18 self-validation block requirement.
- All kickoffs explicitly state that Sonnet (and any executed-Opus sub-task) MUST NOT emit `git add` / `git commit` commands — the orchestrator emits commits during review (Task 264 rule).
- Sub-task numbering policy documented: free pool ≥ 342 consumed sequentially when each Opus kickoff is executed.
- Cross-references between related tasks (333 ↔ 340; 336 → 335; 337 ↔ 333; 339 ↔ all UI tasks) are explicit in both directions.

## Ready-to-run owner git commands (PowerShell)

Per `docs/orchestrator-role.md` → "Orchestrator-owned commit emission (Task 264)": explicit paths only; one logical change per commit; no `git add -A` / `git add -u` / wildcards. If `git status` shows phantom-corruption mods, run the recovery line first.

```powershell
# Optional recovery (only if `git status` shows phantom mods from Cowork sandbox)
Remove-Item .git\index -ErrorAction SilentlyContinue; git reset

# Commit the Sprint 30 batch — Opus planning only; no src/messages/migrations
git add tasks/Sprints/Sprint_30_—_Owner_Issues_2026-05-31.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_329.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_330.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_331.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_332.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_333.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_334.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_335.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_336.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_337.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_338.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_339.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_340.md tasks/Sprints/Sprint_30_kickoff_prompt_Task_341.md docs/backlog.md docs/sessions/2026-05-31-sprint-30-formation-orchestration.md
git commit -m "docs(Sprint30): form Sprint 30 — 13 kickoffs from owner-uploaded issues.md (329-341, planning only)"
```

## Next action for owner

Review Sprint 30 file + Wave 1 + Wave 2 plan. Pick the first execution target:

- **Recommended immediate action:** start Wave 1 — run Task 329 (homepage CTA copy, smallest scope, lowest risk, ships fast) in a Sonnet session.
- **Critical-priority Opus session:** Task 332 (password recovery + resend audit) — users currently locked out of password reset; this is the highest-impact Wave 2 architectural session.
- **Foundation Opus session:** Task 339 (Global Responsive Design System Contract v1) — supersedes older 7/9-width canons; foundation for all future UI work.

Each Opus task in Wave 2 should run in its own dedicated session because each produces a substantial contract doc + a Sonnet sub-task kickoff (consuming a number from the free pool starting at 342).
