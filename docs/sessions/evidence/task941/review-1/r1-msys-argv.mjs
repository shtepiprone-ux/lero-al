#!/usr/bin/env node
// Task 941 review 1, fifth self-check (Opus reviewer, 2026-11-02): how an MSYS program (Git for Windows usr/bin, the
// same runtime as its sed.exe) receives arguments that Windows PowerShell 5.1 passes to it.
// Usage (repo root): node docs/sessions/evidence/task941/review-1/r1-msys-argv.mjs
// Runs printf.exe '[%s]' <arguments> through powershell.exe inside a fresh temporary folder that holds the files `-i`
// and `x.txt`; prints each PowerShell argument text and the argv the MSYS program received. Nothing in the repository
// is written.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync as save } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const forms = [
  "'*'", "'?.txt'", "'[-]i'", "'{-i,x}'", "'{-i}'", "'~'",
  `'a" -i "b'`, `"a' -i 'b"`, `"a'b" "c'd"`, `"x'" y "'"`, `'a"b' 'c"d'`, `'a" -i"'`, `'"-i"'`, `"'-i'"`,
  "'* x'", 'a,-i', `"a'" "b c" "'"`, `'a b"' ' -i'`, `"a'" '-' "i'"`, `"'" b "'-i"`,
  // Sixth self-check (same day): PowerShell's comma array operator in argument mode.
  'x,y', "x,'-i'", "'x','-i'", "'x',-i", 'x.txt,-i', '1p,-i', "x , '-i'",
  // PowerShell reads '' inside single quotes as one quote character; Bash reads it as an empty quoted span.
  "'a''b'", "'-n''' '1p'''", "'a''' x '''b'", "'a'' -i '''",
];
const dir = mkdtempSync(join(tmpdir(), 'r941-msys-'));
const lines = [`PowerShell ${execFileSync('powershell.exe', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.ToString()'], { encoding: 'utf8' }).trim()}; node ${process.version}; files in folder: -i, x.txt`];
try {
  save(join(dir, '-i'), '');
  save(join(dir, 'x.txt'), '');
  for (const form of forms) {
    const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `printf.exe '[%s]' ${form}`], { cwd: dir, encoding: 'utf8' });
    lines.push(`${form} -> ${out.trim()}`);
  }
} finally { rmSync(dir, { recursive: true, force: true }); }
console.log(lines.join('\n'));
