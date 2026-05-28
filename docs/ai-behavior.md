> **P0 source of truth: `docs/agent-contract.md`.** Every Sonnet task must read it first. This file
> (`docs/ai-behavior.md`) is the long-form expansion of the contract — read the sections relevant to
> your task, not the whole file every time.
>
> **Pre-read selection: `docs/rule-index.md`.** Every kickoff lists only the docs that match the task
> type. "Read all docs" is forbidden — it is the failure mode Task 253 was filed for.
>
> **Behavior-preservation core:** Notes 14, 18, 19, 20, 21, 22, 23 in this file. These are the rules
> the orchestrator verifies against the diff on return.

### Execution Protocol (to avoid compliance paralysis)
- Do not re-read all /docs on every task. Read only the docs relevant to the current task — see `docs/rule-index.md` for the task-type bundle.
- Always obey `docs/agent-contract.md`.
- For env, RLS, component, UI, data-access, analytics, performance, or other domain rules, read and obey the relevant docs selected by `docs/rule-index.md` for the current task type.
- For UI work obey: ui-rules.md. For DB work: data-access-rules.md. For analytics/SEO: analytics-rules.md.
- Do not ask “what should I build?” if a task is specified (backlog or user request). Proceed.
- If blocked by rules, apply the smallest safe fix to unblock, then refactor into the correct component structure.
- If docs were already read in this session, do not re-read them again; proceed with execution.

### Pre-Task Mandatory Checklist
Before writing any code, the agent MUST confirm:
1. **No duplicate components** — searched `src/components/` for existing similar components; result documented.
2. **No hardcode planned** — every string in the implementation plan has a corresponding i18n key path.
3. **Scope is isolated** — files to be modified are listed; no unrelated files will be touched.

Skipping this checklist is a rule violation.

### Global Change Verification Rule (Note 14 — REMEMBER PERMANENTLY, enforced 2026-05-22)

> ALL CHANGES MUST BE VERIFIED GLOBALLY ACROSS THE ENTIRE PROJECT. NO HARDCODE. NO UNEXPLAINED
> COMPONENTS. Everything must be justified and deliberate. When you introduce a change you MUST check
> which files that change touches and update every one of them in line with the new code.

Concretely, before finishing ANY change:
1. **Find every place the change touches.** When you change a behaviour, component, type, schema,
   helper, or pattern, grep the whole repo for every consumer/sibling and update them all — do not
   fix one call site (one favorite button, one price/m² line, one phone field) and leave the others
   diverging. A "local" fix that leaves siblings inconsistent is a task failure (this is the recurring
   complaint behind Notes 8, 9, 14, 17).
2. **No hardcode.** No hardcoded user-visible strings (use i18n × sq/en/uk/it), no hardcoded
   colors/spacing (use tokens), no hardcoded base URLs (use `NEXT_PUBLIC_SITE_URL` — see docs/env.md
   "Canonical site URL rule"), no magic numbers where a constant already exists.
3. **No unexplained / one-off components.** Reuse the canonical primitive (see docs/ui-rules.md §0).
   If a new component is truly required, justify it in the session log and add it to the catalog —
   never a silent local clone of something that already exists.
4. **Same problem ⇒ one solution.** If several places implement the same pattern (e.g. country-code
   `Combobox` + `Input`), there must be ONE shared implementation, not three.

This rule is the executor's standing contract; the orchestrator verifies it against the diff on every
returned task.

### Before modifying any shared component or module:
- Verify the component is directly required for the current task.
- Audit all dependent usages BEFORE making changes.
- Do not modify unrelated consumers unless the task explicitly requires it.
- Shared component changes that cause unrelated regressions are considered task failure.

### After Every Change
- After making code changes, run the relevant local verification step (`npm run dev` for interactive verification, `npm run build` before commit/push, and any targeted checks needed for the changed scope).
- **Mandatory TypeScript gate**: After ANY file write or edit, run `npx tsc --noEmit` in the shell and confirm 0 errors before reporting the task complete. **Do NOT rely on the Write/Edit tool's success confirmation** — the tool can write corrupted files (null bytes, truncated content) that pass the file API but fail tsc. The shell `npx tsc --noEmit` output is the only authoritative check.
- **After every feature, fix, or significant change — update the relevant project documentation**:
- Update the appropriate file in `/docs/` if rules, architecture, workflow, or standards changed.
- Update `docs/backlog.md` for progress, session summary, and next tasks when applicable.
- Update `Claude.md` only if the project index, global context, or documentation map changed.

### Pre-Completion Self-Validation (Note 18 — REMEMBER PERMANENTLY, enforced 2026-05-25)

> The executor must not declare a task "complete" before running the same checks the orchestrator
> will run on review. Every follow-up the orchestrator has had to file because the original task was
> claimed done while still broken (Task 221 → 221a is the canonical example, see Note 31 in
> `issues.txt` 2026-05-25) burned the owner's review budget. The new contract is: **Sonnet self-verifies
> against the acceptance criteria, line by line, BEFORE writing the session log "complete" claim.**

Before reporting any task complete, Sonnet 4.6 MUST run, in order, and paste the output in the session log:

1. **Build + typecheck gate (already required, restated here for completeness):**
   - `npx tsc --noEmit` → 0 errors (the authoritative check; the Write/Edit tool's "success" reply is
     not enough — null-byte / truncation corruption can pass the file API but fail tsc).
   - `npm run build` if the change is non-trivial (server actions, routes, schema, shared primitives).

2. **Acceptance-criteria self-audit (mandatory for every task — paste the table into the session log):**

   | AC bullet (exact text from the task) | Where it's verified | Result |
   |---|---|---|
   | <copy-paste each AC bullet from the kickoff> | <file:line OR runtime step> | ✅ / ❌ |

   - Every AC bullet from the kickoff must have one row. Reproducing the bug → fix verified.
   - "Result" is ✅ only if the bullet was actually demonstrated, not just "I edited the file".
   - If any bullet is ❌ or "I think so", the task is INCOMPLETE — do NOT write the "complete" line in
     `docs/backlog.md`; instead report the gap to the orchestrator.

