### Universal owner-provided reference-link audit — blocking

Every URL, site, page, interactive demo, screenshot, or embedded external example the owner supplies or names as a
reference is an **owner-provided reference**. It joins the four standing references in every audit below. The audit
runs at every task creation, execution and review ("When it runs" above), for UI and functional behaviour alike. The
standing references are a minimum, not a closed list.

**Forbidden:** writing a kickoff, a revision, an audit conclusion, a review decision or a design decision, or making
the first write of an execution, before the complete audit below is done in the current session. That includes choosing a
layout, control, action set, behavior, data flow, permission rule, visual style, or acceptance criterion from
memory; from a landing page; from one convenient screen; from a search snippet; or from a previous session's notes.
An earlier audit is context only, never proof for the current decision.

1. **Resolve and enumerate.** Open the owner-supplied entry URL first and record its final URL and access state.
   Build a route inventory for the full accessible reference scope: every first-party page reachable through primary
   and secondary navigation, nested menus, tabs, cards, action links, pagination, and relevant deep links. Include
   the URL, page title/label, discovery path, and `inspected` / `blocked` / `not applicable` state for each route.
   An inaccessible page is still an inventory row; record the exact obstacle. A landing-page-only inventory is
   invalid.
2. **Inspect the whole workflow, not a screenshot.** Open every enumerated page. For every page that contains the
   requested artifact or supports its workflow, operate every relevant control and trace every reachable flow:
   entry, navigation, create/edit/delete or other action, confirmation/cancellation, permissions where observable,
   success, empty, error, and changed-state outcomes. Record the observed anatomy, real labels/data, control states,
   transitions, and measurements where visual fidelity matters. Do not infer behavior from appearance.
3. **Preserve page-level evidence.** The audit record must include a row for each inspected or blocked route with
   its URL, discovery path, feature relevance, observed behavior, evidence location, and the exact claim(s) it can
   support. Save screenshots and interaction evidence under the task's research evidence directory. A bare list of
   URLs, a summary, or one screenshot cannot prove page inspection.
4. **Compare and map.** Compare the relevant patterns across every supplied reference and across their supporting
   pages; explicitly state behavior that differs between pages and features that no reference demonstrates. Map the
   selected pattern to lero.al's real entities, fields, actions, permissions, guards, routes, and existing UI. Every
   mismatch is a requirement, a documented exclusion, or an owner decision — never an invented equivalence.
5. **Stop on a gap.** If a relevant route cannot be opened, a control cannot be operated, the inventory cannot be
   completed, or a claim cannot be tied to page-level evidence, label it `UNVERIFIED` with the exact URL and reason.
   Do not use it as evidence. If the pending kickoff, revision, audit, or verdict depends on that claim, return
   `BLOCKED` and request access or a bounded owner decision.
6. **Integrity and correction.** Never say or imply `inspected`, `audited`, `all pages`, `same as the reference`,
   `reference proves`, or equivalent unless the current-session audit record supports that exact statement. If an
   earlier statement is discovered to be incomplete or wrong, immediately issue a `RETRACTION` containing: the
   invalid prior claim; why it was invalid; the page-level evidence now available; and the corrected status
   (`FACT`, `INFERENCE`, `UNVERIFIED`, `CONTRADICTION`, or `BLOCKED`). The affected kickoff, audit, or review is
   invalid until its preflight is restarted. An apology, an excuse such as "I was not attentive", or a promise to
   check later is not a correction and does not permit work to continue.

**Required, before every kickoff, revision, execution and review (see "When it runs" above):**
1. Apply the universal audit to all four standing references **and** every owner-provided reference link in scope.
2. For every page carrying the artifact, additionally record visual values with `getComputedStyle`: size, radius,
   colours, and gap. Save the screenshots under `docs/sessions/evidence/task<N>/research/`.
3. **Map onto lero.al.** For every lero.al surface the task touches, write down:
   - the real entity and fields;
   - the existing server actions, permissions and guards;
   - the routes (does an edit page exist?);
   - the existing UI.
   Then fill the chosen pattern with that real data: which columns, which actions, what each action calls, what a
   guard blocks. Every gap between the reference pattern and lero.al's data or capabilities is a requirement or an
   owner decision.
4. **Decide.** Choices the evidence cannot settle go to the owner as bounded options (AskUserQuestion), before the
   kickoff is written. The kickoff carries one route only.

The kickoff carries the result as a section named **"Reference research (GR-7)"**. It holds the pages inspected,
the complete route inventory, the page-level evidence table, the comparison table, the chosen pattern, the lero.al
data map, every blocked or unverified route, the evidence paths, and the owner decisions.

**Receipt — task creation, execution and review alike, one per moment:**

`GR-7 REFERENCE RESEARCH — moment: <task creation | execution | review>; role: <Opus | Sonnet>; task: <N>; subject: <what>; references: Lahomes, Kamr, Omah, TailAdmin + <owner URLs | none>; library: <docs/research/references/YYYY-MM-DD>; live-checked pages: <page → unchanged | difference>; route inventory: <per reference: enumerated / inspected / blocked>; inspected in depth: <every page, with its evidence row>; workflow states operated: <list>; options across references: <option ← pages>; chosen 2026 best practice: <option + why>; absent or unverified: <features/routes | none>; lero.al data map: <surfaces × entity/actions/routes>; owner decisions: <IDs | none>; evidence: <path>.`

Sanctions:
- **Task creation.** With no receipt, with fewer than four references, with an inventory where inspected < enumerated
  and no `blocked` reason, or with a kickoff missing its "Reference research (GR-7)" section, the kickoff is not
  publishable.
- **Execution.** Sonnet returns `BLOCKED — GR-7 REFERENCE AUDIT MISSING` and makes no write. Its audit goes to
  `docs/sessions/evidence/task<N>/research-exec/`. Where the shipped result differs from the kickoff's chosen
  pattern, Sonnet stops and reports the difference. It never picks a different pattern on its own.
- **Review.** Before the first finding, the reviewer runs its own audit into
  `docs/sessions/evidence/task<N>/research-review/`. A review without it is void, and a task whose kickoff or execution
  lacks the receipt is `NEEDS REVISION`.

