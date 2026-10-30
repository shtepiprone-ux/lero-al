param(
  [ValidateRange(1, 1)][int]$Part = 1
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$contextChunkSize = 7000
. (Join-Path $PSScriptRoot 'session-role.ps1')

try {
  $event = [Console]::In.ReadToEnd() | ConvertFrom-Json -ErrorAction Stop
  $role = Get-LeroSessionRole $event
  $agentType = if ($event.PSObject.Properties.Name -contains 'agent_type') { [string]$event.agent_type } else { '' }
} catch {
  exit 0
}

# The executor agent preloads this skill itself, so avoid duplicate context there.
if ($agentType -eq 'executor' -or $role -ne 'executor') {
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
Lero.al Sonnet executor workflow is active for this session. The compact parent below is mandatory. Before opening a
task, source, diff, or Storybook, open the parent, `.claude/rules/shared/role-boundaries.md`, and
`.claude/rules/execute/01-start.md`; the first substantive response must use that phase's exact receipt. Before any
visible UI/Story write, open `execute/02-implement.md` and `shared/ui-token-contract.md`. A missing shared semantic
token/component/direct Story, a local visual decision, or cross-Story parity mismatch is `BLOCKED - GR-12`; creating
the missing shared owner is the only implementation path. After final edit, complete `execute/03-validate-handoff.md`.

Sonnet validates facts but never reviews, self-approves, edits policy/governance, or emits/suggests mutating Git
commands. For every non-Q0 task, a real final `npm run build` zero-exit result is required for
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

$body
"@

$partCount = [Math]::Ceiling($context.Length / $contextChunkSize)
if ($Part -gt $partCount) {
  exit 0
}

$offset = ($Part - 1) * $contextChunkSize
$length = [Math]::Min($contextChunkSize, $context.Length - $offset)
$contextPart = $context.Substring($offset, $length)
$additionalContext = "Lero.al Sonnet executor compact parent workflow. Open each named phase file at its gate.`n`n$contextPart"

@{
  hookSpecificOutput = @{
    hookEventName = 'SessionStart'
    additionalContext = $additionalContext
  }
} | ConvertTo-Json -Depth 5 -Compress
