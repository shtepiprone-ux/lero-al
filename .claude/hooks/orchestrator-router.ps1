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
  $role = Get-LeroSessionRole $event
} catch {
  exit 0
}

# This router is exclusively for Opus orchestration. Sonnet receives execute-task
# from sonnet-executor-bootstrap.ps1 and must never receive task-design/review context.
# UserPromptSubmit does not carry model. Use the named agent or SessionStart/PostModelSwitch state.
if ($role -ne 'orchestrator' -or [string]::IsNullOrWhiteSpace($prompt)) {
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

# A forwarded implementation report starts review without a separate imperative.
# Header matching preserves explicit summary/task-design requests that merely mention a report.
$reportPatterns = @(
  '(?i)\A\s*(?:[#>*-]+\s*)?(?:Sonnet(?:''s)?\s+(?:(?:implementation|completion|handoff)\s+)?report|(?:implementation|completion|handoff)\s+report\s+(?:from|by)\s+Sonnet|EXECUTOR\s+HANDOFF|IMPLEMENTATION\s+COMPLETE|PARTIALLY\s+IMPLEMENTED)\b',
  '(?i)\A\s*(?:[#>*-]+\s*)?(?:\u041e\u0441\u044c\s+)?\u0437\u0432\u0456\u0442(?:\s+\u0432\u0456\u0434)?\s+Sonnet\b',
  '(?im)^\s*(?:status:\s*)?(?:PARTIALLY IMPLEMENTED|IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW)\s*$'
)

# An explicit owner request precedes status/header text quoted as report data.
if ($prompt -match '(?i)\A\s*(?:please\s+)?(?:summarize|translate|\u043f\u0456\u0434\u0441\u0443\u043c\u0443\u0439|\u043f\u0435\u0440\u0435\u043a\u043b\u0430\u0434\u0438)\b') { exit 0 }
$explicitTask = $prompt -match '(?i)\A\s*(?:please\s+)?(?:(?:create|write|design)\s+(?:an?\s+)?task|(?:\u0441\u0442\u0432\u043e\u0440\u0438|\u043f\u0456\u0434\u0433\u043e\u0442\u0443\u0439|\u043d\u0430\u043f\u0438\u0448\u0438)\s+\u0437\u0430\u0434\u0430\u0447\u0443)\b'

# Otherwise prefer review when a prompt discusses both a task and completed implementation.
if ($explicitTask) {
  $mode = 'TASK DESIGN'
  $skillName = 'create-task'
} elseif ((Test-AnyPattern -Value $prompt -Patterns $reviewPatterns) -or (Test-AnyPattern -Value $prompt -Patterns $reportPatterns)) {
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
STOP - MANDATORY IMPLEMENTATION-REVIEW STARTUP GATE

Classification is the only permitted action before this gate. Before opening the implementation task, diff, source,
executor report, validation evidence, or writing review analysis, open these files in the current session, in order:
1. `.claude/skills/review-task/SKILL.md`
2. `.claude/rules/shared/role-boundaries.md`
3. `.claude/rules/review/01-preflight.md`

This injected text is not a substitute for opening those source files. The first substantive review response must
begin exactly:
`REVIEW PREFLIGHT COMPLETE - loaded: review-task; review/01-preflight; shared/role-boundaries; selected Agent Contract fragments; rule index; QA profile.`

If any file is unavailable, return `BLOCKED` naming the path and stop. If the receipt was omitted or a file was unread,
discard all preliminary review conclusions and restart this gate before issuing a finding or decision.

'@
} elseif ($skillName -eq 'create-task') {
  $startupGate = @'
STOP - MANDATORY TASK-DESIGN STARTUP GATE

Classification is the only permitted action before this gate. Before opening an existing task, source, diff, executor
report, validation evidence, or writing task analysis or a kickoff, open these files in the current session, in order:
1. `.claude/skills/create-task/SKILL.md`
2. `.claude/rules/shared/role-boundaries.md`
3. `.claude/rules/create/01-preflight.md`

This injected text is not a substitute for opening those source files. The first substantive task-design response must
begin exactly:
`TASK-DESIGN PREFLIGHT COMPLETE - loaded: create-task; create/01-preflight; shared/role-boundaries; selected Agent Contract fragments; rule index; QA profile.`

If any file is unavailable, return `BLOCKED` naming the path and stop. If the receipt was omitted or a file was unread,
discard all preliminary task-design conclusions and restart this gate before writing a kickoff or issuing a decision.

'@
}

$context = @"
$startupGate
Lero.al automatic orchestration router selected [$mode] from the submitted prompt. The canonical workflow below is injected for this turn. Follow it before giving a substantive result. The user does not need to repeat the workflow name.
For an existing cycle, resume its checkpoint under shared/orchestration-state.md. Valid unchanged current-session reads/receipts remain valid; injection does not restart completed review or request another go-ahead.

$body
"@

$partCount = [Math]::Ceiling($context.Length / $contextChunkSize)
if ($Part -gt $partCount) {
  exit 0
}

$offset = ($Part - 1) * $contextChunkSize
$length = [Math]::Min($contextChunkSize, $context.Length - $offset)
$contextPart = $context.Substring($offset, $length)
$additionalContext = "Lero.al automatic orchestration workflow [$mode]. Apply this compact parent workflow, then open each named phase file at its gate.`n`n$contextPart"

@{
  hookSpecificOutput = @{
    hookEventName = 'UserPromptSubmit'
    additionalContext = $additionalContext
  }
} | ConvertTo-Json -Depth 5 -Compress
