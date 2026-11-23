#!/usr/bin/env node
// Read-only check of the LIVE Cloudinary upload configuration (whole-project audit 2026-11-06, findings X-01 and G-01).
// An UNSIGNED upload preset lets anyone who knows its name (it is public: NEXT_PUBLIC_*) post files of any type and size
// into any folder of the account. OWASP File Upload: "only authorised users upload; validate type and size on the
// server; the user does not choose the storage path".
// Task 957 (AC10): U3 — the preset named by CLOUDINARY_LISTING_PRESET, with which the server signs every listing photo,
// exists, is signed, allows only jpg, jpeg, png and webp (OWASP File Upload: "List allowed extensions") and bounds the
// stored size with an incoming transformation ("Upload presets don't support a per-preset file size limit",
// cloudinary.com/documentation/upload_presets). U4 — every Cloudinary address the database stores names an asset that
// exists: on 2026-11-18 a console folder deletion left account #3's `avatar_url` on a deleted file and nothing said so.
//
// Usage: node --env-file=.env.local scripts/quality/cloudinary-config.mjs [--snapshot <presets.json>]
// Credentials: CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and, for U4,
// NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment only (Node's `--env-file` loads them; the
// tool reads no credential file itself, owner decision O963-1, Task 963 Revision 1). Only GET requests: the
// Admin API (`/upload_presets`, `/resources/image/upload` by public id) and PostgREST selects; nothing is written. No
// key, secret or row content reaches the output: a U4 finding names the column, the row id and the public id.
// `--snapshot` judges a saved preset list (U1-U3) and does not read the database (U4 is then reported as not checked).
// Exit 0 = no finding, 1 = findings, 2 = the configuration could not be read.
import { readFileSync } from 'node:fs';
import { isEntryPoint } from '../lib/entry-point.mjs';

const LISTING_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
// the bound the owner's listing preset uses (`c_limit,w_2560,h_2560`, Admin API `/upload_presets` read 2026-11-20); another
// crop mode is refused until it is read and added here
const BOUNDING_CROPS = ['limit'];

/** The `{ crop, width, height }` of each component of a preset's incoming transformation (a string or the API's objects). */
function transformationParts(transformation) {
  if (Array.isArray(transformation)) return transformation.map((t) => ({ crop: t?.crop, width: t?.width, height: t?.height }));
  if (typeof transformation !== 'string' || transformation === '') return [];
  return transformation.split('/').map((component) => {
    const part = {};
    for (const param of component.split(',')) {
      const m = /^([a-z]+)_(.+)$/.exec(param.trim());
      if (m?.[1] === 'c') part.crop = m[2];
      if (m?.[1] === 'w') part.width = m[2];
      if (m?.[1] === 'h') part.height = m[2];
    }
    return part;
  });
}

/** Why the listing preset would accept a format or a size it should not; empty when it holds (U3). */
function listingPresetProblems(preset) {
  const out = [];
  if (preset.unsigned) out.push('is unsigned; listing photos are signed by the server only');
  const formats = String(preset.settings?.allowed_formats ?? '').split(',').map((f) => f.trim().toLowerCase()).filter(Boolean);
  if (formats.length === 0) out.push(`allows any format; allowed formats are ${LISTING_FORMATS.join(', ')}`);
  else if (formats.some((f) => !LISTING_FORMATS.includes(f))) out.push(`allows ${formats.filter((f) => !LISTING_FORMATS.includes(f)).join(', ')}; allowed formats are ${LISTING_FORMATS.join(', ')}`);
  const bounded = transformationParts(preset.settings?.transformation)
    .some((p) => BOUNDING_CROPS.includes(String(p.crop)) && Number(p.width) > 0 && Number(p.height) > 0);
  if (!bounded) out.push(`has no incoming transformation that bounds the stored size (c_${BOUNDING_CROPS.join(' or c_')} with a width and a height)`);
  return out;
}

