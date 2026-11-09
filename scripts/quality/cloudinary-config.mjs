#!/usr/bin/env node
// Read-only check of the LIVE Cloudinary upload configuration (whole-project audit 2026-11-06, findings X-01 and G-01).
// An UNSIGNED upload preset lets anyone who knows its name (it is public: NEXT_PUBLIC_*) post files of any type and size
// into any folder of the account. OWASP File Upload: "only authorised users upload; validate type and size on the
// server; the user does not choose the storage path".
//
// Usage: node scripts/quality/cloudinary-config.mjs [--snapshot <presets.json>]
// Credentials: CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET and NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME from the environment or
// `.env.local`. One GET to the Admin API (`/upload_presets`); nothing is written. The key and the secret never reach the
// output. Exit 0 = no finding, 1 = findings, 2 = the configuration could not be read.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';

/** Every invariant, applied to the preset list of the Admin API. Returns `{ id, object, message }` per violation. */
export function checkPresets(presets, { widgetPreset } = {}) {
  const out = [];
  for (const p of presets ?? []) {
    const name = p.name === widgetPreset && widgetPreset ? 'the preset named by NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET' : `preset ${p.name}`;
    if (p.unsigned) out.push({ id: 'U1', object: name, message: 'unsigned: anyone who knows the name uploads any file into the account; uploads must be signed by the server' });
  }
  if (widgetPreset && !(presets ?? []).some((p) => p.name === widgetPreset)) {
    out.push({ id: 'U2', object: 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', message: 'names a preset that does not exist' });
  }
  return out;
}

export const scrub = (message, secrets) => secrets.filter((s) => s && s.length > 3).reduce((s, x) => s.split(x).join('<hidden>'), String(message));

function readEnv(root) {
  const env = {};
  const file = path.join(root, '.env.local');
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  for (const k of ['CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET']) {
    if (process.env[k]) env[k] = process.env[k];
  }
  return env;
}

async function readLivePresets(env) {
  const { CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: cloud } = env;
  if (!key || !secret || !cloud) throw new Error('CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET and NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME are required');
  if (!/^[a-z0-9_-]+$/i.test(cloud)) throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not a cloud name');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/upload_presets?max_results=500`, {
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`the Admin API answered ${res.status}`);
  const body = await res.json();
  return body.presets ?? [];
}

async function main(argv) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const env = readEnv(root);
  const secrets = [env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET];
  const i = argv.indexOf('--snapshot');
  let presets;
  try {
    presets = i >= 0 ? JSON.parse(readFileSync(argv[i + 1], 'utf8')) : await readLivePresets(env);
  } catch (e) {
    console.error(`cloudinary-config: the configuration could not be read: ${scrub(e?.message ?? e, secrets)}`);
    return 2;
  }
  const findings = checkPresets(presets, { widgetPreset: env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET });
  console.log(`cloudinary-config: ${presets.length} preset(s)`);
  for (const f of findings) console.log(`${f.id} ${f.object}: ${f.message}`);
  console.log(findings.length ? `cloudinary-config: ${findings.length} finding(s)` : 'cloudinary-config: no finding');
  return findings.length ? 1 : 0;
}

if (isEntryPoint(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
