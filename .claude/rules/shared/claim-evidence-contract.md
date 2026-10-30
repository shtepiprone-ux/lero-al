# Claim-to-evidence contract

This contract prevents a plausible statement from becoming a task fact. Read it before writing or revising a kickoff
and before reviewing a kickoff or implementation conclusion.

## Claim states

- `C# FACT` is a decision-relevant observation from a current-session source, command artifact, or rendered proof.
  It must name the exact repository/evidence path, line range where applicable, and a short literal observed there.
- `D# OWNER DECISION` is the owner's dated choice, recorded as a faithful English translation of the owner's words
  (`shared/project-language.md`). It supplies product direction; it does not turn an
  unverified repository claim into a fact.
- `INFERENCE`, `UNKNOWN`, `UNVERIFIED`, `CONTRADICTION`, and `ASSUMPTION` are investigation outcomes, never inputs
  to an executable route. Resolve them with evidence or an owner decision; otherwise return `BLOCKED`.

## Required kickoff ledger

Every created or revised implementation kickoff contains exactly one `## Claim ledger` table:

| ID | Status | Claim | Evidence |
|---|---|---|---|
| C1 | FACT | <one atomic current-state claim> | source: `path:line-line`; observed: `<literal from that range>` |
| D1 | OWNER DECISION | <one bounded product decision> | owner: YYYY-MM-DD; decision: `<owner choice, faithfully translated into English>` |

The source/evidence file must exist, the cited range must exist, and the literal must occur in that range. Do not cite
a nearby name, comment, old task text, or a plan as evidence. A command/result claim cites its retained output file
and literal output. An owner decision never substitutes for missing source behavior.

Each atomic requirement uses `R<n> [C…; D…]`; each AC cites its declared requirement as `AC<n> [R…]` and inherits
that requirement's evidence. Add direct C#/D# citations when the AC introduces another premise or decision; do not
duplicate citations solely for formatting. Every cited C#/D# exists in the ledger. A fact without a ledger row may
be investigated, but may not set scope, required behavior, an AC, a command's
expected result, a canonical owner, or an exclusion.

Before the first active-kickoff write, register this receipt through the **PowerShell tool** (not as prose next to a
tool call, because Claude may retain that prose only as unavailable thinking):

```powershell
& .\.claude\hooks\emit-phase-receipt.ps1 -Kind KickoffEvidence -Receipt 'KICKOFF EVIDENCE PREFLIGHT COMPLETE — claims: C1, ...; owner decisions: D1, ... | NONE; blocked claims: NONE.'
```

The pre-write hook accepts only this exact helper invocation from the PowerShell tool. The helper validates and prints
the receipt but writes no project state; it is durable preflight evidence, not a bypass. The receipt only proves
ordered preflight; the post-write checker still verifies the saved ledger, source ranges, observed literals, and
requirement/AC citations.
This receipt is not proof of completed investigation or runnable instructions. Complete
`shared/task-readiness.md` before any new/revised executor handoff; a literal's presence does not prove the claim
made from it. The checker covers R/AC declarations in later numbered requirement/AC sections as well as the first.

## Publication and review stops

Run `npm run check:kickoff-evidence` before publishing a kickoff. The Stop hook and CI run the same checker for
changed active kickoffs. A failure means `BLOCKED — KICKOFF EVIDENCE GAP`; repair the trace or obtain a bounded owner
decision. Do not ask Sonnet to discover whether a premise is true.

At review, reopen every cited source/artifact needed by a changed `C#`, test the most direct counterexample for each
material conclusion, and downgrade any unsupported claim to a finding. A kickoff/review conclusion with a fabricated,
stale, or non-supporting citation is void and must be corrected before a verdict or handoff.
