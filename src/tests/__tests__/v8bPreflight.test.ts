// @vitest-environment node
/**
 * Task 956 Revision 5, F30 / AC19: the preflight stops only on what would fail or leave broken data. An active listing whose expiry has passed is what the one public rule
 * (D72) hides on purpose, so row 8 counts only `expires_at is null` and the lapsed ones are the informational row 16. These tests read the text of the two SQL files.
 */
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), 'supabase/sql_migrations/task956', file), 'utf8')
const preflight = read('v8b-preflight.sql')
const rows = preflight.split('\n').filter((line) => !line.trimStart().startsWith('--')).join(' ').replace(/\s+/g, ' ')
/** the text of one row: from its `select <n>,` to the next `union all select` or the end of the statement */
const row = (n: number) => new RegExp(`select ${n}, (.+?)(?= union all select |\\) checks)`).exec(rows)?.[1] ?? ''
const header = (text: string) => text.split('\n').slice(0, 4).join(' ').replace(/\s+/g, ' ')

describe('F30 / AC19: the preflight stops only on what would fail or leave broken data', () => {
  it('row 8 counts only active listings with no expiry (a stop row), not the lapsed ones', () => {
    expect(row(8)).toContain('expires_at is null')
    expect(row(8)).not.toMatch(/expires_at\s*<=\s*now\(\)/)
  })

  it('row 16 counts active listings whose expiry has passed and is named informational', () => {
    expect(row(16)).toMatch(/status = 'active'::public\.listing_status and expires_at <= now\(\)/)
    expect(row(16)).toContain('informational')
  })

  it.each([['v8b-preflight.sql', preflight], ['v8b.sql', read('v8b.sql')]])('the header of %s names rows 15 and 16 as informational', (_name, text) => {
    expect(header(text)).toMatch(/rows? 15 and 16/i)
    expect(header(text)).toContain('informational')
  })
})
