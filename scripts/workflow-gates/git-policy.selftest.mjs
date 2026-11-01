import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const windows = process.platform === 'win32';
function denied(command, extra = {}) {
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', resolve('.claude/hooks/block-mutating-git.ps1')], {
    input: JSON.stringify({ tool_input: { command }, ...extra }), encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout ? JSON.parse(result.stdout).hookSpecificOutput?.permissionDecision === 'deny' : false;
}
test('[GOV-935-HOOK-GIT-WRITE-DENY] A read-only repository subcommand with an output-file write is refused', { skip: !windows }, () => {
  for (const command of ['git diff --output=owned.txt', 'git log --output owned.txt', 'git show --ext-diff', 'git hash-object -wt file.txt']) assert.equal(denied(command), true, command);
});
test('Git policy rejects dynamic and literal interpreter-based Git mutation', { skip: !windows }, () => {
  for (const command of ["$g='git'; & $g push origin main", 'node -e "require(\'node:child_process\').execSync(\'git push origin main\')"', 'cmd /c "git push origin main"', 'git -c alias.ship=push ship']) assert.equal(denied(command), true, command);
});
test('Git policy permits ordinary inspection and source searches, with missing optional metadata', { skip: !windows }, () => {
  for (const command of ['git --no-optional-locks status --short', 'git diff --stat HEAD', 'git remote -v', 'git ls-remote origin refs/heads/main', 'rg "git push" .claude', 'node scripts/workflow-gates/prepush.mjs']) assert.equal(denied(command), false, command);
  assert.equal(denied(''), true);
});
