import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Ignore quoted/fenced examples when reading response status and workflow fields.
export function plainResponseLines(text) {
  if (typeof text !== 'string') return [];
  const lines = text.split(/\r?\n/);
  const plain = [];
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const marker = lines[i].match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
    } else if (marker) fence = marker[1];
    else if (!/^\s*>/.test(lines[i])) plain.push({ index: i, text: lines[i].trim() });
  }
  return plain;
}

export function hasGitHandoff(text) {
  const commands = text.replace(/`[ \t]*\r?\n/g, ' ');
  return /^[ \t]*(?:&[ \t]+)?(?:git(?:\.exe)?|"git(?:\.exe)?"|'git(?:\.exe)?')(?:[ \t]+\S+)*[ \t]+(?:add|commit|push)\b/im.test(commands);
}

// Shared by both Stop hooks. This classifies an incomplete report, never task readiness.
export function blockedResponse(text) {
  if (typeof text !== 'string') return { isBlocked: false, errors: [] };
  const lines = text.split(/\r?\n/);
  const last = lines.findLastIndex(line => line.trim());
  const plain = plainResponseLines(text);
  const isBlocked = plain.some(line => line.index === last && line.text === 'BLOCKED');
  if (!isBlocked) return { isBlocked: false, errors: [] };
  const completion = plain.some(line => /^(?:APPROVED(?: WITH NOTES)?|IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW)$/.test(line.text));
  const nextRoute = plain.some(line => line.text.startsWith('NEXT EXECUTOR CONTRACT:'));
  return { isBlocked: true, errors: completion || hasGitHandoff(text) || nextRoute
    ? ['BLOCKED cannot accompany approval, implementation completion, an executor route, or a Git handoff.'] : [] };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const input = JSON.parse(readFileSync(0, 'utf8').replace(/^\uFEFF/, ''));
    if (typeof input?.text !== 'string') throw new Error('Missing response text');
    console.log(JSON.stringify(blockedResponse(input.text)));
  } catch {
    console.error('Response state could not be classified safely.');
    process.exitCode = 2;
  }
}
