# Emits a validated phase receipt as a durable PowerShell tool-use step.
# The phase-write gate reads the exact invocation from the assistant transcript; this script writes no project state.

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('StorybookProof', 'KickoffEvidence', 'MobileAdaptation', 'CanonicalReuse', 'UiContract')]
    [string]$Kind,

    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Receipt
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = $utf8
. (Join-Path $PSScriptRoot 'phase-receipt-contract.ps1')

if ($Kind -eq 'StorybookProof') {
    $pattern = '(?im)^\s*STORYBOOK PROOF PREFLIGHT COMPLETE\s*-\s*direct Story:\s*([^;\r\n]+?)\s*;\s*production component:\s*[^;\r\n]+\s*;\s*allowed public states:\s*[^;\r\n]+\s*;\s*local presentation:\s*NONE\.?\s*$'
    $match = [regex]::Match($Receipt, $pattern)
    if (-not $match.Success) {
        throw 'Invalid StorybookProof receipt. Use: STORYBOOK PROOF PREFLIGHT COMPLETE - direct Story: <path>; production component: <name>; allowed public states: <typed props>; local presentation: NONE.'
    }

    $storyPaths = @($match.Groups[1].Value -split '\s*,\s*')
    foreach ($storyPath in $storyPaths) {
        $normalized = ($storyPath -replace '\\', '/').TrimStart('./').TrimStart('/').ToLowerInvariant()
        if ($normalized -notmatch '^src/(?:stories|components)/.+\.stories\.(?:ts|tsx)$') {
            throw "StorybookProof direct Story is not a canonical Story path: $storyPath"
        }
    }
}
elseif ($Kind -eq 'KickoffEvidence') {
    # Keep source ASCII-only for Windows PowerShell 5.1. The submitted receipt may use the Unicode em dash.
    $emDash = [string][char]0x2014
    $pattern = '(?ims)^\s*KICKOFF EVIDENCE PREFLIGHT COMPLETE\s*[' + $emDash + '-]\s*claims:\s*C\d+.*?owner decisions:\s*(?:D\d+(?:\s*,\s*D\d+)*|NONE).*?blocked claims:\s*NONE\s*\.'
    if ($Receipt -notmatch $pattern) {
        throw ('Invalid KickoffEvidence receipt. Use: KICKOFF EVIDENCE PREFLIGHT COMPLETE ' + $emDash + ' claims: C1, ...; owner decisions: D1, ... | NONE; blocked claims: NONE.')
    }
}
elseif ($Kind -eq 'MobileAdaptation') {
    # Delimit the free-text mobile order only at the following named field. It may contain ordinary semicolons.
    # Registry compatibility is intentionally checked by phase-write-gate.ps1 immediately before the guarded write.
    $pattern = Get-MobileAdaptationReceiptPattern
    if ($Receipt -notmatch $pattern) {
        throw 'Invalid MobileAdaptation receipt. Use every named field in the mobile adaptation contract; mobile order may contain semicolons, but required content must remain `no semantic loss`.'
    }
}
elseif ($Kind -eq 'CanonicalReuse') {
    if ($Receipt -notmatch (Get-CanonicalReuseReceiptPattern)) {
        throw 'Invalid CanonicalReuse receipt. Use the GR-0 receipt of docs/rules/golden/gr-0-canonical-reuse.md: request: ...; decision: REUSE | EXTEND | COMPOSE | CREATE; ...; new hardcoded visual values: NONE. A STOP decision never authorizes a write.'
    }
}
elseif ($Kind -eq 'UiContract') {
    if ($Receipt -notmatch (Get-UiContractReceiptPattern)) {
        throw 'Invalid UiContract receipt. Use: UI CONTRACT PREFLIGHT COMPLETE - scope: <exact paths>; canonical owner: <path>; token owner: <registry/theme path>; direct Story: <path>.'
    }
}

Write-Output $Receipt.Trim()
