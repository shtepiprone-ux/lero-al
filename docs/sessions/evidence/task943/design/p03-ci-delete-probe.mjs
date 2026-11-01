// Task 943 design probe (Opus designer, 2026-11-01): CI refuses a deleted policy file outside every governance scope.
// Uses the real validateDiff on a temporary fixture root where the listed hook file does not exist (a deletion).
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const { validateDiff } = await import(new URL('../../../../../scripts/workflow-gates/cli.mjs', import.meta.url).href);
const root = mkdtempSync(join(tmpdir(), 'task943-ci-'));
try {
  mkdirSync(join(root, 'scripts/workflow-gates'), { recursive: true });
  mkdirSync(join(root, 'tasks'), { recursive: true });
  const result = validateDiff(root, ['scripts/workflow-gates/security-hook.mjs'], { phase: 'verify' });
  const text = `platform ${process.platform}; node ${process.version}\nvalidateDiff errors for a deleted hook file: ${JSON.stringify(result.errors)}\n`;
  process.stdout.write(text);
  writeFileSync(join(here, 'p03-ci-delete-probe.txt'), text);
} finally { rmSync(root, { recursive: true, force: true }); }