3. **Diff self-review (the same lens the orchestrator uses on review):**
   - Read your own `git diff` and check each clause of the orchestrator hard contract
     (`docs/orchestrator-role.md` → "Hard contract embedded in EVERY Sonnet prompt").
   - Specifically look for: scope creep (files touched outside the kickoff list), missing locales
     (`sq`/`en`/`uk`/`it` all four — same key set), missing breakpoints (320/375/390/768/1280/1440/2560
     where UI is touched), governance violations (raw `<button>`, `div.fixed.inset-0`, non-canonical
     primitives, hardcoded strings/tokens, `window.location.href`, etc.), and — new in 2026-05-25 —
     **silent control removal** (see Note 20 below) and **broken UX flow** (see Note 19 below).

4. **UI runtime self-check (for any UI task — additive to the §17 UI pre-flight):**
   - Open the affected page in the running app, switch the locale to `uk` (longest strings), resize to
     320px, and walk through the user flow end-to-end — entry point, all controls, all states (empty /
     loading / error / success).
   - For the homepage and `/listings` filter work, manually open the Розширені фільтри drawer and toggle
     each property type and market — verify nothing disappears that should not (Note 19).
   - For any admin table or admin edit screen, verify every row-level action and every sidebar control
     that existed before the change still exists and is reachable (Note 20).

5. **Self-validation verdict line in the session log:**
   ```
   Self-validation: tsc=0 errors · build=passes · AC table=all green · runtime locale=uk PASS · scope=clean
   ```
   This single line is the executor's signed claim. If it is missing OR any field is not "PASS/green",
   the task is INCOMPLETE and the orchestrator will route it back.

**Why this rule exists:** the orchestrator's review-side checklist
(`orchestrator-role.md` → "Review checklist") and the executor's hard contract are the SAME contract.
If Sonnet runs the same checks first, follow-up tasks for the same issue drop to near-zero, and the
owner's token budget on review collapses. Skipping this self-validation is a rule violation — the task
is rejected on review regardless of whether the underlying fix happens to be correct.

### UX Flow Preservation (Note 19, enforced 2026-05-25)

> When modifying existing functionality OR adding new functionality, **the existing UX flow must keep
> working end-to-end and stay reachable**. A change that fixes one symptom but breaks the entry point,
> a sibling control, or a downstream step in the same flow is a task failure even if the AC bullet is
> ticked. This is a generalisation of Note 14 (Global Change Verification Rule) applied to UX rather
> than just code.

Concrete requirements:

1. **Map the flow before you touch it.** For every task that changes a page, form, modal, drawer, or
   admin screen, list in the session log: the entry point(s), every control on the screen, the
   downstream steps the user reaches from this screen. This is your before-and-after diff at the UX
   level.
2. **Preserve every entry point.** If a feature was reachable from a button, link, row action, sidebar
   item, or a deep link before, it must remain reachable after — unless the kickoff explicitly says to
   remove it. "I moved it inside a modal" only counts if the modal is still discoverable from the same
   entry point.
3. **Preserve every state of the flow.** Empty / loading / error / success / cancel / dismiss must all
   still work after the change. The orchestrator routinely catches Sonnet shipping "Cancel does nothing"
   regressions (issue 99, 2026-05-25); these MUST be reproduced and verified in step 4 of Note 18.
4. **Cross-page propagation.** Renames/edits that affect identity (user name, listing title, currency,
   locale) must propagate to every place where that identity is displayed — header chip, sidebar,
   breadcrumb, cards, lists, sticky CTAs — without a manual page reload. If reactivity is broken on
   even one surface, the task is incomplete (issue 30, 2026-05-25).
5. **Document the UX before/after in the session log.** A short "UX flow trace" section: entry → step
   1 → step 2 → … → outcome, with the screenshot or runtime note that it still works. This is the same
   evidence the orchestrator looks for; producing it up front prevents back-and-forth.

### Existing-Control Preservation (Note 20, enforced 2026-05-25)

> Removing an existing control (button, row action, sidebar entry, dropdown item, status switcher,
> filter chip, etc.) is a TASK FAILURE unless the kickoff explicitly authorised the removal AND
> documented a replacement entry point. Silently dropping admin controls — as happened to the admin
> tables row actions sometime in May 2026, leaving half the listing-status options unreachable (issue
> 1, 2026-05-25) — is the exact failure mode this rule exists to prevent.

Concrete requirements:

1. **Inventory before you edit.** For any change to an admin table, an admin edit screen, a listing
   form, a profile screen, the filter drawer/bar, or any toolbar — list every interactive control
   that exists today in the session log. This is the before-state.
2. **Re-verify after you edit.** After the diff is written, list the after-state. Every control in the
   before-state must appear in the after-state, OR appear in an explicitly-documented new location
   (with the entry point in the same diff). Anything dropped that wasn't authorised by the kickoff is
   a task failure.
3. **Status / lifecycle controls are critical.** Changing listing status, approving/rejecting reports,
   moderating users, deactivating accounts, clearing history — these MUST remain accessible after any
   table or detail-screen change. Hiding them inside a collapsed section that the user has to discover
   does NOT count as preserving them.
4. **Treat "I cleaned up the row" as scope creep.** The §15-§17 canonical-control rules in
   `ui-rules.md` are about HOW to render controls, not whether to render them. If a control is "ugly"
   or "out of style", that is a separate refactor task — fix the styling in place, do not remove the
   control.
5. **Orchestrator review parity.** The orchestrator runs the same before/after inventory on review
   (`orchestrator-role.md` → "Review checklist" → "Existing controls preserved"). A diff that fails
   this check is routed back as a P0 regression task.

### Control Relocation Rule (Note 21 — REMEMBER PERMANENTLY, enforced 2026-05-27)

