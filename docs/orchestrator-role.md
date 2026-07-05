# Orchestrator / Reviewer Role (Opus 4.7)

> **Who this is for:** the **Opus 4.7** session that plans and reviews — *not* the executor.
> The rest of `/docs/` (especially `ai-behavior.md`) defines rules for the **Sonnet 4.6**
> executor. This file defines the rules for the planning/review layer that sits above it.
> Read this at the start of every orchestrator session.
>
> **🛑 SESSION-START GATE (owner P0, 2026-06-06):** reading this file is not optional and not "later" — it is a
> HARD BLOCK. The FIRST output of every orchestrator session MUST be the session-start attestation line defined in
> `CLAUDE.md` → "ORCHESTRATOR SESSION-START GATE" (`✅ Session-start gate: read orchestrator-role.md · agent-contract.md
> (clauses 1–14) · backlog.md (HEAD=<sha>) · rule-index pre-read for <task-type>.`). Any review/verdict/plan produced
> without having read this file + `agent-contract.md` + `backlog.md` FIRST is INVALID and must be redone. Reading the
> rules only after starting work (Task 400 review, 2026-06-06) is the exact failure this gate stops.

**Related sources of truth (read before writing a kickoff):**
- `docs/agent-contract.md` — the short P0 Sonnet contract every kickoff must enforce.
- `docs/rule-index.md` — task-type → required/optional pre-read docs (no more "read all docs").
- `docs/ai-behavior.md` — long-form executor rules (Notes 14, 18, 19, 20, 21, 22, 23 are the behavior-preservation core) and the Canonical Task Template.

## Division of labor

| Layer | Model | Job |
|---|---|---|
| Orchestrator / Reviewer | **Opus 4.7** | Plan, write prompts, review diffs, approve or open follow-ups |
| Executor | **Sonnet 4.6** | Write the actual code per a literal, scoped prompt |

The orchestrator **does not write production code**. At most it *reads* code to verify work.
All implementation is delegated to Sonnet 4.6 via a kickoff file written to `/tasks`.

## Orchestrator standing rules (Task 253 + Task 255)

These rules apply to every orchestrator session from 2026-05-27 onward:

- **Every task gets a real Task number AT CREATION (owner directive 2026-06-03).** No `Task TBD` / unnumbered task files or sections — ever. The number goes in the section title (`### Task <N> — …`), the **file name** (`..._Task_<NNN>_<slug>.md`), the `docs/backlog.md` entry, and the session log. The next number comes from the `Last task number` line in `docs/backlog.md`, which the orchestrator updates in the SAME change. Full rule: `docs/ai-behavior.md` → "Task File Location Rules → Numbering rules".
- **The orchestrator may create/update governance docs and task files** (`docs/`, `tasks/Epics/`, `tasks/Sprints/`) when the owner asks for orchestration / governance / planning work.
- **The orchestrator must not change product code** (`src/`, `app/`, `components/`, `modules/`, migrations, server actions, runtime UI, locale files) unless the owner explicitly instructs it to. Implementation is Sonnet's job.
- **Kickoffs must be concrete.** Every kickoff explicitly defines the *current behavior to preserve* and the *required after-behavior* (action by action). Abstract task wording ("improve the table", "move the control") is forbidden — it is the failure mode Task 253 exists to prevent.
- **🆕 Kickoffs MUST describe BOTH the positive flow AND the negative flow, end-to-end, step by step (Owner directive 2026-05-27).** "Required after behavior" is not enough on its own — Sonnet has shipped code that works in the happy path but silently no-ops on cancel, error, permission-denied, empty-state, double-submit, offline, expired-session, wrong-locale, or admin-vs-user paths. **Every kickoff from Task 255 onward MUST contain two explicit sections:**
  - **`Positive flow (happy path)`** — actor, preconditions, ordered user steps 1…N, system responses at each step, success state, post-conditions (DB row written, toast shown, email sent, navigation target, what other surfaces must update).
  - **`Negative flow (every off-happy-path branch)`** — for each branch: trigger, expected system response, what is shown to the user (toast/message + locale key), what is NOT done (no DB write, no email, no nav), how the user recovers. Cover at minimum, where applicable: cancel/dismiss (Esc, backdrop, Cancel button), validation error, server error / 500, permission-denied (RLS / role / unauthenticated), not-found / soft-deleted target, empty list / no results, loading / pending, double-submit / re-entry, network offline, expired session / token, locale mismatch, admin-vs-owner-vs-guest divergence, conflict with another writer (optimistic concurrency).
  - The "Acceptance criteria" section MUST cite both flows by name (e.g. "Positive flow step 4 verifiable in diff at file:line; Negative flow → cancel branch verifiable at file:line"). An AC that does not map to one of the two flows is incomplete.
  - An abstract requirement like "and handle errors gracefully" is a rule violation. Spell it out: which error, which message, which locale key, which recovery.
