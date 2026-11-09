# Sprint 31 — Task 356 kickoff (Opus planning) — Define authenticated Private → Agent account upgrade flow + produce the Sonnet implementation task

> **Status: READY (priority: CRITICAL bug, scheduled after 354/355 per owner ordering).** This is an
> **Opus architecture/planning** task — it produces a contract + ONE copy-paste-ready Sonnet implementation
> task; it does NOT itself ship product code. Related: Epic B — Auth Registration and Agent Onboarding
> (`tasks/Epics/Epic_B_Auth_Registration_and_Agent_Onboarding.md`); supersedes the toggle behavior touched
> by Task 330 (homepage agent CTA copy).
>
> The Sonnet sub-task(s) this produces consume the next free number(s) from the pool **≥ 357** — assign at
> the time the sub-task file is written.

```
Type:     architecture / bugfix planning
Priority: critical
Area:     auth / profile / account type / agent onboarding / homepage CTA
```

## Role contract

You are Opus acting as the lero-al orchestrator / architect / reviewer. You must **NOT write product code**
in this task. Your job: (1) inspect current implementation; (2) identify exact root causes; (3) define the
canonical account-type upgrade flow; (4) produce one concrete, copy-paste-ready Sonnet implementation task that
fixes the bug correctly; (5) update planning/session docs per the current backlog workflow.

**Allowed/Forbidden lists below are EDIT/WRITE scope only.** Opus MUST read and `rg`-search runtime files to
perform the audit — reading is required; writing is forbidden.
**Allowed to EDIT/WRITE:** `docs/backlog.md` · `docs/sessions/` · `tasks/Epics/` · `tasks/Sprints/`.
**Forbidden to EDIT/WRITE (read/search ALLOWED for audit only):** `src/` · `app/` · `components/` · `modules/` ·
`database/migrations/` · `messages/*.json` · package files · any runtime UI/code.
**Git:** Opus does NOT run mutating git (`add`/`commit`/`push`/`reset`/`restore`/`stash`/`checkout`/`merge`) — only
read-only git for review; the owner runs every commit from PowerShell (single-writer rule, `docs/orchestrator-role.md`).

## Required pre-read

`docs/backlog.md` · `docs/agent-contract.md` · `docs/rule-index.md` · `docs/orchestrator-role.md` ·
`docs/ai-behavior.md` · `docs/rls-rules.md` · `docs/domain-rules.md` · `package.json` · relevant current
task/sprint/epic files under `tasks/Epics/` and `tasks/Sprints/` (esp. Epic B + Task 330).

Inspect current implementation for: homepage "Приєднатись як агент" / "Join as agent" CTA · auth
registration modal/drawer/sheet · agent registration flow · profile page · account-type controls · private
user profile fields · agent/company profile fields · user role/account-type persistence · any company/agency
table/model · avatar upload flow (company logo should reuse this if possible) · route/intercepted-modal behavior
that may cause the blank-page spinner after closing the drawer.

Suggested searches (adapt):
- `rg -n "agent|агент|Agent|account type|Тип акаунту|Приватна особа|Private|company|Назва компанії|join as agent|Приєднатись як агент|registration" src app components modules messages`
- `rg -n "router.back|router.push|intercept|modal|drawer|sheet|spinner|loading|Register|Зареєструватись" src app components modules`
- `rg -n "avatar|upload|logo|companyLogo|agency|profile" src app components modules`
- `rg -n "role|account_type|accountType|user_type|userType|is_agent|agent" src app components modules database supabase`

## Owner-reported bug

An authenticated registered **private** user, on the homepage, clicks "Приєднатись як агент" /
"Зареєструватись як агент". Instead of a controlled upgrade flow, the system opens the **same agent registration
drawer/modal used for a NEW user** — architecturally wrong for an authenticated existing account. **Additional
critical bug:** when this drawer/modal is closed, the page becomes blank and stuck with a spinner. Treat as a
real bug, not a UX preference.

## Owner-approved canonical business logic

Three user states must NOT share behavior:

1. **Guest / unauthenticated:** homepage agent CTA may open/route to the existing agent registration/login flow;
   current registration flow may be reused only for guests; must not break the page when closed.
