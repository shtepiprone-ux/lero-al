Set-Location C:\Claude_Code_Projects\lero-al
$f='docs\sessions\evidence\task741r3\rev3h\exec\final'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
function Run($n, $cmd) { cmd /c "$cmd > $f\$n.txt 2>&1"; "EXIT_CODE=$LASTEXITCODE" | Add-Content -Path "$f\$n.txt" -Encoding utf8 }
Run '00_platform' 'node.exe -p process.platform'
Run '01_node' 'node.exe --version'
Run '02_census' 'node.exe scripts\check-surface-census.mjs --surface src\modules\listings\components\ListingsShell.tsx'
Run '03_vitest' 'npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineListingCardPattern.smoke.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx'
Run '04_check-stories' 'npm.cmd run check:stories'
Run '05_story-coverage' 'npm.cmd run check:story-coverage'
Run '06_design-tokens' 'npm.cmd run check:design-tokens:strict'
Run '07_build-storybook' 'npm.cmd run build-storybook'
Run '08_parity-probe' 'node.exe docs\sessions\evidence\task741r3\rev3h\exec\parity-probe.mjs'
Run '09_typecheck' 'npm.cmd run typecheck'
Run '10_lint' 'npm.cmd run lint'
Run '11_build' 'npm.cmd run build'
Run '12_file-integrity' 'npm.cmd run check:file-integrity'
Run '13_mojibake' 'npm.cmd run check:mojibake'
Run '14_backlog-active' 'npm.cmd run check:backlog-active'
Select-String -Path src\design-system\mantine\patterns\MantineListingCardPattern.module.css,src\modules\listings\components\ListingCard.module.css -Pattern 'design-tokens-allow|\d(px|rem|ms)\b|#[0-9a-fA-F]|rgb' | Out-String | Add-Content "$f\15_select-css.txt" -Encoding utf8; "EXIT_CODE=0" | Add-Content "$f\15_select-css.txt" -Encoding utf8
Select-String -Path src\design-system\mantine\patterns\MantineListingCardPattern.tsx -Pattern 'style=\{\{|[A-Za-z](List|Grid)\b' | Out-String | Add-Content "$f\16_select-tsx.txt" -Encoding utf8; "EXIT_CODE=0" | Add-Content "$f\16_select-tsx.txt" -Encoding utf8
Select-String -Path src\design-system\mantine\patterns\MantineListingCardPattern.tsx,src\design-system\mantine\patterns\MantineListingCardPattern.module.css,src\modules\listings\components\ListingCard.tsx,src\modules\listings\components\ListingCard.module.css -Pattern 'muted-foreground' | Out-String | Add-Content "$f\17_select-muted.txt" -Encoding utf8; "EXIT_CODE=0" | Add-Content "$f\17_select-muted.txt" -Encoding utf8
Run '18_hashes' 'git --no-optional-locks hash-object src/design-system/mantine/patterns/MantineListingCardPattern.tsx src/design-system/mantine/patterns/MantineListingCardPattern.module.css src/modules/listings/components/ListingCard.tsx src/modules/listings/components/ListingCard.module.css src/design-system/mantine/theme.ts src/design-system/mantine/pagination-chrome.css'
Run '19_status' 'git --no-optional-locks status --porcelain'
[IO.File]::WriteAllText((Join-Path (Get-Location) "$f\ALLDONE"), "DONE`n", (New-Object System.Text.UTF8Encoding($false)))