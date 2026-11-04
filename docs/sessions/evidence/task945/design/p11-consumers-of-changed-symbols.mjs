// Task 945 design: every reader of what this task changes, for the affected-path manifest. Read-only.
// Run from the project root: node docs/sessions/evidence/task945/design/p11-consumers-of-changed-symbols.mjs
import { spawnSync } from 'node:child_process';

const grep = (name, pattern, ...paths) => {
  const run = spawnSync('git', ['grep', '-n', '-E', pattern, '--', ...paths], { encoding: 'utf8', maxBuffer: 1 << 26 });
  const lines = run.stdout.split('\n').filter(Boolean);
  console.log(`## ${name}: ${lines.length} lines`);
  for (const line of lines.slice(0, 30)) console.log(`  ${line.slice(0, 150)}`);
};
grep('validateSettings', 'validateSettings', 'scripts', '.claude', '.github');
grep('readers of ownedFiles', 'ownedFiles', 'scripts', '.github');
grep('readers of the settings file', "settings\\.json", 'scripts', '.github', '.claude/hooks');
grep('readers of the workflow-gates rule by content', 'workflow-gates\\.md', 'scripts');
grep('readers of the task-readiness rule by content', 'task-readiness', 'scripts');
grep('SubagentStop or PostToolUse anywhere in code', 'SubagentStop|PostToolUse', 'scripts', '.claude/hooks', '.claude/settings.json', '.github');
grep('readers of CLAUDE.md', 'CLAUDE\\.md', 'scripts', '.claude/hooks', '.github');
