# Task 937 design: black-box check that the three UI receipts named in the kickoff's ordered route let the real
# .claude/hooks/phase-write-gate.ps1 allow an Edit of each UI file in scope, and that the hook denies the same Edit
# with no receipts or without the mobile receipt (with the right reason). Writes only temporary files in the system
# temp directory. Usage (PowerShell, repo root): & .\docs\sessions\evidence\task937\design\p05-receipt-blackbox.ps1
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$env:CLAUDE_PROJECT_DIR = $root
$receipts = [ordered]@{
  CanonicalReuse = 'GR-0 CANONICAL REUSE PREFLIGHT - request: Task 937 governance findings on four UI files with no rendered change; semantic queries: theme iconSize roomy, overflow clip frame, design-tokens-allow marker, Leaflet control line height; inspected candidates: src/design-system/mantine/theme.ts, src/modules/listings/components/ListingStatusBanner.tsx, src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx; decision: REUSE; selected canonical owner: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx; Mantine/TailAdmin token path: src/design-system/mantine/theme.ts other.iconSize.roomy; new hardcoded visual values: NONE; rationale: each edit keeps the rendered value and moves it onto the existing token, style object or marker form the gates require.'
  UiContract = 'UI CONTRACT PREFLIGHT COMPLETE - scope: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx, src/components/shared/Map.module.css, src/design-system/mantine/input-chrome.css, src/modules/cabinet/components/CabinetEmailChangeSectionView.tsx (no rendered change); canonical owner: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx; token owner: src/design-system/mantine/theme.ts; direct Story: src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx.'
  MobileAdaptation = 'MOBILE ADAPTATION PREFLIGHT COMPLETE - surfaces: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx mobile photo frame; component families: media-gallery-and-listing-contact; pattern IDs: grid-media-reflow, inline-control; standards: w3c-reflow, apple-hig-layout, android-common-layouts, android-adapt-layouts, w3c-target-size, apple-hig-menus, android-layout-navigation; mantine mechanism: responsive-props; mantine owner: src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx; mobile range: <640px (theme.other.mobileGate / sm); mobile order: unchanged, one photo per swipe in a clipped frame, then the thumbnails; required content: no semantic loss; verification: src/stories/patterns/mantine/ListingGalleryPattern.stories.tsx Default across actual <640px thresholds 320, 375, 639 and the 640px transition x sq,en,uk,it.'
}
function Write-Transcript([string]$Path, [string[]]$Kinds) {
  $lines = foreach ($kind in $Kinds) {
    $cmd = "& .\.claude\hooks\emit-phase-receipt.ps1 -Kind $kind -Receipt '" + $receipts[$kind].Replace("'", "''") + "'"
    @{ type = 'assistant'; message = @{ content = @(@{ type = 'tool_use'; name = 'PowerShell'; input = @{ command = $cmd } }) } } | ConvertTo-Json -Compress -Depth 8
  }
  [System.IO.File]::WriteAllText($Path, ((@($lines) -join "`n") + "`n"), (New-Object System.Text.UTF8Encoding($false)))
}
$transcript = Join-Path $env:TEMP ('t937-receipts-' + [guid]::NewGuid() + '.jsonl')
$paths = @(
  'src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx',
  'src/components/shared/Map.module.css',
  'src/design-system/mantine/input-chrome.css',
  'src/modules/cabinet/components/CabinetEmailChangeSectionView.tsx'
)
$cases = @(
  @{ Name = 'all three receipts'; Kinds = @('CanonicalReuse', 'UiContract', 'MobileAdaptation'); ExpectDeny = $false },
  @{ Name = 'no receipts'; Kinds = @(); ExpectDeny = $true },
  @{ Name = 'without MobileAdaptation'; Kinds = @('CanonicalReuse', 'UiContract'); ExpectDeny = $true }
)
$ok = $true
try {
  foreach ($case in $cases) {
    Write-Transcript $transcript $case.Kinds
    foreach ($file in $paths) {
      $hookEvent = @{ tool_name = 'Edit'; transcript_path = $transcript; tool_input = @{ file_path = (Join-Path $root $file); old_string = 'a'; new_string = 'b' } } | ConvertTo-Json -Compress -Depth 5
      # The hook reads its event from stdin; feed it from a BOM-less UTF-8 file, as the client does.
      $eventFile = Join-Path $env:TEMP ('t937-event-' + [guid]::NewGuid() + '.json')
      [System.IO.File]::WriteAllText($eventFile, $hookEvent, (New-Object System.Text.UTF8Encoding($false)))
      $hook = Join-Path $root '.claude\hooks\phase-write-gate.ps1'
      $out = (cmd /c ('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + $hook + '" < "' + $eventFile + '"')) -join "`n"
      Remove-Item -LiteralPath $eventFile -Force -ErrorAction SilentlyContinue
      $denied = [string]$out -match '"permissionDecision":"deny"'
      $reason = if ($denied) { (([string]$out | ConvertFrom-Json).hookSpecificOutput.permissionDecisionReason) } else { '' }
      $rightReason = (-not $denied) -or ($reason -match '^UI/Story write blocked; missing valid receipt')
      $pass = ($denied -eq $case.ExpectDeny) -and $rightReason
      $ok = $ok -and $pass
      Write-Output ('{0} {1} | {2} | {3}' -f $(if ($pass) { 'PASS' } else { 'FAIL' }), $case.Name, $file, $(if ($denied) { 'denied: ' + $reason.Substring(0, [Math]::Min(110, $reason.Length)) } else { 'allowed' }))
    }
  }
} finally { Remove-Item -LiteralPath $transcript -Force -ErrorAction SilentlyContinue }
Write-Output $(if ($ok) { 'RECEIPT BLACK-BOX PASSED' } else { 'RECEIPT BLACK-BOX FAILED' })