> A task may change **WHERE** an interactive control appears, but it must not remove the underlying
> capability. If the old location becomes a read-only label, the new editable location **must be
> implemented in the same task**. A read-only label is not a replacement for an editable control.
> The task is incomplete if the user can no longer perform the action after the change.
> This is the rule Task 253 introduced after the "moved editable status becomes a read-only label"
> failure mode burned an admin capability silently.

Mandatory for any task that moves:
- user status changes (active / suspended / blocked / deactivated);
- listing status changes (draft / pending / approved / rejected / archived / sold);
- moderation actions (approve / reject / hide / restore);
- role / permission changes;
- delete / archive / block / suspend / restore actions;
- admin table row actions;
- profile edit actions (avatar, name, phone, email, locale, currency, password);
- modal / dialog actions (any control whose UX is moving in or out of a modal).

Concrete requirements:

1. **Inventory the editable control before you edit.** Where is it today? Which props/handlers does it carry? What server action does it call? Capture this in the session log.
2. **Implement the new editable location in the same diff.** The new component must include: editable input/select/switch/control, validation, save behaviour, loading state, success state, error state, persisted value after refresh, localization if text changed, mobile usability.
3. **Verify the user can still perform the action after the change.** Open the running app at `uk` 320px, walk the new flow end-to-end, and paste the runtime evidence into the session log.
4. **The "read-only" lookalike is not a substitute.** If the old location shows the value as text, the new location must accept input — the kickoff is incomplete otherwise.

### Admin Table Preservation Rule (Note 22 — REMEMBER PERMANENTLY, enforced 2026-05-27)

> Admin tables are the failure-mode epicenter — every time an admin table loses a row action, a
> filter, or a column without the kickoff authorising it, an admin capability disappears silently.
> Before changing any admin table, inventory the entire surface; after the change, verify every
> existing admin action is still reachable.

Mandatory for any task that touches a file under `src/components/admin/**/AdminTable*` or any admin
table view (listings, users, reports, locations, currencies, email templates, companies, inquiries, …).

Before the change, inventory in the session log:
- columns (and column order);
- row click behaviour (does it open a detail page? a modal?);
- row actions (every button / icon / dropdown item per row);
- inline controls (status switchers, role selectors, currency selectors, …);
- filters (every filter chip / select / search box on the toolbar);
- search;
- pagination (page size, page controls);
- sort (sortable columns + default sort);
- empty state (text, illustration, CTA);
- loading state (skeleton / spinner / shimmer);
- mobile layout (`md:` breakpoint and below).

After the change, every existing admin action must remain reachable unless the kickoff explicitly
authorised removing it. "I cleaned up the row" is scope creep and a task failure — see Note 20.

### Edit-Flow Preservation Rule (Note 23 — REMEMBER PERMANENTLY, enforced 2026-05-27)

> Every field/action that was editable in a profile or edit flow before the change must remain
> editable after the change unless the kickoff explicitly removes it. Moving editing from one
> component to another is allowed; silently downgrading it to a read-only display is not.

Mandatory for any task that touches a profile screen, agent registration flow, listing form,
admin user-profile edit, admin listing-edit, password change, email change, locale/currency change,
or any other "edit" surface.

If editing moves from component A to component B, component B must include:
- editable input / select / switch / control;
- validation (Zod schema or equivalent, with localized messages);
- save behaviour (server action wired up, with optimistic state or post-save refetch);
- loading state during save;
- success state (toast or inline confirmation, all four locales);
- error state (toast or inline error, all four locales);
- persisted value visible after `router.refresh()` or page reload;
- localization for any new/changed text (sq/en/uk/it, runtime-verified);
- mobile usability at 320px in `uk`.

If component A becomes a read-only display, the kickoff must say so explicitly, and component B
must be referenced from A's entry point so the user can still reach editing without hunting.

### Deploy Command
- When the user says "deploy", the executor only **prepares** the branch for deployment (final code/doc changes saved) and **provides ready-to-run git commands as plain text** — to commit the relevant changes, push the branch to GitHub, and merge to `main` through the project's approved workflow. The **owner runs these git commands manually in PowerShell**; the executor NEVER runs git itself (single-writer rule).

### Commit Rules
- One logical change per commit.
- Commit message format: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Always include related file changes in the same commit.
- Never commit broken code — run `npm run build` before pushing.
- **After every completed task, list every file you touched in the session log's "Files Changed" table** — one row per path + a 1-line rationale per file. Never emit `git add` / `git commit` commands yourself — the **orchestrator (Opus)** emits them during review (Task 264 rule, 2026-05-27). Never run git commands yourself (single-writer rule). Format of the "Files Changed" table:
  ```
  | File | Rationale |
  |------|-----------|
  | path/to/file1 | <1-line why this file changed> |
  | path/to/file2 | <1-line why this file changed> |
  ```

### Localization (i18n) Rules
- **Scope:** site UI is 4-locale (sq/en/uk/it). Outbound email is `sq`-only — see `docs/integrations.md` → "Outbound email language policy (Albanian-only, 2026-05-25)".
- ALWAYS check `messages/sq.json`, `messages/en.json`, `messages/uk.json`, `messages/it.json`.
- Every new text string must be added to ALL four language files simultaneously.
- Never hardcode text strings in components — always use `useTranslations()`.
- Keys must be added under correct namespace (nav, listing, auth, common).
- Default language is Albanian (sq) — always write Albanian text first.
- **i18n verification is NOT complete until runtime locale switching is confirmed** — matching key counts across files is a necessary but not sufficient check. Every string must visibly change when locale is switched. If a string does not change on locale switch, it is hardcoded and the task is failed.
- **Currency codes are domain identifiers, never i18n keys.** `ALL`, `EUR`, `USD`, `GBP` must appear as literal strings in UI (e.g. `{currency}`, `'ALL'`). Never call `t(currencyCode)` or `t(currencyCode.toLowerCase())` — `t('all')` resolves to `common.all` ("Të gjitha"), not the currency code. Use `t('currency_ALL')` only to translate the full display name ("Albanian Lek (ALL)"), never to render the code alone.
- **Language names use canonical i18n keys.** Always use `t('lang_sq')`, `t('lang_en')`, `t('lang_uk')`, `t('lang_it')` from the `nav` namespace. Never hardcode "Albanian", "Ukrainian", etc. in components.
- **API/server-action errors must return stable English error codes** (e.g. `'no_file'`, `'invalid_type'`), not raw locale strings. Clients resolve to localized messages via `t()`. See `/api/upload-avatar` as the reference implementation (Task 103).

