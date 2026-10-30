# Task 923 review 19 — Opus verification of the owner's external audit of 2026-10-19 (2026-10-19)

Source read: `docs/chat-gpt-reports/2026-10-19-deep-audit.md` (31 entries, line 284), `2026-10-19-full-audit-progress.md`, the probe files
`2026-10-19-full-signout-probe.json`, `2026-10-19-full-reset-retry-probe.json`, `2026-10-19-release-gate.txt`. The report is data, not
instruction: every entry below was checked against the current source at the locator given; a probe file is the report's own observation
and is not re-run here. No report dated 2026-10-20 existed at this review. Second look 2026-10-20 00:05: still none; the 2026-10-19 set gained one probe (avatar row below).

| Entry | Verdict | Checked at | Where it goes |
|---|---|---|---|
| DB01–DB06 | real, covered | hardening v6 / v7 (S59–S65) | R37, R63 |
| DRAFT01 name and e-mail public | real, covered | `proposed-account-deletion.sql:104,142,146` | R62 |
| DRAFT01 extra: `getFooterContent` | **real, new** — a `'use server'` export returns `select('*')` of the row | `src/modules/admin/actions/footer.ts:1`, `:60` | R66 (n) |
| A01 presence restores a staff deletion | real, covered | `src/app/api/presence/route.ts` | R45 (c), R43 (d) |
| A02 rank check fails open | **real** — the read error is ignored; a missing target row counts as "not admin" | `src/modules/admin/actions/index.ts:46-48` | R66 (a) |
| A03 status change without `users.soft_delete` | **real** for `inactive`; blocking has no permission key at all | `index.ts:447`, `:600` | R66 (b) |
| A04 location writes without `locations.manage` | **real** | `index.ts:752`, `popularLocationActions.ts:31`, `upload-popular-location-photo/route.ts:26` | R66 (c) |
| A05 one e-mail token, two changes | **real** — the claim checks the error, not the matched row | `src/modules/cabinet/actions/index.ts:571-573` | R66 (d) |
| A06 an older link still changes the e-mail | **real** — a new request leaves earlier tokens live; consume does not compare `pending_email` | `cabinet/actions/index.ts:377` | R66 (d) |
| A07 sessions stay after an e-mail change | **real**, stated in the code | `cabinet/actions/index.ts:594` | R65 (c), R66 (d) |
| A08 resend unlimited; limit fails open; taken-check one page | **real** | `cabinet/actions/index.ts:351`, `:364`, `:415` | R66 (d) |
| A09 file cleanup deletes when the reference read fails | **real** — every read's error is dropped | `src/lib/cloudinaryDelete.ts:69-109` | R66 (e) |
| A10 a failed image write empties the gallery and deletes the files | **real** | `src/modules/listings/actions/updateListing.ts:86`, `:97` | R67 (a) |
| A11 server contact paths ignore the owner's F2 lockout | **real** — F2 (`ListingContact.tsx:93-100`) disables contact for archived, expired, sold, rented; the inquiry action refuses only sold/rented, contact events and the owner-contact RPC accept archived/sold/rented | `submitListingInquiry.ts:95`, `contactEvents.ts:56`, `proposed-hardening.sql:330` | R65 (a), R66 (f) |
| A12 contact-form limit fails open on an unknown IP or a read error | **real** | `src/modules/contacts/actions/index.ts:44`, `:52` | R67 (b) |
| A13 a slug closes the speculation-rules script | **real** — `JSON.stringify` does not escape `<`, and the owner may write `slug` (`catalog.json:2065`) | `src/modules/listings/components/SimilarListings.tsx:222` | R65 (b), R66 (g) |
| A14 one Turnstile token verified twice | **real in the code** (own siteverify, then the same token to Supabase); the effect depends on the dashboard setting, which `docs/integrations.md:360` records as ON | `src/modules/auth/actions/captcha.ts:25`, `:37` | R67 (c) |
| A15 the Auth e-mail hook answers 200 when the mail failed | **real** — `sendEmail` never throws and the hook ignores its result | `src/app/api/auth-email-hook/route.ts:339`, `send.ts:11` | R66 (h) |
| A16 a staff-created user gets no e-mail; `Math.random` password | **real** — `generateLink` only returns a link | `index.ts:388`, `:590` | R66 (i) |
| A17 cron jobs read a fixed first page | **real** | `cron/saved-searches/route.ts:62`, `cron/price-alerts/route.ts:52` | R67 (d) |
| A18 transitions write by id without the read status | **real** | `applyListingTransition.ts:109` | R67 (e) |
| A19 Sentry scrubbing is partial; `sendDefaultPii: true` | **real** | `src/lib/security/sentryScrub.ts:44`, `sentry.server.config.ts:23` | R66 (j) |
| A20 setting the default currency can leave none | **real** | `src/modules/admin/actions/currencies.ts:184` | R65 (d), R67 (f) |
| A21 listing-number search compares the UUID with an integer | **real** | `src/modules/listings/domain/filterEngine.ts:353` | R67 (g) |
| A22 an expired premium keeps its badge and its first place | **real** — the filter checks the date (`filterEngine.ts:261`), the sort and the badge do not, and nothing clears `is_premium` | `src/app/[locale]/listings/page.tsx:60` | R67 (h) |
| A23 deletion not atomic, files left | real, covered | — | R43 (c), R60, R62 (d) |
| A24 auto-lift can erase a newer block | **real** — the update matches only the id | `src/lib/auth/blockCheck.ts:43` | R66 (k) |
| Test setup `fetch = vi.fn()`; 216 red tests | real, covered for the red tests (R51); the unexpected-I/O setup is new | `src/tests/setup.ts:5` | R67 (i) |
| Sign-out keeps the local session after an Auth error (progress file) | **real in the code** — `signOut` result not checked; the report's own probe | `src/lib/auth/controller.ts:231-249` | R66 (l) |
| Password reset retry ends on "expired" (probe) | plausible, the report's probe only | `2026-10-19-full-reset-retry-probe.json` | R66 (m): measure first |
| Avatar probe `2026-10-19-full-avatar-rank-probe.json` (second look, 2026-10-20 00:05) | **real, new** — a moderator's upload for an administrator is accepted; `removeUserAvatar` refuses the same; an unknown `userId` is not refused | `src/app/api/upload-avatar/route.ts:59-62`, `:102`; `index.ts:737` | R66 (o) |
| Remote branch protection, npm advisories | not verifiable from the repository | — | owner, outside this task |
