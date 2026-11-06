# Agent Contract

This is the compact contract index. The complete P0 wording has been moved without policy changes to
[`docs/rules/agent-contract/`](rules/agent-contract/), so a role opens the exact invariant it needs instead of a
24 KB file. Existing references to a clause number resolve through this index.

| Need | Read |
|---|---|
| Contract overview | [overview.md](rules/agent-contract/overview.md) |
| P0 1–9: scope, behavior, locale, validation | [p0-01-09-validation.md](rules/agent-contract/p0-01-09-validation.md) |
| P0 9a: fail-closed approval evidence | [p0-09a-approval-evidence.md](rules/agent-contract/p0-09a-approval-evidence.md) |
| P0 9b–15: governance, backlog, rendering, integrity, critical flows | [p0-09b-15-governance-delivery.md](rules/agent-contract/p0-09b-15-governance-delivery.md) |
| P0 16–16c: visual provenance, canonical components and Stories | [p0-16-16c-ui-canonical.md](rules/agent-contract/p0-16-16c-ui-canonical.md) |
| P0 16d: rendered-component census | [p0-16d-surface-census.md](rules/agent-contract/p0-16d-surface-census.md) |
| Mobile adaptation invariant | [GR-3j mobile adaptation](rules/golden/gr-3j-mobile-adaptation.md) and `.claude/rules/shared/mobile-adaptation-contract.md` |
| Roles and routing | [roles-and-routing.md](rules/agent-contract/roles-and-routing.md) |
| “Report is not proof” | report-not-proof.md (`rules/agent-contract/report-not-proof.md`, file no longer exists) |
| Claim-to-evidence invariant | [claim-evidence-contract.md](rules/agent-contract/claim-evidence-contract.md) |

Every role starts with the compact parent in `.claude/skills/`, then reads only the selected contract fragment and
task bundle from `docs/rule-index.md`. Visible UI always requires P0 16–16d and the shared token/Story contract.
