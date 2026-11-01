// Tasks 937/939/942 design probe: does editing a candidate path change the review scope digest of a
// reviewed contract that every PR #12 diff selects (Task 923 D8/D9 through release-blockers S59-S62, and
// Task 935 which is new in PR #12)? Uses the canonical scopeDigest of the committed contract.mjs with an
// in-memory override; nothing is written. Usage: node p01-reviewed-scope-membership.mjs <repo root>
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const { scopeDigest, isRuntimeFile } = await import(pathToFileURL(`${root}/scripts/workflow-gates/contract.mjs`));
const contracts = [
  'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json',
  'tasks/Archive/Sprint_92_kickoff_prompt_Task_935_Governance_Changes_Get_An_Independent_Approval.security.json',
];
const candidates = [
  // Task 937 (product)
  'docs/sessions/evidence/task923/review-67/rv67-46-squash-paths.nul',
  'docs/sessions/evidence/task923/r33-13a-mojibake.txt',
  'docs/sessions/evidence/task927/base/unit-base-failures.txt',
  'scripts/mojibake-allowlist.json',
  'src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx',
  'scripts/enrolled-tailwind-baseline.json',
  'src/components/shared/Map.module.css',
  'src/design-system/mantine/input-chrome.css',
  'src/modules/cabinet/components/CabinetEmailChangeSectionView.tsx',
  // Task 942 (governance)
  'scripts/check-listing-visibility.mjs',
  // Task 939 (product)
  '.storybook/main.ts',
  '.storybook/stubs/supabase-client.ts',
  'src/stories/mantine/primitives/FavoritesShell.stories.tsx',
  'src/stories/patterns/mantine/DashboardPeriodControl.stories.tsx',
];
for (const file of contracts) {
  const c = JSON.parse(readFileSync(`${root}/${file}`, 'utf8'));
  const now = scopeDigest(root, c);
  console.log(`== ${file} (stage ${c.stage})`);
  for (const p of candidates) {
    const before = existsSync(`${root}/${p}`) ? readFileSync(`${root}/${p}`, 'utf8') : '';
    const changed = scopeDigest(root, c, new Map([[p, `${before}\n// probe edit\n`]])) !== now;
    console.log(`   ${changed ? 'IN SCOPE ' : 'outside  '} ${isRuntimeFile(p) ? 'runtime ' : ''}${p}`);
  }
}
