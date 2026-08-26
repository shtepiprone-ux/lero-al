import { extractMantineThemeNames } from 'file:///C:/Claude_Code_Projects/lero-al/scripts/check-tailwind-runtime-tokens.mjs';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// AC6 case A: theme file missing entirely.
const missing = extractMantineThemeNames('C:/Claude_Code_Projects/lero-al/src/design-system/mantine/does-not-exist.ts');
console.log('AC6 case A (missing theme.ts):', JSON.stringify(missing));

// AC6 case B: theme file exists but its extracted set has no proof key (no --button-padding-x).
const dir = mkdtempSync(join(tmpdir(), 'ac6-probe-'));
const stubPath = join(dir, 'theme.ts');
writeFileSync(stubPath, `
export const theme = {
  components: {
    Progress: {
      vars: () => ({ root: { '--progress-size': '1rem' } }),
    },
  },
};
`, 'utf8');
const noProofKey = extractMantineThemeNames(stubPath);
console.log('AC6 case B (set without proof key):', JSON.stringify(noProofKey));