### Git Rules
- Do not commit directly to `main` unless the current project workflow explicitly allows it; prefer feature branches and merge through the approved deployment flow.
- Commit often with small logical changes.
- Never commit: `.env` files, `node_modules`, `.next` folder.
- Tag releases: `v0.1.0`, `v0.2.0` etc.

#### Single-writer git (Cowork + Windows network drive) — enforced 2026-05-22
- The repo sits on a Windows network drive (`D:`). The Cowork/Opus assistant mounts the **same**
  folder from a Linux sandbox. **Two git processes on the same `.git` corrupt `.git/index`**
  (observed: `UU ./` / `X0` unmerged garbage, phantom 50+ line `messages/*.json` deletions).
- **Only the owner runs git, and only from PowerShell.** The Cowork/Opus assistant must **never**
  run mutating git (`add`/`commit`/`push`/`reset`/`restore`/`stash`/`checkout`/`merge`/…).
- The Cowork/Opus assistant edits files **only via the filesystem** (Read/Write/Edit) — that never
  touches `.git/index`, so it cannot race the owner's git. Read-only `git show`/`git diff`/`git log`
  is allowed for review, preferring `git show <sha>:<path>` over index-touching commands.
- Index recovery (owner, PowerShell, no other git running): `Remove-Item .git\index` → `git reset`
  → `git status`. Rebuilds the index from HEAD without touching working files.
- Full rationale lives in `docs/orchestrator-role.md` → "Environment & git safety".

### Scope Isolation Rules
- Modify only files directly required for the task.
- Do not perform unrelated refactors.
- Do not “clean up” architecture outside the task scope.
- Do not replace shared UI primitives globally unless explicitly required.
- Unrequested improvements are forbidden.
- If a bug can be fixed locally within the affected domain, do not expand changes to unrelated modules.
- Changes outside scope are considered task failure even if the original bug is fixed.

### SSR / Hydration Rules
Forbidden:
- suppressHydrationWarning
- typeof window rendering branches
- client-only wrappers used only to hide hydration mismatches
- dynamic(..., { ssr: false }) inside Server Components
- browser-only formatting during render

Hydration mismatches must be fixed at the deterministic rendering/data layer, not masked.

### Shared Component Rules
- Shared UI components are considered high-risk architecture.
- Do not modify shared components without verifying all dependent flows.
- Shared component changes require regression verification for:
  - homepage
  - filters
  - forms
  - modals
  - admin flows
  - mobile layouts

If regression risk is high, create a dedicated architecture task instead of modifying the component during unrelated work.

### Selection Components Policy
Combobox is the canonical selection component for:
- locations
- property types
- filters
- searchable selects
- domain forms

Select components are deprecated for domain flows.

Forbidden:
- replacing Combobox with Select
- introducing new Select-based domain inputs
- maintaining parallel Select/Combobox implementations

### Domain Integrity Rules
- Frontend types, validation schemas, DB enums, API payloads, and queries must use the same canonical domain model.
- Never patch enum/schema mismatches locally.
- Never introduce temporary mappings or fallback values.
- Domain inconsistencies must be fixed at the shared domain layer.

Fixing the visible symptom while introducing architectural regressions is considered task failure.

### Dependency Mutation Rules
- Do not modify shared hooks, providers, utilities, config layers, or global state unless the task explicitly requires it.
- Do not introduce cross-module side effects.
- If fixing a bug requires modifying infrastructure/shared layers, explicitly document why local isolation is impossible.
- Any change affecting routing, auth, providers, caching, localization, or shared state requires regression verification.

### Architecture Stability Rules
- Do not rewrite architectural patterns during bugfix tasks.
- Do not replace existing patterns with alternative abstractions unless explicitly requested.
- Bugfixes must preserve the existing architectural contract.
- Large structural rewrites require a dedicated task.

### No Fake Fixes Policy
Forbidden:
- masking bugs through fallback UI
- hiding errors without fixing root cause
- retry loops used to conceal race conditions
- artificial delays/timeouts
- force refreshes to restore broken state
- silent catch blocks

All fixes must resolve the root architectural issue.

### Regression Responsibility
- If a change breaks an existing feature outside the task scope, the task is considered failed.
- The agent is responsible for verifying affected dependent flows after modifying shared logic.
- “The original bug is fixed” is not sufficient if regressions were introduced.

### Verification Rules
- Before modifying a shared component, identify all known consumers.
- After modification, verify all affected consumers manually or through targeted checks.
- Never assume shared changes are isolated.

### State Management Rules
- Do not introduce duplicate client state for the same domain entity.
- Avoid parallel sources of truth.
- Cache invalidation and optimistic updates must follow existing architecture patterns.
- Never patch stale-state issues with forced remounts or key-based resets unless explicitly required.

### Async / Effects Rules
- Avoid side-effects during render.
- Effects must be idempotent and safely repeatable.
- Do not introduce race conditions through parallel async state updates.
- Cleanup logic must correctly dispose subscriptions, listeners, and async flows.

### Navigation Safety Rules
- Navigation state must remain recoverable through browser Back/Forward actions.
- Do not manipulate browser history manually unless explicitly required.
- Route transitions must not leave stale overlays, modals, or loading states.
- Navigation fixes must preserve SSR/client routing consistency.

