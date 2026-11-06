/**
 * Parses settlement_list.txt and generates supabase/seed-locations.sql
 * Run: node scripts/import-locations.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const input = fs.readFileSync(path.join(__dirname, '..', 'settlement_list.txt'), 'utf8')

// Fix trailing commas (non-standard JSON)
const fixed = input
  .replace(/,(\s*\})/g, '$1')
  .replace(/,(\s*\])/g, '$1')

const settlements = JSON.parse(fixed)

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/ë/g, 'e').replace(/ç/g, 'c').replace(/ä/g, 'a')
    .replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/â/g, 'a')
    .replace(/î/g, 'i').replace(/û/g, 'u').replace(/ê/g, 'e')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function esc(str) {
  return str.replace(/'/g, "''")
}

const counties = settlements.filter(s => s.type === 'county')
const cities = settlements.filter(s => s.type === 'city')
const villages = settlements.filter(s => s.type === 'village')

const lines = []
lines.push('-- Auto-generated from settlement_list.txt')
lines.push('-- Run in Supabase SQL editor')
lines.push('')
// Deduplicate by slug within each group
function dedup(arr) {
  const seen = new Set()
  return arr.filter(item => {
    const s = slugify(item.value)
    if (seen.has(s)) return false
    seen.add(s)
    return true
  })
}

const uniqueCounties = dedup(counties)
const uniqueCities = dedup(cities)
const uniqueVillages = dedup(villages)

lines.push('-- 1. Regions (counties)')
lines.push('INSERT INTO locations (name_al, name_en, slug, type) VALUES')
const countyRows = uniqueCounties.map((c, i) => {
  const comma = i < uniqueCounties.length - 1 ? ',' : ''
  return `  ('${esc(c.value)}', '${esc(c.value)}', '${slugify(c.value)}', 'region')${comma}`
})
lines.push(...countyRows)
lines.push('ON CONFLICT (slug) DO NOTHING;')
lines.push('')

lines.push('-- 2. Cities')
lines.push('INSERT INTO locations (name_al, name_en, slug, type) VALUES')
const cityRows = uniqueCities.map((c, i) => {
  const comma = i < uniqueCities.length - 1 ? ',' : ''
  return `  ('${esc(c.value)}', '${esc(c.value)}', '${slugify(c.value)}', 'city')${comma}`
})
lines.push(...cityRows)
lines.push('ON CONFLICT (slug) DO NOTHING;')
lines.push('')

lines.push('-- 3. Villages (format: "Village - ParentCity")')
lines.push('INSERT INTO locations (name_al, name_en, slug, type) VALUES')
const villageRows = uniqueVillages.map((v, i) => {
  const comma = i < uniqueVillages.length - 1 ? ',' : ''
  return `  ('${esc(v.value)}', '${esc(v.value)}', '${slugify(v.value)}', 'village')${comma}`
})
lines.push(...villageRows)
lines.push('ON CONFLICT (slug) DO NOTHING;')
lines.push('')

const output = lines.join('\n')
const outPath = path.join(__dirname, '..', 'supabase', 'seed-locations.sql')
fs.writeFileSync(outPath, output, 'utf8')
console.log(`Generated: ${outPath}`)
console.log(`Counties: ${counties.length}, Cities: ${cities.length}, Villages: ${villages.length}`)