2. **Authenticated private user:** clicking the CTA must NOT open the new-user registration drawer/modal; it must
   route to a dedicated **Private → Agent account upgrade** flow (an upgrade, not registration). Recommended route:
   `/[locale]/profile/upgrade-agent` (or an existing canonical profile/account route — decide during audit). The
   upgrade page must clearly explain the action. Required UK copy meaning: *"Ви хочете змінити тип акаунту з
   'Приватна особа' на 'Агент'. Після переходу на агентський акаунт ви зможете розміщувати об'єкти як агент або
   компанія. Якщо ви натиснули цю кнопку помилково, поверніться назад."* Final copy localized in sq/en/uk/it via
   existing i18n conventions. Page includes: clear title · explanation that this is a one-way account upgrade ·
   back/cancel action · fields needed to become an agent · submit "Оновити тип акаунта" (or best localized equivalent).
   **Required fields:** Company name (required unless schema proves otherwise — justify in the Sonnet task if
   optional); Company logo (optional; reuse existing avatar upload pattern where possible); Company city (required
   unless schema proves otherwise — justify if optional). **Optional fields** only if the current schema already
   supports them or they're needed for consistency; otherwise optional for this task unless owner approves.
   **After successful upgrade:** set account type to Agent · create/update related company/agency profile if the
   model requires · persist submitted company info · redirect to profile · profile shows Agent · success toast if
   the existing UX uses toasts · refreshed page still shows Agent + persisted company data.
3. **Authenticated agent:** homepage CTA must not offer "register as agent" again, must not open registration or
   upgrade flow; safest = hide the CTA or replace with a profile/cabinet action if the section needs a button.
   **Opus chooses one final behavior and encodes it in the Sonnet task.**
4. **Admin / moderator:** CTA must not route an already-authenticated admin/moderator into new-user agent
   registration; no admin/moderator may be accidentally converted to an agent. Opus inspects the role/account-type
   model and defines the safest behavior.

## Profile page correction

Current profile shows account type as two button-like tabs ("Приватна особа" / "Агент"), active tab red. Core
problem: Private → Agent currently behaves like a lightweight UI toggle/tab; it must become a controlled one-way
account upgrade. **Private users in profile:** show current type "Приватна особа"; provide a clear CTA "Перейти на
агентський акаунт" routing to the dedicated upgrade page; agent/company fields must not appear merely from clicking
a tab. **Agents in profile:** show "Агент"; **completely hide** the "Приватна особа" button/option (not disabled,
not read-only); no self-service downgrade; agent/company fields remain editable if they are today or via the
canonical profile/company form Sonnet creates.

## One-way account lifecycle rule

Private → Agent allowed through the controlled upgrade flow. Agent → Private NOT allowed through profile UI. The
Sonnet task must require BOTH a UI guard (no visible downgrade control for agents) AND a server/action guard
(direct/manual attempts must not downgrade an agent unless an existing admin-only workflow explicitly supports it —
preserve any such admin workflow).

## Blank-page spinner bug

The Sonnet task must require: identify root cause · fix close behavior · closing any agent registration/upgrade
modal/drawer returns to a valid page state · no infinite loading · no stuck parallel/intercepted route · no empty
page after close · browser back/close behavior tested. Fix this even though authenticated users no longer open the
registration drawer.

## Localization / responsive / accessibility (the Sonnet task must require)

Locales sq/en/uk/it; all new strings localized; no hardcoded UI strings; no wrong-locale fallback; all account-type
labels, upgrade copy, validation errors, buttons, success/error messages, helper text translated. Canonical
breakpoints 320·375·390·768·1280·1440·2560 (plus stress checks 480·560·680·810·960·1024·1200·1920 where feasible);
text wraps; no clipped buttons; no horizontal overflow; no hidden submit/back; usable upload control on mobile.

## Required Opus investigation output (document before producing the Sonnet task)

1. Homepage CTA implementation (file paths; how it decides guest/auth/private/agent; why authenticated private
   users currently get the registration modal). 2. Registration drawer/modal implementation (file paths; close/back
   behavior; likely cause of blank spinner). 3. Profile account-type implementation (file paths; whether
   "Приватна особа"/"Агент" are tabs/buttons/form state/persisted mutation; whether clicking "Агент" persists
   anything). 4. Account-type persistence (field/table names; allowed values; existing server actions/API; RLS/
   server constraints). 5. Company/agency model (does it exist; where name/city/logo stored; can logo reuse avatar
   upload). 6. Admin/moderator behavior (do they have account-type controls; what must be preserved).

## Required Sonnet task structure

Produce ONE concrete Sonnet implementation task unless the audit proves it must split for safety. If split, only
into: **Task A** immediate routing/modal/spinner bugfix + auth branching; **Task B** dedicated upgrade page +
profile one-way account lifecycle. Do not split into more than two without explicit owner approval. The Sonnet task
must include: title (with next backlog number) · Type/Priority/Area · required pre-read (selected from
`docs/rule-index.md` — "Profile / edit-flow" + "DB / server action / RLS" + "UI / layout" bundles, plus the
always-required pair) · exact files to inspect · current behavior to preserve · required behavior · implementation
requirements · localization sq/en/uk/it · responsive requirements (all breakpoints) · accessibility · server-side
persistence/guard requirements · acceptance criteria · out of scope · validation commands · final report format.
**No git commands — the orchestrator emits commits.**