### Data Fetching Rules
- Do not introduce duplicate network requests for the same render lifecycle.
- Revalidation must follow existing caching strategy.
- Avoid hidden polling or implicit background refresh logic.
- Data freshness issues must be solved through proper invalidation/re-fetch architecture.

### Auth Lifecycle Rules
- Do not patch auth inconsistencies through forced reloads or global cookie clearing.
- Auth/session recovery must use centralized lifecycle handling.
- Invalid auth sessions must be cleaned deterministically through the shared auth layer.

### Framework Warning Rules
- Do not "fix" framework dev-mode warnings unless they are reproducible in production builds.
- Turbopack dev-only preload warnings must be verified in production before any code changes.
- Never introduce architectural hacks to silence framework/runtime warnings.

### Filter Architecture Anti-Patterns (enforced after Task 50.2)
- DO NOT duplicate toggle rendering — use `FilterToggleGroup` / `FilterMultiToggle` / `FilterRoomsRow`.
- DO NOT duplicate filter normalization — `filterEngine.ts` is the canonical layer (`parseSearchParams`, `countActiveFilters`, `getFilterVisibility`).
- DO NOT put URL logic inside reusable filter primitives — primitives must be stateless and URL-agnostic.
- DO NOT put homepage draft-state logic inside reusable filter primitives.
- DO NOT create a mega-filter component merging FiltersPanel and ListingsFilters — they have irreconcilably different state models (local batch vs URL immediate).
- DO NOT duplicate coercion logic for filter values — use `filterEngine.ts` utilities.

### Filter Architecture Anti-Patterns (enforced after Task 50.4 / Task 53)
- DO NOT use `window.location.href` for navigation within the app — always use `router.push` from `next/navigation`.
- DO NOT put URL orchestration inside UI primitives or adapter hooks — URL updates must happen at the adapter layer only.
- DO NOT leave stale filter values from hidden sections in local state — when property type changes, clear all fields for sections that are no longer visible (`handlePropertyTypeChange` must delete from `{ ...prev, property_type: pt }`, not from an empty object).
- DO NOT count currency as an active filter in badge counts — exclude `currency` key from `activeFiltersCount` calculations.
- DO NOT export unused utilities from canonical engine files — `filterEngine.ts` exports must all have active consumers.
- DO NOT mix batch/immediate UX architecture — Homepage uses local draft state + Apply; Listings uses URL-immediate per-change updates; these models must remain isolated.
- DO NOT introduce hydration workaround hacks — fix root causes via deterministic rendering/data layer.
- DO NOT duplicate filter lifecycle logic between adapters — shared behavior belongs in `filterEngine.ts` (`getFilterVisibility`, `countActiveFilters`, `parseSearchParams`).

### UI Primitive Anti-Patterns (enforced after Task 50)
- DO NOT create local button clones — use `Button` from `@/components/ui/button` with canonical `size` variants (xs, sm, default, lg, xl, icon, icon-sm, icon-xl).
- DO NOT use `h-11` as a className hack — use `size="xl"` (canonical 44px touch-target button).
- DO NOT set touch targets below 44px on interactive elements — minimum `min-h-[44px]` for mobile.
- DO NOT duplicate the `normalizeSearch` function — import from `@/lib/utils`.
- DO NOT hardcode Ukrainian or other locale strings as default prop values.
- DO NOT create a new language-switcher component — use `LocaleSwitcher` from `@/components/shared/LocaleSwitcher`.

### UI Governance Anti-Patterns (enforced after Responsive/UI Governance Epic Phase 1–2)

#### Spacing
- DO NOT use arbitrary section padding values (py-7, py-10, py-13, py-15) — use the canonical scale: `py-8 md:py-12`, `py-12 md:py-16`, or `py-16 md:py-24`.
- DO NOT introduce random card padding — use `p-3` for compact cards and `p-5` for standard admin/content cards.

#### Typography
- DO NOT deviate from the canonical type scale — see docs/ui-rules.md §2.
- DO NOT add a `text-2xl` or larger on mobile-reachable text without a responsive step (must start at `text-xl` or smaller on base).
- DO NOT use `text-[10px]` for anything other than badges and micro-labels.

#### Buttons
- DO NOT use raw `<button>` for interactive UI — always use `Button`.
- DO NOT use `size="sm"` or smaller on mobile-reachable elements.
- DO NOT use arbitrary padding overrides on `Button` via className.

#### Inputs
- DO NOT create local input wrappers with custom height — use canonical `Input`.
- DO NOT override `Input` height via direct className.

#### Icons
- DO NOT use icon sizes outside the canonical map (h-3, h-3.5, h-4, h-5, h-6, h-12).
- DO NOT import from a different icon library — lucide-react only.
- DO NOT set h-* on icons inside Button — CVA handles it automatically.
- DO NOT forget `shrink-0` on icons in flex containers.

#### Layout & Containers
- DO NOT leave any public page without a max-width container constraint.
- DO NOT use `container mx-auto px-4` alone on new pages — use `.container-wide` for public pages.
- DO NOT let listing grids stop at `xl:grid-cols-3` — always add `2xl:grid-cols-4`.
- DO NOT create local container wrappers with arbitrary max-widths — use canonical tokens.
- DO NOT create duplicated responsive grid logic — follow the canonical grid patterns in docs/ui-rules.md.

#### Responsive
- DO NOT use JavaScript viewport detection for responsive logic (typeof window, useWindowSize, etc.).
- DO NOT use arbitrary min-width or max-width in responsive className for breakpoints.
- DO NOT create custom overlay drawers — use shadcn `Sheet` for all mobile panels and drawers.
- DO NOT duplicate the mobile drawer pattern — one canonical implementation per use case.
- DO NOT use inline responsive hacks (overflow-hidden to mask layout bugs, emergency z-index overrides).

