Set-Location C:\Claude_Code_Projects\lero-al
$f='docs\sessions\evidence\task741r3\rev3g\exec\final'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
function Run($n, $cmd) { cmd /c "$cmd > $f\$n.txt 2>&1"; "EXIT_CODE=$LASTEXITCODE" | Out-File "$f\$n.txt" -Append -Encoding utf8 }
Run '00_platform' 'node.exe -p process.platform'
Run '01_node' 'node.exe --version'
Run '02_census' 'node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingsShell.tsx'
Run '03_vitest' 'npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx'
Run '04_check-stories' 'npm.cmd run check:stories'
Run '05_story-coverage' 'npm.cmd run check:story-coverage'
Run '06_design-tokens' 'npm.cmd run check:design-tokens:strict'
Run '07_build-storybook' 'npm.cmd run build-storybook'
Run '08_typecheck' 'npm.cmd run typecheck'
Run '09_lint' 'npm.cmd run lint'
Run '10_build' 'npm.cmd run build'
Run '11_file-integrity' 'npm.cmd run check:file-integrity'
Run '12_mojibake' 'npm.cmd run check:mojibake'
Run '13_backlog-active' 'npm.cmd run check:backlog-active'
'DONE' | Out-File "$f\ALLDONE"
