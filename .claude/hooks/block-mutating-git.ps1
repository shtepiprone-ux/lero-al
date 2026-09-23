# Blocks Git writes before a Claude Code Bash or PowerShell tool call executes.
#
# This guard intentionally permits only the inspection subcommands named in
# CLAUDE.md. Git's global `-c`/`--config-env` options and nested shell scripts
# are rejected because they can turn an apparently read-only call into a write.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$readOnlyGitSubcommands = @(
    'status', 'diff', 'show', 'log', 'grep', 'hash-object', 'rev-list',
    'rev-parse', 'ls-files', 'ls-tree', 'cat-file', 'merge-base',
    'check-attr', 'check-ignore', 'describe', 'blame', 'shortlog',
    'for-each-ref', 'name-rev', 'remote', 'branch'
)

$safeGitGlobalOptions = @(
    '--no-pager', '--paginate', '--no-optional-locks', '--literal-pathspecs',
    '--no-literal-pathspecs', '--glob-pathspecs', '--noglob-pathspecs',
    '--icase-pathspecs', '--no-replace-objects', '--bare'
)

$shellWrappers = @('powershell', 'powershell.exe', 'pwsh', 'pwsh.exe', 'cmd', 'cmd.exe', 'bash', 'bash.exe', 'sh', 'sh.exe')

function Write-Deny([string]$Reason) {
    @{
        hookSpecificOutput = @{
            hookEventName            = 'PreToolUse'
            permissionDecision        = 'deny'
            permissionDecisionReason  = $Reason
        }
    } | ConvertTo-Json -Depth 4 -Compress
}

