# Opus task design: publication gate

Before publishing a kickoff, confirm:

- the evidence and rule-compliance records match the final task text; assertions are facts, not deferred guesses;
- exactly one implementation route remains; owner choices are explicit `BLOCKED` decisions, not alternative routes;
- every required command is known, native Windows PowerShell-ready when owner-run, and has expected evidence;
- UI scope includes the canonical decision, direct Story, token contract, parity receipt, and owner matrix;
- permanent Story work is a real canonical/prod need, while probes have restoration evidence;
- sprint/reserved/backlog state is synchronized and `check:backlog-active` passes where required;
- a fresh Sonnet can implement without chat context.

Reopen the saved kickoff after writing and verify headings, references, requirement/AC IDs, route, and amendment
inventory. Then inspect status/diff and provide an explicit-path owner `git add` plus `git commit` handoff for files
Opus changed. Task design never emits `git push`. Follow the detailed lock/status procedure in
`docs/orchestrator-procedures.md`.
