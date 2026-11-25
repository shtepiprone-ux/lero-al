// Task 1044: the Cloudflare Email Worker `lero-email-inbound` (Workers Free; the owner deploys it by pasting this file, see the task plan).
// Cloudflare Email Routing runs it for support@ and sales@ after its own SPF, DKIM and DMARC checks. It hands the raw message to the Vercel route with the shared
// secret and the envelope addresses, and rejects the mail when the route did not store it, so the sending server tells the sender. No dependency, no retry, no buffer.
// Variables: INBOUND_URL (the route), INBOUND_EMAIL_SECRET (a Worker secret, the same value as on Vercel). Only the answer's status is ever logged.
const MAX_MESSAGE_BYTES = 4194304

const worker = {
  async email(message, env) {
    if (message.rawSize > MAX_MESSAGE_BYTES) {
      message.setReject('Message too large: the limit is 4 MB')
      return
    }
    let status = 0
    try {
      const raw = await new Response(message.raw).arrayBuffer()
      const response = await fetch(env.INBOUND_URL, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.INBOUND_EMAIL_SECRET}`,
          'content-type': 'message/rfc822',
          'x-envelope-from': message.from,
          'x-envelope-to': message.to,
        },
        body: raw,
        // a redirect is an answer, never followed: the secret goes to INBOUND_URL only, and a moved route rejects the mail instead of losing it
        redirect: 'manual',
      })
      status = response.status
    } catch {
      status = 0
    }
    console.log('inbound status', status)
    if (status < 200 || status > 299) message.setReject('Temporary failure: please send the message again later')
  },
}

export default worker
