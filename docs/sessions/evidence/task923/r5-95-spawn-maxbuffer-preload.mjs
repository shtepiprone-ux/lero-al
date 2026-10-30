// Task 923 Revision 4 - diagnostic preload, NOT a change to scripts/check-mojibake.mjs.
// Used as: node --import ./docs/sessions/evidence/task923/r5-95-spawn-maxbuffer-preload.mjs scripts/check-mojibake.mjs
// scripts/check-mojibake.mjs calls spawnSync('git', ['ls-files', ...]) with the default 1 MiB maxBuffer; the file list is now
// larger than 1 MiB (r5-95-probe-enobuf.txt: status null, ENOBUFS, stdout 1050626 bytes), so the script throws
// "git ls-files failed". This preload only raises maxBuffer for that call so the script's own scan logic runs unchanged.
// syncBuiltinESMExports() is required: the script imports the named export, which is bound before this patch otherwise.
import cp from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';

const orig = cp.spawnSync;
cp.spawnSync = (cmd, args, opts = {}) => orig(cmd, args, { ...opts, maxBuffer: 64 * 1024 * 1024 });
syncBuiltinESMExports();