/** Every invariant, applied to the preset list of the Admin API. Returns `{ id, object, message }` per violation. */
export function checkPresets(presets, { widgetPreset, listingPreset, requireListingPreset = false } = {}) {
  const out = [];
  for (const p of presets ?? []) {
    const name = p.name === widgetPreset && widgetPreset ? 'the preset named by NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET' : `preset ${p.name}`;
    if (p.unsigned) out.push({ id: 'U1', object: name, message: 'unsigned: anyone who knows the name uploads any file into the account; uploads must be signed by the server' });
  }
  if (widgetPreset && !(presets ?? []).some((p) => p.name === widgetPreset)) {
    out.push({ id: 'U2', object: 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', message: 'names a preset that does not exist' });
  }
  if (listingPreset) {
    const preset = (presets ?? []).find((p) => p.name === listingPreset);
    if (!preset) out.push({ id: 'U3', object: 'CLOUDINARY_LISTING_PRESET', message: 'names a preset that does not exist; the signature route signs listing photos with it' });
    else for (const message of listingPresetProblems(preset)) out.push({ id: 'U3', object: `the preset named by CLOUDINARY_LISTING_PRESET (${preset.name})`, message });
  } else if (requireListingPreset) {
    out.push({ id: 'U3', object: 'CLOUDINARY_LISTING_PRESET', message: 'is not set; the signature route cannot sign a listing photo without it' });
  }
  return out;
}

/**
 * The public id of a Cloudinary delivery address of this cloud, as `publicIdFromUrl` (`src/lib/cloudinaryUpload.ts:133`) derives
 * it: https on res.cloudinary.com only; the leading version and transformation segments and the file extension are dropped.
 */
export function publicIdOf(url, cloud) {
  let parsed;
  try { parsed = new URL(String(url ?? '')); } catch { return null; }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') return null;
  const prefix = `/${cloud}/image/upload/`;
  if (!parsed.pathname.startsWith(prefix)) return null;
  const segments = parsed.pathname.slice(prefix.length).split('/').filter(Boolean);
  while (segments.length > 1 && (/^v\d+$/.test(segments[0]) || segments[0].includes(','))) segments.shift();
  if (segments.length === 0) return null;
  segments[segments.length - 1] = segments[segments.length - 1].replace(/\.[A-Za-z0-9]{2,5}$/, '');
  try { return segments.map((s) => decodeURIComponent(s)).join('/') || null; } catch { return null; }
}

/** Every Cloudinary delivery address in a value: a text (HTML included), a JSON document or a list. */
export function cloudinaryAddresses(value) {
  if (value === null || value === undefined) return [];
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.match(/https:\/\/res\.cloudinary\.com\/[^\s"'<>()\\]+/g) ?? [];
}

/** U4: each `{ column, row, url }` whose asset is not among the existing public ids. */
export function checkReferences(references, existing, cloud) {
  const out = [];
  for (const ref of references) {
    const id = publicIdOf(ref.url, cloud);
    if (id && !existing.has(id)) out.push({ id: 'U4', object: `${ref.column} row ${ref.row}`, message: `names ${id}, which is not an asset of the account` });
  }
  return out;
}

export const scrub = (message, secrets) => secrets.filter((s) => s && s.length > 3).reduce((s, x) => s.split(x).join('<hidden>'), String(message));

const NAMES = ['CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'CLOUDINARY_LISTING_PRESET', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

function readEnv() {
  const env = {};
  for (const k of NAMES) {
    if (process.env[k]) env[k] = process.env[k];
  }
  return env;
}

function cloudOf(env) {
  const { CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: cloud } = env;
  if (!key || !secret || !cloud) throw new Error('CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET and NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME are required');
  if (!/^[a-z0-9_-]+$/i.test(cloud)) throw new Error('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not a cloud name');
  return { cloud, authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` };
}

async function adminGet(env, pathAndQuery) {
  const { cloud, authorization } = cloudOf(env);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}${pathAndQuery}`, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`the Admin API answered ${res.status}`);
  return res.json();
}

async function readLivePresets(env) {
  const body = await adminGet(env, '/upload_presets?max_results=500');
  return body.presets ?? [];
}

// The columns `deleteAsset` checks before it deletes an asset (`src/lib/cloudinaryDelete.ts:96-111`): the same set of places a stored file is used.
const REFERENCE_COLUMNS = [
  ['listing_images', 'id', 'url'], ['users', 'id', 'avatar_url'], ['users', 'id', 'company_logo_url'], ['companies', 'id', 'logo_url'],
  ['locations', 'id', 'image_url'], ['site_settings', 'key', 'value'], ['pages', 'id', 'content'],
];
const PAGE = 1000;

/** Every `{ column, row, url }` of a Cloudinary address in the reference columns (PostgREST selects with the service key, paged). */
async function readReferences(env) {
  const base = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for U4');
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(base)) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not a hosted Supabase project');
  const out = [];
  for (const [table, idColumn, column] of REFERENCE_COLUMNS) {
    for (let from = 0; ; from += PAGE) {
      const url = `${base.replace(/\/$/, '')}/rest/v1/${table}?select=${idColumn},${column}&${column}=not.is.null&order=${idColumn}`;
      const res = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + PAGE - 1}` }, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`the database answered ${res.status} for ${table}.${column}`);
      const rows = await res.json();
      for (const row of rows) for (const address of cloudinaryAddresses(row[column])) out.push({ column: `${table}.${column}`, row: String(row[idColumn]), url: address });
      if (rows.length < PAGE) break;
    }
  }
  return out;
}

/** The public ids among `ids` that exist as image uploads of the account (Admin API, 100 per request). */
async function readExisting(env, ids) {
  const existing = new Set();
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += 100) {
    const query = unique.slice(i, i + 100).map((id) => `public_ids[]=${encodeURIComponent(id)}`).join('&');
    const body = await adminGet(env, `/resources/image/upload?max_results=100&${query}`);
    for (const r of body.resources ?? []) existing.add(r.public_id);
  }
  return existing;
}

async function main(argv) {
  const env = readEnv();
  const secrets = [env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET, env.SUPABASE_SERVICE_ROLE_KEY];
  const i = argv.indexOf('--snapshot');
  let presets;
  let references = null;
  let existing = null;
  try {
    if (i >= 0) presets = JSON.parse(readFileSync(argv[i + 1], 'utf8'));
    else {
      presets = await readLivePresets(env);
      references = await readReferences(env);
      existing = await readExisting(env, references.map((r) => publicIdOf(r.url, env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)).filter(Boolean));
    }
  } catch (e) {
    console.error(`cloudinary-config: the configuration could not be read: ${scrub(e?.message ?? e, secrets)}`);
    return 2;
  }
  const findings = [
    ...checkPresets(presets, { widgetPreset: env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET, listingPreset: env.CLOUDINARY_LISTING_PRESET, requireListingPreset: i < 0 }),
    ...(references ? checkReferences(references, existing, env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) : []),
  ];
  console.log(`cloudinary-config: ${presets.length} preset(s)`);
  console.log(references ? `cloudinary-config: ${references.length} stored Cloudinary address(es) checked` : 'cloudinary-config: U4 not checked (--snapshot reads no database)');
  for (const f of findings) console.log(`${f.id} ${f.object}: ${f.message}`);
  console.log(findings.length ? `cloudinary-config: ${findings.length} finding(s)` : 'cloudinary-config: no finding');
  return findings.length ? 1 : 0;
}

if (isEntryPoint(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
