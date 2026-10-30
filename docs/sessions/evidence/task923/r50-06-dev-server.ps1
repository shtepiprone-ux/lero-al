# Task 923 Revision 50 (Sonnet executor, 2026-10-25), AC150 r50-06: the two read-only commands of review-50/rv50-06-dev-server.txt, counts printed. Changes nothing.
$nodes = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'next|storybook' })
$sockets = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 3000,3001,3002,3003,6006 })
Write-Output "node processes whose command line names next or storybook: $($nodes.Count)"
Write-Output "listening sockets on 3000-3003 or 6006: $($sockets.Count)"