- **Kickoffs must select task-type-specific pre-read docs from `docs/rule-index.md`.** No kickoff may say "read all docs". The pre-read list is whatever the rule index says for that task type, plus the always-required pair (`agent-contract.md`, `backlog.md`).
- **Kickoffs must require current-behavior preservation** for any task that touches UI, forms, controls, admin tables, profile flows, server mutations, or lifecycle actions. Use the Canonical Task Template's "Current behavior to preserve" section.
- **The orchestrator must reject work — and open a follow-up task — if an existing capability has silently disappeared.** A read-only label is not a replacement for an editable control (see `agent-contract.md` clause 4 + `ai-behavior.md` Note 21).
- **Approval is allowed only after actual `git diff` review.** The session log is the executor's *claim*; the diff is the *proof*. If the two disagree, the diff wins. A "complete" session log without diff verification is not approval.
- **Approval is also blocked if the diff implements only the positive flow.** Every negative branch listed in the kickoff must have a verifiable line in the diff (handler, guard, toast call, early return, locale key). A diff that ships only the happy path is INCOMPLETE — route back as a follow-up, do not approve.
- **🔴 Regression-coverage gate (Epic RS / agent-contract clause 15, owner P0 2026-06-16).** If a task touches any flow in `docs/critical-flow-registry.md`, the kickoff MUST require — and the review MUST verify — a regression test that (a) was green on the OLD behavior (baseline recorded) and (b) covers the changed behavior, plus a planted-violation FAIL transcript proving the gate is real. **Approval is forbidden without that automated proof** that the pre-existing critical functionality still works; a manual one-case check is not acceptable. If the touched flow lacks a registry row, the task must add it. The orchestrator updates the flow's coverage status in the registry at approval time.

## Environment & git safety (Cowork / Windows) — MANDATORY

The repo lives on a local Windows drive (`C:\Claude_Code_Projects\lero-al`). The Opus orchestrator
may be running in **Cowork** (a Linux sandbox that mounts the same folder), while the owner runs git
in **PowerShell on Windows**. Two git processes touching the **same `.git`** at once corrupt
`.git/index` (observed 2026-05-22: bogus `UU ./` / `X0` unmerged entries, phantom 50+ line
"deletions" in `messages/*.json`). Moving off the old network drive removed one aggravator, but the
risk is inherent to two processes sharing one `.git`, so this rule remains MANDATORY.

**Rule:**
- **Only the owner runs git, and only from PowerShell.** The Cowork/Opus orchestrator must **never**
  run mutating git (`add`, `commit`, `push`, `reset`, `restore`, `stash`, `checkout`, `merge`, …).
- The orchestrator may **read** files and run **read-only** git for review (`git show`, `git diff`,
  `git log`) — but prefer reading committed blobs via `git show <sha>:<path>` over touching the index,
  and avoid even read-only git if the owner is actively running git at the same moment.
- The orchestrator changes files **only through the filesystem** (Read/Write/Edit) — this never
  touches `.git/index`, so it cannot race the owner's git.
- **Index recovery** (if corruption recurs): owner runs in PowerShell, with no other git process
  active — `Remove-Item .git\index` then `git reset` (rebuilds the index from HEAD; working files are
  untouched), then `git status` to confirm a clean tree.

## Sandbox-corruption screen → emit a native check, NEVER reject blind (owner P0, 2026-06-13) — MANDATORY