**MANDATORY (Task 255 rule — `docs/orchestrator-role.md`):** the Sonnet task you produce MUST contain two explicit
named sections, step by step, and its Acceptance criteria MUST cite both by name:
- **`Positive flow (happy path)`** — for each of guest / authenticated private / authenticated agent / admin-moderator:
  actor, preconditions, ordered user steps 1…N, system response at each step, success state, post-conditions (account
  type persisted = Agent, company/agency row written, redirect target = profile, toast shown, profile + refreshed
  profile show Agent, "Приватна особа" hidden).
- **`Negative flow (every off-happy-path branch)`** — at minimum: cancel/dismiss of the upgrade page or any
  registration/upgrade modal-drawer (Esc, backdrop, Cancel, browser back) → returns to a valid route, NEVER a blank
  page with spinner; validation error (missing required company name/city) → localized error, no account change;
  server error / 500 → no partial upgrade, localized message, recover; permission-denied / unauthenticated guest
  routed correctly; double-submit guard; agent self-downgrade attempt blocked by BOTH UI guard and server/action
  guard; admin/moderator never converted to agent; locale mismatch / no English leak into sq/uk/it; expired session.
  Each branch: trigger, expected system response, what is shown (message + locale key), what is NOT done (no DB
  write, no nav), how the user recovers.

## Mandatory Sonnet acceptance criteria to include (literal)

Guest CTA follows guest agent registration/login and closes without blank page/spinner · authenticated private user
CTA does not open new-user registration modal/drawer · authenticated private user CTA routes to the dedicated
upgrade flow · upgrade page clearly explains the Private→Agent change · upgrade page has back/cancel · upgrade page
has company name, optional company logo upload, company city per the final schema decision · logo upload reuses
existing avatar/upload pattern where possible · successful upgrade persists account type Agent · persists
company/agency data · redirects to profile · profile shows Agent · after refresh still shows Agent · after upgrade
"Приватна особа" button/option completely hidden · agents cannot self-downgrade from profile UI · server/action
layer prevents accidental agent→private downgrade via direct calls unless an existing admin-only workflow supports
it · private profile no longer exposes Agent as a simple tab/toggle revealing agent fields · private profile shows a
controlled CTA to start upgrade · already-agent users don't see/trigger "register as agent" from homepage CTA ·
admin/moderator not routed into agent registration or converted · closing registration/upgrade modal/drawer never
leaves a blank page with spinner · browser back returns to a valid route/state · all new text localized sq/en/uk/it
· UI works at 320/375/390/768/1280/1440/2560 with no overflow/clip/hidden submit/back in any locale · existing
unrelated profile capabilities, guest auth registration, avatar upload, and any existing admin-only account/role
management remain working.

## Out of scope for Sonnet (Opus must include)

Paid plans · agent subscription billing · agent verification/review workflow unless already present and required for
persistence · redesigning the entire profile page · redesigning global auth · removing guest registration · Agent→
Private downgrade from profile · changing admin/moderator permissions beyond preventing accidental agent-registration
routing · unrelated profile fields · changing listing-creation rules unless required by existing account-type checks
· changing unrelated homepage sections · rewriting existing avatar upload architecture (reuse it).

## Required validation for the Sonnet task (run or document why impossible)

`npm run lint` · `npm run build` · `tsc --noEmit` (or `npm run typecheck`) · `npm run check:i18n` · relevant
unit/integration tests if present · manual QA for guest / private / agent / admin-moderator · manual QA for closing
drawer/modal + back navigation · manual QA in sq/en/uk/it · manual responsive QA at 320/375/390/768/1280/1440/2560.
Sonnet must also provide: Files Changed table · root-cause summary · before/after behavior · validation results ·
screenshots/notes for critical flows if supported.

## Required documentation updates (this Opus task)

`docs/backlog.md` — concise entry + link to the task/session file. New session log:
`docs/sessions/2026-06-01-task-356-agent-account-upgrade-flow-opus-planning.md` (or canonical name). Do not update
runtime docs unless the rule index requires it.

## Final report required from Opus

1. Root-cause summary. 2. Files/routes/components inspected. 3. Current account-type data-model summary. 4. Current
company/agency data-model summary. 5. Current modal/drawer close-behavior summary. 6. Final chosen behavior for
guest / authenticated private / authenticated agent / admin-moderator. 7. One Sonnet task vs split-into-two, with
justification. 8. The complete copy-paste-ready Sonnet task. 9. Documentation files changed. 10. Confirmation Opus
did not edit product code. 11. Ready-to-run git commands for the owner if files were changed (orchestrator-emitted).
