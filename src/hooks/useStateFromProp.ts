'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'

/**
 * State that starts from a value and follows it: while `value` stays the same (`Object.is`, the comparison an effect dependency list uses) the state is the caller's own;
 * on the render where `value` changes, the state is set to the new value in that same render, before anything is drawn, so no frame shows the old copy (React: "adjusting
 * state when a prop changes"). It replaces `useEffect(() => setCopy(value), [value])`, which drew the stale copy first (`react-hooks/set-state-in-effect`, Task 953).
 *
 * Use it for the local copy of a list the server sends again after `router.refresh()`; edits made on the copy (optimistic deletes, toggles) stay until the server hands over a new `value`.
 */
export function useStateFromProp<T>(value: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => value)
  const [seen, setSeen] = useState<T>(() => value)
  if (!Object.is(seen, value)) {
    setSeen(() => value)
    setState(() => value)
  }
  return [state, setState]
}

/**
 * Runs `onChange` during the render where `key` differs from the previous render's (`Object.is`), with the previous key. `onChange` sets the state of the calling
 * component back to its starting point (a form reopened, a draft discarded, a search emptied); React redraws that component at once without committing the stale one.
 * It replaces `useEffect(() => { reset() }, [key])` (`react-hooks/set-state-in-effect`, Task 953). The first render never calls it.
 */
export function useResetOnChange<T>(key: T, onChange: (previous: T) => void): void {
  const [seen, setSeen] = useState<T>(() => key)
  if (!Object.is(seen, key)) {
    setSeen(() => key)
    onChange(seen)
  }
}