#### Huge Desktop
- DO NOT allow any page to stretch full-width at 2560px without a max-width constraint.
- DO NOT allow listings grids to render with only 3 columns at 1920px+ — add 2xl: step.
- DO NOT create whitespace wastelands — always bound content with `.container-wide` or `max-w-8xl`.

#### Primitive Duplication
- DO NOT create local tab implementations — use shadcn `Tabs` / `TabsList` / `TabsTrigger`.
- DO NOT create local accordion implementations — use shadcn `Accordion`.
- DO NOT duplicate the mobile drawer pattern — use `Sheet` from `@/components/ui/sheet`.
- DO NOT use custom `div.fixed.inset-0.z-50` for mobile drawers or modals — use `Sheet` or `Dialog`.
- DO NOT inline the card pattern (`bg-card rounded-2xl border shadow-sm`) more than once — extract to a component or use shadcn `Card`.
- DO NOT add confirmation popups as raw `div.fixed.inset-0` — use `Dialog` from `@/components/ui/dialog`.
- DO NOT use `container mx-auto px-4` alone on new public pages — use `.container-wide`.
- DO NOT forget `2xl:grid-cols-4` on listing card grids.
- DO NOT add dead utility classes to globals.css without active consumers.

### Component Catalog Rules (enforced from 2026-05-18)

Before creating ANY new UI component:
- DO NOT create a new component before running `npm run governance:components` and checking `docs/component-catalog.md`
- DO NOT create local primitive clones (local button, local dialog, local sheet, local tabs)
- DO NOT bypass canonical components — always use `src/components/ui/` primitives
- DO NOT add untracked components without updating catalog via `npm run catalog:components`
- DO NOT create components with hardcoded text strings — always use `useTranslations`
- DO NOT create responsive-unsafe components — mobile-first, no viewport JS
- DO NOT create locale-unsafe components — test with Ukrainian (uk) before APPROVED
- DO NOT ignore catalog debt — check `docs/component-risk-register.md` quarterly

When completing any UI task that adds/modifies components:
- DO update catalog: `npm run catalog:components`
- DO confirm no new `MANUAL_REVIEW` flags were introduced
- DO add Storybook story if type is `canonical-primitive` or `shared-ui`

### Storybook Anti-Patterns (enforced from 2026-05-18)

When writing stories:
- DO NOT use raw `<button>` in executable stories — use `Button` from `@/components/ui/button`
- DO NOT call live APIs, fetch(), or Supabase in stories — use stable fixtures only
- DO NOT import auth session or check Supabase user state in stories
- DO NOT use `Math.random()` or `new Date()` in fixture data — use fixed values
- DO NOT skip Ukrainian (uk) locale coverage for components with visible text
- DO NOT forget the `desktop2560` viewport variant for container/grid stories
- When adding a new shared component: complete Checklist I in `docs/governance-checklists.md`
- Story files location: `src/components/ui/*.stories.tsx` (primitives), `src/stories/*.stories.tsx` (system)

### Tailwind Entropy Anti-Patterns (enforced from 2026-05-18)

- DO NOT introduce arbitrary spacing without documented canonical reason — use the spacing scale in `docs/ui-rules.md §1`.
- DO NOT duplicate existing utility chains — check `docs/tailwind-canonical-fragments.md` first.
- DO NOT create local primitive styling clones (button-like, input-like, dialog-like patterns outside canonical components).
- DO NOT create ad-hoc responsive wrappers when a canonical responsive pattern already exists.
- DO NOT use `truncate` or `whitespace-nowrap` on translated UI without a responsive overflow fallback.
- DO NOT add fixed `w-[Npx]` or `min-w-[Npx]` to elements containing localized labels or action text.
- DO NOT introduce random `2xl:` behavior — only use: `2xl:grid-cols-4`, `2xl:py-20`, `2xl:text-3xl`.
- DO NOT bypass canonical fragments when one exists in `docs/tailwind-canonical-fragments.md`.
- DO NOT suppress governance:tailwind warnings without an allowlist entry in `scripts/governance/tailwind-entropy.allowlist.json`.
- Before any UI task: run `npm run governance:tailwind` and check `docs/tailwind-canonical-fragments.md`.

### AI Governance Enforcement Rules (enforced from 2026-05-18)