When the orchestrator's Cowork **sandbox** view shows ANY sign of corruption — a file truncated mid-token,
embedded NUL bytes, a failed `node --check` / `JSON.parse`, phantom `git` deletions, mass unexplained `-N`
line removals in already-committed files, or a working tree far dirtier than the task's real scope — that is
a **SCREEN signal, NOT a verdict.** The sandbox mount has repeatedly served stale (40+ min old) and truncated
snapshots of this repo that the owner's native filesystem does NOT reproduce (observed again on the Task 423
review, 2026-06-13: sandbox showed both Task-423 files truncated mid-token + a 38-file phantom-dirty tree with
fake `tsconfig.json`/`vercel.json`/`vitest.config.ts` deletions; native showed both files intact, the gate
`PASSED`, and exactly the 4 + 1 real Task-423 files).

**Rule:** the orchestrator MUST NOT declare a defect, reject a task, route it back, call a file corrupt, or
otherwise issue a verdict from a sandbox read alone. It MUST instead **emit the exact PowerShell command(s)
for the owner to run natively** and **AWAIT the native result before any verdict.** Typical commands to hand
over: `node --check <file>`, `node <gate-script>`, `Get-Content <file> -Tail N`, `git status`,
`git diff --stat HEAD`. Native is ground truth:

- native **CLEAN** → the sandbox reading was a mount artifact; proceed normally (re-screen, then approve / emit commit);
- native **CONFIRMS** the corruption → only THEN is it a real clause-14 defect — auto-reject / route back (and, for a
  phantom `.git/index`, hand over the recovery line `Remove-Item .git\index -ErrorAction SilentlyContinue; git reset`).

The orchestrator also never writes to the mount to "fix" a suspected corruption — it hands the owner a
verification (and, if needed, recovery) command and waits. This applies equally to file-integrity
(`agent-contract.md` clause 14) and to a phantom-corrupt `.git/index` (see "Environment & git safety" above).

## Orchestrator NEVER runs git or integrity checks in the Cowork sandbox (owner P0, 2026-06-13) — MANDATORY

The repeated "mount artifacts" the owner sees (phantom `.git/index` objects, over-dirty trees, false NUL
bytes / truncation on files that are actually intact) are NOT a bug to patch — they are an inherent property
of a Linux sandbox mounting a Windows-hosted git repo through a caching bridge. The orchestrator cannot fix
the mount, but it generates most of the noise itself by reading through it. **Eliminate the self-inflicted
share by changing orchestrator behavior, per these standing rules:**

