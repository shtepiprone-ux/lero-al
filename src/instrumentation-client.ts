// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { GOOGLE_IDENTITY_SCRIPT_URL } from "@/lib/auth/googleIdentity";
import { SENTRY_DATA_COLLECTION, scrubSentryEvent, scrubSentryLog, scrubSentrySpan } from "@/lib/security/sentryScrub";

// Task 987 R1-6 (Sentry issue LERO-AL-2J): an error thrown inside Google's One Tap script (`GOOGLE_IDENTITY_SCRIPT_URL`) is Google's, not ours. The Next.js client rewrites every frame
// address to `app://<path>` (`clientNormalizationIntegration.js`, "Turn `<origin>/<path>/_next/static/...` into `app:///_next/static/...`"), so the script's frames read `app:///gsi/client`
// and count as "In App". `denyUrls` would look at the innermost frame only and drop an error that our code called into the script; this checks every frame.
const GOOGLE_SCRIPT_ADDRESSES = [`app://${new URL(GOOGLE_IDENTITY_SCRIPT_URL).pathname}`, GOOGLE_IDENTITY_SCRIPT_URL];

function isGoogleScriptFrame(filename: unknown): boolean {
  return typeof filename === "string" && GOOGLE_SCRIPT_ADDRESSES.some((address) => filename === address || filename.startsWith(`${address}?`) || filename.startsWith(`${address}#`));
}

/** `true` when the event is an error with at least one stack frame and every frame of it, in every exception value, lies in Google's script */
function isGoogleIdentityScriptError(event: { exception?: { values?: { stacktrace?: { frames?: { filename?: string }[] } }[] } }): boolean {
  const frames = (event.exception?.values ?? []).flatMap((value) => value.stacktrace?.frames ?? []);
  return frames.length > 0 && frames.every((frame) => isGoogleScriptFrame(frame.filename));
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Credentials never leave in a report (Task 923 Revision 7, finding S57; R66 (j)): cookies, authorization headers, request bodies and the one-time tokens in addresses are
  // removed, the application's own data (extra, contexts, exception values, spans, breadcrumbs) is walked at any depth, and logs and streamed spans are scrubbed too.
  // Sentry 11 streams spans and ignores `beforeSendTransaction` then (deprecated, "will be removed in v12"); `beforeSendSpan` is the hook (Task 987 Revision 1, MIGRATION.md "Replacing `beforeSendTransaction`").
  beforeSend: (event) => (isGoogleIdentityScriptError(event) ? null : scrubSentryEvent(event)),
  beforeSendSpan: (span) => scrubSentrySpan(span),
  beforeSendLog: (log) => scrubSentryLog(log),
  tracesSampleRate: 1,
  // default PII is NOT collected (Task 923 R66 (j)); Sentry 11 removed `sendDefaultPii` and `enableLogs` (MIGRATION.md "Removed APIs"), so the v10 baseline is set with `dataCollection` (Task 987):
  // it collects request and response headers except those its denylist names, and no cookies, request bodies, user info or IP address; the scrubber removes the credential headers from events and spans
  dataCollection: SENTRY_DATA_COLLECTION,
});


export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
