/**
 * One dashboard block's outcome — Task 847 (shared with 848).
 *
 * A block either carries its data or says why it has none. A failed query is `ok: false`; it is
 * never rendered as `0` (spec v3.3 §4, §11). Blocks fail independently of one another.
 */

export type BlockError = 'query_failed' | 'data_inconsistent'

export type BlockResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: BlockError }

export function blockOk<T>(data: T): BlockResult<T> {
  return { ok: true, data }
}

export function blockFail(error: BlockError): BlockResult<never> {
  return { ok: false, error }
}
