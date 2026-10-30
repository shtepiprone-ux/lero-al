/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Shared helper: reads .env.local WITHOUT printing it, connects with pg, and scrubs connection details from anything it prints.
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

function loadEnv() {
  const text = fs.readFileSync('C:/Claude_Code_Projects/lero-al/.env.local', 'utf8')
  const env = {}
  for (const line of text.split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}
const env = loadEnv()
const secrets = [env.DATABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.NEXT_PUBLIC_SUPABASE_ANON_KEY].filter(Boolean)
try {
  const u = new URL(env.DATABASE_URL)
  secrets.push(u.hostname, decodeURIComponent(u.password), u.username)
} catch {}
function scrub(s) {
  let out = String(s)
  for (const x of secrets) if (x && x.length > 3) out = out.split(x).join('<hidden>')
  return out
}
async function connect() {
  const cu = new URL(env.DATABASE_URL); for (const k of ["sslmode","ssl","sslrootcert"]) cu.searchParams.delete(k)
  const c = new Client({ connectionString: cu.toString(), ssl: { rejectUnauthorized: true, ca: fs.readFileSync('C:/Claude_Code_Projects/lero-al/prod-ca-2021.crt', 'utf8') }, connectionTimeoutMillis: 15000 })
  await c.connect()
  return c
}
module.exports = { env, scrub, connect }
