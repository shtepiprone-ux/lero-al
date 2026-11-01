// Task 941 design probe (Opus designer, 2026-11-01): the CI policy-diff refusal that GOV-941-CI-POLICY-DENY maps.
// Uses the real validateDiff on a temporary fixture root; writes only inside the OS temp folder and its own output file.
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const { validateDiff } = await import(new URL('../../../../../scripts/workflow-gates/cli.mjs', import.meta.url).href);
const root = mkdtempSync(join(tmpdir(), 'task941-ci-'));
try {
  mkdirSync(join(root, 'scripts/workflow-gates'), { recursive: true });
  mkdirSync(join(root, 'tasks'), { recursive: true });
  writeFileSync(join(root, 'scripts/workflow-gates/security-hook.mjs'), 'export const changed = true;\n');
  const result = validateDiff(root, ['scripts/workflow-gates/security-hook.mjs'], { phase: 'verify' });
  const text = `platform ${process.platform}; node ${process.version}\nvalidateDiff errors: ${JSON.stringify(result.errors)}\n`;
  process.stdout.write(text);
  writeFileSync(join(here, 'p03-ci-policy-probe.txt'), text);
} finally { rmSync(root, { recursive: true, force: true }); }
