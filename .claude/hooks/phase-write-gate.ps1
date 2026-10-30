# Blocks a UI/Story source write or active kickoff write until its ordered preflight exists in the real transcript.
#
# This is intentionally a phase gate, not an evidence substitute: it prevents an agent from silently jumping straight
# to an Edit/Write call or an obvious shell-based write. CI's check:ui-contract and check:kickoff-evidence verify the
# resulting repository state independently. The hook fails closed for an in-scope write when hook input or transcript
# evidence cannot be read.

[CmdletBinding()]
param(
    [switch]$VerifyGate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
. (Join-Path $PSScriptRoot 'phase-receipt-contract.ps1')

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
    return $normalized -match '^(?:src/(?:stories|components)/.+\.stories\.(?:ts|tsx)|src/design-system/(?:mantine|media)/.+\.(?:ts|tsx|css)|src/components/.+\.(?:ts|tsx|css)|src/modules/[^/]+/components/.+\.(?:ts|tsx|css)|src/app/(?:\[locale\]|admin)/.+\.(?:ts|tsx|css))$'
}

function Test-ActiveKickoffPath([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
    $projectRoot = [string]$env:CLAUDE_PROJECT_DIR
    if ($projectRoot -and $Path.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        $Path = $Path.Substring($projectRoot.Length)
    }
    $normalized = ($Path -replace '\\', '/').TrimStart('./').TrimStart('/').ToLowerInvariant()
    return $normalized -match '^tasks/(?!archive/).+kickoff.*\.md$'
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

function Get-RegisteredPhaseReceiptFromToolUse([object]$Block) {
    # A late preflight emitted as prose next to a tool call may be retained by Claude as empty-signature thinking,
    # not as readable assistant text. The explicit registration command below is a durable tool_use record instead.
    # Accept only the exact PowerShell helper invocation; arbitrary tool input or a shell comment cannot manufacture
    # a receipt. The helper itself validates the same receipt shape and writes no project state.
    if (-not $Block) { return '' }
    $typeProperty = $Block.PSObject.Properties['type']
    $nameProperty = $Block.PSObject.Properties['name']
    $inputProperty = $Block.PSObject.Properties['input']
    if (-not $typeProperty -or $typeProperty.Value -ne 'tool_use' -or -not $nameProperty -or $nameProperty.Value -ne 'PowerShell' -or -not $inputProperty -or -not $inputProperty.Value) {
        return ''
    }
    $commandProperty = $inputProperty.Value.PSObject.Properties['command']
    if (-not $commandProperty -or -not $commandProperty.Value) { return '' }

    # Required invocation, using single quotes around the receipt:
    # & .\.claude\hooks\emit-phase-receipt.ps1 -Kind <StorybookProof|KickoffEvidence|MobileAdaptation|CanonicalReuse|UiContract> -Receipt '<exact receipt>'
    # A PowerShell single-quoted literal represents an embedded apostrophe as two adjacent apostrophes. Preserve
    # that normal language in a registered receipt instead of treating it as the end of the literal.
    $registrationPattern = '(?is)^\s*&\s+(?:\.[\\/])?\.claude[\\/]hooks[\\/]emit-phase-receipt\.ps1\s+-Kind\s+(?<kind>StorybookProof|KickoffEvidence|MobileAdaptation|CanonicalReuse|UiContract)\s+-Receipt\s+''(?<receipt>(?:''''|[^''])+)''\s*$'
    $match = [regex]::Match([string]$commandProperty.Value, $registrationPattern)
    if (-not $match.Success) { return '' }
    $kind = [string]$match.Groups['kind'].Value
    $receipt = ([string]$match.Groups['receipt'].Value).Replace("''", "'")
    if ($kind -eq 'StorybookProof') {
        $storybookPattern = '(?im)^\s*STORYBOOK PROOF PREFLIGHT COMPLETE\s*-\s*direct Story:\s*[^;\r\n]+\s*;\s*production component:\s*[^;\r\n]+\s*;\s*allowed public states:\s*[^;\r\n]+\s*;\s*local presentation:\s*NONE\.?\s*$'
        if ($receipt -notmatch $storybookPattern) { return '' }
    }
    elseif ($kind -eq 'KickoffEvidence') {
        $emDash = [string][char]0x2014
        $kickoffPattern = '(?ims)^\s*KICKOFF EVIDENCE PREFLIGHT COMPLETE\s*[' + $emDash + '-]\s*claims:\s*C\d+.*?owner decisions:\s*(?:D\d+(?:\s*,\s*D\d+)*|NONE).*?blocked claims:\s*NONE\s*\.'
        if ($receipt -notmatch $kickoffPattern) { return '' }
    }
    elseif ($kind -eq 'MobileAdaptation') {
        if (-not [regex]::IsMatch($receipt, (Get-MobileAdaptationReceiptPattern))) { return '' }
    }
    elseif ($kind -eq 'CanonicalReuse') {
        if (-not [regex]::IsMatch($receipt, (Get-CanonicalReuseReceiptPattern))) { return '' }
    }
    elseif ($kind -eq 'UiContract') {
        if (-not [regex]::IsMatch($receipt, (Get-UiContractReceiptPattern))) { return '' }
    }
    else {
        return ''
    }
    return $receipt
}

function Get-AssistantTranscript([object]$HookEvent) {
    $transcriptProperty = if ($HookEvent) { $HookEvent.PSObject.Properties['transcript_path'] } else { $null }
    $transcriptPath = if ($transcriptProperty -and $transcriptProperty.Value) { [string]$transcriptProperty.Value } else { '' }
    if (-not $transcriptPath -or -not (Test-Path -LiteralPath $transcriptPath)) {
        throw 'the transcript required to verify the ordered UI preflight is unavailable'
    }
    $parts = New-Object System.Collections.Generic.List[string]
    # Stream the transcript (it can exceed 300 MB) without locking it against the client's appends. Evidence is only
    # assistant text (a text block or string content) or an emit-phase-receipt tool_use, so a line lacking those literals is skipped before JSON
    # parsing; a skipped line can only remove evidence, never add it, and every parsed line is still fully checked below.
    $stream = [System.IO.File]::Open($transcriptPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]'ReadWrite, Delete')
    $reader = New-Object System.IO.StreamReader($stream, $utf8)
    try {
        while ($null -ne ($line = $reader.ReadLine())) {
            if ($line.IndexOf('"assistant"', [System.StringComparison]::Ordinal) -lt 0) { continue }
            if ($line.IndexOf('"type":"text"', [System.StringComparison]::Ordinal) -lt 0 -and
                $line.IndexOf('"content":"', [System.StringComparison]::Ordinal) -lt 0 -and
                $line.IndexOf('emit-phase-receipt', [System.StringComparison]::Ordinal) -lt 0) { continue }
            try { $event = $line | ConvertFrom-Json } catch { continue }
            $eventTypeProperty = $event.PSObject.Properties['type']
            $messageProperty = $event.PSObject.Properties['message']
            if (-not $eventTypeProperty -or $eventTypeProperty.Value -ne 'assistant' -or -not $messageProperty -or -not $messageProperty.Value) { continue }
            $contentProperty = $messageProperty.Value.PSObject.Properties['content']
            if (-not $contentProperty -or -not $contentProperty.Value) { continue }
            $content = $contentProperty.Value
            if ($content -is [string]) {
                $parts.Add($content)
                continue
            }
            foreach ($block in @($content)) {
                if ($block -is [string]) {
                    $parts.Add($block)
                    continue
                }
                $blockTypeProperty = $block.PSObject.Properties['type']
                $blockTextProperty = $block.PSObject.Properties['text']
                if ($blockTypeProperty -and $blockTypeProperty.Value -eq 'text' -and $blockTextProperty -and $blockTextProperty.Value) {
                    $parts.Add([string]$blockTextProperty.Value)
                    continue
                }
                $registeredReceipt = Get-RegisteredPhaseReceiptFromToolUse $block
                if ($registeredReceipt) {
                    $parts.Add([string]$registeredReceipt)
                }
            }
        }
    } finally {
        $reader.Dispose()
    }
    # No retained text or registration is a normal missing-receipt state: the phase checks then name the exact
    # registration commands instead of failing with an opaque transcript error.
    return [string]::Join("`n", $parts)
}

function ConvertTo-NormalizedProjectPath([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) { return '' }
    $projectRoot = [string]$env:CLAUDE_PROJECT_DIR
    if ($projectRoot -and $Path.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        $Path = $Path.Substring($projectRoot.Length)
    }
    return ($Path -replace '\\', '/').TrimStart('./').TrimStart('/').ToLowerInvariant()
}

function Test-StorybookProofPreflight([string]$Transcript, [string]$StoryPath) {
    if ([string]::IsNullOrWhiteSpace($Transcript) -or [string]::IsNullOrWhiteSpace($StoryPath)) { return $false }
    $targetPath = ConvertTo-NormalizedProjectPath $StoryPath
    if (-not $targetPath) { return $false }
    $pattern = '(?im)^\s*STORYBOOK PROOF PREFLIGHT COMPLETE\s*-\s*direct Story:\s*([^;\r\n]+?)\s*;\s*production component:\s*[^;\r\n]+\s*;\s*allowed public states:\s*[^;\r\n]+\s*;\s*local presentation:\s*NONE\.?\s*$'
    foreach ($match in [regex]::Matches($Transcript, $pattern)) {
        $declaredStories = @($match.Groups[1].Value -split '\s*,\s*')
        foreach ($declaredStory in $declaredStories) {
            if ((ConvertTo-NormalizedProjectPath $declaredStory) -eq $targetPath) { return $true }
        }
    }
    return $false
}

function Normalize-KickoffReceiptMarkdown([string]$Transcript) {
    if ([string]::IsNullOrWhiteSpace($Transcript)) { return $Transcript }

    # Claude normally records text exactly as rendered. A receipt may therefore be nested in Markdown: quote, list,
    # task-list, heading, bold/italic, or inline-code wrappers. Strip only a sequence of those structural wrappers
    # when it immediately precedes this exact receipt label. Claims/decision fields remain mandatory, and a label
    # merely mentioned inside arbitrary prose does not become a receipt.
    $markdownToken = '(?:(?:>[ \t]*)|(?:[-+*][ \t]+(?:\[[ xX]\][ \t]+)?)|(?:\d+[.)][ \t]+)|(?:#{1,6}[ \t]+)|(?:(?:\*{1,3}|_{1,3}|`{1,3})[ \t]*))'
    $markdownReceiptPrefix = '(?m)^[ \t]*(?:' + $markdownToken + ')*(?=KICKOFF EVIDENCE PREFLIGHT COMPLETE\b)'
    return [regex]::Replace($Transcript, $markdownReceiptPrefix, '')
}

function Get-MobileAdaptationRegistry {
    $projectRoot = [string]$env:CLAUDE_PROJECT_DIR
    if (-not $projectRoot) { $projectRoot = (Get-Location).Path }
    $registryPath = Join-Path $projectRoot 'scripts/mobile-adaptation-patterns.json'
    if (-not (Test-Path -LiteralPath $registryPath)) {
        throw 'scripts/mobile-adaptation-patterns.json is unavailable'
    }
    $registry = Get-Content -LiteralPath $registryPath -Raw -Encoding UTF8 | ConvertFrom-Json -ErrorAction Stop
    if ($registry.version -ne 3 -or -not $registry.mantine -or -not $registry.mantine.mechanisms -or -not $registry.standards -or -not $registry.patterns -or -not $registry.componentFamilies) {
        throw 'scripts/mobile-adaptation-patterns.json has no valid version-3 mobile adaptation registry'
    }
    return $registry
}

function Get-MobileAdaptationPatternIds([object]$Registry) {
    $ids = @($Registry.patterns | ForEach-Object { [string]$_.id } | Where-Object { $_ -match '^[a-z][a-z0-9-]*$' })
    if ($ids.Count -eq 0 -or $ids.Count -ne @($Registry.patterns).Count -or $ids.Count -ne @($ids | Select-Object -Unique).Count) {
        throw 'scripts/mobile-adaptation-patterns.json has an invalid pattern ID'
    }
    return $ids
}

function Get-MobileAdaptationFamilyIds([object]$Registry) {
    $ids = @($Registry.componentFamilies | ForEach-Object { [string]$_.id } | Where-Object { $_ -match '^[a-z][a-z0-9-]*$' })
    if ($ids.Count -eq 0 -or $ids.Count -ne @($Registry.componentFamilies).Count -or $ids.Count -ne @($ids | Select-Object -Unique).Count) {
        throw 'scripts/mobile-adaptation-patterns.json has an invalid component family ID'
    }
    return $ids
}

function Get-MobileAdaptationMantineMechanismIds([object]$Registry) {
    $ids = @($Registry.mantine.mechanisms | ForEach-Object { [string]$_.id } | Where-Object { $_ -match '^[a-z][a-z0-9-]*$' })
    if ($ids.Count -eq 0 -or $ids.Count -ne @($Registry.mantine.mechanisms).Count -or $ids.Count -ne @($ids | Select-Object -Unique).Count) {
        throw 'scripts/mobile-adaptation-patterns.json has an invalid Mantine mechanism ID'
    }
    return $ids
}

function Test-MobileAdaptationReceipt(
    [System.Text.RegularExpressions.Match]$Match,
    [object]$Registry,
    [string[]]$AllowedPatterns,
    [string[]]$AllowedFamilies,
    [string[]]$AllowedMantineMechanisms
) {
    $selectedFamilies = @($match.Groups[1].Value -split '\s*,\s*')
    $selectedPatterns = @($match.Groups[2].Value -split '\s*,\s*')
    $selectedStandards = @($match.Groups[3].Value -split '\s*,\s*')
    $selectedMantineMechanisms = @($match.Groups[4].Value -split '\s*,\s*')
    $selectedMantineOwner = [string]$match.Groups[5].Value
    if (@($selectedFamilies | Where-Object { $_ -notin $AllowedFamilies }).Count -gt 0 -or @($selectedPatterns | Where-Object { $_ -notin $AllowedPatterns }).Count -gt 0 -or @($selectedMantineMechanisms | Where-Object { $_ -notin $AllowedMantineMechanisms }).Count -gt 0) { return $false }
    $selectedFamilyObjects = @($Registry.componentFamilies | Where-Object { $_.id -in $selectedFamilies })
    $familyPatterns = @($selectedFamilyObjects | ForEach-Object { $_.patternIds } | ForEach-Object { [string]$_ })
    if (@($selectedPatterns | Where-Object { $_ -notin $familyPatterns }).Count -gt 0) { return $false }
    $familyMantineMechanisms = @($selectedFamilyObjects | ForEach-Object { $_.mantineMechanismIds } | ForEach-Object { [string]$_ })
    if (@($selectedMantineMechanisms | Where-Object { $_ -notin $familyMantineMechanisms }).Count -gt 0) { return $false }
    $familyOwners = @($selectedFamilyObjects | ForEach-Object { $_.members } | ForEach-Object { [string]$_ })
    if ($selectedMantineOwner -notin $familyOwners) { return $false }
    $standardIds = @($Registry.standards | ForEach-Object { [string]$_.id })
    $requiredStandards = @($Registry.patterns | Where-Object { $_.id -in $selectedPatterns } | ForEach-Object { $_.sourceIds } | ForEach-Object { [string]$_ })
    return @($selectedStandards | Where-Object { $_ -notin $standardIds }).Count -eq 0 -and @($requiredStandards | Where-Object { $_ -notin $selectedStandards }).Count -eq 0
}

function Test-MobileAdaptationPreflight([string]$Transcript) {
    if ([string]::IsNullOrWhiteSpace($Transcript)) { return $false }
    $matches = [regex]::Matches($Transcript, (Get-MobileAdaptationReceiptPattern))
    if ($matches.Count -eq 0) { return $false }

    $registry = Get-MobileAdaptationRegistry
    $allowedPatterns = Get-MobileAdaptationPatternIds $registry
    $allowedFamilies = Get-MobileAdaptationFamilyIds $registry
    $allowedMantineMechanisms = Get-MobileAdaptationMantineMechanismIds $registry

    # A transcript is append-only. Validate every complete candidate newest first so a corrected receipt can recover
    # from an earlier malformed one. Invalid candidates never count as proof; we accept only a fully valid receipt.
    for ($index = $matches.Count - 1; $index -ge 0; $index--) {
        if (Test-MobileAdaptationReceipt $matches[$index] $registry $allowedPatterns $allowedFamilies $allowedMantineMechanisms) {
            return $true
        }
    }
    return $false
}

function Get-UiWriteBlockReason([string]$Path, [string]$Transcript) {
    if (-not (Test-UiSourcePath $Path)) { return $null }
    if ($null -eq $Transcript) { $Transcript = '' }

    # Prose written beside a tool call is usually stored as empty thinking, not as a text block, so each receipt is
    # normally present only as its registered emit-phase-receipt tool_use (added to the transcript text above).
    $hasGr0 = $Transcript -match (Get-CanonicalReuseReceiptPattern)
    $hasUiContract = $Transcript -match (Get-UiContractReceiptPattern)
    $hasMobileAdaptation = Test-MobileAdaptationPreflight $Transcript
    if (-not $hasGr0 -or -not $hasUiContract -or -not $hasMobileAdaptation) {
        $missing = @()
        if (-not $hasGr0) { $missing += 'CanonicalReuse (GR-0)' }
        if (-not $hasUiContract) { $missing += 'UiContract' }
        if (-not $hasMobileAdaptation) { $missing += 'MobileAdaptation (absent, malformed or incompatible with scripts/mobile-adaptation-patterns.json)' }
        return ('UI/Story write blocked; missing valid receipt: ' + ($missing -join ', ') + '. Register each through the PowerShell tool, the helper call being the only statement of the command (no Set-Location or other prefix); prose beside a tool call is not durable evidence. `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind CanonicalReuse -Receipt ''GR-0 CANONICAL REUSE PREFLIGHT - request: ...; semantic queries: ...; inspected candidates: ...; decision: REUSE | EXTEND | COMPOSE | CREATE; selected canonical owner: ...; Mantine/TailAdmin token path: ...; new hardcoded visual values: NONE; rationale: ....''` `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind UiContract -Receipt ''UI CONTRACT PREFLIGHT COMPLETE - scope: ...; canonical owner: ...; token owner: ...; direct Story: ....''` `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind MobileAdaptation -Receipt ''MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: ...; component families: <IDs from scripts/mobile-adaptation-patterns.json>; pattern IDs: <allowed IDs from those families>; standards: <all required source IDs>; mantine mechanism: <allowed registry ID>; mantine owner: <one canonical selected-family path>; mobile range: <640px (theme.other.mobileGate / sm); mobile order: ...; required content: no semantic loss; verification: <direct Story> across actual <640px thresholds and the 640px transition x <locales>.''`. A corrected valid receipt supersedes an earlier invalid one. A missing token/owner/Story/pattern/Mantine mechanism is BLOCKED, not permission for a local value.')
    }

    if (($Path -replace '\\', '/') -match '(?i)(?:^|/)src/(?:stories|components)/.+\.stories\.(?:ts|tsx)$') {
        $hasStoryProof = Test-StorybookProofPreflight $Transcript $Path
        if (-not $hasStoryProof) {
            return 'Canonical Story write blocked: register a Story-specific proof before editing. Run the PowerShell tool command `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind StorybookProof -Receipt ''STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: <this Story path>; production component: <name>; allowed public states: <typed props>; local presentation: NONE.''`. The registration command is durable transcript evidence, not a bypass; its direct Story must include the file being changed. Stories may not repair appearance locally.'
        }
    }
    return $null
}

function Get-KickoffWriteBlockReason([string]$Path, [string]$Transcript) {
    if (-not (Test-ActiveKickoffPath $Path)) { return $null }
    if ($null -eq $Transcript) { $Transcript = '' }

    # Keep this source ASCII-only for Windows PowerShell 5.1; the transcript itself is explicitly decoded as UTF-8.
    $emDash = [string][char]0x2014
    $normalizedTranscript = Normalize-KickoffReceiptMarkdown $Transcript
    $receiptPattern = '(?ims)^\s*KICKOFF EVIDENCE PREFLIGHT COMPLETE\s*[' + $emDash + '-]\s*claims:\s*C\d+.*?owner decisions:\s*(?:D\d+(?:\s*,\s*D\d+)*|NONE).*?blocked claims:\s*NONE\s*\.'
    if ($normalizedTranscript -notmatch $receiptPattern) {
        return ('Kickoff write blocked: register valid evidence through the PowerShell tool: `& .\.claude\hooks\emit-phase-receipt.ps1 -Kind KickoffEvidence -Receipt ''KICKOFF EVIDENCE PREFLIGHT COMPLETE ' + $emDash + ' claims: C1, ...; owner decisions: D1, ... | NONE; blocked claims: NONE.''`. A prose receipt next to a tool call is not durable evidence. Every material premise needs a current C# source/range/literal or a dated D# owner decision. Do not draft an executable route from an inference.')
    }
    return $null
}

function Remove-NonFileRedirections([string]$Command) {
    # `2>/dev/null`, `2>$null`, `> nul` and `2>&1` discard or merge a stream; they write no file. Removing only those
    # exact forms keeps every redirection to a real path in scope.
    return [regex]::Replace($Command, '(?i)\d?>{1,2}\s*(?:&\d|/dev/null(?![\w./])|\$null(?![\w.])|nul(?![\w./]))', ' ')
}

function Get-ShellUiWritePaths([string]$Command) {
    if ([string]::IsNullOrWhiteSpace($Command)) { return @() }
    # This runs only when a command both names an in-scope source path and contains a normal write primitive. The
    # narrow pairing avoids blocking read-only commands such as rg, git diff, or a test invocation that names source.
    $writePrimitive = '(?i)(?:\bapply_patch\b|\b(?:set|add)-content\b|\bout-file\b|\btee\b|\b(?:copy|move|remove|new)-item\b|\b(?:cp|mv|rm)\b|\b--fix\b|>>|(?<![=<>])>(?![=>]))'
    if ((Remove-NonFileRedirections $Command) -notmatch $writePrimitive) { return @() }
    $candidatePattern = '(?i)(?:[A-Z]:[\\/][^\s''""`|;<>]*?\\)?src[\\/][^\s''""`|;<>]+?\.(?:ts|tsx|css)'
    $paths = @()
    foreach ($match in [regex]::Matches($Command, $candidatePattern)) {
        $path = $match.Value.Trim('''""')
        if (Test-UiSourcePath $path) { $paths += $path }
    }
    return @($paths | Select-Object -Unique)
}

function Get-ShellKickoffWritePaths([string]$Command) {
    if ([string]::IsNullOrWhiteSpace($Command)) { return @() }
    $writePrimitive = '(?i)(?:\bapply_patch\b|\b(?:set|add)-content\b|\bout-file\b|\btee\b|\b(?:copy|move|remove|new)-item\b|\b(?:cp|mv|rm)\b|>>|(?<![=<>])>(?![=>]))'
    if ((Remove-NonFileRedirections $Command) -notmatch $writePrimitive) { return @() }
    $candidatePattern = '(?i)(?:[A-Z]:[\\/][^\s''""`|;<>]*?\\)?tasks[\\/][^\s''""`|;<>]*?kickoff[^\s''""`|;<>]*?\.md'
    $paths = @()
    foreach ($match in [regex]::Matches($Command, $candidatePattern)) {
        $path = $match.Value.Trim('''""')
        if (Test-ActiveKickoffPath $path) { $paths += $path }
    }
    return @($paths | Select-Object -Unique)
}

function Invoke-SelfTest {
    # Build the em dash at runtime: the test proves the UTF-8 transcript form, while the .ps1 source remains ASCII.
    $emDash = [string][char]0x2014
    # Regression: an ordered mobile sequence may naturally use semicolons. The next named field, not arbitrary
    # punctuation, terminates `mobile order`.
    $mobileReceipt = 'MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: src/design-system/mantine/patterns/MantineBadge.tsx status control; component families: inline-status-and-utility-control; pattern IDs: inline-control; standards: w3c-target-size, apple-hig-menus, android-layout-navigation; mantine mechanism: responsive-props; mantine owner: src/design-system/mantine/patterns/MantineBadge.tsx; mobile range: <640px (theme.other.mobileGate / sm); mobile order: label then operation''s status; secondary context below; required content: no semantic loss; verification: src/stories/mantine/primitives/Badge.stories.tsx across actual <640px thresholds and the 640px transition x sq,en,uk,it.'
    $storybookReceipt = 'STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: src/stories/mantine/primitives/Badge.stories.tsx; production component: MantineBadge; allowed public states: tone,size; local presentation: NONE.'
    $gr0Receipt = "GR-0 CANONICAL REUSE PREFLIGHT $emDash request: Badge status tone; semantic queries: badge tone; inspected candidates: src/design-system/mantine/patterns/MantineBadge.tsx; decision: EXTEND; selected canonical owner: src/design-system/mantine/patterns/MantineBadge.tsx; Mantine/TailAdmin token path: src/design-system/mantine/badgeTones.ts; new hardcoded visual values: NONE; rationale: the owner already renders the tone."
    $uiContractReceipt = 'UI CONTRACT PREFLIGHT COMPLETE - scope: src/design-system/mantine/patterns/MantineBadge.tsx; canonical owner: src/design-system/mantine/patterns/MantineBadge.tsx; token owner: src/design-system/mantine/badgeTones.ts; direct Story: src/stories/mantine/primitives/Badge.stories.tsx.'
    $valid = @(
        $gr0Receipt,
        $uiContractReceipt,
        $mobileReceipt,
        $storybookReceipt
    ) -join "`n"
    $gr0Stop = $gr0Receipt -replace 'decision: EXTEND', 'decision: STOP'
    $gr0WithHardcode = $gr0Receipt -replace 'new hardcoded visual values: NONE', 'new hardcoded visual values: 12px gap'
    $validWithoutStorybookProof = $valid -replace [regex]::Escape($storybookReceipt), ''
    $validWithoutMobileAndStorybookProof = $validWithoutStorybookProof -replace [regex]::Escape($mobileReceipt), ''
    $registeredStorybookCommand = "& .\.claude\hooks\emit-phase-receipt.ps1 -Kind StorybookProof -Receipt '$storybookReceipt'"
    $escapedMobileReceipt = $mobileReceipt.Replace("'", "''")
    $registeredMobileCommand = "& .\.claude\hooks\emit-phase-receipt.ps1 -Kind MobileAdaptation -Receipt '$escapedMobileReceipt'"
    $wrongStorybookReceipt = $storybookReceipt -replace 'src/stories/mantine/primitives/Badge\.stories\.tsx', 'src/stories/mantine/primitives/Table.stories.tsx'
    # This is deliberately a syntactically complete receipt with two owners. The registry requires exactly one owner;
    # the next test proves that a later corrected receipt is accepted instead of permanently poisoning the session.
    $multiOwnerMobileReceipt = $mobileReceipt -replace 'mantine owner: src/design-system/mantine/patterns/MantineBadge\.tsx;', 'mantine owner: src/design-system/mantine/patterns/MantineBadge.tsx, src/design-system/mantine/patterns/MantineDataTableToCards.tsx;'
    $mobileReceiptWithoutNamedTerminator = $mobileReceipt -replace '; required content:', '; content treatment:'
    $validAfterBadMobileReceipt = $valid -replace [regex]::Escape($mobileReceipt), ($multiOwnerMobileReceipt + "`n" + $mobileReceipt)
    $kickoffReceipt = "KICKOFF EVIDENCE PREFLIGHT COMPLETE $emDash claims: C1; owner decisions: D1; blocked claims: NONE."
    $registeredKickoffCommand = "& .\.claude\hooks\emit-phase-receipt.ps1 -Kind KickoffEvidence -Receipt '$kickoffReceipt'"
    $malformedKickoffCommand = "& .\.claude\hooks\emit-phase-receipt.ps1 -Kind KickoffEvidence -Receipt 'KICKOFF EVIDENCE PREFLIGHT COMPLETE - claims: NONE; owner decisions: NONE; blocked claims: NONE.'"
    $malformedMobileCommand = "& .\.claude\hooks\emit-phase-receipt.ps1 -Kind MobileAdaptation -Receipt 'MOBILE ADAPTATION PREFLIGHT COMPLETE - invalid'"
    $transcriptPath = New-TemporaryFile
    try {
        $transcriptEvents = @(
            [PSCustomObject]@{ type = 'assistant'; message = [PSCustomObject]@{ content = 'String transcript text is retained.' } },
            [PSCustomObject]@{ type = 'assistant'; message = [PSCustomObject]@{ content = @([PSCustomObject]@{ type = 'text'; text = 'Structured transcript text is retained.' }) } },
            [PSCustomObject]@{ type = 'assistant'; message = [PSCustomObject]@{ content = $validWithoutMobileAndStorybookProof } },
            [PSCustomObject]@{ type = 'assistant'; message = [PSCustomObject]@{ content = @([PSCustomObject]@{ type = 'tool_use'; name = 'PowerShell'; input = [PSCustomObject]@{ command = $registeredMobileCommand } }) } },
            [PSCustomObject]@{ type = 'assistant'; message = [PSCustomObject]@{ content = @([PSCustomObject]@{ type = 'tool_use'; name = 'PowerShell'; input = [PSCustomObject]@{ command = $registeredStorybookCommand } }) } },
            [PSCustomObject]@{ type = 'assistant'; message = [PSCustomObject]@{ content = @([PSCustomObject]@{ type = 'tool_use'; name = 'PowerShell'; input = [PSCustomObject]@{ command = $registeredKickoffCommand } }) } }
        )
        $transcriptJsonl = (($transcriptEvents | ForEach-Object { $_ | ConvertTo-Json -Compress -Depth 4 }) -join "`n") + "`n"
        [System.IO.File]::WriteAllText($transcriptPath.FullName, $transcriptJsonl, (New-Object System.Text.UTF8Encoding($false)))
        $parsedTranscript = Get-AssistantTranscript ([PSCustomObject]@{ transcript_path = $transcriptPath.FullName })
        $registeredMobilePass = Test-MobileAdaptationPreflight $parsedTranscript
        $registeredStoryProofPass = Test-StorybookProofPreflight $parsedTranscript 'src/stories/mantine/primitives/Badge.stories.tsx'
        $wrongToolBlock = [PSCustomObject]@{ type = 'tool_use'; name = 'Bash'; input = [PSCustomObject]@{ command = $registeredStorybookCommand } }
        $rejectsWrongToolPass = -not (Get-RegisteredPhaseReceiptFromToolUse $wrongToolBlock)
        $malformedKickoffBlock = [PSCustomObject]@{ type = 'tool_use'; name = 'PowerShell'; input = [PSCustomObject]@{ command = $malformedKickoffCommand } }
        $rejectsMalformedKickoffPass = -not (Get-RegisteredPhaseReceiptFromToolUse $malformedKickoffBlock)
        $malformedMobileBlock = [PSCustomObject]@{ type = 'tool_use'; name = 'PowerShell'; input = [PSCustomObject]@{ command = $malformedMobileCommand } }
        $rejectsMalformedMobilePass = -not (Get-RegisteredPhaseReceiptFromToolUse $malformedMobileBlock)
        $registeredKickoffPass = $null -eq (Get-KickoffWriteBlockReason 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md' $parsedTranscript)
        $transcriptShapePass = $parsedTranscript -match 'KICKOFF EVIDENCE PREFLIGHT COMPLETE' -and $parsedTranscript -match 'String transcript text is retained\.' -and $parsedTranscript -match 'Structured transcript text is retained\.' -and $registeredMobilePass -and $registeredStoryProofPass -and $registeredKickoffPass -and $rejectsWrongToolPass -and $rejectsMalformedKickoffPass -and $rejectsMalformedMobilePass
        [Console]::Out.WriteLine(('{0} transcript parser accepts text and registered Mobile/Storybook/Kickoff proofs' -f $(if ($transcriptShapePass) { 'GREEN' } else { 'FAIL ' })))

        # Regression (Task 923, 2026-10-18): prose next to a tool call was stored as empty thinking, so GR-0 and the UI
        # contract had no durable form. A transcript holding only registrations, with no assistant text, must pass.
        $registeredGr0Command = "& .\.claude\hooks\emit-phase-receipt.ps1 -Kind CanonicalReuse -Receipt '$gr0Receipt'"
        $registeredUiContractCommand = "& .\.claude\hooks\emit-phase-receipt.ps1 -Kind UiContract -Receipt '$uiContractReceipt'"
        $prefixedUiContractCommand = "Set-Location C:\repo`n" + $registeredUiContractCommand
        $registeredOnlyEvents = @(
            [PSCustomObject]@{ type = 'assistant'; message = [PSCustomObject]@{ content = @([PSCustomObject]@{ type = 'thinking'; thinking = ''; signature = 'x' }) } },
            [PSCustomObject]@{ type = 'assistant'; message = [PSCustomObject]@{ content = @([PSCustomObject]@{ type = 'tool_use'; name = 'PowerShell'; input = [PSCustomObject]@{ command = $registeredGr0Command } }) } },
            [PSCustomObject]@{ type = 'assistant'; message = [PSCustomObject]@{ content = @([PSCustomObject]@{ type = 'tool_use'; name = 'PowerShell'; input = [PSCustomObject]@{ command = $registeredUiContractCommand } }) } },
            [PSCustomObject]@{ type = 'assistant'; message = [PSCustomObject]@{ content = @([PSCustomObject]@{ type = 'tool_use'; name = 'PowerShell'; input = [PSCustomObject]@{ command = $registeredMobileCommand } }) } }
        )
        $registeredOnlyJsonl = (($registeredOnlyEvents | ForEach-Object { $_ | ConvertTo-Json -Compress -Depth 5 }) -join "`n") + "`n"
        [System.IO.File]::WriteAllText($transcriptPath.FullName, $registeredOnlyJsonl, (New-Object System.Text.UTF8Encoding($false)))
        $registeredOnlyTranscript = Get-AssistantTranscript ([PSCustomObject]@{ transcript_path = $transcriptPath.FullName })
        $prefixedBlock = [PSCustomObject]@{ type = 'tool_use'; name = 'PowerShell'; input = [PSCustomObject]@{ command = $prefixedUiContractCommand } }
        $rejectsPrefixedPass = -not (Get-RegisteredPhaseReceiptFromToolUse $prefixedBlock)
        $stopBlock = [PSCustomObject]@{ type = 'tool_use'; name = 'PowerShell'; input = [PSCustomObject]@{ command = "& .\.claude\hooks\emit-phase-receipt.ps1 -Kind CanonicalReuse -Receipt '$gr0Stop'" } }
        $rejectsStopRegistrationPass = -not (Get-RegisteredPhaseReceiptFromToolUse $stopBlock)
        $emptyTranscriptEvents = [PSCustomObject]@{ type = 'assistant'; message = [PSCustomObject]@{ content = @([PSCustomObject]@{ type = 'thinking'; thinking = ''; signature = 'x' }) } }
        [System.IO.File]::WriteAllText($transcriptPath.FullName, (($emptyTranscriptEvents | ConvertTo-Json -Compress -Depth 5) + "`n"), (New-Object System.Text.UTF8Encoding($false)))
        $emptyReason = Get-UiWriteBlockReason 'src/design-system/mantine/patterns/MantineBadge.tsx' (Get-AssistantTranscript ([PSCustomObject]@{ transcript_path = $transcriptPath.FullName }))
        $emptyNamesCommandsPass = $emptyReason -and $emptyReason -match '-Kind CanonicalReuse' -and $emptyReason -match '-Kind UiContract' -and $emptyReason -match '-Kind MobileAdaptation'
        $registeredOnlyPass = ($null -eq (Get-UiWriteBlockReason 'src/design-system/mantine/patterns/MantineBadge.tsx' $registeredOnlyTranscript)) -and $rejectsPrefixedPass -and $rejectsStopRegistrationPass -and $emptyNamesCommandsPass
        [Console]::Out.WriteLine(('{0} registered GR-0/UI contract/mobile receipts alone authorize a UI write; prefixed or STOP registrations do not; an empty transcript names every command' -f $(if ($registeredOnlyPass) { 'GREEN' } else { 'FAIL ' })))
        $transcriptShapePass = $transcriptShapePass -and $registeredOnlyPass
    }
    finally {
        Remove-Item -LiteralPath $transcriptPath.FullName -Force -ErrorAction SilentlyContinue
    }
    $cases = @(
        @{ Name = 'blocks missing receipts'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = ''; ExpectBlock = $true },
        @{ Name = 'blocks a GR-0 STOP decision'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = ($valid -replace [regex]::Escape($gr0Receipt), $gr0Stop); ExpectBlock = $true },
        @{ Name = 'blocks a GR-0 receipt with a new hardcoded value'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = ($valid -replace [regex]::Escape($gr0Receipt), $gr0WithHardcode); ExpectBlock = $true },
        @{ Name = 'blocks a GR-0 label without its fields'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = ($valid -replace [regex]::Escape($gr0Receipt), "GR-0 CANONICAL REUSE PREFLIGHT $emDash request: Badge; decision: EXTEND."); ExpectBlock = $true },
        @{ Name = 'blocks component without mobile adaptation preflight'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = ($valid -replace '(?ms)^MOBILE ADAPTATION.*?\r?\n', ''); ExpectBlock = $true },
        @{ Name = 'blocks incompatible Mantine mechanism'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = ($valid -replace 'mantine mechanism: responsive-props', 'mantine mechanism: app-shell-responsive'); ExpectBlock = $true },
        @{ Name = 'blocks incompatible Mantine owner'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = ($valid -replace 'mantine owner: src/design-system/mantine/patterns/MantineBadge.tsx', 'mantine owner: src/design-system/mantine/patterns/MantineDataTableToCards.tsx'); ExpectBlock = $true },
        @{ Name = 'blocks a multi-owner mobile receipt'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = ($valid -replace [regex]::Escape($mobileReceipt), $multiOwnerMobileReceipt); ExpectBlock = $true },
        @{ Name = 'blocks a mobile receipt without its required named terminator'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = ($valid -replace [regex]::Escape($mobileReceipt), $mobileReceiptWithoutNamedTerminator); ExpectBlock = $true },
        @{ Name = 'allows correction after an invalid mobile receipt'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = $validAfterBadMobileReceipt; ExpectBlock = $false },
        @{ Name = 'allows component after registered mobile adaptation receipt'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = $parsedTranscript; ExpectBlock = $false },
        @{ Name = 'allows component after GR-0 and UI contract receipts'; Path = 'src/design-system/mantine/patterns/MantineBadge.tsx'; Text = $valid; ExpectBlock = $false },
        @{ Name = 'blocks Story without Storybook preflight'; Path = 'src/stories/mantine/primitives/Badge.stories.tsx'; Text = ($valid -replace '(?ms)^STORYBOOK.*?NONE\.\s*', ''); ExpectBlock = $true },
        @{ Name = 'allows Story after all receipts'; Path = 'src/stories/mantine/primitives/Badge.stories.tsx'; Text = $valid; ExpectBlock = $false },
        @{ Name = 'allows Story after registered Storybook proof'; Path = 'src/stories/mantine/primitives/Badge.stories.tsx'; Text = $parsedTranscript; ExpectBlock = $false },
        @{ Name = 'blocks Story when proof names a different Story'; Path = 'src/stories/mantine/primitives/Badge.stories.tsx'; Text = ($validWithoutStorybookProof + "`n" + $wrongStorybookReceipt); ExpectBlock = $true },
        @{ Name = 'blocks legacy Story without Storybook preflight'; Path = 'src/stories/LegacyComponent.stories.tsx'; Text = ($valid -replace '(?ms)^STORYBOOK.*?NONE\.\s*', ''); ExpectBlock = $true },
        @{ Name = 'does not gate a unit test'; Path = 'src/design-system/mantine/__tests__/MantineBadge.test.tsx'; Text = ''; ExpectBlock = $false },
        @{ Name = 'blocks kickoff without claim-evidence receipt'; Path = 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = ''; ExpectBlock = $true },
        @{ Name = 'allows kickoff after claim-evidence receipt'; Path = 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = $kickoffReceipt; ExpectBlock = $false },
        @{ Name = 'allows kickoff after registered claim-evidence receipt'; Path = 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = $parsedTranscript; ExpectBlock = $false },
        @{ Name = 'allows bold kickoff receipt'; Path = 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = ('**' + $kickoffReceipt + '**'); ExpectBlock = $false },
        @{ Name = 'allows inline-code kickoff receipt'; Path = 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = ('`' + $kickoffReceipt + '`'); ExpectBlock = $false },
        @{ Name = 'allows bullet kickoff receipt'; Path = 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = ('- **' + $kickoffReceipt + '**'); ExpectBlock = $false },
        @{ Name = 'allows blockquote kickoff receipt'; Path = 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = ('> ' + $kickoffReceipt); ExpectBlock = $false },
        @{ Name = 'allows numbered kickoff receipt'; Path = 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = ('1. ' + $kickoffReceipt); ExpectBlock = $false },
        @{ Name = 'allows nested task-list kickoff receipt'; Path = 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = ('> - [x] **' + $kickoffReceipt + '**'); ExpectBlock = $false },
        @{ Name = 'allows heading-plus-code kickoff receipt'; Path = 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = ('### `' + $kickoffReceipt + '`'); ExpectBlock = $false },
        @{ Name = 'blocks receipt label mentioned in prose'; Path = 'tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = ('Evidence: ' + $kickoffReceipt); ExpectBlock = $true },
        @{ Name = 'does not gate archived kickoff'; Path = 'tasks/Archive/Sprint_90_kickoff_prompt_Task_920_Example.md'; Text = ''; ExpectBlock = $false }
    )
    $ok = $transcriptShapePass
    foreach ($case in $cases) {
        $blocked = $null -ne (Get-UiWriteBlockReason $case.Path $case.Text)
        if (-not $blocked) { $blocked = $null -ne (Get-KickoffWriteBlockReason $case.Path $case.Text) }
        $pass = $blocked -eq $case.ExpectBlock
        [Console]::Out.WriteLine(("{0} {1}" -f $(if ($pass) { 'GREEN' } else { 'FAIL ' }), $case.Name))
        $ok = $ok -and $pass
    }
    $shellHit = @(Get-ShellUiWritePaths 'Set-Content src/design-system/mantine/patterns/MantineBadge.tsx $value').Count -eq 1
    $shellMiss = @(Get-ShellUiWritePaths 'rg MantineBadge src/design-system/mantine/patterns/MantineBadge.tsx').Count -eq 0
    # Regression (Task 923, 2026-10-18): a discarded/merged stream is not a file write; a real redirection still is.
    $shellMiss = $shellMiss -and @(Get-ShellUiWritePaths 'grep -n x src/design-system/mantine/patterns/MantineBadge.tsx 2>/dev/null || true').Count -eq 0
    $shellMiss = $shellMiss -and @(Get-ShellUiWritePaths 'rg x src/design-system/mantine/patterns/MantineBadge.tsx 2>&1 | head').Count -eq 0
    $shellMiss = $shellMiss -and @(Get-ShellUiWritePaths 'Get-Content src/design-system/mantine/patterns/MantineBadge.tsx 2>$null').Count -eq 0
    $shellHit = $shellHit -and @(Get-ShellUiWritePaths 'echo x 2>/dev/null > src/design-system/mantine/patterns/MantineBadge.tsx').Count -eq 1
    $shellHit = $shellHit -and @(Get-ShellUiWritePaths 'echo x 2>&1 >> src/design-system/mantine/patterns/MantineBadge.tsx').Count -eq 1
    $kickoffShellHit = @(Get-ShellKickoffWritePaths 'Set-Content tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md $value').Count -eq 1
    $kickoffShellMiss = @(Get-ShellKickoffWritePaths 'rg kickoff tasks/Sprints/Sprint_90_kickoff_prompt_Task_920_Example.md').Count -eq 0
    $shellEvent = '{"tool_input":{"command":"git status --short"}}' | ConvertFrom-Json
    $shellValues = Get-ToolInputValues $shellEvent
    $shellEventPass = [string]::IsNullOrEmpty($shellValues.Path) -and $shellValues.Command -eq 'git status --short'
    [Console]::Out.WriteLine("{0} detects an obvious shell-based UI write" -f $(if ($shellHit) { 'GREEN' } else { 'FAIL ' }))
    [Console]::Out.WriteLine("{0} does not gate a read-only shell command" -f $(if ($shellMiss) { 'GREEN' } else { 'FAIL ' }))
    [Console]::Out.WriteLine("{0} detects an obvious shell-based kickoff write" -f $(if ($kickoffShellHit) { 'GREEN' } else { 'FAIL ' }))
    [Console]::Out.WriteLine("{0} does not gate a read-only kickoff shell command" -f $(if ($kickoffShellMiss) { 'GREEN' } else { 'FAIL ' }))
    [Console]::Out.WriteLine("{0} accepts a shell hook event with no file_path" -f $(if ($shellEventPass) { 'GREEN' } else { 'FAIL ' }))
    $ok = $ok -and $shellHit -and $shellMiss -and $kickoffShellHit -and $kickoffShellMiss -and $shellEventPass
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
    $uiPaths = @()
    if (Test-UiSourcePath $path) { $uiPaths += $path }
    $uiPaths += Get-ShellUiWritePaths $toolValues.Command
    $uiPaths = @($uiPaths | Select-Object -Unique)
    $kickoffPaths = @()
    if (Test-ActiveKickoffPath $path) { $kickoffPaths += $path }
    $kickoffPaths += Get-ShellKickoffWritePaths $toolValues.Command
    $kickoffPaths = @($kickoffPaths | Select-Object -Unique)
    if ($uiPaths.Count -eq 0 -and $kickoffPaths.Count -eq 0) { exit 0 }
    $transcript = Get-AssistantTranscript $inputJson
    foreach ($kickoffPath in $kickoffPaths) {
        $reason = Get-KickoffWriteBlockReason $kickoffPath $transcript
        if ($reason) { Write-Deny $reason; exit 0 }
    }
    foreach ($uiPath in $uiPaths) {
        $reason = Get-UiWriteBlockReason $uiPath $transcript
        if ($reason) { Write-Deny $reason; exit 0 }
    }
}
catch {
    Write-Deny ("Guarded write blocked because the phase gate could not verify its required receipts: " + $_.Exception.Message)
}
