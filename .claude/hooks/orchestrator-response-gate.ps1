# orchestrator-response-gate.ps1 - Stop hook. Owner rule 2026-09-10.
#
# Golden Rules GR-5 / GR-6 stopped being self-reported on this date. A receipt is a promise;
# this is a gate. It blocks the response when a task/doc artifact was written and no owner-run
# git handoff was emitted, or when a task was marked closed without an archive row.
#
# FAIL-OPEN BY DESIGN: any unexpected error exits 0. It must never wedge a session.
# LOOP-SAFE: honours stop_hook_active and never blocks twice in a row.

$ErrorActionPreference = 'Stop'
try {
    $raw = [Console]::In.ReadToEnd()
    $inp = $null
    if ($raw) { try { $inp = $raw | ConvertFrom-Json } catch { } }

    if ($inp -and $inp.stop_hook_active -eq $true) { exit 0 }   # already blocked once - let it through

    # This is an Opus governance gate. Sonnet executors must never be asked for Git handoffs.
    # Stop events can omit model and agent_type. Never infer an Opus role from dirty task/doc
    # files: that creates an impossible Git demand for a Sonnet executor. Unknown role fails open.
    $model = if ($inp -and $inp.PSObject.Properties.Name -contains 'model') { [string]$inp.model } else { '' }
    $agentType = if ($inp -and $inp.PSObject.Properties.Name -contains 'agent_type') { [string]$inp.agent_type } else { '' }
    if ($agentType -eq 'executor' -or $model -match '(?i)sonnet') { exit 0 }

    $assistantTexts = @()
    if ($inp -and $inp.transcript_path -and (Test-Path -LiteralPath $inp.transcript_path)) {
        $lines = Get-Content -LiteralPath $inp.transcript_path -Encoding UTF8
        foreach ($line in $lines) {
            try { $event = $line | ConvertFrom-Json } catch { continue }
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
    $isOpus = $agentType -eq 'orchestrator' -or $model -match '(?i)opus'
    if (-not $isOpus -and $assistantTexts.Count -gt 0) {
        $assistantTranscript = $assistantTexts -join "`n"
        $isOpus = $assistantTranscript -match '(?i)\b(TASK-DESIGN|REVIEW) PREFLIGHT COMPLETE\b'
    }
    if (-not $isOpus) { exit 0 }

    $root = $env:CLAUDE_PROJECT_DIR
    if (-not $root) { $root = (Get-Location).Path }
    Set-Location $root

    $status = & git --no-optional-locks status --porcelain 2>$null
    if (-not $status) { exit 0 }

    $paths = @($status | ForEach-Object { ($_ -replace '^..\s+','').Trim() })

    # Artifacts whose authorship is task design / governance - GR-6 demands a commit block.
    $designRe = '^(tasks/|CLAUDE\.md|\.claude/skills/|docs/(backlog\.md|backlog-archive\.md|golden-rules\.md|agent-contract\.md|orchestrator-role\.md|orchestrator-procedures\.md|rule-index\.md|component-catalog\.md|qa-profiles\.md))'
    $design = @($paths | Where-Object { $_ -match $designRe })
    if ($design.Count -eq 0) { exit 0 }

    # Last assistant message from the already-read transcript.
    $last = if ($assistantTexts.Count -gt 0) { $assistantTexts[$assistantTexts.Count - 1] } else { '' }
    if (-not $last) { exit 0 }   # cannot read the response - do not guess

    $problems = @()

    # GR-6 - uncommitted task/doc artifacts require the owner-run git block in this same response.
    if ($last -notmatch '(?m)^\s*git add\s') {
        $problems += "GR-6 VIOLATED. These task/doc artifacts are written and uncommitted, and this response emitted no 'git add' block:`n    " + (($design | Select-Object -First 20) -join "`n    ")
    }

    # GR-6 - a task-design handoff must never carry git push.
    if ($last -match '(?m)^\s*git push\s' -and $last -notmatch 'APPROVED') {
        $problems += "GR-6 VIOLATED. 'git push' appears in a response that is not an APPROVED / APPROVED WITH NOTES review."
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
catch { exit 0 }
