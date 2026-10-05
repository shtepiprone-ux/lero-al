cd /c/Claude_Code_Projects/lero-al
F=docs/sessions/evidence/task741r3/rev3f/exec/final
run() { n="$1"; shift; "$@" > "$F/$n.txt" 2>&1; echo "EXIT_CODE=$?" >> "$F/$n.txt"; }
node -p process.platform > $F/00_platform.txt 2>&1; echo "EXIT_CODE=$?" >> $F/00_platform.txt
node --version > $F/01_node.txt 2>&1; echo "EXIT_CODE=$?" >> $F/01_node.txt
run 02_census node scripts/check-surface-census.mjs --surface src/modules/listings/components/ListingsShell.tsx
run 03_vitest npx vitest run src/design-system/mantine/patterns/__tests__/MantinePagination.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.smoke.test.tsx src/modules/listings/components/__tests__/ListingsShellView.viewReset.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx
run 04_check-stories npm run check:stories
run 05_story-coverage npm run check:story-coverage
run 06_design-tokens npm run check:design-tokens:strict
run 07_build-storybook npm run build-storybook
run 08_typecheck npm run typecheck
run 09_lint npm run lint
run 10_build npm run build
run 11_file-integrity npm run check:file-integrity
run 12_mojibake npm run check:mojibake
run 13_backlog-active npm run check:backlog-active
echo DONE > $F/ALLDONE
