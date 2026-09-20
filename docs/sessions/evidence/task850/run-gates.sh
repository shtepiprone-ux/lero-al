cd /c/Claude_Code_Projects/lero-al
E=docs/sessions/evidence/task850
run() { name=$1; shift; "$@" > $E/$name.log 2>&1; echo "EXIT_CODE=$?" >> $E/$name.log; }
run g-typecheck npm.cmd run typecheck
run g-lint npm.cmd run lint
run g-test-850 npm.cmd run test -- src/modules/listings/actions/__tests__/contactEvents.test.ts
run g-test-listings npm.cmd run test:listings
run g-test-rls npm.cmd run test:rls-guards
run g-census node.exe scripts/check-surface-census-changed.mjs --base HEAD
run g-build npm.cmd run build
run g-integrity npm.cmd run check:file-integrity
run g-mojibake npm.cmd run check:mojibake
echo ALLDONE > $E/gates.done
