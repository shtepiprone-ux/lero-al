# Task 944 design evidence p00: the 2026-11-03 hook trap

Observed by the Task 944 designer session 3d40df28 (Opus) on 2026-11-03, native Windows 11, node v22.22.3, cwd
`C:\Claude_Code_Projects\lero-al`. Literal tool output of this session; nothing is paraphrased inside the code blocks.

## 1. Every Bash, PowerShell, Edit and Write call was refused

First Bash call of the session and the Edit call that tried to restore the line, both refused by the same hook:

```
PreToolUse:Edit hook error: [node ${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/security-hook.mjs]: failed; blocking because onFailure is "block"
file:///C:/Claude_Code_Projects/lero-al/scripts/workflow-gates/contract.mjs:198
      if (assertions) check(assertions.has(row.id), `${row.id}: Case assertions has no line for this case`);
      ^^

SyntaxError: Unexpected token 'if'
```

## 2. The Stop hook failed on every response for the same import

```
Stop hook feedback:
[powershell.exe -NonInteractive -NoProfile -ExecutionPolicy Bypass -File ${CLAUDE_PROJECT_DIR}/.claude/hooks/orchestrator-response-gate.ps1]: file:///C:/Claude_Code_Projects/lero-al/scripts/workflow-gates/contract.mjs:198
SyntaxError: Unexpected token 'if'
```

## 3. The live line that caused it (Read tool, before the owner's repair)

```
197	      if (false && source !== null) check(source.includes(`[${row.id}]`), // SENSITIVITY BREAK `${row.id}: ${file} no longer contains [${row.id}]; a removed or renamed case needs a revision of its task`);
```

The `//` turned the rest of line 197, including the closing parenthesis of `check(`, into a comment, so the module did
not parse and every hook that imports it failed before deciding.

## 4. Repair

The owner ran the repair in an outside terminal. Afterwards the Grep tool found no `SENSITIVITY BREAK` in the file,
`node --check scripts/workflow-gates/contract.mjs` printed `CHECK_OK`, and the live sha256 is
`764f8a58cadf13c4bc3b08901c08a02ecd235e14675f14e481d26d77bb6ef941`, the Baseline and Restored hash recorded by
`docs/sessions/evidence/task943/sensitivity/GOV-943-TESTS-REBASE-DENY.txt` (see `p01-loader-run.txt` line 3).
