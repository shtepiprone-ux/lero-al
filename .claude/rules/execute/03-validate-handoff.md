# Sonnet implementation: validation and handoff

Validate the implementation; do not conduct an implementation review or issue an approval verdict.

1. Map every requirement and acceptance criterion to changed code and inspected evidence.
2. Inspect the actual diff against the task's write scope and `Files Changed` table.
3. Run the exact task/QA commands and retain unpiped transcripts with real exit codes. For every non-Q0 task, run the
   final `npm run build`; a failed or unrun build means `PARTIALLY IMPLEMENTED` or `BLOCKED`.
4. Produce the task's rendered evidence at required viewports/locales, over the app root and every portal root of
   each registered interaction state (`shared/rendered-state-census.md`); apply `shared/mobile-adaptation-contract.md`,
   `shared/storybook-proof.md`, and the final GR-12 parity census for visible work. Include the saved Mantine
   mechanism/owner in the evidence and flag any unsupported parallel viewport logic. Build/typecheck alone does not
   prove visual behavior.
5. Recheck file integrity, active downstream consumers for deletes/renames, and the direct Story/registration for
   every newly created production UI component.
6. List every owner visual-QA tuple as `OWNER VISUAL QA REQUIRED`; never mark it visually passed on the owner's behalf.

The factual handoff contains task path/status; per-AC evidence; current/required behavior; changed files; commands
and actual outcomes; visual source trace; canonical decision/token record; defects/gaps; assumptions/deviations;
evidence paths/questions for Opus; and concise backlog update. End with exactly one status:

- `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`
- `PARTIALLY IMPLEMENTED`
- `BLOCKED`

Never append a review, approval language, owner Git command, or a request to merge. The detailed reporting shape is
in the selected `docs/rules/agent-contract/` fragment and the saved task.
