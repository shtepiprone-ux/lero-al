## What "report is not proof" means

The executor's report is an index, not evidence. Approval requires inspecting the actual changed files, the real
diff, and the validation artifacts required by the selected QA profile. A review is proof-carrying: for every
P0/P1 acceptance criterion, the reviewer records the producing source path/symbol, the artifact or command actually
inspected, and the observed result. A causal claim, an assertion that a branch is the only path, or an attribution
such as "not caused by this diff" is `VERIFIED` only after a concrete counter-check; otherwise label it
`INFERENCE` or `UNKNOWN`.

An unmet, changed, or unverified primary acceptance criterion blocks `APPROVED` and `APPROVED WITH NOTES`. A planned
follow-up is not evidence and does not repair the reviewed task's status. Before deciding, the reviewer must make an
adversarial pass that tries to falsify every material conclusion against the complete relevant function, producing
artifact, and failure-path evidence.
