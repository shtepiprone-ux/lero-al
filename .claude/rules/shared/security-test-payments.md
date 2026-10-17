# Payment and premium-entitlement security cases

Read for any task touching checkout, prices, payment data, webhooks, refunds or paid premium activation, together
with [the parent contract](security-testing.md), [quality rules](security-test-quality.md) and applicable
[boundary cases](security-test-boundaries.md). Do not treat this rule as evidence a payment integration already
exists. Opus must inspect the actual provider, schema and workflow before specifying implementation or commands.

## Authority and deterministic fixtures

Record the actual payment state transitions, entitlement owner, plan, duration, currency, permitted refund/dispute
behavior, provider API version and sandbox account. Unresolved product decisions block task publication; Sonnet
does not invent financial rules. Prices use the project's chosen exact representation and currency-specific units;
test rounding and boundary values without assuming every currency has two decimal places.

Use schema-valid synthetic A/B accounts, separate listings/orders and provider sandbox fixtures. Never use real
card details, customer transactions or live charges as test fixtures. Test adapters must be unable to create a
live charge or delete unrelated provider resources when given an ambiguous environment.

## Mandatory cases

| Case family | Required assertions |
|---|---|
| Frontend request | A can request checkout for an eligible owned listing; no raw card/CVV or unrelated private fields in application requests, URLs, telemetry or storage. Hostile returned URLs cannot redirect to an unapproved origin. |
| Tampering | Browser-modified amount, currency, plan, duration, discount, owner, listing ID and premium flags cannot alter authoritative price/eligibility or grant access. Server uses trusted catalogue/order data; test exact amount and target. |
| Cross-account access | B cannot create/attach/cancel/refund/read A's order or use A's checkout reference to activate B's listing. Public status responses expose only the approved fields. |
| Forged success | A fabricated success URL/query, client callback, public action or manually supplied paid flag never grants entitlement. Test allowed authenticated return-page behavior separately. |
| Signed notification | Use the real signature library and actual raw-body transport. Missing/wrong/stale signature, changed bytes, wrong account/environment and malformed payload produce no entitlement or forbidden write. A valid control succeeds. |
| Trusted settlement | Valid signature alone is insufficient: verify authoritative settled state, expected order, amount, currency, account and owner before entitlement. Pending, failed, canceled or mismatched payments cannot activate premium. |
| Duplicate/replay | Sequential and concurrent duplicate notifications cannot create duplicate charges, fulfillments or premium extensions. Distinct provider event IDs for one business payment also cannot fulfill it twice. Verify persistent state after process restart. |
| Ordering and delay | Out-of-order, retried and delayed genuine events converge to the correct authoritative state. Checkout expiry and signature freshness are separate rules; a delayed legitimate settlement follows explicit reconciliation behavior. |
| Partial failure | Provider timeout after acceptance, DB failure before/after entitlement, retry and worker crash cannot lose a settled order or double-grant premium. Acknowledgement follows durable acceptance and documented provider retry semantics. |
| Idempotent checkout | The same scoped retry key/payload has one intended effect; a different payload or actor cannot reuse it to alter another order. Test timeout recovery using actual adapter/DB contracts. |
| Reversal/expiry | Refund, partial refund, dispute, chargeback and entitlement expiry follow the approved state model, with no unauthorized reinstatement by an old event. Correct final state is asserted in DB and frontend consumer. |
| Privacy/operations | Raw credentials, authorization headers, provider bodies and unnecessary billing/PII never enter public DTOs, Sentry, analytics or CI artifacts. Preserve safe event/outcome/correlation diagnostics. |

Unit tests cover exact arithmetic, authorization and transition rules. Real database tests cover constraints,
atomicity and durable idempotency. HTTP/browser tests cover the actual checkout consumer, webhook raw body and
return URL behavior. Provider sandbox contract tests validate the chosen API/signature assumptions. One mocked
webhook handler cannot substitute for all layers.

For each payment authorization/settlement/idempotency protection, require the quality contract's baseline-pass,
deliberate-break-fail and restored-pass sequence. Specify which invariant the mutation challenges; replacing a
real signature verifier with an always-true mock in the only signature test is prohibited.

Sources checked 2026-10-17:
[OWASP payment integration](https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Payment_Gateway_Integration_Cheat_Sheet.html),
[Stripe webhook behavior](https://docs.stripe.com/webhooks),
[Stripe idempotency behavior](https://docs.stripe.com/api/idempotent_requests).
Stripe is a reference for documented delivery/retry hazards, not a selection of this project's provider. Once a
provider is selected, its current official documentation governs the exact signature/API/event contract.
