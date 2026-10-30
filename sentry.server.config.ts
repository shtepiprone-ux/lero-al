// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent, scrubSentryLog } from "./src/lib/security/sentryScrub";

Sentry.init({
  dsn: "https://7fcf7dd0859713c0b1f918d49bb3366b@o4511243338973184.ingest.de.sentry.io/4511243349131344",

  // Credentials never leave in a report (Task 923 Revision 7, finding S57; R66 (j)): cookies, authorization headers, request bodies and the one-time tokens in addresses are
  // removed, the application's own data (extra, contexts, exception values, spans, breadcrumbs) is walked at any depth, and logs are scrubbed too.
  beforeSend: (event) => scrubSentryEvent(event),
  beforeSendTransaction: (event) => scrubSentryEvent(event),
  beforeSendLog: (log) => scrubSentryLog(log),

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Default PII (request headers, cookies, the IP address) is NOT sent (Task 923 R66 (j)); it used to be on, and the cookies carry the session tokens.
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false,
});