Before starting ANY UI task, Claude Code MUST:
1. Consult `docs/governance-enforcement.md` for current governance state
2. Consult `docs/ui-rules.md` §1–§13` for canonical primitives and rules
3. Consult `docs/tailwind-canonical-fragments.md` for existing utility patterns
4. Consult `docs/component-governance.md §1` before creating any new component
5. Complete Pre-Task Governance Gate (Checklist A in `docs/governance-checklists.md`)

After completing ANY UI task, Claude Code MUST:
1. Complete Post-Task UI Governance Gate (Checklist B in `docs/governance-checklists.md`)
2. All checklist boxes must be checked before marking the task complete
3. Governance violations discovered during the task MUST be documented even if not fixed

#### Canonical Usage Enforcement

- **Button:** ALWAYS use `Button` from `@/components/ui/button`. NEVER raw `<button>`. NEVER `h-11` className.
- **Input:** ALWAYS use `Input` from `@/components/ui/input`. NEVER local input wrappers with custom heights.
- **Sheet:** ALWAYS use shadcn `Sheet` for ALL mobile drawers, panels, filter overlays. NEVER custom `div.fixed.inset-0`.
- **Dialog:** ALWAYS use shadcn `Dialog` for ALL modals and confirmation popups. NEVER inline `div.fixed.inset-0`.
- **Tabs:** ALWAYS use shadcn `Tabs`/`TabsList`/`TabsTrigger`. NEVER local tab button clones.
- **Container:** ALWAYS use `.container-wide` on public pages. NEVER `container mx-auto px-4` alone.
- **Grid:** ALWAYS include `2xl:grid-cols-4` on listing card grids. NEVER stop at `xl:grid-cols-3`.
- **Icons:** ALWAYS use `lucide-react`. NEVER any other icon library.
- **Navigation:** ALWAYS use `router.push()` from `next/navigation`. NEVER `window.location.href`.

#### Responsive Governance Enforcement

- ALWAYS write mobile-first: base for 320px, scale up with `sm:`/`md:`/`lg:`/`xl:`/`2xl:`.
- ALWAYS add `2xl:` step for new listing grids (`2xl:grid-cols-4`) and new public containers.
- NEVER use `typeof window`, `useWindowSize`, `window.innerWidth` for responsive layout decisions.
- NEVER use arbitrary `min-width`/`max-width` inline breakpoints in className.
- Touch targets: ALWAYS `size="xl"` (44px) for mobile-reachable buttons, `min-h-[44px]` for other interactive elements.

#### Localization Governance Enforcement

- NEVER hardcode widths for elements containing translatable text.
- ALWAYS test with Ukrainian (uk) — longest strings.
- ALWAYS use `flex-wrap` on toolbars where locale text may differ in length.
- NEVER use `whitespace-nowrap` without `overflow-hidden` + `truncate`.
- ALL four locale files (sq, en, uk, it) must be updated simultaneously.

#### Huge Desktop Governance Enforcement

- NEVER allow public page to stretch full-width at 2560px — always use `.container-wide`.
- NEVER allow listing grid to stop at `xl:grid-cols-3` — always add `2xl:grid-cols-4`.
- NEVER allow admin shell content to stretch full viewport width at 2560px.

#### SSR / Hydration Governance Enforcement

- NEVER introduce `suppressHydrationWarning`.
- NEVER use `typeof window` in render-path logic for visible UI.
- NEVER use viewport JS (`window.innerWidth`, `useWindowSize`) for layout decisions.
- NEVER create `dynamic(..., { ssr: false })` inside Server Components without documented justification.
- All hydration issues MUST be fixed at the deterministic rendering/data layer.

#### Governance Report Discipline

- Governance reports go in `docs/governance-reports/weekly/`, `monthly/`, `quarterly/` ONLY.
- Session logs go in `docs/sessions/` ONLY.
- NEVER append governance audit data to `docs/backlog.md`.

---

### Backlog & Session Log Rules (enforced from 2026-05-18)

`docs/backlog.md` is a **lightweight index** — it must never grow into a log dump.

#### Structure of `docs/backlog.md`
```
# Project Backlog

## Last Session        ← short summary (5–10 lines) + link to session file
## Next Immediate Tasks ← active task queue, as detailed as needed
## Session Archive     ← table: date | description | tasks | link
```

#### When closing a session
1. Create a new session file: `docs/sessions/YYYY-MM-DD-<short-slug>.md`
   - One file per session (or per epic if a session spans multiple days).
   - Header: `# Session Archive: <Description> — YYYY-MM-DD`
   - Content: full task logs, validation checklists, audit tables — everything that was in the old backlog session block.
2. Update `docs/backlog.md`:
   - Replace the previous "Last Session" block with a 5–10 line summary of the new session + link to its file.
   - Add a row to the Session Archive table pointing to the new file.
   - Update Next Immediate Tasks (remove completed, add new).
3. Never paste full session logs directly into `docs/backlog.md`.

#### Forbidden
- DO NOT write multi-hundred-line session logs into `docs/backlog.md`.
- DO NOT accumulate session history in `docs/backlog.md` — move to `docs/sessions/`.
- DO NOT create a session file without adding it to the Session Archive table in `docs/backlog.md`.
- DO NOT leave `docs/backlog.md` larger than ~80 lines of active content (excluding the archive table).

---

### Task File Location Rules (enforced from 2026-05-19)

All task, epic, and sprint files MUST be created inside the `/tasks` directory at the project root. This applies to every AI session, regardless of chat or agent.

#### Canonical structure
```
/tasks
├── Epics/      ← epic-level planning files
└── Sprints/    ← sprint plans containing the tasks for that sprint
```

#### Placement rules
- **Epics** → `/tasks/Epics/<EpicName>.md`
- **Sprints** → `/tasks/Sprints/Sprint_<N>_—_<Title>.md`
- **Individual tasks** → live as sections inside the relevant Sprint file (no separate `Tasks/` folder).

#### Format
- New task/epic/sprint files MUST use `.md` (Markdown).
- Existing `.txt` files (e.g. `Sprint_0_—_Critical_Bugfix_-_Regression_Stabilization.txt`) MUST NOT be renamed or reformatted — leave them as they are.

#### Forbidden
- DO NOT create task/epic/sprint files anywhere outside `/tasks` (no `docs/tasks/`, no project root, no `src/`).
- DO NOT introduce new top-level subfolders inside `/tasks` beyond `Epics/` and `Sprints/`.
- DO NOT use `.txt` for new files — `.md` only.
- DO NOT rename or convert existing `.txt` task files unless the user explicitly asks.

The `/tasks` directory is tracked in git (it is NOT in `.gitignore`) so task history is versioned and shared.

---

### Canonical Task Template (refactored 2026-05-27 by Task 253)

Every task in `/tasks/Sprints/*.md` and every epic plan in `/tasks/Epics/*.md` MUST follow this
structure. Sonnet 4.6 (or any agent) is forbidden from starting a task that omits any of these
sections. The template's job is to make the failure modes Notes 18/19/20/21/22/23 exist for
**impossible to ship**.

Global task numbering MUST be preserved across sprints (Task 84, 85, 86, … 90, 91, 92, …). NEVER
restart numbering as `Task 0.1`, `Task 1.1`, etc. The current `Last task number: NNN` line in
`docs/backlog.md` is the source of truth for the next number to use.

#### Required sections for every task

