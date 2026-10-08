# Blocks a UI/Story source write until the ordered GR-0/GR-12 preflight exists in the real transcript.
#
# This is intentionally a phase gate, not an evidence substitute: it prevents an agent from silently jumping straight
# to an Edit/Write call or an obvious shell-based write. CI's check:ui-contract verifies the resulting repository
# state independently. The hook fails closed for an in-scope write when hook input or transcript evidence cannot be
# read.

[CmdletBinding()]
param(
    [switch]$VerifyGate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8

function Write-Deny([string]$Reason) {
    @{
        hookSpecificOutput = @{
            hookEventName           = 'PreToolUse'
            permissionDecision       = 'deny'
            permissionDecisionReason = $Reason
        }
    } | ConvertTo-Json -Depth 4 -Compress
}

function Test-UiSourcePath([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
    $projectRoot = [string]$env:CLAUDE_PROJECT_DIR
    if ($projectRoot -and $Path.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        $Path = $Path.Substring($projectRoot.Length)
    }
    $normalized = ($Path -replace '\\', '/').TrimStart('./').TrimStart('/').ToLowerInvariant()
    if ($normalized -match '(^|/)(?:__tests__|tests)/' -or $normalized -match '\.(?:test|spec)\.(?:ts|tsx)$') { return $false }
    return $normalized -match '^(?:src/stories/(?:mantine|patterns/mantine)/.+\.stories\.(?:ts|tsx)|src/design-system/(?:mantine|media)/.+\.(?:ts|tsx|css)|src/components/(?:admin|layout|shared)/.+\.(?:ts|tsx|css)|src/modules/[^/]+/components/.+\.(?:ts|tsx|css)|src/app/(?:\[locale\]|admin)/.+\.(?:ts|tsx|css))$'
}

function Get-ToolInputValues([object]$HookEvent) {
    # Hook events have different tool_input shapes. Under StrictMode an absent property is an exception, so access
    # optional fields only through PSObject.Properties. A shell event has `command` but deliberately has no
    # `file_path`; that is a normal read-only event, not a failed UI write preflight.
    $toolInputProperty = $HookEvent.PSObject.Properties['tool_input']
    if (-not $toolInputProperty -or -not $toolInputProperty.Value) {
        throw 'the hook event has no tool_input object'
    }
    $toolInput = $toolInputProperty.Value
    $path = ''
    foreach ($name in @('file_path', 'path')) {
        $property = $toolInput.PSObject.Properties[$name]
        if ($property -and $property.Value) {
            $path = [string]$property.Value
            break
        }
    }
    $commandProperty = $toolInput.PSObject.Properties['command']
    $command = if ($commandProperty -and $commandProperty.Value) { [string]$commandProperty.Value } else { '' }
    return [PSCustomObject]@{ Path = $path; Command = $command }
}

function Get-AssistantTranscript([object]$HookEvent) {
    $transcriptProperty = if ($HookEvent) { $HookEvent.PSObject.Properties['transcript_path'] } else { $null }
    $transcriptPath = if ($transcriptProperty -and $transcriptProperty.Value) { [string]$transcriptProperty.Value } else { '' }
    if (-not $transcriptPath -or -not (Test-Path -LiteralPath $transcriptPath)) {
        throw 'the transcript required to verify the ordered UI preflight is unavailable'
    }
    $parts = @()
    foreach ($line in Get-Content -LiteralPath $transcriptPath -Encoding UTF8) {
        try { $event = $line | ConvertFrom-Json } catch { continue }
        if ($event.type -ne 'assistant' -or -not $event.message.content) { continue }
        foreach ($block in $event.message.content) {
            if ($block.type -eq 'text' -and $block.text) { $parts += [string]$block.text }
        }
    }
    if ($parts.Count -eq 0) { throw 'the transcript contains no assistant text to prove the ordered UI preflight' }
    return ($parts -join "`n")
}

function Get-UiWriteBlockReason([string]$Path, [string]$Transcript) {
    if (-not (Test-UiSourcePath $Path)) { return $null }
    if ([string]::IsNullOrWhiteSpace($Transcript)) {
        return 'UI/Story write blocked: transcript preflight evidence is unavailable. Complete the ordered UI contract preflight before editing this file.'
    }

    # Keep this source ASCII-only. Windows PowerShell 5.1 can parse a UTF-8-without-BOM .ps1 as ANSI, so a literal
    # em dash in the regex would become mojibake even though the transcript itself is correctly read as UTF-8.
    $emDash = [string][char]0x2014
    $hasGr0 = $Transcript -match ('(?im)^\s*GR-0 CANONICAL REUSE PREFLIGHT\s*[' + $emDash + '-]')
    $hasUiContract = $Transcript -match '(?ims)^\s*UI CONTRACT PREFLIGHT COMPLETE\s*-\s*scope:\s*\S+.*?canonical owner:\s*\S+.*?token owner:\s*\S+.*?direct Story:\s*\S+'
    if (-not $hasGr0 -or -not $hasUiContract) {
        return 'UI/Story write blocked: first emit both the GR-0 CANONICAL REUSE PREFLIGHT receipt and `UI CONTRACT PREFLIGHT COMPLETE - scope: ...; canonical owner: ...; token owner: ...; direct Story: ...`. A missing token/owner/Story is BLOCKED - GR-12, not permission for a local value.'
    }

    if (($Path -replace '\\', '/') -match '/stories/(?:mantine|patterns/mantine)/.+\.stories\.(?:ts|tsx)$') {
        $hasStoryProof = $Transcript -match '(?im)^\s*STORYBOOK PROOF PREFLIGHT COMPLETE\s*-\s*'
        if (-not $hasStoryProof) {
            return 'Canonical Story write blocked: emit `STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: ...; production component: ...; allowed public states: ...; local presentation: NONE.` before editing. Stories may not repair appearance locally.'
        }
    }
    return $null
}

function Get-ShellUiWritePaths([string]$Command) {
    if ([string]::IsNullOrWhiteSpace($Command)) { return @() }
    # This runs only when a command both names an in-scope source path and contains a normal write primitive. The
    # narrow pairing avoids blocking read-only commands such as rg, git diff, or a test invocation that names source.
    $writePrimitive = '(?i)(?:\bapply_patch\b|\b(?:set|add)-content\b|\bout-file\b|\btee\b|\b(?:copy|move|remove|new)-item\b|\b(?:cp|mv|rm)\b|\b--fix\b|>>|(?<![=<>])>(?![=>]))'
    if ($Command -notmatch $writePrimitive) { return @() }
    $candidatePattern = '(?i)(?:[A-Z]:[\\/][^\s''""`|;<>]*?\\)?src[\\/][^\s''""`|;<>]+?\.(?:ts|tsx|css)'
    $paths = @()
    foreach ($match in [regex]::Matches($Command, $candidatePattern)) {
        $path = $match.Value.Trim('''""')
        if (Test-UiSourcePath $path) { $paths += $path }
    }
    return @($paths | Select-Object -Unique)
}

function Invoke-SelfTest {
    # Build the em dash at runtime: the test proves the UTF-8 transcript form, while the .ps1 source remains ASCII.
    $emDash = [string][char]0x2014
    $valid = @(
        "GR-0 CANONICAL REUSE PREFLIGHT $emDash request: Badge; decision: EXTEND.",
        'UI CONTRACT PREFLIGHT COMPLETE - scope: src/design-system/mantine/patterns/MantineBadge.tsx; canonical owner: src/design-system/mantine/patterns/MantineBadge.tsx; token owner: src/design-system/mantine/badgeTones.ts; direct Story: src/stories/mantine/primitives/Badge.stories.tsx.',
        'STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: src/stories/mantine/primitives/Badge.stories.tsx; production component: MantineBadge; allowed public states: tone,size; local presentation: NONE.'
    ) -join "`n"
    $cases = @(
        @{ Name = 'blocks missing receipts'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = ''; ExpectBlock = $true },
        @{ Name = 'allows component after GR-0 and UI contract receipts'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = $valid; ExpectBlock = $false },
        @{ Name = 'blocks Story without Storybook preflight'; Path = 'src/stories/mantine/primitives/Badge.stories.tsx'; Text = ($valid -replace '(?ms)^STORYBOOK.*?NONE\.\s*', ''); ExpectBlock = $true },
        @{ Name = 'allows Story after all receipts'; Path = 'src/stories/mantine/primitives/Badge.stories.tsx'; Text = $valid; ExpectBlock = $false },
        @{ Name = 'does not gate a unit test'; Path = 'src/design-system/mantine/__tests__/MantineBadge.test.tsx'; Text = ''; ExpectBlock = $false }
    )
    $ok = $true
    foreach ($case in $cases) {
        $blocked = $null -ne (Get-UiWriteBlockReason $case.Path $case.Text)
        $pass = $blocked -eq $case.ExpectBlock
        [Console]::Out.WriteLine(("{0} {1}" -f $(if ($pass) { 'GREEN' } else { 'FAIL ' }), $case.Name))
        $ok = $ok -and $pass
    }
    $shellHit = @(Get-ShellUiWritePaths 'Set-Content src/design-system/mantine/patterns/MantineBadge.tsx $value').Count -eq 1
    $shellMiss = @(Get-ShellUiWritePaths 'rg MantineBadge src/design-system/mantine/patterns/MantineBadge.tsx').Count -eq 0
    $shellEvent = '{"tool_input":{"command":"git status --short"}}' | ConvertFrom-Json
    $shellValues = Get-ToolInputValues $shellEvent
    $shellEventPass = [string]::IsNullOrEmpty($shellValues.Path) -and $shellValues.Command -eq 'git status --short'
    [Console]::Out.WriteLine("{0} detects an obvious shell-based UI write" -f $(if ($shellHit) { 'GREEN' } else { 'FAIL ' }))
    [Console]::Out.WriteLine("{0} does not gate a read-only shell command" -f $(if ($shellMiss) { 'GREEN' } else { 'FAIL ' }))
    [Console]::Out.WriteLine("{0} accepts a shell hook event with no file_path" -f $(if ($shellEventPass) { 'GREEN' } else { 'FAIL ' }))
    $ok = $ok -and $shellHit -and $shellMiss -and $shellEventPass
    [Console]::Out.WriteLine($(if ($ok) { 'phase-write-gate self-test PASSED' } else { 'phase-write-gate self-test FAILED' }))
    return $ok
}

if ($VerifyGate) {
    try { exit $(if (Invoke-SelfTest) { 0 } else { 1 }) }
    catch { Write-Error $_; exit 1 }
}

try {
    $inputJson = [Console]::In.ReadToEnd() | ConvertFrom-Json -ErrorAction Stop
    $toolValues = Get-ToolInputValues $inputJson
    $path = $toolValues.Path
    $paths = @()
    if (Test-UiSourcePath $path) { $paths += $path }
    $paths += Get-ShellUiWritePaths $toolValues.Command
    $paths = @($paths | Select-Object -Unique)
    if ($paths.Count -eq 0) { exit 0 }
    $transcript = Get-AssistantTranscript $inputJson
    foreach ($uiPath in $paths) {
        $reason = Get-UiWriteBlockReason $uiPath $transcript
        if ($reason) { Write-Deny $reason; break }
    }
}
catch {
    Write-Deny ("UI/Story write blocked because the phase gate could not verify its required receipts: " + $_.Exception.Message)
}
