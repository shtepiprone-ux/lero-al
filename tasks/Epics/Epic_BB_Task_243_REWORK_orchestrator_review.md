# Task 243 — Orchestrator review verdict: REWORK REQUIRED (do NOT commit)

> Reviewer: Opus orchestrator · Date: 2026-06-15 · Reviewed against the **real working-tree files**
> (`submitListingInquiry.ts`, `ListingInquiryDialog.tsx`, the session log SQL block), not the session
> log claim alone. HEAD = `728ad42`. Task 243 is uncommitted (backlog = KICKOFF READY).
> **Verdict: NOT APPROVED — 2 hard fails + 1 evidence gap + 2 must-confirm items. No commit emitted.**

Implementation quality is otherwise good: Path A scope respected (no chat/threads/realtime), new
`listing_inquiries` table (not extending `contact_inquiries`), owner email resolved server-side only,
desktop + mobile share one `ListingInquiryDialog` + one `submitListingInquiry` action, gates green
(tsc=0, vitest 597/597, check:i18n parity, build, build-storybook). But the following must be fixed
before re-review.

## 1. HARD FAIL — SQL is not idempotent (AC #1 violated)

The session-log SQL uses bare `CREATE POLICY` for both policies:

```sql
CREATE POLICY "listing_inquiries_admin_all" ...
CREATE POLICY "listing_inquiries_moderator_select" ...
```

`CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` are fine, but Postgres has **no
`CREATE POLICY IF NOT EXISTS`** — re-running this block fails with `policy "..." already exists`.
AC #1 + Arch §1 explicitly required **exact idempotent SQL including RLS policies.** Fix: guard each
policy with `DROP POLICY IF EXISTS` first (or a `DO $$ ... IF NOT EXISTS ... $$` block):

```sql
DROP POLICY IF EXISTS "listing_inquiries_admin_all" ON public.listing_inquiries;
CREATE POLICY "listing_inquiries_admin_all" ON public.listing_inquiries
  FOR ALL TO authenticated
  USING      (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

DROP POLICY IF EXISTS "listing_inquiries_moderator_select" ON public.listing_inquiries;
CREATE POLICY "listing_inquiries_moderator_select" ON public.listing_inquiries
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin','moderator')));
```

## 2. HARD FAIL — `email_transient` closes the dialog (self-invented UX; clause 2 + 5)

`ListingInquiryDialog.tsx:78-82` (real code):

```ts
if (result.error === 'email_transient') {
  toast.warning(t('inquiry_error_email_transient'))
  setOpen(false)   // ← every OTHER error returns without closing; this one closes
  return
}
```

The kickoff §4 says, for **every** error code: *"localized toast … keep dialog open, do not clear."*
The Negative-flow row for `email_transient` says *"toast telling the user to try again; the row
exists."* Nowhere did the kickoff authorise closing the dialog. Sonnet justified it ("row already
persisted, per kickoff") — but that is its **own** interpretation, not a kickoff instruction, and the
clause-2 rule is **STOP and ASK**, not decide.

**Latent tension worth the owner's call (this is why it must not be Sonnet's decision):** the action
inserts the row (`submitListingInquiry.ts:81-89`) *before* sending email and only then returns
`email_transient` (`:109`). So literally obeying the kickoff — "keep dialog open + try again" — would
let the user **re-submit and duplicate the already-persisted inquiry** (no dedup exists). So neither
the kickoff text nor Sonnet's shipped behavior is clean. Owner picks one:

- **(a)** Keep dialog open + "try again" toast (kickoff-literal) — accept the duplicate-row risk, or add a guard.
- **(b)** Close dialog + warning toast (what shipped) — but the "try again" wording then contradicts the close.
- **(c) [recommended]** Treat as success-with-caveat: close + a *non-error* toast like *"Inquiry sent — the
  owner's email notification may be delayed."* Cleanest; needs a copy change in all 4 locales + owner sign-off.

Whichever is chosen, update the dialog handler, the toast key/copy in sq/en/uk/it, the test, and the
session-log Negative-flow + AC rows to match.

## 3. EVIDENCE GAP — rendered matrix incomplete (AC #9 / clause 12)

Two problems, not one:

- **Locale coverage:** the matrix has mobile only for **uk** (320/375/390) and desktop only for **uk**
  + **en**. **`sq` and `it` have ZERO cells at any breakpoint.** Clause 12 / AC #9 require the matrix
  across **sq · en · uk · it** (uk@320/375/390 mandatory — those are present; the other three locales are not).
- **The wrong surface is screenshotted:** every matrix cell describes the *trigger button* ("Надіслати
  повідомлення") in the contact bar. **Not one cell shows the `Dialog` OPEN.** AC #9's core claim is that
  the dialog renders as a **full-width bottom sheet at <640** — there is no rendered proof of the open
  sheet at all. Add cells showing the **open dialog** at uk@320/375/390 plus sq/en/it, confirming
  edge-to-edge full-width, drag handle, ≤90dvh scroll, ≥44px targets, label wrap.

Note for the diff check: `DialogContent className="max-w-sm"` is passed unconditionally — re-confirm
against the canonical `Dialog` primitive that this does **not** leak a 24rem cap below 640 and defeat
the §26 full-bleed bottom sheet (the exact `layout:'centered'` trap that sank Sprint 32). A rendered
open-sheet screenshot at 320 is the only thing that proves it.

## 4. MUST-CONFIRM — dual mobile-bar overlap shipped unfixed (kickoff "STOP and ASK")

The session log documents that **both** mobile bars render simultaneously and visually overlap
(`ListingContact` bar `z-40` over `ListingMobileCTA` `z-30`, both `fixed bottom-14 …`). The kickoff
said: *"if BOTH render, STOP and ASK."* Sonnet proceeded, citing an owner decision ("wire into
`ListingContact`'s bar only; overlap out of scope") that is **not in the kickoff file**. If the owner
really gave that call out-of-band, fine — but please confirm on the record, because a UX where two
fixed bars stack at the same screen position is shipping to phones.

## 5. MINOR — schema-drift follow-up

Adding `listing_inquiries` to `scripts/schema-drift-check.sql` was flagged out-of-scope. Acceptable;
open it as a small follow-up so the new table doesn't read as drift.

## Rework checklist for Sonnet

1. Make the SQL idempotent (DROP POLICY IF EXISTS before each CREATE POLICY).
2. Resolve `email_transient` per the owner's choice (a/b/c above); update handler + 4-locale copy + test + log.
3. Complete the rendered matrix: **open dialog** at sq/en/uk/it, uk@320/375/390 mandatory; prove full-width bottom sheet.
4. Re-run: `npx vitest run src/modules/listings/actions/submitListingInquiry.test.ts` · `npx tsc --noEmit` ·
   `npm run check:i18n` · `npm run check:i18n-dynamic` · `npm run build` · `npm run build-storybook` · matrix capture.
5. Update the session-log AC table + final verdict. Do NOT run git/SQL — orchestrator emits the commit, owner runs SQL.

**No commit will be emitted and `docs/backlog.md` Task 243 stays KICKOFF READY until this rework returns and passes re-review against the real diff.**
