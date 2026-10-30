# Task 927 Amendment 10: the two read-only commands of docs/sessions/evidence/task923/review-50/rv50-06-dev-server.txt.
# The counts include the owner's `npm run dev` (3000-3003) and `npm run storybook` (6006). Both must be 0 before `npm run build-storybook` and `npm run build`.
$processes = @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object CommandLine -match 'next|storybook')
$sockets = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 3000,3001,3002,3003,6006 })
"node processes whose command line names next or storybook: $($processes.Count)"
"listening sockets on 3000-3003 or 6006: $($sockets.Count)"
if ($processes.Count -ne 0 -or $sockets.Count -ne 0) { exit 1 }
