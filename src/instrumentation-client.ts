// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent, scrubSentryLog } from "@/lib/security/sentryScrub";


Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Credentials never leave in a report (Task 923 Revision 7, finding S57; R66 (j)): cookies, authorization headers, request bodies and the one-time tokens in addresses are
  // removed, the application's own data (extra, contexts, exception values, spans, breadcrumbs) is walked at any depth, and logs are scrubbed too.
  beforeSend: (event) => scrubSentryEvent(event),
  beforeSendTransaction: (event) => scrubSentryEvent(event),
  beforeSendLog: (log) => scrubSentryLog(log),
  tracesSampleRate: 1,
  enableLogs: true,
  // default PII is NOT sent (Task 923 R66 (j))
  sendDefaultPii: false,
});


export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
