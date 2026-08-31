param(
  [ValidateRange(1, 3)][int]$Part = 1
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$contextChunkSize = 7000

function Test-AnyPattern {
  param(
    [Parameter(Mandatory = $true)][string]$Value,
    [Parameter(Mandatory = $true)][string[]]$Patterns
  )

  foreach ($pattern in $Patterns) {
    if ($Value -match $pattern) {
      return $true
    }
  }

  return $false
}

try {
  $event = [Console]::In.ReadToEnd() | ConvertFrom-Json -ErrorAction Stop
  $prompt = [string]$event.prompt
  $agentType = if ($event.PSObject.Properties.Name -contains 'agent_type') { [string]$event.agent_type } else { '' }
} catch {
  exit 0
}

if ($agentType -eq 'executor' -or [string]::IsNullOrWhiteSpace($prompt)) {
  exit 0
}

# Explicit slash commands already load the matching skill through Claude Code.
if ($prompt -match '^\s*/(?:create-task|review-task)\b') {
  exit 0
}

$reviewPatterns = @(
  '(?i)\b(code\s+review|review|reviewer|qa|validate|validation|verify|verification|approve|approval|release\s+readiness|diff|storybook)\b',
  '(?i)(\u0440\u0435\u0432|\u043f\u0435\u0440\u0435\u0432[\u0456i]\u0440|\u0432\u0430\u043b\u0456\u0434\u0430\u0446|\u0432\u0435\u0440\u0438\u0444\u0456\u043a|\u0441\u0445\u0432\u0430\u043b|\u0437\u0430\u0442\u0432\u0435\u0440\u0434|\u0440\u0435\u0433\u0440\u0435\u0441|\u0441\u0442\u043e\u0440\u0456?\u0431\u0443\u043a)'
)
$taskPatterns = @(
  '(?i)\b(create\s+(?:an?\s+)?task|task\s+design|implementation\s+task|kickoff|spec(?:ification)?|decompose|scope\s+(?:an?\s+)?task|write\s+(?:an?\s+)?task)\b',
  '(?i)(\u0441\u0442\u0432\u043e\u0440[\u0438\u0456]|\u0441\u0444\u043e\u0440\u043c\u0443\u0439|\u043d\u0430\u043f\u0438\u0448\u0438|\u043f\u0456\u0434\u0433\u043e\u0442\u0443\u0439|\u0434\u0435\u043a\u043e\u043c\u043f\u043e\u0437|\u0441\u043f\u0435\u0446\u0438\u0444\u0456\u043a\u0430\u0446|\u043f\u043b\u0430\u043d\s+\u0440\u0435\u0430\u043b\u0456\u0437\u0430\u0446|\u0437\u0430\u0434\u0430\u0447[\u0430\u0443\u0438\u0456])'
)

# Review wins when a prompt discusses both a task and completed implementation.
if (Test-AnyPattern -Value $prompt -Patterns $reviewPatterns) {
  $mode = 'IMPLEMENTATION REVIEW'
  $skillName = 'review-task'
} elseif (Test-AnyPattern -Value $prompt -Patterns $taskPatterns) {
  $mode = 'TASK DESIGN'
  $skillName = 'create-task'
} else {
  exit 0
}

$skillPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\skills\$skillName\SKILL.md"))
if (-not (Test-Path -LiteralPath $skillPath)) {
  exit 0
}

try {
  $skill = Get-Content -LiteralPath $skillPath -Raw -Encoding UTF8 -ErrorAction Stop
  $body = [regex]::Replace($skill, '(?s)\A---\r?\n.*?\r?\n---\r?\n?', '')
  $body = $body.Replace('$ARGUMENTS', $prompt)
} catch {
  exit 0
}

$startupGate = ''
if ($skillName -eq 'review-task') {
  $startupGate = @'
STOP — MANDATORY IMPLEMENTATION-REVIEW STARTUP GATE

Classification is the only permitted action before this gate. Before opening the implementation task, diff, source,
executor report, validation evidence, or writing review analysis, open these files in the current session, in order:
1. `.claude/skills/review-task/SKILL.md`
2. `docs/orchestrator-role.md`
3. `docs/orchestrator-procedures.md`

This injected text is not a substitute for opening those source files. The first substantive review response must
begin exactly:
`REVIEW PREFLIGHT COMPLETE — loaded in this session: .claude/skills/review-task/SKILL.md; docs/orchestrator-role.md; docs/orchestrator-procedures.md.`

If any file is unavailable, return `BLOCKED` naming the path and stop. If the receipt was omitted or a file was unread,
discard all preliminary review conclusions and restart this gate before issuing a finding or decision.

'@
} elseif ($skillName -eq 'create-task') {
  $startupGate = @'
STOP — MANDATORY TASK-DESIGN STARTUP GATE

Classification is the only permitted action before this gate. Before opening an existing task, source, diff, executor
report, validation evidence, or writing task analysis or a kickoff, open these files in the current session, in order:
1. `.claude/skills/create-task/SKILL.md`
2. `docs/orchestrator-role.md`
3. `docs/orchestrator-procedures.md`

This injected text is not a substitute for opening those source files. The first substantive task-design response must
begin exactly:
`TASK-DESIGN PREFLIGHT COMPLETE — loaded in this session: .claude/skills/create-task/SKILL.md; docs/orchestrator-role.md; docs/orchestrator-procedures.md.`

If any file is unavailable, return `BLOCKED` naming the path and stop. If the receipt was omitted or a file was unread,
discard all preliminary task-design conclusions and restart this gate before writing a kickoff or issuing a decision.

'@
}

$context = @"
$startupGate
Lero.al automatic orchestration router selected [$mode] from the submitted prompt. The canonical workflow below is injected for this turn. Follow it before giving a substantive result. The user does not need to repeat the workflow name.

$body
"@

$partCount = [Math]::Ceiling($context.Length / $contextChunkSize)
if ($Part -gt $partCount) {
  exit 0
}

$offset = ($Part - 1) * $contextChunkSize
$length = [Math]::Min($contextChunkSize, $context.Length - $offset)
$contextPart = $context.Substring($offset, $length)
$additionalContext = "Lero.al automatic orchestration workflow [$mode], segment $Part of $partCount. Apply all segments as one mandatory workflow.`n`n$contextPart"

@{
  hookSpecificOutput = @{
    hookEventName = 'UserPromptSubmit'
    additionalContext = $additionalContext
  }
} | ConvertTo-Json -Depth 5 -Compress
