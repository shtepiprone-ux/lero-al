param(
  [Parameter(Mandatory = $true)][string]$Out,
  [Parameter(Mandatory = $true)][string]$Display,
  [Parameter(Mandatory = $true)][string]$Exe,
  [string[]]$ArgList = @(),
  [string]$Note = '',
  [switch]$UseScratchNodePath
)
# Task 923 Revision 18 (R82): runs ONE command, keeps its unpiped stdout and stderr and writes the evidence transcript in the form of the earlier task923 evidence:
# platform line, command line, the output, EXIT_CODE=<the real exit code of the command, read from the process object>.
# The two modules pg 8.21.0 and plpgsql-parser 18.5.10 are NOT in the repository: -UseScratchNodePath points NODE_PATH at the session scratchpad where they were installed (npm install pg@8.21.0 plpgsql-parser@18.5.10).
$scratch = 'C:\Users\Nox\AppData\Local\Temp\claude\C--Claude-Code-Projects-lero-al\39a6eb19-23db-47fd-a553-3c383046de34\scratchpad'
$root = 'C:\Claude_Code_Projects\lero-al'
if ($UseScratchNodePath) { $env:NODE_PATH = "$scratch\tools\node_modules" }
$nodeVer = (& node --version)
$os = [System.Environment]::OSVersion.Version.ToString()
$pg = if ($UseScratchNodePath) { 'pg 8.21.0, plpgsql-parser 18.5.10 from a scratchpad prefix via NODE_PATH (not installed in the repository)' } else { 'no extra module' }
$start = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
$token = [guid]::NewGuid().ToString('N')   # one pair of temp files per run, so two runs at the same time never share a file
$stdout = Join-Path $scratch "ev-$token.out"
$stderr = Join-Path $scratch "ev-$token.err"
$p = Start-Process -FilePath $Exe -ArgumentList $ArgList -WorkingDirectory $root -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
$exit = $p.ExitCode
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("platform win32 $os node $nodeVer; $pg; start $start")
$lines.Add("cmd $Display" + $(if ($Note) { "   ($Note)" } else { '' }))
$outText = @(Get-Content -LiteralPath $stdout -Encoding UTF8)   # @() so that an empty output is an empty list, not $null
if ($outText.Count -gt 0) { $lines.AddRange([string[]]$outText) }
$err = @(Get-Content -LiteralPath $stderr -Encoding UTF8)
if ($err.Count -gt 0) { $lines.Add('--- stderr ---'); $lines.AddRange([string[]]$err) }
$lines.Add("EXIT_CODE=$exit")
[System.IO.File]::WriteAllLines($Out, $lines, (New-Object System.Text.UTF8Encoding($false)))
Remove-Item -LiteralPath $stdout, $stderr -Force
"WROTE $Out EXIT_CODE=$exit"
exit $exit
