## P0 invariants

1. **Scope stays bounded.** Change only what the task requires. No drive-by refactors, unrelated cleanup, or hidden
   architecture changes.

2. **No invented architecture or facts.** If a required decision is missing and cannot be safely inferred from the
   repository, stop and ask.

3. **Existing capabilities stay reachable.** Do not remove buttons, row actions, filters, edit controls, navigation
   entries, status controls, validation states, empty/loading/error/success/cancel states, or downstream steps unless
   the kickoff explicitly authorizes removal.

4. **Editable controls cannot become read-only by accident.** If an editable control moves, the new editable
   location must be implemented in the same task. A read-only label is not a replacement.

5. **Existing UX flows remain intact.** Preserve entry points, sibling controls, downstream steps, state transitions,
   and cross-page effects unless the kickoff explicitly changes them.

6. **Current and required behavior must be explicit.** Every UI/control kickoff and session log must describe the
   current behavior to preserve and the required after behavior. Implementation kickoffs are saved under `tasks/`;
   chat-only handoffs are not sufficient.

6a. **Positive and applicable negative flows must be handled.** Every task defines the happy path and an
   applicability table for off-happy-path branches. Implement and verify every branch marked applicable; do not
   invent irrelevant branches.

7. **Localization covers all four locales.** Any new or changed user-facing string must be represented in `sq`,
   `en`, `uk`, and `it`, with runtime behavior verified according to the selected QA profile.

8. **Responsive verification follows the selected QA profile.** Use `docs/qa-profiles.md` to choose targeted Q2
   evidence or the full Q3/Q4 visual matrix. Historical fixed-width lists do not override the selected profile.

9. **Validation evidence is mandatory.** A completion claim must include the selected QA profile, exact checks run,
   actual results, and an acceptance-criteria self-audit. Every non-Q0 task must include the final `npm run build`
   result with exit code 0; a failed, unavailable, or stale build transcript blocks `IMPLEMENTED - AWAITING
   ORCHESTRATOR REVIEW` and all approval decisions. `tsc=0` alone is not proof of build integrity, UI behavior,
   regression safety, or visual conformance. When a required check cannot run because of a sandbox, native-binary
   mismatch, or timeout, record it as missing evidence and provide the owner exact native commands plus the expected
   evidence; return `PARTIALLY IMPLEMENTED` or `BLOCKED`, never a confidence claim.

   A deletion or rename also requires a whole-repository audit of its live downstream references: automation,
   governance scripts, catalogs, allowlists, CI/configuration, and current operational documentation. Update or
   remove every active consumer and run its relevant gate. A known active broken reference or non-zero required gate
   is part of the same task, never an out-of-scope cleanup. Report each command's real exit status; do not call the
   work clean, complete, validated, or ready for review while any required check is unrun or failing.

