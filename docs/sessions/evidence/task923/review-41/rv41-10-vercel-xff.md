# Task 923 Review 41: who sets x-forwarded-for on Vercel

Opus, 2026-10-23. This file checks the executor's open point: an automated review rated the per-IP source "medium", because the first entry of `x-forwarded-for` can be client-controlled.

- **Source.** Vercel's documentation, searched through the Vercel MCP tool `search_vercel_documentation` (index: Context7).
- **Page.** https://vercel.com/docs/headers/request-headers
- **Excerpt** (quoted as returned):

Vercel overwrites this header by default to prevent IP spoofing.

A second excerpt, from https://vercel.com/docs/llms-full.txt (quoted as returned):

External IPs are not forwarded by default to prevent IP spoofing.

**Consequence.** On the Vercel deployment, the first entry of `x-forwarded-for` is the address Vercel saw, so a client cannot choose its bucket. Two limits follow:
- This holds only behind Vercel. A local `npm run dev` passes the header through, but nobody needs to sidestep a limit there.
- The finding does not apply to production. No change is needed for R126 or for the message limit (C1142).
