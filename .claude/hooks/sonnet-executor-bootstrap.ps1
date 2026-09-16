param(
  [ValidateRange(1, 3)][int]$Part = 1
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$contextChunkSize = 7000

try {
  $event = [Console]::In.ReadToEnd() | ConvertFrom-Json -ErrorAction Stop
  $model = if ($event.PSObject.Properties.Name -contains 'model') { [string]$event.model } else { '' }
  $agentType = if ($event.PSObject.Properties.Name -contains 'agent_type') { [string]$event.agent_type } else { '' }
} catch {
  exit 0
}

# The executor agent preloads this skill itself, so avoid duplicate context there.
if ($agentType -eq 'executor' -or $model -notmatch '(?i)sonnet') {
  exit 0
}

$skillPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\skills\execute-task\SKILL.md'))
if (-not (Test-Path -LiteralPath $skillPath)) {
  exit 0
}

try {
  $skill = Get-Content -LiteralPath $skillPath -Raw -Encoding UTF8 -ErrorAction Stop
  $body = [regex]::Replace($skill, '(?s)\A---\r?\n.*?\r?\n---\r?\n?', '')
} catch {
  exit 0
}

$context = @"
Lero.al Sonnet executor workflow is active for this session. The canonical execution skill below applies before any implementation claim. Opus is the sole reviewer and approval gate: Sonnet never approves or self-approves a task. Sonnet never conducts, initiates, simulates, or continues an implementation review, including automatically after its implementation handoff. Sonnet may run required implementation checks and report factual evidence, but this validation is not review. At handoff Sonnet must return its required status and stop; a separate Opus orchestrator session alone decides whether to run `review-task`, independently review the diff/evidence, and issue a verdict. Sonnet never emits, suggests, or runs mutating Git commands, including `git push`; only Opus may provide an owner-run push command after an approved review.

NON-NEGOTIABLE BUILD GATE: for every non-Q0 task, run `npm run build` after the final edit and record the real zero-exit result before any completion claim. A failed or unrun build is `PARTIALLY IMPLEMENTED` or `BLOCKED`, never `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`; send Opus the exact failure output.

NON-NEGOTIABLE UI START GATE: before editing visible JSX, CSS, className, or style props, inspect canonical Mantine
stories, component catalog, patterns, and the relevant primitive source; record 'reuse', 'extend', or 'create
canonical' with the shared token/style path. Do not write a local style because a story was not checked. If no
canonical source or approved value exists, create the shared source/story/registration named by the task or stop for
'CANONICAL UI SPECIFICATION GAP' / 'CANONICAL STYLE DECISION REQUIRED'.

NON-NEGOTIABLE COMPONENT/STORY GATE: before creating a production UI component (including a new named visible
component in an existing file), search `src/components/`, `src/design-system/`, `src/modules/**/components/`, and
`src/stories/` by the required purpose and behavior. Open every plausible candidate's source and Story; a
filename-only search or a parent/composition Story is not proof. Record the purpose, queries, inspected paths,
candidate coverage, and exactly one decision: `reuse`, `extend`, or `create canonical`. Reuse or extend a candidate
that covers at least 70%. Only an evidenced `create canonical` permits a new source, and it requires that source's
own direct standalone Story and required registration before the component is integrated into any parent or route.
Without the audit receipt or direct Story, STOP and return `BLOCKED - COMPONENT/STORY GATE`; never defer the Story.

$body
"@

$partCount = [Math]::Ceiling($context.Length / $contextChunkSize)
if ($Part -gt $partCount) {
  exit 0
}

$offset = ($Part - 1) * $contextChunkSize
$length = [Math]::Min($contextChunkSize, $context.Length - $offset)
$contextPart = $context.Substring($offset, $length)
$additionalContext = "Lero.al Sonnet executor workflow, segment $Part of $partCount. Apply all segments as one mandatory workflow.`n`n$contextPart"

@{
  hookSpecificOutput = @{
    hookEventName = 'SessionStart'
    additionalContext = $additionalContext
  }
} | ConvertTo-Json -Depth 5 -Compress