function Get-CommandElementText($Element) {
    if ($Element -is [System.Management.Automation.Language.StringConstantExpressionAst]) {
        return $Element.Value
    }

    return $Element.Extent.Text.Trim().Trim("'`"")
}

function Get-ExecutableLeaf([string]$Name) {
    return ($Name.Trim().Trim("'`"") -replace '^.*[\\/]', '').ToLowerInvariant()
}

function Test-GitExecutable([string]$Name) {
    return (Get-ExecutableLeaf $Name) -in @('git', 'git.exe')
}

function Get-GitSubcommand([string[]]$Arguments) {
    for ($index = 0; $index -lt $Arguments.Count; $index++) {
        $argument = $Arguments[$index]
        if ([string]::IsNullOrWhiteSpace($argument)) {
            continue
        }

        if ($argument -eq '--') {
            return $null
        }

        if (-not $argument.StartsWith('-')) {
            return $argument.ToLowerInvariant()
        }

        $optionName = $argument.ToLowerInvariant()
        # Git distinguishes uppercase -C (change directory, safe for a read-only
        # command) from lowercase -c (temporary config, which can invoke an alias).
        if ($argument -ceq '-c' -or $optionName -in @('--config-env', '--exec-path')) {
            return $null
        }

        if ($argument -ceq '-C' -or $optionName -match '^(?:--git-dir|--work-tree|--namespace|--super-prefix)$') {
            if ($index + 1 -ge $Arguments.Count) {
                return $null
            }

            $index++
            continue
        }

        if ($optionName -match '^(?:--git-dir|--work-tree|--namespace|--super-prefix)=') {
            continue
        }

        if ($optionName -in $safeGitGlobalOptions) {
            continue
        }

        return $null
    }

    return $null
}

function Test-ReadOnlyGitInvocation([string[]]$Arguments) {
    $subcommand = Get-GitSubcommand $Arguments
    if ($null -eq $subcommand -or $subcommand -notin $readOnlyGitSubcommands) {
        return $false
    }

    $subcommandIndex = [array]::IndexOf([string[]]$Arguments, $subcommand)
    $subcommandArguments = @(
        if ($subcommandIndex -ge 0 -and $subcommandIndex + 1 -lt $Arguments.Count) {
            $Arguments[($subcommandIndex + 1)..($Arguments.Count - 1)]
        }
    )

    if ($subcommand -eq 'hash-object') {
        foreach ($argument in $Arguments) {
            if ($argument -in @('-w', '--write')) {
                return $false
            }
        }
    }

    if ($subcommand -eq 'remote') {
        return $subcommandArguments.Count -eq 0 -or $subcommandArguments[0].ToLowerInvariant() -in @('-v', '--verbose', 'get-url')
    }

    if ($subcommand -eq 'branch') {
        return $subcommandArguments.Count -eq 1 -and $subcommandArguments[0] -eq '--show-current'
    }

    return $true
}

function Get-WrapperPayload([string]$Wrapper, [string[]]$Arguments) {
    $commandSwitches = if ($Wrapper -in @('cmd', 'cmd.exe')) {
        @('/c', '/k')
    } else {
        @('-command', '-c')
    }

    for ($index = 0; $index -lt $Arguments.Count; $index++) {
        if ($Arguments[$index].ToLowerInvariant() -in $commandSwitches) {
            if ($index + 1 -ge $Arguments.Count) {
                return $null
            }

            return ($Arguments[($index + 1)..($Arguments.Count - 1)] -join ' ').Trim()
        }
    }

    return $null
}

function Test-ContainsGitText([string]$Text) {
    return $Text -match '(?i)(?:^|[\\/\s''`"])(?:git|git\.exe)(?=$|[\\/\s''`"])'
}

function Get-ShellTokens([string]$Text) {
    return @(
        [regex]::Matches($Text, '"[^"]*"|''[^'']*''|[^\s]+') |
            ForEach-Object { $_.Value.Trim().Trim("'`"") }
    )
}

function Find-BashStyleGitViolation([string]$Command) {
    # Windows PowerShell 5 cannot parse Bash's && / || operators. This fallback
    # recognizes only Git at a command boundary, so a source search such as
    # `rg "git add"` is not mistaken for a Git invocation.
    $pattern = '(?im)(?:^|&&|\|\||[;|\r\n])\s*(?:[A-Za-z_][A-Za-z0-9_]*=[^;|&\r\n]+\s+)*(?:&\s*)?(?:["'']?(?:(?:[A-Za-z]:)?(?:[^\s"'';|&\r\n]+[\\/])*)?git(?:\.exe)?["'']?)(?<arguments>[^;|&\r\n]*)'
    $matches = @([regex]::Matches($Command, $pattern))
    if ($matches.Count -eq 0) {
        return 'A shell command that invokes Git could not be safely parsed for the read-only policy.'
    }

    foreach ($match in $matches) {
        $arguments = Get-ShellTokens $match.Groups['arguments'].Value
        if (-not (Test-ReadOnlyGitInvocation $arguments)) {
            return 'Only the read-only Git inspection commands allowlisted in CLAUDE.md may run in Claude Code.'
        }
    }

    return $null
}

function Find-GitPolicyViolation([string]$Command, [int]$Depth = 0) {
    if ($Depth -gt 2) {
        return 'Nested shell command is too deep to verify against the Git policy.'
    }

    $tokens = $null
    $parseErrors = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseInput($Command, [ref]$tokens, [ref]$parseErrors)
    $commandAsts = @($ast.FindAll({ param($node) $node -is [System.Management.Automation.Language.CommandAst] }, $true))

    foreach ($commandAst in $commandAsts) {
        $commandName = $commandAst.GetCommandName()
        $elements = @($commandAst.CommandElements | ForEach-Object { Get-CommandElementText $_ })

        if ($commandName -and (Test-GitExecutable $commandName)) {
            $gitArguments = @($elements | Select-Object -Skip 1)
            if (-not (Test-ReadOnlyGitInvocation $gitArguments)) {
                return 'Only the read-only Git inspection commands allowlisted in CLAUDE.md may run in Claude Code.'
            }

            continue
        }

        if (-not $commandName) {
            continue
        }

        $leaf = Get-ExecutableLeaf $commandName
        $arguments = @($elements | Select-Object -Skip 1)

        if ($leaf -in $shellWrappers) {
            $payload = Get-WrapperPayload $leaf $arguments
            if ($null -ne $payload) {
                $nestedViolation = Find-GitPolicyViolation $payload ($Depth + 1)
                if ($nestedViolation) {
                    return $nestedViolation
                }

                continue
            }

            if ($arguments -match '^(?:-file|-encodedcommand|-encodedarguments|/k)$' -or ($leaf -in @('bash', 'bash.exe', 'sh', 'sh.exe') -and $arguments.Count -gt 0)) {
                return 'Nested shell scripts are blocked because their Git behavior cannot be verified before execution.'
            }
        }

        if ($leaf -in @('start-process', 'invoke-expression', 'iex') -and (Test-ContainsGitText ($arguments -join ' '))) {
            return 'Git execution through a process or expression wrapper is forbidden in Claude Code.'
        }
    }

    if ($parseErrors -and (Test-ContainsGitText $Command)) {
        return Find-BashStyleGitViolation $Command
    }

    return $null
}

try {
    $callInput = [Console]::In.ReadToEnd() | ConvertFrom-Json -ErrorAction Stop
    $command = [string]$callInput.tool_input.command
    if ([string]::IsNullOrWhiteSpace($command)) {
        Write-Deny 'The Git policy guard could not inspect this shell command.'
        exit 0
    }

    $violation = Find-GitPolicyViolation $command
    if ($violation) {
        Write-Deny $violation
    }
} catch {
    Write-Deny 'The Git policy guard failed closed and blocked an unverified shell command.'
}
