/**
 * Putting a person's text into a PostgREST filter safely (Task 923 Revision 7, finding S8).
 *
 * `.or('name.ilike.%john%,last_name.ilike.%john%')` is a STRING the database interprets: a comma starts another condition, parentheses group, a dot separates
 * the operator. A search text such as `x,role.eq.admin` or `a),and(id.neq.0` therefore changes the query instead of being searched for. Two defences, both here:
 *  - `escapeLike` makes `%`, `_` and the backslash literal in a LIKE / ILIKE pattern (otherwise the person's `%` matches everything);
 *  - `quoteFilterValue` wraps a value in double quotes (escaping the quote and the backslash), the PostgREST form that keeps `, ( ) .` inside the value.
 * `ilikeContains(term)` is the combination for the common "contains" search: it yields the quoted pattern `"%term%"`.
 */
const BACKSLASH = String.fromCharCode(92)

export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => BACKSLASH + c)
}

export function quoteFilterValue(value: string): string {
  return `"${value.replace(/[\\"]/g, (c) => BACKSLASH + c)}"`
}

export function ilikeContains(term: string): string {
  return quoteFilterValue(`%${escapeLike(term)}%`)
}

/**
 * The `.or(...)` string for "any of these columns contains the term" (a person's search box), with the term kept a value.
 * Example: `orContains(['name', 'phone'], 'ann')` -> `name.ilike."%ann%",phone.ilike."%ann%"`.
 */
export function orContains(columns: readonly string[], term: string): string {
  return columns.map((c) => `${c}.ilike.${ilikeContains(term)}`).join(',')
}