```
### Task <N> — <Concrete imperative title>

Type:        <bug | feature | refactor | chore | UX>
Priority:    <critical | high | medium | low>
Area:        <component / module / domain area>

Pre-read (mandatory before any code change):
1. docs/agent-contract.md
2. docs/backlog.md
3. Task-relevant docs from docs/rule-index.md → "<task type>"
4. Inspect package.json for current validation scripts.

Localization coverage:
- sq, en, uk, it for any UI/text task — verify all four files in messages/*.json
- Runtime locale switching must be visually confirmed (matching key counts is NOT sufficient)
- N/A only if the task has zero user-facing text (e.g. a build script, an internal migration)

Responsive coverage:
- 320, 375, 390, 768, 1280, 1440, 2560 for any UI/layout task
- N/A only if the task does not touch any rendered UI

Current behavior to preserve:
Before editing, inspect the affected surface and list in the kickoff (the orchestrator fills this
section; Sonnet re-verifies it in the session log):
- affected route(s) / component(s);
- existing controls (buttons, row actions, dropdowns, switchers, filter chips, …);
- existing editable controls (which fields/actions can the user change today?);
- existing read-only labels (do not silently turn editable into read-only);
- existing server actions / API routes touched by these controls;
- existing success / error behavior (toasts, inline messages, redirects);
- existing mobile behavior (320px in uk).

Any existing control must either:
- remain;
- move to a specified new place (which the kickoff names AND requires implementing in the same task);
- or be explicitly listed as removed (with kickoff authorisation).

Silent removal is forbidden — see Note 20.

Bug / Goal:
<Concrete problem or goal. No abstract wording like "improve the table" or "polish the flow".>

Required after behavior:
As <role>, on <route/surface>:
1. <exact user action>
2. <expected UI behavior>
3. <expected mutation / server behavior>
4. <expected success state — toast text, redirect, refresh, etc.>
5. <expected error state — toast text, retry path, etc.>
6. <expected behavior after refresh / revalidation>

Required investigation:
1. <concrete step — file/path to read, query to run, screen to open>
2. <concrete step>
…

Acceptance criteria:
- <Literal behavioral AC — pasted from "Required after behavior", one bullet per step>
- <Literal behavioral AC>
- Existing working controls/flows are preserved unless explicitly removed by this kickoff.
- 0 new lint errors / 0 new warnings.
- `npx tsc --noEmit` → 0 errors. (`npm run build` passes for non-trivial changes.)
- Relevant governance checks pass (only the ones for the scope changed).
- All four locales (sq/en/uk/it) render correctly at runtime if UI/text changed.
- All seven breakpoints (320/375/390/768/1280/1440/2560) render correctly if UI/layout changed.
- `docs/backlog.md` is updated.
- A session log under `docs/sessions/` is added, with the Note 18 self-validation block.
- A **"Files Changed" table** is present in the session log (one row per touched path + 1-line
  rationale per file). The executor MUST NOT emit `git add` / `git commit` commands — the
  **orchestrator (Opus)** emits them during review (Task 264 rule, 2026-05-27). The executor
  MUST NOT run git itself (single-writer rule). A task with no "Files Changed" table is
  INCOMPLETE — see "Commit Rules" and CLAUDE.md "Commit hand-off".

Out of scope:
- <Explicit list of things the agent must NOT touch — unrelated files, parallel refactors, …>
- <Explicit forbidden architecture change>
- <Explicit forbidden scope expansion>
```

#### Conditional sub-blocks (paste only if relevant)

If the task **moves an editable control between surfaces**, paste this block under "Current
behavior to preserve":

```
Control relocation rule (Note 21):
This task may change WHERE the control appears, but it must not remove the underlying capability.
If the old location becomes read-only, the new editable location must be implemented in the same task.
A read-only label is not a replacement for an editable control.
The task is incomplete if the user can no longer perform the action after the change.
```

If the task **touches an admin table**, paste this block under "Required investigation":

```
Admin table preservation rule (Note 22):
Before editing the table, inventory in the session log:
- columns;
- row click behavior;
- row actions;
- inline controls;
- filters;
- search;
- pagination;
- sort;
- empty state;
- loading state;
- mobile layout.
After the change, every existing admin action must remain reachable unless explicitly removed.
```

If the task **touches a profile or other edit-flow**, paste this block under "Required after
behavior":

```
Edit-flow preservation rule (Note 23):
Every field/action that was editable before must remain editable unless explicitly removed.
If editing moves from one component to another, the new component must include:
- editable input/select/switch/control;
- validation;
- save behavior;
- loading state;
- success state;
- error state;
- persisted value after refresh;
- localization if text changed;
- mobile usability.
```

#### Rules

- DO NOT omit `Pre-read` — the agent must know exactly which docs to load. Use the task-type bundle from `docs/rule-index.md` — never write "read all docs".
- DO NOT skip `Current behavior to preserve`. Even chores typically affect *something*; default is to inventory the surface. The only legal `N/A` is a task that touches zero user-visible surfaces (e.g. a build-script-only change).
- DO NOT skip `Required after behavior`. AC bullets must trace back to specific steps in this section.
- DO NOT write `Localization coverage: N/A` unless the task literally has zero user-visible text.
- DO NOT write `Responsive coverage: N/A` unless the task does not touch any rendered UI.
- DO NOT restart task numbering per sprint — preserve the global counter (`docs/backlog.md`).
- DO NOT add tasks to `/tasks` files without the full template — partial entries are rejected.
- DO NOT mark a task complete without a "Files Changed" table in the session log (Task 264 rule, 2026-05-27). The executor NEVER emits `git add` / `git commit` commands and NEVER runs git itself (single-writer rule); the orchestrator (Opus) emits commit commands during review. This applies to EVERY task, including non-UI and docs-only tasks.

#### Why this matters

The previous template was abstract — it told the agent *what* to change but rarely *what to preserve*.
That is the failure mode Task 253 was filed for: a task says "move user status editing from the
admin users table to the user profile edit flow", Sonnet removes the editable status control from
the table but ships only a read-only label in the profile, and the admin loses the capability
silently. The refactored template makes this impossible because `Current behavior to preserve` +
`Required after behavior` + Note 21 + Note 23 force the editable control to appear in the diff.