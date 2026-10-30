'use client'

import { useEffect } from 'react'
import { Center, Loader } from '@mantine/core'
import { GOOGLE_SIGN_IN_CHANNEL, GOOGLE_SIGN_IN_MESSAGE_TYPE } from '@/lib/auth/googlePopup'

/**
 * Hands Google's answer to the window that asked (Task 927 Amendment 10, owner decision D25). Google returns the sign-in window here with the answer in the address fragment:
 * `id_token` and `state`, or `error` and `state`. On mount it reads them, removes the fragment from the address, posts the answer to the opening window (to this origin only) and on
 * a `BroadcastChannel` (the opener is cut if Google's pages ever enforce their opener policy), and closes the window.
 * The state is the opener's proof that the answer belongs to its attempt; an answer without one is posted to nobody. The token is written to no console and no storage.
 */
export function GoogleCallbackRelay() {
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const state = fragment.get('state')
    const idToken = fragment.get('id_token')
    const error = fragment.get('error')
    history.replaceState(null, '', window.location.pathname)

    if (state) {
      const message = error
        ? { type: GOOGLE_SIGN_IN_MESSAGE_TYPE, state, error }
        : idToken
          ? { type: GOOGLE_SIGN_IN_MESSAGE_TYPE, state, credential: idToken }
          : null
      if (message) {
        window.opener?.postMessage(message, window.location.origin)
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel(GOOGLE_SIGN_IN_CHANNEL)
          channel.postMessage(message)
          channel.close()
        }
      }
    }
    window.close()
  }, [])

  return (
    <Center>
      <Loader />
    </Center>
  )
}
