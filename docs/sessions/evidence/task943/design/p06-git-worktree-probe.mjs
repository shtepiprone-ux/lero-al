// Task 943 revision 1 self-audit (Opus, 2026-11-02): can the hook tell "inside a Git work tree" from "not a repository"
// from "Git could not run", and see whether a path is tracked at HEAD? Runs Git read-only on the project root and creates
// one throwaway repository under the OS temporary folder (removed at the end). Usage: node <this file>
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
function probe(cwd, args, bin = 'git') {
  try { return `exit 0: ${String(execFileSync(bin, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })).trim() || '(no output)'}`; }
  catch (error) { return error.code === 'ENOENT' ? 'spawn error ENOENT' : `exit ${error.status}: ${String(error.stderr || '').trim().split('\n')[0]}`; }
}
const plain = mkdtempSync(join(tmpdir(), 'lero-943-plain-'));
const repo = mkdtempSync(join(tmpdir(), 'lero-943-repo-'));
try {
  console.log(`project root, rev-parse --is-inside-work-tree: ${probe(ROOT, ['rev-parse', '--is-inside-work-tree'])}`);
  console.log(`project root, cat-file -e HEAD:<tracked 943 sidecar>: ${probe(ROOT, ['cat-file', '-e', 'HEAD:tasks/Sprints/Sprint_92_kickoff_prompt_Task_943_File_Mutating_Commands_Are_Writes.security.json'])}`);
  console.log(`project root, cat-file -e HEAD:<untracked path>: ${probe(ROOT, ['cat-file', '-e', 'HEAD:tasks/Sprints/not_a_real.security.json'])}`);
  console.log(`plain tmp folder, rev-parse --is-inside-work-tree: ${probe(plain, ['rev-parse', '--is-inside-work-tree'])}`);
  console.log(`missing binary: ${probe(plain, ['--version'], 'git-binary-that-does-not-exist')}`);
  const savedPath = process.env.PATH; const savedPathW = process.env.Path;
  process.env.PATH = ''; if (savedPathW !== undefined) process.env.Path = '';
  try { console.log(`git with an empty PATH: ${probe(ROOT, ['cat-file', '-e', 'HEAD:package.json'])}`); }
  finally { process.env.PATH = savedPath; if (savedPathW !== undefined) process.env.Path = savedPathW; }
  execFileSync('git', ['init', '-q'], { cwd: repo });
  mkdirSync(join(repo, 'tasks'));
  writeFileSync(join(repo, 'tasks/a.security.json'), '{}\n');
  execFileSync('git', ['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.test', 'add', 'tasks/a.security.json'], { cwd: repo });
  execFileSync('git', ['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.test', 'commit', '-q', '-m', 'fixture'], { cwd: repo });
  writeFileSync(join(repo, 'tasks/b.security.json'), '{}\n');
  console.log(`fixture repo, tracked a: ${probe(repo, ['cat-file', '-e', 'HEAD:tasks/a.security.json'])}`);
  console.log(`fixture repo, untracked b: ${probe(repo, ['cat-file', '-e', 'HEAD:tasks/b.security.json'])}`);
} finally { rmSync(plain, { recursive: true, force: true }); rmSync(repo, { recursive: true, force: true }); }
