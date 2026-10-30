# Reference research gate (GR-7)

**Opus precedence, owner decision 2026-10-20:** first apply `canonical-component-reuse.md` and inspect ready Mantine
components/Stories. Covered canonical design is inherited without a fresh external audit, measurement, or GR-7
audit receipt. The research requirements below apply to uncovered decisions/reproduced defects; scope mixed tasks
accordingly. A ready component is not an excuse to skip evidence of changed task behavior or integration.

Before task design, implementation, or review can rely on a UI/reference claim, complete the current-session GR-7
audit. Start with `docs/research/references/<newest date>/`, then live-check every relied-on page for change.

For each standing reference and any owner-provided URL: resolve the entry point; inventory accessible first-party and
supporting routes; inspect relevant pages in depth; operate relevant workflow states; retain page-level evidence; and
map the chosen pattern to lero.al data, permissions, and routes. Record inaccessible pages exactly as `UNVERIFIED`;
they cannot support a decision. A screenshot, landing page, previous session, or summary is insufficient.

Standing references: Lahomes, Kamr (demo login), Omah, and TailAdmin. Save role-specific evidence under the task's
session evidence directory and emit the exact GR-7 receipt. If evidence contradicts a kickoff or prior claim, emit
the required GR-7 retraction and restart the affected preflight. Detailed mandatory coverage remains in
`docs/golden-rules.md` GR-7.

For a visible responsive/adaptive decision, this standing product-reference audit is not sufficient. Also inspect the
applicable primary source in `shared/mobile-adaptation-contract.md`: W3C Reflow, Apple HIG Layout, and Android Adapt
layouts are the default basis. Record the source URL, literal guidance, selected pattern ID, and why the product
surface fits it. Inherited ready adaptations follow the Opus exception above; a newly selected pattern needs this basis.
