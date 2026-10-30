/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */
// Task 923 R100 (R78 (a)): removes the messages that only the deleted exchange-providers screen used, from the four message files.
// Kept: admin.currency.providers.is_enabled and .status_disabled (the badge tone family `provider` of badgeTones.ts still names them; Opus removes that family and these two keys).
// Run once: node docs/sessions/evidence/task923/r28-10-trim-currency-messages.cjs <project root>
const fs = require('node:fs')
const path = require('node:path')

const root = process.argv[2]
const REMOVE_PROVIDER_KEYS = ['new', 'name', 'endpoint', 'api_key', 'api_key_placeholder', 'refresh_interval', 'priority', 'mode', 'mode_auto', 'mode_manual', 'mode_hybrid',
  'notes', 'save', 'cancel', 'edit', 'delete', 'enable', 'disable', 'empty', 'error_name_required', 'error_endpoint_required', 'success_created', 'success_updated',
  'success_deleted', 'success_enabled', 'success_disabled', 'delete_confirm']
const KEEP_PROVIDER_KEYS = ['is_enabled', 'status_disabled']

for (const locale of ['en', 'sq', 'uk', 'it']) {
  const file = path.join(root, 'messages', `${locale}.json`)
  const raw = fs.readFileSync(file, 'utf8')
  const eol = raw.includes('\r\n') ? '\r\n' : '\n'
  const lines = raw.split(eol)
  const before = JSON.parse(raw)

  const keyOf = (line) => { const m = /^\s*"([^"]+)":/.exec(line); return m ? m[1] : null }
  const out = []
  let inCurrency = false, inProviders = false, providersKept = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // the `currency` block of `admin`: 4-space indent key
    if (/^ {4}"currency": \{$/.test(line)) inCurrency = true
    if (inCurrency && /^ {6}"providers": \{$/.test(line)) { inProviders = true; out.push(line); continue }
    if (inCurrency && !inProviders && (/^ {6}"tab_currencies":/.test(line) || /^ {6}"tab_providers":/.test(line))) continue
    if (inProviders) {
      if (/^ {6}\}$/.test(line)) {
        // closing brace of providers: the last kept line must not end with a comma
        const last = out[out.length - 1]
        out[out.length - 1] = last.replace(/,\s*$/, '')
        inProviders = false; inCurrency = false
        out.push(line); continue
      }
      const key = keyOf(line)
      if (KEEP_PROVIDER_KEYS.includes(key)) { out.push(line); providersKept++; continue }
      if (REMOVE_PROVIDER_KEYS.includes(key)) continue
      throw new Error(`${locale}: unexpected key in providers: ${key}`)
    }
    out.push(line)
  }
  if (providersKept !== KEEP_PROVIDER_KEYS.length) throw new Error(`${locale}: kept ${providersKept} provider keys`)
  const text = out.join(eol)
  const after = JSON.parse(text)
  // only the intended keys differ
  const cur = after.admin.currency
  if ('tab_currencies' in cur || 'tab_providers' in cur) throw new Error(`${locale}: tab keys remain`)
  if (Object.keys(cur.providers).sort().join() !== [...KEEP_PROVIDER_KEYS].sort().join()) throw new Error(`${locale}: providers keys differ`)
  const strip = (o) => { const c = JSON.parse(JSON.stringify(o)); delete c.admin.currency.tab_currencies; delete c.admin.currency.tab_providers; c.admin.currency.providers = {}; return c }
  if (JSON.stringify(strip(before)) !== JSON.stringify(strip(after))) throw new Error(`${locale}: something else changed`)
  fs.writeFileSync(file, text)
  console.log(`${locale}: ok (${lines.length} -> ${out.length} lines)`)
}
