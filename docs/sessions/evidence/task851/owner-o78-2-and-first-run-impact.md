# Task 851 — owner-native returns (O78-2 + first-run impact grid), 2026-09-20

Recorded by Opus during the Task 851 implementation review, from the owner's returned output.
This is the AC4 owner half and the §5 `STOP — OWNER DECISION REQUIRED` answer. Source: owner, in review chat.

## Vercel (O78-2)

| Question | Owner's answer |
|---|---|
| `CRON_SECRET` set for Production? | **Yes** — exists, marked sensitive, scope **Production and Preview**. |
| Cron Jobs state | **Disabled** (all four). |
| Production branch / deploy trigger | **`main`**; every commit to `main` creates a **Production Deployment**. Auto-assign custom production domains: Enabled. |
| View Logs for the four cron paths | **Empty** — no invocations in the available retention window; **no `405` and no `200`** to read. |

**Consequence.** O78-2 is answered but does **not** confirm §3's 405 `INFERENCE`: with the crons **Disabled**, Vercel
sent no requests at all, so the absence of log rows is explained by the disabled schedule and cannot distinguish a
405 from a never-sent request. The 405 claim stays `UNKNOWN` and is now moot — the missing `GET` export and the
disabled schedule are two independent reasons the jobs have not run, and this task fixes only the first.

## Supabase — `scripts/task-851-first-run-impact.sql` grid (owner-run, read-only)

| Job | What | Owner's count |
|---|---|---|
| listings-expiry | active + `expires_at < now()` → expired | **0** |
| listings-expiry | active + `expires_at IS NULL` (reported only) | **0** |
| inactivity | users past 365 days → soft-delete + archive + final email | **0** |
| inactivity | active listings those users own | **0** |
| inactivity | users 91–365 days, never warned → warning email | **0** |
| saved-searches | `notify_email = true` and due | **0** |
| saved-searches | of those, never checked | **0** |
| price-alerts | favorite pairs on non-archived listings | **7** |
| price-alerts | pairs with no alert row → silent baseline insert, no notification | **7** |
| price-alerts | pairs whose price changed → in-app notification + email | **0** |

**Blast radius of the first real run, from this snapshot:** 7 rows inserted into `favorite_price_alerts` as silent
baselines and **zero** emails, notifications, soft-deletes or listing mutations. Traced to
`src/app/api/cron/price-alerts/route.ts:102-113`: an unseen pair pushes a `baselineUpserts` row, increments
`baseline`, and `continue`s before any notification or email path. Rows 8 and 9 being equal (7 = 7) also means no
`favorite_price_alerts` row exists yet, so the route's `lastPrice === undefined` branch is the only one that fires.

## Owner decision, 2026-09-20 (quoted)

> За цим snapshot дозволяється увімкнути всі чотири разом після повторного схвалення.
> Cron залишаються Disabled до цього схвалення.

("On this snapshot, enabling all four together is permitted after re-approval. The crons stay Disabled until that
approval.")

**Sequencing this fixes:** commit + push to `main` deploys Production, but with the crons **Disabled** the deploy
runs no job. Enabling the four cron jobs in the Vercel dashboard is the separate, owner-owned act that starts them,
and it is authorized by the decision above once this review is approved. `CRON_SECRET` being set for Production
means the fail-closed helper will not block the owner's manual `POST` triggers after deploy either.
