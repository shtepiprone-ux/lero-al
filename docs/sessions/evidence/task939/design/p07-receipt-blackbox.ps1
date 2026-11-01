# Task 939 design: black-box check that the four UI receipts named in the kickoff's ordered route let the real
# .claude/hooks/phase-write-gate.ps1 allow an Edit of each Story file in scope, and that the hook still denies the
# same Edit with no receipts, without the Storybook proof, or without the mobile receipt. Writes only a temporary
# transcript in the system temp directory. Usage (PowerShell, repo root):
#   powershell -NoProfile -File docs/sessions/evidence/task939/design/p07-receipt-blackbox.ps1
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$env:CLAUDE_PROJECT_DIR = $root
$receipts = [ordered]@{
  CanonicalReuse = 'GR-0 CANONICAL REUSE PREFLIGHT - request: Task 939 CustomRangeTooLong play below the 640px gate and the FavoritesShell Story note; semantic queries: RangeDatePicker mobile body, belowMobileGateQuery, DashboardPeriodControl Story; inspected candidates: src/design-system/mantine/patterns/RangeDatePicker.tsx, src/design-system/mantine/patterns/MantineDashboardPeriodControl.tsx, src/design-system/mantine/belowMobileGate.ts; decision: REUSE; selected canonical owner: src/design-system/mantine/patterns/RangeDatePicker.tsx; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts other.mobileGate through src/design-system/mantine/belowMobileGate.ts; new hardcoded visual values: NONE; rationale: the Stories follow the picker body the owner already renders below 640px; no component or token changes.'
  UiContract = 'UI CONTRACT PREFLIGHT COMPLETE - scope: src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx, src/stories/mantine/primitives/FavoritesShell.stories.tsx (play function and documentation comment only); canonical owner: src/design-system/mantine/patterns/RangeDatePicker.tsx; token owner: src/design-system/mantine/theme.ts; direct Story: src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx.'
  MobileAdaptation = 'MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: src/design-system/mantine/patterns/RangeDatePicker.tsx custom period picker opened from MantineDashboardPeriodControl; component families: form-picker-and-choice, filter-and-action-toolbar; pattern IDs: form-stack, inline-control; standards: w3c-labels-instructions, w3c-reflow, apple-hig-layout, android-content-structure, w3c-target-size, apple-hig-menus, android-layout-navigation; mantine mechanism: media-query-exception; mantine owner: src/design-system/mantine/patterns/RangeDatePicker.tsx; mobile range: <640px (theme.other.mobileGate / sm); mobile order: period control, then the picker sheet with its months stacked and Confirm last; required content: no semantic loss; verification: src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx CustomRangeTooLong across actual <640px thresholds 320, 375, 639 and the 640px transition x sq,en,uk,it.'
  StorybookProof = 'STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx, src/stories/mantine/primitives/FavoritesShell.stories.tsx; production component: MantineDashboardPeriodControl with RangeDatePicker, FavoritesShell; allowed public states: the existing Story args and render data only; local presentation: NONE.'
}
function Write-Transcript([string]$Path, [string[]]$Kinds) {
  $lines = foreach ($kind in $Kinds) {
    $cmd = "& .\.claude\hooks\emit-phase-receipt.ps1 -Kind $kind -Receipt '" + $receipts[$kind].Replace("'", "''") + "'"
    @{ type = 'assistant'; message = @{ content = @(@{ type = 'tool_use'; name = 'PowerShell'; input = @{ command = $cmd } }) } } | ConvertTo-Json -Compress -Depth 8
  }
  [System.IO.File]::WriteAllText($Path, ((@($lines) -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding($false)))
}
$transcript = Join-Path $env:TEMP ('t939-receipts-' + [guid]::NewGuid() + '.jsonl')
$stories = @('src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx', 'src/stories/mantine/primitives/FavoritesShell.stories.tsx')
$cases = @(
  @{ Name = 'all four receipts'; Kinds = @('CanonicalReuse', 'UiContract', 'MobileAdaptation', 'StorybookProof'); ExpectDeny = $false },
  @{ Name = 'no receipts'; Kinds = @(); ExpectDeny = $true },
  @{ Name = 'without StorybookProof'; Kinds = @('CanonicalReuse', 'UiContract', 'MobileAdaptation'); ExpectDeny = $true },
  @{ Name = 'without MobileAdaptation'; Kinds = @('CanonicalReuse', 'UiContract', 'StorybookProof'); ExpectDeny = $true }
)
$ok = $true
try {
  foreach ($case in $cases) {
    Write-Transcript $transcript $case.Kinds
    foreach ($story in $stories) {
      $hookEvent = @{ tool_name = 'Edit'; transcript_path = $transcript; tool_input = @{ file_path = (Join-Path $root $story); old_string = 'a'; new_string = 'b' } } | ConvertTo-Json -Compress -Depth 5
      # Feed the hook event from a BOM-less UTF-8 file on stdin, as the client does. A pipe from a PowerShell process
      # (pipeline or redirected Process stream) reaches the hook empty and it fails closed on that, which proves nothing.
      $eventFile = Join-Path $env:TEMP ('t939-event-' + [guid]::NewGuid() + '.json')
      [System.IO.File]::WriteAllText($eventFile, $hookEvent, (New-Object System.Text.UTF8Encoding($false)))
      $hook = Join-Path $root '.claude\hooks\phase-write-gate.ps1'
      $out = (cmd /c ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + $hook + '" < "' + $eventFile + '"')) -join "`n"
      Remove-Item -LiteralPath $eventFile -Force -ErrorAction SilentlyContinue
      $denied = [string]$out -match '"permissionDecision":"deny"'
      # A deny counts only when it names a missing receipt; an unreadable event or transcript is a broken harness.
      $reason = if ($denied) { (([string]$out | ConvertFrom-Json).hookSpecificOutput.permissionDecisionReason) } else { '' }
      $rightReason = (-not $denied) -or ($reason -match '^(UI/Story write blocked; missing valid receipt|Canonical Story write blocked)')
      $pass = ($denied -eq $case.ExpectDeny) -and $rightReason
      $ok = $ok -and $pass
      Write-Output ('{0} {1} | {2} | {3}' -f $(if ($pass) { 'PASS' } else { 'FAIL' }), $case.Name, $story, $(if ($denied) { 'denied: ' + $reason.Substring(0, [Math]::Min(110, $reason.Length)) } else { 'allowed' }))
    }
  }
} finally { Remove-Item -LiteralPath $transcript -Force -ErrorAction SilentlyContinue }
Write-Output $(if ($ok) { 'RECEIPT BLACK-BOX PASSED' } else { 'RECEIPT BLACK-BOX FAILED' })

