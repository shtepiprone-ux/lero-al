#!/bin/bash
cd /c/Claude_Code_Projects/lero-al
E=docs/sessions/evidence/task912
run() { name="$1"; shift; "$@" > "$E/r1-$name.txt" 2>&1; echo "EXIT_CODE=$?" >> "$E/r1-$name.txt"; echo "$name $(tail -1 $E/r1-$name.txt)" >> $E/r1-summary.txt; }
: > $E/r1-summary.txt
run platform node.exe -p process.platform
run nodever node.exe -v
run vitest npx.cmd vitest run src/design-system/mantine/patterns/__tests__/MantineListingContactPattern.smoke.test.tsx src/modules/listings/components/__tests__/ListingCard.smoke.test.tsx src/modules/listings/components/__tests__/ListingDetailView.favorite.test.tsx
run typecheck npm.cmd run typecheck
run lint npm.cmd run lint
run design-tokens npm.cmd run check:design-tokens
run story-coverage npm.cmd run check:story-coverage
run mojibake npm.cmd run check:mojibake
run build npm.cmd run build
run build-storybook npm.cmd run build-storybook
echo DONE >> $E/r1-summary.txt
