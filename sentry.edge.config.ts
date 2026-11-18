// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { SENTRY_DATA_COLLECTION, scrubSentryEvent, scrubSentryLog, scrubSentrySpan } from "./src/lib/security/sentryScrub";

Sentry.init({
  dsn: "https://7fcf7dd0859713c0b1f918d49bb3366b@o4511243338973184.ingest.de.sentry.io/4511243349131344",

  // Credentials never leave in a report (Task 923 Revision 7, finding S57; R66 (j)): cookies, authorization headers, request bodies and the one-time tokens in addresses are
  // removed, the application's own data (extra, contexts, exception values, spans, breadcrumbs) is walked at any depth, and logs and streamed spans are scrubbed too.
  // Sentry 11 streams spans and ignores `beforeSendTransaction` then (deprecated, "will be removed in v12"); `beforeSendSpan` is the hook (Task 987 Revision 1, MIGRATION.md "Replacing `beforeSendTransaction`").
  beforeSend: (event) => scrubSentryEvent(event),
  beforeSendSpan: (span) => scrubSentrySpan(span),
  beforeSendLog: (log) => scrubSentryLog(log),

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Default PII is NOT collected (Task 923 R66 (j)); it used to be on, and the cookies carry the session tokens. `dataCollection` (SENTRY_DATA_COLLECTION in sentryScrub.ts) collects
  // request and response headers except those its denylist names, and no cookies, request bodies, user info or IP address; the scrubber removes the credential headers from events and spans.
  // Sentry 11 removed `sendDefaultPii` (MIGRATION.md "Removed APIs"), so the v10 baseline is set with `dataCollection` (Task 987); `enableLogs` was removed too, logs need no option.
  // https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection
  dataCollection: SENTRY_DATA_COLLECTION,
});
