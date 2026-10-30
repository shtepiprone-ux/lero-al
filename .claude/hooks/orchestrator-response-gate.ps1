# orchestrator-response-gate.ps1 - Stop hook. Owner rule 2026-09-10.
#
# Golden Rules GR-5 / GR-6 stopped being self-reported on this date. A receipt is a promise;
# this is a gate. It blocks the response when a task/doc artifact was written and no owner-run
# git handoff was emitted, or when a task was marked closed without an archive row.
#
# FAIL-CLOSED AFTER ROLE IDENTIFICATION: unexpected gate errors block the Opus response instead of silently
# publishing unverified governance artifacts. Unknown role signals still exit 0 so this Opus-only gate never creates
# a prohibited Git handoff demand for Sonnet.
# Re-entrant: every attempt is checked; a corrected later response can recover in the same session.

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
. (Join-Path $PSScriptRoot 'session-role.ps1')
function Get-OptionalValue([object]$Value, [string]$Name) {
    if ($null -eq $Value) { return $null }
    $property = $Value.PSObject.Properties[$Name]
    if ($null -eq $property) { return $null }
    return $property.Value
}
try {
    $raw = [Console]::In.ReadToEnd()
    $inp = $null
    if ($raw) { try { $inp = $raw | ConvertFrom-Json } catch { } }

    # This is an Opus governance gate. Sonnet executors must never be asked for Git handoffs.
    # Stop events can omit model and agent_type. Never infer an Opus role from dirty task/doc
    # files: that creates an impossible Git demand for a Sonnet executor. Unknown role fails open.
    $role = Get-LeroSessionRole $inp
    if ($role -eq 'executor') { exit 0 }

    $assistantTexts = @()
    $pendingWrites = @{}
    $successfulWrites = @()
    if ($inp -and $inp.transcript_path -and (Test-Path -LiteralPath $inp.transcript_path)) {
        $lines = Get-Content -LiteralPath $inp.transcript_path -Encoding UTF8
        foreach ($line in $lines) {
            try { $event = $line | ConvertFrom-Json } catch { continue }
            $content = Get-OptionalValue (Get-OptionalValue $event 'message') 'content'
            foreach ($block in @($content)) {
                if ((Get-OptionalValue $event 'type') -eq 'assistant' -and (Get-OptionalValue $block 'type') -eq 'tool_use' -and (Get-OptionalValue $block 'name') -in @('Write', 'Edit')) {
                    $id = Get-OptionalValue $block 'id'
                    $toolInput = Get-OptionalValue $block 'input'
                    $writtenPath = Get-OptionalValue $toolInput 'file_path'
                    if (-not $writtenPath) { $writtenPath = Get-OptionalValue $toolInput 'path' }
                    if ($id -and $writtenPath) { $pendingWrites[[string]$id] = [string]$writtenPath }
                }
                if ((Get-OptionalValue $block 'type') -eq 'tool_result') {
                    $resultId = Get-OptionalValue $block 'tool_use_id'
                    if ($resultId -and $pendingWrites.ContainsKey([string]$resultId)) {
                        if ((Get-OptionalValue $block 'is_error') -ne $true) { $successfulWrites += $pendingWrites[[string]$resultId] }
                        $pendingWrites.Remove([string]$resultId)
                    }
                }
            }
            if ($event.type -eq 'assistant' -and $event.message.content) {
                $text = ($event.message.content | Where-Object { $_.type -eq 'text' } | ForEach-Object { $_.text }) -join "`n"
                if ($text) { $assistantTexts += $text }
            }
        }
    }

    # Metadata is authoritative when supplied. With older Stop events it is absent, so accept
    # only the literal Opus preflight receipts emitted by the task-design/review gates. The
    # Sonnet SessionStart additionalContext is not persisted in every transcript and must not be
    # relied upon as a negative role marker.
    $isOpus = $role -eq 'orchestrator'
    if (-not $isOpus -and $assistantTexts.Count -gt 0) {
        $assistantTranscript = $assistantTexts -join "`n"
        $isOpus = $assistantTranscript -match '(?i)\b(TASK-DESIGN|REVIEW) PREFLIGHT COMPLETE\b'
    }
    if (-not $isOpus) { exit 0 }

    # An incomplete report cannot depend on the unavailable validation it is reporting.
    # Classify before Git/backlog and ownership shortcuts, using the same parser as the Node Stop hook.
    $currentMessage = Get-OptionalValue $inp 'last_assistant_message'
    $last = if ($null -ne $currentMessage) { [string]$currentMessage } elseif ($assistantTexts.Count -gt 0) { $assistantTexts[$assistantTexts.Count - 1] } else { '' }
    $classifier = Join-Path $PSScriptRoot '..\..\scripts\workflow-gates\response-state.mjs'
    $classificationJson = @{ text = $last } | ConvertTo-Json -Compress -Depth 3
    $classificationOutput = @($classificationJson | & node $classifier)
    if ($LASTEXITCODE -ne 0 -or $classificationOutput.Count -ne 1) { throw 'Response state classifier failed.' }
    $classification = $classificationOutput[0] | ConvertFrom-Json
    $isBlocked = Get-OptionalValue $classification 'isBlocked'
    if ($isBlocked -isnot [bool]) { throw 'Response state classifier returned invalid metadata.' }
    if ($isBlocked) {
        $classificationErrors = @(Get-OptionalValue $classification 'errors')
        if ($classificationErrors.Count -gt 0) {
            [Console]::Error.WriteLine($classificationErrors -join "`n")
            exit 2
        }
        exit 0
    }

    $root = $env:CLAUDE_PROJECT_DIR
    if (-not $root) { $root = (Get-Location).Path }
    Set-Location $root

    # GR-5 (owner rule 2026-09-27) - the WHOLE backlog is checked on EVERY Opus response, even one
    # that wrote no file. The diff-only check below could not see a closed sprint that was already
    # sitting in docs/backlog.md; the owner found Sprints 68 and 80-82 there on 2026-09-27.
    # Every nonzero exit is an evidence gap, including missing/broken checker runtimes.
    $backlogProblem = $null
    if (Test-Path -LiteralPath 'scripts/check-backlog-active.mjs') {
        # PowerShell 5.1 turns redirected native stderr into a terminating error under 'Stop', which
        # the outer catch would swallow (fail open). Run this one call under 'Continue'.
        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        $backlogOut = & node scripts/check-backlog-active.mjs 2>&1 | Out-String
        $backlogExit = $LASTEXITCODE
        $ErrorActionPreference = $prevEap
        if ($backlogExit -ne 0) {
            $backlogProblem = "GR-5 VIOLATED - docs/backlog.md is not active-state only (npm run check:backlog-active):`n" + $backlogOut.Trim()
        }
    }
    else {
        $backlogProblem = 'GR-5 EVIDENCE GAP - scripts/check-backlog-active.mjs is unavailable.'
    }

    $status = & git --no-optional-locks status --porcelain -z 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Read-only Git status failed; handoff scope is unavailable.' }
    if (-not $status -and -not $backlogProblem) { exit 0 }
    if (-not $status) {
        [Console]::Error.WriteLine("BLOCKED by .claude/hooks/orchestrator-response-gate.ps1 (docs/golden-rules.md):`n`n$backlogProblem`n`nFix it in this turn: archive row per closed item, delete it from the backlog, then emit the owner-run commit block. Do not explain the block to the owner as a tooling problem - it is the rule working.")
        exit 2
    }

    $paths = @()
    $entries = ($status -join "`n").Split([char]0)
    for ($entryIndex = 0; $entryIndex -lt $entries.Count; $entryIndex++) {
        $entry = $entries[$entryIndex]
        if ($entry.Length -lt 3 -or $entry[2] -ne ' ') { continue }
        $paths += $entry.Substring(3).Replace('\', '/')
        # Porcelain -z emits a rename/copy destination followed by its original path.
        if ($entry.Substring(0, 2) -match '[RC]') { $entryIndex++ }
    }
    $ownedPaths = @()
    $rootPrefix = [System.IO.Path]::GetFullPath($root).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
    foreach ($writtenPath in $successfulWrites) {
        $fullPath = if ([System.IO.Path]::IsPathRooted($writtenPath)) {
            [System.IO.Path]::GetFullPath($writtenPath)
        } else {
            [System.IO.Path]::GetFullPath((Join-Path $root $writtenPath))
        }
        if ($fullPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            $ownedPaths += $fullPath.Substring($rootPrefix.Length).Replace('\', '/')
        }
    }

    # Artifacts whose authorship is task design / governance - GR-6 demands a commit block.
    $designRe = '^(tasks/|CLAUDE\.md|\.claude/|docs/(?:rules/|backlog\.md|backlog-archive\.md|golden-rules\.md|agent-contract\.md|orchestrator-role\.md|orchestrator-procedures\.md|rule-index\.md|component-catalog\.md|qa-profiles\.md))'
    # Dirty state can belong to the owner or another executor. Only successful writes recorded in
    # this session can impose this Opus handoff; a read-only audit must not claim someone else's work.
    $design = @($paths | Where-Object { $_ -match $designRe -and $_ -in $ownedPaths })
    if ($design.Count -eq 0 -and -not $backlogProblem) { exit 0 }

    # Changed active kickoffs must carry mechanically traceable claims. This runs only for Opus governance responses;
    # an unknown/missing Node runtime is a fail-closed evidence gap, not a reason to publish an invented premise.
    $kickoffPaths = @($design | Where-Object {
        $_ -match '^tasks/(?!Archive/).+kickoff.*\.md$'
    })
    $kickoffEvidenceProblem = $null
    if ($kickoffPaths.Count -gt 0) {
        if (-not (Test-Path -LiteralPath 'scripts/check-kickoff-evidence.mjs')) {
            $kickoffEvidenceProblem = 'KICKOFF EVIDENCE GAP - scripts/check-kickoff-evidence.mjs is unavailable.'
        }
        else {
            $previousEap = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            $kickoffEvidenceOut = & node scripts/check-kickoff-evidence.mjs --files $kickoffPaths 2>&1 | Out-String
            $kickoffEvidenceExit = $LASTEXITCODE
            $ErrorActionPreference = $previousEap
            if ($kickoffEvidenceExit -ne 0) {
                $kickoffEvidenceProblem = "KICKOFF EVIDENCE GAP - changed kickoff claim ledger is invalid:`n" + $kickoffEvidenceOut.Trim()
            }
        }
    }

    # Every changed active kickoff has an explicit mobile-adaptation record. This is separate from claim evidence:
    # a factually sourced kickoff can still publish a desktop-compression route unless the semantic mobile profile,
    # standards and verification matrix are present. The checker is fail-closed once this Opus governance path is known.
    $mobileAdaptationProblem = $null
    if ($kickoffPaths.Count -gt 0) {
        if (-not (Test-Path -LiteralPath 'scripts/check-mobile-adaptation-contract.mjs')) {
            $mobileAdaptationProblem = 'MOBILE ADAPTATION GAP - scripts/check-mobile-adaptation-contract.mjs is unavailable.'
        }
        else {
            $previousEap = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            $mobileAdaptationOut = & node scripts/check-mobile-adaptation-contract.mjs --files $kickoffPaths 2>&1 | Out-String
            $mobileAdaptationExit = $LASTEXITCODE
            $ErrorActionPreference = $previousEap
            if ($mobileAdaptationExit -ne 0) {
                $mobileAdaptationProblem = "MOBILE ADAPTATION GAP - changed kickoff record is invalid:`n" + $mobileAdaptationOut.Trim()
            }
        }
    }

    if (-not $last -and ($kickoffEvidenceProblem -or $mobileAdaptationProblem)) {
        $gaps = @()
        if ($kickoffEvidenceProblem) { $gaps += $kickoffEvidenceProblem }
        if ($mobileAdaptationProblem) { $gaps += $mobileAdaptationProblem }
        $gapMessage = $gaps -join "`n`n"
        [Console]::Error.WriteLine("BLOCKED by .claude/hooks/orchestrator-response-gate.ps1:`n`n$gapMessage`n`nThe kickoff cannot be published while its evidence or mobile adaptation record is invalid. Repair it and keep the response transcript available for the required handoff check.")
        exit 2
    }
    if (-not $last) { exit 0 }   # no output available to assess beyond the fail-closed kickoff-evidence result above

    $problems = @()
    if ($backlogProblem) { $problems += $backlogProblem }
    if ($kickoffEvidenceProblem) { $problems += $kickoffEvidenceProblem }
    if ($mobileAdaptationProblem) { $problems += $mobileAdaptationProblem }

    # GR-6 - uncommitted task/doc artifacts require the owner-run git block in this same response.
    if ($design.Count -gt 0 -and $last -notmatch '(?m)^\s*git add\s') {
        $problems += "GR-6 VIOLATED. These task/doc artifacts are written and uncommitted, and this response emitted no 'git add' block:`n    " + (($design | Select-Object -First 20) -join "`n    ")
    }

    # GR-6 - a task-design handoff must never carry git push.
    if ($last -match '(?m)^\s*git push\s' -and $last -notmatch 'APPROVED') {
        $problems += "GR-6 VIOLATED. 'git push' appears in a response that is not an APPROVED / APPROVED WITH NOTES review."
    }

    # GR-6 - Commit handoffs are unattributed owner commits. The former start-of-line trailer
    # check missed `git commit -m "Co-Authored-By: ..."`; inspect the whole commit block instead.
    # \u2010-\u2015 closes common Unicode-hyphen spelling bypasses without putting non-ASCII in this PS 5.1 source.
    $hasCommitCommand = $last -match '(?im)^\s*git(?:\s+\S+)*\s+commit\b'
    $joinedCommandLines = $last -replace '`[ \t]*\r?\n', ' '
    $commitCommandText = ([regex]::Matches($joinedCommandLines, '(?im)^[ \t]*git(?:[ \t]+\S+)*[ \t]+commit\b[^\r\n]*') | ForEach-Object { $_.Value }) -join "`n"
    if ($hasCommitCommand -and $commitCommandText -match '(?i)(?:^|\s)--author(?:[=\s]|$)') {
        $problems += 'GR-6 VIOLATED. Owner commit handoffs must not override identity with --author.'
    }
    $hasAgentAttribution = $last -match '(?i)\bco[\s\-\u2010-\u2015]*authored[\s\-\u2010-\u2015]*by\b'
    if ($hasCommitCommand -and $hasAgentAttribution) {
        $problems += "GR-6 VIOLATED. Owner-run commit handoffs are unattributed: Co-Authored-By and every AI/agent attribution are forbidden anywhere in the git commit command or message."
    }

    # GR-5 - closing a task in the backlog requires the archive row in the same response.
    $backlogTouched = @($design | Where-Object { $_ -eq 'docs/backlog.md' }).Count -gt 0
    $archiveTouched = @($design | Where-Object { $_ -eq 'docs/backlog-archive.md' }).Count -gt 0
    if ($backlogTouched -and -not $archiveTouched) {
        $diff = & git --no-optional-locks diff -U0 -- docs/backlog.md 2>$null | Out-String
        if ($diff -match '\+.*(APPROVED WITH NOTES|`APPROVED`).*archived' -or $diff -match '\+.*and archived') {
            $problems += "GR-5 VIOLATED. docs/backlog.md records a task as approved/archived, but docs/backlog-archive.md is unchanged. The verdict, the archive row and every state record change together."
        }
    }

    if ($problems.Count -gt 0) {
        [Console]::Error.WriteLine("BLOCKED by .claude/hooks/orchestrator-response-gate.ps1 (docs/golden-rules.md):`n`n" + ($problems -join "`n`n") + "`n`nFix it in this turn, then finish. Do not explain the block to the owner as a tooling problem - it is the rule working.")
        exit 2
    }
    exit 0
}
catch {
    [Console]::Error.WriteLine("BLOCKED by .claude/hooks/orchestrator-response-gate.ps1: the Opus governance gate could not complete safely: " + $_.Exception.Message)
    exit 2
}
