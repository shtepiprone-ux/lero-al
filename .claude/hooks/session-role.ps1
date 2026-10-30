# Shared reader for the workflow role. ASCII for PS 5.1. Fast paths read the event; everything else (the role captured
# at SessionStart/PostModelSwitch, the process role kept across /clear, the model Claude Code records in the transcript)
# is resolved by scripts/workflow-gates/session-role.mjs --resolve, the one implementation both runtimes share.
function Get-LeroSessionRole([object]$HookEvent) {
    function Read-LeroRoleProperty([object]$Value, [string]$Name) {
        if ($null -eq $Value) { return $null }
        $property = $Value.PSObject.Properties[$Name]
        if ($null -eq $property) { return $null }
        return $property.Value
    }
    $agentType = [string](Read-LeroRoleProperty $HookEvent 'agent_type')
    if ($agentType -in @('executor', 'orchestrator')) { return $agentType }
    $model = [string](Read-LeroRoleProperty $HookEvent 'model')
    if ($model -match '(?i)sonnet') { return 'executor' }
    if ($model -match '(?i)opus') { return 'orchestrator' }
    $resolver = Join-Path $PSScriptRoot '..\..\scripts\workflow-gates\session-role.mjs'
    if (-not (Test-Path -LiteralPath $resolver)) { return $null }
    try {
        $json = $HookEvent | ConvertTo-Json -Compress -Depth 4
        # The resolver prints one role or an empty line and writes no project state.
        $output = @($json | & node $resolver --resolve)
        if ($LASTEXITCODE -ne 0 -or $output.Count -eq 0) { return $null }
        $role = ([string]$output[0]).Trim()
        if ($role -in @('executor', 'orchestrator')) { return $role }
    } catch { return $null }
    return $null
}
