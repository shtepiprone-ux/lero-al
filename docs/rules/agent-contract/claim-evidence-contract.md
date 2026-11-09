# Claim-to-evidence invariant

An executable kickoff may not convert a plausible statement into a requirement. Every decision-relevant repository,
runtime, UI, test, command-result, absence, or scope claim is either a current observation with a reproducible
locator or an explicit owner decision. The exact operational grammar and stop conditions are in
`.claude/rules/shared/claim-evidence-contract.md` (removed 2026-11-06).

`FACT` means the author opened the named current source/artifact and recorded a path, applicable line range, and
literal observation that appears there. `OWNER DECISION` means a dated owner choice, faithfully translated into English; it defines desired
behavior but never proves existing behavior. `INFERENCE`, `UNKNOWN`, `UNVERIFIED`, `CONTRADICTION`, and `ASSUMPTION`
cannot support scope, a requirement, an AC, expected command output, a canonical owner, or an exclusion. Resolve the
gap or return `BLOCKED`.

Every new or revised implementation kickoff has one `## Claim ledger`. Its `C# FACT` rows use
`source: path:line-line; observed: literal`; its `D# OWNER DECISION` rows use `owner: YYYY-MM-DD; decision: owner choice in English`.
Every `R#` and `AC#` cites the supporting `C#` and/or `D#`. The evidence path/range/literal must resolve in the
repository or retained evidence artifact. The absence of a row, an unresolved citation, or a non-publishable state is
`BLOCKED — KICKOFF EVIDENCE GAP`.

`npm run check:kickoff-evidence` mechanically validates the changed kickoff's ledger structure, references, source
ranges, and observed literals. It does not prove semantic interpretation; Opus must perform the required
counter-check during task design and review. A valid checker result is necessary but never sufficient evidence.
