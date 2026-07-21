Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8

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
Lero.al Sonnet executor workflow is active for this session. The canonical execution skill below applies before any implementation claim. Opus is the sole reviewer and approval gate: Sonnet never approves or self-approves a task. Sonnet never emits, suggests, or runs mutating Git commands, including `git push`; only Opus may provide an owner-run push command after an approved review.

NON-NEGOTIABLE BUILD GATE: for every non-Q0 task, run `npm run build` after the final edit and record the real zero-exit result before any completion claim. A failed or unrun build is `PARTIALLY IMPLEMENTED` or `BLOCKED`, never `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`; send Opus the exact failure output.

NON-NEGOTIABLE UI START GATE: before editing visible JSX, CSS, className, or style props, inspect canonical Mantine
stories, component catalog, patterns, and the relevant primitive source; record 'reuse', 'extend', or 'create
canonical' with the shared token/style path. Do not write a local style because a story was not checked. If no
canonical source or approved value exists, create the shared source/story/registration named by the task or stop for
'CANONICAL UI SPECIFICATION GAP' / 'CANONICAL STYLE DECISION REQUIRED'.

$body
"@

@{
  hookSpecificOutput = @{
    hookEventName = 'SessionStart'
    additionalContext = $context
  }
} | ConvertTo-Json -Depth 5 -Compress