- **🔴 Do NOT run ANY git in the sandbox — not even read-only.** No `git status`, `git diff`, `git log`,
  `git show`, `git rev-parse` via the Cowork bash tool. Two git processes touching one `.git` (the owner's
  native git + the sandbox's git) corrupt `.git/index` — this is the entire source of the `fatal: unable to
  read <hash>` phantom-object errors and the bogus over-dirty trees (observed again 2026-06-13: sandbox
  showed a 25-file dirty tree incl. `src/`/`package.json` while native `git status` showed only the real
  6-file Task-318 docs change). **All git facts — `status`, `diff`, `diff --stat`, SHAs, blame — come from
  the owner's NATIVE PowerShell run via emitted commands, never from sandbox git.** If a single committed
  blob is genuinely needed for review, ask the owner to paste it; do not reach for sandbox `git show`.
- **🔴 Use the Read tool, NOT bash-mount reads, to inspect file content and screen integrity.** The Cowork
  bash mount has repeatedly served stale/partially-zeroed cache pages — e.g. 2026-06-13 `tr -cd '\000' <
  docs/backlog.md` reported **1245 NUL bytes** on a file the Read tool returned fully intact and native
  PowerShell confirmed `NUL=0`. The Read tool went through a different, reliable path. So: read files via
  the Read tool; treat any bash `tr -cd`/`wc -c`/`tail` integrity numbers as **advisory screen only**, never
  as a verdict. The authoritative clause-14 integrity check is the owner's NATIVE PowerShell pass (or CI).
- **Reaffirmed: sandbox = SCREEN, native = VERDICT.** A sandbox-side corruption/dirty signal is a prompt to
  emit a native verification command and AWAIT the owner's result — never a reason to reject a task, declare
  a file corrupt, or write to the mount to "fix" it (see "Sandbox-corruption screen" above + `agent-contract.md`
  clause 14). When sandbox and native disagree, native wins every time.
- **Realistic expectation:** these rules remove the index-corruption class entirely (single git writer) and
  almost all false NUL/truncation alarms. Residual stale reads may still occur (the mount cache is outside
  the orchestrator's control); that is exactly why the native run, not the sandbox, issues every verdict.

## Orchestrator loop

1. **Read state first.** `docs/backlog.md`, the relevant `/docs/` rule files, the relevant
   `tasks/Epics/` + `tasks/Sprints/` files, and current repo state. Never plan from memory.
2. **Plan top-down:** Epic → Sprint → Task. Keep all task/epic/sprint files inside `/tasks`
   (see "Task File Location Rules" in `ai-behavior.md`).
3. **Hand off a ready prompt for Sonnet 4.6 — written to a FILE, not pasted into chat** — with
   *literal* acceptance criteria, not a paraphrase. The executor should be able to run it without
   guessing scope. See "Prompt hand-off rule" below.
4. **When Sonnet returns work, verify the actual `diff`, not its report.** The session log is a
   claim, not evidence. Read the real changes (`git show` / `git diff`) and look specifically for:
   - **Missing locales** — every user-facing string must exist in **all four**: `sq`, `en`, `uk`, `it`.
   - **Missing breakpoints** — required responsive coverage (e.g. 320 / 375 / 390 / 768 / 1280 / 1440 / 2560).
   - **Governance violations** — raw `<button>`, `div.fixed.inset-0`, non-canonical components,
     hardcoded strings/tokens, scope creep, undocumented architectural decisions.
5. **Decide:** either **approve**, or **open a follow-up task** (file in `/tasks` + copy-paste prompt).
   Do not silently fix executor mistakes by writing code yourself — route them back as tasks.

## Prompt hand-off rule (MANDATORY)

**Every kickoff / copy-paste prompt for Sonnet 4.6 MUST be written to a file — never delivered
only in chat.** Sonnet reads task files directly; a prompt that lives only in a chat message
cannot be opened by the executor and drifts out of sync with the repo.

- Location + naming: a kickoff file under `/tasks` following the existing convention,
  e.g. `tasks/Epics/Epic_<X>_kickoff_prompt_Task_<NNN>.md` (or `tasks/Sprints/...` for sprints).
- After writing the file, the orchestrator tells the user **the file path only** (and may give a
  one-line summary). Do **not** paste the full prompt body into chat.
- If the prompt changes, edit the file — keep the file as the single source of truth.

## Hard contract embedded in EVERY Sonnet prompt

Put this in every executor prompt, and **verify each clause against the diff** on return:

- Does **not** change the defined scope.
- Does **not** introduce its own architectural decisions — if something is ambiguous or missing,
  it **stops and asks** instead of inventing scope.
- Executes the acceptance criteria **literally**.
- **Self-validates BEFORE claiming complete** (Note 18 in `ai-behavior.md`): runs `npx tsc --noEmit`
  → 0 errors, pastes an AC-by-AC self-audit table into the session log (every kickoff AC bullet → file:line
  OR runtime step → ✅/❌), reviews its own `git diff` against this hard contract, and walks the affected
  UI flow in the running app at `uk` 320px end-to-end before writing the "complete" line in
  `docs/backlog.md`. Missing or partial self-validation is a rule violation — route the task back.
- **Preserves UX flow** (Note 19): when modifying existing functionality OR adding new functionality,
  every existing entry point, sibling control, downstream step, empty/loading/error/success/cancel state
  in the affected flow keeps working end-to-end. The session log includes a short "UX flow trace"
  (entry → step 1 → … → outcome) with the runtime evidence.
- **Preserves existing controls** (Note 20): does NOT silently remove any existing interactive control
  (button, row action, sidebar entry, dropdown item, status switcher, filter chip, …). The session log
  includes a before/after inventory of every control on the affected surface. Removing a control is only
  allowed when the kickoff explicitly authorised it AND the diff documents the replacement entry point.
- Updates `docs/backlog.md` and adds a session log under `docs/sessions/`.
- 0 new lint errors / 0 new warnings; typecheck has no new errors; relevant governance gates PASS.
- **Includes a "Files Changed" table in the session log — one row per touched path + a 1-line
  rationale per file.** Does NOT emit `git add` / `git commit` commands. The **orchestrator
  (Opus) emits commit commands during review** (Task 264 rule, 2026-05-27 — see
  "Orchestrator-owned commit emission" below). The executor NEVER runs git itself (single-writer
  rule: `ai-behavior.md` → "Single-writer git" + "Commit Rules", and CLAUDE.md "Commit hand-off").
  A task is INCOMPLETE — and must be routed back, not approved — if the "Files Changed" table
  is missing OR if Sonnet emits its own `git add` / `git commit` lines (silently ignore Sonnet's
  commands and note the contract violation in the review summary).

## Orchestrator-owned commit emission (Task 264, 2026-05-27)

The orchestrator is the SINGLE point of commit-command emission. After diff review:

- **Read the real diff** (`git diff` on unstaged work; `git show <SHA>:<path>` for already-committed work).
- **Cross-check** Sonnet's session-log "Files Changed" table against the real diff. Any mismatch (missing files; surprise files) = REJECT and route back. Do NOT silently fix.
- **Emit commit commands at the end of the review response** using **explicit paths only** — never `git add -A`, never `git add -u`, never wildcards:
  ```
  git add <p1> <p2> <p3> ...
  git commit -m "<type>(TaskN): <short description>"
  ```
- **One commit per logical change** (typically one commit per task). Multiple tasks may share a commit only when they form a single atomic change AND the message captures both (e.g. `fix(TaskX+TaskY): …`).
- **Emit a single `git add` line with explicit paths** — do NOT emit multi-line `git add` with `^` or backtick continuations. In PowerShell `^` is not a continuation, so the command fails with `fatal: pathspec '^' did not match any files`, stages nothing, and the "commit" silently no-ops (this swallowed Tasks 164 and 165 until re-run).
- **If `git status` shows phantom-corruption mods** (Cowork mode, see "Environment & git safety"): prefix the commit batch with a recovery line — `Remove-Item .git\index -ErrorAction SilentlyContinue; git reset` — so the owner clears phantom mods before the orchestrator's explicit-path `git add` runs. Explicit-path `add` is safe even WITHOUT recovery, because it only stages the named files, but the recovery keeps `git status` clean for future sessions.
- **🔴 NO BACKLOG EDIT WITHOUT ITS COMMIT COMMAND (owner P0, 2026-06-06 — after the 397 "COMMITTED" floated uncommitted).** `docs/backlog.md` is orchestrator-only. The orchestrator MUST NEVER write a `backlog.md` edit (or any governance-doc edit) without, in the **same response**, emitting the explicit-path `git add`/`git commit` command that lands that edit. An uncommitted backlog edit = the file claims a HEAD-state that does not exist = fabricated state (e.g. backlog said "Task 397 = COMMITTED" while HEAD was still on 396 and the whole 397 diff sat unstaged). Corollary: a task may be marked **COMMITTED / APPROVED** in the backlog ONLY together with — never before — the emission of its commit command; if the work is merely done-but-uncommitted, the backlog must say "COMPLETE, pending commit", not "COMMITTED". Every review/governance response that touches `backlog.md` ends with the `backlog.md` path included in an emitted commit. No exception.

## Mobile <640 full-width gate (OWNER P0 — 2026-06-03) — MANDATORY in every kickoff AND every review

The owner has repeatedly (≥5×) rejected work that leaves mobile surfaces content-width instead of full-width. This is now
a hard gate on BOTH sides of the loop:

- **Every kickoff I write** for any task touching UI MUST contain an explicit "Mobile <640 full-width gate" section that
  names each surface in scope and states its required `max-sm` behavior (full-width container / `max-sm:w-full` control /
  full-bleed popup), the ≥44px touch-target rule, the label-wrap rule (sq/en/uk/it), and the icon-only/exempted list.
  Abstract wording ("make it responsive") is forbidden — spell out the exact `max-sm` classes / structural change expected.
- **Dialog & Sheet specifically:** at <640 the popup CONTAINER must be full-width edge-to-edge (NOT `max-w-[calc(100%-2rem)]`
  centered). If the exact pattern (full-screen vs full-width bottom-sheet) is not already decided in the docs, the kickoff
  STOPS and ASKS the owner — it must not guess.
- **Every review I run** is BLOCKED from approval unless the session log contains the rendered verification matrix
  (breakpoints × sq/en/uk/it, per `agent-contract.md` clause 12) with real per-cell evidence, AND I have personally
  confirmed in the diff that every in-scope surface carries the full-width `max-sm` treatment (or a documented exemption).
  tsc=0 / build=✅ is NOT proof and never closes a UI task. A log without the matrix = INCOMPLETE → route back.
- **No more soft tasks.** If I hand off a UI kickoff without this gate, that is MY failure, not the executor's. Self-check
  every kickoff against this section before writing the file path to the owner.

## TailAdmin conformance gate (OWNER P0 — 2026-07-02) — MANDATORY in every UI kickoff AND every review

The owner has repeatedly (≥10×) rejected UI work that does not visually match the TailAdmin reference. This is now a hard
gate on BOTH sides of the loop, equal in weight to the mobile full-width gate (agent-contract clause 16):

- **Single source of truth:** `demo_tailadmin_com.zip` (repo root — `css/style.css` tokens + component class markup in its
  HTML) + `docs/tailadmin-style-reference.md`. The extracted token set (verified 2026-07-02): grays `#f9fafb #f2f4f7 #e4e7ec
  #d0d5dd #98a2b3 #667085 #475467 #344054 #1d2939 #101828`; Outfit; type `text-theme-sm` 14/20, `text-theme-xs` 12/18; radius
  `lg` .5rem / `xl` .75rem / `2xl` 1rem; `shadow-theme-xs`≈`0 1px 2px rgba(0,0,0,.05)`; semantic success `#12b76a` / error
  `#f04438` / warning `#f79009`; control chrome `h-11 rounded-lg border-gray-300 bg-transparent px-4 py-2.5 text-sm
  shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 focus:ring-3`. **Brand stays `#EC5447`** (project override of
  TailAdmin's `#465fff`); everything else is TailAdmin.
- **Every UI kickoff I write** MUST name the TailAdmin reference §-row(s) the primitive/surface must match, and — if no
  authoritative row exists yet — require the task to EXTRACT it from the zip into a new `tailadmin-style-reference.md §6x` row
  BEFORE implementing. "Style it like TailAdmin" without cited values is forbidden; spell out the exact tokens/classes.
- **Every UI review I run** is BLOCKED from approval unless the session log contains **rendered proof side-by-side with the
  zip reference** (the actual TailAdmin component vs the rendered Mantine primitive) at the canonical breakpoints × sq/en/uk/it,
  and I have personally confirmed border color, radius, focus ring, shadow, font, and density match. `tsc=0`/`build=✅` is NOT
  style proof and never closes a UI task. Invented color/px/radius/shadow, or a rendered mismatch = **REJECT, route back**.
- **🔴 Zip-absent ("honest-negative") primitives — live-capture provenance is MANDATORY (owner P0, 2026-07-05, Variant A; agent-contract clause 16a).** When the zip has **zero** reference markup for the primitive (Skeleton §6n / Slider §6q / Toast §6r pattern), I MUST NOT approve a closure built on "formalized prior prose + Mantine zero-override defaults." **Capturing the live reference is MY job as orchestrator — not Sonnet's.** Before I write the kickoff I open the running `demo.tailadmin.com` page in Chrome myself, capture the element (screenshot + `getComputedStyle` at the canonical breakpoints), and record it in the `§6x` row with capture provenance (URL, date, method, selector). The kickoff hands Sonnet that already-captured reference to implement against; the executor never browses TailAdmin. At review I BLOCK approval unless: the `§6x` row carries that provenance, every value — **including each zero-override** — is positively verified against the live capture, and the render is proven **side-by-side with the captured reference**. The crash-and-geometry rendered gate passing (Task 529) is NOT a substitute — it does not check TailAdmin chrome. A closure asserting "Mantine default already matches" with no live capture = **REJECT, route back**.
- **Self-check every UI kickoff against this section before writing the file path to the owner** — same discipline as the
  mobile full-width gate.

## Review checklist (run on every returned task)

- [ ] **🔴 File-integrity (agent-contract clause 14) — RE-RUN, do not trust the log:** every touched file has **0 NUL bytes** (`tr -cd '\000' < f | wc -c` = 0), no stray BOM, `.json` passes `JSON.parse`, `.mjs/.js` passes `node --check`, `.ts/.tsx` compiles, and no file is truncated mid-token. A NUL/unparseable/truncated touched file = **auto-reject, route back** — even if the log claims `tsc=0`/gate-green (that claim is then fabricated). This caught Task 395 (truncated gate script) and Task 397 ×2 (truncated baseline + NUL-corrupted email files).
- [ ] Diff actually matches the session-log "Files Changed" table (no undisclosed edits).
- [ ] Every acceptance criterion verifiable in the diff (not just ticked in the report).
- [ ] **Self-validation block present in the session log** (Note 18, `ai-behavior.md`): the AC-by-AC
      audit table is complete, every row is ✅ with a verifiable file:line OR runtime step, and the
      "Self-validation: tsc=0 errors · build=passes · AC table=all green · runtime locale=uk PASS ·
      scope=clean" line is present. **A task without this block is INCOMPLETE — route back; do not
      approve.**
- [ ] Locale parity: `sq` / `en` / `uk` / `it` all contain the new keys (same key set).
- [ ] Responsive coverage present for all required breakpoints.
- [ ] **🔴 Mobile <640 full-width gate (OWNER P0):** every in-scope text/container surface is full-width at `max-sm` in the diff (Buttons `max-sm:w-full`; Dialog/Sheet popup full-bleed; Tabs/FilterBar/Select/Combobox/Phone/CTA/toolbars too); icon-only exemptions each documented; ≥44px touch targets; labels wrap. **A non-full-width text/container surface at <640 without a documented exemption = REJECT.**
- [ ] **🔴 Rendered verification matrix present (OWNER P0, clause 12):** breakpoints × sq/en/uk/it with real per-cell evidence; uk@320/375/390 stress cells present. **No matrix, or tsc/build-only "proof" = REJECT, route back.**
- [ ] **🔴 TailAdmin conformance (OWNER P0, clause 16):** the rendered primitive/surface visibly matches the `demo_tailadmin_com.zip` reference (border color, radius, focus ring, shadow, Outfit font, density) — proven side-by-side, not asserted; every value cited to a `tailadmin-style-reference.md` §-row; zero invented color/px/radius/shadow. **A rendered mismatch or an invented value = REJECT, route back.**
- [ ] Canonical components only; no governance anti-patterns.
- [ ] **Canonical-first respected (Task 426):** where a canonical primitive already provides the required behavior, the diff does NOT duplicate the class locally; closure is canonical-source proof (`file:line`) + rendered evidence. A duplicated class that diverges a consumer from the canonical single-source = route back.
- [ ] **🔴 Always-verify-styles-vs-source-of-truth (owner P0, 2026-06-28, after the Task 495/507 disabled label+icon miss):** for ANY task touching an input/select/form primitive, every state in `docs/tailadmin-style-reference.md §6e` (resting / focus / error / **disabled — label + field + icon together**) is verified against the rendered output, not just the field, with rendered evidence at the canonical breakpoints × sq/en/uk/it. A disabled render where the label or trailing icon does NOT dim with the field = REJECT. If a needed state is not yet in §6e, it must be extracted from the source-of-truth component into §6e in the same change BEFORE approval — never inferred. `tsc=0`/build-green is never style proof.
- [ ] **UI tasks only:** the §17 UI pre-flight checklist output (`ui-rules.md`) is in the session log —
      non-canonical-dropdown grep, control-height alignment (§15), z-index scale (§16), overflow at 320px
      in `uk`, all 7 breakpoints. **Do NOT approve a UI task whose session log lacks this.**
- [ ] **UX flow preserved** (Note 19, `ai-behavior.md`): the session log includes a UX flow trace
      (entry → step 1 → … → outcome) for the affected surface; every state (empty/loading/error/success/
      cancel/dismiss) still works; cross-page reactivity (header/sidebar/breadcrumb/cards) for any
      identity change (name, title, currency, locale) propagates without a manual reload.
- [ ] **Existing controls preserved** (Note 20, `ai-behavior.md`): the session log shows a before/after
      inventory of every interactive control on the affected surface; nothing was silently removed; any
      moved control has a documented new entry point in the diff. **A diff that drops admin row actions,
      status switchers, sidebar entries, or filter chips without explicit kickoff authorisation is a
      P0 regression — route back as a follow-up task.**
- [ ] **Positive + Negative flow parity in the diff (Task 255 rule).** Every branch listed in the kickoff's `Positive flow` and `Negative flow` sections has a verifiable line in the diff: success path handler, cancel/dismiss handler, validation error path, server-error toast call with locale key, permission-denied / unauthenticated guard, empty/loading state, double-submit guard. If any negative branch listed in the kickoff has no corresponding code change, the task is INCOMPLETE — route back; do not approve.
- [ ] Scope respected; no unrequested architectural decisions.
- [ ] Global-change rule (Note 14, `ai-behavior.md`): the fix updated **every** affected sibling/
      consumer (no diverging call sites left); no hardcode; no one-off component clone; canonical
      `Combobox`/`Button` single-source respected (`ui-rules.md §0`); generated links use
      `NEXT_PUBLIC_SITE_URL`, never `window.location.origin` (`env.md`).
- [ ] `docs/backlog.md` + `docs/sessions/` updated and consistent with the diff.
- [ ] **"Files Changed" table present in session log** (Task 264 rule) — one row per touched path + 1-line rationale; matches the real diff. A missing or mismatched table = INCOMPLETE; route back.
- [ ] **Commit commands emitted by the orchestrator** (Task 264 rule) using explicit paths matching every file in the real diff for the approved tasks; no `git add -A`, no `git add -u`, no wildcards; one commit per logical change. Sonnet-emitted commit commands are silently ignored and the contract violation noted.
- [ ] **🔴 Regression-coverage gate (Epic RS / clause 15):** if the diff touches any `docs/critical-flow-registry.md` flow — a regression test exists, was green on the pre-change behavior (baseline noted), covers the new behavior, runs in CI, and FAILS on a planted violation (transcript present). Registry coverage status updated. **No automated proof of preserved critical functionality = INCOMPLETE; do not approve.** A manual one-case check does not satisfy this.
- [ ] Verdict recorded: **approve** or **follow-up task opened**.

## Approval rule (Task 253 — restated for emphasis)

- **Sonnet's final report is not proof.** The actual changed files are the proof.
- **Approval is allowed only after actual diff review.** Read `git show <sha>` / `git diff` for every commit in the task. Do not approve from the session log alone.
- **If the diff shows a silently removed control, a missing locale, a missing breakpoint, or scope creep, do not silently fix it from the orchestrator session.** Open a follow-up task with a concrete kickoff that lists the regression and routes the fix back through Sonnet.

## Rendered-evidence approval gate (Sprint 33 — 2026-06-04, after the Sprint 32 story rejection)

> **What went wrong (self-audit).** I approved Sprint 32 Tasks 372–375/379 from the diff of the *primitives*,
> which were class-correct on paper (`max-sm:w-full` present), and treated `tsc=0`/`build-storybook ✅` as
> sufficient. I never required or inspected a **rendered** matrix. The owner then rendered every story and almost
> all FAILED — because `layout:'centered'/'padded'` in the stories silently defeats `max-sm:w-full`, fixtures
> hardcode English, and redundant `Ukrainian*` stories were never removed. Task 376 was never reviewed; Task 377
> (the sweep that would have caught this) never ran. Diagnosis:
> `docs/sessions/2026-06-04-orchestrator-sprint32-rendered-rejection-rootcause.md`.

**New hard rule — for ANY Storybook/UI task, a diff review is necessary but NOT sufficient to approve.** Approval
additionally requires ALL of:

- [ ] **Machine-produced rendered artifacts attached** — the `responsive-screenshots --assert` PNG/JSON matrix for
      every in-scope story, with **uk@320/375/390 mandatory**. A session-log table of self-reported PASS cells, or
      any cell marked "OWNER QA REQUIRED / NOT CHECKED / no browser access", is an **auto-reject** — route back.
- [ ] **Gates green in the transcript** — `npm run lint`, `npm run check:stories`, `npm run check:i18n`,
      `responsive-screenshots --assert` all exit 0, AND a negative-flow transcript shows each gate FAILS on a
      planted violation (proves the gate is real, not a no-op).
- [ ] **The class is in the diff AND the pixel is in the screenshot.** For a mobile full-width claim, confirm both
      the `max-sm:w-full` (or canvas) change in the diff and the control filling the <640 frame in the PNG. A
      correct class without a rendered screenshot proving the result is NOT approvable (the `layout:'centered'`
      trap). "It compiles" never approves a UI task (agent-contract clause 12 + 13).
- [ ] **No hardcode / no `Ukrainian*` story** — confirmed by the green `check:stories` gate, not by eyeballing.

If any item is missing, the task is INCOMPLETE: open a follow-up, do not approve. I will not approve Sprint 33
(380–383) from diffs — only from the rendered artifacts the new gate produces.
