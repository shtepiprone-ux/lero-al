// Tasks 1044, 1046: the Cloudflare Email Worker `lero-email-inbound` (Workers Free; the owner deploys it by pasting this file, see the task plan).
// Cloudflare Email Routing runs it for support@ and sales@ after its own SPF, DKIM and DMARC checks. It streams the raw message, never read into memory, through a
// FixedLengthStream into the private mail bucket under `inbound/<uuid>.eml`, then posts only that key to the Vercel route with the shared secret and the envelope
// addresses, and rejects the mail when the route did not store it, so the sending server tells the sender; the key is then deleted. No dependency, no retry, no buffer.
// Bindings: INBOUND_BUCKET (the R2 bucket `lero-inbound-mail`, private, its `inbound/` objects deleted after 1 day). Variables: INBOUND_URL (the route),
// INBOUND_EMAIL_SECRET (a Worker secret, the same value as on Vercel). Only the answer's status is ever logged.
const MAX_MESSAGE_BYTES = 26214400

const worker = {
  async email(message, env) {
    if (message.rawSize > MAX_MESSAGE_BYTES) {
      message.setReject('Message too large: the limit is 25 MB')
      return
    }
    const key = `inbound/${crypto.randomUUID()}.eml`
    let status = 0
    try {
      const { readable, writable } = new FixedLengthStream(message.rawSize)
      await Promise.all([message.raw.pipeTo(writable), env.INBOUND_BUCKET.put(key, readable)])
      const response = await fetch(env.INBOUND_URL, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.INBOUND_EMAIL_SECRET}`,
          'content-type': 'application/json',
          'x-envelope-from': message.from,
          'x-envelope-to': message.to,
        },
        body: JSON.stringify({ key }),
        // a redirect is an answer, never followed: the secret goes to INBOUND_URL only, and a moved route rejects the mail instead of losing it
        redirect: 'manual',
      })
      status = response.status
    } catch {
      status = 0
    }
    console.log('inbound status', status)
    if (status < 200 || status > 299) {
      try {
        await env.INBOUND_BUCKET.delete(key)
      } catch {
        // ignored: the bucket's lifecycle rule deletes what is left under inbound/ after 1 day
      }
      message.setReject('Temporary failure: please send the message again later')
    }
  },
}

export default worker
